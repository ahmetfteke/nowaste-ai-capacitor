"use client";

import { DEFAULT_STORAGE_SPACES } from "@/types";

// Storage spaces are predefined - no need to fetch from Firestore
export function useStorageSpaces() {
  return {
    spaces: DEFAULT_STORAGE_SPACES,
    loading: false,
    error: null,
  };
}
