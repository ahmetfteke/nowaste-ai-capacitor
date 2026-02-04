"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

// Check if we're in a Capacitor native environment
const isCapacitor = typeof window !== "undefined" && !!(window as any).Capacitor;

// RevenueCat API key
const REVENUECAT_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY || "goog_BOapXtalXcObQqhoTKVRZzhlgUT";

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

  // Refresh subscription status
  const refreshSubscriptionStatus = useCallback(async () => {
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
        setSubscription({
          isActive: true,
          productId: firstEntitlement.productIdentifier,
          expirationDate: firstEntitlement.expirationDate
            ? new Date(firstEntitlement.expirationDate)
            : null,
          willRenew: firstEntitlement.willRenew,
        });
      } else {
        setSubscription({
          isActive: false,
          productId: null,
          expirationDate: null,
          willRenew: false,
        });
      }

      console.log("[RevenueCat] Subscription status:", activeEntitlements);
    } catch (err) {
      console.error("[RevenueCat] Failed to get customer info:", err);
    }
  }, [isInitialized]);

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
        await refreshSubscriptionStatus();
        return true;
      }

      console.log("[RevenueCat] No active entitlements found after purchase");
      return false;
    } catch (err: any) {
      if (err.code === "PURCHASE_CANCELLED") {
        // User cancelled, not an error
        return false;
      }
      console.error("[RevenueCat] Purchase failed:", err);
      setError(err.message || "Purchase failed");
      return false;
    }
  }, [isInitialized, refreshSubscriptionStatus]);

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
        await refreshSubscriptionStatus();
        return true;
      }

      return false;
    } catch (err: any) {
      console.error("[RevenueCat] Restore failed:", err);
      setError(err.message || "Restore failed");
      return false;
    }
  }, [isInitialized, refreshSubscriptionStatus]);

  return {
    isInitialized,
    loading,
    subscription,
    packages,
    error,
    isPremium: subscription.isActive,
    fetchPackages,
    purchasePackage,
    restorePurchases,
    refreshSubscriptionStatus,
  };
}
