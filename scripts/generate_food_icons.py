#!/usr/bin/env python3
"""
Food Icon Generator
1. Fetches food items from Open Food Facts API
2. Generates pixel art icons using OpenRouter AI

Usage:
    pip install requests pillow
    export OPENROUTER_API_KEY="your_key"

    # Step 1: Fetch food list
    python generate_food_icons.py --fetch-foods

    # Step 2: Generate icons
    python generate_food_icons.py --generate
"""

import os
import json
import time
import base64
import requests
from pathlib import Path

try:
    from PIL import Image
    from io import BytesIO
except ImportError:
    print("Please install pillow: pip install pillow")
    exit(1)


SCRIPT_DIR = Path(__file__).parent
FOODS_FILE = SCRIPT_DIR / "foods.json"
ICONS_DIR = SCRIPT_DIR / "food_icons"

# Load .env file if exists
ENV_FILE = SCRIPT_DIR / ".env"
if ENV_FILE.exists():
    with open(ENV_FILE) as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                key, value = line.strip().split("=", 1)
                os.environ[key] = value


# =============================================================================
# Curated Food List - Visually distinct grocery items only
# =============================================================================
CURATED_FOODS = {
    "fruits": [
        "apple", "banana", "orange", "lemon", "lime", "grapefruit", "tangerine",
        "strawberry", "blueberry", "raspberry", "blackberry", "grape", "cherry",
        "watermelon", "cantaloupe", "honeydew", "mango", "papaya", "pineapple", "coconut",
        "kiwi", "peach", "nectarine", "plum", "apricot", "pear", "pomegranate", "fig",
        "passion fruit", "dragon fruit", "avocado", "cranberry", "dates", "raisins",
        "plantain", "starfruit", "jackfruit"
    ],
    "vegetables": [
        "carrot", "broccoli", "cauliflower", "cabbage", "lettuce", "spinach", "kale",
        "brussels sprouts", "asparagus", "celery",
        "cucumber", "zucchini", "butternut squash", "pumpkin", "spaghetti squash",
        "eggplant", "bell pepper", "jalapeno", "habanero",
        "onion", "green onion", "leek", "garlic", "ginger",
        "potato", "sweet potato", "yukon gold potato",
        "beet", "turnip", "radish", "parsnip",
        "corn", "peas", "green beans", "edamame", "snap peas",
        "artichoke", "mushroom", "bok choy", "bean sprouts",
        "tomato", "cherry tomato", "roma tomato"
    ],
    "herbs_spices": [
        "basil", "oregano", "thyme", "rosemary", "mint", "cilantro", "parsley",
        "dill", "chives", "bay leaf",
        "cinnamon stick", "vanilla bean", "black pepper", "salt"
    ],
    "dairy": [
        "milk", "almond milk", "oat milk",
        "butter", "cream cheese", "sour cream", "whipped cream",
        "cheddar cheese", "mozzarella", "parmesan", "brie", "feta", "blue cheese",
        "cottage cheese", "shredded cheese", "string cheese",
        "yogurt", "greek yogurt",
        "coffee creamer", "half and half", "cool whip"
    ],
    "eggs": [
        "egg", "hard boiled egg"
    ],
    "meat": [
        "chicken breast", "chicken wing", "whole chicken", "rotisserie chicken",
        "turkey", "duck",
        "ground beef", "steak", "beef roast", "brisket",
        "pork chop", "pork roast",
        "bacon", "ham", "pork belly", "ribs",
        "sausage", "hot dog", "pepperoni", "salami", "prosciutto",
        "deli meat", "cheese slices",
        "lamb chop", "meatballs"
    ],
    "seafood": [
        "salmon", "smoked salmon", "tuna", "cod", "tilapia", "trout",
        "sardine", "mackerel",
        "shrimp", "lobster", "crab",
        "scallop", "clam", "mussel", "oyster", "squid", "octopus",
        "fish fillet"
    ],
    "bread_bakery": [
        "bread loaf", "baguette", "sourdough", "brioche",
        "pita bread", "naan", "tortilla", "flatbread",
        "bagel", "english muffin", "croissant", "muffin",
        "donut", "cinnamon roll", "pretzel", "hamburger bun", "hot dog bun",
        "cornbread", "biscuit", "dinner roll", "breadsticks"
    ],
    "grains_pasta": [
        "rice", "quinoa", "couscous", "barley", "oatmeal",
        "spaghetti", "penne", "macaroni", "lasagna", "ravioli", "tortellini",
        "ramen", "udon",
        "cereal box", "cheerios", "granola", "corn flakes",
        "flour bag", "cornmeal", "pancake mix", "waffle"
    ],
    "canned_goods": [
        "canned tomatoes", "tomato sauce", "tomato paste",
        "canned corn", "canned beans",
        "canned tuna", "canned soup", "chicken broth", "beef broth",
        "canned peaches", "canned pineapple", "fruit cocktail", "coconut milk",
        "olives", "pickles", "sauerkraut",
        "roasted red peppers", "artichoke hearts", "sun dried tomatoes", "capers",
        "condensed milk", "evaporated milk"
    ],
    "legumes": [
        "black beans", "kidney beans", "pinto beans", "white beans", "chickpeas", "lentils",
        "hummus", "tofu", "tempeh", "bean dip"
    ],
    "nuts_seeds": [
        "almonds", "walnuts", "pecans", "cashews", "pistachios", "peanuts",
        "sunflower seeds", "pumpkin seeds", "chia seeds",
        "peanut butter", "almond butter", "nutella"
    ],
    "condiments_sauces": [
        "ketchup", "mustard", "mayonnaise",
        "hot sauce", "sriracha",
        "soy sauce", "teriyaki sauce", "hoisin sauce",
        "bbq sauce", "salsa", "guacamole", "salsa verde", "queso",
        "ranch dressing", "vinaigrette", "caesar dressing",
        "marinara sauce", "alfredo sauce", "pesto",
        "vinegar", "olive oil", "vegetable oil",
        "relish", "tartar sauce", "cocktail sauce", "horseradish", "worcestershire sauce"
    ],
    "sweeteners_spreads": [
        "sugar", "brown sugar", "powdered sugar",
        "honey", "maple syrup", "molasses",
        "jam", "jelly", "marmalade",
        "chocolate syrup", "caramel sauce"
    ],
    "beverages": [
        "water bottle", "sparkling water", "coconut water",
        "orange juice", "apple juice", "lemonade", "grape juice", "cranberry juice",
        "coffee cup", "coffee beans", "tea bag", "iced tea", "hot chocolate",
        "cola", "sprite", "ginger ale", "root beer", "dr pepper", "mountain dew",
        "energy drink", "gatorade", "vitamin water",
        "milk carton", "chocolate milk", "milkshake",
        "beer bottle", "wine bottle", "champagne", "whiskey", "vodka",
        "smoothie", "protein shake", "juice box"
    ],
    "snacks": [
        "potato chips", "tortilla chips", "doritos", "popcorn",
        "pretzels", "crackers", "goldfish crackers", "rice cakes",
        "granola bar", "trail mix", "beef jerky", "cheese puffs",
        "chocolate bar", "m&ms", "skittles", "gummy bears",
        "oreos", "cookies",
        "fruit snacks", "applesauce cup", "pudding cup",
        "dried mango", "banana chips", "veggie straws", "cheez-its",
        "twix", "snickers", "kit kat", "reeses"
    ],
    "frozen": [
        "frozen pizza", "frozen vegetables",
        "french fries", "tater tots", "hash browns",
        "chicken nuggets", "fish sticks",
        "frozen dinner", "frozen burrito", "hot pockets",
        "ice cream", "popsicle", "ice cream sandwich",
        "frozen waffles", "frozen fruit", "frozen berries", "frozen pie",
        "dumplings", "spring rolls", "empanadas", "egg rolls"
    ],
    "convenience": [
        "mac and cheese box", "instant noodles", "cup noodles",
        "pizza", "microwave meal", "lunchables",
        "salad bag", "salad kit", "coleslaw", "soup cup",
        "egg bites", "burrito bowl", "sushi tray"
    ],
    "breakfast": [
        "pop tarts", "toaster strudel", "sandwich",
        "pancakes", "waffles", "french toast",
        "omelette", "scrambled eggs", "bacon strips",
        "breakfast burrito", "breakfast sandwich"
    ],
    "baking": [
        "vanilla extract", "baking powder", "yeast",
        "chocolate chips", "cocoa powder",
        "cake mix", "pie crust",
        "frosting", "sprinkles"
    ],
    "international": [
        "sushi", "wasabi", "nori", "soy sauce bottle",
        "kimchi", "miso paste", "tofu block",
        "curry paste", "taco shells", "enchilada sauce", "refried beans",
        "falafel", "tzatziki", "pita chips",
        "rice paper", "wonton wrappers", "fortune cookie",
        "pad thai", "ramen bowl", "pho"
    ],
    "baby": [
        "baby food jar", "baby formula"
    ],
    "pet": [
        "dog food", "cat food"
    ],
    "generic": [
        "fruit", "vegetable", "salad", "herbs",
        "milk", "cheese", "butter", "yogurt", "cream",
        "egg",
        "meat", "chicken", "beef", "pork", "fish", "seafood",
        "bread", "bun", "roll",
        "rice", "pasta", "noodles", "grain", "cereal",
        "beans", "nuts",
        "sauce", "dressing", "condiment", "oil", "vinegar",
        "sugar", "honey", "syrup", "jam", "spread",
        "juice", "soda", "coffee", "tea", "water", "drink", "alcohol",
        "chips", "crackers", "cookies", "candy", "chocolate", "snack",
        "frozen food", "pizza", "ice cream",
        "soup", "broth", "canned food",
        "baking", "flour", "spices",
        "baby food", "pet food",
        "leftovers", "takeout container", "meal prep", "lunch box",
        "grocery bag", "food", "other food"
    ]
}


