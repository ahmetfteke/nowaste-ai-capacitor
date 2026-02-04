import type { ShoppingListItem, FoodItem, FoodCategory, StorageSpace } from "@/types";
import { DEFAULT_STORAGE_SPACES } from "@/types";

// =============================================================================
// Types
// =============================================================================

export interface ParsedShoppingItem {
  name: string;
  quantity: number;
  unit: string;
}

export interface ParsedInventoryItem {
  name: string;
  quantity: number;
  unit: string;
  expirationDate: string;
  storageLocation: string;
  category?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ParseResult<T> {
  items: T[];
  errors: ValidationError[];
}

// =============================================================================
// Shopping List Parsing
// =============================================================================

export function parseShoppingListCSV(content: string): ParseResult<ParsedShoppingItem> {
  const items: ParsedShoppingItem[] = [];
  const errors: ValidationError[] = [];

  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) {
    errors.push({ row: 0, field: "file", message: "File must have a header row and at least one data row" });
    return { items, errors };
  }

  // Parse header to find column indices
  const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const nameIdx = header.findIndex(h => h === "name" || h === "item" || h === "item name");
  const qtyIdx = header.findIndex(h => h === "quantity" || h === "qty" || h === "amount");
  const unitIdx = header.findIndex(h => h === "unit" || h === "units");

  if (nameIdx === -1) {
    errors.push({ row: 0, field: "header", message: "Missing required 'Name' column" });
    return { items, errors };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = parseCSVLine(lines[i]);
    const rowNum = i + 1;

    const name = values[nameIdx]?.trim();
    if (!name) {
      errors.push({ row: rowNum, field: "name", message: "Name is required" });
      continue;
    }

    const quantity = qtyIdx >= 0 ? parseFloat(values[qtyIdx]) || 1 : 1;
    const unit = unitIdx >= 0 ? values[unitIdx]?.trim() || "pcs" : "pcs";

    if (quantity <= 0) {
      errors.push({ row: rowNum, field: "quantity", message: "Quantity must be positive" });
      continue;
    }

    items.push({ name, quantity, unit });
  }

  return { items, errors };
}

export function parseShoppingListJSON(content: string): ParseResult<ParsedShoppingItem> {
  const items: ParsedShoppingItem[] = [];
  const errors: ValidationError[] = [];

  try {
    const data = JSON.parse(content);
    const itemsArray = Array.isArray(data) ? data : data.items;

    if (!Array.isArray(itemsArray)) {
      errors.push({ row: 0, field: "format", message: "Expected an array of items or an object with 'items' property" });
      return { items, errors };
    }

    itemsArray.forEach((item, index) => {
      const rowNum = index + 1;

      if (!item.name || typeof item.name !== "string") {
        errors.push({ row: rowNum, field: "name", message: "Name is required and must be a string" });
        return;
      }

      const quantity = typeof item.quantity === "number" ? item.quantity : parseFloat(item.quantity) || 1;
      const unit = item.unit?.toString() || "pcs";

      if (quantity <= 0) {
        errors.push({ row: rowNum, field: "quantity", message: "Quantity must be positive" });
        return;
      }

      items.push({
        name: item.name.trim(),
        quantity,
        unit: unit.trim(),
      });
    });
  } catch {
    errors.push({ row: 0, field: "json", message: "Invalid JSON format" });
  }

  return { items, errors };
}

// =============================================================================
// Inventory Parsing
// =============================================================================

