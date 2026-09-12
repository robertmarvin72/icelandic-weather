// Ticket 412 (#412) — real-browser recheck of Weather Voice EN parity and
// mobile visibility. Read useForecast.js/forecastCache.js's response
// parsing contract before writing this stub (same daily-row field
// contract already established by prior tickets' verification scripts in
// this session — see outputs/ticket-408-.../verify-weather-voice.cjs).
//
// Covers: desktop (1280px) + mobile (390px, 320px) x IS/EN, IS -> EN -> IS
// in one session, light+dark theme, and one intentionally silent (ordinary)
// weather case — all with the SAME deterministic site/day, per the
// approved prompt's "reproduce the mobile report with the same
// deterministic weather/site/day and content as desktop."
const { chromium } = require("playwright");

const BASE_URL = process.env.WV_BASE_URL || "http://localhost:5174";
const OUT_DIR = __dirname;
const TODAY = new Date().toISOString().slice(0, 10);

const SITE_A = { id: "site-a", name: "Thingvellir Test Site", lat: 64.1, lon: -21.9, tier: "free" };

function isoDate(offsetDays) {
  const d = new Date(`${TODAY}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// Excellent: tmax>14, windMax<=5, rain<1, CLEAR code (0). Silent: ordinary
// mixed day that the Phase 1 engine does not classify as any condition.
const EXCELLENT = { tmax: 16, windMax: 0, rain: 0, code: 0 };
const SILENT_ORDINARY = { tmax: 8, windMax: 4, rain: 0, code: 3 };

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

async function setupRoutes(page, weatherFixture) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/campsites")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, campsites: [SITE_A], tier: "free" }) });
    }
    if (url.includes("/api/forecast")) {
      const daily = buildDaily(weatherFixture);
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ daily, hourly: { time: [], weathercode: [], precipitation: [], windspeed_10m: [], windgusts_10m: [], temperature_2m: [] } }) });
    }
    if (url.includes("/api/me")) return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
}

async function readCard(page) {
  const card = page.locator("[data-weather-voice-surface]");
  const count = await card.count();
  if (count === 0) return { present: false };

  const box = await card.boundingBox();
  const img = card.locator("img");
  const imgBox = await img.boundingBox().catch(() => null);
  const naturalWidth = await img.evaluate((el) => el.naturalWidth).catch(() => null);
  const naturalHeight = await img.evaluate((el) => el.naturalHeight).catch(() => null);
  const src = await img.getAttribute("src").catch(() => null);
  // The comment paragraph is the second <p> inside the card (first is the
  // "TJALDUR SEGIR" label) — avoids a fragile Tailwind-arbitrary-value CSS
  // selector (`text-[19px]`) that would need bracket-escaping.
  const text = await card.locator("p").nth(1).textContent().catch(() => null);
  const overflowing = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

  return {
    present: true,
    visible: await card.isVisible(),
    boxWidth: box?.width ?? null,
    boxHeight: box?.height ?? null,
    imgWidth: imgBox?.width ?? null,
    imgHeight: imgBox?.height ?? null,
    naturalWidth,
    naturalHeight,
    moodAsset: src,
    text,
    documentOverflowing: overflowing,
  };
}

async function runFixture(browser, { viewport, lang, theme, weatherFixture, label }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.addInitScript(
    ({ lang, theme }) => {
      localStorage.setItem("lang", JSON.stringify(lang));
      localStorage.setItem("theme", JSON.stringify(theme));
    },
    { lang, theme },
  );
  await setupRoutes(page, weatherFixture);
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const beforeScroll = await readCard(page);
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT_DIR}/${label}.png` });
  const afterScroll = await readCard(page);

  await context.close();
  return { beforeScroll, afterScroll };
}

async function runLangToggleSession(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("lang", JSON.stringify("is"));
    localStorage.setItem("theme", JSON.stringify("light"));
  });
  await setupRoutes(page, EXCELLENT);
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const step1_is = await readCard(page);
  await page.screenshot({ path: `${OUT_DIR}/07-toggle-session-1-is.png` });

  // The language toggle lives inside the collapsed "Stillingar"/Settings
  // panel (Toolbar.jsx) — open it once before the button exists in the DOM.
  await page.getByRole("button", { name: /Stillingar|Settings/ }).click();
  await page.waitForTimeout(200);
  const toggle = page.locator('button:has-text("🌐")');
  await toggle.click();
  await page.waitForTimeout(600);
  const step2_en = await readCard(page);
  await page.screenshot({ path: `${OUT_DIR}/08-toggle-session-2-en.png` });

  await toggle.click();
  await page.waitForTimeout(600);
  const step3_is_again = await readCard(page);
  await page.screenshot({ path: `${OUT_DIR}/09-toggle-session-3-is-again.png` });

  await context.close();
  return { step1_is, step2_en, step3_is_again };
}

async function main() {
  const browser = await chromium.launch();
  const results = {};

  results["01-desktop-1280-is-light"] = await runFixture(browser, {
    viewport: { width: 1280, height: 900 }, lang: "is", theme: "light", weatherFixture: EXCELLENT, label: "01-desktop-1280-is-light",
  });
  results["02-desktop-1280-en-dark"] = await runFixture(browser, {
    viewport: { width: 1280, height: 900 }, lang: "en", theme: "dark", weatherFixture: EXCELLENT, label: "02-desktop-1280-en-dark",
  });
  results["03-mobile-390-is-light"] = await runFixture(browser, {
    viewport: { width: 390, height: 844 }, lang: "is", theme: "light", weatherFixture: EXCELLENT, label: "03-mobile-390-is-light",
  });
  results["04-mobile-390-en-dark"] = await runFixture(browser, {
    viewport: { width: 390, height: 844 }, lang: "en", theme: "dark", weatherFixture: EXCELLENT, label: "04-mobile-390-en-dark",
  });
  results["05-mobile-320-is-light"] = await runFixture(browser, {
    viewport: { width: 320, height: 700 }, lang: "is", theme: "light", weatherFixture: EXCELLENT, label: "05-mobile-320-is-light",
  });
  results["06-mobile-320-en-light"] = await runFixture(browser, {
    viewport: { width: 320, height: 700 }, lang: "en", theme: "light", weatherFixture: EXCELLENT, label: "06-mobile-320-en-light",
  });

  results["toggle-session"] = await runLangToggleSession(browser);

  // Intentionally silent (ordinary) weather — the card must be genuinely
  // absent, on both mobile and desktop, in both languages — proving the
  // mobile fix (if any) never forces visibility for weather the engine
  // itself does not classify as comment-worthy.
  results["10-desktop-silent-is"] = await runFixture(browser, {
    viewport: { width: 1280, height: 900 }, lang: "is", theme: "light", weatherFixture: SILENT_ORDINARY, label: "10-desktop-silent-is",
  });
  results["11-mobile-390-silent-en"] = await runFixture(browser, {
    viewport: { width: 390, height: 844 }, lang: "en", theme: "light", weatherFixture: SILENT_ORDINARY, label: "11-mobile-390-silent-en",
  });

  require("fs").writeFileSync(`${OUT_DIR}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
