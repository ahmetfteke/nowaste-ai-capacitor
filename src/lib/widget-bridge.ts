import { Capacitor, registerPlugin } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { FoodItem } from '@/types';

interface WidgetUpdatePlugin {
  notifyUpdate(): Promise<void>;
}

const WidgetUpdate = registerPlugin<WidgetUpdatePlugin>('WidgetUpdate');

/**
 * Calculate the number of days from now until the given date string.
 * Returns a negative number if the date is in the past.
 */
export function getDaysUntilExpiry(dateStr: string): number {
  const now = new Date();
  const expiry = new Date(dateStr);

  // Strip time components to compare dates only
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());

  const diffMs = expiryDay.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Notify the native Android widget to refresh its data.
 */
export async function notifyWidgetUpdate(): Promise<void> {
  if (Capacitor.getPlatform() === 'android') {
    await WidgetUpdate.notifyUpdate();
  }
}

/**
 * Push the latest expiring-soon items to SharedPreferences so the
 * Android home screen widget can display them.
 *
 * - Filters to items expiring within 7 days
 * - Sorts by soonest expiry first
 * - Takes the top 5
 * - Persists as JSON under the key "expiringItems"
 * - Signals the native widget to refresh (Android only)
 */
export async function updateWidgetData(items: FoodItem[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  const expiringItems = items
    .map((item) => ({
      name: item.name,
      expirationDate: item.expirationDate,
      daysUntilExpiry: getDaysUntilExpiry(item.expirationDate),
      quantity: `${item.quantity} ${item.unit}`,
    }))
    .filter((item) => item.daysUntilExpiry >= 0 && item.daysUntilExpiry <= 7)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
    .slice(0, 5);

  await Preferences.set({
    key: 'expiringItems',
    value: JSON.stringify(expiringItems),
  });

  await notifyWidgetUpdate();
}
