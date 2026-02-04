"use client";

import { useState } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

// Max image size: ~3MB base64 (about 2.25MB actual)
const MAX_BASE64_SIZE = 3 * 1024 * 1024;
// Max dimension for resizing
const MAX_DIMENSION = 1920;
// Target dimension when resizing large images
const RESIZE_DIMENSION = 1280;

export function useCamera() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Resize image using canvas if it's too large
  const resizeImage = async (
    base64String: string,
    format: string
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        const maxDim = RESIZE_DIMENSION;

        if (width > height && width > maxDim) {
          height = (height * maxDim) / width;
          width = maxDim;
        } else if (height > maxDim) {
          width = (width * maxDim) / height;
          height = maxDim;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with lower quality
        const mimeType = format === "png" ? "image/png" : "image/jpeg";
        const resized = canvas.toDataURL(mimeType, 0.7);
        resolve(resized);
      };

      img.onerror = () => reject(new Error("Failed to load image for resizing"));
      img.src = `data:image/${format};base64,${base64String}`;
    });
  };

  // Process image: resize if too large
  const processImage = async (
    base64String: string,
    format: string
  ): Promise<string> => {
    const dataUrl = `data:image/${format};base64,${base64String}`;

    // If size is ok, return as-is
    if (base64String.length <= MAX_BASE64_SIZE) {
      return dataUrl;
    }

    // Resize the image
    return resizeImage(base64String, format);
  };

  const takePhoto = async (): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
      });

      if (image.base64String) {
        // Process and resize if needed
        return await processImage(image.base64String, image.format || "jpeg");
      }
      return null;
    } catch (err) {
      // User cancelled or permission denied
      if (err instanceof Error && err.message.includes("User cancelled")) {
        return null;
      }
      setError(err instanceof Error ? err : new Error("Failed to take photo"));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async (): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
      });

      if (image.base64String) {
        // Process and resize if needed
        return await processImage(image.base64String, image.format || "jpeg");
      }
      return null;
    } catch (err) {
      // User cancelled or permission denied
      if (err instanceof Error && err.message.includes("User cancelled")) {
        return null;
      }
      setError(err instanceof Error ? err : new Error("Failed to pick photo"));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    takePhoto,
    pickFromGallery,
    loading,
    error,
  };
}
