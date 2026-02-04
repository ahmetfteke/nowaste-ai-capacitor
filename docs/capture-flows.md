# Capture Screen Flows

The capture screen (`src/app/(app)/capture/page.tsx`) provides 5 methods to add food items to inventory. All methods ultimately produce `ExtractedItem[]` which go through user review before saving to Firestore.

## Shared Types

```typescript
// src/lib/ai.ts:4-14
interface ExtractedItem {
  id: string;                // UUID generated client-side
  name: string;              // Food item name
  quantity: number;          // Count/amount
  unit: string;              // "pcs", "lbs", "oz", etc.
  expirationDate: string;    // ISO date (YYYY-MM-DD)
  storageSpaceId: string;    // "fridge" | "freezer" | "pantry" | "counter"
  category?: FoodCategory;   // 24 possible categories
  confidence: number;        // 0-1 score from AI
  iconHint?: string;         // AI-suggested icon name
}

// src/lib/ai.ts:16-24 (Cloud Run response format)
interface APIExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  suggestedStorageSpaceId: "fridge" | "freezer" | "pantry" | "counter";
  estimatedExpirationDate: string;
  category?: FoodCategory;
  confidence: number;
}
```

## Shared Components

### Review Screen
**File**: `src/components/capture/review-items.tsx`

All capture methods (except manual entry which starts here) pass `ExtractedItem[]` to this component for user review before saving.

**Editing capabilities**:
- Name (text input)
- Quantity (number input, min 1)
- Unit (text input)
- Expiration date (date picker, defaults to today + 7 days for new items)
- Storage location (dropdown: fridge/freezer/pantry/counter)

**Actions**:
- Edit item (tap card or edit button, opens drawer)
- Delete item (trash icon)
- Add item manually (opens add drawer with empty form, confidence set to 1.0)
- Confirm all (saves to Firestore, checks inventory limit)

### Save to Firestore
**File**: `src/lib/firestore.ts:157-183`

All items are saved via `createFoodItem()`:
- `writeBatch` creates food item document + increments `users/{userId}.foodItemCount`
- Fire-and-forget commit (offline-compatible, does not await server confirmation)

### Post-Save Flow
**File**: `src/app/(app)/capture/page.tsx:253-303`

After confirming items:
1. `Promise.all` saves all items via `addItem()`
2. If first time, shows notification permission prompt
3. Otherwise redirects to `/inventory`

---

## 1. Take Photo (AI Scan)

Camera capture with AI-powered food item extraction.

### Flow

```
User taps "Take Photo"
    |
    v
handleCapturePhoto() — capture/page.tsx:102
    |-- Check AI scan limit (canUseAiScan)
    |-- If exceeded -> show paywall
    |
    v
takePhoto() — use-camera.ts:77-106
    |-- Camera.getPhoto() via Capacitor
    |-- quality: 85, max 1920px
    |-- resultType: Base64
    |
    v
processImage() — use-camera.ts:62-75
    |-- Check if base64 <= 3MB
    |-- If oversized -> resizeImage() to max 1280px, 0.7 quality
    |-- Return data URL: "data:image/jpeg;base64,..."
    |
    v
extractFoodItems(imageData, unitSystem) — ai.ts:36-103
    |-- Get Firebase ID token for auth
    |-- Strip data URL prefix from base64
    |-- POST to Cloud Run: ANALYZE_FOOD_URL
    |   URL: https://analyzefood-{id}-uc.a.run.app
    |   Body: { imageBase64, unitSystem }
    |   Headers: Authorization: Bearer {idToken}
    |-- Map response items to ExtractedItem[]
    |
    v
incrementAiScans() — use-usage.ts
    |
    v
setState("review") -> ReviewItems component
```

### Key Files

| File | Purpose |
|------|---------|
| `src/hooks/use-camera.ts` | Capacitor Camera API wrapper, image resizing |
| `src/lib/ai.ts:36-103` | `extractFoodItems()` Cloud Run call |
| `src/app/(app)/capture/page.tsx:102-119` | Orchestration |

### Error Handling

| Scenario | Behavior |
|----------|----------|
| AI extraction fails | Shows review with empty items for manual entry |
| Camera cancelled | No action |
| Free tier limit hit | Shows paywall |
| Image too large | Auto-resized to 1280px |

### Usage Limits

- Free: 5 AI scans/month
- Premium: 1000 AI scans/month

---

## 2. Choose from Gallery

