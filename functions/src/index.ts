import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import Groq from 'groq-sdk';

// Initialize Firebase Admin
admin.initializeApp();

// Define API keys as secrets
const openrouterApiKey = defineSecret('OPENROUTER_API_KEY');
const groqApiKey = defineSecret('GROQ_API_KEY');
const revenuecatWebhookSecret = defineSecret('REVENUECAT_WEBHOOK_SECRET');

// Simple in-memory rate limiting (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

interface AIExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  daysUntilExpiration: number;
  suggestedStorageSpaceId: 'fridge' | 'freezer' | 'pantry' | 'counter';
  category: string;
  confidence: number;
}

// Recipe generation types
interface InventoryItem {
  name: string;
  quantity: number;
  unit: string;
  expirationDate: string;
}

interface RecipePreferences {
  cuisines: string[];
  dietaryRestrictions: string[];
  servings: number;
  maxCookTime: number;
  skillLevel: 'easy' | 'medium' | 'advanced';
}

interface RecipeIngredient {
  name: string;
  quantity: string;
  fromInventory: boolean;
}

interface GeneratedRecipe {
  title: string;
  description: string;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'advanced';
  cuisine: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  tips?: string;
  usedInventoryItems: string[];
}


interface ExtractionRequest {
  imageBase64: string;
  unitSystem: 'metric' | 'imperial';
}

interface AIExtractionResponse {
  items: AIExtractedItem[];
}


const RECIPE_PROMPT = `You are a creative chef AI that generates delicious recipes based on available ingredients.

Given the user's inventory and preferences, create 3 unique recipes that:
1. PRIORITIZE using ingredients that are expiring soon (marked with days until expiration)
2. Match the user's dietary restrictions and cuisine preferences
3. Are appropriate for the skill level requested
4. Fit within the maximum cook time (if specified)

USER PREFERENCES:
- Cuisines: {{CUISINES}}
- Dietary Restrictions: {{DIETARY}}
- Servings: {{SERVINGS}}
- Max Cook Time: {{MAX_TIME}} minutes (0 = no limit)
- Skill Level: {{SKILL_LEVEL}}

AVAILABLE INVENTORY (prioritize items expiring soon):
{{INVENTORY}}

For each recipe, provide:
1. title: A creative, appetizing name
2. description: A brief, enticing description (1-2 sentences)
3. cookTime: Total time in minutes
4. servings: Number of servings
5. difficulty: "easy", "medium", or "advanced"
6. cuisine: The cuisine type
7. ingredients: Array of {name, quantity, fromInventory: true/false}
8. instructions: Step-by-step cooking instructions (array of strings)
9. tips: Optional cooking tips or variations
10. usedInventoryItems: Array of ingredient names from the user's inventory that this recipe uses

IMPORTANT:
- Mark fromInventory: true for ingredients from the user's inventory
- Mark fromInventory: false for additional ingredients needed (keep these minimal)
- Include quantities for all ingredients
- Make instructions clear and numbered
- Respect ALL dietary restrictions strictly
- If no matching recipes possible, return fewer recipes or empty array

Respond with ONLY valid JSON in this format:
{
  "recipes": [
    {
      "title": "string",
      "description": "string",
      "cookTime": number,
      "servings": number,
      "difficulty": "easy" | "medium" | "advanced",
      "cuisine": "string",
      "ingredients": [{"name": "string", "quantity": "string", "fromInventory": boolean}],
      "instructions": ["string"],
      "tips": "string",
      "usedInventoryItems": ["string"]
    }
  ]
}`;

const EXTRACTION_PROMPT = `You are a food recognition AI. Analyze this image and extract ONLY food items.

This image may be:
1. A PHOTO OF GROCERIES - Identify visible food items, packages, and produce
2. A GROCERY RECEIPT - Extract each food line item from the text

For each food item found, provide:
1. name: The food item with brand name in parentheses if visible (e.g., "Coffee (Nescafe)", "Cereal (Cheerios)", "Milk (Organic Valley)")
2. quantity: Estimated quantity as a number
3. unit: The unit of measurement based on the user's preference
4. suggestedStorageSpaceId: Where the item should optimally be stored. MUST be one of: "fridge", "freezer", "pantry", "counter"
5. daysUntilExpiration: Number of days the item will stay fresh when stored in the suggested location (integer)
6. category: The food category. MUST be one of: "fruits", "vegetables", "herbs_spices", "dairy", "eggs", "meat", "seafood", "bread_bakery", "grains_pasta", "canned_goods", "legumes", "nuts_seeds", "condiments_sauces", "sweeteners_spreads", "beverages", "snacks", "frozen", "convenience", "breakfast", "baking", "international", "baby", "pet", "generic"
7. confidence: Your confidence score from 0 to 1

STORAGE GUIDELINES - suggest the optimal location:
- fridge: Dairy, eggs, opened condiments, fresh vegetables, cooked food, deli meats, fresh juices
- freezer: Raw meat for long storage, ice cream, frozen vegetables, bread for long storage, batch-cooked meals
- pantry: Canned goods, dry pasta, rice, flour, sugar, unopened condiments, oils, cereals, snacks
- counter: Bananas, tomatoes, potatoes, onions, garlic, avocados (until ripe), citrus fruits, bread (short-term)

EXPIRATION ESTIMATES (daysUntilExpiration) based on optimal storage:
- Fridge items: Dairy 7-14, fresh meat 3-5, vegetables 5-14, leftovers 3-4, eggs 21-28
- Freezer items: Meat 90-180, vegetables 240-365, bread 90, cooked meals 60-90, ice cream 60-90
- Pantry items: Canned goods 365-730, dry pasta/rice 180-365, flour/sugar 180-365, oils 180, cereals 180-270
- Counter items: Bananas 5-7, tomatoes 5-7, potatoes 14-28, onions 14-28, garlic 21-28, bread 5-7

UNITS: You MUST use {{UNIT_SYSTEM}} units. This is required.
{{UNIT_EXAMPLES}}

SKIP THESE NON-FOOD ITEMS (do NOT include):
- Cleaning supplies, detergents, soaps
- Paper goods (paper towels, toilet paper, napkins)
- Plastic bags, shopping bags
- Taxes, totals, discounts, coupons
- Pet food, pet supplies
- Medicine, vitamins, supplements
- Batteries, electronics
- Any non-consumable household items

IMPORTANT:
- ONLY include items that are food or beverages for human consumption
- Include brand names in parentheses when visible: "Pasta (Barilla)", "Yogurt (Chobani)"
- For generic items without visible brand, just use the food name: "Apples", "Chicken Breast"
- For PHOTOS: identify each visible food item, estimate quantity from what you see
- For RECEIPTS: extract each food line item, use the quantity shown on the receipt
- Always suggest the OPTIMAL storage location for maximum freshness

Respond with ONLY valid JSON in this exact format:
{
  "items": [
    {
      "name": "string",
      "quantity": number,
      "unit": "string",
      "suggestedStorageSpaceId": "fridge" | "freezer" | "pantry" | "counter",
      "daysUntilExpiration": number,
      "category": "string",
      "confidence": number
    }
  ]
}

If no food items are found, return: {"items": []}`;

