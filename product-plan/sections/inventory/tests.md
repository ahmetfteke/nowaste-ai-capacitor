# Test Instructions: Inventory

These test-writing instructions are **framework-agnostic**. Adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, React Testing Library, RSpec, Minitest, PHPUnit, etc.).

## Overview

The Inventory section displays all food items organized by expiration urgency. Users can search, filter by storage location, and perform quick actions (mark used, edit, delete) on items.

---

## User Flow Tests

### Flow 1: Browse Inventory

**Scenario:** User views their food inventory

#### Success Path

**Setup:**
- User has 10 food items across different storage locations
- Items have varying expiration dates

**Steps:**
1. User navigates to Inventory section
2. User sees items grouped into sections

**Expected Results:**
- [ ] "Use Soon" section shows items expiring within 2 days (amber highlighting)
- [ ] "This Week" section shows items expiring in 3-7 days
- [ ] "Later" section shows items expiring after 7 days
- [ ] Each section shows item count badge
- [ ] Items display name, quantity, unit, storage location, and expiration

---

### Flow 2: Search for Item

**Scenario:** User searches for a specific item by name

#### Success Path

**Setup:**
- User has multiple items including "Whole Milk"

**Steps:**
1. User taps the search bar (placeholder: "Search items...")
2. User types "milk"
3. List filters in real-time
4. User sees matching items
5. User taps X button to clear search

**Expected Results:**
- [ ] Search is case-insensitive ("milk" finds "Whole Milk")
- [ ] Filtering happens as user types (real-time)
- [ ] Only matching items are shown
- [ ] X button appears when search has text
- [ ] Clearing search restores full list

#### No Results Path

**Setup:**
- User searches for non-existent item

**Steps:**
1. User types "pizza123xyz" in search
2. No items match

**Expected Results:**
- [ ] Shows empty state: "No items match your search"
- [ ] Shows "Clear search" link/button
- [ ] Clicking clear restores full list

---

### Flow 3: Filter by Storage Location

**Scenario:** User filters to see only items in a specific location

#### Success Path

**Setup:**
- User has items in Fridge, Freezer, Pantry, Counter

**Steps:**
1. User sees filter pills: "All", "Fridge", "Freezer", "Pantry", "Counter"
2. "All" is selected by default (dark background)
3. User taps "Fridge" pill
4. "Fridge" becomes selected (dark background)
5. Only fridge items are shown
6. User taps "All" to remove filter

**Expected Results:**
- [ ] Filter pills are horizontally scrollable
- [ ] Selected pill has dark background, white text
- [ ] Unselected pills have white background
- [ ] Filtering is instant
- [ ] Item counts update based on filter
- [ ] Filter persists while searching (combined filtering)

---

### Flow 4: Mark Item as Used

**Scenario:** User marks a food item as consumed/used

#### Success Path

**Setup:**
- User has item "Greek Yogurt" in inventory

**Steps:**
1. User sees circular checkmark button on item row
2. User taps checkmark button
3. Item is marked as used

**Expected Results:**
- [ ] `onMarkUsed` callback is called with item ID
- [ ] Item disappears from active inventory
- [ ] Section counts update
- [ ] If section becomes empty, section header hides

---

### Flow 5: Edit Item

**Scenario:** User wants to modify item details

#### Success Path

**Setup:**
- User has item "Chicken Breast" with incorrect expiration

**Steps:**
1. User taps three-dot menu button on item row
2. Dropdown appears with "Edit item" and "Delete" options
3. User taps "Edit item"
4. (Edit form opens - implementation specific)

**Expected Results:**
- [ ] Three-dot menu opens dropdown
- [ ] Clicking outside dropdown closes it
- [ ] "Edit item" option triggers `onEdit` callback with item ID
- [ ] Dropdown closes after selection

---

### Flow 6: Delete Item

**Scenario:** User wants to remove an item from inventory

#### Success Path

**Setup:**
- User has item they want to delete

**Steps:**
1. User taps three-dot menu on item
2. User taps "Delete" (red text)
3. (Optional: confirmation dialog)
4. Item is deleted

**Expected Results:**
- [ ] "Delete" option has red text (warning style)
- [ ] `onDelete` callback is called with item ID
- [ ] Item removed from list
- [ ] If last item in section, section hides
- [ ] If last item overall, empty state shows

---

## Empty State Tests

### No Items in Inventory

**Scenario:** User has empty inventory (first-time or all used)

**Setup:**
- `foodItems` array is empty

**Expected Results:**
- [ ] Shows empty state with icon
- [ ] Shows message: "Your inventory is empty"
- [ ] No search bar X button (search is empty)
- [ ] Filter pills still visible but selection doesn't change display

