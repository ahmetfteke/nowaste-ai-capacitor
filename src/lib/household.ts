import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Household, HouseholdMember, HouseholdRole } from "@/types";

export const householdsCollection = collection(db, "households");

// Generate a random 6-character uppercase alphanumeric share code
export function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude ambiguous chars (0/O, 1/I)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createHousehold(
  userId: string,
  displayName: string,
  email: string,
  name?: string
): Promise<string> {
  const householdRef = doc(householdsCollection);
  const householdId = householdRef.id;
  const now = new Date().toISOString();

  const member: HouseholdMember = {
    uid: userId,
    displayName: displayName || "User",
    email: email || "",
    role: "owner",
    joinedAt: now,
  };

  const household: Omit<Household, "id"> = {
    name: name || `${displayName || "My"}'s Household`,
    ownerId: userId,
    memberIds: [userId],
    roles: { [userId]: "owner" },
    members: [member],
    shareCode: generateShareCode(),
    foodItemCount: 0,
    shoppingListItemCount: 0,
    createdAt: now,
  };

  const batch = writeBatch(db);
  batch.set(householdRef, household);
  batch.update(doc(db, "users", userId), { householdId });
  await batch.commit();

  return householdId;
}

export function subscribeHousehold(
  householdId: string,
  callback: (household: Household | null) => void
): () => void {
  const householdRef = doc(householdsCollection, householdId);
  return onSnapshot(householdRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as Household);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`[subscribeHousehold] Permission error (householdId=${householdId}):`, error);
  });
}

export async function getHouseholdByShareCode(
  code: string
): Promise<Household | null> {
  const q = query(
    householdsCollection,
    where("shareCode", "==", code.toUpperCase())
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Household;
}

export async function updateHouseholdName(
  householdId: string,
  name: string
): Promise<void> {
  const householdRef = doc(householdsCollection, householdId);
  await updateDoc(householdRef, { name });
}

export async function regenerateShareCode(
  householdId: string
): Promise<string> {
  const newCode = generateShareCode();
  const householdRef = doc(householdsCollection, householdId);
  await updateDoc(householdRef, { shareCode: newCode });
  return newCode;
}

export async function getHousehold(
  householdId: string
): Promise<Household | null> {
  const householdRef = doc(householdsCollection, householdId);
  const snapshot = await getDoc(householdRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Household;
}
