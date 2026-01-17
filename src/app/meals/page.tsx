'use client'

import { useEffect, useState } from 'react'
import { UtensilsCrossed, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getMeals, createMeal } from '@/lib/firestore'
import { Header } from '@/components/layout/Header'
import { SearchInput } from '@/components/ui/SearchInput'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCalories } from '@/lib/utils'
import type { MealItem, MealCategory } from '@/types'

const mealCategories: { value: MealCategory; label: string }[] = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'SNACK', label: 'Snack' },
  { value: 'DRINK', label: 'Drink' },
  { value: 'DESSERT', label: 'Dessert' },
  { value: 'OTHER', label: 'Other' },
]

export default function MealsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [meals, setMeals] = useState<MealItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newMeal, setNewMeal] = useState({
    name: '',
    defaultCalories: '',
    category: 'OTHER' as MealCategory,
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (user) {
      fetchMeals()
    }
  }, [user])

  const fetchMeals = async () => {
    if (!user) return

    try {
      const data = await getMeals(user.uid)
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
      await createMeal(user.uid, {
        name: newMeal.name,
        defaultCalories: newMeal.defaultCalories ? parseInt(newMeal.defaultCalories) : undefined,
        category: newMeal.category,
      })
      setShowCreate(false)
      setNewMeal({ name: '', defaultCalories: '', category: 'OTHER' })
      fetchMeals()
    } catch (error) {
      console.error('Failed to create meal:', error)
    } finally {
      setCreating(false)
    }
  }

  const filteredMeals = meals.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Meals" subtitle={`${meals.length} saved`} />

      <main className="max-w-lg mx-auto p-4 space-y-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search meals..."
        />

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl" />
            ))}
          </div>
        ) : filteredMeals.length > 0 ? (
          <div className="space-y-3">
            {filteredMeals.map((meal) => (
              <Card key={meal.id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <UtensilsCrossed className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{meal.name}</div>
                  <div className="text-sm text-gray-500">
                    {formatCalories(meal.defaultCalories)} · {meal.usageCount}{' '}
                    {meal.usageCount === 1 ? 'time' : 'times'} logged
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : search ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="No meals found"
            description={`No meals matching "${search}"`}
          />
        ) : (
          <EmptyState
            icon={UtensilsCrossed}
            title="No meals yet"
            description="Add meals you eat regularly for quick logging."
            action={
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Add Meal
              </Button>
            }
          />
        )}

        {/* Add button */}
        {meals.length > 0 && (
          <Button
            className="w-full"
            variant="secondary"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Meal
          </Button>
        )}
      </main>

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
