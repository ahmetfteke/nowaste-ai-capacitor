"use client";

import { useEffect } from "react";

export function PWAElements() {
  useEffect(() => {
    // Only load on client side
    if (typeof window !== "undefined") {
      import("@ionic/pwa-elements/loader").then((pwaElements) => {
        pwaElements.defineCustomElements(window);
      });
    }
  }, []);

  return null;
}
