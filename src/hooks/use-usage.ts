"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePurchases } from "@/hooks/use-purchases";
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Free tier limits
export const FREE_LIMITS = {
  foodItems: 100,
  shoppingItems: 100,
  aiScansPerMonth: 5,
  voiceMinutesPerMonth: 10, // 10 minutes
  barcodeScansPerMonth: 100,
};

// Premium limits
export const PREMIUM_LIMITS = {
  foodItems: 1000,
  shoppingItems: 1000,
  aiScansPerMonth: 1000,
  voiceMinutesPerMonth: 600, // 10 hours
  barcodeScansPerMonth: Infinity, // Unlimited
};

interface UsageData {
  aiScansThisMonth: number;
  voiceSecondsThisMonth: number; // Track in seconds for precision
  barcodeScansThisMonth: number;
  lastResetMonth: string; // "2024-01" format
}

export function useUsage() {
  const { user } = useAuth();
  const { isPremium: isPremiumFromRevenueCat } = usePurchases();
  const [isPremiumFromFirestore, setIsPremiumFromFirestore] = useState(false);

  // Use premium status from either source (RevenueCat SDK or Firestore)
  // This ensures premium works even if RevenueCat SDK hasn't synced yet
  const isPremium = isPremiumFromRevenueCat || isPremiumFromFirestore;
  const [usage, setUsage] = useState<UsageData>({
    aiScansThisMonth: 0,
    voiceSecondsThisMonth: 0,
    barcodeScansThisMonth: 0,
    lastResetMonth: "",
  });
  const [loading, setLoading] = useState(true);

  const limits = isPremium ? PREMIUM_LIMITS : FREE_LIMITS;

  // Get current month string
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  // Listen to Firestore for premium status (fallback if RevenueCat SDK hasn't synced)
  useEffect(() => {
    if (!user) {
      setIsPremiumFromFirestore(false);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setIsPremiumFromFirestore(data?.isPremium === true);
      } else {
        setIsPremiumFromFirestore(false);
      }
    }, (error) => {
      console.error("Failed to listen to premium status:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Load usage data
  useEffect(() => {
    async function loadUsage() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const usageRef = doc(db, "usage", user.uid);
        const usageDoc = await getDoc(usageRef);
        const currentMonth = getCurrentMonth();

        if (usageDoc.exists()) {
          const data = usageDoc.data() as UsageData;

          // Reset if new month
          if (data.lastResetMonth !== currentMonth) {
            await setDoc(usageRef, {
              aiScansThisMonth: 0,
              voiceSecondsThisMonth: 0,
              barcodeScansThisMonth: 0,
              lastResetMonth: currentMonth,
            });
            setUsage({ aiScansThisMonth: 0, voiceSecondsThisMonth: 0, barcodeScansThisMonth: 0, lastResetMonth: currentMonth });
          } else {
            // Ensure all fields exist for older docs
            setUsage({
              aiScansThisMonth: data.aiScansThisMonth || 0,
              voiceSecondsThisMonth: data.voiceSecondsThisMonth || 0,
              barcodeScansThisMonth: data.barcodeScansThisMonth || 0,
              lastResetMonth: data.lastResetMonth,
            });
          }
        } else {
          // Create new usage doc
          const newUsage = {
            aiScansThisMonth: 0,
            voiceSecondsThisMonth: 0,
            barcodeScansThisMonth: 0,
            lastResetMonth: currentMonth,
          };
          await setDoc(usageRef, newUsage);
          setUsage(newUsage);
        }
      } catch (error) {
        console.error("Failed to load usage:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUsage();
  }, [user]);

  // Increment AI scan count
  const incrementAiScans = useCallback(async () => {
    if (!user) return;

    try {
      const usageRef = doc(db, "usage", user.uid);
      await updateDoc(usageRef, {
        aiScansThisMonth: increment(1),
      });
      setUsage((prev) => ({
        ...prev,
        aiScansThisMonth: prev.aiScansThisMonth + 1,
      }));
    } catch (error) {
      console.error("Failed to increment AI scans:", error);
    }
  }, [user]);

  // Increment voice seconds used
  const incrementVoiceSeconds = useCallback(async (seconds: number) => {
    if (!user || seconds <= 0) return;

    try {
      const usageRef = doc(db, "usage", user.uid);
      await updateDoc(usageRef, {
        voiceSecondsThisMonth: increment(seconds),
      });
      setUsage((prev) => ({
        ...prev,
        voiceSecondsThisMonth: prev.voiceSecondsThisMonth + seconds,
      }));
    } catch (error) {
      console.error("Failed to increment voice seconds:", error);
    }
  }, [user]);

  // Increment barcode scan count
  const incrementBarcodeScans = useCallback(async () => {
    if (!user) return;

    try {
      const usageRef = doc(db, "usage", user.uid);
      await updateDoc(usageRef, {
        barcodeScansThisMonth: increment(1),
      });
      setUsage((prev) => ({
        ...prev,
        barcodeScansThisMonth: prev.barcodeScansThisMonth + 1,
      }));
    } catch (error) {
      console.error("Failed to increment barcode scans:", error);
    }
  }, [user]);

  // Check if user can perform actions
  const canAddFoodItem = (currentCount: number) => {
    return currentCount < limits.foodItems;
  };

  const canAddShoppingItem = (currentCount: number) => {
    return currentCount < limits.shoppingItems;
  };

  const canUseAiScan = () => {
    return usage.aiScansThisMonth < limits.aiScansPerMonth;
  };

  const canUseVoiceInput = () => {
    const usedMinutes = Math.floor(usage.voiceSecondsThisMonth / 60);
    return usedMinutes < limits.voiceMinutesPerMonth;
  };

  const canUseBarcodeScanner = () => {
    return usage.barcodeScansThisMonth < limits.barcodeScansPerMonth;
  };

  // Get remaining counts
  const remainingFoodItems = (currentCount: number) => {
    return Math.max(0, limits.foodItems - currentCount);
  };

  const remainingShoppingItems = (currentCount: number) => {
    return Math.max(0, limits.shoppingItems - currentCount);
  };

  const remainingAiScans = () => {
    return Math.max(0, limits.aiScansPerMonth - usage.aiScansThisMonth);
  };

  const remainingVoiceMinutes = () => {
    const usedMinutes = Math.floor(usage.voiceSecondsThisMonth / 60);
    return Math.max(0, limits.voiceMinutesPerMonth - usedMinutes);
  };

  const remainingBarcodeScans = () => {
    if (limits.barcodeScansPerMonth === Infinity) return Infinity;
    return Math.max(0, limits.barcodeScansPerMonth - usage.barcodeScansThisMonth);
  };

  const usedVoiceMinutes = () => {
    return Math.floor(usage.voiceSecondsThisMonth / 60);
  };

  return {
    loading,
    isPremium,
    limits,
    usage,
    canAddFoodItem,
    canAddShoppingItem,
    canUseAiScan,
    canUseVoiceInput,
    canUseBarcodeScanner,
    remainingFoodItems,
    remainingShoppingItems,
    remainingAiScans,
    remainingVoiceMinutes,
    remainingBarcodeScans,
    usedVoiceMinutes,
    incrementAiScans,
    incrementVoiceSeconds,
    incrementBarcodeScans,
  };
}
