# No Waste AI — Codebase Reference

## Tech Stack: Capacitor App

- **Framework**: Next.js 16.1.1, React 19.2.3, TypeScript 5
- **Build**: Static export (`output: "export"`) → `/out` directory
- **Styling**: Tailwind CSS 4, PostCSS, `tw-animate-css`
- **UI**: Radix UI (Dialog, Dropdown, Label, Select, Separator, Slot), Framer Motion, Vaul (drawer), Lucide React icons
- **Backend**: Firebase (Auth + Firestore), Cloud Functions
- **Mobile**: Capacitor 7 (iOS + Android), app ID: `com.nowaste.ai`
- **Native Plugins**: Camera, Barcode (MLKit), Push Notifications, Preferences, RevenueCat (IAP)
- **AI**: Groq SDK for image analysis via Cloud Functions

## Project Structure

```
no-waste-ai/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout: AuthProvider, PWAElements, fonts
│   │   ├── globals.css             # Global styles
│   │   ├── (app)/                  # Authenticated routes
│   │   │   ├── layout.tsx          # App shell: UpdatePrompt + AppShell
│   │   │   ├── inventory/page.tsx  # Inventory management (~868 lines)
│   │   │   ├── shopping/page.tsx   # Shopping list management (~565 lines)
│   │   │   ├── capture/page.tsx    # Camera/voice/barcode capture
│   │   │   ├── recipes/page.tsx    # AI recipe suggestions
│   │   │   ├── alerts/page.tsx     # Expiration alerts
│   │   │   ├── settings/page.tsx   # User settings
│   │   │   └── feedback/page.tsx   # Community suggestions
│   │   ├── (auth)/                 # Public auth routes
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── onboarding/page.tsx
│   │   └── api/                    # API endpoints (if any)
│   ├── components/
│   │   ├── ui/                     # Reusable Radix-based components (button, input, dialog, etc.)
│   │   ├── shell/
│   │   │   ├── app-shell.tsx       # Main app wrapper: header, content, bottom nav
│   │   │   ├── main-nav.tsx        # Bottom tab navigation
│   │   │   ├── user-menu.tsx       # User dropdown menu in header
│   │   │   ├── notification-banner.tsx  # Push notification permission banner
│   │   │   └── index.ts            # Barrel export
│   │   ├── capture/                # Capture-specific components
│   │   ├── update-prompt.tsx       # App update prompt
│   │   └── pwa-elements.tsx        # Ionic PWA elements wrapper
│   ├── hooks/
│   │   ├── use-food-items.ts       # Inventory CRUD + real-time subscription
│   │   ├── use-shopping-list.ts    # Shopping list CRUD + real-time subscription
│   │   ├── use-alerts.ts           # Expiration alerts subscription
│   │   ├── use-recipes.ts          # AI recipes management
│   │   ├── use-settings.ts         # User settings
│   │   ├── use-storage-spaces.ts   # Storage locations (fridge, freezer, pantry, counter)
│   │   ├── use-camera.ts           # Camera capture
│   │   ├── use-barcode.ts          # Barcode scanning
│   │   ├── use-voice-recorder.ts   # Voice input recording
│   │   ├── use-notifications.ts    # Push notification setup
│   │   ├── use-purchases.ts        # RevenueCat subscription status
│   │   ├── use-suggestions.ts      # Community feedback
│   │   ├── use-usage.ts            # Usage tracking
│   │   ├── use-app-update.ts       # App update detection
│   │   └── index.ts                # Barrel export
│   ├── lib/
│   │   ├── firebase.ts             # Firebase app init, auth providers, Firestore db
│   │   ├── firestore.ts            # All Firestore CRUD functions + subscriptions
│   │   ├── auth-context.tsx        # AuthProvider + useAuth hook
│   │   ├── ai.ts                   # AI/image analysis Cloud Function calls
│   │   ├── import.ts               # CSV/JSON import parsing
│   │   ├── export.ts               # CSV/JSON export
│   │   └── widget-bridge.ts        # Native widget data sync
│   └── types/
│       └── index.ts                # All TypeScript interfaces
├── functions/                      # Firebase Cloud Functions
├── ios/                            # Capacitor iOS project
├── android/                        # Capacitor Android project
├── public/                         # Static assets
├── capacitor.config.ts             # Capacitor config (webDir: 'out')
├── next.config.ts                  # Next.js config (static export)
├── firebase.json                   # Firebase hosting/functions config
├── firestore.rules                 # Firestore security rules
└── firestore.indexes.json          # Firestore composite indexes
```

