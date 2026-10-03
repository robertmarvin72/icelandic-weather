// Ticket 432 (#432) — real-browser check of the voice-level split on the
// homepage Weather Voice card. Deterministic /api/* stubs (campsites,
// forecast; /api/me unauthenticated), a real Vite dev server, and DEV-mode
// `[event]` console lines from trackEvent as the only analytics observation.
// This does NOT claim live GA4 ingestion: VITE_GA_MEASUREMENT_ID is unset
// locally, so no GA request can occur; every GA-domain request is still
// watched and must be zero.
//
// Fixtures follow the homepage daily-row contract (src/lib/forecastNormalize.js):
// with no hourly block, daily values are used directly.
//
// Usage: WV_BASE_URL=http://localhost:5173 node outputs/ticket-432-browser-evidence/verify-voice-level.cjs
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.WV_BASE_URL || "http://localhost:5173";
const OUT_DIR = __dirname;
const TODAY = new Date().toISOString().slice(0, 10);
const GA_DOMAIN_PATTERN = /google-analytics\.com|analytics\.google\.com|googletagmanager\.com/;

const SITE_A = { id: "site-a", name: "Thingvellir Test Site", lat: 64.1, lon: -21.9, tier: "free" };
const SITE_B = { id: "site-b", name: "Skaftafell Test Site", lat: 63.99, lon: -16.97, tier: "free" };

// Today's row only drives the card; days 1-6 are fixed mild weather.
const SCENARIOS = {
  extreme_wind: { tmax: 4, windMax: 17, rain: 5, code: 61 }, // serious, wrecked, severity 3
  heavy_rain: { tmax: 10, windMax: 5, rain: 15, code: 63 }, // cautious, sad, severity 2
  strong_wind: { tmax: 10, windMax: 12, rain: 0, code: 0 }, // cautious, struggling, severity 2
  cold_wet: { tmax: 2, windMax: 0, rain: 5, code: 61 }, // cautious, unimpressed, severity 2
  excellent: { tmax: 16, windMax: 0, rain: 0, code: 0 }, // sarcastic control, excellent, severity 0
};

