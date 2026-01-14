import { useState } from 'react'
import { Bell, Settings, BellOff } from 'lucide-react'
import type { AlertsProps, Alert } from '../types'
import { AlertCard } from './AlertCard'

function categorizeByDate(alerts: Alert[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const todayAlerts: Alert[] = []
  const yesterdayAlerts: Alert[] = []
  const thisWeekAlerts: Alert[] = []
  const olderAlerts: Alert[] = []

  alerts.forEach(alert => {
    const sentDate = new Date(alert.sentAt)
    sentDate.setHours(0, 0, 0, 0)

    if (sentDate.getTime() === today.getTime()) {
      todayAlerts.push(alert)
    } else if (sentDate.getTime() === yesterday.getTime()) {
      yesterdayAlerts.push(alert)
    } else if (sentDate > weekAgo) {
      thisWeekAlerts.push(alert)
    } else {
      olderAlerts.push(alert)
    }
  })

  return { todayAlerts, yesterdayAlerts, thisWeekAlerts, olderAlerts }
}

interface AlertSectionProps {
  title: string
  alerts: Alert[]
  onMarkUsed?: (alertId: string, foodItemId: string) => void
  onSnooze?: (alertId: string) => void
  onDismiss?: (alertId: string) => void
  onMarkRead?: (alertId: string) => void
}

function AlertSection({ title, alerts, onMarkUsed, onSnooze, onDismiss, onMarkRead }: AlertSectionProps) {
  if (alerts.length === 0) return null

  const unreadCount = alerts.filter(a => a.status === 'unread').length

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 px-4 mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-slate-500">
          {title}
        </h2>
        {unreadCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            {unreadCount} new
          </span>
        )}
      </div>
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl mx-4 overflow-hidden divide-y divide-stone-100 dark:divide-slate-700/50">
        {alerts.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onMarkUsed={() => onMarkUsed?.(alert.id, alert.foodItemId)}
            onSnooze={() => onSnooze?.(alert.id)}
            onDismiss={() => onDismiss?.(alert.id)}
            onMarkRead={() => onMarkRead?.(alert.id)}
          />
        ))}
      </div>
    </div>
  )
}

export function Alerts({
  alerts,
  settings,
  onMarkUsed,
  onSnooze,
  onDismiss,
  onMarkRead,
  onUpdateSettings,
  onOpenSettings,
}: AlertsProps) {
  const [showSettings, setShowSettings] = useState(false)

  // Filter out dismissed alerts
  const activeAlerts = alerts.filter(a => a.status !== 'dismissed')
  const { todayAlerts, yesterdayAlerts, thisWeekAlerts, olderAlerts } = categorizeByDate(activeAlerts)

  const totalUnread = activeAlerts.filter(a => a.status === 'unread').length
  const hasAlerts = activeAlerts.length > 0

  const handleOpenSettings = () => {
    setShowSettings(true)
    onOpenSettings?.()
  }

  const handleToggleNotifications = () => {
    onUpdateSettings?.({ ...settings, enabled: !settings.enabled })
  }

  return (
    <div className="min-h-full bg-stone-100 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-stone-100/95 dark:bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-stone-900 dark:text-white">
              Notifications
            </h1>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                {totalUnread}
              </span>
            )}
          </div>
          <button
            onClick={handleOpenSettings}
            className="w-10 h-10 -mr-2 flex items-center justify-center text-stone-500 dark:text-slate-400 hover:text-stone-700 dark:hover:text-slate-200 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications disabled banner */}
        {!settings.enabled && (
          <div className="mx-4 mb-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
            <div className="flex items-center gap-3">
              <BellOff className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Notifications are off
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  You won't receive alerts about expiring items
                </p>
              </div>
              <button
                onClick={handleToggleNotifications}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              >
                Turn on
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pb-8">
        {!hasAlerts ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-stone-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-stone-400 dark:text-slate-500" />
            </div>
            <p className="text-stone-500 dark:text-slate-400 text-center">
              No notifications yet
            </p>
            <p className="text-sm text-stone-400 dark:text-slate-500 text-center mt-1">
              We'll let you know when items are about to expire
            </p>
          </div>
        ) : (
          <>
            <AlertSection
              title="Today"
              alerts={todayAlerts}
              onMarkUsed={onMarkUsed}
              onSnooze={onSnooze}
              onDismiss={onDismiss}
              onMarkRead={onMarkRead}
            />
            <AlertSection
              title="Yesterday"
              alerts={yesterdayAlerts}
              onMarkUsed={onMarkUsed}
              onSnooze={onSnooze}
              onDismiss={onDismiss}
              onMarkRead={onMarkRead}
            />
            <AlertSection
              title="This Week"
              alerts={thisWeekAlerts}
              onMarkUsed={onMarkUsed}
              onSnooze={onSnooze}
              onDismiss={onDismiss}
              onMarkRead={onMarkRead}
            />
            <AlertSection
              title="Older"
              alerts={olderAlerts}
              onMarkUsed={onMarkUsed}
              onSnooze={onSnooze}
              onDismiss={onDismiss}
              onMarkRead={onMarkRead}
            />
          </>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowSettings(false)}
          />
          <div className="fixed inset-x-4 bottom-4 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-4 py-4 border-b border-stone-100 dark:border-slate-700">
              <h2 className="text-base font-semibold text-stone-900 dark:text-white">
                Notification Settings
              </h2>
            </div>
            <div className="p-4 space-y-4">
              {/* Enable notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-white">
                    Enable notifications
                  </p>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    Get alerts before items expire
                  </p>
                </div>
                <button
                  onClick={handleToggleNotifications}
                  className={`
                    relative w-11 h-6 rounded-full transition-colors
                    ${settings.enabled
                      ? 'bg-emerald-500 dark:bg-emerald-600'
                      : 'bg-stone-300 dark:bg-slate-600'
                    }
                  `}
                >
                  <span
                    className={`
                      absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform
                      ${settings.enabled ? 'left-[22px]' : 'left-0.5'}
                    `}
                  />
                </button>
              </div>

              {/* Reminder days */}
              <div>
                <p className="text-sm font-medium text-stone-900 dark:text-white mb-2">
                  Remind me before expiration
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 5, 7].map(day => {
                    const isSelected = settings.reminderDays.includes(day)
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          const newDays = isSelected
                            ? settings.reminderDays.filter(d => d !== day)
                            : [...settings.reminderDays, day].sort((a, b) => a - b)
                          onUpdateSettings?.({ ...settings, reminderDays: newDays })
                        }}
                        className={`
                          px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${isSelected
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : 'bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-slate-400'
                          }
                        `}
                      >
                        {day}d
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-stone-100 dark:border-slate-700">
              <button
                onClick={() => setShowSettings(false)}
                className="w-full py-2.5 text-sm font-medium text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
