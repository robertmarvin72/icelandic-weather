// Ticket 420 (#420) — real-browser check of the expanded personality pools.
// Deterministic /api/* stubs (campsites, forecast; /api/me unauthenticated),
// a real Vite dev server, and a deterministic Math.random that selects a
// chosen target ID from the sorted eligible pool (the selector's own
// uniform-index mapping). Only DEV-mode `[event]` console lines and the DOM
// are observed. No GA4 ingestion is claimed; every GA-domain request must be 0.
//
// Expected text comes from the TEST-ONLY ledger, read here as source text.
// Usage: WV_BASE_URL=http://localhost:5173 node outputs/ticket-420-browser-evidence/verify-expanded-pool.cjs
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const BASE_URL = process.env.WV_BASE_URL || "http://localhost:5173";
const OUT_DIR = __dirname;
const TODAY = new Date().toISOString().slice(0, 10);
const GA_DOMAIN_PATTERN = /google-analytics\.com|analytics\.google\.com|googletagmanager\.com/;

// Ledger text (test-only source), parsed without importing into production code.
const ledgerSrc = fs.readFileSync(path.join(ROOT, "src/test-fixtures/weatherVoiceLedger.js"), "utf8");
const LEDGER = [...ledgerSrc.matchAll(/\{ id: "([^"]+)", condition: "([^"]+)", status: "([^"]+)", is: "((?:[^"\\]|\\.)*)", en: "((?:[^"\\]|\\.)*)"/g)].map((m) => ({
  id: m[1],
  condition: m[2],
  status: m[3],
  is: JSON.parse(`"${m[4]}"`),
  en: JSON.parse(`"${m[5]}"`),
}));
const active = LEDGER.filter((r) => r.status === "retained" || r.status === "new");
const textOf = (id, lang) => {
  const row = LEDGER.find((r) => r.id === id);
  return lang === "is" ? row.is : row.en;
};

const SCENARIOS = {
  good: { tmax: 13, windMax: 0, rain: 0, code: 3 },
  excellent: { tmax: 16, windMax: 0, rain: 0, code: 0 },
  rain: { tmax: 10, windMax: 0, rain: 5, code: 61 },
  cold: { tmax: 2, windMax: 0, rain: 0, code: 0 },
  sun_wind: { tmax: 10, windMax: 8, rain: 0, code: 0 },
  extreme_wind: { tmax: 4, windMax: 17, rain: 5, code: 61 },
  heavy_rain: { tmax: 10, windMax: 5, rain: 15, code: 63 },
};

// Targets: approved verification IDs first, then one more per condition.
const TARGETS = ["good_16", "good_10", "sun_wind_07", "sun_wind_10", "rain_14", "excellent_10", "cold_20"];
const CONTROLS = ["extreme_wind", "heavy_rain"];

function pinFor(targetId) {
  const row = LEDGER.find((r) => r.id === targetId);
  const pool = active.filter((r) => r.condition === row.condition).map((r) => r.id).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const k = pool.indexOf(targetId);
  if (k < 0) throw new Error(`${targetId} not in ${row.condition} pool`);
  return { value: (k + 0.5) / pool.length, poolSize: pool.length, index: k, condition: row.condition };
}

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

const SITE = { id: "site-a", name: "Thingvellir Test Site", lat: 64.1, lon: -21.9, tier: "free" };

async function openPage(browser, { viewport, lang, scenario, pinValue }) {
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
  await page.addInitScript(
    ({ lang, pinValue }) => {
      localStorage.setItem("lang", JSON.stringify(lang));
      localStorage.setItem("theme", JSON.stringify("light"));
      if (pinValue !== null) Math.random = () => pinValue;
    },
    { lang, pinValue }
  );
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/campsites")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, campsites: [SITE], tier: "free" }) });
    }
    if (url.includes("/api/forecast")) {
      const daily = buildDaily(SCENARIOS[scenario]);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ daily, hourly: { time: [], weathercode: [], precipitation: [], windspeed_10m: [], windgusts_10m: [], temperature_2m: [] } }),
      });
    }
    if (url.includes("/api/me")) return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  return { context, page, events, gaRequests };
}