### No Items After Search

**Scenario:** Search returns no results

**Setup:**
- Search query doesn't match any items

**Expected Results:**
- [ ] Shows "No items match your search"
- [ ] Shows "Clear search" button
- [ ] Clicking clear shows all items again

### No Items in Filtered Storage

**Scenario:** User filters to storage location with no items

**Setup:**
- User has items but none in "Pantry"

**Steps:**
1. User taps "Pantry" filter

**Expected Results:**
- [ ] Shows empty state appropriate for filtered view
- [ ] User can switch filters or clear to see items

---

## Component Interaction Tests

### Inventory Component

**Renders correctly:**
- [ ] Shows search bar with placeholder "Search items..."
- [ ] Shows filter pills with "All" selected
- [ ] Groups items into "Use Soon", "This Week", "Later" sections
- [ ] Shows section headers with count badges
- [ ] Renders FoodItemCard for each item

**Search interactions:**
- [ ] Typing in search calls `onSearch` with query
- [ ] Clearing search calls `onSearch` with empty string
- [ ] Search input is controlled (value matches state)

**Filter interactions:**
- [ ] Tapping filter pill calls `onFilterByStorage`
- [ ] Tapping "All" calls `onFilterByStorage(null)`
- [ ] Selected pill has correct styling

### FoodItemCard Component

**Renders correctly:**
- [ ] Shows item name (e.g., "Greek Yogurt")
- [ ] Shows quantity and unit (e.g., "2 cups")
- [ ] Shows storage location name (e.g., "Fridge")
- [ ] Shows expiration badge with formatted date

**Expiration badge styling:**
- [ ] Expired items: red badge with "Expired"
- [ ] Expiring today: amber badge with "Today"
- [ ] Expiring tomorrow: amber badge with "Tomorrow"
- [ ] Expiring within week: neutral badge with "Xd left"
- [ ] Later: neutral badge with date (e.g., "Mar 10")

**Interactions:**
- [ ] Checkmark button calls `onMarkUsed`
- [ ] Three-dot button opens dropdown menu
- [ ] "Edit item" calls `onEdit`
- [ ] "Delete" calls `onDelete`
- [ ] Clicking outside dropdown closes it

---

## Edge Cases

- [ ] Very long item name truncates with ellipsis
- [ ] Handles items with same expiration date
- [ ] Works with 1 item and 100+ items
- [ ] Combined search + filter works correctly
- [ ] Handles rapid filter changes
- [ ] Sticky header stays visible when scrolling
- [ ] Transition from populated to empty (delete last item)

---

## Accessibility Checks

- [ ] Search input has accessible label
- [ ] Filter pills are keyboard accessible
- [ ] Dropdown menu is keyboard navigable
- [ ] Focus management when dropdown opens/closes
- [ ] Color contrast meets WCAG standards
- [ ] Screen reader announces section counts

---

## Sample Test Data

```typescript
// Example food items
const mockFoodItems = [
  {
    id: "item-001",
    name: "Greek Yogurt",
    quantity: 2,
    unit: "cups",
    expirationDate: "2024-02-08", // Use Soon
    storageSpaceId: "fridge",
    status: "active",
    addedAt: "2024-02-01"
  },
  {
    id: "item-002",
    name: "Whole Milk",
    quantity: 1,
    unit: "gallon",
    expirationDate: "2024-02-14", // This Week
    storageSpaceId: "fridge",
    status: "active",
    addedAt: "2024-02-02"
  },
  {
    id: "item-003",
    name: "Frozen Pizza",
    quantity: 2,
    unit: "boxes",
    expirationDate: "2024-06-30", // Later
    storageSpaceId: "freezer",
    status: "active",
    addedAt: "2024-02-04"
  }
];

const mockStorageSpaces = [
  { id: "fridge", name: "Fridge", icon: "thermometer-snowflake" },
  { id: "freezer", name: "Freezer", icon: "snowflake" },
  { id: "pantry", name: "Pantry", icon: "warehouse" },
  { id: "counter", name: "Counter", icon: "layout-grid" }
];

// Empty inventory
const mockEmptyItems = [];

// Single item (edge case)
const mockSingleItem = [mockFoodItems[0]];
```

---

## Notes for Test Implementation

- Mock date functions for consistent expiration testing
- Test each expiration category (expired, today, tomorrow, week, later)
- Verify grouping logic puts items in correct sections
- Test search and filter independently, then combined
- Ensure callbacks receive correct item IDs
- Test dropdown menu open/close behavior
- Verify empty states appear at appropriate times
