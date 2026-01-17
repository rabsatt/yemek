'use client'

import { Card } from '@/components/ui/Card'
import { PlaceTypeIcon } from '@/components/places/PlaceTypeIcon'
import type { Place, PlaceType } from '@/types'

interface TopPlacesProps {
  places: { place: Place; count: number }[]
}

export function TopPlaces({ places }: TopPlacesProps) {
  if (places.length === 0) {
    return null
  }

  return (
    <Card>
      <h3 className="font-semibold text-gray-900 mb-4">Top Places</h3>
      <div className="space-y-3">
        {places.map((item, index) => (
          <div key={item.place.id} className="flex items-center gap-3">
            <div className="w-6 text-center font-medium text-gray-400">
              {index + 1}
            </div>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                item.place.isHome ? 'bg-primary-100' : 'bg-gray-100'
              }`}
            >
              <PlaceTypeIcon
                type={item.place.type as PlaceType}
                className={`w-5 h-5 ${
                  item.place.isHome ? 'text-primary-600' : 'text-gray-600'
                }`}
              />
            </div>
            <div className="flex-1">
              <div className="font-medium">{item.place.name}</div>
            </div>
            <div className="text-sm text-gray-500">
              {item.count} {item.count === 1 ? 'meal' : 'meals'}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
