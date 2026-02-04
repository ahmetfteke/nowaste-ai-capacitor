"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { updateUserDocument, subscribeUserDocument } from "@/lib/firestore";

// Check if we're in a Capacitor environment
const isCapacitor = typeof window !== "undefined" && !!(window as any).Capacitor;

export function useNotifications() {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied" | "unknown">("unknown");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hasBeenAsked, setHasBeenAsked] = useState(false);
  const [loading, setLoading] = useState(true);
  const listenersSetup = useRef(false);

  // Setup push notification listeners (for receiving FCM token)
  useEffect(() => {
    if (!isCapacitor || !user || listenersSetup.current) return;

    async function setupListeners() {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        // Listen for successful registration - this gives us the FCM token
        await PushNotifications.addListener("registration", async (token) => {
          console.log("Push registration success, FCM token:", token.value);
          // Save the FCM token to users collection
          try {
            await updateUserDocument(user!.uid, { fcmToken: token.value });
            console.log("FCM token saved to Firestore");
          } catch (error) {
            console.error("Failed to save FCM token:", error);
          }
        });

        // Listen for registration errors
        await PushNotifications.addListener("registrationError", (error) => {
          console.error("Push registration error:", error);
        });

        // Listen for push notifications received while app is in foreground
        await PushNotifications.addListener("pushNotificationReceived", (notification) => {
          console.log("Push notification received:", notification);
        });

        // Listen for notification action (user tapped notification)
        await PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
          console.log("Push notification action:", notification);
          // Navigate to alerts page when notification is tapped
          if (typeof window !== "undefined") {
            window.location.href = "/alerts";
          }
        });

        listenersSetup.current = true;
      } catch (error) {
        console.error("Failed to setup push notification listeners:", error);
      }
    }

    setupListeners();
  }, [user]);

  // Load settings from users collection
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeUserDocument(user.uid, async (userDoc) => {
      if (userDoc) {
        // If alertTime exists and is not "off", notifications are enabled
        const enabled = userDoc.alertTime && userDoc.alertTime !== "off";
        setNotificationsEnabled(!!enabled);
        setHasBeenAsked(!!userDoc.alertTime);

        // If notifications enabled but fcmToken missing, register to get token
        if (enabled && !userDoc.fcmToken && isCapacitor) {
          try {
            const { PushNotifications } = await import("@capacitor/push-notifications");
            const permStatus = await PushNotifications.checkPermissions();
            if (permStatus.receive === "granted") {
              console.log("FCM token missing, registering...");
              await PushNotifications.register();
            }
          } catch (error) {
            console.error("Failed to register for push notifications:", error);
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Check native permission status
  useEffect(() => {
    async function checkPermission() {
      if (isCapacitor) {
        try {
          const { PushNotifications } = await import("@capacitor/push-notifications");
          const result = await PushNotifications.checkPermissions();
          setPermissionStatus(result.receive as "prompt" | "granted" | "denied");
        } catch (error) {
          console.error("Failed to check push notification permissions:", error);
          setPermissionStatus("unknown");
        }
      } else {
        // Web fallback - check Notification API
        if ("Notification" in window) {
          setPermissionStatus(Notification.permission as "prompt" | "granted" | "denied");
        }
      }
    }

    checkPermission();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      let granted = false;

      if (isCapacitor) {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        const result = await PushNotifications.requestPermissions();
        granted = result.receive === "granted";
        setPermissionStatus(result.receive as "prompt" | "granted" | "denied");

        if (granted) {
          // Register for push notifications - this triggers the registration listener
          // which saves the FCM token
          await PushNotifications.register();
        }
      } else {
        // Web fallback
        if ("Notification" in window) {
          const permission = await Notification.requestPermission();
          granted = permission === "granted";
          setPermissionStatus(permission as "prompt" | "granted" | "denied");
        }
      }

      // Save to users collection
      await updateUserDocument(user.uid, {
        alertTime: granted ? "morning" : "off",
        reminderDays: granted ? [1, 3, 7] : [],
      });

      setNotificationsEnabled(granted);
      setHasBeenAsked(true);

      return granted;
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return false;
    }
  }, [user]);

  const declineNotifications = useCallback(async () => {
    if (!user) return;

    try {
      await updateUserDocument(user.uid, {
        alertTime: "off",
        reminderDays: [],
      });

      setNotificationsEnabled(false);
      setHasBeenAsked(true);
    } catch (error) {
      console.error("Failed to save notification preference:", error);
    }
  }, [user]);

  // Should show the prompt if user hasn't set alertTime yet
  const shouldShowPrompt = !loading && !hasBeenAsked;

  return {
    permissionStatus,
    notificationsEnabled,
    hasBeenAsked,
    loading,
    shouldShowPrompt,
    requestPermission,
    declineNotifications,
  };
}
