'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createEntry } from '@/lib/firestore'
import { PlaceSelector } from '@/components/meal-entry/PlaceSelector'
import { MealSelector } from '@/components/meal-entry/MealSelector'
import { EntryConfirm } from '@/components/meal-entry/EntryConfirm'
import type { Place, MealItem, MealType } from '@/types'

type Step = 1 | 2 | 3

export default function LogMealPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [selectedMeal, setSelectedMeal] = useState<MealItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSelectPlace = (place: Place) => {
    setSelectedPlace(place)
    setStep(2)
  }

  const handleSelectMeal = (meal: MealItem) => {
    setSelectedMeal(meal)
    setStep(3)
  }

  const handleConfirm = async (data: {
    calories: number | null
    mealType: MealType
    notes: string
  }) => {
    if (!selectedPlace || !selectedMeal || !user) return

    setIsSubmitting(true)
    try {
      await createEntry(user.uid, {
        placeId: selectedPlace.id,
        place: selectedPlace,
        mealItemId: selectedMeal.id,
        mealItem: selectedMeal,
        calories: data.calories || undefined,
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
          onSelect={handleSelectMeal}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && selectedPlace && selectedMeal && (
        <EntryConfirm
          place={selectedPlace}
          meal={selectedMeal}
          onBack={() => setStep(2)}
          onConfirm={handleConfirm}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
