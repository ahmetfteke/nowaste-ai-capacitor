# Capture

## Overview

Users add food items to their inventory through three methods: camera, photo gallery, or manual entry. The main screen presents these options, and all paths lead to a review screen where users can edit item details before adding to inventory.

## User Flows

- **Photo Capture:** User takes a photo → AI extracts items → Review screen shows extracted items → User edits/removes items → Confirms to add to inventory
- **Gallery Upload:** User selects photo from library → Same AI extraction and review flow
- **Manual Entry:** Opens review screen with an empty item → User fills in details → Can add additional items → Confirms to add

## Design Decisions

- Three clear entry points with visual hierarchy (camera is primary/accented)
- Helpful tip at bottom for first-time users
- Clean, simple cards with icons and descriptions
- Subtle accent ring on primary action to draw attention

## Data Used

**Entities:** ExtractedItem, StorageSpace

**From global model:** StorageSpace (for assigning items to locations)

## Components Provided

- `CaptureMethod` — Main screen with three entry method options (Take Photo, Choose from Gallery, Add Manually)

**Note:** The CaptureReview component (for reviewing AI-extracted items) is defined in the types but needs to be implemented.

## Callback Props

| Callback | Description |
|----------|-------------|
| `onCapturePhoto` | Called when user taps "Take Photo" |
| `onSelectFromGallery` | Called when user taps "Choose from Gallery" |
| `onManualEntry` | Called when user taps "Add Manually" |

## For Review Screen (to implement)

| Callback | Description |
|----------|-------------|
| `onEditItem` | Called when user edits an extracted item |
| `onRemoveItem` | Called when user removes an item |
| `onAddItem` | Called when user adds another item manually |
| `onConfirm` | Called when user confirms all items |
| `onBack` | Called when user wants to go back |
