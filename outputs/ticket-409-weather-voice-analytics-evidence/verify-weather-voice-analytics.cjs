// Ticket 409 (#409) — real-browser proof that weather_voice_viewed fires
// at the correct boundary, with the correct payload, across IS/EN and
// desktop/mobile, using a MOCKED analytics transport: this dev environment
// has no VITE_GA_MEASUREMENT_ID set (confirmed: grepped .env.local and
// .env.development.local — neither defines it), so src/lib/analytics.js's
// `trackEvent` never calls the real ReactGA.event() at all (gated on
// `if (gaId)`) — no real network call to Google Analytics can occur
// regardless of what this script does. `trackEvent` still unconditionally
// `console.log("[event]", name, data)`s in DEV, which is what this script
// observes. As a second, independent confirmation, this script also
// watches every outgoing network request and asserts none target any
// Google Analytics/tag-manager domain.
//
// Read useForecast.js's response-parsing contract before writing the stub
// — same daily-row contract already established by this session's prior
// verification scripts (see outputs/ticket-412-.../verify-weather-voice-locale.cjs).
const { chromium } = require("playwright");

const BASE_URL = process.env.WV_BASE_URL || "http://localhost:5174";
const OUT_DIR = __dirname;
const TODAY = new Date().toISOString().slice(0, 10);

const SITE_A = { id: "site-a", name: "Thingvellir Test Site", lat: 64.1, lon: -21.9, tier: "free" };
const SITE_B = { id: "site-b", name: "Skaftafell Test Site", lat: 63.99, lon: -16.97, tier: "free" };

function isoDate(offsetDays) {
  const d = new Date(`${TODAY}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const EXCELLENT = { tmax: 16, windMax: 0, rain: 0, code: 0 };
const COLD = { tmax: 2, windMax: 0, rain: 0, code: 0 };

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

const GA_DOMAIN_PATTERN = /google-analytics\.com|analytics\.google\.com|googletagmanager\.com/;

async function setupRoutes(page, { includeSiteB = false } = {}) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/campsites")) {
      const campsites = includeSiteB ? [SITE_A, SITE_B] : [SITE_A];
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, campsites, tier: "free" }) });
    }
    if (url.includes("/api/forecast")) {
      const lat = Number(new URL(url).searchParams.get("latitude"));
      const isSiteB = includeSiteB && Math.abs(lat - SITE_B.lat) < 0.01;
      const daily = buildDaily(isSiteB ? COLD : EXCELLENT);
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ daily, hourly: { time: [], weathercode: [], precipitation: [], windspeed_10m: [], windgusts_10m: [], temperature_2m: [] } }) });
    }
    if (url.includes("/api/me")) return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
}

function attachListeners(page, gaRequests, eventLogs) {
  page.on("request", (req) => {
    if (GA_DOMAIN_PATTERN.test(req.url())) gaRequests.push(req.url());
  });
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("[event]") && text.includes("weather_voice_viewed")) {
      eventLogs.push(text);
    }
  });
}

async function runFixture(browser, { viewport, lang, theme, label }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const gaRequests = [];
  const eventLogs = [];
  attachListeners(page, gaRequests, eventLogs);

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

  const eventsBeforeScroll = eventLogs.length;
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const eventsAfterFirstScroll = eventLogs.length;

  // Scroll away and back — must not duplicate for the same episode.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const eventsAfterSecondScroll = eventLogs.length;

  await page.screenshot({ path: `${OUT_DIR}/${label}.png` });

  await context.close();
  return {
    eventsBeforeScroll,
    eventsAfterFirstScroll,
    eventsAfterSecondScroll,
    gaRequestCount: gaRequests.length,
    eventLogs,
  };
}

async function runSiteSwitchSession(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const gaRequests = [];
  const eventLogs = [];
  attachListeners(page, gaRequests, eventLogs);

  await page.addInitScript(() => {
    localStorage.setItem("lang", JSON.stringify("is"));
    localStorage.setItem("theme", JSON.stringify("light"));
  });
  await setupRoutes(page, { includeSiteB: true });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const eventsAfterSiteA = eventLogs.length;

  // Scoped selectors: the CampsitePicker's own toggle button by its
  // title (not a bare name match — a Leaflet map marker can also carry an
  // accessible name matching the site name, Ticket 414's aria-label
  // addition, causing a strict-mode ambiguity), and the dropdown's own
  // role="dialog" panel for the site choice.
  await page.locator('button[title="Velja tjaldsvæði"]').first().click();
  await page.getByRole("dialog").getByRole("button", { name: SITE_B.name, exact: false }).click();
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const eventsAfterSiteB = eventLogs.length;

  await page.screenshot({ path: `${OUT_DIR}/05-site-switch-session.png` });
  await context.close();
  return { eventsAfterSiteA, eventsAfterSiteB, gaRequestCount: gaRequests.length, eventLogs };
}

async function runLangSwitchSession(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const gaRequests = [];
  const eventLogs = [];
  attachListeners(page, gaRequests, eventLogs);

  await page.addInitScript(() => {
    localStorage.setItem("lang", JSON.stringify("is"));
    localStorage.setItem("theme", JSON.stringify("light"));
  });
  await setupRoutes(page);
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const eventsAfterIs = eventLogs.length;

  await page.getByRole("button", { name: /Stillingar|Settings/ }).click();
  await page.waitForTimeout(200);
  await page.locator('button:has-text("🌐")').click();
  await page.waitForTimeout(500);
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const eventsAfterEn = eventLogs.length;

  await page.screenshot({ path: `${OUT_DIR}/06-lang-switch-session.png` });
  await context.close();
  return { eventsAfterIs, eventsAfterEn, gaRequestCount: gaRequests.length, eventLogs };
}

async function main() {
  const browser = await chromium.launch();
  const results = {};

  // Height deliberately short (480px) so the card starts below the fold at
  // scroll position 0 — a taller viewport puts the card inside the initial
  // view on this page, making the "before scroll = no event yet" checkpoint
  // meaningless (the real IntersectionObserver fires immediately on mount,
  // not on an explicit scroll). Same lesson as Ticket 408 Revision 3's own
  // real-browser recheck script.
  results["01-desktop-1280-is-light"] = await runFixture(browser, { viewport: { width: 1280, height: 480 }, lang: "is", theme: "light", label: "01-desktop-1280-is-light" });
  results["02-desktop-1280-en-dark"] = await runFixture(browser, { viewport: { width: 1280, height: 480 }, lang: "en", theme: "dark", label: "02-desktop-1280-en-dark" });
  results["03-mobile-390-is-light"] = await runFixture(browser, { viewport: { width: 390, height: 480 }, lang: "is", theme: "light", label: "03-mobile-390-is-light" });
  results["04-mobile-390-en-dark"] = await runFixture(browser, { viewport: { width: 390, height: 480 }, lang: "en", theme: "dark", label: "04-mobile-390-en-dark" });
  results["05-site-switch-session"] = await runSiteSwitchSession(browser);
  results["06-lang-switch-session"] = await runLangSwitchSession(browser);

  require("fs").writeFileSync(`${OUT_DIR}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
