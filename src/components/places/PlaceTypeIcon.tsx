import { Home, Utensils, Coffee, Zap, Building2, MapPin } from 'lucide-react'
import type { PlaceType } from '@/types'

const iconMap: Record<PlaceType, typeof Home> = {
  HOME: Home,
  RESTAURANT: Utensils,
  CAFE: Coffee,
  FAST_FOOD: Zap,
  WORK: Building2,
  OTHER: MapPin,
}

interface PlaceTypeIconProps {
  type: PlaceType
  className?: string
}

export function PlaceTypeIcon({ type, className }: PlaceTypeIconProps) {
  const Icon = iconMap[type] || MapPin
  return <Icon className={className} />
}
