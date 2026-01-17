'use client'

import { useEffect, useState } from 'react'
import { MapPin, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getPlaces, createPlace } from '@/lib/firestore'
import { Header } from '@/components/layout/Header'
import { SearchInput } from '@/components/ui/SearchInput'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlaceTypeIcon } from '@/components/places/PlaceTypeIcon'
import type { Place, PlaceType } from '@/types'

const placeTypes: { value: PlaceType; label: string }[] = [
  { value: 'HOME', label: 'Home' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'CAFE', label: 'Cafe' },
  { value: 'FAST_FOOD', label: 'Fast Food' },
  { value: 'WORK', label: 'Work' },
  { value: 'OTHER', label: 'Other' },
]

export default function PlacesPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newPlace, setNewPlace] = useState({
    name: '',
    type: 'RESTAURANT' as PlaceType,
    isHome: false,
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (user) {
      fetchPlaces()
    }
  }, [user])

  const fetchPlaces = async () => {
    if (!user) return

    try {
      const data = await getPlaces(user.uid)
      setPlaces(data)
    } catch (error) {
      console.error('Failed to fetch places:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newPlace.name.trim() || !user) return

    setCreating(true)
    try {
      await createPlace(user.uid, newPlace)
      setShowCreate(false)
      setNewPlace({ name: '', type: 'RESTAURANT', isHome: false })
      fetchPlaces()
    } catch (error) {
      console.error('Failed to create place:', error)
    } finally {
      setCreating(false)
    }
  }

  const filteredPlaces = places.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Places" subtitle={`${places.length} saved`} />

      <main className="max-w-lg mx-auto p-4 space-y-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search places..."
        />

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl" />
            ))}
          </div>
        ) : filteredPlaces.length > 0 ? (
          <div className="space-y-3">
            {filteredPlaces.map((place) => (
              <Card key={place.id} className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    place.isHome ? 'bg-primary-100' : 'bg-gray-100'
                  }`}
                >
                  <PlaceTypeIcon
                    type={place.type as PlaceType}
                    className={`w-6 h-6 ${
                      place.isHome ? 'text-primary-600' : 'text-gray-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{place.name}</div>
                  <div className="text-sm text-gray-500">
                    {place.usageCount} {place.usageCount === 1 ? 'meal' : 'meals'} logged
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : search ? (
          <EmptyState
            icon={MapPin}
            title="No places found"
            description={`No places matching "${search}"`}
          />
        ) : (
          <EmptyState
            icon={MapPin}
            title="No places yet"
            description="Add places where you eat to quickly log meals."
            action={
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Add Place
              </Button>
            }
          />
        )}

        {/* Floating add button */}
        {places.length > 0 && (
          <Button
            className="w-full"
            variant="secondary"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Place
          </Button>
        )}
      </main>

      {/* Create place modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add New Place"
      >
        <div className="space-y-4">
          <Input
            label="Place name"
            placeholder="e.g., Chipotle, Mom's house"
            value={newPlace.name}
            onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {placeTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() =>
                    setNewPlace({
                      ...newPlace,
                      type: type.value,
                      isHome: type.value === 'HOME',
                    })
                  }
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    newPlace.type === type.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <PlaceTypeIcon
                    type={type.value}
                    className="w-5 h-5 mx-auto mb-1"
                  />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={!newPlace.name.trim() || creating}
          >
            {creating ? 'Creating...' : 'Add Place'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
