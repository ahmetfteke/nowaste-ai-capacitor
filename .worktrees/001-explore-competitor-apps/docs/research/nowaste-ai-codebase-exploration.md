# NoWaste.ai Codebase Exploration

## Overview

NoWaste.ai is a modern food waste reduction app built with a cross-platform approach. This document provides a comprehensive analysis of the existing codebase to understand current features, capabilities, and architecture.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16.1.1 (React 19)
- **Styling**: Tailwind CSS 4 with custom UI components (Radix UI based)
- **Animation**: Framer Motion
- **Mobile**: Capacitor for iOS and Android native apps
- **Icons**: Lucide React

### Backend
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (via Capacitor plugin)
- **Cloud Functions**: Firebase Functions v2 (Node.js)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Crash Reporting**: Firebase Crashlytics

### AI/ML Services
- **Image Analysis**: OpenRouter (Google Gemini 2.5 Flash)
- **Voice Transcription**: Groq (Whisper Large V3 Turbo)
- **Text Processing**: OpenRouter (Gemini 2.5 Flash Lite)
- **Barcode Lookup**: Open Food Facts API + AI enhancement

### Monetization
- **In-App Purchases**: RevenueCat (handles both iOS App Store and Google Play)

---

## Feature Inventory

### 1. Food Inventory Management
- **Storage Spaces**: Fridge, Freezer, Pantry, Counter
- **Food Items**: Name, quantity, unit, expiration date, category, storage location
- **Status Tracking**: Active vs Used items
- **Categories**: 24 food categories (fruits, vegetables, dairy, meat, etc.)
- **Limits**: Free tier: 100 items, Premium: 1000 items

### 2. AI-Powered Capture Methods

#### Photo Capture
- Take photo or select from gallery
- AI analyzes groceries or receipts
- Extracts: name, quantity, unit, storage suggestion, expiration estimate, category
- Supports metric and imperial units
- Brand detection from packaging

#### Voice Input
- Audio recording with native mobile support
- Whisper transcription via Groq
- Natural language parsing to extract food items
- Supports expiration date mentions ("expires in 3 days")

#### Barcode Scanning
- Native barcode scanner via Capacitor ML Kit
- Product lookup via Open Food Facts API
- AI enhancement for better expiration estimates and icon matching

#### Manual Entry
- Form-based item addition
- Edit existing items

### 3. Expiration Alerts System
- **Alert Triggers**: 0, 1, 3, 7 days before expiration, and after
- **Time Preferences**: Morning, Afternoon, Evening, Off
- **Push Notifications**: Combined notifications for multiple items
- **Alert Actions**: Mark as Used, Snooze (remind tomorrow), Dismiss
- **Scheduled Processing**: Cloud function runs periodically

### 4. Shopping List
- Add items manually
- Add from inventory (one-tap from item card)
- Check/uncheck items while shopping
- Clear checked items
- Limit: 1000 items

### 5. AI Recipe Generation
- Based on current inventory items
- Prioritizes expiring items
- **Preferences**:
  - Cuisines: 12 options (American, Italian, Mexican, Asian, etc.)
  - Dietary Restrictions: 9 options (Vegetarian, Vegan, Gluten-Free, etc.)
  - Servings: Customizable
  - Max Cook Time: 15min to 1.5hrs or no limit
  - Skill Level: Easy, Medium, Advanced
- **Output**: Title, description, ingredients (marked from inventory), step-by-step instructions, tips
- **Limits**: Free: 10/month, Premium: Unlimited

### 6. Community Feedback System
- Submit feature suggestions
- Upvote/downvote suggestions
- Comment threads on suggestions
- Review status (pending, approved, rejected)
- User initials for pseudo-anonymity

### 7. Settings & Preferences
- Unit system (Metric/Imperial)
- Expiration alert timing
- Push notification management
- Subscription management (links to App Store/Play Store)
- Sign out

---

## Monetization Model

### Free Tier
- 100 food items max
- 5 AI scans per month
- 5 voice input minutes per month
- 10 barcode scans per month
- 10 recipe generations per month

### Premium Tier
- 1,000 food items
- 1,000 shopping list items
- 1,000 AI scans per month
- Unlimited voice input
- Unlimited barcode scans
- Unlimited recipe generations
- 7-day free trial
- Monthly or Annual subscription

