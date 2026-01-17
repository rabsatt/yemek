'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createMultiItemEntry } from '@/lib/firestore'
import { PlaceSelector } from '@/components/meal-entry/PlaceSelector'
import { MealSelector, SelectedMealItem } from '@/components/meal-entry/MealSelector'
import { EntryConfirm } from '@/components/meal-entry/EntryConfirm'
import type { Place, MealType } from '@/types'

type Step = 1 | 2 | 3

export default function LogMealPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [selectedItems, setSelectedItems] = useState<SelectedMealItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get pre-selected meal type from URL if provided
  const preselectedMealType = searchParams.get('mealType') as MealType | null

  const handleSelectPlace = (place: Place) => {
    setSelectedPlace(place)
    setStep(2)
  }

  const handleSelectMeals = (items: SelectedMealItem[]) => {
    setSelectedItems(items)
    setStep(3)
  }

  const handleConfirm = async (data: {
    items: SelectedMealItem[]
    mealType: MealType
    notes: string
  }) => {
    if (!selectedPlace || data.items.length === 0 || !user) return

    setIsSubmitting(true)
    try {
      await createMultiItemEntry(user.uid, {
        placeId: selectedPlace.id,
        place: selectedPlace,
        items: data.items.map(item => ({
          mealItem: item.mealItem,
          calories: item.calories,
          quantity: item.quantity,
        })),
        mealType: data.mealType,
        notes: data.notes || undefined,
      })

      router.push('/?logged=true')
    } catch (error) {
      console.error('Failed to log meal:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-screen bg-white">
      {step === 1 && <PlaceSelector onSelect={handleSelectPlace} />}

      {step === 2 && selectedPlace && (
        <MealSelector
          place={selectedPlace}
          onSelect={handleSelectMeals}
          onBack={() => setStep(1)}
          initialSelection={selectedItems}
        />
      )}

      {step === 3 && selectedPlace && selectedItems.length > 0 && (
        <EntryConfirm
          place={selectedPlace}
          items={selectedItems}
          onBack={() => setStep(2)}
          onConfirm={handleConfirm}
          isSubmitting={isSubmitting}
          defaultMealType={preselectedMealType || undefined}
        />
      )}
    </div>
  )
}
