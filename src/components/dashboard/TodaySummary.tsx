'use client'

import { Card } from '@/components/ui/Card'

interface TodaySummaryProps {
  totalCalories: number
  mealCount: number
  calorieGoal?: number
}

export function TodaySummary({
  totalCalories,
  mealCount,
  calorieGoal = 2000,
}: TodaySummaryProps) {
  const percentage = Math.min((totalCalories / calorieGoal) * 100, 100)
  const isOverGoal = totalCalories > calorieGoal

  return (
    <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold opacity-90">Today</h2>
        <span className="text-sm opacity-75">
          {mealCount} {mealCount === 1 ? 'meal' : 'meals'} logged
        </span>
      </div>

      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">
            {totalCalories.toLocaleString()}
          </span>
          <span className="text-lg opacity-75">/ {calorieGoal.toLocaleString()} cal</span>
        </div>
      </div>

      <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
            isOverGoal ? 'bg-red-400' : 'bg-white'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-2 text-sm opacity-75">
        {isOverGoal ? (
          <span>{totalCalories - calorieGoal} over goal</span>
        ) : (
          <span>{calorieGoal - totalCalories} remaining</span>
        )}
      </div>
    </Card>
  )
}
