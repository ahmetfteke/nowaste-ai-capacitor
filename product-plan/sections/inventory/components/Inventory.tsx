import { useState } from 'react'
import { Search, X } from 'lucide-react'
import type { InventoryProps, FoodItem, StorageSpace } from '../types'
import { FoodItemCard } from './FoodItemCard'

function getStorageName(storageSpaceId: string, storageSpaces: StorageSpace[]) {
  const space = storageSpaces.find(s => s.id === storageSpaceId)
  return space?.name || storageSpaceId
}

function categorizeByExpiration(items: FoodItem[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expiringSoon: FoodItem[] = []
  const thisWeek: FoodItem[] = []
  const later: FoodItem[] = []

  items.forEach(item => {
    const expDate = new Date(item.expirationDate)
    const daysUntil = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil <= 2) {
      expiringSoon.push(item)
    } else if (daysUntil <= 7) {
      thisWeek.push(item)
    } else {
      later.push(item)
    }
  })

  return { expiringSoon, thisWeek, later }
}

interface ItemSectionProps {
  title: string
  count: number
  items: FoodItem[]
  storageSpaces: StorageSpace[]
  variant: 'urgent' | 'soon' | 'normal'
  onMarkUsed?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

function ItemSection({ title, count, items, storageSpaces, variant, onMarkUsed, onEdit, onDelete }: ItemSectionProps) {
  if (items.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 px-4 mb-2">
        <h2 className={`text-xs font-semibold uppercase tracking-wider ${
          variant === 'urgent'
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-stone-400 dark:text-slate-500'
        }`}>
          {title}
        </h2>
        <span className={`text-xs px-1.5 py-0.5 rounded ${
          variant === 'urgent'
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
            : 'bg-stone-100 dark:bg-slate-700 text-stone-500 dark:text-slate-400'
        }`}>
          {count}
        </span>
      </div>
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl mx-4 overflow-hidden divide-y divide-stone-100 dark:divide-slate-700/50">
        {items.map(item => (
          <FoodItemCard
            key={item.id}
            item={item}
            storageName={getStorageName(item.storageSpaceId, storageSpaces)}
            isUrgent={variant === 'urgent'}
            onMarkUsed={() => onMarkUsed?.(item.id)}
            onEdit={() => onEdit?.(item.id)}
            onDelete={() => onDelete?.(item.id)}
          />
        ))}
      </div>
    </div>
  )
}

export function Inventory({
  foodItems,
  storageSpaces,
  searchQuery = '',
  activeStorageFilter = null,
  onSearch,
  onFilterByStorage,
  onMarkUsed,
  onEdit,
  onDelete,
}: InventoryProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [localFilter, setLocalFilter] = useState(activeStorageFilter)

  const filteredItems = foodItems
    .filter(item => item.status === 'active')
    .filter(item => item.name.toLowerCase().includes(localSearch.toLowerCase()))
    .filter(item => localFilter ? item.storageSpaceId === localFilter : true)

  const { expiringSoon, thisWeek, later } = categorizeByExpiration(filteredItems)

  const handleSearch = (value: string) => {
    setLocalSearch(value)
    onSearch?.(value)
  }

  const handleFilter = (storageId: string | null) => {
    setLocalFilter(storageId)
    onFilterByStorage?.(storageId)
  }

  const totalItems = filteredItems.length

  return (
    <div className="min-h-full bg-stone-100 dark:bg-slate-900">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-stone-100/95 dark:bg-slate-900/95 backdrop-blur-sm">
        {/* Search */}
        <div className="px-4 pt-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search items..."
              value={localSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 text-[15px] bg-white dark:bg-slate-800 rounded-xl text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 shadow-sm"
            />
            {localSearch && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-stone-400 dark:text-slate-500 hover:text-stone-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleFilter(null)}
              className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                localFilter === null
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-400 shadow-sm'
              }`}
            >
              All
            </button>
            {storageSpaces.map(space => (
              <button
                key={space.id}
                onClick={() => handleFilter(space.id)}
                className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                  localFilter === space.id
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-400 shadow-sm'
                }`}
              >
                {space.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-8">
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-stone-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-stone-400 dark:text-slate-500" />
            </div>
            <p className="text-stone-500 dark:text-slate-400 text-center">
              {localSearch ? 'No items match your search' : 'Your inventory is empty'}
            </p>
            {localSearch && (
              <button
                onClick={() => handleSearch('')}
                className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <ItemSection
              title="Use Soon"
              count={expiringSoon.length}
              items={expiringSoon}
              storageSpaces={storageSpaces}
              variant="urgent"
              onMarkUsed={onMarkUsed}
              onEdit={onEdit}
              onDelete={onDelete}
            />
            <ItemSection
              title="This Week"
              count={thisWeek.length}
              items={thisWeek}
              storageSpaces={storageSpaces}
              variant="soon"
              onMarkUsed={onMarkUsed}
              onEdit={onEdit}
              onDelete={onDelete}
            />
            <ItemSection
              title="Later"
              count={later.length}
              items={later}
              storageSpaces={storageSpaces}
              variant="normal"
              onMarkUsed={onMarkUsed}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </>
        )}
      </div>
    </div>
  )
}
