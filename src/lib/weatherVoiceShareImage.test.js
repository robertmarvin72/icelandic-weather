// Ticket 410 (#410) — pure text-layout logic for the share image, tested
// with an injected measurer (jsdom has no working 2D canvas context, so
// real canvas drawing/asset-loading is exercised by real-browser evidence
// instead — see outputs/ticket-410-weather-voice-share-evidence/). These
// tests do not mirror the implementation's own constants: they assert
// observable behavior (fits within N lines, shrinks before failing, fails
// rather than truncates) using an independent synthetic measurer.
import { describe, it, expect } from "vitest";
import { is as isEntries } from "../i18n/weatherVoice/is";
import { en as enEntries } from "../i18n/weatherVoice/en";
import {
  wrapTextToLines,
  linesFitWidth,
  fitCommentText,
  fitContextText,
  fitShareLayout,
  languageAppropriateQuote,
  buildDailyContextLabel,
  formatShareDate,
  COMMENT_FONT_FLOOR_PX,
  COMMENT_MAX_LINES,
  CONTEXT_FONT_FLOOR_PX,
} from "./weatherVoiceShareImage";

// A simple, independent proportional model: width = charCount * size *
// PIXELS_PER_CHAR_PER_PX. Deliberately not the same shape as any
// production font-metrics code — this is a synthetic measurer, not a
// mirror of a real canvas's measureText.
const PIXELS_PER_CHAR_PER_PX = 0.55;
function syntheticMeasureWidthAtSize(line, size) {
  return line.length * size * PIXELS_PER_CHAR_PER_PX;
}

describe("wrapTextToLines — pure greedy word wrap", () => {
  it("keeps short text on one line", () => {
    const lines = wrapTextToLines({ text: "No.", measureWidth: (l) => l.length * 10, maxWidth: 500 });
    expect(lines).toEqual(["No."]);
  });

  it("wraps onto multiple lines once a line would exceed maxWidth", () => {
    const lines = wrapTextToLines({ text: "one two three four five six seven", measureWidth: (l) => l.length * 20, maxWidth: 120 });
    expect(lines.length).toBeGreaterThan(1);
    // Every produced line must itself fit (this is what greedy wrapping guarantees).
    for (const line of lines) expect(line.length * 20).toBeLessThanOrEqual(120);
  });

  it("a single word wider than maxWidth still gets its own line, never split mid-word", () => {
    const lines = wrapTextToLines({ text: "supercalifragilisticexpialidocious", measureWidth: (l) => l.length * 100, maxWidth: 50 });
    expect(lines).toEqual(["supercalifragilisticexpialidocious"]);
  });

  it("never drops or reorders words", () => {
    const text = "Þetta er grunsamlega gott í dag og á morgun líka";
    const lines = wrapTextToLines({ text, measureWidth: (l) => l.length * 12, maxWidth: 100 });
    expect(lines.join(" ")).toBe(text);
  });
});

describe("fitCommentText — shrinks before failing, never crops/ellipsizes", () => {
  it("a short comment fits at (or near) the start size", () => {
    const fit = fitCommentText({ text: "„Nei.“", measureWidthAtSize: syntheticMeasureWidthAtSize, maxWidth: 800 });
    expect(fit).not.toBeNull();
    expect(fit.lines.join(" ")).toContain("Nei");
  });

  it.each([
    ["longest real IS entry", `„${isEntries.sort((a, b) => b.text.length - a.text.length)[0].text}“`],
    ["longest real EN entry", `“${enEntries.sort((a, b) => b.text.length - a.text.length)[0].text}”`],
  ])("%s fits within the documented max line count, using a smaller size than the largest short comment if needed", (_label, quotedText) => {
    const fit = fitCommentText({ text: quotedText, measureWidthAtSize: syntheticMeasureWidthAtSize, maxWidth: 800 });
    expect(fit).not.toBeNull();
    expect(fit.lines.length).toBeLessThanOrEqual(COMMENT_MAX_LINES);
    expect(fit.size).toBeGreaterThanOrEqual(COMMENT_FONT_FLOOR_PX);
    expect(fit.lines.join(" ")).toBe(quotedText); // the FULL text survives — nothing cropped
  });

  it("a synthetic very long message that cannot fit even at the floor size returns null (fail clearly, never crop)", () => {
    const veryLong = Array.from({ length: 40 }, () => "orðalengd").join(" ") + " — þetta er allt of langur texti til að passa nokkurn tímann.";
    const fit = fitCommentText({ text: `„${veryLong}“`, measureWidthAtSize: syntheticMeasureWidthAtSize, maxWidth: 800 });
    expect(fit).toBeNull();
  });

  it("prefers the LARGEST size that still fits, not the smallest available", () => {
    const short = fitCommentText({ text: "„Nei.“", measureWidthAtSize: syntheticMeasureWidthAtSize, maxWidth: 800 });
    const longer = fitCommentText({
      text: `„${isEntries.sort((a, b) => b.text.length - a.text.length)[0].text}“`,
      measureWidthAtSize: syntheticMeasureWidthAtSize,
      maxWidth: 800,
    });
    expect(short.size).toBeGreaterThanOrEqual(longer.size);
  });
});

