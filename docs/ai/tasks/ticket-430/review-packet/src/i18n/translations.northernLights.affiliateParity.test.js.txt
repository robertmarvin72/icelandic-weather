// Ticket #430 — C7: the new affiliate CTA i18n keys must exist in both
// languages with the exact issue copy. No pre-existing translation-parity
// test file covers translations.northernLights.js specifically, so this one
// is added targeted at just the new keys (not a general-purpose i18n audit).
import { describe, it, expect } from "vitest";
import { northernLightsTranslations } from "./translations.northernLights";

const AFFILIATE_KEYS = ["nlAffiliateTitle", "nlAffiliateBody", "nlAffiliateCta", "nlAffiliateDisclosure", "nlAffiliateNewTabSuffix"];

describe("translations.northernLights — affiliate CTA key parity (EN/IS)", () => {
  it("every affiliate key exists, as a non-empty string, in both dictionaries", () => {
    for (const key of AFFILIATE_KEYS) {
      expect(typeof northernLightsTranslations.en[key]).toBe("string");
      expect(northernLightsTranslations.en[key].length).toBeGreaterThan(0);
      expect(typeof northernLightsTranslations.is[key]).toBe("string");
      expect(northernLightsTranslations.is[key].length).toBeGreaterThan(0);
    }
  });

  it("EN copy matches the issue text exactly", () => {
    expect(northernLightsTranslations.en.nlAffiliateTitle).toBe("Want to join a Northern Lights tour?");
    expect(northernLightsTranslations.en.nlAffiliateBody).toBe(
      "Prefer to go with a local guide? Compare Northern Lights tours and find an option that works for you."
    );
    expect(northernLightsTranslations.en.nlAffiliateCta).toBe("Compare Northern Lights tours");
    expect(northernLightsTranslations.en.nlAffiliateDisclosure).toBe("Partner link · We may earn a commission if you book.");
  });

  it("IS copy matches the issue text exactly", () => {
    expect(northernLightsTranslations.is.nlAffiliateTitle).toBe("Viltu fara í norðurljósaferð með leiðsögumanni?");
    expect(northernLightsTranslations.is.nlAffiliateBody).toBe("Skoðaðu skipulagðar norðurljósaferðir og finndu ferð sem hentar þér.");
    expect(northernLightsTranslations.is.nlAffiliateCta).toBe("Skoða norðurljósaferðir");
    expect(northernLightsTranslations.is.nlAffiliateDisclosure).toBe("Samstarfstengill · Við gætum fengið þóknun ef þú bókar ferð.");
  });

  it("EN and IS copy are actually distinct (not an accidental copy-paste)", () => {
    for (const key of AFFILIATE_KEYS) {
      expect(northernLightsTranslations.en[key]).not.toBe(northernLightsTranslations.is[key]);
    }
  });
});