export function parseInventoryCSV(content: string): ParseResult<ParsedInventoryItem> {
  const items: ParsedInventoryItem[] = [];
  const errors: ValidationError[] = [];

  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) {
    errors.push({ row: 0, field: "file", message: "File must have a header row and at least one data row" });
    return { items, errors };
  }

  // Parse header
  const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const nameIdx = header.findIndex(h => h === "name" || h === "item" || h === "item name");
  const qtyIdx = header.findIndex(h => h === "quantity" || h === "qty" || h === "amount");
  const unitIdx = header.findIndex(h => h === "unit" || h === "units");
  const expIdx = header.findIndex(h =>
    h === "expiration date" || h === "expiration" || h === "exp date" ||
    h === "expires" || h === "expiry" || h === "expiry date"
  );
  const storageIdx = header.findIndex(h =>
    h === "storage location" || h === "storage" || h === "location"
  );
  const categoryIdx = header.findIndex(h => h === "category" || h === "type");

  if (nameIdx === -1) {
    errors.push({ row: 0, field: "header", message: "Missing required 'Name' column" });
    return { items, errors };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = parseCSVLine(lines[i]);
    const rowNum = i + 1;

    const name = values[nameIdx]?.trim();
    if (!name) {
      errors.push({ row: rowNum, field: "name", message: "Name is required" });
      continue;
    }

    const quantity = qtyIdx >= 0 ? parseFloat(values[qtyIdx]) || 1 : 1;
    const unit = unitIdx >= 0 ? values[unitIdx]?.trim() || "pcs" : "pcs";

    // Parse expiration date
    let expirationDate = "";
    if (expIdx >= 0 && values[expIdx]?.trim()) {
      const parsed = parseDate(values[expIdx].trim());
      if (parsed) {
        expirationDate = parsed;
      } else {
        errors.push({ row: rowNum, field: "expirationDate", message: `Invalid date format: ${values[expIdx]}` });
        continue;
      }
    } else {
      // Default to 7 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      expirationDate = defaultDate.toISOString().split("T")[0];
    }

    const storageLocation = storageIdx >= 0 ? values[storageIdx]?.trim() || "Fridge" : "Fridge";
    const category = categoryIdx >= 0 ? values[categoryIdx]?.trim() : undefined;

    if (quantity <= 0) {
      errors.push({ row: rowNum, field: "quantity", message: "Quantity must be positive" });
      continue;
    }

    items.push({ name, quantity, unit, expirationDate, storageLocation, category });
  }

  return { items, errors };
}

export function parseInventoryJSON(content: string): ParseResult<ParsedInventoryItem> {
  const items: ParsedInventoryItem[] = [];
  const errors: ValidationError[] = [];

  try {
    const data = JSON.parse(content);
    const itemsArray = Array.isArray(data) ? data : data.items;

    if (!Array.isArray(itemsArray)) {
      errors.push({ row: 0, field: "format", message: "Expected an array of items or an object with 'items' property" });
      return { items, errors };
    }

    itemsArray.forEach((item, index) => {
      const rowNum = index + 1;

      if (!item.name || typeof item.name !== "string") {
        errors.push({ row: rowNum, field: "name", message: "Name is required and must be a string" });
        return;
      }

      const quantity = typeof item.quantity === "number" ? item.quantity : parseFloat(item.quantity) || 1;
      const unit = item.unit?.toString() || "pcs";

      // Parse expiration date
      let expirationDate = "";
      const expValue = item.expirationDate || item.expiration_date || item.expiration || item.expires;
      if (expValue) {
        const parsed = parseDate(expValue.toString());
        if (parsed) {
          expirationDate = parsed;
        } else {
          errors.push({ row: rowNum, field: "expirationDate", message: `Invalid date format: ${expValue}` });
          return;
        }
      } else {
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        expirationDate = defaultDate.toISOString().split("T")[0];
      }

      const storageLocation = item.storageLocation || item.storage_location || item.storage || "Fridge";
      const category = item.category;

      if (quantity <= 0) {
        errors.push({ row: rowNum, field: "quantity", message: "Quantity must be positive" });
        return;
      }

      items.push({
        name: item.name.trim(),
        quantity,
        unit: unit.trim(),
        expirationDate,
        storageLocation: storageLocation.toString().trim(),
        category,
      });
    });
  } catch {
    errors.push({ row: 0, field: "json", message: "Invalid JSON format" });
  }

  return { items, errors };
}

// =============================================================================
// Conversion to App Types
// =============================================================================

export function convertToShoppingItem(
  parsed: ParsedShoppingItem
): Omit<ShoppingListItem, "id" | "userId" | "createdAt"> {
  return {
    name: parsed.name,
    quantity: parsed.quantity,
    unit: parsed.unit,
    checked: false,
  };
}

