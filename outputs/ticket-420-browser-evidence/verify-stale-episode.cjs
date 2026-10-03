// Ticket 420 (#420) — stale-episode protection on the expanded library.
// Open the share dialog on a pinned sarcastic episode (good_16, IS, desktop),
// then switch the site under the open dialog to a cautious one (heavy_rain).
// The dialog must close, the card must show the cautious safety text with no
// share button, and the joke snapshot must not survive. Stubs as in
// verify-expanded-pool.cjs. No GA ingestion is claimed.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const BASE_URL = process.env.WV_BASE_URL || "http://localhost:5173";
const OUT_DIR = __dirname;
const TODAY = new Date().toISOString().slice(0, 10);
const GA_DOMAIN_PATTERN = /google-analytics\.com|analytics\.google\.com|googletagmanager\.com/;

const ledgerSrc = fs.readFileSync(path.join(ROOT, "src/test-fixtures/weatherVoiceLedger.js"), "utf8");
const LEDGER = [...ledgerSrc.matchAll(/\{ id: "([^"]+)", condition: "([^"]+)", status: "([^"]+)", is: "((?:[^"\\]|\\.)*)"/g)].map((m) => ({ id: m[1], condition: m[2], status: m[3], is: JSON.parse(`"${m[4]}"`) }));
const pool = LEDGER.filter((r) => r.condition === "good" && (r.status === "retained" || r.status === "new")).map((r) => r.id).sort();
const TARGET = "good_16";
const k = pool.indexOf(TARGET);
const PIN = (k + 0.5) / pool.length;

const SITE_A = { id: "site-a", name: "Thingvellir Test Site", lat: 64.1, lon: -21.9, tier: "free" };
const SITE_B = { id: "site-b", name: "Skaftafell Test Site", lat: 63.99, lon: -16.97, tier: "free" };
const SCEN = {
  good: { tmax: 13, windMax: 0, rain: 0, code: 3 },
  heavy_rain: { tmax: 10, windMax: 5, rain: 15, code: 63 },
};

function isoDate(offsetDays) {
  const d = new Date(`${TODAY}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
function buildDaily(o) {
  const days = [...Array(7).keys()];
  return {
    time: days.map(isoDate),
    temperature_2m_max: days.map((i) => (i === 0 ? o.tmax : 10)),
    temperature_2m_min: days.map((i) => (i === 0 ? o.tmax - 5 : 5)),
    precipitation_sum: days.map((i) => (i === 0 ? o.rain : 0)),
    windspeed_10m_max: days.map((i) => (i === 0 ? o.windMax : 3)),
    windgusts_10m_max: days.map((i) => (i === 0 ? o.windMax + 2 : 5)),
    winddirection_10m_dominant: days.map(() => 180),
    weathercode: days.map((i) => (i === 0 ? o.code : 2)),
  };
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const events = [];
  const gaRequests = [];
  page.on("request", (req) => {
    if (GA_DOMAIN_PATTERN.test(req.url())) gaRequests.push(req.url());
  });
  page.on("console", (msg) => {
    if (msg.text().includes("[event]") && msg.text().includes("weather_voice_viewed")) events.push(msg.text());
  });
  await page.addInitScript(
    ({ pin }) => {
      localStorage.setItem("lang", JSON.stringify("is"));
      localStorage.setItem("theme", JSON.stringify("light"));
      Math.random = () => pin;
    },
    { pin: PIN }
  );
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/campsites")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, campsites: [SITE_A, SITE_B], tier: "free" }) });
    }
    if (url.includes("/api/forecast")) {
      const lat = Number(new URL(url).searchParams.get("latitude"));
      const scen = Math.abs(lat - SITE_B.lat) < 0.01 ? SCEN.heavy_rain : SCEN.good;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ daily: buildDaily(scen), hourly: { time: [], weathercode: [], precipitation: [], windspeed_10m: [], windgusts_10m: [], temperature_2m: [] } }),
      });
    }
    if (url.includes("/api/me")) return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const before = await page.evaluate(() => document.querySelector("[data-weather-voice-surface] p.font-semibold")?.textContent.trim());
  await page.locator("[data-weather-voice-surface]").getByRole("button", { name: /Deila Tjaldi|Share Tjaldur/ }).click();
  await page.waitForTimeout(300);
  const dialogOpenBefore = (await page.getByRole("dialog").count()) > 0;
  await page.screenshot({ path: path.join(OUT_DIR, "stale-1-good16-dialog-open.png") });

  // The overlay blocks pointer clicks, so the picker is driven by DOM click
  // dispatch while the dialog is genuinely open.
  await page.evaluate(() => document.querySelector('button[title="Velja tjaldsvæði"]').dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await page.waitForTimeout(300);
  await page.evaluate((name) => {
    const panel = Array.from(document.querySelectorAll('[role="dialog"]')).find((d) => d.textContent.includes(name) && !d.getAttribute("aria-modal"));
    const target = panel ? Array.from(panel.querySelectorAll("button")).find((b) => b.textContent.includes(name)) : null;
    if (target) target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, SITE_B.name);
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  const after = await page.evaluate(() => {
    const card = document.querySelector("[data-weather-voice-surface]");
    const quote = card?.querySelector("p.font-semibold");
    const buttons = card ? Array.from(card.querySelectorAll("button")).map((b) => b.textContent.trim()) : [];
    return { text: quote ? quote.textContent.trim() : null, hasShareButton: buttons.some((b) => /Deila Tjaldi|Share Tjaldur/.test(b)) };
  });
  const dialogOpenAfter = (await page.getByRole("dialog").count()) > 0;
  await page.screenshot({ path: path.join(OUT_DIR, "stale-2-after-cautious-transition.png") });
  const result = {
    target: TARGET,
    pin: { poolSize: pool.length, index: k, value: PIN },
    before,
    dialogOpenBefore,
    dialogOpenAfter,
    after,
    viewedEvents: events.map((l) => l.replace(/^.*\[event\]\s*/, "")),
    gaRequestCount: gaRequests.length,
  };
  await browser.close();
  fs.writeFileSync(path.join(OUT_DIR, "stale-results.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
