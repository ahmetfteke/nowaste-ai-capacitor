"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Check if we're in a Capacitor environment
const isCapacitor = typeof window !== "undefined" && !!(window as any).Capacitor;

export function NotificationBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (dismissed) return;

    async function checkPermission() {
      if (isCapacitor) {
        try {
          const { PushNotifications } = await import("@capacitor/push-notifications");
          const result = await PushNotifications.checkPermissions();

          // Show banner if notifications are denied
          if (result.receive === "denied") {
            setShowBanner(true);
          }
        } catch (error) {
          console.error("Failed to check notification permission:", error);
        }
      } else {
        // Web fallback
        if ("Notification" in window && Notification.permission === "denied") {
          setShowBanner(true);
        }
      }
    }

    // Small delay to not interrupt app loading
    const timer = setTimeout(checkPermission, 1000);
    return () => clearTimeout(timer);
  }, [dismissed]);

  const handleOpenSettings = async () => {
    // Try to request permission again - on Android this may open settings
    if (isCapacitor) {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        const result = await PushNotifications.requestPermissions();
        if (result.receive === "granted") {
          await PushNotifications.register();
          setShowBanner(false);
        }
      } catch (error) {
        console.error("Failed to request permissions:", error);
      }
    }
    setDismissed(true);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-muted/50 border-b border-border px-4 py-3">
      <div className="flex items-start gap-3">
        <Bell className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Notifications are blocked
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enable notifications in your device settings to get expiration alerts.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="default"
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={handleOpenSettings}
          >
            Enable
          </Button>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
