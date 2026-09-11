// Ticket 408 (#408) Revision 3 — real-browser recheck of the exposure
// lifecycle fix and the site-switch flow, using a REAL IntersectionObserver
// (not a fake) and REAL localStorage, per approved-prompt-v3.md's explicit
// instruction to "recheck one real-browser visibility/site-switch flow and
// preserve evidence." Reuses the same route-stub contract as
// verify-weather-voice.cjs (read useForecast.js/forecastCache.js before
// writing either script).
const { chromium } = require("playwright");

const BASE_URL = process.env.WV_BASE_URL || "http://localhost:5174";
const TODAY = new Date().toISOString().slice(0, 10);
const OUT_DIR = __dirname;

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

const SITE_A = { id: "site-a", name: "Thingvellir Test Site", lat: 64.1, lon: -21.9, tier: "free" };
const SITE_B = { id: "site-b", name: "Skaftafell Test Site", lat: 63.99, lon: -16.97, tier: "free" };
const EXCELLENT = { tmax: 16, windMax: 0, rain: 0, code: 0 };
const COLD = { tmax: 2, windMax: 0, rain: 0, code: 0 };

async function setupRoutes(page) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/campsites")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, campsites: [SITE_A, SITE_B], tier: "free" }) });
    }
    if (url.includes("/api/forecast")) {
      const lat = Number(new URL(url).searchParams.get("latitude"));
      const isSiteB = Math.abs(lat - SITE_B.lat) < 0.01;
      const daily = buildDaily(isSiteB ? COLD : EXCELLENT);
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ daily, hourly: { time: [], weathercode: [], precipitation: [], windspeed_10m: [], windgusts_10m: [], temperature_2m: [] } }) });
    }
    if (url.includes("/api/me")) return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
}

async function main() {
  const browser = await chromium.launch();
  // Short viewport so the card starts below the fold at scrollTop 0 — a
  // 950px viewport put the card inside the initial view on this page,
  // making the "before visibility" checkpoint meaningless (the real
  // IntersectionObserver fired immediately on mount, not on scroll).
  const context = await browser.newContext({ viewport: { width: 390, height: 480 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("lang", JSON.stringify("is"));
    localStorage.setItem("theme", JSON.stringify("light"));
  });
  await setupRoutes(page);

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  // Before any scroll/visibility, the card is rendered (selection ran) but
  // nothing should be recorded yet — proves selection-without-exposure.
  const historyBeforeVisible = await page.evaluate(() => localStorage.getItem("weather_voice_history_v1"));

  // Scroll the real card into view so the REAL browser IntersectionObserver
  // actually fires (not a fake/mocked one).
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const historyAfterVisible = await page.evaluate(() => localStorage.getItem("weather_voice_history_v1"));
  const commentIdSiteA = await page.$eval("[data-weather-voice-surface]", (el) => el.textContent);

  // Scroll back to the top BEFORE switching sites, so the CampsitePicker
  // control is reachable.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);

  // Real-browser site switch: A (excellent) -> B (cold). Discovered during
  // this recheck: selecting a new site triggers the app's own
  // scroll-to-comparison behavior, which scrolls PAST the Weather Voice
  // card's real screen position on its way down — a real, organic
  // intersection event, not a scripted one. So instead of forcing an
  // artificial "not yet visible" checkpoint (which that auto-scroll would
  // immediately falsify), this recheck lets the natural scroll settle and
  // then verifies: (a) the new episode's own record is distinct from the
  // old one (no stale/carried-over identity), (b) toggling the card out of
  // and back into view afterwards does not add a second record for the
  // same (already-recorded) episode (once-only, not just once-so-far).
  await page.getByRole("button", { name: SITE_A.name, exact: false }).click();
  await page.getByRole("button", { name: SITE_B.name, exact: false }).click();
  await page.waitForTimeout(1500);
  const historyAfterSwitchSettled = await page.evaluate(() => localStorage.getItem("weather_voice_history_v1"));
  const commentIdSiteB = await page.$eval("[data-weather-voice-surface]", (el) => el.textContent);
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT_DIR}/12-revision3-site-switch-siteB-cold-visible.png` });

  // Toggle away and back to prove no duplicate write for the same episode.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const historyAfterReToggle = await page.evaluate(() => localStorage.getItem("weather_voice_history_v1"));
  await page.screenshot({ path: `${OUT_DIR}/13-revision3-site-switch-siteB-no-duplicate.png` });

  const parse = (s) => (s ? JSON.parse(s).records : {});
  const keysAfterA = Object.keys(parse(historyAfterVisible));
  const keysAfterSwitch = Object.keys(parse(historyAfterSwitchSettled));
  const keysAfterReToggle = Object.keys(parse(historyAfterReToggle));

  const result = {
    historyBeforeVisible,
    historyAfterVisible,
    recordedOnRealVisibility: historyBeforeVisible === null && historyAfterVisible !== null,
    commentIdSiteA,
    historyAfterSwitchSettled,
    newEpisodeRecordedDistinctFromOld: keysAfterSwitch.length === keysAfterA.length + 1 && keysAfterA.every((k) => keysAfterSwitch.includes(k)),
    commentIdSiteB,
    historyAfterReToggle,
    noDuplicateOnReToggle: keysAfterReToggle.length === keysAfterSwitch.length,
  };
  require("fs").writeFileSync(`${OUT_DIR}/results-revision3.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));

  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
