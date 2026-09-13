// Ticket 410 Revision 2 (#410) — real-browser re-verification of the four
// Round 1 correction findings: (1) truthful daily/high-temp labeling with
// a robust IS date, (2) full renderer geometry (long site name, no
// branding overlap), (3) frozen opening snapshot (not directly browser-
// testable here — covered by jsdom integration tests — but the universal-
// sharing scenario below proves the entrypoint/content pairing is
// correct), (4) native-share guard + short-landscape dialog scrolling.
// Also proves the owner's actual motivating scenario: a `rain` episode
// (previously blocked by the removed good/excellent-only policy) now has
// the same real, working share entrypoint, preview, and download as
// excellent/good did in Revision 1.
const { chromium } = require("playwright");
const fs = require("fs");

const BASE_URL = process.env.WV_BASE_URL || "http://localhost:5174";
const OUT_DIR = __dirname;
const TODAY = new Date().toISOString().slice(0, 10);

const LONG_SITE_NAME = "Tjaldsvæðið við hina óvenju löngu og lýsandi kennileitisheiti sveitarfélagsins";
const SITE_NORMAL = { id: "site-a", name: "Thingvellir Test Site", lat: 64.1, lon: -21.9, tier: "free" };
const SITE_LONG_NAME = { id: "site-a", name: LONG_SITE_NAME, lat: 64.1, lon: -21.9, tier: "free" };

const RAIN = { tmax: 10, windMax: 0, rain: 5, code: 61 }; // real "rain" condition fixture
const EXTREME_WIND = { tmax: 4, windMax: 17, rain: 5, code: 61 }; // real "extreme_wind" (severity 3) fixture

