// src/hooks/useEntitlements.js
import { useLocalStorageState } from "./useLocalStorageState";

/**
 * Temporary entitlements (learning + dev).
 * Later: replace with Clerk + backend response.
 */
export function useEntitlements() {
  // Dev-only toggle (persisted). Default false.
  const [isPro, setIsPro] = useLocalStorageState("dev:isPro", false);

  return { isPro, setIsPro };
}