## Data Architecture

### State Management

React Context + custom hooks. No Redux/Zustand.

- **Auth**: `AuthContext` in `lib/auth-context.tsx` → `useAuth()` hook
- **Each feature**: Dedicated hook with real-time Firestore `onSnapshot()` subscription
- **Pattern**: Hook subscribes → Firestore pushes updates → React state updates → component re-renders

### Firestore Collections

| Collection | Key Fields | Subscription Hook |
|---|---|---|
| `users` | email, displayName, timezone, alertTime, unitSystem, foodItemCount, shoppingListItemCount | `useSettings()` |
| `foodItems` | name, quantity, unit, expirationDate, storageSpaceId, category, status, userId | `useFoodItems()` |
| `shoppingList` | name, quantity, unit, category, checked, userId | `useShoppingList()` |
| `alerts` | foodItemId, foodItemName, message, expirationDate, status, userId | `useAlerts()` |
| `recipes` | title, description, cookTime, servings, difficulty, cuisine, ingredients, instructions, userId | `useRecipes()` |
| `recipeUsage` | count, monthYear, userId | `subscribeRecipeUsage()` |
| `notificationSettings` | enabled, reminderDays, fcmToken, userId | direct calls |
| `suggestions` | title, description, userId, userInitials, upvotes, upvoters, commentCount, reviewStatus | `useSuggestions()` |
| `suggestions/{id}/comments` | text, userId, userInitials | `subscribeComments()` |

### Data Models (from `src/types/index.ts`)

```typescript
interface FoodItem {
  id: string; name: string; quantity: number; unit: string;
  expirationDate: string; storageSpaceId: string;
  category?: FoodCategory; status: "active" | "used";
  addedAt: string; userId: string;
}

interface ShoppingListItem {
  id: string; name: string; quantity: number; unit: string;
  category?: FoodCategory; checked: boolean;
  userId: string; createdAt: string;
}
```

Storage locations: `fridge | freezer | pantry | counter` (hardcoded in `DEFAULT_STORAGE_SPACES`)

### Data Flow

```
User Action → React Component → Custom Hook → firestore.ts function
  → Firestore SDK (addDoc/updateDoc/deleteDoc with transactions)
  → Firestore Cloud DB
  → onSnapshot() listener fires
  → Hook callback updates React state
  → Component re-renders
```

### Transactions

- `createFoodItem`: creates item + increments `users.foodItemCount`
- `deleteFoodItem`: deletes item + decrements `users.foodItemCount`
- `createShoppingListItem`: creates item + increments `users.shoppingListItemCount`
- `deleteShoppingListItem`: deletes item + decrements `users.shoppingListItemCount`
- `clearCheckedShoppingListItems`: batch delete + decrement counter

### Cloud Functions

- `analyzefood-5see5s3l3a-uc.a.run.app` — Image → food item extraction
- `transcribeaudio-5see5s3l3a-uc.a.run.app` — Audio transcription
- `parsevoiceinput-5see5s3l3a-uc.a.run.app` — Voice input parsing
- `enhancebarcodeproduct-5see5s3l3a-uc.a.run.app` — Barcode product lookup

## Authentication

- Firebase Auth: email/password, Google OAuth, Apple OAuth
- Capacitor native auth on mobile (`@capacitor-firebase/authentication`)
- Detection: `window.Capacitor` check for native vs web auth flow
- ID tokens sent as Authorization headers to Cloud Functions

## Key Patterns

- **Timestamp handling**: `data.addedAt?.toDate?.()?.toISOString() || new Date().toISOString()` — gracefully handles null timestamps from pending Firestore writes
- **Data cleaning**: `Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined))` — strips undefined values before Firestore writes
- **Static export**: `output: "export"` in next.config.ts → all pages are static HTML, no SSR/ISR
- **Capacitor integration**: `webDir: 'out'` in capacitor.config.ts points to Next.js export output

## Import/Export

Both inventory and shopping list support CSV and JSON import/export:
- CSV inventory: `Name,Quantity,Unit,Expiration Date,Storage Location`
- CSV shopping: `Name,Quantity,Unit`
- JSON: `{ exportDate, itemCount, items[] }`
- Handled in `lib/import.ts` and `lib/export.ts`
