"use client";

import { useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import {
  BarcodeScanner,
  BarcodeFormat,
  LensFacing,
} from "@capacitor-mlkit/barcode-scanning";

interface UseBarcodeReturn {
  scanBarcode: () => Promise<string | null>;
  isSupported: boolean;
  loading: boolean;
  error: string | null;
}

export function useBarcode(): UseBarcodeReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = Capacitor.isNativePlatform();

  const requestPermissions = async (): Promise<boolean> => {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === "granted" || camera === "limited";
  };

  const scanBarcode = useCallback(async (): Promise<string | null> => {
    console.log("[useBarcode] scanBarcode called, isSupported:", isSupported);

    if (!isSupported) {
      setError("Barcode scanning is only available on mobile devices");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Request camera permission
      console.log("[useBarcode] Requesting permissions...");
      const hasPermission = await requestPermissions();
      console.log("[useBarcode] Permission result:", hasPermission);

      if (!hasPermission) {
        setError("Camera permission is required to scan barcodes");
        return null;
      }

      // Check if Google Barcode Scanner module is available
      console.log("[useBarcode] Checking module availability...");
      const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
      console.log("[useBarcode] Module available:", available);

      if (!available) {
        // Install the module if not available
        console.log("[useBarcode] Installing module...");
        await BarcodeScanner.installGoogleBarcodeScannerModule();
        console.log("[useBarcode] Module installed");
      }

      // Start scanning
      console.log("[useBarcode] Starting scan...");
      const { barcodes } = await BarcodeScanner.scan({
        formats: [
          BarcodeFormat.Ean13,
          BarcodeFormat.Ean8,
          BarcodeFormat.UpcA,
          BarcodeFormat.UpcE,
          BarcodeFormat.Code128,
          BarcodeFormat.Code39,
          BarcodeFormat.Code93,
          BarcodeFormat.Itf,
        ],
      });

      if (barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue;
      }

      return null;
    } catch (err) {
      console.error("Barcode scan error:", err);

      if (err instanceof Error) {
        if (err.message.includes("canceled") || err.message.includes("cancelled")) {
          // User cancelled, not an error
          return null;
        }
        setError(err.message);
      } else {
        setError("Failed to scan barcode");
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  return {
    scanBarcode,
    isSupported,
    loading,
    error,
  };
}
