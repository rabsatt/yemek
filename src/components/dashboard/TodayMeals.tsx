'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, RotateCcw, Pencil, Trash2, MoreVertical, Plus, Coffee, Sun, Sunset, Moon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PlaceTypeIcon } from '@/components/places/PlaceTypeIcon'
import { formatCalories } from '@/lib/utils'
import type { MealEntry, MealType, PlaceType } from '@/types'

interface TodayMealsProps {
  entries: MealEntry[]
  onQuickLog: (entry: MealEntry) => void
  onEdit: (entry: MealEntry) => void
  onDelete: (entryId: string) => void
  onLogNew: (mealType: MealType) => void
  showAddButtons?: boolean
}

interface MealTypeConfig {
  type: MealType
  label: string
  icon: React.ComponentType<{ className?: string }>
  timeRange: string
}

const mealTypeConfig: MealTypeConfig[] = [
  { type: 'BREAKFAST', label: 'Breakfast', icon: Coffee, timeRange: '5am - 11am' },
  { type: 'LUNCH', label: 'Lunch', icon: Sun, timeRange: '11am - 3pm' },
  { type: 'SNACK', label: 'Snack', icon: Sunset, timeRange: 'Anytime' },
  { type: 'DINNER', label: 'Dinner', icon: Moon, timeRange: '5pm - 10pm' },
]

// Helper to get display info for an entry
function getEntryItems(entry: MealEntry) {
  if (entry.items && entry.items.length > 0) {
    return entry.items.map(item => ({
      name: item.mealItem.name,
      calories: (item.calories ?? item.mealItem.defaultCalories ?? 0) * item.quantity,
      quantity: item.quantity,
    }))
  }
  // Legacy single-item entry
  if (entry.mealItem) {
    return [{
      name: entry.mealItem.name,
      calories: entry.calories ?? entry.mealItem.defaultCalories ?? 0,
      quantity: 1,
    }]
  }
  return []
}

function MealTypeSection({
  config,
  entries,
  onQuickLog,
  onEdit,
  onDelete,
  onLogNew,
  showAddButton = true,
}: {
  config: MealTypeConfig
  entries: MealEntry[]
  onQuickLog: (entry: MealEntry) => void
  onEdit: (entry: MealEntry) => void
  onDelete: (entryId: string) => void
  onLogNew: () => void
  showAddButton?: boolean
}) {
  const [expanded, setExpanded] = useState(entries.length > 0)
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<MealEntry | null>(null)

  const Icon = config.icon
  const totalCalories = entries.reduce((sum, entry) => sum + (entry.calories ?? 0), 0)
  const hasEntries = entries.length > 0

  const handleDelete = (entry: MealEntry) => {
    setShowMenu(null)
    setDeleteConfirm(entry)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }

  const handleEdit = (entry: MealEntry) => {
    setShowMenu(null)
    onEdit(entry)
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Meal type header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          hasEntries ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold text-gray-900">{config.label}</div>
          <div className="text-sm text-gray-500">
            {hasEntries
              ? `${entries.length} ${entries.length === 1 ? 'item' : 'items'}`
              : 'No items logged'
            }
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasEntries && (
            <span className="text-sm font-medium text-gray-700">
              {totalCalories} cal
            </span>
          )}
          {hasEntries ? (
            expanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )
          ) : null}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100">
          {entries.map((entry) => {
            const items = getEntryItems(entry)

            return (
              <div key={entry.id} className="border-b border-gray-50 last:border-b-0">
                {/* Entry header with place */}
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50">
                  <PlaceTypeIcon
                    type={entry.place.type as PlaceType}
                    className="w-4 h-4 text-gray-400"
                  />
                  <span className="text-xs text-gray-500 flex-1">{entry.place.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onQuickLog(entry)}
                      className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="Log again"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(showMenu === entry.id ? null : entry.id)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {showMenu === entry.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowMenu(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(entry)}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items list */}
                <div className="px-4 py-2 space-y-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1">
                      <span className="text-gray-800">
                        {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatCalories(item.calories)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Add button */}
          {showAddButton && (
            <button
              onClick={onLogNew}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add {config.label.toLowerCase()}</span>
            </button>
          )}
        </div>
      )}

      {/* Empty state - show add button or just empty text */}
      {!hasEntries && (
        <div className="border-t border-gray-100">
          {showAddButton ? (
            <button
              onClick={onLogNew}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add {config.label.toLowerCase()}</span>
            </button>
          ) : (
            <div className="px-4 py-3 text-center text-sm text-gray-400">
              No {config.label.toLowerCase()} logged
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Entry"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this entry? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export function TodayMeals({ entries, onQuickLog, onEdit, onDelete, onLogNew, showAddButtons = true }: TodayMealsProps) {
  // Group entries by meal type
  const entriesByType = mealTypeConfig.reduce((acc, config) => {
    acc[config.type] = entries.filter(e => e.mealType === config.type)
    return acc
  }, {} as Record<MealType, MealEntry[]>)

  return (
    <div className="space-y-3">
      {mealTypeConfig.map((config) => (
        <MealTypeSection
          key={config.type}
          config={config}
          entries={entriesByType[config.type] || []}
          onQuickLog={onQuickLog}
          onEdit={onEdit}
          onDelete={onDelete}
          onLogNew={() => onLogNew(config.type)}
          showAddButton={showAddButtons}
        />
      ))}
    </div>
  )
}
