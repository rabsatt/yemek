'use client'

import { useState } from 'react'
import { ChevronLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { PlaceTypeIcon } from '@/components/places/PlaceTypeIcon'
import type { Place, MealItem, MealType } from '@/types'

interface EntryConfirmProps {
  place: Place
  meal: MealItem
  onBack: () => void
  onConfirm: (data: {
    calories: number | null
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
  meal,
  onBack,
  onConfirm,
  isSubmitting,
}: EntryConfirmProps) {
  const [calories, setCalories] = useState(
    meal.defaultCalories?.toString() || ''
  )
  const [mealType, setMealType] = useState<MealType>(getDefaultMealType())
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    onConfirm({
      calories: calories ? parseInt(calories) : null,
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
        {/* Summary card */}
        <Card className="space-y-3">
          <div className="flex items-center gap-3">
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
          </div>
          <div className="border-t border-gray-100 pt-3">
            <div className="text-sm text-gray-500">Meal</div>
            <div className="font-medium">{meal.name}</div>
          </div>
        </Card>

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

        {/* Calories */}
        <Input
          label="Calories (optional)"
          type="number"
          placeholder="e.g., 850"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />

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
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            'Logging...'
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Log Meal
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
