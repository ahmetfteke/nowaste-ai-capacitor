"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Settings, User, Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribeAlerts } from "@/lib/firestore";

export function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeAlerts(user.uid, (alerts) => {
      const unread = alerts.filter((a) => a.status === "unread").length;
      setUnreadCount(unread);
    });

    return unsubscribe;
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium overflow-hidden">
        {user.photoURL && !imgError ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "User"}
            className="w-8 h-8 rounded-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <User className="w-4 h-4" />
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push("/alerts")}
        className="text-muted-foreground hover:text-foreground relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push("/feedback")}
        className="text-muted-foreground hover:text-foreground"
      >
        <MessageSquare className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push("/settings")}
        className="text-muted-foreground hover:text-foreground"
      >
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
}
