# Application Shell

## Overview

No Waste AI uses a mobile-first bottom navigation pattern optimized for quick access to the app's three core features. The design prioritizes thumb-friendly interaction and clear visual hierarchy.

## Components

### AppShell
Main layout wrapper that provides the structure for the entire application.

**Props:**
- `children` — Page content to render
- `navigationItems` — Array of nav items with label, href, icon, isActive
- `user` — User object with name and optional avatarUrl
- `appName` — App title (defaults to "No Waste AI")
- `onNavigate` — Callback when nav item is clicked
- `onLogout` — Callback for logout action

### MainNav
Bottom tab navigation component with icon + label for each section.

**Props:**
- `items` — Array of navigation items
- `onNavigate` — Callback when item is clicked

### UserMenu
User avatar dropdown in the header with settings and logout options.

**Props:**
- `name` — User's display name
- `avatarUrl` — Optional avatar image URL
- `onLogout` — Callback for logout action

## Navigation Structure

| Section | Icon | Route |
|---------|------|-------|
| Capture | camera | /capture |
| Inventory | package | /inventory |
| Alerts | bell | /alerts |

## Layout Pattern

```
┌─────────────────────────────────┐
│ Header: Logo      [User Menu]   │
├─────────────────────────────────┤
│                                 │
│         Content Area            │
│        (scrollable)             │
│                                 │
├─────────────────────────────────┤
│ [Camera] [Inventory] [Alerts]   │
│         Bottom Nav              │
└─────────────────────────────────┘
```

## Design Notes

- Active nav item uses emerald-700 (light) / emerald-400 (dark)
- Inactive items use stone-400 / slate-500
- Bottom nav has subtle top border and solid background
- Header has subtle bottom border
- All transitions are smooth (150ms)

## Usage Example

```tsx
import { AppShell } from './components'

const navigationItems = [
  { label: 'Capture', href: '/capture', icon: 'camera' as const, isActive: false },
  { label: 'Inventory', href: '/inventory', icon: 'package' as const, isActive: true },
  { label: 'Alerts', href: '/alerts', icon: 'bell' as const, isActive: false },
]

function App() {
  return (
    <AppShell
      navigationItems={navigationItems}
      user={{ name: 'Jane Doe' }}
      onNavigate={(href) => router.push(href)}
      onLogout={() => auth.logout()}
    >
      <YourPageContent />
    </AppShell>
  )
}
```