export function convertToFoodItem(
  parsed: ParsedInventoryItem,
  spaces: { id: string; name: string }[]
): Omit<FoodItem, "id" | "userId" | "addedAt" | "status"> {
  // Map storage location name to ID
  const storageSpaceId = mapStorageLocationToId(parsed.storageLocation, spaces);

  // Map category string to FoodCategory type
  const category = mapCategory(parsed.category);

  return {
    name: parsed.name,
    quantity: parsed.quantity,
    unit: parsed.unit,
    expirationDate: parsed.expirationDate,
    storageSpaceId,
    category,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function parseDate(dateStr: string): string | null {
  // Try common date formats
  const formats = [
    // ISO format: 2024-02-15
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // US format: 02/15/2024 or 2/15/2024
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // EU format: 15/02/2024 or 15.02.2024
    /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/,
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      let year: number, month: number, day: number;

      if (format === formats[0]) {
        // ISO
        year = parseInt(match[1]);
        month = parseInt(match[2]);
        day = parseInt(match[3]);
      } else if (format === formats[1]) {
        // US
        month = parseInt(match[1]);
        day = parseInt(match[2]);
        year = parseInt(match[3]);
      } else {
        // EU
        day = parseInt(match[1]);
        month = parseInt(match[2]);
        year = parseInt(match[3]);
      }

      // Validate date
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
  }

  // Try parsing as Date object
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}

function mapStorageLocationToId(location: string, spaces: { id: string; name: string }[]): string {
  const normalized = location.toLowerCase().trim();

  // First try to match against user's spaces
  const space = spaces.find(s => s.name.toLowerCase() === normalized);
  if (space) return space.id;

  // Then try default spaces
  const defaultSpace = DEFAULT_STORAGE_SPACES.find(s => s.name.toLowerCase() === normalized);
  if (defaultSpace) return defaultSpace.id;

  // Fuzzy match common variations
  const variations: Record<string, string> = {
    "refrigerator": "fridge",
    "ref": "fridge",
    "cooler": "fridge",
    "deep freeze": "freezer",
    "deep freezer": "freezer",
    "cabinet": "pantry",
    "cupboard": "pantry",
    "shelf": "pantry",
    "countertop": "counter",
    "bench": "counter",
  };

  const mappedId = variations[normalized];
  if (mappedId) return mappedId;

  // Default to fridge
  return "fridge";
}

function mapCategory(category?: string): FoodCategory | undefined {
  if (!category) return undefined;

  const normalized = category.toLowerCase().trim().replace(/[_\s-]+/g, "_");

  const validCategories: FoodCategory[] = [
    "fruits", "vegetables", "herbs_spices", "dairy", "eggs", "meat", "seafood",
    "bread_bakery", "grains_pasta", "canned_goods", "legumes", "nuts_seeds",
    "condiments_sauces", "sweeteners_spreads", "beverages", "snacks", "frozen",
    "convenience", "breakfast", "baking", "international", "baby", "pet", "generic"
  ];

  if (validCategories.includes(normalized as FoodCategory)) {
    return normalized as FoodCategory;
  }

  // Common mappings
  const categoryMap: Record<string, FoodCategory> = {
    "fruit": "fruits",
    "vegetable": "vegetables",
    "veggie": "vegetables",
    "veggies": "vegetables",
    "produce": "vegetables",
    "herb": "herbs_spices",
    "spice": "herbs_spices",
    "spices": "herbs_spices",
    "milk": "dairy",
    "cheese": "dairy",
    "yogurt": "dairy",
    "egg": "eggs",
    "beef": "meat",
    "pork": "meat",
    "chicken": "meat",
    "poultry": "meat",
    "fish": "seafood",
    "bread": "bread_bakery",
    "bakery": "bread_bakery",
    "pasta": "grains_pasta",
    "rice": "grains_pasta",
    "grain": "grains_pasta",
    "grains": "grains_pasta",
    "cereal": "breakfast",
    "canned": "canned_goods",
    "can": "canned_goods",
    "bean": "legumes",
    "beans": "legumes",
    "nut": "nuts_seeds",
    "nuts": "nuts_seeds",
    "seed": "nuts_seeds",
    "seeds": "nuts_seeds",
    "sauce": "condiments_sauces",
    "condiment": "condiments_sauces",
    "drink": "beverages",
    "drinks": "beverages",
    "beverage": "beverages",
    "snack": "snacks",
    "chips": "snacks",
    "candy": "snacks",
    "ready_meal": "convenience",
    "ready_meals": "convenience",
    "microwave": "convenience",
  };

  return categoryMap[normalized] || "generic";
}

// =============================================================================
// File Reading Utility
// =============================================================================

export function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export function detectFileType(file: File): "csv" | "json" | "unknown" {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "csv") return "csv";
  if (extension === "json") return "json";

  // Check MIME type
  if (file.type === "text/csv" || file.type === "application/csv") return "csv";
  if (file.type === "application/json") return "json";

  return "unknown";
}
