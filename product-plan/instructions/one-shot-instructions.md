# No Waste AI — Complete Implementation Instructions

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

## Test-Driven Development

Each section includes a `tests.md` file with detailed test-writing instructions. These are **framework-agnostic** — adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, RSpec, Minitest, PHPUnit, etc.).

**For each section:**
1. Read `product-plan/sections/[section-id]/tests.md`
2. Write failing tests for key user flows (success and failure paths)
3. Implement the feature to make tests pass
4. Refactor while keeping tests green

The test instructions include:
- Specific UI elements, button labels, and interactions to verify
- Expected success and failure behaviors
- Empty state handling (when no records exist yet)
- Data assertions and state validations

---

# Product Overview

## Summary

A simple app that helps individuals reduce food waste by automatically tracking their food inventory and sending reminders before items expire.

**Key Problems Solved:**
- **Forgetting what food you have** — Snap a photo of groceries or receipts, and AI automatically adds items to your inventory
- **Not knowing when things expire** — AI estimates expiration dates based on food type
- **Missing the window before food goes bad** — Timely notifications alert you before items expire

## Planned Sections

1. **Capture** — Add food items via photo or manual entry
2. **Inventory** — View and manage food items (default view)
3. **Alerts** — Expiration notifications and settings

## Data Model

**Core Entities:**
- User, StorageSpace, FoodItem, Capture, Alert

**Relationships:**
- User has many StorageSpaces and Captures
- StorageSpace has many FoodItems
- Capture creates many FoodItems
- FoodItem can have many Alerts

## Design System

**Colors:** emerald (primary), amber (secondary), slate (neutral)
**Typography:** DM Sans (heading/body), IBM Plex Mono (mono)

---

# Milestone 1: Foundation

## Goal

Set up design tokens, data model types, routing, and application shell.

## What to Implement

### 1. Design Tokens

Configure styling with:
- Colors: emerald (primary), amber (secondary), slate (neutral)
- Fonts: DM Sans (heading/body), IBM Plex Mono (mono)

See `product-plan/design-system/` for detailed configuration.

### 2. Data Model Types

Create TypeScript interfaces for: User, StorageSpace, FoodItem, Capture, Alert

See `product-plan/data-model/types.ts` for definitions.

### 3. Routing Structure

| Route | Section | Description |
|-------|---------|-------------|
| `/capture` | Capture | Add items via photo |
| `/inventory` | Inventory | View items (default) |
| `/alerts` | Alerts | Notifications |

### 4. Application Shell

Copy from `product-plan/shell/components/`:
- `AppShell.tsx` — Layout wrapper
- `MainNav.tsx` — Bottom navigation
- `UserMenu.tsx` — User dropdown

Wire up navigation items and user menu callbacks.

## Done When

- [ ] Design tokens configured
- [ ] Data model types defined
- [ ] Routes exist for all sections
- [ ] Shell renders with navigation
- [ ] User menu works
- [ ] Responsive on mobile

---

# Milestone 2: Capture

## Goal

Implement photo capture flow with AI item extraction.

## Overview

Users add food items via camera, gallery, or manual entry. All paths lead to a review screen before adding to inventory.

## Components

- `CaptureMethod.tsx` — Entry method selection

## Callbacks

| Callback | Description |
|----------|-------------|
| `onCapturePhoto` | Open camera |
| `onSelectFromGallery` | Open photo picker |
| `onManualEntry` | Go to empty review |

## User Flows

1. **Photo Capture:** Take photo → AI extracts → Review → Add to inventory
2. **Gallery:** Select photo → Same flow
3. **Manual:** Open review → Fill details → Add

## Done When

- [ ] Tests written and passing
- [ ] Camera/gallery integration works
- [ ] AI extracts items from photos
- [ ] Review screen allows editing
- [ ] Items added to inventory on confirm
- [ ] Error states handled

---

# Milestone 3: Inventory

## Goal

Implement food item list with search, filters, and quick actions.

## Overview

Main view of all food items, organized by expiration urgency. Users can search, filter, and take actions.

## Components

- `Inventory.tsx` — Main view with search/filters
- `FoodItemCard.tsx` — Item card with actions

## Callbacks

| Callback | Description |
|----------|-------------|
| `onSearch` | Filter by query |
| `onFilterByStorage` | Filter by location |
| `onMarkUsed` | Mark item used |
| `onEdit` | Open edit form |
| `onDelete` | Delete item |

## User Flows

1. **Browse:** View items grouped by expiration
2. **Search:** Type to filter in real-time
3. **Filter:** Tap storage pill to filter
4. **Mark Used:** Tap checkmark to use item
5. **Edit/Delete:** Use three-dot menu

## Done When

- [ ] Tests written and passing
- [ ] Items grouped by expiration
- [ ] Search works in real-time
- [ ] Storage filters work
- [ ] All actions work correctly
- [ ] Empty states display properly

---

# Milestone 4: Alerts

## Goal

Implement notification history with actions and settings.

## Overview

History of expiration alerts grouped by date. Users can act on alerts and configure notification timing.

## Components

- `Alerts.tsx` — Alert list with settings modal
- `AlertCard.tsx` — Individual alert with actions

## Callbacks

| Callback | Description |
|----------|-------------|
| `onMarkUsed` | Mark food item used |
| `onSnooze` | Snooze for later |
| `onDismiss` | Dismiss permanently |
| `onMarkRead` | Clear unread indicator |
| `onUpdateSettings` | Save settings |

## User Flows

1. **View History:** See alerts grouped by date
2. **Mark Used:** Act on alert to use item
3. **Snooze/Dismiss:** Manage alerts
4. **Settings:** Configure notification timing

## Background Job

Create a process that:
- Checks items daily for upcoming expirations
- Generates alerts based on user settings
- Sends push notifications

## Done When

- [ ] Tests written and passing
- [ ] Alerts grouped by date
- [ ] All actions work correctly
- [ ] Settings modal saves changes
- [ ] Background job generates alerts
- [ ] Empty state displays properly

---

# Files Reference

**Design System:**
- `product-plan/design-system/tokens.css`
- `product-plan/design-system/tailwind-colors.md`
- `product-plan/design-system/fonts.md`

**Data Model:**
- `product-plan/data-model/README.md`
- `product-plan/data-model/types.ts`

**Shell:**
- `product-plan/shell/components/`

**Sections:**
- `product-plan/sections/capture/` — Components, types, tests
- `product-plan/sections/inventory/` — Components, types, tests
- `product-plan/sections/alerts/` — Components, types, tests
