"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import type { FoodCategory } from "@/types";
import { getFoodIconPath, getCategoryIconPath, DEFAULT_FOOD_ICON } from "@/lib/food-icons";

interface FoodIconProps {
  name: string;
  category?: FoodCategory;
  size?: number;
  className?: string;
}

export function FoodIcon({ name, category, size = 40, className = "" }: FoodIconProps) {
  const [fallbackLevel, setFallbackLevel] = useState(0);
  // 0 = exact name, 1 = without "s", 2 = without "es", 3 = category, 4 = default, 5 = lucide

  // Reset fallback level when name or category changes
  useEffect(() => {
    setFallbackLevel(0);
  }, [name, category]);

  // Find the next valid icon path starting from current fallback level
  const getIconSrc = (): { path: string | null; effectiveLevel: number } => {
    let level = fallbackLevel;

    while (level <= 4) {
      let path: string | null = null;

      switch (level) {
        case 0:
          path = getFoodIconPath(name, category, 0); // exact name
          break;
        case 1:
          path = getFoodIconPath(name, category, 1); // without "s"
          break;
        case 2:
          path = getFoodIconPath(name, category, 2); // without "es"
          break;
        case 3:
          path = getCategoryIconPath(category);
          break;
        case 4:
          path = DEFAULT_FOOD_ICON;
          break;
      }

      if (path !== null) {
        return { path, effectiveLevel: level };
      }
      level++;
    }

    return { path: null, effectiveLevel: 5 };
  };

  const { path: iconSrc, effectiveLevel } = getIconSrc();

  // Advance to next level on error, skipping null levels
  const handleError = () => {
    let nextLevel = effectiveLevel + 1;
    while (nextLevel <= 4) {
      let path: string | null = null;
      switch (nextLevel) {
        case 1:
          path = getFoodIconPath(name, category, 1);
          break;
        case 2:
          path = getFoodIconPath(name, category, 2);
          break;
        case 3:
          path = getCategoryIconPath(category);
          break;
        case 4:
          path = DEFAULT_FOOD_ICON;
          break;
      }
      if (path !== null) {
        setFallbackLevel(nextLevel);
        return;
      }
      nextLevel++;
    }
    setFallbackLevel(5); // Show lucide icon
  };

  // If all image fallbacks failed, show a lucide icon
  if (!iconSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-primary/10 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <Package className="text-primary" style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center rounded-lg overflow-hidden bg-[#FAF9F6] ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={iconSrc}
        alt={name}
        width={size}
        height={size}
        className="object-contain"
        onError={handleError}
        unoptimized // Since these are small pixel art icons
      />
    </div>
  );
}