export const analyzeFood = onRequest(
  {
    cors: ['https://nowaste.ai', 'https://www.nowaste.ai', 'https://nowaste-ai.web.app', 'https://nowaste-ai.firebaseapp.com', 'http://localhost:3000', 'https://localhost', 'capacitor://localhost'],
    secrets: [openrouterApiKey],
    memory: '1GiB',
    timeoutSeconds: 60,
  },
  async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Verify Firebase Auth token
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch {
        res.status(401).json({ error: 'Invalid authentication token' });
        return;
      }

      // Rate limiting by user ID
      const userId = decodedToken.uid;
      if (!checkRateLimit(userId)) {
        res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
        return;
      }

      const { imageBase64, unitSystem = 'metric' } = req.body as ExtractionRequest;

      if (!imageBase64) {
        res.status(400).json({ error: 'imageBase64 is required' });
        return;
      }

      const apiKey = openrouterApiKey.value();
      if (!apiKey) {
        res.status(500).json({ error: 'OpenRouter API key not configured' });
        return;
      }

    // Prepare the prompt with unit system preference
    const unitLabel = unitSystem === 'imperial'
      ? 'Imperial'
      : 'Metric';

    const unitExamples = unitSystem === 'imperial'
      ? `- Liquids: gallon, quart, pint, cup, fl oz (e.g., "1 gallon" for milk, "16 fl oz" for drinks)
- Weight: lb, oz (e.g., "1 lb" for meat, "8 oz" for cheese)
- Count: pcs, dozen (e.g., "6 pcs" for eggs, "1 dozen" for rolls)
- NEVER use: liter, L, mL, kg, g`
      : `- Liquids: L, mL (e.g., "1 L" for milk, "500 mL" for drinks)
- Weight: kg, g (e.g., "500 g" for meat, "200 g" for cheese)
- Count: pcs (e.g., "6 pcs" for eggs)
- NEVER use: gallon, quart, pint, cup, fl oz, lb, oz`;

    const prompt = EXTRACTION_PROMPT
      .replace('user\'s preference', unitLabel)
      .replace('{{UNIT_SYSTEM}}', unitLabel)
      .replace('{{UNIT_EXAMPLES}}', unitExamples);

    // Call OpenRouter API with Gemini model
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nowaste-ai.web.app',
        'X-Title': 'No Waste AI',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      res.status(500).json({ error: 'AI service error', details: errorText });
      return;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      res.status(500).json({ error: 'No response from AI' });
      return;
    }

    // Parse the JSON response
    let parsedResponse: AIExtractionResponse;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                       content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Return empty items if parsing fails
      parsedResponse = { items: [] };
    }

    // Valid storage space values
    const validStorageSpaces = ['fridge', 'freezer', 'pantry', 'counter'] as const;

    // Valid food categories
    const validCategories = [
      'fruits', 'vegetables', 'herbs_spices', 'dairy', 'eggs', 'meat', 'seafood',
      'bread_bakery', 'grains_pasta', 'canned_goods', 'legumes', 'nuts_seeds',
      'condiments_sauces', 'sweeteners_spreads', 'beverages', 'snacks', 'frozen',
      'convenience', 'breakfast', 'baking', 'international', 'baby', 'pet', 'generic'
    ] as const;

    // Helper to calculate expiration date from days
    const calculateExpirationDate = (days: number): string => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    };

    // Validate and clean up the response
    const validItems = (parsedResponse.items || []).filter(item =>
      item.name &&
      typeof item.quantity === 'number' &&
      item.quantity > 0
    ).map(item => {
      // Validate storage space, default to fridge if invalid
      const storageSpace = validStorageSpaces.includes(item.suggestedStorageSpaceId?.toLowerCase() as typeof validStorageSpaces[number])
        ? item.suggestedStorageSpaceId.toLowerCase() as typeof validStorageSpaces[number]
        : 'fridge';

      // Validate category, default to generic if invalid
      const category = validCategories.includes(item.category?.toLowerCase() as typeof validCategories[number])
        ? item.category.toLowerCase()
        : 'generic';

      // Get days until expiration, default to 7 if not provided or invalid
      const days = typeof item.daysUntilExpiration === 'number' && item.daysUntilExpiration > 0
        ? Math.round(item.daysUntilExpiration)
        : 7;

      return {
        name: item.name.trim(),
        quantity: Math.max(0.1, item.quantity),
        unit: item.unit || 'pcs',
        suggestedStorageSpaceId: storageSpace,
        category,
        estimatedExpirationDate: calculateExpirationDate(days),
        confidence: Math.min(1, Math.max(0, item.confidence || 0.5)),
      };
    });

      res.status(200).json({ items: validItems });

    } catch (error) {
      console.error('Error in analyzeFood:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// =============================================================================
// Voice Transcription (Groq Whisper)
// =============================================================================

export const transcribeAudio = onRequest(
  {
    cors: ['https://nowaste.ai', 'https://www.nowaste.ai', 'https://nowaste-ai.web.app', 'https://nowaste-ai.firebaseapp.com', 'http://localhost:3000', 'https://localhost', 'capacitor://localhost'],
    secrets: [groqApiKey],
    memory: '512MiB',
    timeoutSeconds: 30,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Verify Firebase Auth token
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch {
        res.status(401).json({ error: 'Invalid authentication token' });
        return;
      }

      // Rate limiting
      const userId = decodedToken.uid;
      if (!checkRateLimit(userId)) {
        res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
        return;
      }

      const { audioBase64, mimeType = 'audio/webm' } = req.body as {
        audioBase64: string;
        mimeType?: string;
      };

      if (!audioBase64) {
        res.status(400).json({ error: 'audioBase64 is required' });
        return;
      }

      const apiKey = groqApiKey.value();
      if (!apiKey) {
        res.status(500).json({ error: 'Groq API key not configured' });
        return;
      }

      // Initialize Groq client
      const groq = new Groq({ apiKey });

      // Convert base64 to buffer and create a file-like object
      const audioBuffer = Buffer.from(audioBase64, 'base64');

      // Determine file extension from MIME type
      const extMap: Record<string, string> = {
        'audio/webm': 'webm',
        'audio/mp4': 'mp4',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'audio/ogg': 'ogg',
        'audio/flac': 'flac',
      };
      const ext = extMap[mimeType] || 'webm';

      // Create a File object for Groq SDK
      const audioFile = new File([audioBuffer], `audio.${ext}`, { type: mimeType });

      // Transcribe using Groq Whisper (auto-detects language)
      const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3-turbo',
        response_format: 'json',
      });

      res.status(200).json({
        text: transcription.text,
      });

    } catch (error) {
      console.error('Error in transcribeAudio:', error);
      res.status(500).json({
        error: 'Transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// =============================================================================
// Parse Voice Input to Food Items
// =============================================================================

const VOICE_PARSE_PROMPT = `You are a food inventory assistant. Parse the user's spoken input about groceries they purchased.

Extract food items from the text, including:
- Item name (include brand if mentioned)
- Quantity (number)
- Unit of measurement
- Expiration date if mentioned (otherwise estimate based on food type)

USER'S VOICE INPUT:
"""
{{TEXT}}
"""

UNIT SYSTEM: {{UNIT_SYSTEM}}

For each food item, provide:
1. name: The food item name with brand in parentheses if mentioned
2. quantity: Numeric quantity (default to 1 if not specified)
3. unit: Use {{UNIT_SYSTEM}} units (metric: kg, g, L, mL, pcs | imperial: lb, oz, gallon, cup, pcs)
4. suggestedStorageSpaceId: Where to store - must be one of: "fridge", "freezer", "pantry", "counter"
5. daysUntilExpiration: Estimated days until expiration based on optimal storage. If user mentions specific date, calculate days from today.
6. category: Food category - must be one of: "fruits", "vegetables", "herbs_spices", "dairy", "eggs", "meat", "seafood", "bread_bakery", "grains_pasta", "canned_goods", "legumes", "nuts_seeds", "condiments_sauces", "sweeteners_spreads", "beverages", "snacks", "frozen", "convenience", "breakfast", "baking", "international", "baby", "pet", "generic"
7. confidence: Your confidence in understanding this item (0-1)

STORAGE GUIDELINES:
- fridge: Dairy, eggs, fresh vegetables, meat (short-term), opened condiments
- freezer: Meat (long-term), frozen goods, bread (long storage)
- pantry: Canned goods, dry pasta, rice, cereals, unopened condiments
- counter: Bananas, tomatoes, potatoes, onions, bread (short-term)

EXPIRATION GUIDELINES:
- If user says "expires in 3 days" → daysUntilExpiration: 3
- If user says "expires next week" → daysUntilExpiration: 7
- If user says "expires January 20" → calculate days from today
- If no expiration mentioned, estimate: dairy 7-14 days, meat 3-5 days, produce 5-14 days, pantry items 180+ days

Respond with ONLY valid JSON in this format:
{
  "items": [
    {
      "name": "string",
      "quantity": number,
      "unit": "string",
      "suggestedStorageSpaceId": "fridge" | "freezer" | "pantry" | "counter",
      "daysUntilExpiration": number,
      "category": "string",
      "confidence": number
    }
  ]
}

If no food items can be identified, return: {"items": []}`;

export const parseVoiceInput = onRequest(
  {
    cors: ['https://nowaste.ai', 'https://www.nowaste.ai', 'https://nowaste-ai.web.app', 'https://nowaste-ai.firebaseapp.com', 'http://localhost:3000', 'https://localhost', 'capacitor://localhost'],
    secrets: [openrouterApiKey],
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Verify Firebase Auth token
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch {
        res.status(401).json({ error: 'Invalid authentication token' });
        return;
      }

      // Rate limiting
      const userId = decodedToken.uid;
      if (!checkRateLimit(userId)) {
        res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
        return;
      }

      const { text, unitSystem = 'metric' } = req.body as {
        text: string;
        unitSystem?: 'metric' | 'imperial';
      };

      if (!text || text.trim().length === 0) {
        res.status(400).json({ error: 'text is required' });
        return;
      }

      const apiKey = openrouterApiKey.value();
      if (!apiKey) {
        res.status(500).json({ error: 'OpenRouter API key not configured' });
        return;
      }

      // Prepare the prompt
      const unitLabel = unitSystem === 'imperial' ? 'Imperial' : 'Metric';
      const prompt = VOICE_PARSE_PROMPT
        .replace('{{TEXT}}', text)
        .replace(/{{UNIT_SYSTEM}}/g, unitLabel);

      // Call OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://nowaste-ai.web.app',
          'X-Title': 'No Waste AI',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 2048,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', errorText);
        res.status(500).json({ error: 'AI service error', details: errorText });
        return;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        res.status(500).json({ error: 'No response from AI' });
        return;
      }

      // Parse the JSON response
      let parsedResponse: AIExtractionResponse;
      try {
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                         content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        parsedResponse = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        parsedResponse = { items: [] };
      }

      // Valid storage space values
      const validStorageSpaces = ['fridge', 'freezer', 'pantry', 'counter'] as const;

      // Valid food categories
      const validCategories = [
        'fruits', 'vegetables', 'herbs_spices', 'dairy', 'eggs', 'meat', 'seafood',
        'bread_bakery', 'grains_pasta', 'canned_goods', 'legumes', 'nuts_seeds',
        'condiments_sauces', 'sweeteners_spreads', 'beverages', 'snacks', 'frozen',
        'convenience', 'breakfast', 'baking', 'international', 'baby', 'pet', 'generic'
      ] as const;

      // Helper to calculate expiration date from days
      const calculateExpirationDate = (days: number): string => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
      };

      // Validate and clean up the response
      const validItems = (parsedResponse.items || []).filter(item =>
        item.name &&
        typeof item.quantity === 'number' &&
        item.quantity > 0
      ).map(item => {
        const storageSpace = validStorageSpaces.includes(item.suggestedStorageSpaceId?.toLowerCase() as typeof validStorageSpaces[number])
          ? item.suggestedStorageSpaceId.toLowerCase() as typeof validStorageSpaces[number]
          : 'fridge';

        const category = validCategories.includes(item.category?.toLowerCase() as typeof validCategories[number])
          ? item.category.toLowerCase()
          : 'generic';

        const days = typeof item.daysUntilExpiration === 'number' && item.daysUntilExpiration > 0
          ? Math.round(item.daysUntilExpiration)
          : 7;

        return {
          name: item.name.trim(),
          quantity: Math.max(0.1, item.quantity),
          unit: item.unit || 'pcs',
          suggestedStorageSpaceId: storageSpace,
          category,
          estimatedExpirationDate: calculateExpirationDate(days),
          confidence: Math.min(1, Math.max(0, item.confidence || 0.5)),
        };
      });

      res.status(200).json({ items: validItems });

    } catch (error) {
      console.error('Error in parseVoiceInput:', error);
      res.status(500).json({
        error: 'Failed to parse voice input',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// =============================================================================
// Barcode Product Enhancement
// =============================================================================

const BARCODE_ENHANCE_PROMPT = `You are a food expert AI. Given a product from a barcode scan, provide:
1. A realistic estimated shelf life in days (how long until it expires after purchase)
2. The best matching icon name from our icon library

AVAILABLE ICONS (use exact name):
acai,alcohol,alfredo_sauce,almond_butter,almond_milk,almond,apple_juice,apple,applesauce_cup,apricot,artichoke,arugula,asparagus,avocado,baby_food,bacon,bagel,baguette,banana,barley,basil,bass,bbq_sauce,beans,beef_broth,beef_jerky,beef,beer,beet,bell_pepper,biscuit,black_beans,blackberry,blue_cheese,blueberry,bok_choy,bread,breakfast_burrito,brie,broccoli,broth,brown_rice,brown_sugar,brussels_sprouts,burrito,butter,butternut_squash,cabbage,cake,candy,canned_beans,canned_corn,canned_food,canned_soup,canned_tomatoes,canned_tuna,cantaloupe,capers,caramel_sauce,carrot,cashew,cat_food,cauliflower,celery,cereal,champagne,cheddar,cheese,cherry,chia_seeds,chicken_breast,chicken_broth,chicken_nuggets,chicken,chickpeas,chips,chives,chocolate_bar,chocolate_chips,chocolate_milk,chocolate,cilantro,cinnamon_roll,clam,cocktail_sauce,cocoa_powder,coconut_milk,coconut_water,coconut,cod,coffee_beans,coffee_creamer,coffee,cola,coleslaw,condensed_milk,cookie,corn,cornbread,cottage_cheese,couscous,crab,crackers,cranberry_juice,cranberry,cream_cheese,cream,croissant,cucumber,cup_noodles,curry,dates,deli_meat,dill,dog_food,donut,dragon_fruit,dressing,duck,edamame,egg_rolls,egg,eggplant,energy_drink,english_muffin,falafel,fennel,feta,fig,fish,flatbread,flour,french_fries,french_toast,frosting,frozen_berries,frozen_dinner,frozen_pizza,frozen_vegetables,fruit,garlic,gatorade,ginger_ale,ginger,goat_cheese,gouda,granola_bar,granola,grape_juice,grape,grapefruit,greek_yogurt,green_beans,green_onion,ground_beef,guacamole,guava,gummy_bears,ham,hamburger_bun,hash_browns,hazelnut,herbs,honey,honeydew,hot_chocolate,hot_dog,hot_sauce,hummus,ice_cream,iced_tea,instant_noodles,jackfruit,jalapeno,jam,jelly,juice,kale,ketchup,kidney_beans,kimchi,kiwi,lamb,lasagna,leek,leftovers,lemon,lemonade,lentils,lettuce,lime,lobster,lychee,mac_and_cheese_box,macaroni,mackerel,mango,maple_syrup,marinara_sauce,mayonnaise,meatballs,milk,milkshake,mint,miso_paste,molasses,mozzarella,muffin,mushroom,mussel,mustard,nacho_cheese,naan,nectarine,noodles,oat_milk,oatmeal,oats,olive_oil,olives,onion,orange_juice,orange,oregano,oreos,oyster,pad_thai,pancake_mix,pancakes,papaya,paprika,parmesan,parsley,pasta_sauce,pasta,pastry,pate,peach,peanut_butter,peanuts,pear,peas,pecan,pepper,pepperoni,pesto,pickle,pie,pineapple,pinto_beans,pistachio,pita,pizza,plum,popcorn,popsicle,pork_chop,pork,potato_chips,potato_salad,potato,pretzels,provolone,pudding,pumpkin,queso,quinoa,radish,raisins,ramen,ranch_dressing,raspberry,ravioli,red_onion,red_pepper,relish,rice_cake,rice,rigatoni,risotto,roast_beef,rosemary,salad,salami,salmon,salsa,sandwich,sardines,sauerkraut,sausage,scallion,scallops,seaweed,sesame_oil,shallot,shrimp,smoothie,snack_bar,soda,soup,sour_cream,soy_milk,soy_sauce,spaghetti,spinach,spring_roll,squash,sriracha,steak,stew,strawberry,string_cheese,stuffing,sugar,sushi,sweet_potato,swiss_cheese,taco,tahini,tamale,tangerine,tea,tempeh,teriyaki,thyme,tilapia,tofu,tomato_paste,tomato_sauce,tomato,tortilla_chips,tortilla,trail_mix,trout,tuna,turkey,turmeric,turnip,vanilla,vegetable_broth,vegetables,vinegar,waffle,walnut,wasabi,water_bottle,water,watermelon,whipped_cream,white_rice,wine,wrap,yam,yogurt,zucchini

FOOD CATEGORY (use one):
fruits, vegetables, herbs_spices, dairy, eggs, meat, seafood, bread_bakery, grains_pasta, canned_goods, legumes, nuts_seeds, condiments_sauces, sweeteners_spreads, beverages, snacks, frozen, convenience, breakfast, baking, international, baby, pet, generic

STORAGE LOCATION (use one):
fridge, freezer, pantry, counter

Respond ONLY with valid JSON:
{
  "daysUntilExpiration": <number>,
  "iconName": "<exact icon name from list>",
  "category": "<food category>",
  "storageLocation": "<storage location>"
}`;

export const enhanceBarcodeProduct = onRequest(
  {
    cors: ['https://nowaste.ai', 'https://www.nowaste.ai', 'https://nowaste-ai.web.app', 'https://nowaste-ai.firebaseapp.com', 'http://localhost:3000', 'https://localhost', 'capacitor://localhost'],
    secrets: [openrouterApiKey],
    memory: '256MiB',
    timeoutSeconds: 15,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Verify Firebase Auth token
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      try {
        await admin.auth().verifyIdToken(idToken);
      } catch {
        res.status(401).json({ error: 'Invalid authentication token' });
        return;
      }

      const { productName, brand, categories } = req.body;

      if (!productName) {
        res.status(400).json({ error: 'Product name is required' });
        return;
      }

      const productInfo = `Product: ${brand ? `${brand} ` : ''}${productName}${categories ? `\nCategories: ${categories}` : ''}`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterApiKey.value()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://nowaste.ai',
          'X-Title': 'NoWaste AI',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            { role: 'system', content: BARCODE_ENHANCE_PROMPT },
            { role: 'user', content: productInfo },
          ],
          temperature: 0.3,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        res.status(500).json({ error: 'No response from AI' });
        return;
      }

      // Parse JSON response
      let result;
      try {
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                         content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        result = JSON.parse(jsonStr);
      } catch {
        // Return defaults if parsing fails
        result = {
          daysUntilExpiration: 30,
          iconName: 'food',
          category: 'generic',
          storageLocation: 'pantry',
        };
      }

      res.status(200).json(result);

    } catch (error) {
      console.error('Error in enhanceBarcodeProduct:', error);
      res.status(500).json({
        error: 'Failed to enhance barcode product',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// =============================================================================
// Recipe Generation
// =============================================================================

const FREE_TIER_MONTHLY_LIMIT = 10;

export const generateRecipes = onRequest(
  {
    cors: ['https://nowaste.ai', 'https://www.nowaste.ai', 'https://nowaste-ai.web.app', 'https://nowaste-ai.firebaseapp.com', 'http://localhost:3000', 'https://localhost', 'capacitor://localhost'],
    secrets: [openrouterApiKey],
    memory: '512MiB',
    timeoutSeconds: 60,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Verify Firebase Auth token
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch {
        res.status(401).json({ error: 'Invalid authentication token' });
        return;
      }

      const userId = decodedToken.uid;
      const db = admin.firestore();

      // Check monthly usage limit for free users
      const now = new Date();
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const usageQuery = await db
        .collection('recipeUsage')
        .where('userId', '==', userId)
        .where('monthYear', '==', monthYear)
        .get();

      const currentUsage = usageQuery.empty ? 0 : (usageQuery.docs[0].data().count || 0);

      // Check if user is premium (you can expand this logic)
      const userDoc = await db.collection('users').doc(userId).get();
      const isPremium = userDoc.exists && userDoc.data()?.isPremium === true;

      if (!isPremium && currentUsage >= FREE_TIER_MONTHLY_LIMIT) {
        res.status(429).json({
          error: 'Monthly limit reached',
          message: `Free users can generate recipes ${FREE_TIER_MONTHLY_LIMIT} times per month. Upgrade to premium for unlimited access.`,
          currentUsage,
          limit: FREE_TIER_MONTHLY_LIMIT,
        });
        return;
      }

      // Rate limiting (per minute)
      if (!checkRateLimit(userId)) {
        res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
        return;
      }

      const { inventory, preferences } = req.body as {
        inventory: InventoryItem[];
        preferences: RecipePreferences;
      };

      if (!inventory || inventory.length === 0) {
        res.status(400).json({ error: 'Inventory is required and cannot be empty' });
        return;
      }

      const apiKey = openrouterApiKey.value();
      if (!apiKey) {
        res.status(500).json({ error: 'OpenRouter API key not configured' });
        return;
      }

      // Format inventory for the prompt
      const today = new Date();
      const inventoryText = inventory.map(item => {
        const expDate = new Date(item.expirationDate);
        const daysUntil = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const urgency = daysUntil <= 0 ? '⚠️ EXPIRED' :
                       daysUntil <= 2 ? '🔴 URGENT' :
                       daysUntil <= 5 ? '🟡 SOON' : '';
        return `- ${item.name}: ${item.quantity} ${item.unit} ${urgency}(expires in ${daysUntil} days)`;
      }).join('\n');

      // Prepare the prompt
      const prompt = RECIPE_PROMPT
        .replace('{{CUISINES}}', preferences.cuisines?.join(', ') || 'any')
        .replace('{{DIETARY}}', preferences.dietaryRestrictions?.join(', ') || 'none')
        .replace('{{SERVINGS}}', String(preferences.servings || 2))
        .replace('{{MAX_TIME}}', String(preferences.maxCookTime || 0))
        .replace('{{SKILL_LEVEL}}', preferences.skillLevel || 'easy')
        .replace('{{INVENTORY}}', inventoryText);

      // Call OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://nowaste-ai.web.app',
          'X-Title': 'No Waste AI',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 4096,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', errorText);
        res.status(500).json({ error: 'AI service error', details: errorText });
        return;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        res.status(500).json({ error: 'No response from AI' });
        return;
      }

      // Parse the JSON response
      let parsedResponse: { recipes: GeneratedRecipe[] };
      try {
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                         content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        parsedResponse = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        parsedResponse = { recipes: [] };
      }

      // Validate recipes
      const validRecipes = (parsedResponse.recipes || []).filter(recipe =>
        recipe.title &&
        recipe.description &&
        recipe.ingredients?.length > 0 &&
        recipe.instructions?.length > 0
      ).map(recipe => ({
        ...recipe,
        cookTime: recipe.cookTime || 30,
        servings: recipe.servings || preferences.servings || 2,
        difficulty: ['easy', 'medium', 'advanced'].includes(recipe.difficulty) ? recipe.difficulty : 'easy',
      }));

      // Increment usage count
      if (usageQuery.empty) {
        await db.collection('recipeUsage').add({
          userId,
          monthYear,
          count: 1,
        });
      } else {
        await usageQuery.docs[0].ref.update({
          count: admin.firestore.FieldValue.increment(1),
        });
      }

      res.status(200).json({
        recipes: validRecipes,
        usage: {
          current: currentUsage + 1,
          limit: isPremium ? null : FREE_TIER_MONTHLY_LIMIT,
          isPremium,
        },
      });

    } catch (error) {
      console.error('Error in generateRecipes:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// =============================================================================
// Scheduled Alert Generation
// =============================================================================

const db = admin.firestore();

// Alert time windows (local hour ranges)
const ALERT_WINDOWS: Record<string, { start: number; end: number }> = {
  morning: { start: 7, end: 11 },    // 7 AM - 11 AM
  afternoon: { start: 12, end: 16 }, // 12 PM - 4 PM
  evening: { start: 17, end: 21 },   // 5 PM - 9 PM
};

// Check if current time is within user's preferred alert window
// @ts-ignore - temporarily unused during testing
function isInAlertWindow(_timezone: string, _alertTime: string): boolean {
  if (_alertTime === 'off') return false;

  const window = ALERT_WINDOWS[_alertTime];
  if (!window) return false;

  try {
    // Get current hour in user's timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: _timezone,
      hour: 'numeric',
      hour12: false,
    });
    const localHour = parseInt(formatter.format(now), 10);

    return localHour >= window.start && localHour < window.end;
  } catch {
    // If timezone is invalid, default to allowing alerts
    return true;
  }
}

// Runs every hour at minute 0
export const generateExpirationAlerts = onSchedule(
  {
    schedule: '0 * * * *', // Every hour
    timeZone: 'UTC',
    memory: '256MiB',
  },
  async () => {
    console.log('Starting expiration alert generation...');

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Only query items expiring within 7 days (or already expired up to 7 days ago)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Check for items expiring in 0, 1, 3, or 7 days
    const alertDays = [0, 1, 3, 7];

    try {
      // Only get items expiring within our alert window
      const foodItemsSnapshot = await db
        .collection('foodItems')
        .where('status', '==', 'active')
        .where('expirationDate', '>=', sevenDaysAgo.toISOString().split('T')[0])
        .where('expirationDate', '<=', sevenDaysFromNow.toISOString().split('T')[0])
        .get();

      console.log(`Found ${foodItemsSnapshot.size} items expiring soon`);

      // Cache user data to avoid repeated queries
      const userCache = new Map<string, { alertTime: string; timezone: string; fcmToken?: string }>();
      // Track items per user for combined notification
      const userAlerts = new Map<string, { items: string[]; fcmToken?: string }>();

      let alertsCreated = 0;
      let skippedWrongTime = 0;
      let notificationsSent = 0;

      for (const doc of foodItemsSnapshot.docs) {
        const item = doc.data();

        // Get user data (cached)
        if (!userCache.has(item.userId)) {
          const userDoc = await db.collection('users').doc(item.userId).get();

          if (userDoc.exists) {
            const userData = userDoc.data()!;
            userCache.set(item.userId, {
              alertTime: userData.alertTime || 'morning',
              timezone: userData.timezone || 'UTC',
              fcmToken: userData.fcmToken,
            });
          } else {
            userCache.set(item.userId, { alertTime: 'morning', timezone: 'UTC', fcmToken: undefined });
          }
        }

        const userSettings = userCache.get(item.userId)!;

        // Skip if alerts are off or not in user's preferred time window
        if (userSettings.alertTime === 'off') continue;
        // TODO: Re-enable time window check after testing
        // if (!isInAlertWindow(userSettings.timezone, userSettings.alertTime)) {
        //   skippedWrongTime++;
        //   continue;
        // }

        const expirationDate = new Date(item.expirationDate);
        expirationDate.setHours(0, 0, 0, 0);

        const daysUntilExpiration = Math.ceil(
          (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if this item should trigger an alert
        if (alertDays.includes(daysUntilExpiration) || daysUntilExpiration < 0) {
          // Check if an alert already exists for this item today
          const existingAlert = await db
            .collection('alerts')
            .where('foodItemId', '==', doc.id)
            .where('userId', '==', item.userId)
            .orderBy('sentAt', 'desc')
            .limit(1)
            .get();

          // Skip if we already sent an alert today
          if (!existingAlert.empty) {
            const lastAlert = existingAlert.docs[0].data();
            const lastAlertDate = lastAlert.sentAt?.toDate?.() || new Date(lastAlert.sentAt);
            const lastAlertDay = new Date(lastAlertDate);
            lastAlertDay.setHours(0, 0, 0, 0);

            if (lastAlertDay.getTime() === today.getTime()) {
              continue; // Already alerted today
            }
          }

          // Generate appropriate message
          let message: string;
          if (daysUntilExpiration < 0) {
            const daysExpired = Math.abs(daysUntilExpiration);
            message = `Expired ${daysExpired} day${daysExpired !== 1 ? 's' : ''} ago`;
          } else if (daysUntilExpiration === 0) {
            message = 'Expires today! Use it before it goes bad.';
          } else if (daysUntilExpiration === 1) {
            message = 'Expires tomorrow. Plan to use it soon!';
          } else {
            message = `Expires in ${daysUntilExpiration} days`;
          }

          // Create the alert
          await db.collection('alerts').add({
            foodItemId: doc.id,
            foodItemName: item.name,
            message,
            expirationDate: item.expirationDate,
            status: 'unread',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            userId: item.userId,
          });

          alertsCreated++;

          // Track items for combined notification
          if (userSettings.fcmToken) {
            if (!userAlerts.has(item.userId)) {
              userAlerts.set(item.userId, { items: [], fcmToken: userSettings.fcmToken });
            }
            userAlerts.get(item.userId)!.items.push(item.name);
          }
        }
      }

      // Send ONE combined notification per user
      for (const [userId, data] of userAlerts) {
        try {
          const itemCount = data.items.length;
          const title = itemCount === 1
            ? `🍎 ${data.items[0]} is expiring!`
            : `🍎 ${itemCount} items need attention`;
          const body = itemCount === 1
            ? 'Check your inventory for details'
            : `${data.items.slice(0, 3).join(', ')}${itemCount > 3 ? ` and ${itemCount - 3} more` : ''}`;

          await admin.messaging().send({
            token: data.fcmToken!,
            notification: {
              title,
              body,
            },
            data: {
              type: 'expiration_alert',
              itemCount: String(itemCount),
            },
            android: {
              priority: 'high',
              notification: {
                channelId: 'expiration_alerts',
                icon: 'ic_notification',
              },
            },
            apns: {
              payload: {
                aps: {
                  badge: itemCount,
                  sound: 'default',
                },
              },
            },
          });
          notificationsSent++;
        } catch (pushError) {
          console.error(`Failed to send push to user ${userId}:`, pushError);
        }
      }

      console.log(`Created ${alertsCreated} alerts, sent ${notificationsSent} push notifications, skipped ${skippedWrongTime} (wrong time window)`);
    } catch (error) {
      console.error('Error generating expiration alerts:', error);
      throw error;
    }
  }
);

// Manual trigger for testing (authenticated endpoint)
export const triggerAlertGeneration = onRequest(
  {
    cors: ['https://nowaste.ai', 'https://www.nowaste.ai', 'https://nowaste-ai.web.app', 'https://nowaste-ai.firebaseapp.com', 'http://localhost:3000', 'https://localhost', 'capacitor://localhost'],
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Verify Firebase Auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
      await admin.auth().verifyIdToken(idToken);
    } catch {
      res.status(401).json({ error: 'Invalid authentication token' });
      return;
    }

    console.log('Manual alert generation triggered...');

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Only query items expiring within 7 days (or already expired up to 7 days ago)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const alertDays = [0, 1, 3, 7];

    try {
      const foodItemsSnapshot = await db
        .collection('foodItems')
        .where('status', '==', 'active')
        .where('expirationDate', '>=', sevenDaysAgo.toISOString().split('T')[0])
        .where('expirationDate', '<=', sevenDaysFromNow.toISOString().split('T')[0])
        .get();

      let alertsCreated = 0;

      for (const doc of foodItemsSnapshot.docs) {
        const item = doc.data();
        const expirationDate = new Date(item.expirationDate);
        expirationDate.setHours(0, 0, 0, 0);

        const daysUntilExpiration = Math.ceil(
          (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (alertDays.includes(daysUntilExpiration) || daysUntilExpiration < 0) {
          // Check if an alert already exists for this item today
          const existingAlert = await db
            .collection('alerts')
            .where('foodItemId', '==', doc.id)
            .where('userId', '==', item.userId)
            .orderBy('sentAt', 'desc')
            .limit(1)
            .get();

          if (!existingAlert.empty) {
            const lastAlert = existingAlert.docs[0].data();
            const lastAlertDate = lastAlert.sentAt?.toDate?.() || new Date(lastAlert.sentAt);
            const lastAlertDay = new Date(lastAlertDate);
            lastAlertDay.setHours(0, 0, 0, 0);

            if (lastAlertDay.getTime() === now.getTime()) {
              continue;
            }
          }

          let message: string;
          if (daysUntilExpiration < 0) {
            const daysExpired = Math.abs(daysUntilExpiration);
            message = `Expired ${daysExpired} day${daysExpired !== 1 ? 's' : ''} ago`;
          } else if (daysUntilExpiration === 0) {
            message = 'Expires today! Use it before it goes bad.';
          } else if (daysUntilExpiration === 1) {
            message = 'Expires tomorrow. Plan to use it soon!';
          } else {
            message = `Expires in ${daysUntilExpiration} days`;
          }

          await db.collection('alerts').add({
            foodItemId: doc.id,
            foodItemName: item.name,
            message,
            expirationDate: item.expirationDate,
            status: 'unread',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            userId: item.userId,
          });

          alertsCreated++;
        }
      }

      res.status(200).json({ success: true, alertsCreated });
    } catch (error) {
      console.error('Error generating alerts:', error);
      res.status(500).json({
        error: 'Failed to generate alerts',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// =============================================================================
// RevenueCat Webhook - Sync subscription status to Firestore
// =============================================================================

interface RevenueCatWebhookEvent {
  api_version: string;
  event: {
    type: string;
    app_user_id: string;
    original_app_user_id: string;
    product_id: string;
    entitlement_ids?: string[];
    period_type?: string;
    purchased_at_ms?: number;
    expiration_at_ms?: number;
    environment?: string;
    store?: string;
  };
}

// Events that indicate an active subscription
const SUBSCRIPTION_ACTIVE_EVENTS = [
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'SUBSCRIPTION_EXTENDED',
  'NON_RENEWING_PURCHASE',
  'SUBSCRIBER_ALIAS',
];

// Events that indicate subscription ended
const SUBSCRIPTION_ENDED_EVENTS = [
  'EXPIRATION',
  'CANCELLATION', // Note: CANCELLATION means they won't renew, not immediate loss
  'BILLING_ISSUE',
  'REFUND',
];

export const revenuecatWebhook = onRequest(
  {
    // RevenueCat webhooks come from their servers, no CORS needed
    secrets: [revenuecatWebhookSecret],
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Verify webhook authorization
      const authHeader = req.headers.authorization;
      const expectedSecret = revenuecatWebhookSecret.value();

      if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
        console.error('[RevenueCat Webhook] Invalid authorization');
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const webhookData = req.body as RevenueCatWebhookEvent;
      const event = webhookData.event;

      console.log(`[RevenueCat Webhook] Received event: ${event.type} for user: ${event.app_user_id}`);

      // Log webhook event to Firestore for debugging and audit
      const webhookLogRef = db.collection('webhookLogs').doc();
      await webhookLogRef.set({
        id: webhookLogRef.id,
        source: 'revenuecat',
        eventType: event.type,
        appUserId: event.app_user_id,
        originalAppUserId: event.original_app_user_id,
        productId: event.product_id || null,
        entitlementIds: event.entitlement_ids || [],
        periodType: event.period_type || null,
        purchasedAt: event.purchased_at_ms ? new Date(event.purchased_at_ms) : null,
        expiresAt: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
        environment: event.environment || null,
        store: event.store || null,
        rawPayload: JSON.stringify(webhookData),
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        processed: false,
        error: null,
      });

      // The app_user_id should be the Firebase UID (set during RevenueCat login)
      const userId = event.app_user_id;

      if (!userId || userId.startsWith('$RCAnonymousID')) {
        console.log('[RevenueCat Webhook] Skipping anonymous user event');
        await webhookLogRef.update({
          processed: true,
          skipped: true,
          skipReason: 'Anonymous user',
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(200).json({ success: true, message: 'Skipped anonymous user' });
        return;
      }

      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        console.error(`[RevenueCat Webhook] User not found: ${userId}`);
        await webhookLogRef.update({
          processed: true,
          skipped: true,
          skipReason: 'User not found in Firestore',
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Still return 200 to avoid RevenueCat retrying
        res.status(200).json({ success: true, message: 'User not found' });
        return;
      }

      // Determine if subscription is active based on event type
      let isPremium = false;
      let subscriptionData: Record<string, unknown> = {};

      if (SUBSCRIPTION_ACTIVE_EVENTS.includes(event.type)) {
        isPremium = true;
        subscriptionData = {
          isPremium: true,
          subscriptionProductId: event.product_id,
          subscriptionStore: event.store,
          subscriptionPurchasedAt: event.purchased_at_ms
            ? new Date(event.purchased_at_ms)
            : admin.firestore.FieldValue.serverTimestamp(),
          subscriptionExpiresAt: event.expiration_at_ms
            ? new Date(event.expiration_at_ms)
            : null,
          subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        console.log(`[RevenueCat Webhook] Activating premium for user: ${userId}`);
      } else if (SUBSCRIPTION_ENDED_EVENTS.includes(event.type)) {
        // For CANCELLATION, check if they still have time left
        if (event.type === 'CANCELLATION' && event.expiration_at_ms) {
          const expirationDate = new Date(event.expiration_at_ms);
          if (expirationDate > new Date()) {
            // Still has access until expiration
            isPremium = true;
            subscriptionData = {
              isPremium: true,
              subscriptionWillCancel: true,
              subscriptionExpiresAt: expirationDate,
              subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            console.log(`[RevenueCat Webhook] User ${userId} cancelled but still has access until ${expirationDate}`);
          } else {
            isPremium = false;
            subscriptionData = {
              isPremium: false,
              subscriptionWillCancel: false,
              subscriptionExpiresAt: null,
              subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
          }
        } else {
          // Immediate loss of access (refund, expiration, billing issue)
          isPremium = false;
          subscriptionData = {
            isPremium: false,
            subscriptionWillCancel: false,
            subscriptionExpiresAt: null,
            subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };
          console.log(`[RevenueCat Webhook] Deactivating premium for user: ${userId} (${event.type})`);
        }
      } else {
        // Unknown event type, log but don't modify
        console.log(`[RevenueCat Webhook] Unhandled event type: ${event.type}`);
        await webhookLogRef.update({
          processed: true,
          skipped: true,
          skipReason: `Unhandled event type: ${event.type}`,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(200).json({ success: true, message: 'Event type not handled' });
        return;
      }

      // Update user document
      await userRef.update(subscriptionData);

      // Mark webhook as processed successfully
      await webhookLogRef.update({
        processed: true,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        resultIsPremium: isPremium,
        resultUserId: userId,
      });

      console.log(`[RevenueCat Webhook] Updated user ${userId}: isPremium=${isPremium}`);

      res.status(200).json({ success: true, isPremium });
    } catch (error) {
      console.error('[RevenueCat Webhook] Error:', error);

      // Log error to a separate error log collection
      try {
        await db.collection('webhookErrors').add({
          source: 'revenuecat',
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : null,
          payload: JSON.stringify(req.body),
          receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (logError) {
        console.error('[RevenueCat Webhook] Failed to log error:', logError);
      }

      // Return 200 to prevent RevenueCat from retrying on our errors
      res.status(200).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// =============================================================================
// Sync Premium Status (called from client after purchase)
// =============================================================================

export const syncPremiumStatus = onRequest(
  {
    cors: ['https://nowaste.ai', 'https://www.nowaste.ai', 'https://nowaste-ai.web.app', 'https://nowaste-ai.firebaseapp.com', 'http://localhost:3000', 'https://localhost', 'capacitor://localhost'],
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Verify Firebase Auth token
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch {
        res.status(401).json({ error: 'Invalid authentication token' });
        return;
      }

      const userId = decodedToken.uid;
      const { isPremium, productId, expirationDate } = req.body as {
        isPremium: boolean;
        productId?: string;
        expirationDate?: string;
      };

      const userRef = db.collection('users').doc(userId);

      await userRef.update({
        isPremium: isPremium === true,
        subscriptionProductId: productId || null,
        subscriptionExpiresAt: expirationDate ? new Date(expirationDate) : null,
        subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`[SyncPremium] Updated user ${userId}: isPremium=${isPremium}`);

      res.status(200).json({ success: true, isPremium });
    } catch (error) {
      console.error('[SyncPremium] Error:', error);
      res.status(500).json({
        error: 'Failed to sync premium status',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);
