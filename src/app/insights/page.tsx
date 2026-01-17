'use client'

import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getInsights } from '@/lib/firestore'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { CalorieChart } from '@/components/insights/CalorieChart'
import { LocationPieChart } from '@/components/insights/LocationPieChart'
import { TopPlaces } from '@/components/insights/TopPlaces'
import type { Place } from '@/types'

interface InsightsData {
  todaySummary: {
    totalCalories: number
    mealCount: number
  }
  dailyData: {
    date: string
    totalCalories: number
    mealCount: number
    homeCount: number
    outCount: number
  }[]
  locationBreakdown: {
    home: number
    out: number
    total: number
  }
  topPlaces: { place: Place; count: number }[]
  periodStats: {
    totalCalories: number
    totalMeals: number
    avgCaloriesPerDay: number
  }
}

type Period = '7' | '14' | '30'

export default function InsightsPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<Period>('7')
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchInsights()
    }
  }, [user, period])

  const fetchInsights = async () => {
    if (!user) return

    setLoading(true)
    try {
      const insights = await getInsights(user.uid, parseInt(period))
      setData(insights)
    } catch (error) {
      console.error('Failed to fetch insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const periodLabels: Record<Period, string> = {
    '7': 'Last 7 days',
    '14': 'Last 2 weeks',
    '30': 'Last 30 days',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Insights" subtitle={periodLabels[period]} />

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Period selector */}
        <div className="flex gap-2">
          {(['7', '14', '30'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p === '7' ? '7 days' : p === '14' ? '2 weeks' : '30 days'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-200 rounded-xl" />
            <div className="h-40 bg-gray-200 rounded-xl" />
            <div className="h-32 bg-gray-200 rounded-xl" />
          </div>
        ) : data && data.periodStats.totalMeals > 0 ? (
          <>
            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {data.periodStats.totalMeals}
                </div>
                <div className="text-xs text-gray-500">Total Meals</div>
              </Card>
              <Card className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {data.periodStats.avgCaloriesPerDay.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Avg Cal/Day</div>
              </Card>
              <Card className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {data.locationBreakdown.total > 0
                    ? Math.round(
                        (data.locationBreakdown.home / data.locationBreakdown.total) * 100
                      )
                    : 0}
                  %
                </div>
                <div className="text-xs text-gray-500">Home Meals</div>
              </Card>
            </div>

            {/* Calorie chart */}
            <CalorieChart data={data.dailyData} />

            {/* Location breakdown */}
            <LocationPieChart data={data.locationBreakdown} />

            {/* Top places */}
            <TopPlaces places={data.topPlaces} />
          </>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="No data yet"
            description="Start logging meals to see your eating patterns and insights."
          />
        )}
      </main>
    </div>
  )
}
