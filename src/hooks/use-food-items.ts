"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  subscribeFoodItems,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  markFoodItemUsed,
} from "@/lib/firestore";
import type { FoodItem } from "@/types";
import { updateWidgetData } from "@/lib/widget-bridge";

export function useFoodItems() {
  const { user } = useAuth();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeFoodItems(user.uid, (foodItems) => {
      setItems(foodItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync widget data when items change
  useEffect(() => {
    if (items.length > 0) {
      updateWidgetData(items);
    }
  }, [items]);

  const addItem = async (
    data: Omit<FoodItem, "id" | "userId" | "addedAt" | "status"> & { iconBase64?: string }
  ) => {
    if (!user) throw new Error("Not authenticated");
    try {
      await createFoodItem(user.uid, { ...data, status: "active" });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to add item"));
      throw err;
    }
  };

  const editItem = async (
    id: string,
    data: Partial<Omit<FoodItem, "id" | "userId">>
  ) => {
    try {
      await updateFoodItem(id, data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to update item"));
      throw err;
    }
  };

  const removeItem = async (id: string) => {
    if (!user) throw new Error("Not authenticated");
    try {
      await deleteFoodItem(id, user.uid);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to delete item"));
      throw err;
    }
  };

  const markUsed = async (id: string) => {
    try {
      await markFoodItemUsed(id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to mark item as used"));
      throw err;
    }
  };

  // Group items by expiration status
  const groupedItems = {
    expired: items.filter((item) => new Date(item.expirationDate) < new Date()),
    expiringToday: items.filter((item) => {
      const expDate = new Date(item.expirationDate);
      const today = new Date();
      return (
        expDate.toDateString() === today.toDateString() &&
        expDate >= today
      );
    }),
    expiringSoon: items.filter((item) => {
      const expDate = new Date(item.expirationDate);
      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      return (
        expDate > today &&
        expDate <= threeDaysFromNow &&
        expDate.toDateString() !== today.toDateString()
      );
    }),
    fresh: items.filter((item) => {
      const expDate = new Date(item.expirationDate);
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      return expDate > threeDaysFromNow;
    }),
  };

  return {
    items,
    groupedItems,
    loading,
    error,
    addItem,
    editItem,
    removeItem,
    markUsed,
  };
}
