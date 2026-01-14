// =============================================================================
// Data Types
// =============================================================================

export interface StorageSpace {
  id: string
  name: string
  icon: string
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

// =============================================================================
// Component Props
// =============================================================================

export interface CaptureMethodProps {
  /** Called when user wants to take a photo with camera */
  onCapturePhoto?: () => void
  /** Called when user wants to select from photo gallery */
  onSelectFromGallery?: () => void
  /** Called when user wants to add items manually */
  onManualEntry?: () => void
}

export interface CaptureReviewProps {
  /** The list of items extracted by AI, pending review */
  extractedItems: ExtractedItem[]
  /** Available storage locations */
  storageSpaces: StorageSpace[]
  /** Called when user edits an item's details */
  onEditItem?: (id: string, updates: Partial<ExtractedItem>) => void
  /** Called when user removes an item from the list */
  onRemoveItem?: (id: string) => void
  /** Called when user wants to add another item manually */
  onAddItem?: () => void
  /** Called when user confirms and adds all items to inventory */
  onConfirm?: () => void
  /** Called when user wants to go back and capture again */
  onBack?: () => void
}
