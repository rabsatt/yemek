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
import type { Place, MealItem, MealEntry, PlaceType, MealCategory, MealType, EntryItem } from '@/types'

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

export async function getMeal(userId: string, mealId: string): Promise<MealItem | null> {
  const mealRef = doc(db, 'users', userId, 'meals', mealId)
  const snapshot = await getDoc(mealRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: toDate(snapshot.data().createdAt),
    updatedAt: toDate(snapshot.data().updatedAt),
  } as MealItem
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

export async function updateMeal(
  userId: string,
  mealId: string,
  data: Partial<Omit<MealItem, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const mealRef = doc(db, 'users', userId, 'meals', mealId)
  await updateDoc(mealRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteMeal(userId: string, mealId: string): Promise<void> {
  const mealRef = doc(db, 'users', userId, 'meals', mealId)
  await deleteDoc(mealRef)
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

export async function getEntry(userId: string, entryId: string): Promise<MealEntry | null> {
  const entryRef = doc(db, 'users', userId, 'entries', entryId)
  const snapshot = await getDoc(entryRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
    eatenAt: toDate(snapshot.data().eatenAt),
    createdAt: toDate(snapshot.data().createdAt),
    updatedAt: toDate(snapshot.data().updatedAt),
  } as MealEntry
}

// Legacy single-item entry creation (for backward compatibility)
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

// New multi-item entry creation
export async function createMultiItemEntry(
  userId: string,
  data: {
    placeId: string
    place: Place
    items: Array<{
      mealItem: MealItem
      calories?: number
      quantity: number
    }>
    mealType: MealType
    notes?: string
    eatenAt?: Date
  }
): Promise<MealEntry> {
  const entriesRef = collection(db, 'users', userId, 'entries')

  // Calculate total calories from all items
  const totalCalories = data.items.reduce((sum, item) => {
    const itemCalories = item.calories ?? item.mealItem.defaultCalories ?? 0
    return sum + (itemCalories * item.quantity)
  }, 0)

  const entryItems: EntryItem[] = data.items.map(item => ({
    mealItemId: item.mealItem.id,
    mealItem: {
      id: item.mealItem.id,
      name: item.mealItem.name,
      defaultCalories: item.mealItem.defaultCalories,
      category: item.mealItem.category,
    },
    calories: item.calories ?? item.mealItem.defaultCalories ?? null,
    quantity: item.quantity,
  }))

  const entryData = {
    placeId: data.placeId,
    place: {
      id: data.place.id,
      name: data.place.name,
      type: data.place.type,
      isHome: data.place.isHome,
    },
    items: entryItems,
    calories: totalCalories || null,
    mealType: data.mealType,
    notes: data.notes || null,
    eatenAt: data.eatenAt ? Timestamp.fromDate(data.eatenAt) : serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const docRef = await addDoc(entriesRef, entryData)

  // Increment usage counts for place and all meals
  const usageUpdates = [
    incrementPlaceUsage(userId, data.placeId),
    ...data.items.map(item => incrementMealUsage(userId, item.mealItem.id))
  ]
  await Promise.all(usageUpdates)

  return {
    id: docRef.id,
    placeId: data.placeId,
    place: data.place,
    items: entryItems,
    calories: totalCalories || null,
    mealType: data.mealType,
    notes: data.notes || null,
    eatenAt: data.eatenAt || new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function updateEntry(
  userId: string,
  entryId: string,
  data: {
    placeId?: string
    place?: Place
    mealItemId?: string
    mealItem?: MealItem
    items?: Array<{
      mealItem: MealItem
      calories?: number
      quantity: number
    }>
    calories?: number
    mealType?: MealType
    notes?: string
    eatenAt?: Date
  }
): Promise<void> {
  const entryRef = doc(db, 'users', userId, 'entries', entryId)

  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  }

  if (data.placeId !== undefined) {
    updateData.placeId = data.placeId
  }

  if (data.place) {
    updateData.place = {
      id: data.place.id,
      name: data.place.name,
      type: data.place.type,
      isHome: data.place.isHome,
    }
  }

  if (data.mealItemId !== undefined) {
    updateData.mealItemId = data.mealItemId
  }

  if (data.mealItem) {
    updateData.mealItem = {
      id: data.mealItem.id,
      name: data.mealItem.name,
      defaultCalories: data.mealItem.defaultCalories,
      category: data.mealItem.category,
    }
  }

  if (data.items) {
    const entryItems: EntryItem[] = data.items.map(item => ({
      mealItemId: item.mealItem.id,
      mealItem: {
        id: item.mealItem.id,
        name: item.mealItem.name,
        defaultCalories: item.mealItem.defaultCalories,
        category: item.mealItem.category,
      },
      calories: item.calories ?? item.mealItem.defaultCalories ?? null,
      quantity: item.quantity,
    }))
    updateData.items = entryItems

    // Recalculate total calories
    const totalCalories = data.items.reduce((sum, item) => {
      const itemCalories = item.calories ?? item.mealItem.defaultCalories ?? 0
      return sum + (itemCalories * item.quantity)
    }, 0)
    updateData.calories = totalCalories || null
  } else if (data.calories !== undefined) {
    updateData.calories = data.calories
  }

  if (data.mealType !== undefined) {
    updateData.mealType = data.mealType
  }

  if (data.notes !== undefined) {
    updateData.notes = data.notes || null
  }

  if (data.eatenAt) {
    updateData.eatenAt = Timestamp.fromDate(data.eatenAt)
  }

  await updateDoc(entryRef, updateData)
}

export async function deleteEntry(userId: string, entryId: string): Promise<void> {
  const entryRef = doc(db, 'users', userId, 'entries', entryId)
  await deleteDoc(entryRef)
}

// ============ INSIGHTS ============

// Helper to format date as YYYY-MM-DD in local timezone
function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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

  // Initialize all days using local timezone
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - days + 1 + i)
    const dateStr = formatLocalDate(date)
    dailyData[dateStr] = {
      date: dateStr,
      totalCalories: 0,
      mealCount: 0,
      homeCount: 0,
      outCount: 0,
    }
  }

  // Aggregate entries using local timezone for date comparison
  entries.forEach((entry) => {
    const dateStr = formatLocalDate(entry.eatenAt)
    if (dailyData[dateStr]) {
      dailyData[dateStr].mealCount += 1
      // For multi-item entries, use the total calories; for legacy, use entry calories
      dailyData[dateStr].totalCalories += entry.calories || 0
      if (entry.place.isHome) {
        dailyData[dateStr].homeCount += 1
      } else {
        dailyData[dateStr].outCount += 1
      }
    }
  })

  // Today's summary
  const today = formatLocalDate(new Date())
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
