import { useEffect, useState } from "react";

/**
 * useLocalStorageState
 * - Persists a value to localStorage under `key`
 * - Safely handles invalid JSON + missing localStorage
 *
 * @param {string} key
 * @param {any} initialValue
 * @returns {[any, Function]} [value, setValue]
 */
export function useLocalStorageState(key, initialValue) {
  const read = () => {
    try {
      if (typeof window === "undefined") return initialValue;
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initialValue;
      return JSON.parse(raw);
    } catch {
      return initialValue;
    }
  };

  const [value, setValue] = useState(read);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore write errors (private mode / quota / etc.)
    }
  }, [key, value]);

  return [value, setValue];
}
