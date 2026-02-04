"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChefHat,
  Sparkles,
  Clock,
  Users,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRecipes } from "@/hooks/use-recipes";
import { useFoodItems } from "@/hooks/use-food-items";
import type { Recipe, RecipePreferences, CuisineType, DietaryRestriction } from "@/types";

const CUISINES: { value: CuisineType; label: string }[] = [
  { value: "any", label: "Any Cuisine" },
  { value: "american", label: "American" },
  { value: "italian", label: "Italian" },
  { value: "mexican", label: "Mexican" },
  { value: "chinese", label: "Chinese" },
  { value: "japanese", label: "Japanese" },
  { value: "indian", label: "Indian" },
  { value: "thai", label: "Thai" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "french", label: "French" },
  { value: "korean", label: "Korean" },
  { value: "vietnamese", label: "Vietnamese" },
];

const DIETARY_OPTIONS: { value: DietaryRestriction; label: string }[] = [
  { value: "none", label: "No Restrictions" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "dairy-free", label: "Dairy-Free" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
];

const DEFAULT_PREFERENCES: RecipePreferences = {
  cuisines: ["any"],
  dietaryRestrictions: ["none"],
  servings: 2,
  maxCookTime: 0,
  skillLevel: "easy",
};

export default function RecipesPage() {
  const router = useRouter();
  const { recipes, usageCount, usageLimit, loading, generating, error, generateRecipesFromInventory, removeRecipe } = useRecipes();
  const { items: inventoryItems } = useFoodItems();
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<RecipePreferences>(DEFAULT_PREFERENCES);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (inventoryItems.length === 0) return;

    try {
      await generateRecipesFromInventory(inventoryItems, preferences);
    } catch {
      // Error is handled by the hook
    }
  };

  const remainingGenerations = usageLimit - usageCount;
  const canGenerate = remainingGenerations > 0 && inventoryItems.length > 0 && !generating;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading recipes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-4">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">AI Recipes</h1>
              <p className="text-sm text-muted-foreground">
                {remainingGenerations}/{usageLimit} generations left this month
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowPreferences(true)}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Generate Button */}
          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Recipes from Inventory
              </>
            )}
          </Button>

          {inventoryItems.length === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Add items to your inventory first
            </p>
          )}

          {remainingGenerations === 0 && (
            <p className="text-xs text-destructive text-center mt-2">
              Monthly limit reached. Upgrade for unlimited recipes.
            </p>
          )}

          {error && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Recipes List */}
      <div className="px-5 space-y-4">
        <div className="max-w-md mx-auto">
          {recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ChefHat className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                No Recipes Yet
              </h2>
              <p className="text-muted-foreground max-w-sm">
                Generate personalized recipes based on the ingredients in your inventory.
              </p>
            </div>
          ) : (
            recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isExpanded={expandedRecipe === recipe.id}
                onToggle={() =>
                  setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)
                }
                onDelete={() => removeRecipe(recipe.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Preferences Drawer */}
      <PreferencesDrawer
        open={showPreferences}
        preferences={preferences}
        onClose={() => setShowPreferences(false)}
        onSave={setPreferences}
      />
    </div>
  );
}

function RecipeCard({
  recipe,
  isExpanded,
  onToggle,
  onDelete,
}: {
  recipe: Recipe;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const difficultyColors = {
    easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{recipe.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {recipe.description}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{recipe.cookTime} min</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span>{recipe.servings} servings</span>
              </div>
              <Badge variant="secondary" className={difficultyColors[recipe.difficulty]}>
                {recipe.difficulty}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border">
            {/* Ingredients */}
            <div className="mb-4">
              <h4 className="font-medium text-foreground mb-2">Ingredients</h4>
              <ul className="space-y-1">
                {recipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        ing.fromInventory ? "bg-primary" : "bg-muted-foreground"
                      }`}
                    />
                    <span>
                      {ing.quantity} {ing.name}
                      {ing.fromInventory && (
                        <span className="text-xs text-primary ml-1">(in inventory)</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="mb-4">
              <h4 className="font-medium text-foreground mb-2">Instructions</h4>
              <ol className="space-y-2">
                {recipe.instructions.map((step, idx) => (
                  <li key={idx} className="text-sm flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            {recipe.tips && (
              <div className="mb-4 p-3 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Tip: </span>
                  {recipe.tips}
                </p>
              </div>
            )}

            {/* Delete Button */}
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Recipe
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function PreferencesDrawer({
  open,
  preferences,
  onClose,
  onSave,
}: {
  open: boolean;
  preferences: RecipePreferences;
  onClose: () => void;
  onSave: (prefs: RecipePreferences) => void;
}) {
  const [localPrefs, setLocalPrefs] = useState(preferences);

  const handleSave = () => {
    onSave(localPrefs);
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Recipe Preferences</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 space-y-4">
          {/* Cuisine */}
          <div className="space-y-2">
            <Label>Preferred Cuisine</Label>
            <Select
              value={localPrefs.cuisines[0]}
              onValueChange={(v) =>
                setLocalPrefs({ ...localPrefs, cuisines: [v as CuisineType] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUISINES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dietary Restrictions */}
          <div className="space-y-2">
            <Label>Dietary Restrictions</Label>
            <Select
              value={localPrefs.dietaryRestrictions[0]}
              onValueChange={(v) =>
                setLocalPrefs({
                  ...localPrefs,
                  dietaryRestrictions: [v as DietaryRestriction],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIETARY_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Servings */}
          <div className="space-y-2">
            <Label>Servings</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={localPrefs.servings}
              onChange={(e) =>
                setLocalPrefs({ ...localPrefs, servings: parseInt(e.target.value) || 2 })
              }
            />
          </div>

          {/* Max Cook Time */}
          <div className="space-y-2">
            <Label>Max Cook Time (minutes)</Label>
            <Select
              value={String(localPrefs.maxCookTime)}
              onValueChange={(v) =>
                setLocalPrefs({ ...localPrefs, maxCookTime: parseInt(v) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No limit</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Skill Level */}
          <div className="space-y-2">
            <Label>Skill Level</Label>
            <Select
              value={localPrefs.skillLevel}
              onValueChange={(v) =>
                setLocalPrefs({
                  ...localPrefs,
                  skillLevel: v as "easy" | "medium" | "advanced",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DrawerFooter>
          <Button className="w-full" onClick={handleSave}>
            Save Preferences
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
