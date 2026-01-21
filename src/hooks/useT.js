import { useCallback } from "react";
import { translations } from "../i18n/translations";

export function useT(lang) {
  return useCallback(
    (key) => translations[lang]?.[key] ?? key,
    [lang]
  );
}
