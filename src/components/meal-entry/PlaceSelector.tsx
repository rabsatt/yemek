'use client'

import { useState, useEffect } from 'react'
import { Plus, Star } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getPlaces, createPlace } from '@/lib/firestore'
import { SearchInput } from '@/components/ui/SearchInput'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { PlaceTypeIcon } from '@/components/places/PlaceTypeIcon'
import type { Place, PlaceType } from '@/types'

interface PlaceSelectorProps {
  onSelect: (place: Place) => void
}

const placeTypes: { value: PlaceType; label: string }[] = [
  { value: 'HOME', label: 'Home' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'CAFE', label: 'Cafe' },
  { value: 'FAST_FOOD', label: 'Fast Food' },
  { value: 'WORK', label: 'Work' },
  { value: 'OTHER', label: 'Other' },
]

export function PlaceSelector({ onSelect }: PlaceSelectorProps) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newPlace, setNewPlace] = useState({ name: '', type: 'RESTAURANT' as PlaceType, isHome: false })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (user) {
      fetchPlaces()
    }
  }, [user, search])

  const fetchPlaces = async () => {
    if (!user) return

    try {
      const data = await getPlaces(user.uid, search || undefined)
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
      const place = await createPlace(user.uid, newPlace)
      setShowCreate(false)
      setNewPlace({ name: '', type: 'RESTAURANT', isHome: false })
      onSelect(place)
    } catch (error) {
      console.error('Failed to create place:', error)
    } finally {
      setCreating(false)
    }
  }

  const filteredPlaces = places.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  // Separate home place from others
  const homePlace = filteredPlaces.find((p) => p.isHome)
  const otherPlaces = filteredPlaces.filter((p) => !p.isHome)

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 bg-white sticky top-0">
        <h2 className="text-lg font-semibold mb-3">Where did you eat?</h2>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search places..."
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : (
          <>
            {/* Home place (always show first if exists) */}
            {homePlace && (
              <Card
                variant="interactive"
                onClick={() => onSelect(homePlace)}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <PlaceTypeIcon type="HOME" className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    {homePlace.name}
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
              </Card>
            )}

            {/* Other places sorted by usage */}
            {otherPlaces.length > 0 && (
              <div className="space-y-2">
                {!homePlace && (
                  <p className="text-sm text-gray-500 font-medium">Recent places</p>
                )}
                {otherPlaces.map((place) => (
                  <Card
                    key={place.id}
                    variant="interactive"
                    onClick={() => onSelect(place)}
                    className="flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <PlaceTypeIcon
                        type={place.type as PlaceType}
                        className="w-5 h-5 text-gray-600"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{place.name}</div>
                      {place.usageCount > 0 && (
                        <div className="text-sm text-gray-500">
                          {place.usageCount} {place.usageCount === 1 ? 'meal' : 'meals'} logged
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Add new place button */}
            <Button
              variant="secondary"
              className="w-full mt-4"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add new place
            </Button>
          </>
        )}
      </div>

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
