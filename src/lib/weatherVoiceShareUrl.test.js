// Ticket 417 (#417) — weatherVoiceShareUrl.js
import { describe, it, expect } from "vitest";
import {
  WEATHER_VOICE_SHARE_ORIGIN,
  WEATHER_VOICE_SHARE_VERSION,
  buildWeatherVoiceSharePageUrl,
  buildWeatherVoiceShareImageUrl,
  buildFacebookSharerUrl,
  buildWeatherVoiceShareOutputPaths,
} from "./weatherVoiceShareUrl";

describe("buildWeatherVoiceSharePageUrl / buildWeatherVoiceShareImageUrl", () => {
  it("builds an absolute https URL on the real production domain", () => {
    const url = buildWeatherVoiceSharePageUrl("is", "rain_02");
    expect(url).toBe(`https://eltumvedrid.is/share/tjaldur/${WEATHER_VOICE_SHARE_VERSION}/is/rain_02.html`);
    expect(url.startsWith("https://")).toBe(true);
    expect(url).not.toContain("localhost");
  });

  it("the image URL uses the same base, .png extension", () => {
    const url = buildWeatherVoiceShareImageUrl("en", "good_01");
    expect(url).toBe(`https://eltumvedrid.is/share/tjaldur/${WEATHER_VOICE_SHARE_VERSION}/en/good_01.png`);
  });

  it.each(["fr", "IS", "", undefined, null, "is_is"])("rejects an unsupported language %j", (lang) => {
    expect(() => buildWeatherVoiceSharePageUrl(lang, "rain_02")).toThrow();
  });

  it.each(["", "has spaces", "../escape", "id;drop", null, undefined, 123])("rejects an invalid voiceId %j", (id) => {
    expect(() => buildWeatherVoiceSharePageUrl("is", id)).toThrow();
  });

  it("never produces a localhost/current-host/blob/data/session URL", () => {
    const url = buildWeatherVoiceSharePageUrl("is", "rain_02");
    expect(url).not.toMatch(/localhost|127\.0\.0\.1|blob:|data:/);
  });
});

describe("buildFacebookSharerUrl", () => {
  it("builds the documented sharer.php URL with the page URL encoded", () => {
    const pageUrl = "https://eltumvedrid.is/share/tjaldur/v1/is/rain_02.html";
    const url = buildFacebookSharerUrl(pageUrl);
    expect(url).toBe(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`);
  });

  it("rejects a non-https pageUrl", () => {
    expect(() => buildFacebookSharerUrl("http://eltumvedrid.is/x.html")).toThrow();
    expect(() => buildFacebookSharerUrl("blob:abcd")).toThrow();
    expect(() => buildFacebookSharerUrl("")).toThrow();
  });
});

describe("buildWeatherVoiceShareOutputPaths", () => {
  it("returns the on-disk paths under public/, matching the URL structure", () => {
    const { htmlPath, imagePath } = buildWeatherVoiceShareOutputPaths("is", "rain_02");
    expect(htmlPath).toBe(`public/share/tjaldur/${WEATHER_VOICE_SHARE_VERSION}/is/rain_02.html`);
    expect(imagePath).toBe(`public/share/tjaldur/${WEATHER_VOICE_SHARE_VERSION}/is/rain_02.png`);
  });
});

describe("WEATHER_VOICE_SHARE_ORIGIN", () => {
  it("is the real production domain", () => {
    expect(WEATHER_VOICE_SHARE_ORIGIN).toBe("https://eltumvedrid.is");
  });
});
