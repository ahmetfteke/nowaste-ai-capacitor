"use client";

import { useState, useEffect, useCallback } from "react";
import { getRemoteConfig, fetchAndActivate, getValue } from "firebase/remote-config";
import { app } from "@/lib/firebase";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

interface UpdateInfo {
  updateAvailable: boolean;
  forceUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  storeUrl: string;
}

// Default values if Remote Config fails
const DEFAULTS = {
  latest_app_version: "1.0.0",
  minimum_app_version: "1.0.0",
  play_store_url: "https://play.google.com/store/apps/details?id=com.nowaste.ai",
  app_store_url: "https://apps.apple.com/app/id123456789",
  update_description: "A new version is available with improvements and new features!",
};

// Compare semantic versions: returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export function useAppUpdate() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const checkForUpdate = useCallback(async () => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      setLoading(false);
      return;
    }

    try {
      // Get current app version
      const appInfo = await App.getInfo();
      const currentVersion = appInfo.version;

      // Initialize Remote Config
      const remoteConfig = getRemoteConfig(app);
      remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour cache

      // Set defaults
      remoteConfig.defaultConfig = DEFAULTS;

      // Fetch and activate
      await fetchAndActivate(remoteConfig);

      // Get values from Remote Config
      const platform = Capacitor.getPlatform();
      const latestVersion = getValue(remoteConfig, "latest_app_version").asString();
      const minVersion = getValue(remoteConfig, "minimum_app_version").asString();

      // Determine store URL based on platform
      const storeUrl = platform === "ios"
        ? getValue(remoteConfig, "app_store_url").asString()
        : getValue(remoteConfig, "play_store_url").asString();

      // Check if update is available
      const updateAvailable = compareVersions(latestVersion, currentVersion) > 0;

      // Force update if current version is below minimum
      const mustForceUpdate = compareVersions(minVersion, currentVersion) > 0;

      setUpdateInfo({
        updateAvailable,
        forceUpdate: mustForceUpdate,
        currentVersion,
        latestVersion,
        storeUrl,
      });
    } catch (error) {
      console.error("Failed to check for updates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  const openStore = useCallback(async () => {
    if (updateInfo?.storeUrl) {
      window.open(updateInfo.storeUrl, "_blank");
    }
  }, [updateInfo]);

  const dismissUpdate = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    loading,
    updateAvailable: updateInfo?.updateAvailable && !dismissed,
    forceUpdate: updateInfo?.forceUpdate,
    currentVersion: updateInfo?.currentVersion,
    latestVersion: updateInfo?.latestVersion,
    openStore,
    dismissUpdate,
    checkForUpdate,
  };
}
