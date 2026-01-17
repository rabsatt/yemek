'use client'

import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { PlaceTypeIcon } from '@/components/places/PlaceTypeIcon'
import { formatDate, formatCalories } from '@/lib/utils'
import type { MealEntry, PlaceType } from '@/types'

interface RecentMealsProps {
  entries: MealEntry[]
  onQuickLog: (entry: MealEntry) => void
}

export function RecentMeals({ entries, onQuickLog }: RecentMealsProps) {
  if (entries.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Recent Meals</h2>
      {entries.map((entry) => (
        <Card key={entry.id} className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              entry.place.isHome ? 'bg-primary-100' : 'bg-gray-100'
            }`}
          >
            <PlaceTypeIcon
              type={entry.place.type as PlaceType}
              className={`w-5 h-5 ${
                entry.place.isHome ? 'text-primary-600' : 'text-gray-600'
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{entry.mealItem.name}</div>
            <div className="text-sm text-gray-500">
              {formatDate(entry.eatenAt)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {formatCalories(entry.calories)}
            </span>
            <button
              onClick={() => onQuickLog(entry)}
              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Log again"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </Card>
      ))}
    </div>
  )
}
