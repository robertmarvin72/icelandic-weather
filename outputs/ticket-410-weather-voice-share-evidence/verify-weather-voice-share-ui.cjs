// Ticket 410 (#410) — real-browser proof of the Weather Voice share UI
// end to end: real canvas rendering, a REAL downloaded PNG file (not a
// DOM screenshot), IS/EN, light/dark, and desktop/mobile viewports.
// Read useForecast.js's response-parsing contract before writing this
// stub — same daily-row contract already established by this session's
// prior verification scripts.
const { chromium } = require("playwright");
const fs = require("fs");

const BASE_URL = process.env.WV_BASE_URL || "http://localhost:5174";
const OUT_DIR = __dirname;
const TODAY = new Date().toISOString().slice(0, 10);

const SITE_A = { id: "site-a", name: "Thingvellir Test Site", lat: 64.1, lon: -21.9, tier: "free" };
const EXCELLENT = { tmax: 16, windMax: 0, rain: 0, code: 0 };

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

async function setupRoutes(page) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/campsites")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, campsites: [SITE_A], tier: "free" }) });
    }
    if (url.includes("/api/forecast")) {
      const daily = buildDaily(EXCELLENT);
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ daily, hourly: { time: [], weathercode: [], precipitation: [], windspeed_10m: [], windgusts_10m: [], temperature_2m: [] } }) });
    }
    if (url.includes("/api/me")) return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
}

async function runFixture(browser, { viewport, lang, theme, label, shareButtonText }) {
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  const page = await context.newPage();
  await page.addInitScript(
    ({ lang, theme }) => {
      localStorage.setItem("lang", JSON.stringify(lang));
      localStorage.setItem("theme", JSON.stringify(theme));
    },
    { lang, theme },
  );
  await setupRoutes(page);
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const card = page.locator("[data-weather-voice-surface]");
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const shareButton = card.getByText(shareButtonText, { exact: true });
  const shareButtonPresent = await shareButton.count();
  const result = { shareButtonPresent: shareButtonPresent > 0 };

  if (shareButtonPresent > 0) {
    await shareButton.click();
    await page.waitForTimeout(200);
    const dialog = page.getByRole("dialog");
    result.dialogOpened = (await dialog.count()) > 0;

    // Wait for the real canvas render to finish (preview <img> appears).
    await page.waitForSelector('[role="dialog"] img', { timeout: 8000 }).catch(() => {});
    result.previewImageAppeared = (await dialog.locator("img").count()) > 0;

    await page.screenshot({ path: `${OUT_DIR}/${label}-dialog.png` });

    // Real download via the "Save image" fallback (always available).
    const saveButtonText = lang === "is" ? "Vista mynd" : "Save image";
    const saveButton = dialog.getByText(saveButtonText, { exact: true });
    if ((await saveButton.count()) > 0) {
      const [download] = await Promise.all([page.waitForEvent("download"), saveButton.click()]);
      const savePath = `${OUT_DIR}/${label}-exported.png`;
      await download.saveAs(savePath);
      result.downloadedFile = savePath;
      result.downloadedFileSize = fs.statSync(savePath).size;
    }

    // Keyboard: Escape closes and focus returns to the trigger.
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    result.dialogClosedAfterEscape = (await page.getByRole("dialog").count()) === 0;
    result.focusReturnedToTrigger = await shareButton.evaluate((el) => el === document.activeElement).catch(() => false);
  }

  await context.close();
  return result;
}

async function main() {
  const browser = await chromium.launch();
  const results = {};

  results["01-desktop-1280-is-light"] = await runFixture(browser, { viewport: { width: 1280, height: 900 }, lang: "is", theme: "light", label: "01-desktop-1280-is-light", shareButtonText: "Deila Tjaldi" });
  results["02-desktop-1280-en-dark"] = await runFixture(browser, { viewport: { width: 1280, height: 900 }, lang: "en", theme: "dark", label: "02-desktop-1280-en-dark", shareButtonText: "Share Tjaldur" });
  results["03-mobile-390-is-light"] = await runFixture(browser, { viewport: { width: 390, height: 844 }, lang: "is", theme: "light", label: "03-mobile-390-is-light", shareButtonText: "Deila Tjaldi" });
  results["04-mobile-320-en-dark"] = await runFixture(browser, { viewport: { width: 320, height: 700 }, lang: "en", theme: "dark", label: "04-mobile-320-en-dark", shareButtonText: "Share Tjaldur" });

  fs.writeFileSync(`${OUT_DIR}/results-ui.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
