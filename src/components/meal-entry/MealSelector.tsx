'use client'

import { useState, useEffect } from 'react'
import { Plus, ChevronLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getMeals, createMeal } from '@/lib/firestore'
import { SearchInput } from '@/components/ui/SearchInput'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { PlaceTypeIcon } from '@/components/places/PlaceTypeIcon'
import type { Place, MealItem, MealCategory } from '@/types'
import { formatCalories } from '@/lib/utils'

interface MealSelectorProps {
  place: Place
  onSelect: (meal: MealItem) => void
  onBack: () => void
}

const mealCategories: { value: MealCategory; label: string }[] = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'SNACK', label: 'Snack' },
  { value: 'DRINK', label: 'Drink' },
  { value: 'DESSERT', label: 'Dessert' },
  { value: 'OTHER', label: 'Other' },
]

export function MealSelector({ place, onSelect, onBack }: MealSelectorProps) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [meals, setMeals] = useState<MealItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newMeal, setNewMeal] = useState({
    name: '',
    defaultCalories: '',
    category: 'OTHER' as MealCategory,
    placeSpecific: true,
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (user) {
      fetchMeals()
    }
  }, [user, search, place.id])

  const fetchMeals = async () => {
    if (!user) return

    try {
      const data = await getMeals(user.uid, {
        searchTerm: search || undefined,
        placeId: place.id,
      })
      setMeals(data)
    } catch (error) {
      console.error('Failed to fetch meals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newMeal.name.trim() || !user) return

    setCreating(true)
    try {
      const meal = await createMeal(user.uid, {
        name: newMeal.name,
        defaultCalories: newMeal.defaultCalories ? parseInt(newMeal.defaultCalories) : undefined,
        category: newMeal.category,
        placeId: newMeal.placeSpecific ? place.id : undefined,
      })
      setShowCreate(false)
      setNewMeal({ name: '', defaultCalories: '', category: 'OTHER', placeSpecific: true })
      onSelect(meal)
    } catch (error) {
      console.error('Failed to create meal:', error)
    } finally {
      setCreating(false)
    }
  }

  const filteredMeals = meals.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  // Separate place-specific meals from generic meals
  const placeMeals = filteredMeals.filter((m) => m.placeId === place.id)
  const genericMeals = filteredMeals.filter((m) => m.placeId !== place.id)

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 bg-white sticky top-0">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>
        <h2 className="text-lg font-semibold">What did you eat?</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
          <PlaceTypeIcon type={place.type as any} className="w-4 h-4" />
          at {place.name}
        </div>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search meals..."
          className="mt-3"
        />
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : (
          <>
            {/* Meals eaten at this place */}
            {placeMeals.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 font-medium">
                  Eaten at {place.name}
                </p>
                {placeMeals.map((meal) => (
                  <Card
                    key={meal.id}
                    variant="interactive"
                    onClick={() => onSelect(meal)}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{meal.name}</div>
                      {meal.usageCount > 0 && (
                        <div className="text-sm text-gray-500">
                          {meal.usageCount}x logged
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatCalories(meal.defaultCalories)}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* All other meals */}
            {genericMeals.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 font-medium">All meals</p>
                {genericMeals.map((meal) => (
                  <Card
                    key={meal.id}
                    variant="interactive"
                    onClick={() => onSelect(meal)}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{meal.name}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatCalories(meal.defaultCalories)}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {filteredMeals.length === 0 && search && (
              <div className="text-center text-gray-500 py-8">
                No meals found for "{search}"
              </div>
            )}

            {/* Add new meal button */}
            <Button
              variant="secondary"
              className="w-full mt-4"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add new meal
            </Button>
          </>
        )}
      </div>

      {/* Create meal modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add New Meal"
      >
        <div className="space-y-4">
          <Input
            label="Meal name"
            placeholder="e.g., Chicken burrito bowl"
            value={newMeal.name}
            onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
          />

          <Input
            label="Calories (optional)"
            type="number"
            placeholder="e.g., 850"
            value={newMeal.defaultCalories}
            onChange={(e) =>
              setNewMeal({ ...newMeal, defaultCalories: e.target.value })
            }
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {mealCategories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setNewMeal({ ...newMeal, category: cat.value })}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    newMeal.category === cat.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={newMeal.placeSpecific}
              onChange={(e) =>
                setNewMeal({ ...newMeal, placeSpecific: e.target.checked })
              }
              className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Only available at {place.name}
            </span>
          </label>

          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={!newMeal.name.trim() || creating}
          >
            {creating ? 'Creating...' : 'Add Meal'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
