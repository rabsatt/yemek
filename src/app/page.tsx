'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UtensilsCrossed } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getEntries, getInsights, createEntry, createMultiItemEntry, deleteEntry } from '@/lib/firestore'
import { Header } from '@/components/layout/Header'
import { TodaySummary } from '@/components/dashboard/TodaySummary'
import { RecentMeals } from '@/components/dashboard/RecentMeals'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import type { MealEntry, MealType } from '@/types'

interface InsightsData {
  todaySummary: {
    totalCalories: number
    mealCount: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [entries, setEntries] = useState<MealEntry[]>([])
  const [insights, setInsights] = useState<InsightsData | null>(null)
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
  }, [user, justLogged])

  const fetchData = async () => {
    if (!user) return

    try {
      const [entriesData, insightsData] = await Promise.all([
        getEntries(user.uid, { limit: 10 }),
        getInsights(user.uid, 1),
      ])

      setEntries(entriesData)
      setInsights(insightsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
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
    // Navigate to edit page with entry ID
    router.push(`/edit/${entry.id}`)
  }

  const handleDelete = async (entryId: string) => {
    if (!user) return

    try {
      await deleteEntry(user.uid, entryId)
      // Refresh data after deletion
      fetchData()
    } catch (error) {
      console.error('Failed to delete entry:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Meal Tracker" />
        <div className="max-w-lg mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-gray-200 rounded-xl" />
            <div className="h-20 bg-gray-200 rounded-xl" />
            <div className="h-20 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Meal Tracker" />

      <main className="max-w-lg mx-auto p-4 space-y-6">
        {/* Today's summary */}
        <TodaySummary
          totalCalories={insights?.todaySummary.totalCalories || 0}
          mealCount={insights?.todaySummary.mealCount || 0}
        />

        {/* Recent meals or empty state */}
        {entries.length > 0 ? (
          <RecentMeals
            entries={entries}
            onQuickLog={handleQuickLog}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <EmptyState
            icon={UtensilsCrossed}
            title="No meals logged yet"
            description="Start tracking your meals to see your eating patterns and calorie intake."
            action={
              <Button onClick={() => router.push('/log')}>
                Log Your First Meal
              </Button>
            }
          />
        )}
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
