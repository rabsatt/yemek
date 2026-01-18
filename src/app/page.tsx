'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UtensilsCrossed, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getEntries, createEntry, createMultiItemEntry, deleteEntry } from '@/lib/firestore'
import { Header } from '@/components/layout/Header'
import { TodaySummary } from '@/components/dashboard/TodaySummary'
import { TodayMeals } from '@/components/dashboard/TodayMeals'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import type { MealEntry, MealType } from '@/types'

interface DaySummary {
  totalCalories: number
  mealCount: number
}

function formatDateHeader(date: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((today.getTime() - compareDate.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today's Meals"
  if (diffDays === 1) return "Yesterday's Meals"

  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  const [entries, setEntries] = useState<MealEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [quickLogging, setQuickLogging] = useState(false)

  const justLogged = searchParams.get('logged') === 'true'

  useEffect(() => {
    if (user) {
      fetchData()
    }

    // Clear the logged param from URL
    if (justLogged) {
      window.history.replaceState({}, '', '/')
    }
  }, [user, justLogged, selectedDate])

  const fetchData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Get selected date range
      const startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)

      const entriesData = await getEntries(user.uid, { startDate, endDate })
      setEntries(entriesData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate summary from actual entries displayed
  const daySummary: DaySummary = {
    totalCalories: entries.reduce((sum, entry) => sum + (entry.calories ?? 0), 0),
    mealCount: entries.length,
  }

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)

    // Don't go past today
    if (newDate <= today) {
      setSelectedDate(newDate)
    }
  }

  const goToToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setSelectedDate(today)
  }

  const handleQuickLog = async (entry: MealEntry) => {
    if (!user) return

    setQuickLogging(true)
    try {
      const hour = new Date().getHours()
      let mealType: MealType = 'DINNER'
      if (hour >= 5 && hour < 11) mealType = 'BREAKFAST'
      else if (hour >= 11 && hour < 15) mealType = 'LUNCH'
      else if (hour >= 15 && hour < 18) mealType = 'SNACK'

      // Handle both multi-item and legacy single-item entries
      if (entry.items && entry.items.length > 0) {
        await createMultiItemEntry(user.uid, {
          placeId: entry.placeId,
          place: entry.place,
          items: entry.items.map(item => ({
            mealItem: item.mealItem as any,
            calories: item.calories ?? undefined,
            quantity: item.quantity,
          })),
          mealType,
        })
      } else if (entry.mealItem && entry.mealItemId) {
        // Legacy single-item entry
        await createEntry(user.uid, {
          placeId: entry.placeId,
          place: entry.place,
          mealItemId: entry.mealItemId,
          mealItem: entry.mealItem,
          calories: entry.calories || undefined,
          mealType,
        })
      }

      fetchData()
    } catch (error) {
      console.error('Failed to quick log:', error)
    } finally {
      setQuickLogging(false)
    }
  }

  const handleEdit = (entry: MealEntry) => {
    router.push(`/edit?id=${entry.id}`)
  }

  const handleDelete = async (entryId: string) => {
    if (!user) return

    try {
      await deleteEntry(user.uid, entryId)
      fetchData()
    } catch (error) {
      console.error('Failed to delete entry:', error)
    }
  }

  const handleLogNew = (mealType: MealType) => {
    // Navigate to log page with meal type pre-selected
    router.push(`/log?mealType=${mealType}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Meal Tracker" />
        <div className="max-w-lg mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-gray-200 rounded-xl" />
            <div className="h-24 bg-gray-200 rounded-xl" />
            <div className="h-24 bg-gray-200 rounded-xl" />
            <div className="h-24 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  const isTodaySelected = isToday(selectedDate)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Meal Tracker" />

      <main className="max-w-lg mx-auto p-4 space-y-6">
        {/* Date navigation */}
        <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
          <button
            onClick={goToPreviousDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="text-center">
            <h2 className="font-semibold text-gray-900">
              {formatDateHeader(selectedDate)}
            </h2>
            {!isTodaySelected && (
              <button
                onClick={goToToday}
                className="text-sm text-primary-600 hover:text-primary-700 mt-1"
              >
                Go to today
              </button>
            )}
          </div>

          <button
            onClick={goToNextDay}
            disabled={isTodaySelected}
            className={`p-2 rounded-lg transition-colors ${
              isTodaySelected
                ? 'text-gray-300 cursor-not-allowed'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <TodaySummary
          totalCalories={daySummary.totalCalories}
          mealCount={daySummary.mealCount}
          label={isTodaySelected ? 'Today' : formatDateHeader(selectedDate).replace("'s Meals", '')}
        />

        {/* Meals grouped by type */}
        <TodayMeals
          entries={entries}
          onQuickLog={handleQuickLog}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onLogNew={handleLogNew}
          showAddButtons={isTodaySelected}
        />
      </main>

      {/* Quick log loading overlay */}
      {quickLogging && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg px-6 py-4 shadow-xl">
            Logging meal...
          </div>
        </div>
      )}
    </div>
  )
}
