// Ticket 410 (#410) — direct, real-canvas exercise of
// renderWeatherVoiceShareImage() with the longest current IS/EN comment
// texts and a synthetic very-long message, per the approved prompt:
// "The image renderer may handle synthetic long serious text for layout
// testing" and "Test the longest current IS/EN entries and a synthetic
// long message." These specific texts belong to conditions the sharing
// UI itself never exposes (extreme_wind/heavy_rain are not share-
// eligible) — this script calls the renderer module directly, in a real
// browser, via Vite dev server's on-demand ESM serving, to prove the
// RENDERER's own wrapping/floor-size/failure behavior independent of the
// UI gate.
const { chromium } = require("playwright");
const fs = require("fs");

const BASE_URL = process.env.WV_BASE_URL || "http://localhost:5174";
const OUT_DIR = __dirname;

const LONGEST_IS = "Ég tek þetta sem persónulega árás."; // wind_extreme_02 — longest real IS entry
const LONGEST_EN = "This is an excessive interest in water."; // rain_heavy_03 — longest real EN entry
const SYNTHETIC_TOO_LONG =
  "orðalengd ".repeat(40) + "— þetta er allt of langur texti til að passa nokkurn tímann inn í myndina sama hversu mikið letrið er minnkað.";
// Revision 2 (#410, Ripley Round 1 finding #2) — a single unbroken token
// (no spaces at all) wider than the available width, distinct from a long
// SENTENCE (which can wrap). This is the exact shape of the preserved
// repro (weatherVoiceShare.review-repro.test.js), exercised here against
// the real canvas/font metrics, not just the injected synthetic measurer.
const UNBROKEN_TOKEN = "X".repeat(120);
// A comment long enough to require 4-5 wrapped lines but still fit —
// proving the geometry fix handles the documented line-count ceiling
// correctly, not just the 1-2 line common case.
const FOUR_TO_FIVE_LINE_COMMENT =
  "Þetta er óvenju langur veðurathugasemd sem er hönnuð til að teygja sig yfir fjórar til fimm línur í útflutningsmyndinni okkar";

function baseSnapshot(overrides = {}) {
  return {
    voiceId: "test_fixture",
    text: "placeholder",
    language: "is",
    mood: "excellent",
    condition: "excellent",
    severity: 0,
    siteName: "Þingvellir",
    date: new Date().toISOString().slice(0, 10),
    tmax: 16,
    code: 0,
    episodeKey: "test|fixture",
    ...overrides,
  };
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
  await page.goto(BASE_URL, { waitUntil: "networkidle" }); // warm up Vite's dev server / module graph
  await page.waitForTimeout(500);

  const results = {};

  for (const [label, snapshot] of [
    ["longest-is-wind-extreme-02", baseSnapshot({ text: LONGEST_IS, language: "is", mood: "wrecked", condition: "extreme_wind" })],
    ["longest-en-rain-heavy-03", baseSnapshot({ text: LONGEST_EN, language: "en", mood: "sad", condition: "heavy_rain" })],
    ["revision2-four-to-five-lines", baseSnapshot({ text: FOUR_TO_FIVE_LINE_COMMENT, language: "is", mood: "excellent", condition: "excellent" })],
  ]) {
    const dataUrl = await page.evaluate(
      async ({ snapshot }) => {
        const mod = await import("/src/lib/weatherVoiceShareImage.js");
        const presentationMod = await import("/src/lib/weatherVoicePresentation.js");
        const moodAssetPath = presentationMod.getTjaldurMoodAssetPath(snapshot.mood);
        const brandingAssetPath = snapshot.language === "is" ? "/eltumvedrid-light-is.png" : "/chasetheweather-light-en.png";
        const t = (k) => k; // identity — only the daily-label textKey resolution is under test here
        const blob = await mod.renderWeatherVoiceShareImage(snapshot, { t, moodAssetPath, brandingAssetPath });
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      },
      { snapshot },
    );
    const base64 = dataUrl.split(",")[1];
    const outPath = `${OUT_DIR}/${label}.png`;
    fs.writeFileSync(outPath, Buffer.from(base64, "base64"));
    results[label] = { rendered: true, sizeBytes: fs.statSync(outPath).size, path: outPath };
  }

  // Synthetic too-long message: must REJECT (fail clearly), never resolve
  // with a blank/cropped image.
  const tooLongResult = await page.evaluate(
    async ({ snapshot }) => {
      const mod = await import("/src/lib/weatherVoiceShareImage.js");
      const presentationMod = await import("/src/lib/weatherVoicePresentation.js");
      const moodAssetPath = presentationMod.getTjaldurMoodAssetPath(snapshot.mood);
      const brandingAssetPath = "/eltumvedrid-light-is.png";
      const t = (k) => k;
      try {
        await mod.renderWeatherVoiceShareImage(snapshot, { t, moodAssetPath, brandingAssetPath });
        return { rejected: false };
      } catch (err) {
        return { rejected: true, message: String(err?.message || err) };
      }
    },
    { snapshot: baseSnapshot({ text: SYNTHETIC_TOO_LONG, language: "is", mood: "excellent", condition: "excellent" }) },
  );
  results["synthetic-too-long"] = tooLongResult;

  // Revision 2 (#410, Ripley Round 1 finding #2's exact repro shape): a
  // single unbroken 120-character token must reject under REAL canvas
  // font metrics too, not only the injected synthetic measurer in the
  // unit test.
  const unbrokenTokenResult = await page.evaluate(
    async ({ snapshot }) => {
      const mod = await import("/src/lib/weatherVoiceShareImage.js");
      const presentationMod = await import("/src/lib/weatherVoicePresentation.js");
      const moodAssetPath = presentationMod.getTjaldurMoodAssetPath(snapshot.mood);
      const brandingAssetPath = "/eltumvedrid-light-is.png";
      const t = (k) => k;
      try {
        await mod.renderWeatherVoiceShareImage(snapshot, { t, moodAssetPath, brandingAssetPath });
        return { rejected: false };
      } catch (err) {
        return { rejected: true, message: String(err?.message || err) };
      }
    },
    { snapshot: baseSnapshot({ text: UNBROKEN_TOKEN, language: "is", mood: "excellent", condition: "excellent" }) },
  );
  results["revision2-unbroken-token"] = unbrokenTokenResult;

  fs.writeFileSync(`${OUT_DIR}/results-renderer.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
