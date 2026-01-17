import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Place, MealItem, MealEntry, PlaceType, MealCategory, MealType } from '@/types'

// Helper to convert Firestore timestamp to Date
const toDate = (timestamp: Timestamp | Date): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  return timestamp
}

// ============ PLACES ============

export async function getPlaces(userId: string, searchTerm?: string): Promise<Place[]> {
  const placesRef = collection(db, 'users', userId, 'places')
  const q = query(placesRef, orderBy('usageCount', 'desc'), orderBy('name', 'asc'))

  const snapshot = await getDocs(q)
  let places = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt),
    updatedAt: toDate(doc.data().updatedAt),
  })) as Place[]

  if (searchTerm) {
    const search = searchTerm.toLowerCase()
    places = places.filter((p) => p.name.toLowerCase().includes(search))
  }

  return places
}

export async function createPlace(
  userId: string,
  data: { name: string; type: PlaceType; isHome: boolean; address?: string }
): Promise<Place> {
  const placesRef = collection(db, 'users', userId, 'places')

  const docRef = await addDoc(placesRef, {
    ...data,
    usageCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return {
    id: docRef.id,
    ...data,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function updatePlace(
  userId: string,
  placeId: string,
  data: Partial<Place>
): Promise<void> {
  const placeRef = doc(db, 'users', userId, 'places', placeId)
  await updateDoc(placeRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deletePlace(userId: string, placeId: string): Promise<void> {
  const placeRef = doc(db, 'users', userId, 'places', placeId)
  await deleteDoc(placeRef)
}

export async function incrementPlaceUsage(userId: string, placeId: string): Promise<void> {
  const placeRef = doc(db, 'users', userId, 'places', placeId)
  await updateDoc(placeRef, {
    usageCount: increment(1),
    updatedAt: serverTimestamp(),
  })
}

// ============ MEALS ============

export async function getMeals(
  userId: string,
  options?: { searchTerm?: string; placeId?: string }
): Promise<MealItem[]> {
  const mealsRef = collection(db, 'users', userId, 'meals')
  const q = query(mealsRef, orderBy('usageCount', 'desc'), orderBy('name', 'asc'))

  const snapshot = await getDocs(q)
  let meals = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt),
    updatedAt: toDate(doc.data().updatedAt),
  })) as MealItem[]

  if (options?.searchTerm) {
    const search = options.searchTerm.toLowerCase()
    meals = meals.filter((m) => m.name.toLowerCase().includes(search))
  }

  // Sort place-specific meals first if placeId provided
  if (options?.placeId) {
    meals.sort((a, b) => {
      if (a.placeId === options.placeId && b.placeId !== options.placeId) return -1
      if (a.placeId !== options.placeId && b.placeId === options.placeId) return 1
      return b.usageCount - a.usageCount
    })
  }

  return meals
}

export async function createMeal(
  userId: string,
  data: { name: string; defaultCalories?: number; category: MealCategory; placeId?: string }
): Promise<MealItem> {
  const mealsRef = collection(db, 'users', userId, 'meals')

  const docRef = await addDoc(mealsRef, {
    ...data,
    defaultCalories: data.defaultCalories || null,
    placeId: data.placeId || null,
    usageCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return {
    id: docRef.id,
    name: data.name,
    defaultCalories: data.defaultCalories || null,
    category: data.category,
    placeId: data.placeId || null,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function incrementMealUsage(userId: string, mealId: string): Promise<void> {
  const mealRef = doc(db, 'users', userId, 'meals', mealId)
  await updateDoc(mealRef, {
    usageCount: increment(1),
    updatedAt: serverTimestamp(),
  })
}

// ============ ENTRIES ============

export async function getEntries(
  userId: string,
  options?: { limit?: number; startDate?: Date; endDate?: Date }
): Promise<MealEntry[]> {
  const entriesRef = collection(db, 'users', userId, 'entries')
  let q = query(entriesRef, orderBy('eatenAt', 'desc'))

  if (options?.limit) {
    q = query(q, limit(options.limit))
  }

  const snapshot = await getDocs(q)
  const entries = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    eatenAt: toDate(doc.data().eatenAt),
    createdAt: toDate(doc.data().createdAt),
    updatedAt: toDate(doc.data().updatedAt),
  })) as MealEntry[]

  // Filter by date range if provided
  let filtered = entries
  if (options?.startDate) {
    filtered = filtered.filter((e) => e.eatenAt >= options.startDate!)
  }
  if (options?.endDate) {
    filtered = filtered.filter((e) => e.eatenAt <= options.endDate!)
  }

  return filtered
}

export async function createEntry(
  userId: string,
  data: {
    placeId: string
    place: Place
    mealItemId: string
    mealItem: MealItem
    calories?: number
    mealType: MealType
    notes?: string
    eatenAt?: Date
  }
): Promise<MealEntry> {
  const entriesRef = collection(db, 'users', userId, 'entries')

  const entryData = {
    placeId: data.placeId,
    place: {
      id: data.place.id,
      name: data.place.name,
      type: data.place.type,
      isHome: data.place.isHome,
    },
    mealItemId: data.mealItemId,
    mealItem: {
      id: data.mealItem.id,
      name: data.mealItem.name,
      defaultCalories: data.mealItem.defaultCalories,
      category: data.mealItem.category,
    },
    calories: data.calories || null,
    mealType: data.mealType,
    notes: data.notes || null,
    eatenAt: data.eatenAt ? Timestamp.fromDate(data.eatenAt) : serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const docRef = await addDoc(entriesRef, entryData)

  // Increment usage counts
  await Promise.all([
    incrementPlaceUsage(userId, data.placeId),
    incrementMealUsage(userId, data.mealItemId),
  ])

  return {
    id: docRef.id,
    placeId: data.placeId,
    place: data.place,
    mealItemId: data.mealItemId,
    mealItem: data.mealItem,
    calories: data.calories || null,
    mealType: data.mealType,
    notes: data.notes || null,
    eatenAt: data.eatenAt || new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

// ============ INSIGHTS ============

export async function getInsights(userId: string, days: number = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days + 1)
  startDate.setHours(0, 0, 0, 0)

  const entries = await getEntries(userId, { startDate })

  // Calculate daily summaries
  const dailyData: Record<string, {
    date: string
    totalCalories: number
    mealCount: number
    homeCount: number
    outCount: number
  }> = {}

  // Initialize all days
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - days + 1 + i)
    const dateStr = date.toISOString().split('T')[0]
    dailyData[dateStr] = {
      date: dateStr,
      totalCalories: 0,
      mealCount: 0,
      homeCount: 0,
      outCount: 0,
    }
  }

  // Aggregate entries
  entries.forEach((entry) => {
    const dateStr = entry.eatenAt.toISOString().split('T')[0]
    if (dailyData[dateStr]) {
      dailyData[dateStr].mealCount += 1
      dailyData[dateStr].totalCalories += entry.calories || 0
      if (entry.place.isHome) {
        dailyData[dateStr].homeCount += 1
      } else {
        dailyData[dateStr].outCount += 1
      }
    }
  })

  // Today's summary
  const today = new Date().toISOString().split('T')[0]
  const todaySummary = dailyData[today] || {
    date: today,
    totalCalories: 0,
    mealCount: 0,
    homeCount: 0,
    outCount: 0,
  }

  // Location breakdown
  const totalHome = entries.filter((e) => e.place.isHome).length
  const totalOut = entries.length - totalHome

  // Top places
  const placeCounts: Record<string, { place: Place; count: number }> = {}
  entries.forEach((entry) => {
    const placeId = entry.place.id
    if (!placeCounts[placeId]) {
      placeCounts[placeId] = { place: entry.place, count: 0 }
    }
    placeCounts[placeId].count += 1
  })

  const topPlaces = Object.values(placeCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    todaySummary,
    dailyData: Object.values(dailyData),
    locationBreakdown: {
      home: totalHome,
      out: totalOut,
      total: entries.length,
    },
    topPlaces,
    periodStats: {
      totalCalories: entries.reduce((sum, e) => sum + (e.calories || 0), 0),
      totalMeals: entries.length,
      avgCaloriesPerDay:
        entries.length > 0
          ? Math.round(entries.reduce((sum, e) => sum + (e.calories || 0), 0) / days)
          : 0,
    },
  }
}
