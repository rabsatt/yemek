'use client'

import { useState } from 'react'
import { ChevronLeft, Check, Minus, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { PlaceTypeIcon } from '@/components/places/PlaceTypeIcon'
import type { Place, MealType } from '@/types'
import type { SelectedMealItem } from './MealSelector'

interface EntryConfirmProps {
  place: Place
  items: SelectedMealItem[]
  onBack: () => void
  onConfirm: (data: {
    items: SelectedMealItem[]
    mealType: MealType
    notes: string
  }) => void
  isSubmitting: boolean
}

const mealTypes: { value: MealType; label: string }[] = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'SNACK', label: 'Snack' },
]

function getDefaultMealType(): MealType {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return 'BREAKFAST'
  if (hour >= 11 && hour < 15) return 'LUNCH'
  if (hour >= 15 && hour < 18) return 'SNACK'
  return 'DINNER'
}

export function EntryConfirm({
  place,
  items: initialItems,
  onBack,
  onConfirm,
  isSubmitting,
}: EntryConfirmProps) {
  const [items, setItems] = useState<SelectedMealItem[]>(initialItems)
  const [mealType, setMealType] = useState<MealType>(getDefaultMealType())
  const [notes, setNotes] = useState('')

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

  const totalCalories = items.reduce((sum, item) => {
    const cal = item.calories ?? item.mealItem.defaultCalories ?? 0
    return sum + (cal * item.quantity)
  }, 0)

  const handleSubmit = () => {
    if (items.length === 0) return
    onConfirm({
      items,
      mealType,
      notes,
    })
  }

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
        <h2 className="text-lg font-semibold">Confirm Entry</h2>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Place card */}
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <PlaceTypeIcon
              type={place.type as any}
              className="w-5 h-5 text-gray-600"
            />
          </div>
          <div>
            <div className="text-sm text-gray-500">Place</div>
            <div className="font-medium">{place.name}</div>
          </div>
        </Card>

        {/* Items list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Items</h3>
            <span className="text-sm text-gray-500">
              {totalCalories > 0 ? `Total: ${totalCalories} cal` : ''}
            </span>
          </div>

          {items.map((item) => (
            <Card key={item.mealItem.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{item.mealItem.name}</div>
                  <div className="text-sm text-gray-500">
                    {item.mealItem.category}
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.mealItem.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                {/* Calories input */}
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

                {/* Quantity controls */}
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

          {items.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No items selected. Go back to add items.
            </div>
          )}
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

      {/* Submit button */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting || items.length === 0}
        >
          {isSubmitting ? (
            'Logging...'
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Log Meal {totalCalories > 0 ? `(${totalCalories} cal)` : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
