# Inventory

## Overview

The main view of all food items in the user's inventory, organized by expiration urgency. Users can search, filter by storage location, and take quick actions on items like marking them as used, editing, or deleting.

## User Flows

- View all items grouped by expiration (Use Soon, This Week, Later)
- Search items by name
- Filter items by storage location (Fridge, Freezer, Pantry, Counter)
- Mark an item as used (briefly shows "used" status, then disappears)
- Edit item details (name, quantity, expiration date, storage location)
- Delete an item from inventory

## Design Decisions

- Modern mobile-first design with sticky search header
- Floating filter pills for quick storage filtering
- Items grouped in rounded card containers with dividers
- Circular checkmark button for quick "mark as used" action
- Pill badges for expiration status with color coding
- Three-dot menu for secondary actions (edit, delete)
- Amber highlighting for urgent items (expiring within 2 days)

## Data Used

**Entities:** FoodItem, StorageSpace

**From global model:** FoodItem (inventory items), StorageSpace (filter options)

## Components Provided

- `Inventory` — Main view with search bar, filter pills, and grouped item sections
- `FoodItemCard` — Individual item card with quick actions and dropdown menu

## Callback Props

| Callback | Description |
|----------|-------------|
| `onSearch` | Called with search query when user types in search bar |
| `onFilterByStorage` | Called with storage ID when user taps a filter pill (null for "All") |
| `onMarkUsed` | Called with item ID when user taps the checkmark button |
| `onEdit` | Called with item ID when user selects "Edit item" from menu |
| `onDelete` | Called with item ID when user selects "Delete" from menu |
