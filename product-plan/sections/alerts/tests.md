# Test Instructions: Alerts

These test-writing instructions are **framework-agnostic**. Adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, React Testing Library, RSpec, Minitest, PHPUnit, etc.).

## Overview

The Alerts section shows notification history for expiring food items. Users can act on alerts (mark used, snooze, dismiss) and configure notification settings.

---

## User Flow Tests

### Flow 1: View Notification History

**Scenario:** User views their notification history

#### Success Path

**Setup:**
- User has alerts from different dates
- Mix of unread and read alerts

**Steps:**
1. User navigates to Alerts section
2. User sees alerts grouped by date

**Expected Results:**
- [ ] Header shows "Notifications" title
- [ ] Unread count badge shows next to title
- [ ] Alerts grouped: "Today", "Yesterday", "This Week", "Older"
- [ ] Each section shows "X new" badge if has unread alerts
- [ ] Alerts show food item name, message, expiration badge, timestamp

---

### Flow 2: Mark Item as Used from Alert

**Scenario:** User acts on an alert to mark the food item as used

#### Success Path

**Setup:**
- User has alert for "Greek Yogurt"

**Steps:**
1. User sees alert card with checkmark button
2. User taps checkmark button

**Expected Results:**
- [ ] `onMarkUsed` callback called with (alertId, foodItemId)
- [ ] Alert is resolved/removed
- [ ] Food item marked as used in inventory

---

### Flow 3: Snooze Alert

**Scenario:** User wants to be reminded later

#### Success Path

**Setup:**
- User has alert they don't want to act on yet

**Steps:**
1. User taps clock button on alert
2. Alert is snoozed

**Expected Results:**
- [ ] `onSnooze` callback called with alertId
- [ ] Alert shows "Snoozed" indicator
- [ ] Alert will reappear later based on snooze time

---

### Flow 4: Dismiss Alert

**Scenario:** User permanently dismisses an alert

#### Success Path

**Setup:**
- User has alert they don't need

**Steps:**
1. User taps X button on alert
2. Alert is dismissed

**Expected Results:**
- [ ] `onDismiss` callback called with alertId
- [ ] Alert disappears from list
- [ ] Alert won't reappear

---

### Flow 5: Mark Alert as Read

**Scenario:** User taps unread alert to mark as read

#### Success Path

**Setup:**
- User has unread alert (green background, dot indicator)

**Steps:**
1. User taps anywhere on the alert card
2. Alert becomes read

**Expected Results:**
- [ ] `onMarkRead` callback called with alertId
- [ ] Green background removed
- [ ] Dot indicator removed
- [ ] Unread count badge decrements

---

### Flow 6: Configure Notification Settings

**Scenario:** User changes notification preferences

#### Success Path

**Steps:**
1. User taps settings gear icon in header
2. Settings modal slides up from bottom
3. User sees toggle for "Enable notifications"
4. User sees reminder day options (1d, 2d, 3d, 5d, 7d)
5. User toggles notifications off
6. User selects/deselects reminder days
7. User taps "Done" to close

**Expected Results:**
- [ ] Settings modal opens with current settings displayed
- [ ] Toggle reflects current enabled state
- [ ] Selected reminder days are highlighted (emerald)
- [ ] Changes call `onUpdateSettings` immediately
- [ ] "Done" closes modal
- [ ] Clicking backdrop also closes modal

---

### Flow 7: Notifications Disabled Banner

**Scenario:** User has notifications turned off

#### Success Path

**Setup:**
- `settings.enabled` is `false`

**Expected Results:**
- [ ] Banner shows below header
- [ ] Banner text: "Notifications are off"
- [ ] Subtext: "You won't receive alerts about expiring items"
- [ ] "Turn on" button in banner
- [ ] Clicking "Turn on" enables notifications

---

## Empty State Tests

### No Notifications Yet

**Scenario:** User has no notification history

**Setup:**
- `alerts` array is empty

**Expected Results:**
- [ ] Shows empty state with bell icon
- [ ] Shows message: "No notifications yet"
- [ ] Shows subtext: "We'll let you know when items are about to expire"
- [ ] No section headers shown
- [ ] Settings button still accessible

### All Alerts Dismissed

**Scenario:** User has dismissed all alerts

**Setup:**
- All alerts have `status: 'dismissed'`

