// =============================================================================
// Core Entities
// =============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface StorageSpace {
  id: string;
  name: string;
  icon: string;
  userId: string;
}

export type FoodCategory =
  | "fruits" | "vegetables" | "herbs_spices" | "dairy" | "eggs" | "meat" | "seafood"
  | "bread_bakery" | "grains_pasta" | "canned_goods" | "legumes" | "nuts_seeds"
  | "condiments_sauces" | "sweeteners_spreads" | "beverages" | "snacks" | "frozen"
  | "convenience" | "breakfast" | "baking" | "international" | "baby" | "pet" | "generic";

export interface FoodItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expirationDate: string;
  storageSpaceId: string;
  category?: FoodCategory;
  status: "active" | "used";
  addedAt: string;
  userId: string;
}

export interface Capture {
  id: string;
  imageUrl: string;
  type: "groceries" | "receipt";
  status: "processing" | "completed" | "failed";
  createdAt: string;
  userId: string;
}

export interface ExtractedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expirationDate: string;
  storageSpaceId: string;
  category?: FoodCategory;
  confidence: number;
}

export interface Alert {
  id: string;
  foodItemId: string;
  foodItemName: string;
  message: string;
  expirationDate: string;
  status: "unread" | "read" | "snoozed" | "dismissed";
  sentAt: string;
  snoozedUntil?: string;
  userId: string;
}

export interface NotificationSettings {
  enabled: boolean;
  reminderDays: number[];
  userId: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: FoodCategory;
  checked: boolean;
  userId: string;
  createdAt: string;
}

// =============================================================================
// Recipe Preferences & AI Recipes
// =============================================================================

export type CuisineType =
  | "any"
  | "american"
  | "italian"
  | "mexican"
  | "chinese"
  | "japanese"
  | "indian"
  | "thai"
  | "mediterranean"
  | "french"
  | "korean"
  | "vietnamese";

export type DietaryRestriction =
  | "none"
  | "vegetarian"
  | "vegan"
  | "gluten-free"
  | "dairy-free"
  | "keto"
  | "paleo"
  | "halal"
  | "kosher";

export interface RecipePreferences {
  cuisines: CuisineType[];
  dietaryRestrictions: DietaryRestriction[];
  servings: number;
  maxCookTime: number; // in minutes, 0 = no limit
  skillLevel: "easy" | "medium" | "advanced";
}

export interface RecipeIngredient {
  name: string;
  quantity: string;
  fromInventory: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  cookTime: number; // in minutes
  servings: number;
  difficulty: "easy" | "medium" | "advanced";
  cuisine: CuisineType;
  ingredients: RecipeIngredient[];
  instructions: string[];
  tips?: string;
  usedInventoryItems: string[]; // names of items from inventory
  userId: string;
  createdAt: string;
}

export interface RecipeUsage {
  count: number;
  monthYear: string; // e.g., "2024-01"
  userId: string;
}

// =============================================================================
// Community Feedback
// =============================================================================

export type SuggestionReviewStatus = "pending" | "approved" | "rejected";

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  userId: string;
  userInitials: string;
  upvotes: number;
  upvoters: string[];
  commentCount: number;
  reviewStatus: SuggestionReviewStatus;
  createdAt: string;
}

export interface SuggestionComment {
  id: string;
  text: string;
  userId: string;
  userInitials: string;
  createdAt: string;
}

// =============================================================================
// Default Storage Spaces
// =============================================================================

export const STORAGE_SPACE_IDS = ["fridge", "freezer", "pantry", "counter"] as const;
export type StorageSpaceId = (typeof STORAGE_SPACE_IDS)[number];

export const DEFAULT_STORAGE_SPACES: { id: StorageSpaceId; name: string; icon: string }[] = [
  { id: "fridge", name: "Fridge", icon: "refrigerator" },
  { id: "freezer", name: "Freezer", icon: "snowflake" },
  { id: "pantry", name: "Pantry", icon: "warehouse" },
  { id: "counter", name: "Counter", icon: "layout-grid" },
];
