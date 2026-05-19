import { useCallback } from "react";
import { useLocalStorageState } from "./useLocalStorageState";

export function useLanguage() {
  const [lang, setLang] = useLocalStorageState("lang", "is");

  const toggleLanguage = useCallback(() => {
    setLang((prev) => (prev === "is" ? "en" : "is"));
  }, [setLang]);

  return { lang, setLang, toggleLanguage };
}
