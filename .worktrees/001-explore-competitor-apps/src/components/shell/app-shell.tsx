"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MainNav } from "./main-nav";
import { UserMenu } from "./user-menu";
import { NotificationBanner } from "./notification-banner";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <h1 className="text-base font-semibold text-foreground">
          No Waste AI
        </h1>
        <UserMenu />
      </header>

      {/* Notification Permission Banner */}
      <NotificationBanner />

      {/* Main Content */}
      <main className="flex-1 pb-20 overflow-auto">{children}</main>

      {/* Bottom Navigation */}
      <MainNav />
    </div>
  );
}
