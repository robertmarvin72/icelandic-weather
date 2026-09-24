// Ticket 417 (#417) — validates the ACTUAL generated static-export files on
// disk (public/share/tjaldur/v1/**) against the real catalogue and
// manifest: full coverage, unique/escaped metadata, matching text/mood,
// absolute URLs, correct dimensions, no personal context, and version
// integrity. Real image pixel content is validated visually via
// real-browser evidence (outputs/ticket-417-facebook-share-evidence/) —
// this test covers the generated HTML/manifest text and PNG existence/size.
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { buildWeatherVoiceShareCatalogue } from "./weatherVoiceShareCatalogue";
import { WEATHER_VOICE_SHARE_MANIFEST, WEATHER_VOICE_SHARE_MANIFEST_VERSION } from "./weatherVoiceShareManifest.generated";

const REPO_ROOT = join(__dirname, "..", "..");
const catalogue = buildWeatherVoiceShareCatalogue();

function readHtml(entry) {
  return readFileSync(join(REPO_ROOT, entry.htmlOutputPath), "utf8");
}

describe("Generated static export — Ticket 417 (#417): full coverage on disk", () => {
  it("every published image is a PNG with an actual 1200x630 IHDR", () => {
    for (const entry of catalogue) {
      const bytes = readFileSync(join(REPO_ROOT, entry.imageOutputPath));
      expect(bytes.subarray(0, 8).toString("hex"), entry.imageOutputPath).toBe("89504e470d0a1a0a");
      expect(bytes.readUInt32BE(8), entry.imageOutputPath).toBe(13);
      expect(bytes.toString("ascii", 12, 16), entry.imageOutputPath).toBe("IHDR");
      expect(bytes.readUInt32BE(16), entry.imageOutputPath).toBe(1200);
      expect(bytes.readUInt32BE(20), entry.imageOutputPath).toBe(630);
    }
  });

  it("every catalogue entry has a real HTML file and a real, non-trivially-sized PNG file", () => {
    for (const entry of catalogue) {
      const htmlPath = join(REPO_ROOT, entry.htmlOutputPath);
      const imagePath = join(REPO_ROOT, entry.imageOutputPath);
      expect(existsSync(htmlPath), `${entry.htmlOutputPath} should exist`).toBe(true);
      expect(existsSync(imagePath), `${entry.imageOutputPath} should exist`).toBe(true);
      expect(statSync(imagePath).size, `${entry.imageOutputPath} should be a real, non-trivial PNG`).toBeGreaterThan(5000);
    }
  });

  it("manifest has exactly one entry per catalogue entry — no extras, none missing", () => {
    const manifestKeys = Object.keys(WEATHER_VOICE_SHARE_MANIFEST);
    const catalogueKeys = catalogue.map((e) => `${e.language}|${e.voiceId}`);
    expect(new Set(manifestKeys)).toEqual(new Set(catalogueKeys));
    expect(manifestKeys.length).toBe(catalogueKeys.length);
  });

  it("manifest version matches the URL version the catalogue was built with", () => {
    expect(WEATHER_VOICE_SHARE_MANIFEST_VERSION).toBe("v1");
    for (const entry of catalogue) {
      expect(entry.pageUrl).toContain("/tjaldur/v1/");
    }
  });
});

describe("Generated static export — each HTML file's metadata", () => {
  it.each(catalogue)("$language/$voiceId: unique escaped metadata, matching text/mood, absolute URLs, exact dimensions", (entry) => {
    const html = readHtml(entry);

    // Exactly one each of the required OG tags.
    for (const tag of ["og:title", "og:description", "og:image", "og:url", "og:type", "og:image:width", "og:image:height"]) {
      const count = html.split(`property="${tag}"`).length - 1;
      expect(count, `${entry.language}/${entry.voiceId}: exactly one ${tag}`).toBe(1);
    }

    expect(html).toContain('content="1200"');
    expect(html).toContain('content="630"');
    expect(html).toContain(`content="${entry.pageUrl}"`);
    expect(html).toContain(`content="${entry.imageUrl}"`);
    expect(html).toContain(`<link rel="canonical" href="${entry.pageUrl}">`);
    expect(html).toContain('<meta name="robots" content="noindex, follow">');
    expect(html).toMatch(new RegExp(`<html lang="${entry.language}">`));

    // The exact text appears, HTML-escaped where needed; no unescaped angle brackets from content.
    const escapedText = entry.text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    expect(html).toContain(escapedText);

    // Never localhost/blob/data/session URLs.
    expect(html).not.toMatch(/localhost|127\.0\.0\.1|blob:|data:/);

    // No personal/site-specific context — this is a comment/mood/language
    // artifact only, never a per-user location.
    expect(html).not.toMatch(/\blat(itude)?\b|\blon(gitude)?\b|\bcoordinates\b|tjaldsvæði [A-ZÁÐÉÍÓÚÝÞÆÖ]/i);
  });

  it("no two entries share identical <title> text (each is a genuinely distinct artifact)", () => {
    const titles = catalogue.map((entry) => readHtml(entry).match(/<title>(.*?)<\/title>/s)[1]);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