**Expected Results:**
- [ ] Same as "No notifications yet" empty state
- [ ] Dismissed alerts are filtered out

---

## Component Interaction Tests

### Alerts Component

**Renders correctly:**
- [ ] Shows header with "Notifications" title
- [ ] Shows unread count badge when > 0 unread
- [ ] Shows settings gear button
- [ ] Groups alerts by date correctly
- [ ] Renders AlertCard for each alert

**Header interactions:**
- [ ] Settings button calls `onOpenSettings` and opens modal

**Settings modal:**
- [ ] Toggle switch reflects `settings.enabled`
- [ ] Clicking toggle calls `onUpdateSettings`
- [ ] Reminder day buttons reflect `settings.reminderDays`
- [ ] Clicking day button toggles selection
- [ ] "Done" button closes modal
- [ ] Clicking backdrop closes modal

### AlertCard Component

**Renders correctly:**
- [ ] Shows food item name (e.g., "Greek Yogurt")
- [ ] Shows message (e.g., "Expires today!")
- [ ] Shows expiration badge with appropriate styling
- [ ] Shows timestamp (e.g., "2h ago", "Yesterday")
- [ ] Unread alerts have green background
- [ ] Unread alerts have green dot indicator

**Expiration badge styling:**
- [ ] Expired: red badge
- [ ] Today/Tomorrow/Soon: amber badge
- [ ] Later: neutral badge

**Snoozed alert:**
- [ ] Shows "Snoozed" indicator with clock icon

**Interactions:**
- [ ] Clicking card calls `onMarkRead` if unread
- [ ] Checkmark button calls `onMarkUsed`
- [ ] Clock button calls `onSnooze`
- [ ] X button calls `onDismiss`
- [ ] Button clicks don't trigger card click (stopPropagation)

---

## Edge Cases

- [ ] Very long item name truncates appropriately
- [ ] Very long message is truncated (line-clamp)
- [ ] Works with 1 alert and 50+ alerts
- [ ] Handles rapid button clicks (debouncing)
- [ ] Handles alerts with missing optional fields
- [ ] Settings modal scrollable if content overflows
- [ ] Transition from empty to populated (new alert arrives)
- [ ] Transition from populated to empty (all dismissed)

---

## Accessibility Checks

- [ ] All buttons are keyboard accessible
- [ ] Modal traps focus when open
- [ ] Modal can be closed with Escape key
- [ ] Toggle switch is accessible
- [ ] Screen reader announces unread count
- [ ] Color contrast meets WCAG standards

---

## Sample Test Data

```typescript
// Example alerts
const mockAlerts = [
  {
    id: "alert-001",
    foodItemId: "item-001",
    foodItemName: "Greek Yogurt",
    message: "Expires today! Use it before it goes bad.",
    expirationDate: "2024-02-07",
    status: "unread",
    sentAt: "2024-02-07T08:00:00Z"
  },
  {
    id: "alert-002",
    foodItemId: "item-002",
    foodItemName: "Baby Spinach",
    message: "Expiring tomorrow. Time to make a salad!",
    expirationDate: "2024-02-08",
    status: "read",
    sentAt: "2024-02-07T08:00:00Z"
  },
  {
    id: "alert-003",
    foodItemId: "item-003",
    foodItemName: "Whole Milk",
    message: "Expires in 3 days. Don't forget!",
    expirationDate: "2024-02-10",
    status: "snoozed",
    snoozedUntil: "2024-02-08T08:00:00Z",
    sentAt: "2024-02-06T08:00:00Z"
  }
];

// Example settings
const mockSettings = {
  enabled: true,
  reminderDays: [1, 3]
};

// Disabled settings
const mockDisabledSettings = {
  enabled: false,
  reminderDays: [1, 3]
};

// Empty alerts
const mockEmptyAlerts = [];

// All dismissed
const mockAllDismissed = mockAlerts.map(a => ({ ...a, status: "dismissed" }));
```

---

## Notes for Test Implementation

- Mock date functions for consistent timestamp testing
- Test each alert status (unread, read, snoozed, dismissed)
- Verify grouping logic puts alerts in correct date sections
- Test settings toggle and reminder day buttons
- Ensure button clicks don't bubble to card click
- Test modal open/close behavior
- Verify empty states appear at appropriate times
- Test notifications disabled banner appears/hides correctly
