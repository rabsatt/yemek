import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  } else if (diffDays === 1) {
    return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  } else if (diffDays < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function formatCalories(calories: number | null | undefined): string {
  if (calories === null || calories === undefined) return '—'
  return `${calories} cal`
}

export function getMealTypeFromTime(date: Date = new Date()): string {
  const hour = date.getHours()
  if (hour >= 5 && hour < 11) return 'BREAKFAST'
  if (hour >= 11 && hour < 15) return 'LUNCH'
  if (hour >= 15 && hour < 18) return 'SNACK'
  return 'DINNER'
}
