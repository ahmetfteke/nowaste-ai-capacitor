# Milestone 3: Inventory

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) and Milestone 2 (Capture) complete

---

## About These Instructions

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Data model definitions (TypeScript types and sample data)
- UI/UX specifications (user flows, requirements, screenshots)
- Design system tokens (colors, typography, spacing)
- Test-writing instructions for each section (for TDD approach)

**What you need to build:**
- Backend API endpoints and database schema
- Authentication and authorization
- Data fetching and state management
- Business logic and validation
- Integration of the provided UI components with real data

**Important guidelines:**
- **DO NOT** redesign or restyle the provided components — use them as-is
- **DO** wire up the callback props to your routing and API calls
- **DO** replace sample data with real data from your backend
- **DO** implement proper error handling and loading states
- **DO** implement empty states when no records exist (first-time users, after deletions)
- **DO** use test-driven development — write tests first using `tests.md` instructions
- The components are props-based and ready to integrate — focus on the backend and data layer

---

## Goal

Implement the Inventory feature — View, edit, and manage your food items with their estimated expiration dates.

## Overview

The main view of all food items in the user's inventory, organized by expiration urgency. Users can search, filter by storage location, and take quick actions on items.

**Key Functionality:**
- View all items grouped by expiration (Use Soon, This Week, Later)
- Search items by name
- Filter items by storage location (Fridge, Freezer, Pantry, Counter)
- Mark an item as used (removes from inventory)
- Edit item details
- Delete an item from inventory

## Recommended Approach: Test-Driven Development

Before implementing this section, **write tests first** based on the test specifications provided.

See `product-plan/sections/inventory/tests.md` for detailed test-writing instructions including:
- Key user flows to test (success and failure paths)
- Specific UI elements, button labels, and interactions to verify
- Expected behaviors and assertions

**TDD Workflow:**
1. Read `tests.md` and write failing tests for the key user flows
2. Implement the feature to make tests pass
3. Refactor while keeping tests green

## What to Implement

### Components

Copy the section components from `product-plan/sections/inventory/components/`:

- `Inventory.tsx` — Main inventory view with search, filters, and grouped items
- `FoodItemCard.tsx` — Individual item card with quick actions

### Data Layer

The components expect these data shapes:

```typescript
interface StorageSpace {
  id: string
  name: string
  icon: string
}

interface FoodItem {
  id: string
  name: string
  quantity: number
  unit: string
  expirationDate: string
  storageSpaceId: string
  status: 'active' | 'used'
  addedAt: string
}
```

### Callbacks

Wire up these user actions:

| Callback | Description |
|----------|-------------|
| `onSearch` | Filter items by search query |
| `onFilterByStorage` | Filter by storage location |
| `onMarkUsed` | Mark item as used (soft delete) |
| `onEdit` | Open item edit form |
| `onDelete` | Delete item permanently |

### Empty States

- **No items in inventory:** Show welcome message and CTA to add first item via Capture
- **No search results:** Show "No items match your search" with clear search button
- **No items in filtered storage:** Show appropriate message for the filter

## Files to Reference

- `product-plan/sections/inventory/README.md` — Feature overview and design intent
- `product-plan/sections/inventory/tests.md` — Test-writing instructions (use for TDD)
- `product-plan/sections/inventory/components/` — React components
- `product-plan/sections/inventory/types.ts` — TypeScript interfaces
- `product-plan/sections/inventory/sample-data.json` — Test data

## Expected User Flows

### Flow 1: Browse Inventory

1. User navigates to Inventory section
2. Items display grouped by expiration urgency
3. "Use Soon" section shows items expiring within 2 days (amber highlight)
4. "This Week" section shows items expiring within 7 days
5. "Later" section shows items expiring after 7 days
6. **Outcome:** User sees organized view of all food items

### Flow 2: Search for Item

1. User taps search bar
2. User types item name (e.g., "milk")
3. List filters in real-time to show matching items
4. User taps X to clear search
5. **Outcome:** Full list restored

### Flow 3: Filter by Storage

1. User taps storage filter pill (e.g., "Fridge")
2. List shows only items in that storage location
3. User taps "All" to remove filter
4. **Outcome:** Full list restored

### Flow 4: Mark Item as Used

1. User taps checkmark button on an item
2. Item is marked as used
3. Item disappears from list
4. **Outcome:** Item no longer appears in active inventory

### Flow 5: Edit Item

1. User taps three-dot menu on an item
2. User selects "Edit item" from dropdown
3. Edit form opens with current values
4. User modifies details and saves
5. **Outcome:** Item updates in list

### Flow 6: Delete Item

1. User taps three-dot menu on an item
2. User selects "Delete" from dropdown
3. Confirmation may be shown
4. Item is permanently deleted
5. **Outcome:** Item removed from inventory

## Done When

- [ ] Tests written for key user flows (success and failure paths)
- [ ] All tests pass
- [ ] Inventory component renders with real data
- [ ] Items grouped correctly by expiration
- [ ] Search filters items in real-time
- [ ] Storage filters work correctly
- [ ] Mark as used removes item from view
- [ ] Edit opens form with current values
- [ ] Delete removes item permanently
- [ ] Empty states display properly
- [ ] Responsive on mobile
