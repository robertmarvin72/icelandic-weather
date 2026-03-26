import { useLocalStorageState } from "./useLocalStorageState";
import { useLanguage } from "./useLanguage";
import { useT } from "./useT";

export function usePageRouteProps() {
  const [theme] = useLocalStorageState("theme", "light");
  const { lang } = useLanguage();
  const t = useT(lang);

  return { lang, theme, t };
}
