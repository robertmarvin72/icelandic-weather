import { useEffect } from "react";

/**
 * useThemeClass
 *
 * Keeps the <html> "dark" class in sync with a boolean.
 * This is the Tailwind dark-mode switch (class strategy).
 */
export function useThemeClass(isDark) {
  useEffect(() => {
    document.documentElement.classList.toggle("dark", Boolean(isDark));
  }, [isDark]);
}
