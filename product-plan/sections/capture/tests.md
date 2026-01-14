# Test Instructions: Capture

These test-writing instructions are **framework-agnostic**. Adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, React Testing Library, RSpec, Minitest, PHPUnit, etc.).

## Overview

The Capture section allows users to add food items to their inventory via photo capture, gallery selection, or manual entry. The main screen presents three options, and all paths lead to a review flow before adding items to inventory.

---

## User Flow Tests

### Flow 1: Photo Capture

**Scenario:** User wants to add groceries by taking a photo

#### Success Path

**Setup:**
- User is on the Capture screen
- Camera permissions are granted

**Steps:**
1. User sees the Capture screen with heading "Add Items"
2. User sees three options: "Take Photo", "Choose from Gallery", "Add Manually"
3. User taps the "Take Photo" button (should be visually accented)
4. Camera interface opens
5. User takes photo of groceries
6. Loading state shows while AI processes
7. Review screen shows extracted items

**Expected Results:**
- [ ] "Take Photo" button has visual accent (ring/highlight)
- [ ] Camera opens when button is tapped
- [ ] Loading indicator appears during processing
- [ ] Extracted items display on review screen
- [ ] Each item shows name, quantity, expiration date, storage location

#### Failure Path: Camera Permission Denied

**Setup:**
- User has denied camera permissions

**Steps:**
1. User taps "Take Photo" button
2. System requests camera permission (or shows denied state)

**Expected Results:**
- [ ] Error message explains camera access is needed
- [ ] User can navigate to settings or try alternative method
- [ ] App doesn't crash or show blank screen

#### Failure Path: AI Cannot Extract Items

**Setup:**
- User takes photo that AI cannot process (e.g., blurry, non-food)

**Steps:**
1. User takes photo
2. AI processing completes with no items detected

**Expected Results:**
- [ ] Error message shows: "Couldn't detect any items" or similar
- [ ] User can try again with new photo
- [ ] User can switch to manual entry

---

### Flow 2: Gallery Selection

**Scenario:** User wants to add items from an existing photo

#### Success Path

**Setup:**
- User is on the Capture screen
- User has photos in their gallery

**Steps:**
1. User taps "Choose from Gallery" button
2. Photo picker opens
3. User selects an image
4. Loading state shows while AI processes
5. Review screen shows extracted items

**Expected Results:**
- [ ] Photo picker opens with user's images
- [ ] Selected image is processed by AI
- [ ] Same review flow as photo capture

---

### Flow 3: Manual Entry

**Scenario:** User wants to type in items manually

#### Success Path

**Setup:**
- User is on the Capture screen

**Steps:**
1. User taps "Add Manually" button
2. Review screen opens with empty item form
3. User fills in item details:
   - Name (e.g., "Greek Yogurt")
   - Quantity (e.g., "2")
   - Unit (e.g., "cups")
   - Expiration date
   - Storage location (Fridge/Freezer/Pantry/Counter)
4. User can add additional items
5. User taps "Add to Inventory" button

**Expected Results:**
- [ ] Review screen opens immediately (no AI processing)
- [ ] Form fields are editable
- [ ] Storage location dropdown shows all options
- [ ] User can add multiple items
- [ ] Confirmation adds all items to inventory

#### Failure Path: Validation Error

**Setup:**
- User tries to submit without required fields

**Steps:**
1. User leaves name field empty
2. User taps "Add to Inventory"

**Expected Results:**
- [ ] Validation error shows for required field
- [ ] Form is not submitted
- [ ] Focus moves to invalid field

---

### Flow 4: Review and Edit Extracted Items

**Scenario:** User reviews AI-extracted items and makes corrections

**Setup:**
- AI has extracted items from a photo
- User is on review screen

**Steps:**
1. User sees list of extracted items
2. User taps an item to edit
3. User changes the name (e.g., "Milk" → "Whole Milk")
4. User changes expiration date
5. User removes an incorrect item
6. User adds a missing item manually
7. User taps "Add to Inventory"

**Expected Results:**
- [ ] All extracted items are editable
- [ ] Changes persist when editing
- [ ] Removed items disappear from list
- [ ] Added items appear in list
- [ ] All items (edited, unchanged, added) go to inventory on confirm

---

## Empty State Tests

### No Items Extracted

**Scenario:** AI processes image but finds no food items

**Setup:**
- User takes photo of non-food items

**Expected Results:**
- [ ] Shows message like "No items detected"
- [ ] Offers options to try again or add manually
- [ ] Doesn't show empty list

### Review Screen With All Items Removed

**Scenario:** User removes all extracted items

**Setup:**
- User has removed all items from review list

**Expected Results:**
- [ ] Shows empty state message
- [ ] CTA to add item manually
- [ ] "Add to Inventory" button is disabled or hidden

---

## Component Interaction Tests

### CaptureMethod Component

**Renders correctly:**
- [ ] Displays heading "Add Items"
- [ ] Displays subtext about snapping photo
- [ ] Shows three method cards with icons
- [ ] "Take Photo" card has accent styling
- [ ] Tip box shows at bottom

**User interactions:**
- [ ] Clicking "Take Photo" calls `onCapturePhoto` callback
- [ ] Clicking "Choose from Gallery" calls `onSelectFromGallery` callback
- [ ] Clicking "Add Manually" calls `onManualEntry` callback

---

## Edge Cases

- [ ] Very long item name is truncated or wrapped appropriately
- [ ] Handles special characters in item names
- [ ] Works with 1 item and 20+ items on review screen
- [ ] Handles rapid taps on buttons (debouncing)
- [ ] Preserves data if user navigates away and returns
- [ ] Handles slow network when uploading image

---

## Accessibility Checks

- [ ] All buttons are keyboard accessible
- [ ] Form fields have associated labels
- [ ] Error messages are announced to screen readers
- [ ] Focus management after camera/picker closes
- [ ] Icons have appropriate alt text or aria-labels

---

## Sample Test Data

Use the data from `sample-data.json` or create variations:

```typescript
// Example extracted items from AI
const mockExtractedItems = [
  {
    id: "ext-001",
    name: "Whole Milk",
    quantity: 1,
    unit: "gallon",
    expirationDate: "2024-02-18",
    storageSpaceId: "fridge",
    confidence: 0.95
  },
  {
    id: "ext-002",
    name: "Baby Spinach",
    quantity: 1,
    unit: "bag",
    expirationDate: "2024-02-12",
    storageSpaceId: "fridge",
    confidence: 0.92
  }
];

// Example storage spaces
const mockStorageSpaces = [
  { id: "fridge", name: "Fridge", icon: "thermometer-snowflake" },
  { id: "freezer", name: "Freezer", icon: "snowflake" },
  { id: "pantry", name: "Pantry", icon: "warehouse" },
  { id: "counter", name: "Counter", icon: "layout-grid" }
];

// Empty state
const mockNoItems = [];

// Error response
const mockAIError = {
  success: false,
  message: "Could not process image"
};
```

---

## Notes for Test Implementation

- Mock camera and photo picker APIs for unit tests
- Test AI integration separately with mock responses
- Verify callbacks are called with correct arguments
- Test loading states appear and disappear correctly
- Ensure error boundaries catch and display errors gracefully
- Test both light and dark mode if applicable
