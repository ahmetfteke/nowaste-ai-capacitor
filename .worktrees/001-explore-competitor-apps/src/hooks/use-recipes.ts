"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  subscribeRecipes,
  subscribeRecipeUsage,
  createRecipe,
  deleteRecipe,
} from "@/lib/firestore";
import { auth } from "@/lib/firebase";
import type { Recipe, RecipePreferences, FoodItem } from "@/types";

// Firebase Functions URL
const GENERATE_RECIPES_URL = process.env.NEXT_PUBLIC_GENERATE_RECIPES_URL ||
  "https://us-central1-nowaste-ai.cloudfunctions.net/generateRecipes";

const FREE_TIER_LIMIT = 10;

export function useRecipes() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [usageCount, setUsageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setRecipes([]);
      setUsageCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubRecipes = subscribeRecipes(user.uid, (items) => {
      setRecipes(items);
      setLoading(false);
    });

    const unsubUsage = subscribeRecipeUsage(user.uid, (count) => {
      setUsageCount(count);
    });

    return () => {
      unsubRecipes();
      unsubUsage();
    };
  }, [user]);

  const generateRecipesFromInventory = async (
    inventory: FoodItem[],
    preferences: RecipePreferences
  ): Promise<Recipe[]> => {
    if (!user) throw new Error("Must be logged in");

    setGenerating(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Failed to get auth token");

      const response = await fetch(GENERATE_RECIPES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inventory: inventory.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            expirationDate: item.expirationDate,
          })),
          preferences,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          throw new Error(errorData.message || "Monthly limit reached");
        }
        throw new Error(errorData.error || "Failed to generate recipes");
      }

      const data = await response.json();
      const generatedRecipes = data.recipes || [];

      // Save recipes to Firestore
      for (const recipe of generatedRecipes) {
        await createRecipe(user.uid, recipe);
      }

      return generatedRecipes;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate recipes";
      setError(message);
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  const removeRecipe = async (id: string) => {
    await deleteRecipe(id);
  };

  return {
    recipes,
    usageCount,
    usageLimit: FREE_TIER_LIMIT,
    loading,
    generating,
    error,
    generateRecipesFromInventory,
    removeRecipe,
  };
}
