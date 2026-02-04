"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAuth } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Check if we're in a Capacitor native environment
const isCapacitor = typeof window !== "undefined" && !!(window as any).Capacitor;

// RevenueCat API key
const REVENUECAT_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY || "goog_BOapXtalXcObQqhoTKVRZzhlgUT";

// Firebase function URL for syncing premium status
const SYNC_PREMIUM_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL
  ? `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/syncPremiumStatus`
  : "https://us-central1-nowaste-ai.cloudfunctions.net/syncPremiumStatus";

export interface SubscriptionInfo {
  isActive: boolean;
  productId: string | null;
  expirationDate: Date | null;
  willRenew: boolean;
}

export interface Package {
  identifier: string;
  productId: string;
  priceString: string;
  title: string;
  description: string;
}

export function usePurchases() {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    isActive: false,
    productId: null,
    expirationDate: null,
    willRenew: false,
  });
  const [packages, setPackages] = useState<Package[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPremiumFromFirestore, setIsPremiumFromFirestore] = useState(false);

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
        const firestorePremium = data?.isPremium === true;
        setIsPremiumFromFirestore(firestorePremium);
        console.log("[RevenueCat] Firestore isPremium:", firestorePremium);
      } else {
        setIsPremiumFromFirestore(false);
      }
    }, (error) => {
      console.error("[RevenueCat] Failed to listen to Firestore premium status:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Initialize RevenueCat
  useEffect(() => {
    async function initRevenueCat() {
      if (!isCapacitor) {
        // On web, skip RevenueCat initialization
        setLoading(false);
        return;
      }

      try {
        const { Purchases } = await import("@revenuecat/purchases-capacitor");

        await Purchases.configure({
          apiKey: REVENUECAT_API_KEY,
        });

        setIsInitialized(true);
        console.log("[RevenueCat] Initialized");
      } catch (err) {
        console.error("[RevenueCat] Failed to initialize:", err);
        setError("Failed to initialize purchases");
      } finally {
        setLoading(false);
      }
    }

    initRevenueCat();
  }, []);

  // Login user to RevenueCat when authenticated
  useEffect(() => {
    async function loginUser() {
      if (!isCapacitor || !isInitialized || !user) return;

      try {
        const { Purchases } = await import("@revenuecat/purchases-capacitor");
        await Purchases.logIn({ appUserID: user.uid });
        console.log("[RevenueCat] User logged in:", user.uid);

        // Fetch customer info after login
        await refreshSubscriptionStatus();
      } catch (err) {
        console.error("[RevenueCat] Failed to login user:", err);
      }
    }

    loginUser();
  }, [isInitialized, user]);

  // Sync premium status to Firestore (belt-and-suspenders with webhook)
  const syncPremiumToFirestore = useCallback(async (
    isPremium: boolean,
    productId?: string | null,
    expirationDate?: Date | null
  ) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("[RevenueCat] No user to sync premium status for");
        return;
      }

      const idToken = await currentUser.getIdToken();

      const response = await fetch(SYNC_PREMIUM_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isPremium,
          productId: productId || null,
          expirationDate: expirationDate?.toISOString() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[RevenueCat] Failed to sync premium to Firestore:", errorData);
      } else {
        console.log("[RevenueCat] Successfully synced premium status to Firestore:", isPremium);
      }
    } catch (err) {
      console.error("[RevenueCat] Error syncing premium to Firestore:", err);
    }
  }, []);

  // Refresh subscription status
  const refreshSubscriptionStatus = useCallback(async (syncToFirestore = false) => {
    if (!isCapacitor || !isInitialized) return;

    try {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const { customerInfo } = await Purchases.getCustomerInfo();

      // Check for any active entitlements
      const activeEntitlements = customerInfo.entitlements?.active || {};
      const entitlementKeys = Object.keys(activeEntitlements);
      console.log("[RevenueCat] Active entitlements:", entitlementKeys);

      if (entitlementKeys.length > 0) {
        const firstEntitlement = activeEntitlements[entitlementKeys[0]];
        const newSubscription = {
          isActive: true,
          productId: firstEntitlement.productIdentifier,
          expirationDate: firstEntitlement.expirationDate
            ? new Date(firstEntitlement.expirationDate)
            : null,
          willRenew: firstEntitlement.willRenew,
        };
        setSubscription(newSubscription);

        // Sync to Firestore if requested (after purchase/restore)
        if (syncToFirestore) {
          await syncPremiumToFirestore(
            true,
            newSubscription.productId,
            newSubscription.expirationDate
          );
        }
      } else {
        setSubscription({
          isActive: false,
          productId: null,
          expirationDate: null,
          willRenew: false,
        });

        // Sync to Firestore if requested
        if (syncToFirestore) {
          await syncPremiumToFirestore(false, null, null);
        }
      }

      console.log("[RevenueCat] Subscription status:", activeEntitlements);
    } catch (err) {
      console.error("[RevenueCat] Failed to get customer info:", err);
    }
  }, [isInitialized, syncPremiumToFirestore]);

  // Fetch available packages
  const fetchPackages = useCallback(async () => {
    if (!isCapacitor || !isInitialized) return;

    try {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const offerings = await Purchases.getOfferings() as any;

      if (offerings?.current?.availablePackages) {
        const pkgs = offerings.current.availablePackages.map((pkg: any) => ({
          identifier: pkg.identifier,
          productId: pkg.product?.identifier,
          priceString: pkg.product?.priceString,
          title: pkg.product?.title,
          description: pkg.product?.description || "",
        }));
        setPackages(pkgs);
        console.log("[RevenueCat] Packages:", pkgs);
      }
    } catch (err) {
      console.error("[RevenueCat] Failed to fetch packages:", err);
      setError("Failed to load subscription options");
    }
  }, [isInitialized]);

  // Purchase a package
  const purchasePackage = useCallback(async (packageId: string): Promise<boolean> => {
    if (!isCapacitor || !isInitialized) {
      setError("Purchases not available");
      return false;
    }

    try {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const offerings = await Purchases.getOfferings() as any;

      const pkg = offerings?.current?.availablePackages.find(
        (p: any) => p.identifier === packageId
      );

      if (!pkg) {
        setError("Package not found");
        return false;
      }

      const purchaseResult = await Purchases.purchasePackage({ aPackage: pkg }) as any;

      // Check if purchase was successful - check for any active entitlement
      const activeEntitlements = purchaseResult.customerInfo?.entitlements?.active || {};
      console.log("[RevenueCat] Purchase result entitlements:", JSON.stringify(activeEntitlements));

      // Check if there are any active entitlements
      const hasActiveEntitlement = Object.keys(activeEntitlements).length > 0;

      if (hasActiveEntitlement) {
        console.log("[RevenueCat] Purchase successful!");
        // Sync to Firestore immediately after purchase
        await refreshSubscriptionStatus(true);
        return true;
      }

      // For trials, entitlements may take a moment to sync
      // If we got here without an error, the purchase flow completed successfully
      // Check customerInfo directly as a fallback
      console.log("[RevenueCat] No immediate entitlements, checking customerInfo...");

      // Wait a moment and re-check (RevenueCat sometimes needs a brief delay for trials)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { customerInfo } = await Purchases.getCustomerInfo();
      const refreshedEntitlements = customerInfo?.entitlements?.active || {};
      console.log("[RevenueCat] Refreshed entitlements:", JSON.stringify(refreshedEntitlements));

      if (Object.keys(refreshedEntitlements).length > 0) {
        console.log("[RevenueCat] Purchase successful after refresh!");
        // Sync to Firestore
        await refreshSubscriptionStatus(true);
        return true;
      }

      // If still no entitlements but purchase completed without error,
      // trust that it worked - the subscription status will sync via webhook
      console.log("[RevenueCat] Purchase completed, entitlements may still be syncing");
      // Still try to sync with what we have (the webhook will correct if needed)
      await syncPremiumToFirestore(true, pkg.product?.identifier, null);
      await refreshSubscriptionStatus(false);
      return true;
    } catch (err: any) {
      if (err.code === "PURCHASE_CANCELLED" || err.userCancelled) {
        // User cancelled, not an error
        console.log("[RevenueCat] User cancelled purchase");
        return false;
      }
      console.error("[RevenueCat] Purchase failed:", err);
      setError(err.message || "Purchase failed");
      return false;
    }
  }, [isInitialized, refreshSubscriptionStatus, syncPremiumToFirestore]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isCapacitor || !isInitialized) {
      setError("Purchases not available");
      return false;
    }

    try {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const result = await Purchases.restorePurchases() as any;

      const activeEntitlements = result.customerInfo?.entitlements?.active || {};
      const hasActiveEntitlement = Object.keys(activeEntitlements).length > 0;
      console.log("[RevenueCat] Restore result:", JSON.stringify(activeEntitlements));

      if (hasActiveEntitlement) {
        // Sync to Firestore after restore
        await refreshSubscriptionStatus(true);
        return true;
      }

      return false;
    } catch (err: any) {
      console.error("[RevenueCat] Restore failed:", err);
      setError(err.message || "Restore failed");
      return false;
    }
  }, [isInitialized, refreshSubscriptionStatus]);

  // Premium if either RevenueCat SDK or Firestore says so
  const isPremium = subscription.isActive || isPremiumFromFirestore;

  return {
    isInitialized,
    loading,
    subscription,
    packages,
    error,
    isPremium,
    fetchPackages,
    purchasePackage,
    restorePurchases,
    refreshSubscriptionStatus,
  };
}
