import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  runTransaction,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  FoodItem,
  StorageSpace,
  Alert,
  NotificationSettings,
  ShoppingListItem,
  Recipe,
  RecipePreferences,
  Suggestion,
  SuggestionComment,
  DEFAULT_STORAGE_SPACES,
} from "@/types";

// Collection references
export const usersCollection = collection(db, "users");
export const storageSpacesCollection = collection(db, "storageSpaces");
export const foodItemsCollection = collection(db, "foodItems");
export const alertsCollection = collection(db, "alerts");
export const notificationSettingsCollection = collection(db, "notificationSettings");
export const shoppingListCollection = collection(db, "shoppingList");
export const recipesCollection = collection(db, "recipes");
export const recipeUsageCollection = collection(db, "recipeUsage");
export const suggestionsCollection = collection(db, "suggestions");

// =============================================================================
// Users
// =============================================================================

export interface UserDocument {
  email: string;
  displayName: string | null;
  timezone: string;
  alertTime: "morning" | "afternoon" | "evening" | "off";
  unitSystem: "metric" | "imperial";
  foodItemCount: number;
  shoppingListItemCount: number;
  recipePreferences?: RecipePreferences;
  // Notification settings
  fcmToken?: string;
  reminderDays?: number[];
  createdAt: ReturnType<typeof serverTimestamp>;
  lastLoginAt: ReturnType<typeof serverTimestamp>;
}

export async function createUserDocument(
  userId: string,
  data: {
    email: string;
    displayName: string | null;
    timezone: string;
  }
): Promise<void> {
  const userRef = doc(usersCollection, userId);
  await setDoc(userRef, {
    email: data.email,
    displayName: data.displayName,
    timezone: data.timezone,
    alertTime: "morning",
    unitSystem: "metric",
    foodItemCount: 0,
    shoppingListItemCount: 0,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });
}

export async function updateUserDocument(
  userId: string,
  data: Partial<Omit<UserDocument, "createdAt">>
): Promise<void> {
  const userRef = doc(usersCollection, userId);
  // Use setDoc with merge to create if doesn't exist
  await setDoc(userRef, data, { merge: true });
}

export function subscribeUserDocument(
  userId: string,
  callback: (user: UserDocument | null) => void
): () => void {
  const userRef = doc(usersCollection, userId);
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as UserDocument);
    } else {
      callback(null);
    }
  });
}

// =============================================================================
// Storage Spaces
// =============================================================================

