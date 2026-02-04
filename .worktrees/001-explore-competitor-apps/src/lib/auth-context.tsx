"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";
import { auth, googleProvider, appleProvider } from "./firebase";
import { createUserDocument, initializeDefaultStorageSpaces } from "./firestore";
import { DEFAULT_STORAGE_SPACES } from "@/types";

// Check if we're in a Capacitor native environment
const isCapacitor = typeof window !== "undefined" && !!(window as any).Capacitor;

// Get browser timezone
const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[Auth] Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("[Auth] Auth state changed:", user ? user.email : "no user");
      setUser(user);
      setLoading(false);
    });

    // Fallback timeout in case auth never fires
    const timeout = setTimeout(() => {
      console.log("[Auth] Timeout - forcing loading to false");
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Initialize new user with document and storage spaces
  const initializeNewUser = async (
    userId: string,
    email: string,
    displayName: string | null
  ) => {
    try {
      await Promise.all([
        createUserDocument(userId, {
          email,
          displayName,
          timezone: getBrowserTimezone(),
        }),
        initializeDefaultStorageSpaces(userId, DEFAULT_STORAGE_SPACES),
      ]);
    } catch (error) {
      console.error("Failed to initialize user data:", error);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log("[Auth] Starting signup for:", email);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log("[Auth] User created:", result.user.uid);
      await updateProfile(result.user, { displayName: name });
      console.log("[Auth] Profile updated");
      await initializeNewUser(result.user.uid, email, name);
      console.log("[Auth] User initialized");
    } catch (err) {
      console.error("[Auth] Signup error:", err);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    let result;

    if (isCapacitor) {
      // Use native Google Sign-In on mobile
      const { FirebaseAuthentication } = await import(
        "@capacitor-firebase/authentication"
      );
      const nativeResult = await FirebaseAuthentication.signInWithGoogle();

      // Get the ID token and create a credential
      const idToken = nativeResult.credential?.idToken;
      if (!idToken) {
        throw new Error("No ID token received from Google Sign-In");
      }

      const credential = GoogleAuthProvider.credential(idToken);
      result = await signInWithCredential(auth, credential);
    } else {
      // Use popup on web
      result = await signInWithPopup(auth, googleProvider);
    }

    // Check if this is a new user (first sign in)
    if (result.user.metadata.creationTime === result.user.metadata.lastSignInTime) {
      await initializeNewUser(
        result.user.uid,
        result.user.email || "",
        result.user.displayName
      );
    }
  };

  const signInWithApple = async () => {
    let result;

    if (isCapacitor) {
      // Use native Apple Sign-In on mobile
      const { FirebaseAuthentication } = await import(
        "@capacitor-firebase/authentication"
      );
      const nativeResult = await FirebaseAuthentication.signInWithApple();

      // Get the ID token and create a credential
      const idToken = nativeResult.credential?.idToken;
      const rawNonce = nativeResult.credential?.nonce;
      if (!idToken) {
        throw new Error("No ID token received from Apple Sign-In");
      }

      const provider = new OAuthProvider("apple.com");
      const credential = provider.credential({
        idToken,
        rawNonce,
      });
      result = await signInWithCredential(auth, credential);
    } else {
      // Use popup on web
      result = await signInWithPopup(auth, appleProvider);
    }

    // Check if this is a new user (first sign in)
    if (result.user.metadata.creationTime === result.user.metadata.lastSignInTime) {
      await initializeNewUser(
        result.user.uid,
        result.user.email || "",
        result.user.displayName
      );
    }
  };

  const signOut = async () => {
    // Logout from RevenueCat first
    if (isCapacitor) {
      try {
        const { Purchases } = await import("@revenuecat/purchases-capacitor");
        await Purchases.logOut();
        console.log("[RevenueCat] User logged out");
      } catch (err) {
        console.error("[RevenueCat] Failed to logout:", err);
      }
    }
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
