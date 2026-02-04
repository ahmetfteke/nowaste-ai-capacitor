"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Scale, Bell, LogOut, Crown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/hooks/use-settings";
import { useAuth } from "@/lib/auth-context";
import { usePurchases } from "@/hooks/use-purchases";
import { Paywall } from "@/components/paywall";
import { Capacitor } from "@capacitor/core";

// Check if we're in a Capacitor environment
const isCapacitorEnv = typeof window !== "undefined" && !!(window as any).Capacitor;

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { settings, loading, updateSettings } = useSettings();
  const { isPremium, subscription } = usePurchases();
  const [saving, setSaving] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleManageSubscription = () => {
    const platform = Capacitor.getPlatform();
    if (platform === "android") {
      window.open("https://play.google.com/store/account/subscriptions", "_blank");
    } else if (platform === "ios") {
      window.open("https://apps.apple.com/account/subscriptions", "_blank");
    } else {
      window.open("https://play.google.com/store/account/subscriptions", "_blank");
    }
  };

  const handleUnitChange = async (value: "metric" | "imperial") => {
    setSaving(true);
    try {
      await updateSettings({ unitSystem: value });
    } finally {
      setSaving(false);
    }
  };

  const handleAlertTimeChange = async (value: "morning" | "afternoon" | "evening" | "off") => {
    setSaving(true);
    try {
      // If enabling notifications (from off to something else), request permissions
      if (value !== "off" && settings.alertTime === "off" && isCapacitorEnv) {
        try {
          const { PushNotifications } = await import("@capacitor/push-notifications");

          // Check current permission status
          const permStatus = await PushNotifications.checkPermissions();

          if (permStatus.receive !== "granted") {
            // Request permission
            const result = await PushNotifications.requestPermissions();
            if (result.receive !== "granted") {
              // User denied, don't change setting
              setSaving(false);
              return;
            }
          }

          // Register for push notifications - FCM token is saved by use-notifications hook listener
          await PushNotifications.register();
        } catch (error) {
          console.error("Failed to setup push notifications:", error);
        }
      }

      await updateSettings({ alertTime: value });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -ml-2"
              onClick={() => router.back()}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          </div>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="px-5 pb-6">
        <div className="max-w-md mx-auto space-y-4">
          {/* Account Section */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">
              Account
            </h2>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">
                      {user?.displayName || "User"}
                    </p>
                    {isPremium && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <Crown className="w-3 h-3" />
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Subscription Section */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">
              Subscription
            </h2>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {isPremium ? "Premium Plan" : "Free Plan"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isPremium
                        ? subscription.willRenew
                          ? "Renews automatically"
                          : "Expires soon"
                        : "100 items, 5 AI scans/month"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isPremium ? handleManageSubscription : () => setShowPaywall(true)}
                >
                  {isPremium ? "Manage" : "Upgrade"}
                  {isPremium && <ExternalLink className="w-3 h-3 ml-1" />}
                </Button>
              </div>
            </Card>
          </div>

          {/* Preferences Section */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">
              Preferences
            </h2>
            <Card className="p-4 space-y-4">
              {/* Unit System */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Scale className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <Label className="text-foreground">Unit System</Label>
                    <p className="text-xs text-muted-foreground">
                      For quantities and measurements
                    </p>
                  </div>
                </div>
                <Select
                  value={settings.unitSystem}
                  onValueChange={handleUnitChange}
                  disabled={loading || saving}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric</SelectItem>
                    <SelectItem value="imperial">Imperial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Alert Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <Label className="text-foreground">Expiration Alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      When to check for expiring items
                    </p>
                  </div>
                </div>
                <Select
                  value={settings.alertTime}
                  onValueChange={handleAlertTimeChange}
                  disabled={loading || saving}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="off">Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          </div>

          {/* Legal Section */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">
              Legal
            </h2>
            <Card className="p-4 space-y-3">
              <a
                href="https://nowaste.ai/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-foreground hover:text-primary"
              >
                <span>Privacy Policy</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
              <a
                href="https://nowaste.ai/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-foreground hover:text-primary"
              >
                <span>Terms of Service</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            </Card>
          </div>

          {/* Sign Out */}
          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Paywall */}
      <Paywall open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}
