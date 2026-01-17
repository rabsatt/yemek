export type PlaceType = 'HOME' | 'RESTAURANT' | 'CAFE' | 'FAST_FOOD' | 'WORK' | 'OTHER'
export type MealCategory = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'DRINK' | 'DESSERT' | 'OTHER'
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'

export interface Place {
  id: string
  name: string
  type: PlaceType
  address?: string | null
  isHome: boolean
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export interface MealItem {
  id: string
  name: string
  defaultCalories?: number | null
  category: MealCategory
  usageCount: number
  placeId?: string | null
  place?: Place | null
  createdAt: Date
  updatedAt: Date
}

// An item within a meal entry (supports multiple items per meal)
export interface EntryItem {
  mealItemId: string
  mealItem: {
    id: string
    name: string
    defaultCalories?: number | null
    category: MealCategory
  }
  calories?: number | null
  quantity: number
}

export interface MealEntry {
  id: string
  placeId: string
  place: Place
  // Support both single item (legacy) and multiple items
  mealItemId?: string
  mealItem?: MealItem
  items?: EntryItem[]
  calories?: number | null
  eatenAt: Date
  mealType: MealType
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface DailySummary {
  date: string
  totalCalories: number
  mealCount: number
  homeCount: number
  outCount: number
}