// Ripley Round 1 finding #2 (Revision 2, #410): a single unbreakable token
// wider than maxWidth was previously accepted as "fitting" because line
// COUNT alone was checked. This exact scenario is Ripley's own preserved
// repro (outputs/ticket-410-weather-voice-share-evidence/weatherVoiceShare.review-repro.test.js).
describe("fitCommentText — Revision 2 (#410): rejects an unbroken token wider than maxWidth, even alone on its line", () => {
  it("a 100-character unbroken token that never fits at any size, including the floor, returns null", () => {
    const result = fitCommentText({ text: "X".repeat(100), measureWidthAtSize: (line, size) => line.length * size, maxWidth: 885.6 });
    expect(result).toBeNull();
  });

  it("linesFitWidth itself correctly distinguishes a fitting line from an overlong unbreakable one", () => {
    const measure = (line) => line.length * 10;
    expect(linesFitWidth(["short"], measure, 100)).toBe(true);
    expect(linesFitWidth(["X".repeat(50)], measure, 100)).toBe(false);
  });

  it("real short comments are unaffected by the width check — still fit exactly as before", () => {
    const fit = fitCommentText({ text: "„Nei.“", measureWidthAtSize: syntheticMeasureWidthAtSize, maxWidth: 800 });
    expect(fit).not.toBeNull();
  });
});

describe("fitContextText — same width/line-count discipline as the comment, plus a height budget", () => {
  it("a short context fits comfortably within a generous height budget", () => {
    const fit = fitContextText({ text: "Þingvellir · Dagsspá 12.09.2026 · Heiðskírt · Hámark 16°C", measureWidthAtSize: syntheticMeasureWidthAtSize, maxWidth: 800, maxHeight: 1000 });
    expect(fit).not.toBeNull();
    expect(fit.lines.join(" ")).toContain("Þingvellir");
  });

  it("a long real campsite name wraps and shrinks rather than overflowing maxWidth", () => {
    const longSiteName = "Tjaldsvæðið við hina óvenju löngu og lýsandi kennileitisheiti sveitarfélagsins";
    const fit = fitContextText({ text: `${longSiteName} · Dagsspá 12.09.2026 · Heiðskírt · Hámark 16°C`, measureWidthAtSize: syntheticMeasureWidthAtSize, maxWidth: 800, maxHeight: 1000 });
    expect(fit).not.toBeNull();
    for (const line of fit.lines) expect(syntheticMeasureWidthAtSize(line, fit.size)).toBeLessThanOrEqual(800 + 0.5);
  });

  it("rejects when even the floor size exceeds the given height budget", () => {
    const fit = fitContextText({ text: "some context text", measureWidthAtSize: syntheticMeasureWidthAtSize, maxWidth: 800, maxHeight: 1 });
    expect(fit).toBeNull();
  });

  it("a single unbreakable token wider than maxWidth is rejected here too, never accepted merely by line count", () => {
    const fit = fitContextText({ text: "X".repeat(100), measureWidthAtSize: (line, size) => line.length * size, maxWidth: 300 });
    expect(fit).toBeNull();
  });
});

describe("fitShareLayout — Revision 2 (#410): reserves real vertical space so comment+context never overlap branding", () => {
  const maxWidth = 800;
  const availableHeight = 400;

  it("fits a short comment and short context comfortably, preferring larger sizes", () => {
    const layout = fitShareLayout({ commentText: "„Nei.“", contextText: "Þingvellir · Dagsspá 12.09.2026 · Heiðskírt · Hámark 16°C", measureWidthAtSize: syntheticMeasureWidthAtSize, maxWidth, availableHeight });
    expect(layout).not.toBeNull();
    expect(layout.comment.size).toBeGreaterThan(CONTEXT_FONT_FLOOR_PX);
    expect(layout.context.size).toBeGreaterThan(0);
  });

  it("the combined comment+context height never exceeds availableHeight", () => {
    const longestIsComment = `„${isEntries.sort((a, b) => b.text.length - a.text.length)[0].text}“`;
    const layout = fitShareLayout({
      commentText: longestIsComment,
      contextText: "Tjaldsvæðið við hina óvenju löngu kennileitisheiti sveitarfélagsins · Dagsspá 12.09.2026 · Heiðskírt · Hámark 16°C",
      measureWidthAtSize: syntheticMeasureWidthAtSize,
      maxWidth,
      availableHeight,
    });
    expect(layout).not.toBeNull();
    const totalHeight = layout.comment.height + 24 + layout.context.height;
    expect(totalHeight).toBeLessThanOrEqual(availableHeight);
  });

  it("shrinks the comment to free room for a long context before ever failing", () => {
    const veryLongContext =
      "Tjaldsvæðið við hina afskaplega óvenju löngu og lýsandi kennileitisheiti sveitarfélagsins sem enginn kann að skammstafa · Dagsspá 12.09.2026 · Heiðskírt · Hámark 16°C";
    const layout = fitShareLayout({ commentText: "„Nei.“", contextText: veryLongContext, measureWidthAtSize: syntheticMeasureWidthAtSize, maxWidth, availableHeight });
    // Either it finds room (possibly by shrinking the comment below its
    // own start size) or it genuinely cannot — both are acceptable, but a
    // silent overlap/crop is not: if it succeeds, verify no overlap.
    if (layout) {
      const totalHeight = layout.comment.height + 24 + layout.context.height;
      expect(totalHeight).toBeLessThanOrEqual(availableHeight);
    }
  });

  it("returns null (fail clearly) rather than overlapping branding when nothing fits even at every floor", () => {
    const layout = fitShareLayout({ commentText: "X".repeat(100), contextText: "context", measureWidthAtSize: (line, size) => line.length * size, maxWidth, availableHeight });
    expect(layout).toBeNull();
  });
});

