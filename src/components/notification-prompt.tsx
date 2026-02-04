"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface NotificationPromptProps {
  onEnable: () => void;
  onDecline: () => void;
  variant?: "card" | "banner";
}

export function NotificationPrompt({
  onEnable,
  onDecline,
  variant = "card",
}: NotificationPromptProps) {
  if (variant === "banner") {
    return (
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground mb-1">
              Enable Expiration Alerts
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Get notified before your food expires so you never waste it.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={onEnable}>
                Enable
              </Button>
              <Button size="sm" variant="ghost" onClick={onDecline}>
                Not now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Bell className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Never Let Food Go to Waste
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Would you like to receive notifications when your food is about to expire?
        We&apos;ll remind you before it&apos;s too late.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button onClick={onEnable} className="sm:min-w-[140px]">
          <Bell className="w-4 h-4 mr-2" />
          Enable Alerts
        </Button>
        <Button variant="outline" onClick={onDecline} className="sm:min-w-[140px]">
          Maybe Later
        </Button>
      </div>
    </Card>
  );
}
