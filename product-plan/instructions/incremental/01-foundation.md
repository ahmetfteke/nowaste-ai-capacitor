# Milestone 1: Foundation

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** None

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

Set up the foundational elements: design tokens, data model types, routing structure, and application shell.

## What to Implement

### 1. Design Tokens

Configure your styling system with these tokens:

- See `product-plan/design-system/tokens.css` for CSS custom properties
- See `product-plan/design-system/tailwind-colors.md` for Tailwind configuration
- See `product-plan/design-system/fonts.md` for Google Fonts setup

**Colors:**
- Primary: `emerald` — Buttons, links, active states
- Secondary: `amber` — Warnings, expiration alerts
- Neutral: `slate` — Backgrounds, text, borders

**Typography:**
- Heading & Body: DM Sans
- Monospace: IBM Plex Mono

### 2. Data Model Types

Create TypeScript interfaces for your core entities:

- See `product-plan/data-model/types.ts` for interface definitions
- See `product-plan/data-model/README.md` for entity relationships

**Core Entities:**
- User
- StorageSpace (fridge, freezer, pantry, counter)
- FoodItem
- Capture
- Alert

### 3. Routing Structure

Create routes for each section:

| Route | Section | Description |
|-------|---------|-------------|
| `/capture` | Capture | Add items via photo or manual entry |
| `/inventory` | Inventory | View and manage food items (default) |
| `/alerts` | Alerts | Notification history and settings |

The Inventory route should be the default landing page.

### 4. Application Shell

Copy the shell components from `product-plan/shell/components/` to your project:

- `AppShell.tsx` — Main layout wrapper with header, content area, and bottom nav
- `MainNav.tsx` — Bottom tab navigation component
- `UserMenu.tsx` — User avatar dropdown with settings and logout

**Wire Up Navigation:**

Connect the navigation items to your routing:

```typescript
const navigationItems = [
  { label: 'Capture', href: '/capture', icon: 'camera' as const },
  { label: 'Inventory', href: '/inventory', icon: 'package' as const },
  { label: 'Alerts', href: '/alerts', icon: 'bell' as const },
]
```

Set `isActive: true` on the current route's nav item.

**User Menu:**

The UserMenu component expects:
- `name`: User's display name
- `avatarUrl`: Optional avatar image URL
- `onLogout`: Callback for logout action

## Files to Reference

- `product-plan/design-system/` — Design tokens (CSS, Tailwind, fonts)
- `product-plan/data-model/` — Type definitions and relationships
- `product-plan/shell/README.md` — Shell design intent
- `product-plan/shell/components/` — Shell React components

## Done When

- [ ] Design tokens are configured (colors, fonts)
- [ ] Data model types are defined
- [ ] Routes exist for all three sections (can be placeholder pages)
- [ ] Shell renders with header and bottom navigation
- [ ] Navigation links to correct routes
- [ ] Active route is highlighted in nav
- [ ] User menu shows user info with working logout
- [ ] Responsive on mobile and desktop