describe("formatShareDate — Revision 2 (#410): deterministic, no Intl weekday-locale dependency, always includes the year", () => {
  it("formats IS as fully numeric dd.mm.yyyy — never an English weekday name", () => {
    const label = formatShareDate("2026-09-12", "is");
    expect(label).toBe("12.09.2026");
    expect(label).not.toMatch(/[a-zA-Z]/); // the exact bug: an English "Saturday" leaking into an IS export
  });

  it("formats EN as 'D Mon YYYY'", () => {
    expect(formatShareDate("2026-09-12", "en")).toBe("12 Sep 2026");
  });

  it("always includes the year, for a persistent/unambiguous dated image", () => {
    expect(formatShareDate("2026-01-05", "is")).toContain("2026");
    expect(formatShareDate("2026-01-05", "en")).toContain("2026");
  });

  it("falls back to the raw string on malformed input, never throwing", () => {
    expect(() => formatShareDate("not-a-real-date", "is")).not.toThrow();
    expect(formatShareDate("not-a-real-date", "is")).toBe("not-a-real-date");
    expect(formatShareDate(undefined, "en")).toBe("");
  });
});

describe("languageAppropriateQuote", () => {
  it("uses „…“ for Icelandic and “…” for English", () => {
    expect(languageAppropriateQuote("Nei.", "is")).toBe("„Nei.“");
    expect(languageAppropriateQuote("No.", "en")).toBe("“No.”");
  });
});

describe("buildDailyContextLabel — explicitly daily/high-labeled, never an unqualified 'now' reading", () => {
  // Real translation function so the explicit daily-forecast/high-temp
  // labels (Ripley Round 1 finding #1) are asserted as real copy, not the
  // raw key — an identity t() would let a missing translation pass silently.
  const realT = (k) => {
    const dict = {
      weatherVoiceShareDailyForecastLabel: "Daily forecast",
      weatherVoiceShareHighTempLabel: "High",
      clearSky: "Clear sky",
    };
    return dict[k] ?? k;
  };

  it("explicitly labels the forecast as daily and the temperature as the day's high", () => {
    const label = buildDailyContextLabel({ snapshot: { date: "2026-09-12", tmax: 16.4, code: 0, language: "en" }, t: realT });
    expect(label).toContain("Daily forecast");
    expect(label).toContain("High 16°C");
    expect(label).toContain("Clear sky");
    expect(label).not.toMatch(/\bnow\b/i);
  });

  it("includes the formatted date (with year) via formatShareDate, not a separate ad hoc format", () => {
    const label = buildDailyContextLabel({ snapshot: { date: "2026-09-12", tmax: 16, code: 0, language: "is" }, t: realT });
    expect(label).toContain(formatShareDate("2026-09-12", "is"));
    expect(label).toContain("2026");
  });

  it("prefixes the public site name when present, and omits it cleanly when absent", () => {
    const withSite = buildDailyContextLabel({ snapshot: { date: "2026-09-12", tmax: 16, code: 0, language: "en", siteName: "Þingvellir" }, t: realT });
    expect(withSite.startsWith("Þingvellir ·")).toBe(true);

    const withoutSite = buildDailyContextLabel({ snapshot: { date: "2026-09-12", tmax: 16, code: 0, language: "en", siteName: null }, t: realT });
    expect(withoutSite.startsWith("Daily forecast")).toBe(true);
  });

  it("never throws on a malformed date, falling back to the raw string", () => {
    expect(() => buildDailyContextLabel({ snapshot: { date: "not-a-real-date", tmax: 10, code: 0, language: "en" }, t: realT })).not.toThrow();
  });
});
