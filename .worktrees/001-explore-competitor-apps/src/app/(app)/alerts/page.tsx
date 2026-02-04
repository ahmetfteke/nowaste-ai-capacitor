"use client";

import { Bell, Check, Clock, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAlerts } from "@/hooks/use-alerts";
import { useFoodItems } from "@/hooks/use-food-items";

export default function AlertsPage() {
  const { alerts, groupedAlerts, unreadCount, loading, markRead, snooze, dismiss } =
    useAlerts();
  const { markUsed } = useFoodItems();

  const handleMarkUsed = async (alertId: string, foodItemId: string) => {
    await markUsed(foodItemId);
    await dismiss(alertId);
  };

  const handleSnooze = async (alertId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    await snooze(alertId, tomorrow);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading alerts...</div>
      </div>
    );
  }

  // Empty state
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          No Alerts Yet
        </h2>
        <p className="text-muted-foreground max-w-sm">
          We&apos;ll notify you when items in your inventory are about to expire.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const sortedDates = Object.keys(groupedAlerts).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="min-h-full pb-4">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Alerts</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} new notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="px-5 space-y-6">
        <div className="max-w-md mx-auto">
          {sortedDates.map((dateKey) => (
            <div key={dateKey} className="mb-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                {formatDate(dateKey)}
              </h2>
              <div className="space-y-2">
                {groupedAlerts[dateKey].map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onMarkUsed={() => handleMarkUsed(alert.id, alert.foodItemId)}
                    onSnooze={() => handleSnooze(alert.id)}
                    onDismiss={() => dismiss(alert.id)}
                    onMarkRead={() => markRead(alert.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Alert Card Component
function AlertCard({
  alert,
  onMarkUsed,
  onSnooze,
  onDismiss,
  onMarkRead,
}: {
  alert: {
    id: string;
    foodItemName: string;
    message: string;
    expirationDate: string;
    status: string;
  };
  onMarkUsed: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
  onMarkRead: () => void;
}) {
  const isUnread = alert.status === "unread";
  const expDate = new Date(alert.expirationDate);
  const today = new Date();
  const isExpired = expDate < today;

  return (
    <Card
      className={`p-4 ${isUnread ? "ring-1 ring-primary/20 bg-primary/5" : ""}`}
      onClick={isUnread ? onMarkRead : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Indicator */}
        <div
          className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
            isExpired
              ? "bg-destructive"
              : isUnread
                ? "bg-primary"
                : "bg-muted-foreground/30"
          }`}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground truncate">
              {alert.foodItemName}
            </h3>
            {isExpired && (
              <Badge variant="destructive" className="text-xs">
                Expired
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{alert.message}</p>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="default"
              className="h-8"
              onClick={(e) => {
                e.stopPropagation();
                onMarkUsed();
              }}
            >
              <Check className="w-3 h-3 mr-1" />
              Used it
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={(e) => {
                e.stopPropagation();
                onSnooze();
              }}
            >
              <Clock className="w-3 h-3 mr-1" />
              Remind later
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
