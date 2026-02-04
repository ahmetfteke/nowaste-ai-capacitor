"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-b border-yellow-500/20">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>You&apos;re offline — changes will sync when you reconnect</span>
    </div>
  );
}
