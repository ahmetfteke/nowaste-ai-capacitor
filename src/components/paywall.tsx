"use client";

import { useEffect, useState } from "react";
import { Crown, Check, Loader2, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePurchases } from "@/hooks/use-purchases";

interface PaywallProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function Paywall({ open, onClose, onSuccess }: PaywallProps) {
  const {
    packages,
    fetchPackages,
    purchasePackage,
    restorePurchases,
    loading,
    error,
  } = usePurchases();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPackages();
    }
  }, [open, fetchPackages]);

  const handlePurchase = async (packageId: string) => {
    setPurchasing(true);
    setSelectedPackage(packageId);
    try {
      const success = await purchasePackage(packageId);
      if (success) {
        setPurchaseSuccess(true);
        onSuccess?.();
        // Give users time to see the success screen before auto-reload
        setTimeout(() => {
          window.location.reload();
        }, 3500);
      }
    } finally {
      setPurchasing(false);
      setSelectedPackage(null);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        setPurchaseSuccess(true);
        onSuccess?.();
        setTimeout(() => {
          window.location.reload();
        }, 3500);
      }
    } finally {
      setRestoring(false);
    }
  };

  if (!open) return null;

  // Success state
  if (purchaseSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Welcome to Premium!
            </h2>
            <p className="text-muted-foreground mb-4">
              Thank you for your purchase. Enjoy all premium features!
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Refreshing your access...
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Continue
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const premiumFeatures = [
    "7-day free trial",
    "Track up to 1,000 food items",
    "Track up to 1,000 shopping list items",
    "1,000 AI scans per month",
    "Priority support",
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 pb-24 relative mb-20">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Upgrade to Premium
              </h2>
              <p className="text-muted-foreground">
                Unlock all features and reduce food waste like a pro
              </p>
            </div>

            {/* Features list */}
            <div className="space-y-3 mb-6">
              {premiumFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-500" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* Packages */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : packages.length > 0 ? (
              <div className="space-y-3 mb-4">
                {packages.map((pkg) => {
                  const isAnnual = pkg.identifier.toLowerCase().includes("annual") ||
                                   pkg.identifier.toLowerCase().includes("yearly");
                  const displayTitle = isAnnual ? "Yearly" : "Monthly";
                  const savingsText = isAnnual ? "Save 50%" : null;

                  return (
                    <Button
                      key={pkg.identifier}
                      onClick={() => handlePurchase(pkg.identifier)}
                      disabled={purchasing}
                      className="w-full h-auto py-4 flex flex-col relative"
                      variant={isAnnual ? "default" : "outline"}
                    >
                      {savingsText && (
                        <span className="absolute -top-2 right-4 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          {savingsText}
                        </span>
                      )}
                      {purchasing && selectedPackage === pkg.identifier ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span className="font-semibold text-base">{displayTitle}</span>
                          <span className="text-sm opacity-80">{pkg.priceString}</span>
                        </>
                      )}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>Subscription options not available</p>
                <p className="text-sm mt-1">Please try again later</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-destructive text-sm text-center mb-4">{error}</p>
            )}

            {/* Restore purchases */}
            <div className="text-center">
              <button
                onClick={handleRestore}
                disabled={restoring}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                {restoring ? "Restoring..." : "Restore purchases"}
              </button>
            </div>

            {/* Terms */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              Start with a 7-day free trial. Cancel anytime. Subscriptions auto-renew unless cancelled 24 hours before the end of the current period.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