function isoDate(offsetDays) {
  const d = new Date(`${TODAY}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function buildDaily(o) {
  const time = [];
  const tmax = [];
  const tmin = [];
  const precip = [];
  const windMax = [];
  const windGust = [];
  const windDir = [];
  const code = [];
  for (let i = 0; i < 7; i++) {
    time.push(isoDate(i));
    if (i === 0) {
      tmax.push(o.tmax);
      tmin.push(o.tmax - 5);
      precip.push(o.rain);
      windMax.push(o.windMax);
      windGust.push(o.windMax + 2);
      windDir.push(180);
      code.push(o.code);
    } else {
      tmax.push(10);
      tmin.push(5);
      precip.push(0);
      windMax.push(3);
      windGust.push(5);
      windDir.push(180);
      code.push(2);
    }
  }
  return {
    time,
    temperature_2m_max: tmax,
    temperature_2m_min: tmin,
    precipitation_sum: precip,
    windspeed_10m_max: windMax,
    windgusts_10m_max: windGust,
    winddirection_10m_dominant: windDir,
    weathercode: code,
  };
}

async function setupRoutes(page, { siteA, siteB, scenarioA, scenarioB }) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/campsites")) {
      const campsites = siteB ? [siteA, siteB] : [siteA];
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, campsites, tier: "free" }) });
    }
    if (url.includes("/api/forecast")) {
      const lat = Number(new URL(url).searchParams.get("latitude"));
      const isB = siteB && Math.abs(lat - siteB.lat) < 0.01;
      const daily = buildDaily(SCENARIOS[isB ? scenarioB : scenarioA]);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ daily, hourly: { time: [], weathercode: [], precipitation: [], windspeed_10m: [], windgusts_10m: [], temperature_2m: [] } }),
      });
    }
    if (url.includes("/api/me")) return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
}

async function openPage(browser, { viewport, lang, scenarioA, scenarioB, withSiteB }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const events = [];
  const gaRequests = [];
  page.on("request", (req) => {
    if (GA_DOMAIN_PATTERN.test(req.url())) gaRequests.push(req.url());
  });
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("[event]") && text.includes("weather_voice_viewed")) events.push(text);
  });
  await page.addInitScript((l) => {
    localStorage.setItem("lang", JSON.stringify(l));
    localStorage.setItem("theme", JSON.stringify("light"));
  }, lang);
  await setupRoutes(page, { siteA: SITE_A, siteB: withSiteB ? SITE_B : null, scenarioA, scenarioB });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  return { context, page, events, gaRequests };
}

async function readCard(page) {
  return page.evaluate(() => {
    const card = document.querySelector("[data-weather-voice-surface]");
    if (!card) return null;
    const quote = card.querySelector("p.text-\\[19px\\], p.font-semibold");
    const img = card.querySelector("img");
    const buttons = Array.from(card.querySelectorAll("button")).map((b) => b.textContent.trim());
    const rect = (quote || card).getBoundingClientRect();
    return {
      text: quote ? quote.textContent.trim() : null,
      moodAsset: img ? img.getAttribute("src") : null,
      buttons,
      hasShareButton: buttons.some((b) => /Deila Tjaldi|Share Tjaldur/.test(b)),
      quoteFontPx: quote ? parseFloat(getComputedStyle(quote).fontSize) : null,
      quoteWithinViewport: rect.left >= 0 && rect.right <= window.innerWidth + 1,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
}

async function runMatrixCell(browser, { viewportLabel, viewport, lang, scenario }) {
  const { context, page, events, gaRequests } = await openPage(browser, { viewport, lang, scenarioA: scenario });
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const card = await readCard(page);
  const label = `${viewportLabel}-${lang}-${scenario}`;
  await page.screenshot({ path: path.join(OUT_DIR, `${label}.png`) });
  const viewed = events.map((line) => line.replace(/^.*\[event\]\s*/, ""));
  await context.close();
  return { label, viewport: viewportLabel, lang, scenario, card, viewedEvents: viewed, gaRequestCount: gaRequests.length };
}

async function runStaleDialog(browser) {
  // Open the share dialog on a sarcastic episode, then switch the site under
  // the open dialog to a cautious one. The dialog must close and must not
  // retain the sarcastic snapshot.
  const { context, page, events, gaRequests } = await openPage(browser, {
    viewport: { width: 1280, height: 900 },
    lang: "is",
    scenarioA: "excellent",
    scenarioB: "heavy_rain",
    withSiteB: true,
  });
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const before = await readCard(page);
  await page.locator("[data-weather-voice-surface]").getByRole("button", { name: /Deila Tjaldi|Share Tjaldur/ }).click();
  await page.waitForTimeout(300);
  const dialogOpenBefore = (await page.getByRole("dialog").count()) > 0;
  await page.screenshot({ path: path.join(OUT_DIR, "stale-dialog-1-sarcastic-open.png") });

  // The overlay blocks pointer clicks, so the picker is driven by DOM click
  // dispatch while the dialog is genuinely open.
  await page.evaluate(() => document.querySelector('button[title="Velja tjaldsvæði"]').dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await page.waitForTimeout(300);
  await page.evaluate((name) => {
    const panel = document.querySelector('[role="dialog"][aria-label]') && Array.from(document.querySelectorAll('[role="dialog"]')).find((d) => d.textContent.includes(name) && !d.getAttribute("aria-modal"));
    const target = panel ? Array.from(panel.querySelectorAll("button")).find((b) => b.textContent.includes(name)) : null;
    if (target) target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, SITE_B.name);
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  const dialogOpenAfter = (await page.getByRole("dialog").count()) > 0;
  const after = await readCard(page);
  await page.screenshot({ path: path.join(OUT_DIR, "stale-dialog-2-after-cautious-transition.png") });
  await context.close();
  return {
    label: "stale-dialog-desktop-is",
    before,
    dialogOpenBefore,
    dialogOpenAfter,
    after,
    viewedEvents: events.map((line) => line.replace(/^.*\[event\]\s*/, "")),
    gaRequestCount: gaRequests.length,
  };
}

async function main() {
  const browser = await chromium.launch();
  const results = { baseUrl: BASE_URL, todayFixture: TODAY, matrix: [], staleDialog: null };
  const viewports = [
    { viewportLabel: "desktop-1280", viewport: { width: 1280, height: 480 } },
    { viewportLabel: "mobile-390", viewport: { width: 390, height: 480 } },
  ];
  for (const vp of viewports) {
    for (const lang of ["is", "en"]) {
      for (const scenario of Object.keys(SCENARIOS)) {
        results.matrix.push(await runMatrixCell(browser, { ...vp, lang, scenario }));
      }
    }
  }
  results.staleDialog = await runStaleDialog(browser);
  await browser.close();
  fs.writeFileSync(path.join(OUT_DIR, "results.json"), JSON.stringify(results, null, 2));
  for (const r of results.matrix) {
    console.log(`${r.label}: ${r.card ? r.card.text : "NO CARD"} | share=${r.card?.hasShareButton} | events=${r.viewedEvents.join(" ; ")} | ga=${r.gaRequestCount}`);
  }
  console.log(`stale-dialog: open before=${results.staleDialog.dialogOpenBefore} after=${results.staleDialog.dialogOpenAfter} | after text=${results.staleDialog.after?.text} | share=${results.staleDialog.after?.hasShareButton}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
