// Ticket 414 (#414) — real-browser recheck of the Aurora color/legend fix:
// excellent -> purple, good -> green, fair -> yellow, consistent across the
// status pill, map markers/clusters, and legend; short IS/EN legend labels
// (Frábær/Góð/Sæmileg, Excellent/Good/Fair) without losing the longer
// descriptive labels in popups; and the excellent status pill's own
// accurate label (not "Good conditions" in purple).
//
// Read useAuroraDecision.js/auroraDecisionClassify.js before writing this
// stub — POST /api/aurora-decision, body shape { ok, status, best,
// alternatives, excluded, warnings, auroraCache, viewingWindow }, matching
// NorthernLightsCard.test.jsx's own successBody() fixture shape exactly.
const { chromium } = require("playwright");

const BASE_URL = process.env.WV_BASE_URL || "http://localhost:5174";
const OUT_DIR = __dirname;

const SITE_A = { id: "site-a", name: "Thingvellir Test Site", lat: 64.1, lon: -21.9, tier: "free" };

const EXCELLENT_LOC = { locationId: "loc-excellent", name: "Þingvellir", lat: 64.25, lon: -21.13, score: 92, band: "excellent", reasons: ["meaningful_activity", "clear_sky"], flags: ["national_reference_times"] };
const GOOD_LOC = { locationId: "loc-good", name: "Vík í Mýrdal", lat: 63.4, lon: -19.0, score: 70, band: "good", reasons: ["meaningful_activity", "partial_cloud"], flags: ["national_reference_times"] };
const FAIR_LOC = { locationId: "loc-fair", name: "Akureyri", lat: 65.68, lon: -18.09, score: 45, band: "fair", reasons: ["low_activity", "partial_cloud"], flags: ["national_reference_times"] };

function auroraDecisionBody() {
  return {
    ok: true,
    evening: new Date().toISOString().slice(0, 10),
    auroraCache: { state: "fresh", sourceFetchedAt: new Date().toISOString(), ageMinutes: 10 },
    viewingWindow: { start: "2026-01-01T22:00:00.000Z", end: "2026-01-02T05:00:00.000Z" },
    status: "success",
    best: EXCELLENT_LOC,
    alternatives: [GOOD_LOC, FAIR_LOC],
    excluded: [],
    warnings: [],
  };
}

async function setupRoutes(page) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/campsites")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, campsites: [SITE_A], tier: "free" }) });
    }
    if (url.includes("/api/aurora-decision")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(auroraDecisionBody()) });
    }
    if (url.includes("/api/forecast")) {
      const time = [], tmax = [], tmin = [], precip = [], windMax = [], windGust = [], windDir = [], code = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setUTCDate(d.getUTCDate() + i);
        time.push(d.toISOString().slice(0, 10));
        tmax.push(10); tmin.push(5); precip.push(0); windMax.push(3); windGust.push(5); windDir.push(180); code.push(2);
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ daily: { time, temperature_2m_max: tmax, temperature_2m_min: tmin, precipitation_sum: precip, windspeed_10m_max: windMax, windgusts_10m_max: windGust, winddirection_10m_dominant: windDir, weathercode: code }, hourly: { time: [], weathercode: [], precipitation: [], windspeed_10m: [], windgusts_10m: [], temperature_2m: [] } }) });
    }
    if (url.includes("/api/me")) return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
}

async function preparePage(context, { lang, theme }) {
  const page = await context.newPage();
  await page.addInitScript(
    ({ lang, theme }) => {
      localStorage.setItem("lang", JSON.stringify(lang));
      localStorage.setItem("theme", JSON.stringify(theme));
      localStorage.setItem("devPro", JSON.stringify(true)); // Pro, to reach map/legend/details
    },
    { lang, theme },
  );
  await setupRoutes(page);
  return page;
}

async function captureFixture(browser, { viewport, lang, theme, label }) {
  const context = await browser.newContext({ viewport });
  const page = await preparePage(context, { lang, theme });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const card = page.locator('[data-testid="nl-card"]');
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const results = {};

  // Status pill: excellent must show its OWN label, not the "good" one.
  const pillLocator = card.locator('[data-testid="nl-status-pill"]');
  results.pillText = await pillLocator.textContent().catch(() => null);
  results.pillClass = await pillLocator.getAttribute("class").catch(() => null);

  await page.screenshot({ path: `${OUT_DIR}/${label}-01-card-collapsed.png` });

  // Expand details (Pro) to reach the qualifying list + map + legend. Best
  // band is "excellent" -> isGood=true -> the button reads nlCtaGood
  // ("Sjá bestu staðina" / "See the best spots"), not nlCtaFair/nlDetailsShow.
  const detailsButton = card.getByRole("button", { name: /Sjá bestu staðina|See the best spots/ }).first();
  if (await detailsButton.count()) {
    await detailsButton.click();
    await page.waitForTimeout(600);
    // Scroll the (lazy, IntersectionObserver-gated) map into view so it mounts.
    const mapContainer = card.locator('[data-testid="nl-map-container"]');
    if (await mapContainer.count()) {
      await mapContainer.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1200);
    }
  }

  await page.screenshot({ path: `${OUT_DIR}/${label}-02-card-expanded.png`, fullPage: true });

  const legend = page.locator('[data-testid="aurora-legend"]');
  results.legendVisible = (await legend.count()) > 0;
  results.legendText = results.legendVisible ? await legend.textContent() : null;

  results.noHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  results.pillNoOverflow = await pillLocator.evaluate((el) => el.scrollWidth <= el.clientWidth + 1).catch(() => null);

  await context.close();
  return results;
}

async function main() {
  const browser = await chromium.launch();
  const runs = [
    { viewport: { width: 390, height: 844 }, lang: "is", theme: "light", label: "01-mobile-is-light" },
    { viewport: { width: 390, height: 844 }, lang: "en", theme: "dark", label: "02-mobile-en-dark" },
    { viewport: { width: 1280, height: 900 }, lang: "is", theme: "light", label: "03-desktop-is-light" },
    { viewport: { width: 1280, height: 900 }, lang: "en", theme: "dark", label: "04-desktop-en-dark" },
  ];

  const results = {};
  for (const run of runs) {
    results[run.label] = await captureFixture(browser, run);
  }

  require("fs").writeFileSync(`${OUT_DIR}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
