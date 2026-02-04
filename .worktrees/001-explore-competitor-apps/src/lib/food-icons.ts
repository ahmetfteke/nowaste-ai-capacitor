import type { FoodCategory } from "@/types";

/**
 * Normalize a food name to match icon filename format
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, "") // Remove brand names in parentheses
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^a-z0-9_]/g, "") // Remove special characters
    .trim();
}

/**
 * Get the icon path for a food item with plural variation support.
 * Variation 0: exact name (e.g., "tomatoes")
 * Variation 1: without trailing "s" (e.g., "tomato")
 * Variation 2: without trailing "es" (e.g., "tomato" from "tomatoes")
 */
export function getFoodIconPath(name: string, category?: FoodCategory, variation = 0): string | null {
  const basePath = "/food-icons";
  const normalized = normalizeName(name);

  switch (variation) {
    case 0:
      // Try exact name
      return `${basePath}/${normalized}.png`;
    case 1:
      // Try without trailing "s"
      if (normalized.endsWith("s") && normalized.length > 2) {
        return `${basePath}/${normalized.slice(0, -1)}.png`;
      }
      return null;
    case 2:
      // Try without trailing "es"
      if (normalized.endsWith("es") && normalized.length > 3) {
        return `${basePath}/${normalized.slice(0, -2)}.png`;
      }
      return null;
    default:
      return null;
  }
}

/**
 * Get the fallback icon path for a category
 */
export function getCategoryIconPath(category?: FoodCategory): string {
  const basePath = "/food-icons";

  if (!category) {
    return `${basePath}/food.png`;
  }

  // Map category to a representative icon
  const categoryIcons: Record<FoodCategory, string> = {
    fruits: "fruit",
    vegetables: "vegetable",
    herbs_spices: "herbs",
    dairy: "milk",
    eggs: "egg",
    meat: "meat",
    seafood: "fish",
    bread_bakery: "bread",
    grains_pasta: "pasta",
    canned_goods: "canned_food",
    legumes: "beans",
    nuts_seeds: "nuts",
    condiments_sauces: "sauce",
    sweeteners_spreads: "honey",
    beverages: "drink",
    snacks: "snack",
    frozen: "frozen_food",
    convenience: "microwave_meal",
    breakfast: "cereal",
    baking: "flour",
    international: "sushi",
    baby: "baby_food",
    pet: "pet_food",
    generic: "food",
  };

  return `${basePath}/${categoryIcons[category]}.png`;
}

/**
 * Default food icon path
 */
export const DEFAULT_FOOD_ICON = "/food-icons/food.png";
