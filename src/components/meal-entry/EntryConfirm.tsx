'use client'

import { useState } from 'react'
import { ChevronLeft, Check, Minus, Plus, X, Calendar } from 'lucide-react'
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
    eatenAt: Date
  }) => void
  isSubmitting: boolean
  defaultMealType?: MealType
  defaultDate?: Date
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

function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateDisplay(date: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((today.getTime() - compareDate.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays === -1) return 'Tomorrow'

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function EntryConfirm({
  place,
  items: initialItems,
  onBack,
  onConfirm,
  isSubmitting,
  defaultMealType,
  defaultDate,
}: EntryConfirmProps) {
  const [items, setItems] = useState<SelectedMealItem[]>(initialItems)
  const [mealType, setMealType] = useState<MealType>(defaultMealType || getDefaultMealType())
  const [notes, setNotes] = useState('')
  const [eatenAt, setEatenAt] = useState<Date>(defaultDate || new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)

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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value + 'T12:00:00')
    setEatenAt(newDate)
    setShowDatePicker(false)
  }

  const handleSubmit = () => {
    if (items.length === 0) return
    onConfirm({
      items,
      mealType,
      notes,
      eatenAt,
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
        {/* Date selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-left hover:bg-gray-50"
            >
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="flex-1 font-medium">{formatDateDisplay(eatenAt)}</span>
              <span className="text-sm text-gray-500">
                {eatenAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </button>
            {showDatePicker && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-3">
                <input
                  type="date"
                  value={formatDateForInput(eatenAt)}
                  onChange={handleDateChange}
                  max={formatDateForInput(new Date())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setEatenAt(new Date())
                      setShowDatePicker(false)
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const yesterday = new Date()
                      yesterday.setDate(yesterday.getDate() - 1)
                      setEatenAt(yesterday)
                      setShowDatePicker(false)
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Yesterday
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

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
