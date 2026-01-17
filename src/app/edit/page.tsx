'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, Check, Minus, Plus, X, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getEntry, getPlaces, getMeals, updateEntry, deleteEntry } from '@/lib/firestore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { PlaceTypeIcon } from '@/components/places/PlaceTypeIcon'
import { SearchInput } from '@/components/ui/SearchInput'
import { formatCalories } from '@/lib/utils'
import type { MealEntry, Place, MealItem, MealType } from '@/types'

interface EditItem {
  mealItem: MealItem
  calories?: number
  quantity: number
}

const mealTypes: { value: MealType; label: string }[] = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'SNACK', label: 'Snack' },
]

export default function EditEntryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entryId = searchParams.get('id')
  const { user } = useAuth()

  const [entry, setEntry] = useState<MealEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Editable fields
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [items, setItems] = useState<EditItem[]>([])
  const [mealType, setMealType] = useState<MealType>('DINNER')
  const [notes, setNotes] = useState('')

  // Modals
  const [showPlaceSelector, setShowPlaceSelector] = useState(false)
  const [showMealSelector, setShowMealSelector] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Place/meal lists
  const [places, setPlaces] = useState<Place[]>([])
  const [meals, setMeals] = useState<MealItem[]>([])
  const [placeSearch, setPlaceSearch] = useState('')
  const [mealSearch, setMealSearch] = useState('')

  useEffect(() => {
    if (user && entryId) {
      loadEntry()
      loadPlacesAndMeals()
    } else if (!entryId) {
      setError('No entry ID provided')
      setLoading(false)
    }
  }, [user, entryId])

  const loadEntry = async () => {
    if (!user || !entryId) return

    try {
      const data = await getEntry(user.uid, entryId)
      if (!data) {
        setError('Entry not found')
        return
      }

      setEntry(data)
      setSelectedPlace(data.place)
      setMealType(data.mealType)
      setNotes(data.notes || '')

      // Handle both multi-item and legacy entries
      if (data.items && data.items.length > 0) {
        setItems(data.items.map(item => ({
          mealItem: item.mealItem as MealItem,
          calories: item.calories ?? undefined,
          quantity: item.quantity,
        })))
      } else if (data.mealItem) {
        setItems([{
          mealItem: data.mealItem,
          calories: data.calories ?? undefined,
          quantity: 1,
        }])
      }
    } catch (err) {
      console.error('Failed to load entry:', err)
      setError('Failed to load entry')
    } finally {
      setLoading(false)
    }
  }

  const loadPlacesAndMeals = async () => {
    if (!user) return

    try {
      const [placesData, mealsData] = await Promise.all([
        getPlaces(user.uid),
        getMeals(user.uid),
      ])
      setPlaces(placesData)
      setMeals(mealsData)
    } catch (err) {
      console.error('Failed to load places/meals:', err)
    }
  }

  const updateItemCalories = (mealItemId: string, calories: number | undefined) => {
    setItems(prev =>
      prev.map(item =>
        item.mealItem.id === mealItemId
          ? { ...item, calories }
          : item
      )
    )
  }

  const updateItemQuantity = (mealItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(item => item.mealItem.id !== mealItemId))
    } else {
      setItems(prev =>
        prev.map(item =>
          item.mealItem.id === mealItemId
            ? { ...item, quantity }
            : item
        )
      )
    }
  }

  const removeItem = (mealItemId: string) => {
    setItems(prev => prev.filter(item => item.mealItem.id !== mealItemId))
  }

  const addMealItem = (meal: MealItem) => {
    const existing = items.find(item => item.mealItem.id === meal.id)
    if (existing) {
      updateItemQuantity(meal.id, existing.quantity + 1)
    } else {
      setItems(prev => [...prev, {
        mealItem: meal,
        calories: meal.defaultCalories ?? undefined,
        quantity: 1,
      }])
    }
    setShowMealSelector(false)
    setMealSearch('')
  }

  const selectPlace = (place: Place) => {
    setSelectedPlace(place)
    setShowPlaceSelector(false)
    setPlaceSearch('')
  }

  const totalCalories = items.reduce((sum, item) => {
    const cal = item.calories ?? item.mealItem.defaultCalories ?? 0
    return sum + (cal * item.quantity)
  }, 0)

  const handleSave = async () => {
    if (!user || !selectedPlace || items.length === 0 || !entryId) return

    setSaving(true)
    try {
      await updateEntry(user.uid, entryId, {
        placeId: selectedPlace.id,
        place: selectedPlace,
        items: items.map(item => ({
          mealItem: item.mealItem,
          calories: item.calories,
          quantity: item.quantity,
        })),
        mealType,
        notes: notes || undefined,
      })

      router.push('/')
    } catch (err) {
      console.error('Failed to save entry:', err)
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !entryId) return

    try {
      await deleteEntry(user.uid, entryId)
      router.push('/')
    } catch (err) {
      console.error('Failed to delete entry:', err)
      setError('Failed to delete entry')
    }
  }

  const filteredPlaces = places.filter(p =>
    p.name.toLowerCase().includes(placeSearch.toLowerCase())
  )

  const filteredMeals = meals.filter(m =>
    m.name.toLowerCase().includes(mealSearch.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-red-500 mb-4">{error || 'Entry not found'}</div>
        <Button onClick={() => router.push('/')}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        <h1 className="text-lg font-semibold mt-2">Edit Entry</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Place selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Place
          </label>
          <Card
            variant="interactive"
            onClick={() => setShowPlaceSelector(true)}
            className="flex items-center gap-3"
          >
            {selectedPlace && (
              <>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <PlaceTypeIcon
                    type={selectedPlace.type as any}
                    className="w-5 h-5 text-gray-600"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{selectedPlace.name}</div>
                  <div className="text-sm text-gray-500">{selectedPlace.type}</div>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Items</label>
            <span className="text-sm text-gray-500">
              {totalCalories > 0 ? `Total: ${totalCalories} cal` : ''}
            </span>
          </div>

          {items.map((item) => (
            <Card key={item.mealItem.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{item.mealItem.name}</div>
                  <div className="text-sm text-gray-500">{item.mealItem.category}</div>
                </div>
                <button
                  onClick={() => removeItem(item.mealItem.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Calories"
                    value={item.calories?.toString() ?? item.mealItem.defaultCalories?.toString() ?? ''}
                    onChange={(e) =>
                      updateItemCalories(
                        item.mealItem.id,
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    className="text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateItemQuantity(item.mealItem.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateItemQuantity(item.mealItem.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white hover:bg-primary-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {item.quantity > 1 && (
                <div className="text-sm text-gray-500 text-right">
                  Subtotal: {((item.calories ?? item.mealItem.defaultCalories ?? 0) * item.quantity)} cal
                </div>
              )}
            </Card>
          ))}

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setShowMealSelector(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add item
          </Button>
        </div>

        {/* Meal type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meal type
          </label>
          <div className="grid grid-cols-4 gap-2">
            {mealTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setMealType(type.value)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  mealType === type.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this meal..."
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400 resize-none"
            rows={3}
          />
        </div>
      </div>

      {/* Save button */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <Button
          className="w-full"
          size="lg"
          onClick={handleSave}
          disabled={saving || items.length === 0 || !selectedPlace}
        >
          {saving ? (
            'Saving...'
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Place selector modal */}
      <Modal
        isOpen={showPlaceSelector}
        onClose={() => {
          setShowPlaceSelector(false)
          setPlaceSearch('')
        }}
        title="Select Place"
      >
        <div className="space-y-4">
          <SearchInput
            value={placeSearch}
            onChange={setPlaceSearch}
            placeholder="Search places..."
          />
          <div className="max-h-64 overflow-auto space-y-2">
            {filteredPlaces.map((place) => (
              <Card
                key={place.id}
                variant="interactive"
                onClick={() => selectPlace(place)}
                className="flex items-center gap-3"
              >
                <PlaceTypeIcon
                  type={place.type as any}
                  className="w-5 h-5 text-gray-600"
                />
                <span className="font-medium">{place.name}</span>
              </Card>
            ))}
            {filteredPlaces.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No places found
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Meal selector modal */}
      <Modal
        isOpen={showMealSelector}
        onClose={() => {
          setShowMealSelector(false)
          setMealSearch('')
        }}
        title="Add Item"
      >
        <div className="space-y-4">
          <SearchInput
            value={mealSearch}
            onChange={setMealSearch}
            placeholder="Search meals..."
          />
          <div className="max-h-64 overflow-auto space-y-2">
            {filteredMeals.map((meal) => (
              <Card
                key={meal.id}
                variant="interactive"
                onClick={() => addMealItem(meal)}
                className="flex items-center justify-between"
              >
                <span className="font-medium">{meal.name}</span>
                <span className="text-sm text-gray-500">
                  {formatCalories(meal.defaultCalories)}
                </span>
              </Card>
            ))}
            {filteredMeals.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No meals found
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Entry"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this meal entry? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