Same as Take Photo but uses an existing image from the device gallery.

### Flow

```
User taps "Choose from Gallery"
    |
    v
handleSelectFromGallery() — capture/page.tsx:121
    |-- Check AI scan limit
    |
    v
pickFromGallery() — use-camera.ts:108-137
    |-- Camera.getPhoto() with source: CameraSource.Photos
    |-- Same processing as takePhoto
    |
    v
processImage() -> extractFoodItems() -> review
    (identical to Take Photo from here)
```

### Key Difference
- `CameraSource.Photos` instead of `CameraSource.Camera`
- Opens device photo gallery instead of camera
- Same AI extraction, same usage tracking

---

## 3. Voice Input

Speech-to-text transcription followed by AI parsing into food items.

### Flow

```
User taps "Voice Input"
    |
    v
handleVoiceCapture() — capture/page.tsx:146
    |-- Check voice time limit (canUseVoiceInput)
    |-- If exceeded -> show paywall
    |-- setState("voice")
    |
    v
VoiceCapture component — capture/voice-capture.tsx
    |-- Auto-starts recording on mount
    |
    v
startRecording() — use-voice-recorder.ts:51-156
    |-- Request microphone permission
    |-- Audio settings: echo cancellation, noise suppression, auto gain
    |-- MIME detection order:
    |   1. audio/webm;codecs=opus
    |   2. audio/webm
    |   3. audio/mp4
    |   4. audio/ogg;codecs=opus
    |   5. audio/wav
    |-- Record with 1000ms time slices
    |-- Track duration (1s timer)
    |
    v
User taps "Done"
    |
    v
stopRecording() — use-voice-recorder.ts:158-175
    |-- Stop MediaRecorder
    |-- Collect audio chunks into blob
    |-- Convert blob to base64
    |-- Return { audioBase64, mimeType }
    |
    v
transcribeAudio(audioBase64, mimeType) — ai.ts:164-215
    |-- Get Firebase ID token
    |-- POST to Cloud Run: TRANSCRIBE_AUDIO_URL
    |   URL: https://transcribeaudio-{id}-uc.a.run.app
    |   Body: { audioBase64, mimeType }
    |-- Returns transcribed text string
    |
    v
parseVoiceInput(text, unitSystem) — ai.ts:217-278
    |-- Get Firebase ID token
    |-- POST to Cloud Run: PARSE_VOICE_URL
    |   URL: https://parsevoiceinput-{id}-uc.a.run.app
    |   Body: { text, unitSystem }
    |-- Map response to ExtractedItem[]
    |
    v
handleVoiceComplete(items, durationSeconds) — capture/page.tsx:155
    |-- incrementVoiceSeconds(durationSeconds)
    |-- setState("review") -> ReviewItems
```

### Key Files

| File | Purpose |
|------|---------|
| `src/components/capture/voice-capture.tsx` | Recording UI with transcription display |
| `src/hooks/use-voice-recorder.ts` | MediaRecorder API wrapper, base64 encoding |
| `src/lib/ai.ts:164-215` | `transcribeAudio()` Cloud Run call |
| `src/lib/ai.ts:217-278` | `parseVoiceInput()` Cloud Run call |

### Cloud Functions

1. **Transcription**: `transcribeaudio-{id}-uc.a.run.app`
   - Input: `{ audioBase64, mimeType }`
   - Output: `{ text: string }`

2. **Parsing**: `parsevoiceinput-{id}-uc.a.run.app`
   - Input: `{ text, unitSystem }`
   - Output: `{ items: APIExtractedItem[] }`

### Error Handling

| Scenario | Behavior |
|----------|----------|
| Transcription fails | Error shown in voice UI |
| Parsing fails | Error shown in voice UI |
| User cancels | Returns to method select |
| Free tier limit hit | Shows paywall |

### Usage Limits

- Free: 10 voice minutes/month
- Premium: 600 voice minutes/month (10 hours)
- Tracked in seconds for precision (`voiceSecondsThisMonth`)

---

## 4. Scan Barcode

Native barcode scanning with product database lookup.

### Flow

