// =============================================================================
// Data Types
// =============================================================================

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

// =============================================================================
// Component Props
// =============================================================================

export interface InventoryProps {
  /** The list of food items to display */
  foodItems: FoodItem[]
  /** Available storage locations for filtering */
  storageSpaces: StorageSpace[]
  /** Current search query */
  searchQuery?: string
  /** Currently selected storage filter (null = all) */
  activeStorageFilter?: string | null
  /** Called when user searches for items */
  onSearch?: (query: string) => void
  /** Called when user filters by storage location */
  onFilterByStorage?: (storageSpaceId: string | null) => void
  /** Called when user marks an item as used */
  onMarkUsed?: (id: string) => void
  /** Called when user wants to edit an item */
  onEdit?: (id: string) => void
  /** Called when user wants to delete an item */
  onDelete?: (id: string) => void
}