def get_curated_foods() -> list[dict]:
    """Get flattened curated food list."""
    foods = []
    for category, items in CURATED_FOODS.items():
        for item in items:
            foods.append({"name": item, "category": category})
    return foods


def fetch_foods_from_open_food_facts(limit: int = 1000) -> list[dict]:
    """
    Fetch popular food categories and items from Open Food Facts.
    Returns list of {name, category} dicts.
    """
    print("Fetching food categories from Open Food Facts...")

    foods = []

    # Get top categories
    categories_url = "https://world.openfoodfacts.org/categories.json"
    response = requests.get(categories_url)

    if response.status_code != 200:
        print(f"Failed to fetch categories: {response.status_code}")
        return []

    categories = response.json().get("tags", [])
    print(f"Found {len(categories)} categories")

    # Filter to food-related categories and get names
    food_categories = []
    for cat in categories[:200]:  # Top 200 categories
        name = cat.get("name", "")
        # Skip non-food categories
        if any(skip in name.lower() for skip in ["brand", "store", "country", "label", "packaging"]):
            continue
        if cat.get("products", 0) > 100:  # Only popular categories
            food_categories.append({
                "name": name,
                "id": cat.get("id", ""),
                "count": cat.get("products", 0)
            })

    print(f"Filtered to {len(food_categories)} food categories")

    # Now get individual food items from popular categories
    print("\nFetching individual food items...")

    # Also get ingredients which are more specific
    ingredients_url = "https://world.openfoodfacts.org/ingredients.json"
    response = requests.get(ingredients_url)

    if response.status_code == 200:
        ingredients = response.json().get("tags", [])
        for ing in ingredients[:500]:  # Top 500 ingredients
            name = ing.get("name", "")
            if name and len(name) > 2 and len(name) < 30:
                # Clean up the name
                name = name.strip().lower()
                if not any(skip in name for skip in ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "acid", "extract"]):
                    foods.append({
                        "name": name,
                        "category": "ingredient",
                        "count": ing.get("products", 0)
                    })

    # Add category names as foods too (they're often good food names)
    for cat in food_categories:
        name = cat["name"].strip().lower()
        if len(name) > 2 and len(name) < 25:
            foods.append({
                "name": name,
                "category": "category",
                "count": cat["count"]
            })

    # Remove duplicates and sort by popularity
    seen = set()
    unique_foods = []
    for food in sorted(foods, key=lambda x: x.get("count", 0), reverse=True):
        name = food["name"]
        if name not in seen:
            seen.add(name)
            unique_foods.append(food)

    # Limit to requested amount
    unique_foods = unique_foods[:limit]

    print(f"\nCollected {len(unique_foods)} unique food items")
    return unique_foods


