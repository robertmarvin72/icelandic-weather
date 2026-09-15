// Ticket 411 (#411) — real-browser verification of the three homepage hero
// seasonal variants (winter_weather_aurora, winter_weather, summer_camping)
// across languages, themes, and viewports, using controlled date fixtures
// via Playwright's clock API (page.clock.install/setFixedTime) so the app's
// real getHomepageHeroVariant(new Date()) resolves deterministically.
const { chromium } = require("playwright");
const fs = require("fs");

const BASE_URL = process.env.WV_BASE_URL || "http://localhost:5175";
const OUT_DIR = __dirname;

const SITE = { id: "site-a", name: "Thingvellir Test Site", lat: 64.1, lon: -21.9, tier: "free" };

function isoDate(base, offsetDays) {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function buildDaily(base) {
  const time = [], tmax = [], tmin = [], precip = [], windMax = [], windGust = [], windDir = [], code = [];
  for (let i = 0; i < 7; i++) {
    time.push(isoDate(base, i));
    tmax.push(8); tmin.push(3); precip.push(0.5); windMax.push(4); windGust.push(6); windDir.push(180); code.push(2);
  }
  return { time, temperature_2m_max: tmax, temperature_2m_min: tmin, precipitation_sum: precip, windspeed_10m_max: windMax, windgusts_10m_max: windGust, winddirection_10m_dominant: windDir, weathercode: code };
}

async function setupRoutes(page, baseDate) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/campsites")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, campsites: [SITE], tier: "free" }) });
    }
    if (url.includes("/api/forecast")) {
      const daily = buildDaily(baseDate);
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ daily, hourly: { time: [], weathercode: [], precipitation: [], windspeed_10m: [], windgusts_10m: [], temperature_2m: [] } }) });
    }
    if (url.includes("/api/me")) return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
}

// Fixed at noon UTC on the given date, well clear of any month boundary,
// so results are unaffected by the host machine's own timezone.
const SCENARIOS = [
  { label: "winter-weather-aurora", isoNoon: "2026-01-15T12:00:00.000Z" },
  { label: "winter-weather-april", isoNoon: "2026-04-15T12:00:00.000Z" },
  { label: "summer-camping", isoNoon: "2026-07-04T12:00:00.000Z" },
];

const VIEWPORTS = [
  { label: "mobile", width: 375, height: 800 },
  { label: "desktop", width: 1280, height: 900 },
];

async function runOne(browser, { scenario, lang, theme, viewport }) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  await page.addInitScript(
    ({ lang, theme }) => {
      localStorage.setItem("lang", JSON.stringify(lang));
      localStorage.setItem("theme", JSON.stringify(theme));
    },
    { lang, theme }
  );
  await page.clock.install({ time: new Date(scenario.isoNoon) });
  await setupRoutes(page, scenario.isoNoon.slice(0, 10));
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const heading = page.locator("h1").first();
  const title = await heading.textContent();
  const subtitle = await page.locator("h1").first().locator("xpath=following-sibling::p[1]").textContent();
  const ctaButton = page.getByRole("button", { name: /→/ });
  const ctaText = await ctaButton.textContent();

  const heroBox = await page.locator("header").first().boundingBox();
  const bodyClip = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  const ctaBox = await ctaButton.boundingBox();
  const ctaReachable = !!ctaBox && ctaBox.width > 0 && ctaBox.height > 0;

  const shotPath = `${OUT_DIR}/${scenario.label}-${lang}-${theme}-${viewport.label}.png`;
  await page.screenshot({ path: shotPath });

  await context.close();
  return {
    scenario: scenario.label,
    lang,
    theme,
    viewport: viewport.label,
    title,
    subtitle,
    ctaText,
    noHorizontalOverflow: !bodyClip,
    ctaReachable,
    heroBoxWidthWithinViewport: heroBox ? heroBox.x + heroBox.width <= viewport.width + 1 : null,
    screenshot: shotPath,
  };
}

async function main() {
  const browser = await chromium.launch();
  const results = [];

  for (const scenario of SCENARIOS) {
    for (const lang of ["is", "en"]) {
      for (const theme of ["light", "dark"]) {
        for (const viewport of VIEWPORTS) {
          const r = await runOne(browser, { scenario, lang, theme, viewport });
          results.push(r);
          console.log(`${r.scenario} / ${lang} / ${theme} / ${viewport.label}: "${r.title}"`);
        }
      }
    }
  }

  // Scroll-behavior spot check (unchanged scrollIntoView options), one
  // representative scenario.
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("lang", JSON.stringify("is"));
    localStorage.setItem("theme", JSON.stringify("light"));
  });
  await page.clock.install({ time: new Date("2026-01-15T12:00:00.000Z") });
  await setupRoutes(page, "2026-01-15");
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const before = await page.evaluate(() => window.scrollY);
  await page.getByRole("button", { name: /→/ }).click();
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => window.scrollY);
  const comparisonVisible = await page.locator("#comparison-section").isVisible();
  results.push({ scenario: "scroll-check", scrolled: after !== before, comparisonSectionVisible: comparisonVisible });
  await context.close();

  fs.writeFileSync(`${OUT_DIR}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
