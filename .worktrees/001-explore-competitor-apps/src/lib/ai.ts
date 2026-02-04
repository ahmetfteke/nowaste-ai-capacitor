import { auth } from "./firebase";
import type { FoodCategory } from "@/types";

export interface ExtractedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expirationDate: string;
  storageSpaceId: string;
  category?: FoodCategory;
  confidence: number;
  iconHint?: string; // AI-suggested icon name for better icon matching
}

interface APIExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  suggestedStorageSpaceId: "fridge" | "freezer" | "pantry" | "counter";
  estimatedExpirationDate: string;
  category?: FoodCategory;
  confidence: number;
}

// Cloud Run URLs for v2 functions
const ANALYZE_FOOD_URL = process.env.NEXT_PUBLIC_ANALYZE_FOOD_URL ||
  "https://analyzefood-5see5s3l3a-uc.a.run.app";
const TRANSCRIBE_AUDIO_URL = process.env.NEXT_PUBLIC_TRANSCRIBE_URL ||
  "https://transcribeaudio-5see5s3l3a-uc.a.run.app";
const PARSE_VOICE_URL = process.env.NEXT_PUBLIC_PARSE_VOICE_URL ||
  "https://parsevoiceinput-5see5s3l3a-uc.a.run.app";
const ENHANCE_BARCODE_URL = process.env.NEXT_PUBLIC_ENHANCE_BARCODE_URL ||
  "https://enhancebarcodeproduct-5see5s3l3a-uc.a.run.app";

export async function extractFoodItems(
  imageBase64: string,
  unitSystem: "metric" | "imperial" = "metric"
): Promise<ExtractedItem[]> {
  console.log("[AI] Starting extractFoodItems...");
  console.log("[AI] Image data length:", imageBase64?.length || 0);
  console.log("[AI] Function URL:", ANALYZE_FOOD_URL);

  const user = auth.currentUser;
  if (!user) {
    console.error("[AI] No authenticated user!");
    throw new Error("User must be authenticated");
  }
  console.log("[AI] User authenticated:", user.uid);

  const idToken = await user.getIdToken();
  console.log("[AI] Got ID token, length:", idToken?.length || 0);

  // Remove the data URL prefix if present
  const base64Data = imageBase64.includes(",")
    ? imageBase64.split(",")[1]
    : imageBase64;
  console.log("[AI] Base64 data length (after strip):", base64Data?.length || 0);

  try {
    console.log("[AI] Sending request to:", ANALYZE_FOOD_URL);
    const response = await fetch(ANALYZE_FOOD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        imageBase64: base64Data,
        unitSystem,
      }),
    });

    console.log("[AI] Response status:", response.status);
    console.log("[AI] Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI] Error response:", errorText);
      let errorData = {};
      try { errorData = JSON.parse(errorText); } catch {}
      throw new Error((errorData as any).error || `Failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("[AI] Response data:", JSON.stringify(data).slice(0, 500));

    // Map API response to our ExtractedItem format
    return (data.items || []).map((item: APIExtractedItem) => ({
      id: crypto.randomUUID(),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      expirationDate: item.estimatedExpirationDate,
      storageSpaceId: item.suggestedStorageSpaceId,
      category: item.category,
      confidence: item.confidence,
    }));
  } catch (err) {
    console.error("[AI] Fetch error:", err);
    throw err;
  }
}

// Fallback mock extraction for development/testing
export async function extractFoodItemsMock(): Promise<ExtractedItem[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return [
    {
      id: crypto.randomUUID(),
      name: "Milk",
      quantity: 1,
      unit: "gallon",
      expirationDate: getDateFromNow(7),
      storageSpaceId: "fridge",
      category: "dairy",
      confidence: 0.95,
    },
    {
      id: crypto.randomUUID(),
      name: "Eggs",
      quantity: 12,
      unit: "pcs",
      expirationDate: getDateFromNow(21),
      storageSpaceId: "fridge",
      category: "eggs",
      confidence: 0.92,
    },
    {
      id: crypto.randomUUID(),
      name: "Bread",
      quantity: 1,
      unit: "loaf",
      expirationDate: getDateFromNow(5),
      storageSpaceId: "counter",
      category: "bread_bakery",
      confidence: 0.88,
    },
    {
      id: crypto.randomUUID(),
      name: "Apples",
      quantity: 6,
      unit: "pcs",
      expirationDate: getDateFromNow(14),
      storageSpaceId: "fridge",
      category: "fruits",
      confidence: 0.9,
    },
  ];
}

function getDateFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

// =============================================================================
// Voice Transcription & Parsing
// =============================================================================

export async function transcribeAudio(
  audioBase64: string,
  mimeType: string = "audio/webm"
): Promise<string> {
  console.log("[AI] Starting transcribeAudio...");
  console.log("[AI] Audio data length:", audioBase64?.length || 0);
  console.log("[AI] Function URL:", TRANSCRIBE_AUDIO_URL);

  const user = auth.currentUser;
  if (!user) {
    console.error("[AI] No authenticated user!");
    throw new Error("User must be authenticated");
  }
  console.log("[AI] User authenticated:", user.uid);

  const idToken = await user.getIdToken();
  console.log("[AI] Got ID token, length:", idToken?.length || 0);

  try {
    console.log("[AI] Sending request to:", TRANSCRIBE_AUDIO_URL);
    const response = await fetch(TRANSCRIBE_AUDIO_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        audioBase64,
        mimeType,
      }),
    });

    console.log("[AI] Response status:", response.status);
    console.log("[AI] Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI] Error response:", errorText);
      let errorData = {};
      try { errorData = JSON.parse(errorText); } catch {}
      throw new Error((errorData as any).error || `Failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("[AI] Transcription result:", data.text?.slice(0, 200));

    return data.text || "";
  } catch (err) {
    console.error("[AI] Fetch error:", err);
    throw err;
  }
}

