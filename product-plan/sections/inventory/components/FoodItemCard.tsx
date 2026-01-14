import { Check, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import type { FoodItem } from '../types'

interface FoodItemCardProps {
  item: FoodItem
  storageName: string
  isUrgent?: boolean
  onMarkUsed?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const expDate = new Date(dateString)
  expDate.setHours(0, 0, 0, 0)

  if (expDate.getTime() === today.getTime()) return 'Today'
  if (expDate.getTime() === tomorrow.getTime()) return 'Tomorrow'

  const daysUntil = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0) return 'Expired'
  if (daysUntil <= 7) return `${daysUntil}d left`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getDaysUntil(dateString: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expDate = new Date(dateString)
  return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function FoodItemCard({
  item,
  storageName,
  isUrgent,
  onMarkUsed,
  onEdit,
  onDelete,
}: FoodItemCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const daysUntil = getDaysUntil(item.expirationDate)
  const isExpired = daysUntil < 0

  return (
    <div className="group relative">
      <div
        className={`
          flex items-center gap-3 px-4 py-3
          bg-white dark:bg-slate-800/80
          active:bg-stone-50 dark:active:bg-slate-700/80
          transition-colors
        `}
      >
        {/* Quick use button */}
        <button
          onClick={onMarkUsed}
          className={`
            flex-shrink-0 w-10 h-10 rounded-full
            flex items-center justify-center
            transition-all active:scale-95
            ${isUrgent || isExpired
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
              : 'bg-stone-100 dark:bg-slate-700 text-stone-400 dark:text-slate-500'
            }
          `}
        >
          <Check className="w-5 h-5" />
        </button>

        {/* Item info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h3 className="text-[15px] font-medium text-stone-900 dark:text-white truncate">
              {item.name}
            </h3>
            <span className="text-xs text-stone-400 dark:text-slate-500 flex-shrink-0">
              {item.quantity} {item.unit}
            </span>
          </div>
          <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">
            {storageName}
          </p>
        </div>

        {/* Expiration badge */}
        <div
          className={`
            flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium
            ${isExpired
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : isUrgent
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
              : 'bg-stone-100 dark:bg-slate-700 text-stone-500 dark:text-slate-400'
            }
          `}
        >
          {formatDate(item.expirationDate)}
        </div>

        {/* More menu */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex-shrink-0 w-8 h-8 -mr-2 flex items-center justify-center text-stone-400 dark:text-slate-500 hover:text-stone-600 dark:hover:text-slate-300 transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-4 top-full mt-1 z-20 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-stone-200 dark:border-slate-700 py-1 min-w-[140px]">
            <button
              onClick={() => { onEdit?.(); setShowMenu(false) }}
              className="w-full px-4 py-2.5 text-left text-sm text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-700 transition-colors"
            >
              Edit item
            </button>
            <button
              onClick={() => { onDelete?.(); setShowMenu(false) }}
              className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}
