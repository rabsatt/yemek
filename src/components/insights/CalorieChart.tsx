'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card } from '@/components/ui/Card'

interface DailyData {
  date: string
  totalCalories: number
  mealCount: number
}

interface CalorieChartProps {
  data: DailyData[]
  calorieGoal?: number
}

export function CalorieChart({ data, calorieGoal = 2000 }: CalorieChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    goal: calorieGoal,
  }))

  return (
    <Card>
      <h3 className="font-semibold text-gray-900 mb-4">Calories This Week</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              formatter={(value: number) => [`${value} cal`, 'Calories']}
              labelFormatter={(label) => label}
            />
            <Bar
              dataKey="totalCalories"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
        <span>Goal: {calorieGoal.toLocaleString()} cal/day</span>
        <span>
          Avg:{' '}
          {data.length > 0
            ? Math.round(
                data.reduce((sum, d) => sum + d.totalCalories, 0) / data.length
              ).toLocaleString()
            : 0}{' '}
          cal/day
        </span>
      </div>
    </Card>
  )
}
