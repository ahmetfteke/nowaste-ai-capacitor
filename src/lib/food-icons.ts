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

/**
 * All available food icon names (without .png extension)
 */
export const FOOD_ICON_NAMES: string[] = [
  "acai","alcohol","alfredo_sauce","almond","almond_butter","almond_milk","almonds",
  "apple","apple_juice","applesauce_cup","apricot","artichoke","artichoke_hearts",
  "arugula","asparagus","avocado","baby_food","baby_food_jar","baby_formula","bacon",
  "bacon_strips","bagel","baguette","baking","baking_powder","banana","banana_chips",
  "barley","basil","bass","bay_leaf","bbq_sauce","bean_dip","bean_sprouts","beans",
  "beef","beef_broth","beef_jerky","beef_ribs","beef_roast","beer","beer_bottle","beet",
  "bell_pepper","biscuit","black_beans","black_pepper","blackberry","blue_cheese",
  "blueberry","bok_choy","bread","bread_loaf","breadsticks","breakfast_burrito",
  "breakfast_sandwich","brie","brioche","brisket","broccoli","broth","brown_rice",
  "brown_sugar","brussels_sprouts","bun","burrito","burrito_bowl","butter",
  "butternut_squash","cabbage","caesar_dressing","cake","cake_mix","candy",
  "canned_beans","canned_corn","canned_food","canned_peaches","canned_pineapple",
  "canned_soup","canned_tomatoes","canned_tuna","cantaloupe","capers","caramel_sauce",
  "carrot","cashew","cashews","cat_food","cauliflower","celery","cereal","cereal_box",
  "champagne","chard","cheddar","cheddar_cheese","cheerios","cheese","cheese_puffs",
  "cheese_slices","cheezits","cherry","cherry_tomato","chia_seeds","chicken",
  "chicken_breast","chicken_broth","chicken_nuggets","chicken_thigh","chicken_wing",
  "chickpeas","chips","chives","chocolate","chocolate_bar","chocolate_chips",
  "chocolate_milk","chocolate_syrup","ciabatta","cilantro","cinnamon_roll",
  "cinnamon_stick","clam","cocktail_sauce","cocoa_powder","coconut","coconut_milk",
  "coconut_water","cod","coffee","coffee_beans","coffee_creamer","coffee_cup","cola",
  "coleslaw","condensed_milk","cookie","cookies","cool_whip","corn","corn_flakes",
  "cornbread","cornmeal","cottage_cheese","couscous","crab","crackers","cranberry",
  "cranberry_juice","cream","cream_cheese","croissant","cucumber","cup_noodles","curry",
  "curry_paste","dates","deli_meat","dill","dinner_roll","dog_food","donut","doritos",
  "dr_pepper","dragon_fruit","dressing","dried_mango","drink","duck","dumplings",
  "edamame","egg","egg_bites","egg_rolls","eggplant","empanadas","enchilada_sauce",
  "energy_drink","english_muffin","evaporated_milk","falafel","fennel","feta","fig",
  "fish","fish_fillet","fish_sticks","flatbread","flour","flour_bag","food",
  "fortune_cookie","french_fries","french_toast","frosting","frozen_berries",
  "frozen_burrito","frozen_dinner","frozen_food","frozen_fruit","frozen_pie",
  "frozen_pizza","frozen_vegetables","frozen_waffles","fruit","fruit_cocktail",
  "fruit_snacks","garlic","gatorade","ginger","ginger_ale","goat_cheese",
  "goldfish_crackers","gouda","grain","granola","granola_bar","grape","grape_juice",
  "grapefruit","greek_yogurt","green_beans","green_onion","grocery_bag","ground_beef",
  "guacamole","guava","gummy_bears","habanero","half_and_half","halibut","ham",
  "hamburger_bun","hard_boiled_egg","hash_browns","hazelnut","herbs","hoisin_sauce",
  "honey","honeydew","horseradish","hot_chocolate","hot_dog","hot_dog_bun",
  "hot_pockets","hot_sauce","hummus","ice_cream","ice_cream_sandwich","iced_tea",
  "instant_noodles","jackfruit","jalapeno","jam","jelly","juice","juice_box","kale",
  "ketchup","kidney_beans","kimchi","kit_kat","kiwi","lamb","lamb_chop","lasagna",
  "leek","leftovers","lemon","lemonade","lemongrass","lentils","lettuce","lime",
  "lobster","lunch_box","lunchables","lychee","mac_and_cheese_box","macaroni",
  "mackerel","mango","maple_syrup","marinara_sauce","marmalade","mayonnaise",
  "meal_prep","meatballs","milk","milk_carton","milkshake","mint","miso_paste","mms",
  "molasses","mountain_dew","mozzarella","muffin","mushroom","mussel","mustard","naan",
  "nectarine","noodles","nori","nutella","nuts","oat_milk","oatmeal","oats","octopus",
  "oil","okra","olive","olive_oil","olives","omelette","onion","orange","orange_juice",
  "oregano","oreos","other_food","oyster","pad_thai","pancake","pancake_mix","pancakes",
  "papaya","parmesan","parsley","parsnip","passion_fruit","pasta","peach",
  "peanut","peanut_butter","peanuts","pear","peas","pecan","pecans","penne",
  "pepperoni","persimmon","pesto","pet_food","pho","pickles","pie","pie_crust",
  "pineapple","pinto_beans","pistachio","pistachios","pita","pita_bread","pita_chips",
  "pizza","plantain","plum","pomegranate","pop_tarts","popcorn","popsicle","pork",
  "pork_belly","pork_chop","pork_roast","portobello","potato","potato_chips",
  "powdered_sugar","pretzel","pretzels","prosciutto","protein_shake","pudding_cup",
  "pumpkin","pumpkin_seeds","quail_egg","queso","quinoa","radish","raisins","ramen",
  "ramen_bowl","ranch_dressing","raspberry","ravioli","reeses","refried_beans","relish",
  "ribs","rice","rice_cakes","rice_paper","ricotta","roasted_red_peppers","roll",
  "roma_tomato","root_beer","rosemary","rotisserie_chicken","sage","salad","salad_bag",
  "salad_kit","salami","salmon","salsa","salsa_verde","salt","sandwich","sardine",
  "sauce","sauerkraut","sausage","scallop","scrambled_eggs","seafood","shallot",
  "shiitake","shredded_cheese","shrimp","skittles","smoked_salmon","smoothie","snack",
  "snap_peas","snickers","soda","soup","soup_cup","sour_cream","sourdough","soy_sauce",
  "soy_sauce_bottle","spaghetti","spaghetti_squash","sparkling_water","spices",
  "spinach","spread","spring_rolls","sprinkles","sprite","squash","squid","sriracha",
  "starfruit","steak","strawberry","string_cheese","sugar","sun_dried_tomatoes",
  "sunflower_seeds","sushi","sushi_tray","sweet_potato","syrup","taco","taco_shells",
  "takeout_container","tangerine","tarragon","tartar_sauce","tater_tots","tea","tea_bag",
  "tempeh","teriyaki_sauce","thyme","tilapia","toaster_strudel","tofu","tofu_block",
  "tomato","tomato_paste","tomato_sauce","tortellini","tortilla","tortilla_chips",
  "trail_mix","trout","tuna","turkey","turnip","twix","tzatziki","udon","vanilla_bean",
  "vanilla_extract","veal","vegetable","vegetable_oil","veggie_straws","vinaigrette",
  "vinegar","vitamin_water","vodka","waffle","waffles","walnut","walnuts","wasabi",
  "water","water_bottle","watermelon","wheat_bread","whipped_cream","whiskey",
  "white_beans","white_bread","whole_chicken","wine","wine_bottle","wonton_wrappers",
  "worcestershire_sauce","yeast","yogurt","yukon_gold_potato","zucchini",
];

const FOOD_ICON_SET = new Set(FOOD_ICON_NAMES);

/**
 * Match a food item name to the best icon filename.
 * Tries: exact normalized match, without trailing "s", without trailing "es",
 * then individual words from the name.
 * Returns the icon name (without extension) or undefined.
 */
export function matchIconByName(itemName: string): string | undefined {
  const normalized = normalizeName(itemName);
  if (!normalized) return undefined;

  // Exact match
  if (FOOD_ICON_SET.has(normalized)) return normalized;

  // Without trailing "s"
  if (normalized.endsWith("s") && normalized.length > 2) {
    const withoutS = normalized.slice(0, -1);
    if (FOOD_ICON_SET.has(withoutS)) return withoutS;
  }

  // Without trailing "es"
  if (normalized.endsWith("es") && normalized.length > 3) {
    const withoutEs = normalized.slice(0, -2);
    if (FOOD_ICON_SET.has(withoutEs)) return withoutEs;
  }

  // Try individual words (longest first for better matches)
  const words = normalized.split("_").filter(w => w.length > 2);
  words.sort((a, b) => b.length - a.length);
  for (const word of words) {
    if (FOOD_ICON_SET.has(word)) return word;
  }

  return undefined;
}
