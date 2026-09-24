// Ticket 417 (#417) — weatherVoiceShareHtml.js
import { describe, it, expect } from "vitest";
import { buildWeatherVoiceShareHtml, WEATHER_VOICE_SHARE_HOMEPAGE_URL } from "./weatherVoiceShareHtml";

const BASE = {
  language: "is",
  voiceId: "rain_02",
  text: "Regnjakki með aðalhlutverk.",
  pageUrl: "https://eltumvedrid.is/share/tjaldur/v1/is/rain_02.html",
  imageUrl: "https://eltumvedrid.is/share/tjaldur/v1/is/rain_02.png",
};

function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

describe("buildWeatherVoiceShareHtml — Ticket 417 (#417): exactly one of each required OG tag", () => {
  it("IS: exactly one each of og:title/description/image/url/type/image:width/image:height", () => {
    const html = buildWeatherVoiceShareHtml(BASE);
    expect(countOccurrences(html, 'property="og:title"')).toBe(1);
    expect(countOccurrences(html, 'property="og:description"')).toBe(1);
    expect(countOccurrences(html, 'property="og:image"')).toBe(1);
    expect(countOccurrences(html, 'property="og:image:width"')).toBe(1);
    expect(countOccurrences(html, 'property="og:image:height"')).toBe(1);
    expect(countOccurrences(html, 'property="og:url"')).toBe(1);
    expect(html).toContain('property="og:type" content="website"');
    expect(html).toContain('content="1200"');
    expect(html).toContain('content="630"');
  });

  it("includes a suitable <title>, lang attribute, canonical link, robots noindex,follow, and an image alt", () => {
    const html = buildWeatherVoiceShareHtml(BASE);
    expect(html).toMatch(/<html lang="is">/);
    expect(html).toContain('<title>Tjaldur segir: „Regnjakki með aðalhlutverk.“</title>');
    expect(html).toContain(`<link rel="canonical" href="${BASE.pageUrl}">`);
    expect(html).toContain('<meta name="robots" content="noindex, follow">');
    expect(html).toMatch(/alt="[^"]*Regnjakki með aðalhlutverk\.[^"]*"/);
  });

  it("body shows the same quote and a plain homepage link, with no <script> tag anywhere", () => {
    const html = buildWeatherVoiceShareHtml(BASE);
    expect(html).toContain("„Regnjakki með aðalhlutverk.“");
    expect(html).toContain(`href="${WEATHER_VOICE_SHARE_HOMEPAGE_URL}"`);
    expect(html).not.toMatch(/<script/i);
  });

  it("canonical/og:url/og:image are exactly the absolute https URLs passed in — never localhost/blob/data/session", () => {
    const html = buildWeatherVoiceShareHtml(BASE);
    expect(html).toContain(`content="${BASE.pageUrl}"`);
    expect(html).toContain(`content="${BASE.imageUrl}"`);
    expect(html).not.toMatch(/localhost|blob:|data:|127\.0\.0\.1/);
  });

  it("EN: forced-English copy, en lang attribute, curly quotes", () => {
    const html = buildWeatherVoiceShareHtml({
      language: "en",
      voiceId: "rain_02",
      text: "Rain jacket, starring role.",
      pageUrl: "https://eltumvedrid.is/share/tjaldur/v1/en/rain_02.html",
      imageUrl: "https://eltumvedrid.is/share/tjaldur/v1/en/rain_02.png",
    });
    expect(html).toMatch(/<html lang="en">/);
    expect(html).toContain("“Rain jacket, starring role.”");
    expect(html).toContain("Chase the Weather");
    expect(html).toContain("Tjaldur says:");
  });
});

describe("buildWeatherVoiceShareHtml — escaping", () => {
  it("escapes HTML special characters in the comment text", () => {
    const html = buildWeatherVoiceShareHtml({
      ...BASE,
      text: `Þetta er <script>alert("x")</script> & "quoted" 'text'.`,
    });
    expect(html).not.toContain("<script>alert(");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
    expect(html).toContain("&quot;");
    expect(html).toContain("&#39;");
  });

  it("escapes a comment containing an unescaped double quote inside an attribute-adjacent position", () => {
    const html = buildWeatherVoiceShareHtml({ ...BASE, text: `Sagði "halló" við mig.` });
    // The quoted text appears inside <title> and inside an attribute
    // (image alt) — both must be safely escaped, never breaking out.
    expect(html).not.toMatch(/alt="[^"]*"[^>]*halló/); // no raw unescaped quote inside the alt attribute
    expect(html).toContain("&quot;halló&quot;");
  });

  it("never emits a raw, un-escaped angle bracket from content into the document", () => {
    const html = buildWeatherVoiceShareHtml({ ...BASE, text: "5 < 10 and 10 > 5" });
    expect(html).toContain("5 &lt; 10 and 10 &gt; 5");
  });
});

describe("buildWeatherVoiceShareHtml — malformed/edge input handling", () => {
  it("does not throw on an empty text string", () => {
    expect(() => buildWeatherVoiceShareHtml({ ...BASE, text: "" })).not.toThrow();
  });

  it("does not reflect arbitrary extra fields into the output", () => {
    const html = buildWeatherVoiceShareHtml({ ...BASE, evilQueryText: "<script>hack()</script>" });
    expect(html).not.toContain("hack()");
  });

  it("falls back to Icelandic copy for an unrecognized language rather than throwing", () => {
    expect(() => buildWeatherVoiceShareHtml({ ...BASE, language: "fr" })).not.toThrow();
  });
});
