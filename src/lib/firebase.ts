import { initializeApp, getApps } from "firebase/app";
import { Capacitor } from "@capacitor/core";
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
  : getAuth(app);
function getDb() {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache(),
    });
  } catch {
    return getFirestore(app);
  }
}

export const db = getDb();

// Auth providers
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider("apple.com");

appleProvider.addScope("email");
appleProvider.addScope("name");
