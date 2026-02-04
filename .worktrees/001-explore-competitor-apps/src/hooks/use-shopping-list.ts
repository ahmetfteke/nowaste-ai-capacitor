"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  subscribeShoppingListItems,
  createShoppingListItem,
  updateShoppingListItem,
  deleteShoppingListItem,
  clearCheckedShoppingListItems,
} from "@/lib/firestore";
import type { ShoppingListItem } from "@/types";

export function useShoppingList() {
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeShoppingListItems(user.uid, (shoppingItems) => {
      setItems(shoppingItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addItem = async (
    data: Omit<ShoppingListItem, "id" | "userId" | "createdAt">
  ) => {
    if (!user) throw new Error("Not authenticated");
    try {
      await createShoppingListItem(user.uid, data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to add item"));
      throw err;
    }
  };

  const updateItem = async (
    id: string,
    data: Partial<Omit<ShoppingListItem, "id" | "userId">>
  ) => {
    try {
      await updateShoppingListItem(id, data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to update item"));
      throw err;
    }
  };

  const toggleChecked = async (id: string, checked: boolean) => {
    try {
      await updateShoppingListItem(id, { checked });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to toggle item"));
      throw err;
    }
  };

  const removeItem = async (id: string) => {
    if (!user) throw new Error("Not authenticated");
    try {
      await deleteShoppingListItem(id, user.uid);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to delete item"));
      throw err;
    }
  };

  const clearChecked = async () => {
    if (!user) throw new Error("Not authenticated");
    try {
      await clearCheckedShoppingListItems(user.uid);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to clear checked items"));
      throw err;
    }
  };

  // Separate checked and unchecked items
  const uncheckedItems = items.filter((item) => !item.checked);
  const checkedItems = items.filter((item) => item.checked);

  return {
    items,
    uncheckedItems,
    checkedItems,
    loading,
    error,
    addItem,
    updateItem,
    toggleChecked,
    removeItem,
    clearChecked,
  };
}
