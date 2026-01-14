// =============================================================================
// Data Types
// =============================================================================

export interface Alert {
  id: string
  foodItemId: string
  foodItemName: string
  message: string
  expirationDate: string
  status: 'unread' | 'read' | 'snoozed' | 'dismissed'
  sentAt: string
  snoozedUntil?: string
}

export interface NotificationSettings {
  enabled: boolean
  reminderDays: number[]
}

// =============================================================================
// Component Props
// =============================================================================

export interface AlertsProps {
  /** The list of alerts to display */
  alerts: Alert[]
  /** User's notification settings */
  settings: NotificationSettings
  /** Called when user marks an item as used from the alert */
  onMarkUsed?: (alertId: string, foodItemId: string) => void
  /** Called when user snoozes an alert */
  onSnooze?: (alertId: string) => void
  /** Called when user dismisses an alert permanently */
  onDismiss?: (alertId: string) => void
  /** Called when user taps an alert to mark it as read */
  onMarkRead?: (alertId: string) => void
  /** Called when user updates notification settings */
  onUpdateSettings?: (settings: NotificationSettings) => void
  /** Called when user opens the settings panel */
  onOpenSettings?: () => void
}
