# Alerts

## Overview

A history of notifications sent to the user about expiring food items. Users can take action on alerts (mark as used, snooze, dismiss) and configure basic notification settings like timing preferences.

## User Flows

- View notification history grouped by date (Today, Yesterday, This Week, Older)
- Mark an item as used directly from the alert
- Snooze an alert to be reminded later
- Dismiss an alert permanently
- Access notification settings to toggle alerts on/off and set reminder timing

## Design Decisions

- Modern mobile notification list with grouped sections
- Unread alerts have subtle green background and dot indicator
- Circular action buttons for quick actions (mark used, snooze, dismiss)
- Pill badges for expiration status with color coding (amber for urgent, red for expired)
- Bottom sheet modal for notification settings
- Disabled notifications banner with quick "Turn on" button

## Data Used

**Entities:** Alert, NotificationSettings

**From global model:** Alert (notification records), links to FoodItem

## Components Provided

- `Alerts` — Main view with alert list, settings button, and settings modal
- `AlertCard` — Individual alert card with actions and status indicators

## Callback Props

| Callback | Description |
|----------|-------------|
| `onMarkUsed` | Called with (alertId, foodItemId) when user taps checkmark |
| `onSnooze` | Called with alertId when user taps clock button |
| `onDismiss` | Called with alertId when user taps X button |
| `onMarkRead` | Called with alertId when user taps an unread alert |
| `onUpdateSettings` | Called with new settings when user changes preferences |
| `onOpenSettings` | Called when settings panel opens (for analytics) |
