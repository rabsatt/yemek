'use client'

import { useState } from 'react'
import { RotateCcw, Pencil, Trash2, MoreVertical, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PlaceTypeIcon } from '@/components/places/PlaceTypeIcon'
import { formatDate, formatCalories } from '@/lib/utils'
import type { MealEntry, PlaceType } from '@/types'

interface RecentMealsProps {
  entries: MealEntry[]
  onQuickLog: (entry: MealEntry) => void
  onEdit: (entry: MealEntry) => void
  onDelete: (entryId: string) => void
}

// Helper to get display name for entries (works with both legacy and multi-item)
function getEntryDisplayName(entry: MealEntry): string {
  if (entry.items && entry.items.length > 0) {
    if (entry.items.length === 1) {
      const item = entry.items[0]
      return item.quantity > 1
        ? `${item.mealItem.name} (x${item.quantity})`
        : item.mealItem.name
    }
    return `${entry.items[0].mealItem.name} +${entry.items.length - 1} more`
  }
  // Legacy single-item entry
  return entry.mealItem?.name || 'Unknown meal'
}

// Helper to get full item list for display
function getEntryItemsList(entry: MealEntry): string[] {
  if (entry.items && entry.items.length > 0) {
    return entry.items.map(item =>
      item.quantity > 1
        ? `${item.mealItem.name} (x${item.quantity})`
        : item.mealItem.name
    )
  }
  return entry.mealItem ? [entry.mealItem.name] : []
}

export function RecentMeals({ entries, onQuickLog, onEdit, onDelete }: RecentMealsProps) {
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<MealEntry | null>(null)
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  if (entries.length === 0) {
    return null
  }

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
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Recent Meals</h2>
      {entries.map((entry) => {
        const itemsList = getEntryItemsList(entry)
        const hasMultipleItems = itemsList.length > 1
        const isExpanded = expandedEntry === entry.id

        return (
          <Card key={entry.id} className="relative">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  entry.place.isHome ? 'bg-primary-100' : 'bg-gray-100'
                }`}
              >
                <PlaceTypeIcon
                  type={entry.place.type as PlaceType}
                  className={`w-5 h-5 ${
                    entry.place.isHome ? 'text-primary-600' : 'text-gray-600'
                  }`}
                />
              </div>
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => hasMultipleItems && setExpandedEntry(isExpanded ? null : entry.id)}
              >
                <div className="font-medium truncate">
                  {getEntryDisplayName(entry)}
                </div>
                <div className="text-sm text-gray-500">
                  {entry.place.name} · {formatDate(entry.eatenAt)}
                </div>
                {hasMultipleItems && (
                  <button
                    className="text-xs text-primary-600 mt-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedEntry(isExpanded ? null : entry.id)
                    }}
                  >
                    {isExpanded ? 'Hide items' : `Show all ${itemsList.length} items`}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {formatCalories(entry.calories)}
                </span>
                <button
                  onClick={() => onQuickLog(entry)}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Log again"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(showMenu === entry.id ? null : entry.id)}
                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {showMenu === entry.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(entry)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded items list */}
            {isExpanded && hasMultipleItems && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <ul className="space-y-1">
                  {entry.items?.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.mealItem.name}
                      </span>
                      <span className="text-gray-500">
                        {formatCalories((item.calories ?? item.mealItem.defaultCalories ?? 0) * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )
      })}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Entry"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this meal entry? This action cannot be undone.
          </p>
          {deleteConfirm && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="font-medium">{getEntryDisplayName(deleteConfirm)}</div>
              <div className="text-sm text-gray-500">
                {deleteConfirm.place.name} · {formatDate(deleteConfirm.eatenAt)}
              </div>
            </div>
          )}
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
