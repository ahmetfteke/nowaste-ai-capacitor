// =============================================================================
// Core Entities
// =============================================================================

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

export interface StorageSpace {
  id: string
  name: string
  icon: string
}

export interface FoodItem {
  id: string
  name: string
  quantity: number
  unit: string
  expirationDate: string
  storageSpaceId: string
  status: 'active' | 'used'
  addedAt: string
}

export interface Capture {
  id: string
  imageUrl: string
  type: 'groceries' | 'receipt'
  status: 'processing' | 'completed' | 'failed'
  createdAt: string
}

export interface ExtractedItem {
  id: string
  name: string
  quantity: number
  unit: string
  expirationDate: string
  storageSpaceId: string
  /** AI confidence score (0-1) for the extraction accuracy */
  confidence: number
}

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