export async function createStorageSpace(
  userId: string,
  data: Omit<StorageSpace, "id" | "userId">
): Promise<string> {
  const docRef = await addDoc(storageSpacesCollection, {
    ...data,
    userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getStorageSpaces(userId: string): Promise<StorageSpace[]> {
  const q = query(storageSpacesCollection, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as StorageSpace[];
}

export async function initializeDefaultStorageSpaces(
  userId: string,
  defaults: typeof DEFAULT_STORAGE_SPACES
): Promise<void> {
  const batch = writeBatch(db);

  defaults.forEach((space) => {
    const docRef = doc(storageSpacesCollection);
    batch.set(docRef, {
      ...space,
      userId,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

// =============================================================================
// Food Items
// =============================================================================

export async function createFoodItem(
  userId: string,
  data: Omit<FoodItem, "id" | "userId" | "addedAt">
): Promise<string> {
  // Filter out undefined values - Firestore doesn't accept them
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );

  // Use a transaction to create the item and increment the counter
  const newDocRef = doc(foodItemsCollection);
  const userRef = doc(usersCollection, userId);

  await runTransaction(db, async (transaction) => {
    // Create the food item
    transaction.set(newDocRef, {
      ...cleanData,
      userId,
      addedAt: serverTimestamp(),
    });

    // Increment the user's food item count
    transaction.update(userRef, {
      foodItemCount: increment(1),
    });
  });

  return newDocRef.id;
}

export async function updateFoodItem(
  id: string,
  data: Partial<Omit<FoodItem, "id" | "userId">>
): Promise<void> {
  // Filter out undefined values - Firestore doesn't accept them
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );

  const docRef = doc(foodItemsCollection, id);
  await updateDoc(docRef, {
    ...cleanData,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFoodItem(id: string, userId: string): Promise<void> {
  const docRef = doc(foodItemsCollection, id);
  const userRef = doc(usersCollection, userId);

  await runTransaction(db, async (transaction) => {
    // Delete the food item
    transaction.delete(docRef);

    // Decrement the user's food item count
    transaction.update(userRef, {
      foodItemCount: increment(-1),
    });
  });
}

export async function markFoodItemUsed(id: string): Promise<void> {
  await updateFoodItem(id, { status: "used" });
}

export async function getFoodItems(userId: string): Promise<FoodItem[]> {
  const q = query(
    foodItemsCollection,
    where("userId", "==", userId),
    where("status", "==", "active"),
    orderBy("expirationDate", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      addedAt: data.addedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  }) as FoodItem[];
}

export function subscribeFoodItems(
  userId: string,
  callback: (items: FoodItem[]) => void
): () => void {
  const q = query(
    foodItemsCollection,
    where("userId", "==", userId),
    where("status", "==", "active"),
    orderBy("expirationDate", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        addedAt: data.addedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    }) as FoodItem[];
    callback(items);
  });
}

// =============================================================================
// Alerts
// =============================================================================

export async function createAlert(
  userId: string,
  data: Omit<Alert, "id" | "userId" | "sentAt">
): Promise<string> {
  const docRef = await addDoc(alertsCollection, {
    ...data,
    userId,
    sentAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateAlert(
  id: string,
  data: Partial<Omit<Alert, "id" | "userId">>
): Promise<void> {
  const docRef = doc(alertsCollection, id);
  await updateDoc(docRef, data);
}

export async function getAlerts(userId: string): Promise<Alert[]> {
  const q = query(
    alertsCollection,
    where("userId", "==", userId),
    orderBy("sentAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      sentAt: data.sentAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  }) as Alert[];
}

export function subscribeAlerts(
  userId: string,
  callback: (alerts: Alert[]) => void
): () => void {
  const q = query(
    alertsCollection,
    where("userId", "==", userId),
    orderBy("sentAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        sentAt: data.sentAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    }) as Alert[];
    callback(alerts);
  });
}

// =============================================================================
// Notification Settings
// =============================================================================

export async function getNotificationSettings(
  userId: string
): Promise<NotificationSettings | null> {
  // Use userId as document ID
  const docRef = doc(notificationSettingsCollection, userId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return {
    ...snapshot.data(),
    userId,
  } as NotificationSettings;
}

export async function updateNotificationSettings(
  userId: string,
  settings: Omit<NotificationSettings, "userId">
): Promise<void> {
  // Use userId as document ID
  const docRef = doc(notificationSettingsCollection, userId);
  await setDoc(docRef, {
    ...settings,
    userId,
  }, { merge: true });
}

export async function saveFcmToken(
  userId: string,
  fcmToken: string
): Promise<void> {
  // Use userId as document ID to prevent duplicates
  const docRef = doc(notificationSettingsCollection, userId);
  await setDoc(docRef, {
    userId,
    enabled: true,
    reminderDays: [1, 3, 7],
    fcmToken,
  }, { merge: true });
}

// =============================================================================
// Shopping List
// =============================================================================

export async function createShoppingListItem(
  userId: string,
  data: Omit<ShoppingListItem, "id" | "userId" | "createdAt">
): Promise<string> {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );

  // Use a transaction to create the item and increment the counter
  const newDocRef = doc(shoppingListCollection);
  const userRef = doc(usersCollection, userId);

  await runTransaction(db, async (transaction) => {
    transaction.set(newDocRef, {
      ...cleanData,
      userId,
      createdAt: serverTimestamp(),
    });

    transaction.update(userRef, {
      shoppingListItemCount: increment(1),
    });
  });

  return newDocRef.id;
}

export async function updateShoppingListItem(
  id: string,
  data: Partial<Omit<ShoppingListItem, "id" | "userId">>
): Promise<void> {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );

  const docRef = doc(shoppingListCollection, id);
  await updateDoc(docRef, cleanData);
}

export async function deleteShoppingListItem(id: string, userId: string): Promise<void> {
  const docRef = doc(shoppingListCollection, id);
  const userRef = doc(usersCollection, userId);

  await runTransaction(db, async (transaction) => {
    transaction.delete(docRef);
    transaction.update(userRef, {
      shoppingListItemCount: increment(-1),
    });
  });
}

export async function clearCheckedShoppingListItems(userId: string): Promise<void> {
  const q = query(
    shoppingListCollection,
    where("userId", "==", userId),
    where("checked", "==", true)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  const userRef = doc(usersCollection, userId);
  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  // Decrement the counter by the number of deleted items
  batch.update(userRef, {
    shoppingListItemCount: increment(-snapshot.size),
  });

  await batch.commit();
}

export function subscribeShoppingListItems(
  userId: string,
  callback: (items: ShoppingListItem[]) => void
): () => void {
  const q = query(
    shoppingListCollection,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    }) as ShoppingListItem[];
    callback(items);
  });
}

// =============================================================================
// Recipes
// =============================================================================

export async function createRecipe(
  userId: string,
  data: Omit<Recipe, "id" | "userId" | "createdAt">
): Promise<string> {
  const docRef = await addDoc(recipesCollection, {
    ...data,
    userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteRecipe(id: string): Promise<void> {
  const docRef = doc(recipesCollection, id);
  await deleteDoc(docRef);
}

export function subscribeRecipes(
  userId: string,
  callback: (recipes: Recipe[]) => void
): () => void {
  const q = query(
    recipesCollection,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const recipes = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    }) as Recipe[];
    callback(recipes);
  });
}

// =============================================================================
// Recipe Usage Tracking (for monthly limits)
// =============================================================================

export async function getRecipeUsageThisMonth(userId: string): Promise<number> {
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const q = query(
    recipeUsageCollection,
    where("userId", "==", userId),
    where("monthYear", "==", monthYear)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return 0;

  return snapshot.docs[0].data().count || 0;
}

export async function incrementRecipeUsage(userId: string): Promise<number> {
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const q = query(
    recipeUsageCollection,
    where("userId", "==", userId),
    where("monthYear", "==", monthYear)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // Create new usage record
    await addDoc(recipeUsageCollection, {
      userId,
      monthYear,
      count: 1,
    });
    return 1;
  } else {
    // Increment existing record
    const docRef = snapshot.docs[0].ref;
    const currentCount = snapshot.docs[0].data().count || 0;
    const newCount = currentCount + 1;
    await updateDoc(docRef, { count: newCount });
    return newCount;
  }
}

export function subscribeRecipeUsage(
  userId: string,
  callback: (count: number) => void
): () => void {
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const q = query(
    recipeUsageCollection,
    where("userId", "==", userId),
    where("monthYear", "==", monthYear)
  );

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(0);
    } else {
      callback(snapshot.docs[0].data().count || 0);
    }
  });
}

// =============================================================================
// Community Suggestions (Feedback System)
// =============================================================================

function getInitials(name: string): string {
  if (!name || !name.trim()) return "??";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export async function createSuggestion(
  userId: string,
  displayName: string,
  data: { title: string; description: string }
): Promise<string> {
  const docRef = await addDoc(suggestionsCollection, {
    title: data.title,
    description: data.description,
    userId,
    userInitials: getInitials(displayName),
    upvotes: 1,
    upvoters: [userId], // Auto-upvote own suggestion
    commentCount: 0,
    reviewStatus: "pending", // Requires admin approval before visible
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function toggleUpvote(
  suggestionId: string,
  userId: string
): Promise<void> {
  const suggestionRef = doc(suggestionsCollection, suggestionId);
  const suggestionDoc = await getDoc(suggestionRef);

  if (!suggestionDoc.exists()) return;

  const data = suggestionDoc.data();
  const hasVoted = data.upvoters?.includes(userId) || false;

  await updateDoc(suggestionRef, {
    upvotes: hasVoted ? increment(-1) : increment(1),
    upvoters: hasVoted ? arrayRemove(userId) : arrayUnion(userId),
  });
}

export async function deleteSuggestion(id: string): Promise<void> {
  const docRef = doc(suggestionsCollection, id);
  await deleteDoc(docRef);
}

export function subscribeSuggestions(
  callback: (suggestions: Suggestion[]) => void
): () => void {
  // Only show approved suggestions to users
  const q = query(
    suggestionsCollection,
    where("reviewStatus", "==", "approved"),
    orderBy("upvotes", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const suggestions = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    }) as Suggestion[];
    callback(suggestions);
  });
}

// =============================================================================
// Suggestion Comments (Subcollection)
// =============================================================================

export async function createComment(
  suggestionId: string,
  userId: string,
  displayName: string,
  text: string
): Promise<string> {
  const suggestionRef = doc(suggestionsCollection, suggestionId);
  const commentsCollection = collection(suggestionRef, "comments");

  // Use transaction to add comment and increment count
  const newCommentRef = doc(commentsCollection);

  await runTransaction(db, async (transaction) => {
    transaction.set(newCommentRef, {
      text,
      userId,
      userInitials: getInitials(displayName),
      createdAt: serverTimestamp(),
    });

    transaction.update(suggestionRef, {
      commentCount: increment(1),
    });
  });

  return newCommentRef.id;
}

export async function deleteComment(
  suggestionId: string,
  commentId: string
): Promise<void> {
  const suggestionRef = doc(suggestionsCollection, suggestionId);
  const commentRef = doc(suggestionRef, "comments", commentId);

  await runTransaction(db, async (transaction) => {
    transaction.delete(commentRef);
    transaction.update(suggestionRef, {
      commentCount: increment(-1),
    });
  });
}

export function subscribeComments(
  suggestionId: string,
  callback: (comments: SuggestionComment[]) => void
): () => void {
  const suggestionRef = doc(suggestionsCollection, suggestionId);
  const commentsCollection = collection(suggestionRef, "comments");
  const q = query(commentsCollection, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    }) as SuggestionComment[];
    callback(comments);
  });
}