export async function parseVoiceInput(
  text: string,
  unitSystem: "metric" | "imperial" = "metric"
): Promise<ExtractedItem[]> {
  console.log("[AI] Starting parseVoiceInput...");
  console.log("[AI] Text length:", text?.length || 0);
  console.log("[AI] Function URL:", PARSE_VOICE_URL);

  const user = auth.currentUser;
  if (!user) {
    console.error("[AI] No authenticated user!");
    throw new Error("User must be authenticated");
  }
  console.log("[AI] User authenticated:", user.uid);

  const idToken = await user.getIdToken();
  console.log("[AI] Got ID token, length:", idToken?.length || 0);

  try {
    console.log("[AI] Sending request to:", PARSE_VOICE_URL);
    const response = await fetch(PARSE_VOICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        text,
        unitSystem,
      }),
    });

    console.log("[AI] Response status:", response.status);
    console.log("[AI] Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI] Error response:", errorText);
      let errorData = {};
      try { errorData = JSON.parse(errorText); } catch {}
      throw new Error((errorData as any).error || `Failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("[AI] Response data:", JSON.stringify(data).slice(0, 500));

    // Map API response to our ExtractedItem format
    return (data.items || []).map((item: APIExtractedItem) => ({
      id: crypto.randomUUID(),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      expirationDate: item.estimatedExpirationDate,
      storageSpaceId: item.suggestedStorageSpaceId,
      category: item.category,
      confidence: item.confidence,
    }));
  } catch (err) {
    console.error("[AI] Fetch error:", err);
    throw err;
  }
}

// =============================================================================
// Barcode Lookup (Open Food Facts API)
// =============================================================================

export interface BarcodeProduct {
  barcode: string;
  name: string;
  brand?: string;
  quantity?: string;
  category?: FoodCategory;
  imageUrl?: string;
  suggestedStorageSpaceId: "fridge" | "freezer" | "pantry" | "counter";
  estimatedShelfLifeDays: number;
  iconName?: string; // AI-suggested icon name
}

// Map Open Food Facts categories to our FoodCategory
function mapToFoodCategory(categories: string | undefined): FoodCategory | undefined {
  if (!categories) return undefined;

  const lowerCategories = categories.toLowerCase();

  if (lowerCategories.includes("milk") || lowerCategories.includes("cheese") || lowerCategories.includes("yogurt") || lowerCategories.includes("dairy")) {
    return "dairy";
  }
  if (lowerCategories.includes("meat") || lowerCategories.includes("beef") || lowerCategories.includes("pork") || lowerCategories.includes("chicken") || lowerCategories.includes("poultry")) {
    return "meat";
  }
  if (lowerCategories.includes("fish") || lowerCategories.includes("seafood") || lowerCategories.includes("salmon") || lowerCategories.includes("tuna")) {
    return "seafood";
  }
  if (lowerCategories.includes("fruit") || lowerCategories.includes("apple") || lowerCategories.includes("banana") || lowerCategories.includes("orange")) {
    return "fruits";
  }
  if (lowerCategories.includes("vegetable") || lowerCategories.includes("carrot") || lowerCategories.includes("tomato") || lowerCategories.includes("lettuce")) {
    return "vegetables";
  }
  if (lowerCategories.includes("bread") || lowerCategories.includes("bakery") || lowerCategories.includes("pastry") || lowerCategories.includes("cake")) {
    return "bread_bakery";
  }
  if (lowerCategories.includes("frozen")) {
    return "frozen";
  }
  if (lowerCategories.includes("beverage") || lowerCategories.includes("drink") || lowerCategories.includes("juice") || lowerCategories.includes("soda")) {
    return "beverages";
  }
  if (lowerCategories.includes("snack") || lowerCategories.includes("chip") || lowerCategories.includes("cookie") || lowerCategories.includes("candy")) {
    return "snacks";
  }
  if (lowerCategories.includes("sauce") || lowerCategories.includes("condiment") || lowerCategories.includes("ketchup") || lowerCategories.includes("mustard")) {
    return "condiments_sauces";
  }
  if (lowerCategories.includes("grain") || lowerCategories.includes("rice") || lowerCategories.includes("pasta") || lowerCategories.includes("cereal")) {
    return "grains_pasta";
  }
  if (lowerCategories.includes("canned") || lowerCategories.includes("preserved")) {
    return "canned_goods";
  }
  if (lowerCategories.includes("spice") || lowerCategories.includes("herb") || lowerCategories.includes("seasoning")) {
    return "herbs_spices";
  }
  if (lowerCategories.includes("oil") || lowerCategories.includes("vinegar")) {
    return "condiments_sauces";
  }
  if (lowerCategories.includes("nut") || lowerCategories.includes("seed") || lowerCategories.includes("almond") || lowerCategories.includes("peanut")) {
    return "nuts_seeds";
  }
  if (lowerCategories.includes("egg")) {
    return "eggs";
  }
  if (lowerCategories.includes("deli") || lowerCategories.includes("prepared")) {
    return "convenience";
  }
  if (lowerCategories.includes("baby")) {
    return "baby";
  }
  if (lowerCategories.includes("pet")) {
    return "pet";
  }

  return "generic";
}

// Get suggested storage location based on category
function getStorageLocation(category: FoodCategory | undefined): "fridge" | "freezer" | "pantry" | "counter" {
  if (!category) return "pantry";

  const fridgeCategories: FoodCategory[] = ["dairy", "meat", "seafood", "eggs", "convenience", "vegetables", "fruits"];
  const freezerCategories: FoodCategory[] = ["frozen"];
  const counterCategories: FoodCategory[] = ["bread_bakery"];

  if (fridgeCategories.includes(category)) return "fridge";
  if (freezerCategories.includes(category)) return "freezer";
  if (counterCategories.includes(category)) return "counter";

  return "pantry";
}

// Estimate shelf life based on category
function getEstimatedShelfLife(category: FoodCategory | undefined): number {
  if (!category) return 30;

  const shelfLifeMap: Partial<Record<FoodCategory, number>> = {
    dairy: 14,
    meat: 5,
    seafood: 3,
    fruits: 7,
    vegetables: 7,
    bread_bakery: 5,
    frozen: 90,
    beverages: 180,
    snacks: 60,
    condiments_sauces: 180,
    grains_pasta: 365,
    canned_goods: 730,
    herbs_spices: 365,
    nuts_seeds: 90,
    eggs: 21,
    convenience: 7,
    baby: 30,
    pet: 60,
    generic: 30,
    legumes: 365,
    sweeteners_spreads: 365,
    breakfast: 30,
    baking: 180,
    international: 30,
  };

  return shelfLifeMap[category] ?? 30;
}

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  console.log("[AI] Looking up barcode:", barcode);

  try {
    // Open Food Facts API - free, no API key required
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: {
          "User-Agent": "NoWasteAI/1.0 (pantry-tracker-app)",
        },
      }
    );

    if (!response.ok) {
      console.log("[AI] Barcode lookup failed:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      console.log("[AI] Product not found for barcode:", barcode);
      return null;
    }

    const product = data.product;
    const productName = product.product_name || product.product_name_en || "Unknown Product";
    const brand = product.brands;
    const categories = product.categories;

    // Try to enhance with AI for better expiration date and icon
    let aiEnhancement = null;
    try {
      aiEnhancement = await enhanceBarcodeWithAI(productName, brand, categories);
      console.log("[AI] AI enhancement:", aiEnhancement);
    } catch (err) {
      console.log("[AI] AI enhancement failed, using defaults:", err);
    }

    // Use AI results or fall back to category-based defaults
    const category = (aiEnhancement?.category as FoodCategory) || mapToFoodCategory(categories);

    const result: BarcodeProduct = {
      barcode,
      name: productName,
      brand,
      quantity: product.quantity,
      category,
      imageUrl: product.image_front_url || product.image_url,
      suggestedStorageSpaceId: (aiEnhancement?.storageLocation as "fridge" | "freezer" | "pantry" | "counter") || getStorageLocation(category),
      estimatedShelfLifeDays: aiEnhancement?.daysUntilExpiration || getEstimatedShelfLife(category),
      iconName: aiEnhancement?.iconName,
    };

    console.log("[AI] Found product:", result.name);
    return result;
  } catch (err) {
    console.error("[AI] Barcode lookup error:", err);
    return null;
  }
}

// Call AI to enhance barcode product with better expiration and icon
async function enhanceBarcodeWithAI(
  productName: string,
  brand?: string,
  categories?: string
): Promise<{ daysUntilExpiration: number; iconName: string; category: string; storageLocation: string } | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  const idToken = await user.getIdToken();

  const response = await fetch(ENHANCE_BARCODE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      productName,
      brand,
      categories,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI enhancement failed: ${response.status}`);
  }

  return response.json();
}

// Convert barcode product to ExtractedItem
export function barcodeProductToExtractedItem(product: BarcodeProduct): ExtractedItem {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + product.estimatedShelfLifeDays);

  return {
    id: crypto.randomUUID(),
    name: product.brand ? `${product.brand} ${product.name}` : product.name,
    quantity: 1,
    unit: "pcs",
    expirationDate: expirationDate.toISOString().split("T")[0],
    storageSpaceId: product.suggestedStorageSpaceId,
    category: product.category,
    confidence: 0.95, // High confidence since it's from a database
    iconHint: product.iconName, // AI-suggested icon for better matching
  };
}
