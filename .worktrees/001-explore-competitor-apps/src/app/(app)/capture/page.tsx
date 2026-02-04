"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, Image, PenLine, CheckCircle, Crown, Sparkles, Mic, ScanBarcode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/use-camera";
import { useStorageSpaces } from "@/hooks/use-storage-spaces";
import { useFoodItems } from "@/hooks/use-food-items";
import { useSettings } from "@/hooks/use-settings";
import { useNotifications } from "@/hooks/use-notifications";
import { useUsage } from "@/hooks/use-usage";
import { useBarcode } from "@/hooks/use-barcode";
import { extractFoodItems, lookupBarcode, barcodeProductToExtractedItem, type ExtractedItem } from "@/lib/ai";
import { ReviewItems } from "@/components/capture/review-items";
import { VoiceCapture } from "@/components/capture/voice-capture";
import { NotificationPrompt } from "@/components/notification-prompt";
import { Paywall } from "@/components/paywall";

type CaptureState = "select" | "processing" | "review" | "notification-prompt" | "voice";

interface MethodCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  accent?: boolean;
  disabled?: boolean;
}

function MethodCard({
  icon,
  title,
  description,
  onClick,
  accent,
  disabled,
}: MethodCardProps) {
  return (
    <motion.div whileTap={disabled ? {} : { scale: 0.98 }}>
      <Card
        onClick={disabled ? undefined : onClick}
        className={`
          w-full p-5 cursor-pointer text-left
          transition-all duration-150 ease-out
          active:bg-muted/50
          ${accent ? "ring-1 ring-primary/20" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <div className="flex items-start gap-4">
          <div
            className={`
            w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
            ${accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}
          `}
          >
            {icon}
          </div>
          <div className="pt-0.5">
            <h3 className="text-base font-medium text-foreground mb-0.5">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function CapturePage() {
  const router = useRouter();
  const { takePhoto, pickFromGallery, loading: cameraLoading, error: cameraError } = useCamera();
  const { spaces, loading: spacesLoading } = useStorageSpaces();
  const { items, addItem } = useFoodItems();
  const { settings } = useSettings();
  const { shouldShowPrompt, requestPermission, declineNotifications } = useNotifications();
  const { canUseAiScan, canUseVoiceInput, canUseBarcodeScanner, canAddFoodItem, remainingAiScans, remainingVoiceMinutes, remainingBarcodeScans, incrementAiScans, incrementVoiceSeconds, incrementBarcodeScans, limits, isPremium } = useUsage();
  const { scanBarcode: scanBarcodeNative, isSupported: isBarcodeSupported, loading: barcodeLoading, error: barcodeError } = useBarcode();

  const [state, setState] = useState<CaptureState>("select");
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedItemsCount, setAddedItemsCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState(0);

  // Cycle through processing steps for visual feedback
  useEffect(() => {
    if (state === "processing") {
      const interval = setInterval(() => {
        setProcessingStep((prev) => (prev + 1) % 4);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [state]);

  const handleCapturePhoto = async () => {
    // Check AI scan limit
    if (!canUseAiScan()) {
      setShowPaywall(true);
      return;
    }

    console.log("[Capture] Taking photo...");
    setError(null);
    const imageData = await takePhoto();
    console.log("[Capture] Photo taken, data length:", imageData?.length || 0);
    if (imageData) {
      setCapturedImage(imageData);
      await processImage(imageData);
    } else {
      console.log("[Capture] No image data returned from camera");
    }
  };

  const handleSelectFromGallery = async () => {
    // Check AI scan limit
    if (!canUseAiScan()) {
      setShowPaywall(true);
      return;
    }

    console.log("[Capture] Picking from gallery...");
    setError(null);
    const imageData = await pickFromGallery();
    console.log("[Capture] Gallery image, data length:", imageData?.length || 0);
    if (imageData) {
      setCapturedImage(imageData);
      await processImage(imageData);
    } else {
      console.log("[Capture] No image data returned from gallery");
    }
  };

  const handleManualEntry = () => {
    // Go directly to review with empty items
    setExtractedItems([]);
    setState("review");
  };

  const handleVoiceCapture = () => {
    // Check voice time limit
    if (!canUseVoiceInput()) {
      setShowPaywall(true);
      return;
    }
    setState("voice");
  };

  const handleVoiceComplete = async (items: ExtractedItem[], durationSeconds: number) => {
    // Track voice duration used
    await incrementVoiceSeconds(durationSeconds);
    setExtractedItems(items);
    setState("review");
  };

  const handleVoiceCancel = () => {
    setState("select");
  };

  const handleBarcodeScan = async () => {
    console.log("[Barcode] handleBarcodeScan called, isBarcodeSupported:", isBarcodeSupported);

    // Check barcode scan limit
    if (!canUseBarcodeScanner()) {
      setShowPaywall(true);
      return;
    }

    if (!isBarcodeSupported) {
      setError("Barcode scanning is only available on mobile devices");
      return;
    }

    setError(null);

    try {
      console.log("[Barcode] Starting scan...");
      const barcode = await scanBarcodeNative();
      console.log("[Barcode] Scan result:", barcode);
      if (!barcode) {
        // User cancelled or no barcode found
        return;
      }

      setState("processing");
      setProcessing(true);

      // Increment barcode scan count after successful scan
      await incrementBarcodeScans();

      // Look up the barcode in Open Food Facts
      const product = await lookupBarcode(barcode);

      if (product) {
        // Convert to ExtractedItem and go to review
        const item = barcodeProductToExtractedItem(product);
        setExtractedItems([item]);
        setState("review");
      } else {
        // Product not found, allow manual entry with barcode pre-filled
        setError("Product not found in database. You can add it manually.");
        setExtractedItems([{
          id: crypto.randomUUID(),
          name: `Barcode: ${barcode}`,
          quantity: 1,
          unit: "pcs",
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          storageSpaceId: "pantry",
          confidence: 0.5,
        }]);
        setState("review");
      }
    } catch (err) {
      console.error("Barcode scan error:", err);
      setError(err instanceof Error ? err.message : "Failed to scan barcode");
    } finally {
      setProcessing(false);
    }
  };

  const processImage = async (imageData: string) => {
    console.log("[Capture] Processing image, length:", imageData?.length || 0);
    setState("processing");
    setProcessing(true);

    try {
      console.log("[Capture] Calling extractFoodItems...");
      const extractedItems = await extractFoodItems(imageData, settings.unitSystem);
      console.log("[Capture] Got items:", extractedItems?.length || 0);

      // Increment AI scan count after successful extraction
      await incrementAiScans();

      setExtractedItems(extractedItems);
      setState("review");
    } catch (error) {
      console.error("[Capture] Failed to extract items:", error);
      console.error("[Capture] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      // On error, go to review with empty items for manual entry
      setExtractedItems([]);
      setState("review");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmItems = async (itemsToAdd: ExtractedItem[]) => {
    // Check if adding these items would exceed the limit
    const currentCount = items.length;
    const newCount = currentCount + itemsToAdd.length;
    const maxItems = limits.foodItems;

    if (newCount > maxItems) {
      const remaining = maxItems - currentCount;
      if (remaining <= 0 && !isPremium) {
        setError(`You've reached the free tier limit of ${maxItems} items. Upgrade to Premium for unlimited items.`);
        setShowPaywall(true);
      } else if (remaining <= 0) {
        setError(`You've reached the maximum of ${maxItems} items. Please remove some items first.`);
      } else {
        setError(`You can only add ${remaining} more item${remaining !== 1 ? "s" : ""}. You have ${currentCount} items and are trying to add ${itemsToAdd.length}.`);
      }
      return;
    }

    setSaving(true);

    try {
      // Add all items to inventory
      await Promise.all(
        itemsToAdd.map((item) =>
          addItem({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            expirationDate: item.expirationDate,
            storageSpaceId: item.storageSpaceId,
            category: item.category,
          })
        )
      );

      setAddedItemsCount(itemsToAdd.length);

      // Show notification prompt if needed, otherwise go to inventory
      if (shouldShowPrompt) {
        setState("notification-prompt");
      } else {
        router.push("/inventory");
      }
    } catch (error) {
      console.error("Failed to save items:", error);
      setError("Failed to save items. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEnableNotifications = async () => {
    await requestPermission();
    router.push("/inventory");
  };

  const handleDeclineNotifications = async () => {
    await declineNotifications();
    router.push("/inventory");
  };

  const handleCancel = () => {
    setExtractedItems([]);
    setState("select");
  };

  // Notification prompt state
  if (state === "notification-prompt") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
          {addedItemsCount} Item{addedItemsCount !== 1 ? "s" : ""} Added!
        </h2>
        <p className="text-muted-foreground text-center max-w-sm mb-8">
          Your items have been added to your inventory.
        </p>

        <div className="w-full max-w-sm">
          <NotificationPrompt
            onEnable={handleEnableNotifications}
            onDecline={handleDeclineNotifications}
          />
        </div>
      </div>
    );
  }

  // Processing state - friendly and cute
  if (state === "processing") {
    const processingMessages = [
      "Looking at your photo...",
      "Finding food items...",
      "Almost there...",
    ];
    const currentMessage = processingMessages[processingStep % 3];

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        {/* Image thumbnail */}
        {capturedImage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-6"
          >
            <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-lg border border-border">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Subtle scanning line */}
            <motion.div
              className="absolute inset-x-0 h-0.5 bg-primary/50 rounded-full"
              animate={{ top: ["10%", "90%", "10%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}

        {/* Cute loader */}
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-5 h-5 text-primary" />
          </motion.div>
          <h2 className="text-lg font-medium text-foreground">
            Analyzing...
          </h2>
        </div>

        {/* Status text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={processingStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-muted-foreground"
          >
            {currentMessage}
          </motion.p>
        </AnimatePresence>

        {/* Simple progress dots */}
        <div className="flex gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Voice capture state
  if (state === "voice") {
    return (
      <>
        <VoiceCapture
          onComplete={handleVoiceComplete}
          onCancel={handleVoiceCancel}
          unitSystem={settings.unitSystem}
        />
        <Paywall open={showPaywall} onClose={() => setShowPaywall(false)} />
      </>
    );
  }

  // Review state
  if (state === "review") {
    return (
      <>
        <ReviewItems
          items={extractedItems}
          storageSpaces={spaces}
          onConfirm={handleConfirmItems}
          onCancel={handleCancel}
          loading={saving}
          error={error}
          currentItemCount={items.length}
          maxItems={limits.foodItems}
        />
        <Paywall open={showPaywall} onClose={() => setShowPaywall(false)} />
      </>
    );
  }

  // Select method state
  const isLoading = cameraLoading || spacesLoading;

  return (
    <div className="min-h-full">
      {/* Header Section */}
      <div className="px-5 pt-6 pb-5">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold text-foreground">Add Items</h1>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Snap a photo and our AI will find your food items.
          </p>
        </div>
      </div>

      {/* Method Cards */}
      <div className="px-5 pb-6">
        <div className="max-w-md mx-auto space-y-3">
          <MethodCard
            icon={<Camera className="w-5 h-5" />}
            title="Take Photo"
            description="Photograph groceries or a receipt"
            onClick={handleCapturePhoto}
            accent
            disabled={isLoading}
          />

          <MethodCard
            icon={<Image className="w-5 h-5" />}
            title="Choose from Gallery"
            description="Select an existing photo"
            onClick={handleSelectFromGallery}
            disabled={isLoading}
          />

          <MethodCard
            icon={<Mic className="w-5 h-5" />}
            title="Voice Input"
            description="Speak your items out loud"
            onClick={handleVoiceCapture}
            disabled={isLoading}
          />

          <MethodCard
            icon={<ScanBarcode className="w-5 h-5" />}
            title="Scan Barcode"
            description="Scan product barcode to add"
            onClick={handleBarcodeScan}
            disabled={isLoading || barcodeLoading || !isBarcodeSupported}
          />

          <MethodCard
            icon={<PenLine className="w-5 h-5" />}
            title="Add Manually"
            description="Type in items yourself"
            onClick={handleManualEntry}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Error Message */}
      {(error || cameraError || barcodeError) && (
        <div className="px-5 pb-4">
          <div className="max-w-md mx-auto">
            <div className="bg-destructive/10 text-destructive rounded-xl px-4 py-3">
              <p className="text-sm">
                {error || cameraError?.message || barcodeError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Scans Remaining */}
      <div className="px-5 pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-3">
            <p className="text-sm text-muted-foreground">
              AI scans remaining: <span className="font-medium text-foreground">{remainingAiScans()}/{isPremium ? 1000 : 5}</span>
            </p>
            {!isPremium && (
              <button
                onClick={() => setShowPaywall(true)}
                className="flex items-center gap-1 text-sm text-primary font-medium"
              >
                <Crown className="w-4 h-4" />
                Upgrade
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Helpful Tip */}
      <div className="px-5 pb-6">
        <div className="max-w-md mx-auto">
          <div className="bg-muted/50 rounded-xl px-4 py-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Tip:</span> Receipts
              work great for adding multiple items at once.
            </p>
          </div>
        </div>
      </div>

      {/* Paywall */}
      <Paywall open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}
