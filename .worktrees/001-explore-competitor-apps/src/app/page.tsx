"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/inventory");
      } else {
        // Check if onboarding is complete
        const onboardingComplete = localStorage.getItem("onboarding_complete");
        if (onboardingComplete) {
          router.replace("/login");
        } else {
          router.replace("/onboarding");
        }
      }
      setCheckingOnboarding(false);
    }
  }, [user, loading, router]);

  if (loading || checkingOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return null;
}
