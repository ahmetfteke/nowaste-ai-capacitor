"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { subscribeAlerts, updateAlert } from "@/lib/firestore";
import type { Alert } from "@/types";

export function useAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeAlerts(user.uid, (fetchedAlerts) => {
      setAlerts(fetchedAlerts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markRead = async (id: string) => {
    try {
      await updateAlert(id, { status: "read" });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to mark alert as read"));
      throw err;
    }
  };

  const snooze = async (id: string, until: Date) => {
    try {
      await updateAlert(id, {
        status: "snoozed",
        snoozedUntil: until.toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to snooze alert"));
      throw err;
    }
  };

  const dismiss = async (id: string) => {
    try {
      await updateAlert(id, { status: "dismissed" });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to dismiss alert"));
      throw err;
    }
  };

  // Filter out dismissed and snoozed alerts
  const activeAlerts = alerts.filter(
    (alert) =>
      alert.status !== "dismissed" &&
      (alert.status !== "snoozed" ||
        (alert.snoozedUntil && new Date(alert.snoozedUntil) <= new Date()))
  );

  const unreadCount = alerts.filter((alert) => alert.status === "unread").length;

  // Group alerts by date
  const groupedAlerts = activeAlerts.reduce(
    (groups, alert) => {
      const date = new Date(alert.sentAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(alert);
      return groups;
    },
    {} as Record<string, Alert[]>
  );

  return {
    alerts: activeAlerts,
    groupedAlerts,
    unreadCount,
    loading,
    error,
    markRead,
    snooze,
    dismiss,
  };
}
