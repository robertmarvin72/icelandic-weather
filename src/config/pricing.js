// src/config/pricing.js

export const DISPLAY_PRICES = {
  en: {
    monthly: "€4.99",
    yearly: "€24.99",
    pass30: "€6.99",
    passyear: "€29.99",
  },
  is: {
    monthly: "790 kr",
    yearly: "3.590 kr",
    pass30: "995 kr",
    passyear: "4.268 kr",
  },
};

export function getDisplayPrices(lang) {
  const key = lang === "is" ? "is" : "en";
  return DISPLAY_PRICES[key];
}
