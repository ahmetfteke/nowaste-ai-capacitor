# No Waste AI — Product Overview

## Summary

A simple app that helps individuals reduce food waste by automatically tracking their food inventory and sending reminders before items expire.

**Key Problems Solved:**
- **Forgetting what food you have** — Snap a photo of groceries or receipts, and AI automatically adds items to your inventory
- **Not knowing when things expire** — AI estimates expiration dates based on food type
- **Missing the window before food goes bad** — Timely notifications alert you before items expire

## Tech Stack

**Frontend:**
- **Framework:** Next.js 16 (App Router, static export)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Mobile:** Capacitor (iOS/Android native builds)

**Backend:**
- **Auth:** Firebase Authentication (Email/Password, Google, Apple)
- **Database:** Cloud Firestore
- **Functions:** Firebase Functions v2 (Cloud Run)
- **AI:** OpenRouter API with Gemini 2.5 Flash (vision model)

**Infrastructure:**
- **Hosting:** Firebase Hosting
- **Project ID:** `nowaste-ai`

## Planned Sections

1. **Capture** — Add food items to your inventory by photographing groceries or scanning receipts with AI recognition.

2. **Inventory** — View, edit, and manage your food items with their estimated expiration dates.

3. **Alerts** — Receive notifications when items are approaching expiration so you can use them in time.

## Data Model

**Core Entities:**
- **User** — A person using the app to track their food inventory and receive expiration alerts
- **StorageSpace** — A location where food is stored (fridge, pantry, freezer, counter)
- **FoodItem** — A food product with name, quantity, and estimated expiration date
- **Capture** — A photo submission processed by AI to extract food items
- **Alert** — A notification about an item approaching or past its expiration date

**Relationships:**
- User has many StorageSpaces
- User has many Captures
- StorageSpace has many FoodItems
- Capture creates many FoodItems
- FoodItem can have many Alerts

## Design System

**Theme:** Organic, nature-friendly, modern

**Colors (OKLCH format):**
- **Background:** Warm cream `oklch(0.98 0.005 90)` — Soft, natural feel
- **Primary:** Emerald green `oklch(0.55 0.17 155)` — Eco-friendly, growth
- **Secondary:** Soft sage `oklch(0.94 0.02 140)` — Subtle natural accent
- **Accent:** Warm terracotta `oklch(0.65 0.14 45)` — Earthy warmth
- **Destructive:** Soft coral `oklch(0.55 0.15 25)` — Gentle warning
- **Muted:** Stone/taupe tones — Warm neutrals

**Typography:**
- **Heading/Body:** DM Sans — Clean, modern, friendly
- **Mono:** IBM Plex Mono — Technical, readable

**Border Radius:** `1rem` — Soft, rounded corners for approachable feel

**Component Library:** shadcn/ui (stone base color)

## Implementation Sequence

Build this product in milestones:

1. **Foundation** — Set up design tokens, data model types, routing, and application shell
2. **Capture** — Photo capture flow with AI item extraction and review screen
3. **Inventory** — Food item list with search, filtering, and quick actions
4. **Alerts** — Notification history with actions and settings

Each milestone has a dedicated instruction document in `product-plan/instructions/`.
