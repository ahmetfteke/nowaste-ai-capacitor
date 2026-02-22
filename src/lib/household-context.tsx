"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./auth-context";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  createHousehold,
  subscribeHousehold,
} from "./household";
import type { Household, HouseholdRole, HouseholdMember } from "@/types";

interface HouseholdContextType {
  householdId: string | null;
  household: Household | null;
  userRole: HouseholdRole | null;
  isOwner: boolean;
  canEdit: boolean; // owner or member (not viewer)
  loading: boolean;
  members: HouseholdMember[];
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(
  undefined
);

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);

  // Listen to user doc for householdId
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setHouseholdId(null);
      setHousehold(null);
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setLoading(false);
        return;
      }

      const data = snapshot.data();
      const existingHouseholdId = data?.householdId;

      if (existingHouseholdId) {
        setHouseholdId(existingHouseholdId);
        setLoading(false);
      } else if (!migrating) {
        // Auto-migrate: create solo household for existing user
        setMigrating(true);
        try {
          const newHouseholdId = await createHousehold(
            user.uid,
            user.displayName || "User",
            user.email || ""
          );
          // Backfill householdId on existing items
          await backfillHouseholdId(user.uid, newHouseholdId);
          setHouseholdId(newHouseholdId);
        } catch (error) {
          console.error("Failed to create household:", error);
        } finally {
          setMigrating(false);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [user, authLoading, migrating]);

  // Subscribe to household doc when householdId is available
  useEffect(() => {
    if (!householdId) {
      setHousehold(null);
      return;
    }

    const unsubscribe = subscribeHousehold(householdId, (h) => {
      setHousehold(h);
    });

    return () => unsubscribe();
  }, [householdId]);

  const userRole: HouseholdRole | null =
    user && household?.roles?.[user.uid] ? household.roles[user.uid] : null;

  const isOwner = userRole === "owner";
  const canEdit = userRole === "owner" || userRole === "member";
  const members = household?.members || [];

  return (
    <HouseholdContext.Provider
      value={{
        householdId,
        household,
        userRole,
        isOwner,
        canEdit,
        loading: loading || authLoading,
        members,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error("useHousehold must be used within a HouseholdProvider");
  }
  return context;
}

// Backfill householdId on existing items for a user
async function backfillHouseholdId(
  userId: string,
  householdId: string
): Promise<void> {
  const collectionsToBackfill = [
    "foodItems",
    "shoppingList",
    "alerts",
    "recipes",
    "storageSpaces",
  ];

  let totalFoodItems = 0;
  let totalShoppingItems = 0;

  for (const collectionName of collectionsToBackfill) {
    const q = query(
      collection(db, collectionName),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) continue;

    // Batch update in groups of 500 (Firestore limit)
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += 500) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + 500);
      for (const docSnap of chunk) {
        batch.update(docSnap.ref, { householdId });
      }
      await batch.commit();
    }

    if (collectionName === "foodItems") {
      // Count active items
      totalFoodItems = snapshot.docs.filter(
        (d) => d.data().status === "active"
      ).length;
    }
    if (collectionName === "shoppingList") {
      totalShoppingItems = snapshot.size;
    }
  }

  // Update household counters from user doc counts
  const userRef = doc(db, "users", userId);
  const householdRef = doc(db, "households", householdId);

  // Read current user doc to get accurate counts
  const userSnap = await getDocs(
    query(collection(db, "foodItems"), where("userId", "==", userId), where("status", "==", "active"))
  );
  const shoppingSnap = await getDocs(
    query(collection(db, "shoppingList"), where("userId", "==", userId))
  );

  await updateDoc(householdRef, {
    foodItemCount: userSnap.size,
    shoppingListItemCount: shoppingSnap.size,
  });
}