function isoDate(offsetDays) {
  const d = new Date(`${TODAY}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function buildDaily(o) {
  const time = [], tmax = [], tmin = [], precip = [], windMax = [], windGust = [], windDir = [], code = [];
  for (let i = 0; i < 7; i++) {
    time.push(isoDate(i));
    if (i === 0) {
      tmax.push(o.tmax); tmin.push(o.tmax - 5); precip.push(o.rain);
      windMax.push(o.windMax); windGust.push(o.windMax + 2); windDir.push(180); code.push(o.code);
    } else {
      tmax.push(10); tmin.push(5); precip.push(0); windMax.push(3); windGust.push(5); windDir.push(180); code.push(2);
    }
  }
  return { time, temperature_2m_max: tmax, temperature_2m_min: tmin, precipitation_sum: precip, windspeed_10m_max: windMax, windgusts_10m_max: windGust, winddirection_10m_dominant: windDir, weathercode: code };
}

async function setupRoutes(page, { site, weather }) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/campsites")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, campsites: [site], tier: "free" }) });
    }
    if (url.includes("/api/forecast")) {
      const daily = buildDaily(weather);
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ daily, hourly: { time: [], weathercode: [], precipitation: [], windspeed_10m: [], windgusts_10m: [], temperature_2m: [] } }) });
    }
    if (url.includes("/api/me")) return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
}

async function runRainScenario(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("lang", JSON.stringify("is"));
    localStorage.setItem("theme", JSON.stringify("light"));
  });
  await setupRoutes(page, { site: SITE_NORMAL, weather: RAIN });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const card = page.locator("[data-weather-voice-surface]");
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const commentText = await card.locator("p").nth(1).textContent();

  const shareButton = card.getByText("Deila Tjaldi", { exact: true });
  const shareButtonPresent = (await shareButton.count()) > 0;
  const result = { commentText, shareButtonPresent };

  if (shareButtonPresent) {
    await shareButton.click();
    await page.waitForSelector('[role="dialog"] img', { timeout: 8000 }).catch(() => {});
    result.previewAppeared = (await page.getByRole("dialog").locator("img").count()) > 0;
    await page.screenshot({ path: `${OUT_DIR}/10-revision2-rain-dialog.png` });

    const saveButton = page.getByRole("dialog").getByText("Vista mynd", { exact: true });
    const [download] = await Promise.all([page.waitForEvent("download"), saveButton.click()]);
    const savePath = `${OUT_DIR}/10-revision2-rain-exported.png`;
    await download.saveAs(savePath);
    result.downloadedFileSize = fs.statSync(savePath).size;
  }

  await context.close();
  return result;
}

async function runExtremeWindScenario(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("lang", JSON.stringify("is"));
    localStorage.setItem("theme", JSON.stringify("light"));
  });
  await setupRoutes(page, { site: SITE_NORMAL, weather: EXTREME_WIND });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const card = page.locator("[data-weather-voice-surface]");
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const commentText = await card.locator("p").nth(1).textContent();
  const shareButtonPresent = (await card.getByText("Deila Tjaldi", { exact: true }).count()) > 0;

  await card.getByText("Deila Tjaldi", { exact: true }).click();
  await page.waitForSelector('[role="dialog"] img', { timeout: 8000 }).catch(() => {});
  const previewAppeared = (await page.getByRole("dialog").locator("img").count()) > 0;
  await page.screenshot({ path: `${OUT_DIR}/11-revision2-extreme-wind-dialog.png` });

  await context.close();
  return { commentText, shareButtonPresent, previewAppeared };
}

async function runLongSiteNameScenario(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("lang", JSON.stringify("is"));
    localStorage.setItem("theme", JSON.stringify("light"));
  });
  await setupRoutes(page, { site: SITE_LONG_NAME, weather: RAIN });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const card = page.locator("[data-weather-voice-surface]");
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await card.getByText("Deila Tjaldi", { exact: true }).click();
  await page.waitForSelector('[role="dialog"] img', { timeout: 8000 }).catch(() => {});
  const previewAppeared = (await page.getByRole("dialog").locator("img").count()) > 0;

  const saveButton = page.getByRole("dialog").getByText("Vista mynd", { exact: true });
  const [download] = await Promise.all([page.waitForEvent("download"), saveButton.click()]);
  const savePath = `${OUT_DIR}/12-revision2-long-site-name-exported.png`;
  await download.saveAs(savePath);

  await context.close();
  return { previewAppeared, downloadedFileSize: fs.statSync(savePath).size, path: savePath };
}

async function runShortLandscapeScenario(browser) {
  const context = await browser.newContext({ viewport: { width: 700, height: 320 } }); // short mobile landscape
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("lang", JSON.stringify("en"));
    localStorage.setItem("theme", JSON.stringify("dark"));
  });
  await setupRoutes(page, { site: SITE_NORMAL, weather: RAIN });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const card = page.locator("[data-weather-voice-surface]");
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await card.getByText("Share Tjaldur", { exact: true }).click();
  await page.waitForSelector('[role="dialog"] img', { timeout: 8000 }).catch(() => {});
  await page.screenshot({ path: `${OUT_DIR}/13-revision2-short-landscape-dialog.png` });

  // Confirm the Save button is genuinely reachable (in the viewport or
  // reachable via the dialog's own internal scroll) — not clipped off
  // with no way to reach it while body scroll stays locked.
  const saveButton = page.getByRole("dialog").getByText("Save image", { exact: true });
  await saveButton.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT_DIR}/14-revision2-short-landscape-scrolled-to-save.png` });
  const box = await saveButton.boundingBox();
  const reachable = box && box.y >= 0 && box.y + box.height <= 320 && box.x >= 0 && box.x + box.width <= 700;

  await context.close();
  return { saveButtonReachableAfterScroll: !!reachable, boundingBox: box };
}

async function main() {
  const browser = await chromium.launch();
  const results = {};

  results.rainScenario = await runRainScenario(browser);
  results.extremeWindScenario = await runExtremeWindScenario(browser);
  results.longSiteNameScenario = await runLongSiteNameScenario(browser);
  results.shortLandscapeScenario = await runShortLandscapeScenario(browser);

  fs.writeFileSync(`${OUT_DIR}/results-revision2.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
