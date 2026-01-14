import { Check, Clock, X } from 'lucide-react'
import type { Alert } from '../types'

interface AlertCardProps {
  alert: Alert
  onMarkUsed?: () => void
  onSnooze?: () => void
  onDismiss?: () => void
  onMarkRead?: () => void
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getExpirationLabel(dateString: string): { text: string; urgent: boolean; expired: boolean } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expDate = new Date(dateString)
  expDate.setHours(0, 0, 0, 0)
  const daysUntil = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntil < 0) return { text: 'Expired', urgent: false, expired: true }
  if (daysUntil === 0) return { text: 'Today', urgent: true, expired: false }
  if (daysUntil === 1) return { text: 'Tomorrow', urgent: true, expired: false }
  if (daysUntil <= 3) return { text: `${daysUntil}d left`, urgent: true, expired: false }
  return { text: `${daysUntil}d left`, urgent: false, expired: false }
}

export function AlertCard({
  alert,
  onMarkUsed,
  onSnooze,
  onDismiss,
  onMarkRead,
}: AlertCardProps) {
  const isUnread = alert.status === 'unread'
  const isSnoozed = alert.status === 'snoozed'
  const expiration = getExpirationLabel(alert.expirationDate)

  const handleClick = () => {
    if (isUnread) {
      onMarkRead?.()
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`
        relative px-4 py-3.5
        ${isUnread ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-white dark:bg-slate-800/80'}
        active:bg-stone-50 dark:active:bg-slate-700/80
        transition-colors cursor-pointer
      `}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
      )}

      <div className="flex items-start gap-3">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className={`text-[15px] truncate ${isUnread ? 'font-semibold' : 'font-medium'} text-stone-900 dark:text-white`}>
              {alert.foodItemName}
            </h3>
            <span
              className={`
                flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium
                ${expiration.expired
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : expiration.urgent
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  : 'bg-stone-100 dark:bg-slate-700 text-stone-500 dark:text-slate-400'
                }
              `}
            >
              {expiration.text}
            </span>
          </div>

          <p className="text-sm text-stone-500 dark:text-slate-400 mb-2 line-clamp-2">
            {alert.message}
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 dark:text-slate-500">
              {formatTimeAgo(alert.sentAt)}
            </span>
            {isSnoozed && alert.snoozedUntil && (
              <span className="text-xs text-stone-400 dark:text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Snoozed
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 -mr-1">
          <button
            onClick={(e) => { e.stopPropagation(); onMarkUsed?.() }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            title="Mark as used"
          >
            <Check className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSnooze?.() }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            title="Snooze"
          >
            <Clock className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss?.() }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Dismiss"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
