import { useCallback, useState } from "react";

const SESSION_KEY = "campcastComparisonPreviewUsed";

export function useComparisonPreview() {
  const [hasUsedPreview, setHasUsedPreview] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });

  const markPreviewUsed = useCallback(() => {
    setHasUsedPreview(true);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* sessionStorage unavailable */
    }
  }, []);

  return { hasUsedPreview, markPreviewUsed };
}
