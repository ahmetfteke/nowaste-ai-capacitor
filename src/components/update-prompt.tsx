"use client";

import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useAppUpdate } from "@/hooks/use-app-update";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, X, Sparkles } from "lucide-react";

export function UpdatePrompt() {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const {
    loading,
    updateAvailable,
    forceUpdate,
    currentVersion,
    latestVersion,
    openStore,
    dismissUpdate,
  } = useAppUpdate();

  // Don't show on web or while loading or if no update
  if (!isNative || loading || !updateAvailable) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm p-6 relative">
          {/* Close button - only if not forced */}
          {!forceUpdate && (
            <button
              onClick={dismissUpdate}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground mb-2">
              {forceUpdate ? "Update Required" : "Update Available"}
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              {forceUpdate
                ? "Please update to continue using No Waste AI."
                : "A new version is available with improvements and new features!"}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentVersion} → {latestVersion}
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Button onClick={openStore} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Update Now
            </Button>

            {!forceUpdate && (
              <Button
                variant="ghost"
                onClick={dismissUpdate}
                className="w-full text-muted-foreground"
              >
                Later
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