---

## Architecture Patterns

### Frontend Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Authenticated app routes
│   │   ├── alerts/
│   │   ├── capture/
│   │   ├── feedback/
│   │   ├── inventory/
│   │   ├── recipes/
│   │   ├── settings/
│   │   └── shopping/
│   ├── (auth)/            # Authentication routes
│   │   ├── login/
│   │   ├── onboarding/
│   │   └── signup/
│   └── layout.tsx
├── components/
│   ├── capture/           # Capture-specific components
│   ├── shell/             # App shell (nav, header)
│   └── ui/                # Reusable UI components (shadcn/ui style)
├── hooks/                 # Custom React hooks (data fetching, state)
├── lib/                   # Utilities and services
│   ├── ai.ts              # AI service integrations
│   ├── auth-context.tsx   # Auth provider
│   ├── firebase.ts        # Firebase config
│   ├── firestore.ts       # Firestore operations
│   └── food-icons.ts      # Icon mapping
└── types/                 # TypeScript type definitions
```

### Backend Structure (Cloud Functions)
- `analyzeFood`: Image analysis via Gemini
- `transcribeAudio`: Voice transcription via Groq Whisper
- `parseVoiceInput`: Text-to-food-items parsing
- `enhanceBarcodeProduct`: AI enhancement for barcode products
- `generateRecipes`: AI recipe generation
- `generateExpirationAlerts`: Scheduled alert generation
- `triggerAlertGeneration`: Manual alert trigger (for testing)

### Data Model (Firestore Collections)
- `users`: User profiles and settings
- `storageSpaces`: User-created storage locations
- `foodItems`: Food inventory items
- `alerts`: Expiration notifications
- `notificationSettings`: Push notification preferences
- `userSettings`: User preferences
- `shoppingList`: Shopping list items
- `recipes`: Generated recipes
- `recipeUsage`: Monthly usage tracking
- `usage`: AI feature usage tracking
- `suggestions`: Community feedback

---

## Differentiation from NoWaste Competitor

Based on codebase analysis, NoWaste.ai has these **unique advantages**:

### AI-Powered Features (Not in NoWaste)
1. **AI Photo Analysis** - Scan groceries/receipts, auto-extract items
2. **Voice Input** - Speak items naturally, AI parses them
3. **AI Recipe Generation** - Personalized recipes from inventory
4. **Smart Expiration Estimates** - AI-predicted shelf life

### Enhanced UX
1. **Multiple Capture Methods** - Photo, voice, barcode, manual
2. **Category-Aware Icons** - 300+ food icons mapped by AI
3. **Community Features** - User feedback and voting
4. **Modern UI** - Animated, responsive, mobile-first design

### ".ai" Branding Advantage
- Emphasizes AI differentiation
- Modern tech perception
- Memorable domain (nowaste.ai)

---

## Current Gaps/Opportunities

### Features Not Yet Implemented
1. **Meal Planning** - Weekly meal calendar
2. **Nutritional Tracking** - Calorie/macro display
3. **Sharing** - Household/family sharing
4. **Statistics/Analytics** - Food waste dashboard
5. **Recipe Saving** - Save favorite recipes
6. **Smart Grocery List** - AI-suggested items based on recipes
7. **Price Tracking** - Cost of waste metrics
8. **Social Features** - Share recipes, achievements

### Technical Improvements
1. **Offline Mode** - Local caching for no-connectivity
2. **Widgets** - iOS/Android home screen widgets
3. **Watch Apps** - Apple Watch / Wear OS support
4. **Siri/Google Assistant** - Voice assistant integration

---

## Summary

NoWaste.ai is a well-architected food waste reduction app with strong AI capabilities that differentiate it from the competitor NoWaste. The codebase is modern, uses best practices, and has a solid foundation for expansion.

**Key Strengths:**
- Multiple AI-powered input methods
- Cross-platform (web, iOS, Android)
- Clean code architecture
- Freemium model with clear upgrade path

**Recommended Focus Areas:**
- App Store Optimization (ASO) to improve discoverability
- Social/sharing features to increase virality
- Analytics dashboard to demonstrate value to users
- Recipe improvements (save favorites, meal planning)
