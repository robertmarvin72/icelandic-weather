import { commonTranslations } from "./translations.common";
import { routePlannerTranslations } from "./translations.routePlanner";
import { pricingTranslations } from "./translations.pricing";
import { errorsTranslations } from "./translations.errors";
import { landingTranslations } from "./translations.landing";
import { researchQuizTranslations } from "./translations.researchQuiz";
import { northernLightsTranslations } from "./translations.northernLights";
import { winterRouteTranslations } from "./translations.winterRoute";

export const translations = {
  en: {
    ...pricingTranslations.en,
    ...routePlannerTranslations.en,
    ...landingTranslations.en,
    ...commonTranslations.en,
    ...errorsTranslations.en,
    ...researchQuizTranslations.en,
    ...northernLightsTranslations.en,
    ...winterRouteTranslations.en,
  },

  // Icelandic (Íslenska) -------------------------------------------------------------------------------------------------------------------
  is: {
    ...commonTranslations.is,
    ...routePlannerTranslations.is,
    ...pricingTranslations.is,
    ...errorsTranslations.is,
    ...landingTranslations.is,
    ...researchQuizTranslations.is,
    ...northernLightsTranslations.is,
    ...winterRouteTranslations.is,
  },
};
