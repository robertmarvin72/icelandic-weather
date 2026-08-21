import { describe, it, expect } from "vitest";
import { normalizeForecastRawInput, parseForecastLine } from "./admin.js";

describe("parseForecastLine — number extraction (no-useless-escape fix in [^0-9.-])", () => {
  it("extracts negative and positive temperatures with decimals (comma or dot)", () => {
    const r = parseForecastLine("mán. 15. júlí -2,5°C til 5.5°C, vindur 8 m/s, úrkoma 12 mm");
    expect(r.minTemp).toBe(-2.5);
    expect(r.maxTemp).toBe(5.5);
  });

  it("extracts wind (single value) and rain", () => {
    const r = parseForecastLine("þri. 16. júlí 3°C til 8°C, vindur 8 m/s, úrkoma 0 mm");
    expect(r.wind).toBe(8);
    expect(r.gust).toBeNull();
    expect(r.rain).toBe(0);
  });

  it("extracts wind + gust (multiple m/s values, gust = max of the rest)", () => {
    const r = parseForecastLine("mið. 17. júlí 3°C til 8°C, vindur 8 m/s til 15 m/s, úrkoma 2 mm");
    expect(r.wind).toBe(8);
    expect(r.gust).toBe(15);
  });

  it("handles a fully negative range (both temps below zero)", () => {
    const r = parseForecastLine("fim. 18. janúar -10°C til -3°C, vindur 5 m/s, úrkoma 0 mm");
    expect(r.minTemp).toBe(-10);
    expect(r.maxTemp).toBe(-3);
  });

  it("returns null fields for a line with no numeric matches (malformed/unusual input)", () => {
    const r = parseForecastLine("fös. 19. júlí lítil úrkoma, hægur vindur");
    expect(r.minTemp).toBeNull();
    expect(r.maxTemp).toBeNull();
    expect(r.wind).toBeNull();
    expect(r.gust).toBeNull();
    expect(r.rain).toBeNull();
  });

  it("parses Icelandic day abbreviation + full month name in the day label (á, í, ó, ú)", () => {
    const r = parseForecastLine("lau. 20. ágúst 10°C til 16°C, vindur 4 m/s, úrkoma 0 mm");
    expect(r.day).toMatch(/^lau\./i);
  });
});

describe("normalizeForecastRawInput — STRIP_CHARS Unicode fix (no-misleading-character-class)", () => {
  it("strips the simple BMP arrow character (›)", () => {
    const { normalizedText } = normalizeForecastRawInput(
      "mán. 15. júlí › 3°C til 8°C, vindur 5 m/s, úrkoma 0 mm"
    );
    expect(normalizedText).not.toContain("›");
  });

  it("strips the warning emoji as a whole sequence (⚠️ = U+26A0 + U+FE0F), leaving no stray variation-selector artifact", () => {
    const { normalizedText } = normalizeForecastRawInput(
      "þri. 16. júlí ⚠️ 3°C til 8°C, vindur 15 m/s, úrkoma 0 mm"
    );
    expect(normalizedText).not.toContain("⚠");
    expect(normalizedText).not.toContain("️");
  });

  it("strips the wind emoji as a single Unicode code point (🌬 is a surrogate pair), leaving no stray half-surrogate", () => {
    const { normalizedText } = normalizeForecastRawInput(
      "mið. 17. júlí 🌬 3°C til 8°C, vindur 5 m/s, úrkoma 0 mm"
    );
    expect(normalizedText).not.toContain("🌬");
    // A stray unpaired surrogate would break the string's own well-formedness —
    // this call throws if the string contains any lone surrogate half.
    expect(() => encodeURIComponent(normalizedText)).not.toThrow();
  });

  it("does not strip ordinary Icelandic letters (á, ð, é, í, ó, ú, ý, þ, æ, ö, upper/lower) adjacent to the stripped symbols", () => {
    const { normalizedText } = normalizeForecastRawInput(
      "fim. 18. júlí ⚠️ Þrumuveður og él, ágætis útsýni — ÁÐÉÍÓÚÝÞÆÖ áðéíóúýþæö, vindur 5 m/s, úrkoma 0 mm"
    );
    expect(normalizedText).toContain("Þrumuveður");
    expect(normalizedText).toContain("ÁÐÉÍÓÚÝÞÆÖ");
    expect(normalizedText).toContain("áðéíóúýþæö");
  });

  it("full pipeline: multi-day pasted text with mixed decorative symbols still produces correct metrics", () => {
    const raw = [
      "mán. 15. júlí ⚠️",
      "Rigning, hiti -2°C til 5°C, vindur 8 m/s til 15 m/s, úrkoma 12 mm 🌬",
      "þri. 16. júlí ›",
      "Bjart, hiti 3°C til 10°C, vindur 4 m/s, úrkoma 0 mm",
    ].join("\n");

    const { metrics } = normalizeForecastRawInput(raw);
    expect(metrics).not.toBeNull();
    expect(metrics.maxWind).toBe(8);
    expect(metrics.maxGust).toBe(15);
    expect(metrics.maxRain).toBe(12);
    expect(metrics.minTemp).toBe(-2);
  });

  it("does not corrupt an unrelated emoji that shares a surrogate half with 🌬 (🌊 U+1F30A shares the same high surrogate D83C) — this is the actual bug the 'u' flag fixes", () => {
    const { normalizedText } = normalizeForecastRawInput(
      "sun. 21. júlí Sjávarstaða 🌊 hækkandi, hiti 3°C til 8°C, vindur 5 m/s, úrkoma 0 mm"
    );
    // Without the u flag, STRIP_CHARS could match 🌬's high-surrogate code unit
    // (D83C) on its own and strip it out of 🌊 too, leaving a lone unpaired
    // low surrogate — an invalid, corrupted string.
    expect(() => encodeURIComponent(normalizedText)).not.toThrow();
    expect(normalizedText).toContain("🌊");
  });

  it("empty/whitespace-only input still returns the empty-result shape", () => {
    expect(normalizeForecastRawInput("")).toEqual({
      normalizedText: "",
      summaryText: "",
      metrics: null,
    });
    expect(normalizeForecastRawInput("   \n\t  ")).toEqual({
      normalizedText: "",
      summaryText: "",
      metrics: null,
    });
  });
});
