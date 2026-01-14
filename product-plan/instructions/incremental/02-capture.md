# Milestone 2: Capture

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete

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

Implement the Capture feature — Add food items to your inventory by photographing groceries or scanning receipts with AI recognition.

## Overview

Users add food items to their inventory through three methods: camera, photo gallery, or manual entry. The main screen presents these options, and all paths lead to a review screen where users can edit item details before adding to inventory.

**Key Functionality:**
- Take a photo of groceries or receipts for AI processing
- Select an existing photo from the device gallery
- Manually enter items without a photo
- Review and edit AI-extracted items before confirming
- Add all reviewed items to inventory

## Recommended Approach: Test-Driven Development

Before implementing this section, **write tests first** based on the test specifications provided.

See `product-plan/sections/capture/tests.md` for detailed test-writing instructions including:
- Key user flows to test (success and failure paths)
- Specific UI elements, button labels, and interactions to verify
- Expected behaviors and assertions

**TDD Workflow:**
1. Read `tests.md` and write failing tests for the key user flows
2. Implement the feature to make tests pass
3. Refactor while keeping tests green

## What to Implement

### Components

Copy the section components from `product-plan/sections/capture/components/`:

- `CaptureMethod.tsx` — Main screen with three entry method options

**Note:** The CaptureReview component (for reviewing extracted items) is defined in the types but not yet designed. You'll need to create this component for the review flow.

### Data Layer

The components expect these data shapes:

```typescript
interface StorageSpace {
  id: string
  name: string
  icon: string
}

interface ExtractedItem {
  id: string
  name: string
  quantity: number
  unit: string
  expirationDate: string
  storageSpaceId: string
  confidence: number // AI confidence score 0-1
}
```

### Callbacks

Wire up these user actions:

| Callback | Description |
|----------|-------------|
| `onCapturePhoto` | Open camera for photo capture |
| `onSelectFromGallery` | Open photo picker |
| `onManualEntry` | Navigate to empty review screen |

For the review screen (to be implemented):
| Callback | Description |
|----------|-------------|
| `onEditItem` | Update an extracted item's details |
| `onRemoveItem` | Remove an item from the review list |
| `onAddItem` | Add another item manually |
| `onConfirm` | Add all items to inventory |
| `onBack` | Go back to capture method selection |

### AI Integration

You'll need to integrate with an AI service for:
- Image recognition (identifying food items in photos)
- Receipt OCR (extracting item names from receipts)
- Expiration date estimation based on food type

### Empty States

- **No items extracted:** Show helpful message if AI doesn't detect any items
- **Processing state:** Show loading indicator while AI processes the photo

## Files to Reference

- `product-plan/sections/capture/README.md` — Feature overview and design intent
- `product-plan/sections/capture/tests.md` — Test-writing instructions (use for TDD)
- `product-plan/sections/capture/components/` — React components
- `product-plan/sections/capture/types.ts` — TypeScript interfaces
- `product-plan/sections/capture/sample-data.json` — Test data

## Expected User Flows

### Flow 1: Photo Capture

1. User taps "Take Photo" button
2. Camera opens, user takes photo of groceries
3. Loading state shows while AI processes
4. Review screen shows extracted items
5. User edits any incorrect items
6. User taps "Add to Inventory" to confirm
7. **Outcome:** Items added to inventory, user redirected to Inventory section

### Flow 2: Gallery Selection

1. User taps "Choose from Gallery" button
2. Photo picker opens, user selects image
3. Same AI processing and review flow as photo capture
4. **Outcome:** Items added to inventory

### Flow 3: Manual Entry

1. User taps "Add Manually" button
2. Review screen opens with empty item form
3. User fills in item details (name, quantity, expiration, storage)
4. User can add additional items
5. User taps "Add to Inventory" to confirm
6. **Outcome:** Items added to inventory

### Flow 4: AI Extraction Failure

1. User takes photo that AI cannot process
2. Error message shown: "Couldn't detect any items"
3. User can try again or switch to manual entry
4. **Outcome:** User guided to alternative path

## Done When

- [ ] Tests written for key user flows (success and failure paths)
- [ ] All tests pass
- [ ] CaptureMethod component renders with real callbacks
- [ ] Camera/gallery integration works on mobile
- [ ] AI processing extracts items from photos
- [ ] Review screen allows editing extracted items
- [ ] Items are added to inventory on confirm
- [ ] Loading and error states handle edge cases
- [ ] Responsive on mobile
