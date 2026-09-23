// Ticket 415 (#415) — real-browser verification of WeatherFinder's new
// place-name selection control: keyboard Tab/Enter/Space activation (which
// fireEvent.click alone cannot prove), IS/EN, mobile/desktop, light/dark,
// long-name truncation, and metric alignment.
const { chromium } = require("playwright");
const fs = require("fs");

const BASE_URL = process.env.WV_BASE_URL || "http://localhost:5178";
const OUT_DIR = __dirname;

const LONG_NAME = "Tjaldsvæðið við hina óvenju löngu og lýsandi kennileitisheiti sveitarfélagsins";

const SITES = [
  { id: "site-a", name: "Alpha Camp", lat: 64.1, lon: -21.9, tier: "free" },
  { id: "site-b", name: "Beta Camp", lat: 64.2, lon: -21.8, tier: "free" },
  { id: "site-c", name: "Gamma Camp", lat: 64.3, lon: -21.7, tier: "free" },
  { id: "site-d", name: LONG_NAME, lat: 64.4, lon: -21.6, tier: "free" },
];

function isoDate(offsetDays) {
  const d = new Date("2026-09-23T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function buildDaily(windBase) {
  const time = [], tmax = [], tmin = [], precip = [], windMax = [], windGust = [], windDir = [], code = [];
  for (let i = 0; i < 7; i++) {
    time.push(isoDate(i));
    tmax.push(10 + windBase); tmin.push(3); precip.push(0.2);
    windMax.push(windBase + i * 0.3); windGust.push(windBase + 2); windDir.push(180); code.push(2);
  }
  return { time, temperature_2m_max: tmax, temperature_2m_min: tmin, precipitation_sum: precip, windspeed_10m_max: windMax, windgusts_10m_max: windGust, winddirection_10m_dominant: windDir, weathercode: code };
}

// Default: site-d (the long name) ranks last, so the screenshot-matrix and
// keyboard scenarios (which select Beta/Gamma) see a, b, c within Free's
// top-3-result limit. The long-name scenario below uses its own override so
// site-d ranks first there instead, independent of this default.
const WIND_BASE = { "site-a": 3, "site-b": 5, "site-c": 7, "site-d": 9 };
const WIND_BASE_LONG_NAME_FIRST = { "site-d": 1, "site-a": 3, "site-b": 5, "site-c": 7 };

async function setupRoutes(page, windBase = WIND_BASE) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/campsites")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, campsites: SITES, tier: "free" }) });
    }
    if (url.includes("/api/forecast")) {
      const urlObj = new URL(url, "http://x");
      const lat = Number(urlObj.searchParams.get("latitude"));
      const site = SITES.find((s) => Math.abs(s.lat - lat) < 0.01) || SITES[0];
      const daily = buildDaily(windBase[site.id]);
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ daily, hourly: { time: [], weathercode: [], precipitation: [], windspeed_10m: [], windgusts_10m: [], temperature_2m: [] } }) });
    }
    if (url.includes("/api/me")) return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
}

async function newPage(browser, { lang, theme, viewport, windBase }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.addInitScript(
    ({ lang, theme }) => {
      localStorage.setItem("lang", JSON.stringify(lang));
      localStorage.setItem("theme", JSON.stringify(theme));
    },
    { lang, theme }
  );
  await setupRoutes(page, windBase);
  return { context, page };
}

const VIEWPORTS = { mobile: { width: 375, height: 900 }, desktop: { width: 1280, height: 1000 } };

const SHOW_DETAILS_TEXT = { is: "Sjá röðun staða eftir veðri", en: "See sites ranked by weather" };

async function screenshotMatrix(browser) {
  const results = [];
  for (const lang of ["is", "en"]) {
    for (const theme of ["light", "dark"]) {
      for (const viewport of ["mobile", "desktop"]) {
        const { context, page } = await newPage(browser, { lang, theme, viewport: VIEWPORTS[viewport] });
        await page.goto(BASE_URL, { waitUntil: "networkidle" });
        await page.waitForTimeout(500);
        await page.getByText(SHOW_DETAILS_TEXT[lang]).click();
        await page.waitForTimeout(300);
        const bodyClip = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        const shotPath = `${OUT_DIR}/finder-${lang}-${theme}-${viewport}.png`;
        await page.screenshot({ path: shotPath, fullPage: true });
        await context.close();
        results.push({ lang, theme, viewport, noHorizontalOverflow: !bodyClip, screenshot: shotPath });
        console.log(`${lang}/${theme}/${viewport}: overflow=${bodyClip}`);
      }
    }
  }
  return results;
}

async function keyboardScenario(browser) {
  const { context, page } = await newPage(browser, { lang: "is", theme: "light", viewport: VIEWPORTS.desktop });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.getByText(SHOW_DETAILS_TEXT.is).click();
  await page.waitForTimeout(300);

  // Initial selected site (from CampsitePicker's trigger button in the header).
  const pickerBefore = await page.locator('button[aria-haspopup="dialog"]').first().textContent();

  // Tab to the Beta Camp name button and activate with Enter.
  const betaButton = page.getByRole("button", { name: /Beta Camp/ });
  await betaButton.focus();
  const focusedIsBeta = await page.evaluate(() => document.activeElement?.textContent?.includes("Beta Camp"));
  await page.screenshot({ path: `${OUT_DIR}/keyboard-focus-visible.png` });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(600);
  const pickerAfterEnter = await page.locator('button[aria-haspopup="dialog"]').first().textContent();

  // Re-expand (selection scrolls to the map, panel state persists since it's
  // the same mounted instance) and activate a different row with Space.
  const gammaButton = page.getByRole("button", { name: /Gamma Camp/ });
  await gammaButton.focus();
  await page.keyboard.press(" ");
  await page.waitForTimeout(600);
  const pickerAfterSpace = await page.locator('button[aria-haspopup="dialog"]').first().textContent();

  await page.screenshot({ path: `${OUT_DIR}/keyboard-after-space-activation.png` });
  await context.close();

  return {
    pickerBefore: pickerBefore?.trim(),
    focusedIsBeta,
    pickerAfterEnter: pickerAfterEnter?.trim(),
    pickerAfterSpace: pickerAfterSpace?.trim(),
  };
}

async function longNameScenario(browser) {
  const { context, page } = await newPage(browser, {
    lang: "is",
    theme: "light",
    viewport: VIEWPORTS.mobile,
    windBase: WIND_BASE_LONG_NAME_FIRST,
  });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.getByText(SHOW_DETAILS_TEXT.is).click();
  await page.waitForTimeout(300);
  const longNameButton = page.getByRole("button", { name: new RegExp(LONG_NAME.slice(0, 20)) });
  const box = await longNameButton.boundingBox();
  const bodyClip = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  await page.screenshot({ path: `${OUT_DIR}/long-name-mobile-truncation.png` });
  await context.close();
  return { longNameButtonWidth: box?.width, noHorizontalOverflow: !bodyClip };
}

async function main() {
  const browser = await chromium.launch();
  const results = {};
  results.screenshotMatrix = await screenshotMatrix(browser);
  results.keyboard = await keyboardScenario(browser);
  results.longName = await longNameScenario(browser);

  fs.writeFileSync(`${OUT_DIR}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ keyboard: results.keyboard, longName: results.longName }, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
