'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { Home, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface LocationBreakdown {
  home: number
  out: number
  total: number
}

interface LocationPieChartProps {
  data: LocationBreakdown
}

export function LocationPieChart({ data }: LocationPieChartProps) {
  const chartData = [
    { name: 'Home', value: data.home, color: '#22c55e' },
    { name: 'Eating Out', value: data.out, color: '#f97316' },
  ].filter((d) => d.value > 0)

  const homePercent = data.total > 0 ? Math.round((data.home / data.total) * 100) : 0
  const outPercent = data.total > 0 ? Math.round((data.out / data.total) * 100) : 0

  if (data.total === 0) {
    return (
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Where You Eat</h3>
        <div className="text-center text-gray-500 py-8">
          No meals logged yet
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="font-semibold text-gray-900 mb-4">Where You Eat</h3>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Home className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <div className="font-medium">Home</div>
              <div className="text-sm text-gray-500">
                {data.home} meals ({homePercent}%)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="font-medium">Eating Out</div>
              <div className="text-sm text-gray-500">
                {data.out} meals ({outPercent}%)
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