async function readCard(page) {
  return page.evaluate(() => {
    const card = document.querySelector("[data-weather-voice-surface]");
    if (!card) return null;
    const quote = card.querySelector("p.font-semibold");
    const img = card.querySelector("img");
    const buttons = Array.from(card.querySelectorAll("button")).map((b) => b.textContent.trim());
    const rect = (quote || card).getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    return {
      text: quote ? quote.textContent.replace(/^[„“"]+|[„“"]+$/g, "").trim() : null,
      moodAsset: img ? img.getAttribute("src") : null,
      buttons,
      hasShareButton: buttons.some((b) => /Deila Tjaldi|Share Tjaldur/.test(b)),
      quoteFontPx: quote ? parseFloat(getComputedStyle(quote).fontSize) : null,
      quoteWithinViewport: rect.left >= 0 && rect.right <= window.innerWidth + 1,
      quoteClipped: quote ? quote.scrollHeight > quote.clientHeight + 2 : false,
      cardHeightPx: Math.round(cardRect.height),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
}

async function runCell(browser, { viewportLabel, viewport, lang, target, controlOrTarget, withShare }) {
  const scenarioCondition = controlOrTarget === "control" ? target : LEDGER.find((r) => r.id === target).condition;
  const pin = controlOrTarget === "control" ? null : pinFor(target);
  const pinValue = pin ? pin.value : null;
  const scenario = scenarioCondition;
  const { context, page, events, gaRequests } = await openPage(browser, { viewport, lang, scenario, pinValue });
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const card = await readCard(page);
  const label = `${viewportLabel}-${lang}-${target}`;
  await page.screenshot({ path: path.join(OUT_DIR, `${label}-card.png`) });

  let share = null;
  if (withShare && card && card.hasShareButton) {
    await page.locator("[data-weather-voice-surface]").getByRole("button", { name: /Deila Tjaldi|Share Tjaldur/ }).click();
    await page.waitForTimeout(300);
    const choice = page.getByRole("button", { name: /Deila mynd|Share image/ });
    if ((await choice.count()) > 0) await choice.first().click();
    await page.waitForSelector('[role="dialog"] img[src^="blob:"]', { timeout: 15000 }).catch(() => {});
    const preview = await page.evaluate(() => {
      const img = document.querySelector('[role="dialog"] img[src^="blob:"]');
      return img ? { natural: [img.naturalWidth, img.naturalHeight], loaded: img.complete && img.naturalWidth > 0 } : null;
    });
    await page.screenshot({ path: path.join(OUT_DIR, `${label}-share-dialog.png`) });
    share = { preview, dialogOpen: (await page.getByRole("dialog").count()) > 0 };
  }

  const expected = controlOrTarget === "control" ? null : textOf(target, lang);
  const viewed = events.map((line) => line.replace(/^.*\[event\]\s*/, ""));
  await context.close();
  return {
    label,
    viewport: viewportLabel,
    lang,
    target,
    kind: controlOrTarget,
    pin: pin ? { poolSize: pin.poolSize, index: pin.index, condition: pin.condition } : null,
    expectedText: expected,
    textMatchesLedger: expected === null ? null : card?.text === expected,
    card,
    share,
    viewedEvents: viewed,
    gaRequestCount: gaRequests.length,
  };
}

async function main() {
  const browser = await chromium.launch();
  const results = { baseUrl: BASE_URL, todayFixture: TODAY, cells: [] };
  const viewports = [
    { viewportLabel: "desktop-1280", viewport: { width: 1280, height: 900 } },
    { viewportLabel: "mobile-390", viewport: { width: 390, height: 844 } },
  ];
  for (const vp of viewports) {
    for (const lang of ["is", "en"]) {
      for (const target of TARGETS) {
        // Share dialog (image path) checked on mobile for every target; card on both.
        const withShare = vp.viewportLabel === "mobile-390";
        results.cells.push(await runCell(browser, { ...vp, lang, target, controlOrTarget: "target", withShare }));
      }
      for (const control of CONTROLS) {
        results.cells.push(await runCell(browser, { ...vp, lang, target: control, controlOrTarget: "control", withShare: false }));
      }
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT_DIR, "results.json"), JSON.stringify(results, null, 2));
  for (const c of results.cells) {
    console.log(
      `${c.label.padEnd(34)} match=${c.textMatchesLedger} share=${c.card?.hasShareButton} clipped=${c.card?.quoteClipped} overflow=${c.card?.horizontalOverflow} font=${c.card?.quoteFontPx} ga=${c.gaRequestCount} img=${c.share?.preview ? c.share.preview.natural.join("x") : "-"} ev=${c.viewedEvents.length}`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
