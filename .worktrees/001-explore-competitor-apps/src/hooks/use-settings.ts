"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { subscribeUserDocument, updateUserDocument, UserDocument } from "@/lib/firestore";

const DEFAULT_SETTINGS = {
  unitSystem: "metric" as const,
  alertTime: "morning" as const,
  timezone: "UTC",
};

export interface UserSettings {
  unitSystem: "metric" | "imperial";
  alertTime: "morning" | "afternoon" | "evening" | "off";
  timezone: string;
}

export function useSettings() {
  const { user } = useAuth();
  const [userDoc, setUserDoc] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeUserDocument(user.uid, (doc) => {
      setUserDoc(doc);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) throw new Error("Not authenticated");
    await updateUserDocument(user.uid, newSettings);
  };

  // Return settings with defaults applied
  const settings: UserSettings = {
    unitSystem: userDoc?.unitSystem ?? DEFAULT_SETTINGS.unitSystem,
    alertTime: userDoc?.alertTime ?? DEFAULT_SETTINGS.alertTime,
    timezone: userDoc?.timezone ?? DEFAULT_SETTINGS.timezone,
  };

  return {
    settings,
    loading,
    updateSettings,
  };
}
