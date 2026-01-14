# Milestone 4: Alerts

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1-3 complete

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

Implement the Alerts feature — Receive notifications when items are approaching expiration so you can use them in time.

## Overview

A history of notifications sent to the user about expiring food items. Users can take action on alerts (mark as used, snooze, dismiss) and configure basic notification settings like timing preferences.

**Key Functionality:**
- View notification history grouped by date (Today, Yesterday, This Week, Older)
- Mark an item as used directly from the alert
- Snooze an alert to be reminded later
- Dismiss an alert permanently
- Toggle notifications on/off
- Configure reminder timing (1 day, 3 days before expiration)

## Recommended Approach: Test-Driven Development

Before implementing this section, **write tests first** based on the test specifications provided.

See `product-plan/sections/alerts/tests.md` for detailed test-writing instructions including:
- Key user flows to test (success and failure paths)
- Specific UI elements, button labels, and interactions to verify
- Expected behaviors and assertions

**TDD Workflow:**
1. Read `tests.md` and write failing tests for the key user flows
2. Implement the feature to make tests pass
3. Refactor while keeping tests green

## What to Implement

### Components

Copy the section components from `product-plan/sections/alerts/components/`:

- `Alerts.tsx` — Main alerts view with grouped notifications and settings modal
- `AlertCard.tsx` — Individual alert card with actions

### Data Layer

The components expect these data shapes:

```typescript
interface Alert {
  id: string
  foodItemId: string
  foodItemName: string
  message: string
  expirationDate: string
  status: 'unread' | 'read' | 'snoozed' | 'dismissed'
  sentAt: string
  snoozedUntil?: string
}

interface NotificationSettings {
  enabled: boolean
  reminderDays: number[] // e.g., [1, 3] for 1 and 3 days before
}
```

### Callbacks

Wire up these user actions:

| Callback | Description |
|----------|-------------|
| `onMarkUsed` | Mark the food item as used |
| `onSnooze` | Snooze alert for later reminder |
| `onDismiss` | Dismiss alert permanently |
| `onMarkRead` | Mark alert as read (clears unread indicator) |
| `onUpdateSettings` | Save notification settings changes |
| `onOpenSettings` | Track when settings panel opens |

### Background Job: Alert Generation

You'll need a background process that:
1. Checks food items daily for upcoming expirations
2. Generates alerts based on user's `reminderDays` settings
3. Sends push notifications (if enabled)

### Empty States

- **No notifications:** Show "No notifications yet" with helpful message
- **Notifications disabled:** Show banner with "Turn on" button

## Files to Reference

- `product-plan/sections/alerts/README.md` — Feature overview and design intent
- `product-plan/sections/alerts/tests.md` — Test-writing instructions (use for TDD)
- `product-plan/sections/alerts/components/` — React components
- `product-plan/sections/alerts/types.ts` — TypeScript interfaces
- `product-plan/sections/alerts/sample-data.json` — Test data

## Expected User Flows

### Flow 1: View Notification History

1. User navigates to Alerts section
2. Alerts display grouped by date (Today, Yesterday, This Week, Older)
3. Unread alerts show green dot indicator
4. Each alert shows food item name, message, and expiration badge
5. **Outcome:** User sees organized history of all alerts

### Flow 2: Mark Item as Used from Alert

1. User taps checkmark button on an alert
2. Food item is marked as used in inventory
3. Alert updates or is removed
4. **Outcome:** Item no longer in inventory, alert resolved

### Flow 3: Snooze Alert

1. User taps clock button on an alert
2. Alert is snoozed (will reappear later)
3. Alert shows "Snoozed" indicator
4. **Outcome:** User will be reminded again later

### Flow 4: Dismiss Alert

1. User taps X button on an alert
2. Alert is dismissed permanently
3. Alert disappears from list
4. **Outcome:** Alert no longer shown

### Flow 5: Configure Notification Settings

1. User taps settings gear icon
2. Settings modal opens
3. User can toggle notifications on/off
4. User can select reminder days (1d, 2d, 3d, 5d, 7d)
5. User taps "Done" to close
6. **Outcome:** Settings saved for future alerts

### Flow 6: Notifications Disabled

1. User has notifications turned off
2. Banner shows "Notifications are off" with "Turn on" button
3. User taps "Turn on"
4. **Outcome:** Notifications enabled, banner disappears

## Done When

- [ ] Tests written for key user flows (success and failure paths)
- [ ] All tests pass
- [ ] Alerts component renders with real data
- [ ] Alerts grouped correctly by date
- [ ] Unread/read visual distinction works
- [ ] Mark as used removes item from inventory
- [ ] Snooze updates alert state
- [ ] Dismiss removes alert from view
- [ ] Settings modal opens and saves correctly
- [ ] Notifications disabled banner shows when appropriate
- [ ] Background job generates alerts based on settings
- [ ] Empty state displays when no notifications
- [ ] Responsive on mobile