def fetch_foods_from_spoonacular(api_key: str, limit: int = 1000) -> list[dict]:
    """
    Fetch ingredients from Spoonacular API.
    Requires API key from https://spoonacular.com/food-api
    """
    print("Fetching foods from Spoonacular...")

    foods = []

    # Search through alphabet to get variety
    for letter in "abcdefghijklmnopqrstuvwxyz":
        url = "https://api.spoonacular.com/food/ingredients/search"
        params = {
            "query": letter,
            "number": 100,
            "apiKey": api_key
        }

        response = requests.get(url, params=params)
        if response.status_code == 200:
            results = response.json().get("results", [])
            for item in results:
                foods.append({
                    "name": item.get("name", "").lower(),
                    "category": "ingredient",
                    "id": item.get("id")
                })

        time.sleep(0.1)  # Rate limiting

        if len(foods) >= limit:
            break

    # Remove duplicates
    seen = set()
    unique_foods = []
    for food in foods:
        if food["name"] not in seen:
            seen.add(food["name"])
            unique_foods.append(food)

    return unique_foods[:limit]


def generate_icon_openrouter(food_name: str, output_dir: Path, api_key: str) -> bool:
    """Generate a pixel art icon using OpenRouter + Gemini image generation."""

    # Sanitize filename
    safe_name = food_name.replace(" ", "_").replace("/", "_").lower()
    safe_name = "".join(c for c in safe_name if c.isalnum() or c == "_")
    output_path = output_dir / f"{safe_name}.png"

    # Skip if already exists
    if output_path.exists():
        print(f"  Skipping {food_name} (already exists)")
        return True

    try:
        # Use Gemini 2.0 Flash for image generation
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://nowaste-ai.web.app",
                "X-Title": "No Waste AI",
            },
            json={
                "model": "google/gemini-2.5-flash-image",
                "messages": [
                    {
                        "role": "user",
                        "content": f"""Generate a simple pixel art icon of "{food_name}".

Style:
- Cozy, warm pixel art style (32x32 pixels)
- Soft, friendly colors - not too saturated
- Warm cream/off-white background (#FAF9F6)
- Simple but charming - like a cozy indie game
- Slight hand-drawn imperfect feel
- Small subtle highlight to give it life
- NO face or expressions
- NO text

Color palette inspiration:
- Greens: soft sage (#A7F3D0), emerald (#059669)
- Warm accents: terracotta (#D97706), coral (#DC6B5A)
- Browns: warm brown (#92400E)

Make it look appetizing and friendly, like it belongs in a cozy kitchen app."""
                    }
                ],
            }
        )

        if response.status_code != 200:
            error_text = response.text[:300] if response.text else "No error message"
            print(f"  Failed: {food_name} (status {response.status_code}): {error_text}")
            return False

        data = response.json()

        # Check for image in response
        choices = data.get("choices", [])
        if not choices:
            print(f"  Failed: {food_name} (no choices)")
            return False

        message = choices[0].get("message", {})

        # Check for images array (Gemini format)
        images = message.get("images", [])
        if images:
            for img_obj in images:
                if img_obj.get("type") == "image_url":
                    img_url = img_obj.get("image_url", {}).get("url", "")
                    if img_url.startswith("data:image"):
                        # Extract base64 from data URL
                        b64_data = img_url.split(",")[1]
                        img_bytes = base64.b64decode(b64_data)
                        img = Image.open(BytesIO(img_bytes))
                        img = img.convert("RGBA")
                        img = img.resize((64, 64), Image.Resampling.NEAREST)
                        img.save(output_path, "PNG")
                        print(f"  Generated: {food_name}")
                        return True

        print(f"  Failed: {food_name} (no image in response)")
        return False

    except Exception as e:
        print(f"  Error: {food_name} - {e}")
        return False


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Generate pixel art food icons")
    parser.add_argument("--fetch-foods", action="store_true",
                       help="Fetch food list from Open Food Facts API")
    parser.add_argument("--curated", action="store_true",
                       help="Use curated food list instead of API")
    parser.add_argument("--generate", action="store_true",
                       help="Generate icons for foods in foods.json")
    parser.add_argument("--limit", type=int, default=1000,
                       help="Limit number of foods to fetch/generate")
    parser.add_argument("--output", type=str, default=None,
                       help="Output directory for icons")
    parser.add_argument("--spoonacular-key", type=str, default=None,
                       help="Spoonacular API key (optional, uses Open Food Facts by default)")

    args = parser.parse_args()

    output_dir = Path(args.output) if args.output else ICONS_DIR

    if args.curated:
        # Use curated food list
        foods = get_curated_foods()

        # Save to file
        with open(FOODS_FILE, "w") as f:
            json.dump(foods, f, indent=2)

        print(f"Saved {len(foods)} curated foods to {FOODS_FILE}")
        print("\nCategories:")
        for cat, items in CURATED_FOODS.items():
            print(f"  {cat}: {len(items)} items")
        return

    if args.fetch_foods:
        # Fetch foods from API
        if args.spoonacular_key:
            foods = fetch_foods_from_spoonacular(args.spoonacular_key, args.limit)
        else:
            foods = fetch_foods_from_open_food_facts(args.limit)

        # Save to file
        with open(FOODS_FILE, "w") as f:
            json.dump(foods, f, indent=2)

        print(f"\nSaved {len(foods)} foods to {FOODS_FILE}")
        print("\nSample foods:")
        for food in foods[:20]:
            print(f"  - {food['name']}")

        return

    if args.generate:
        # Load foods from file
        if not FOODS_FILE.exists():
            print(f"Error: {FOODS_FILE} not found. Run with --fetch-foods first.")
            return

        with open(FOODS_FILE) as f:
            foods = json.load(f)

        # Get API key
        api_key = os.environ.get("OPENROUTER_API_KEY")
        if not api_key:
            print("Error: OPENROUTER_API_KEY environment variable not set")
            return

        # Create output directory
        output_dir.mkdir(parents=True, exist_ok=True)

        print(f"Generating icons for {min(len(foods), args.limit)} foods...")
        print(f"Output directory: {output_dir}\n")

        success = 0
        failed = 0

        for i, food in enumerate(foods[:args.limit], 1):
            name = food["name"] if isinstance(food, dict) else food
            print(f"[{i}/{min(len(foods), args.limit)}] {name}")

            if generate_icon_openrouter(name, output_dir, api_key):
                success += 1
            else:
                failed += 1

            time.sleep(1)  # Rate limiting

        print(f"\n{'='*50}")
        print(f"Complete! {success} generated, {failed} failed")
        print(f"Icons saved to: {output_dir}")

        return

    # Default: show help
    parser.print_help()
    print("\n\nExample usage:")
    print("  1. First fetch food list:")
    print("     python generate_food_icons.py --fetch-foods --limit 1000")
    print("")
    print("  2. Then generate icons:")
    print("     export OPENROUTER_API_KEY='your_key'")
    print("     python generate_food_icons.py --generate --limit 100")


if __name__ == "__main__":
    main()
