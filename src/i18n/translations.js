import { commonTranslations } from "./translations.common";
import { routePlannerTranslations } from "./translations.routePlanner";
import { pricingTranslations } from "./translations.pricing";
import { errorsTranslations } from "./translations.errors";
import { landingTranslations } from "./translations.landing";

export const translations = {
  en: {
    ...pricingTranslations.en,
    ...routePlannerTranslations.en,
    ...landingTranslations.en,
    ...commonTranslations.en,
    ...errorsTranslations.en,
  },

  // Icelandic (Íslenska) -------------------------------------------------------------------------------------------------------------------
  is: {
    ...commonTranslations.is,
    ...routePlannerTranslations.is,
    ...pricingTranslations.is,
    ...errorsTranslations.is,
    ...landingTranslations.is,
  },
};
