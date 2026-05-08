import { useCallback, useState } from "react";

const STORAGE_KEY = "campcastFreeRecommendationDate";

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export function useFreeRecommendation() {
  const [hasFreeUsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === getTodayString();
    } catch {
      return false;
    }
  });

  const markFreeUsed = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, getTodayString());
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  return { hasFreeUsed, markFreeUsed };
}