```
User taps "Scan Barcode"
    |
    v
handleBarcodeScan() — capture/page.tsx:166
    |-- Check barcode limit (canUseBarcodeScanner)
    |-- If exceeded -> show paywall
    |-- Check native platform support
    |
    v
scanBarcodeNative() — use-barcode.ts:65-76
    |-- Check Capacitor.isNativePlatform()
    |-- Request camera permissions
    |-- Install Google ML Kit module if needed
    |-- BarcodeScanner.scan()
    |-- Formats: EAN13, EAN8, UPC-A/E, Code128/39/93, ITF
    |-- Returns barcode string (e.g. "5901234123457")
    |
    v
incrementBarcodeScans() — use-usage.ts
    |
    v
lookupBarcode(barcode) — ai.ts:412-473
    |-- GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json
    |-- User-Agent: "NoWasteAI/1.0 (pantry-tracker-app)"
    |-- Extract: name, brand, categories, image
    |-- mapToFoodCategory(categories) -> app category
    |-- getStorageLocation(category) -> storage location
    |-- getEstimatedShelfLife(category) -> days
    |
    v
[Optional] enhanceBarcodeWithAI() — ai.ts:476-506
    |-- POST to Cloud Run: ENHANCE_BARCODE_URL
    |-- Returns: { daysUntilExpiration, iconName, category, storageLocation }
    |-- Falls back to category-based defaults if unavailable
    |
    v
barcodeProductToExtractedItem(product) — ai.ts:509-524
    |-- expirationDate = today + estimatedShelfLifeDays
    |-- confidence: 0.95
    |-- Return ExtractedItem
    |
    v
setState("review") -> ReviewItems
```

### Key Files

| File | Purpose |
|------|---------|
| `src/hooks/use-barcode.ts` | Capacitor ML Kit barcode scanning |
| `src/lib/ai.ts:412-524` | Open Food Facts lookup, AI enhancement, conversion |
| `src/lib/ai.ts:297-410` | Category mapping, storage location, shelf life helpers |

### Error Handling

| Scenario | Behavior |
|----------|----------|
| Product not found | Review with pre-filled "Barcode: {code}", 30-day expiry, 0.5 confidence |
| AI enhancement fails | Uses category-based defaults |
| User cancels scan | No action |
| Free tier limit hit | Shows paywall |
| Not native platform | Button disabled |

### Usage Limits

- Free: 100 barcode scans/month
- Premium: unlimited

---

## 5. Add Manually

Direct entry with no AI processing.

### Flow

```
User taps "Add Manually"
    |
    v
handleManualEntry() — capture/page.tsx:140
    |-- setExtractedItems([])  (empty array)
    |-- setState("review")
    |
    v
ReviewItems component (empty state)
    |-- Shows "No items detected" message
    |-- "Add Item Manually" button
    |
    v
AddItemDrawer — review-items.tsx:336-463
    |-- Name (text, required)
    |-- Quantity (number, default 1)
    |-- Unit (text, default "count")
    |-- Expiration date (date picker, default today + 7 days)
    |-- Storage location (dropdown)
    |-- confidence: 1.0 (manually added)
    |
    v
User confirms -> save to Firestore
```

### No Usage Limits

Manual entry has no monthly limits. Only constrained by total inventory size:
- Free: 50 food items max
- Premium: 1000 food items max

---

## Cloud Functions Summary

| Function | URL Pattern | Input | Output | Used By |
|----------|-------------|-------|--------|---------|
| Analyze Food | `analyzefood-{id}-uc.a.run.app` | `{ imageBase64, unitSystem }` | `{ items: APIExtractedItem[] }` | Photo, Gallery |
| Transcribe Audio | `transcribeaudio-{id}-uc.a.run.app` | `{ audioBase64, mimeType }` | `{ text: string }` | Voice |
| Parse Voice | `parsevoiceinput-{id}-uc.a.run.app` | `{ text, unitSystem }` | `{ items: APIExtractedItem[] }` | Voice |
| Enhance Barcode | `enhancebarcode-{id}-uc.a.run.app` | `{ name, brand, categories }` | `{ daysUntilExpiration, iconName, category, storageLocation }` | Barcode |

All Cloud Run functions require Firebase ID token authentication (`Authorization: Bearer {idToken}`).

## Usage Limits Summary

| Feature | Free Tier | Premium |
|---------|-----------|---------|
| AI scans (photo/gallery) | 5/month | 1000/month |
| Voice input | 10 minutes/month | 600 minutes/month |
| Barcode scans | 100/month | Unlimited |
| Manual entry | Unlimited | Unlimited |
| Total food items | 50 max | 1000 max |

Tracked in Firestore at `usage/{userId}` with monthly reset based on `lastResetMonth`.
