// Ticket 408 (#408), Revision 2 — reproducible real-browser verification
// fixture. Stubs /api/campsites, /api/forecast, /api/me exactly matching
// useCampsites.js/useForecast.js/forecastCache.js's actual request/response
// parsing (read before writing this script — daily.time[0] is set to the
// real current date so the today-only Reykjavik-date gate genuinely
// passes). Run against `npm run dev` on the printed port.
//
// Usage: node outputs/ticket-408-weather-voice-evidence/verify-weather-voice.cjs
const { chromium } = require("playwright");

const BASE_URL = process.env.WV_BASE_URL || "http://localhost:5174";
const TODAY = new Date().toISOString().slice(0, 10);
const OUT_DIR = __dirname;

function isoDate(offsetDays) {
  const d = new Date(`${TODAY}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function buildDaily(todayOverride) {
  const time = [], tmax = [], tmin = [], precip = [], windMax = [], windGust = [], windDir = [], code = [];
  for (let i = 0; i < 7; i++) {
    time.push(isoDate(i));
    if (i === 0) {
      tmax.push(todayOverride.tmax);
      tmin.push(todayOverride.tmax - 5);
      precip.push(todayOverride.rain);
      windMax.push(todayOverride.windMax);
      windGust.push(todayOverride.windMax + 2);
      windDir.push(180);
      code.push(todayOverride.code);
    } else {
      tmax.push(10); tmin.push(5); precip.push(0); windMax.push(3); windGust.push(5); windDir.push(180); code.push(2);
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

const SCENARIOS = {
  extreme_wind: { tmax: 4, windMax: 17, rain: 5, code: 61 },
  heavy_rain: { tmax: 10, windMax: 5, rain: 15, code: 63 },
  cold: { tmax: 2, windMax: 0, rain: 0, code: 0 },
  excellent: { tmax: 16, windMax: 0, rain: 0, code: 0 },
  silent: { tmax: 8, windMax: 4, rain: 0, code: 3 },
};

const SITE_A = { id: "site-a", name: "Thingvellir Test Site", lat: 64.1, lon: -21.9, tier: "free" };
const SITE_B = { id: "site-b", name: "Skaftafell Test Site", lat: 63.99, lon: -16.97, tier: "free" };

async function setupRoutes(page, { scenario, siteBScenario } = {}) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/campsites")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, campsites: [SITE_A, SITE_B], tier: "free" }) });
    }
    if (url.includes("/api/forecast")) {
      const lat = Number(new URL(url).searchParams.get("latitude"));
      const isSiteB = Math.abs(lat - SITE_B.lat) < 0.01;
      const daily = buildDaily(SCENARIOS[isSiteB ? siteBScenario || scenario : scenario]);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ daily, hourly: { time: [], weathercode: [], precipitation: [], windspeed_10m: [], windgusts_10m: [], temperature_2m: [] } }),
      });
    }
    if (url.includes("/api/me")) {
      return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false }) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
}

async function newPage(browser, { width, height, lang = "is", theme = "light", devPro = false }) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.addInitScript(
    ({ lang, theme, devPro }) => {
      localStorage.setItem("lang", JSON.stringify(lang));
      localStorage.setItem("theme", JSON.stringify(theme));
      localStorage.setItem("devPro", JSON.stringify(devPro));
    },
    { lang, theme, devPro }
  );
  return { context, page };
}

async function main() {
  const browser = await chromium.launch();
  const results = [];

  const passes = [
    { name: "01-extreme_wind-320-is-light", scenario: "extreme_wind", width: 320, height: 950, lang: "is", theme: "light" },
    { name: "02-heavy_rain-390-is-light", scenario: "heavy_rain", width: 390, height: 950, lang: "is", theme: "light" },
    { name: "03-cold-390-is-dark", scenario: "cold", width: 390, height: 950, lang: "is", theme: "dark" },
    { name: "04-excellent-768-is-light", scenario: "excellent", width: 768, height: 950, lang: "is", theme: "light" },
    { name: "05-excellent-1280-is-light", scenario: "excellent", width: 1280, height: 950, lang: "is", theme: "light" },
    { name: "06-cold-1280-is-dark", scenario: "cold", width: 1280, height: 950, lang: "is", theme: "dark" },
    { name: "07-silent-390-is-light", scenario: "silent", width: 390, height: 950, lang: "is", theme: "light" },
    { name: "08-excellent-390-is-light-PRO", scenario: "excellent", width: 390, height: 950, lang: "is", theme: "light", devPro: true },
    { name: "09-excellent-390-en-light-SILENT-EN", scenario: "excellent", width: 390, height: 950, lang: "en", theme: "light" },
  ];

  for (const p of passes) {
    const { context, page } = await newPage(browser, p);
    await setupRoutes(page, { scenario: p.scenario });
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const weatherVoiceNode = await page.$("[data-weather-voice-surface]");
    const weatherVoiceText = weatherVoiceNode ? await weatherVoiceNode.innerText() : null;

    await page.screenshot({ path: `${OUT_DIR}/${p.name}.png`, fullPage: false });

    results.push({ name: p.name, scrollWidth, clientWidth, horizontalOverflow: scrollWidth > clientWidth + 1, weatherVoicePresent: !!weatherVoiceNode, weatherVoiceText });
    await context.close();
  }

  // Site-switch verification: A (excellent) -> B (cold), real dropdown interaction.
  {
    const { context, page } = await newPage(browser, { width: 390, height: 950, lang: "is", theme: "light" });
    await setupRoutes(page, { scenario: "excellent", siteBScenario: "cold" });
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT_DIR}/10-site-switch-before-siteA-excellent.png` });
    const beforeText = await page.$eval("[data-weather-voice-surface]", (el) => el.innerText).catch(() => null);

    await page.getByRole("button", { name: SITE_A.name, exact: false }).click();
    await page.getByRole("button", { name: SITE_B.name, exact: false }).click();
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT_DIR}/11-site-switch-after-siteB-cold.png` });
    const afterText = await page.$eval("[data-weather-voice-surface]", (el) => el.innerText).catch(() => null);

    results.push({ name: "site-switch", beforeText, afterText, changedCorrectly: beforeText !== afterText });
    await context.close();
  }

  require("fs").writeFileSync(`${OUT_DIR}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
