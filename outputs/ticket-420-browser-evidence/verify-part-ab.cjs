// Ticket 420 (#420) approved prompt v3 — real-browser check for Part A (primary
// personality, including restored long lines) and Part B (heavy-rain
// supplement). Deterministic /api/* stubs; `Math.random` is pinned so that the
// selector picks a known target from its sorted pool (the same uniform-index
// mapping the selector uses). Expected text comes from the TEST-ONLY ledger and
// the supplement registry, read as source text. DEV `[event]` strings and the
// DOM are observed. No GA ingestion is claimed; every GA-domain request must be 0.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const BASE_URL = process.env.WV_BASE_URL || "http://localhost:5173";
const OUT_DIR = path.join(__dirname, "part-ab");
fs.mkdirSync(OUT_DIR, { recursive: true });
const TODAY = new Date().toISOString().slice(0, 10);
const GA_DOMAIN = /google-analytics\.com|analytics\.google\.com|googletagmanager\.com/;

const ledgerSrc = fs.readFileSync(path.join(ROOT, "src/test-fixtures/weatherVoiceLedger.js"), "utf8");
const LEDGER = [...ledgerSrc.matchAll(/\{ id: "([^"]+)", condition: "([^"]+)", status: "([^"]+)", is: "((?:[^"\\]|\\.)*)", en: "((?:[^"\\]|\\.)*)"/g)].map((m) => ({
  id: m[1],
  condition: m[2],
  status: m[3],
  is: JSON.parse(`"${m[4]}"`),
  en: JSON.parse(`"${m[5]}"`),
}));
const PRIMARY = LEDGER.filter((r) => r.status === "retained" || r.status === "new");
const SUPP_SRC = fs.readFileSync(path.join(ROOT, "src/i18n/weatherVoice/supplement.js"), "utf8");
const SUPPLEMENTS = [...SUPP_SRC.matchAll(/id: "([^"]+)",[\s\S]*?text_is: "([^"]+)",\s*text_en: "([^"]+)"/g)].map((m) => ({ id: m[1], is: m[2], en: m[3] }));
if (SUPPLEMENTS.length !== 3) throw new Error(`expected 3 supplements, parsed ${SUPPLEMENTS.length}`);
const SAFETY_SRC = fs.readFileSync(path.join(ROOT, "src/i18n/weatherVoice/safety.js"), "utf8");
const SAFETY = {};
for (const m of SAFETY_SRC.matchAll(/message_id: "([^"]+)",\s*condition: "([^"]+)",\s*voice_level: "([^"]+)",\s*text_is: "((?:[^"\\]|\\.)*)",\s*text_en: "((?:[^"\\]|\\.)*)"/g)) {
  SAFETY[m[1]] = { is: JSON.parse(`"${m[4]}"`), en: JSON.parse(`"${m[5]}"`) };
}

const SCENARIOS = {
  good: { tmax: 13, windMax: 0, rain: 0, code: 3 },
  excellent: { tmax: 16, windMax: 0, rain: 0, code: 0 },
  rain: { tmax: 10, windMax: 0, rain: 5, code: 61 },
  cold: { tmax: 2, windMax: 0, rain: 0, code: 0 },
  sun_wind: { tmax: 10, windMax: 8, rain: 0, code: 0 },
  extreme_wind: { tmax: 4, windMax: 17, rain: 5, code: 61 },
  strong_wind: { tmax: 10, windMax: 12, rain: 0, code: 0 },
  cold_wet: { tmax: 2, windMax: 0, rain: 5, code: 61 },
  heavy_rain: { tmax: 10, windMax: 5, rain: 15, code: 63 },
};

const PRIMARY_TARGETS = ["good_16", "good_10", "sun_wind_07", "sun_wind_10", "rain_14", "rain_10", "cold_24", "excellent_10"];
const SUPP_TARGETS = ["rain_heavy_24", "rain_heavy_25", "rain_heavy_29"];
const CONTROLS = ["extreme_wind", "strong_wind", "cold_wet"];

function pinForPrimary(id) {
  const row = LEDGER.find((r) => r.id === id);
  const pool = PRIMARY.filter((r) => r.condition === row.condition).map((r) => r.id).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const k = pool.indexOf(id);
  if (k < 0) throw new Error(`${id} not in ${row.condition} pool`);
  return { value: (k + 0.5) / pool.length, poolSize: pool.length, index: k, condition: row.condition };
}
function pinForSupplement(id) {
  const pool = SUPPLEMENTS.map((s) => s.id).sort();
  const k = pool.indexOf(id);
  return { value: (k + 0.5) / pool.length, poolSize: pool.length, index: k };
}
const primaryText = (id, lang) => {
  const row = LEDGER.find((r) => r.id === id);
  return lang === "is" ? row.is : row.en;
};
const supplementText = (id, lang) => {
  const s = SUPPLEMENTS.find((x) => x.id === id);
  return lang === "is" ? s.is : s.en;
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
const SITE_A = { id: "site-a", name: "Thingvellir Test Site", lat: 64.1, lon: -21.9, tier: "free" };
const SITE_B = { id: "site-b", name: "Skaftafell Test Site", lat: 63.99, lon: -16.97, tier: "free" };

async function openPage(browser, { viewport, lang, scenarioA, scenarioB = null, pin = null }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const events = [];
  const ga = [];
  page.on("request", (req) => {
    if (GA_DOMAIN.test(req.url())) ga.push(req.url());
  });
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("[event]") && (text.includes("weather_voice_viewed") || text.includes("weather_voice_supplement_viewed"))) events.push(text);
  });
  await page.addInitScript(
    ({ lang, pin }) => {
      localStorage.setItem("lang", JSON.stringify(lang));
      localStorage.setItem("theme", JSON.stringify("light"));
      if (pin !== null) Math.random = () => pin;
    },
    { lang, pin }
  );
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/campsites")) {
      const campsites = scenarioB ? [SITE_A, SITE_B] : [SITE_A];
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, campsites, tier: "free" }) });
    }
    if (url.includes("/api/forecast")) {
      const lat = Number(new URL(url).searchParams.get("latitude"));
      const isB = scenarioB && Math.abs(lat - SITE_B.lat) < 0.01;
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
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  return { context, page, events, ga };
}

// Reads the warning and the supplement, and their order and visual weight.
async function readCard(page) {
  return page.evaluate(() => {
    const card = document.querySelector("[data-weather-voice-surface]");
    if (!card) return null;
    const quote = card.querySelector("p.font-semibold");
    const supp = card.querySelector("[data-weather-voice-supplement]");
    const img = card.querySelector("img");
    const buttons = Array.from(card.querySelectorAll("button")).map((b) => b.textContent.trim());
    const quoteRect = quote ? quote.getBoundingClientRect() : null;
    const suppRect = supp ? supp.getBoundingClientRect() : null;
    const order = quote && supp ? quote.compareDocumentPosition(supp) & Node.DOCUMENT_POSITION_FOLLOWING : null;
    return {
      text: quote ? quote.textContent.replace(/^[„“"]+|[„“"]+$/g, "").trim() : null,
      moodAsset: img ? img.getAttribute("src") : null,
      supplement: supp ? { id: supp.getAttribute("data-weather-voice-supplement"), text: supp.textContent.trim(), fontPx: parseFloat(getComputedStyle(supp).fontSize) } : null,
      quoteFontPx: quote ? parseFloat(getComputedStyle(quote).fontSize) : null,
      supplementFollowsWarning: order,
      supplementInViewportFraction: suppRect
        ? Math.max(0, Math.min(suppRect.bottom, window.innerHeight) - Math.max(suppRect.top, 0)) / Math.max(suppRect.height, 1)
        : null,
      hasShareButton: buttons.some((b) => /Deila Tjaldi|Share Tjaldur/.test(b)),
      buttons,
      quoteClipped: quote ? quote.scrollHeight > quote.clientHeight + 2 : false,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      quoteRect: quoteRect ? { top: Math.round(quoteRect.top), bottom: Math.round(quoteRect.bottom) } : null,
    };
  });
}

function viewedNames(events) {
  return events.map((line) => line.replace(/^.*\[event\]\s*/, ""));
}

async function primaryCell(browser, { vp, lang, target }) {
  const pin = pinForPrimary(target);
  const { context, page, events, ga } = await openPage(browser, { viewport: vp.viewport, lang, scenarioA: pin.condition, pin: pin.value });
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const card = await readCard(page);
  const label = `${vp.label}-${lang}-${target}`;
  await page.screenshot({ path: path.join(OUT_DIR, `${label}-card.png`) });
  let share = null;
  if (vp.label === "mobile-390" && card?.hasShareButton) {
    await page.locator("[data-weather-voice-surface]").getByRole("button", { name: /Deila Tjaldi|Share Tjaldur/ }).click();
    await page.waitForTimeout(300);
    const choice = page.getByRole("button", { name: /Deila mynd|Share image/ });
    if ((await choice.count()) > 0) await choice.first().click();
    await page.waitForSelector('[role="dialog"] img[src^="blob:"]', { timeout: 15000 }).catch(() => {});
    share = await page.evaluate(() => {
      const img = document.querySelector('[role="dialog"] img[src^="blob:"]');
      return img ? { natural: [img.naturalWidth, img.naturalHeight], loaded: img.complete && img.naturalWidth > 0 } : null;
    });
    await page.screenshot({ path: path.join(OUT_DIR, `${label}-share-dialog.png`) });
  }
  await context.close();
  return {
    kind: "primary",
    label,
    viewport: vp.label,
    lang,
    target,
    expected: primaryText(target, lang),
    textMatches: card?.text === primaryText(target, lang),
    card,
    share,
    viewed: viewedNames(events),
    ga: ga.length,
  };
}

async function supplementCell(browser, { vp, lang, target }) {
  const pin = pinForSupplement(target);
  const { context, page, events, ga } = await openPage(browser, { viewport: vp.viewport, lang, scenarioA: "heavy_rain", pin: pin.value });
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const card = await readCard(page);
  const label = `${vp.label}-${lang}-${target}`;
  await page.screenshot({ path: path.join(OUT_DIR, `${label}-card.png`) });
  await context.close();
  return {
    kind: "supplement",
    label,
    viewport: vp.label,
    lang,
    target,
    expectedWarning: SAFETY.safety_heavy_rain[lang],
    expectedSupplement: supplementText(target, lang),
    warningMatches: card?.text === SAFETY.safety_heavy_rain[lang],
    supplementMatches: card?.supplement?.text === supplementText(target, lang),
    supplementAfterWarning: card?.supplementFollowsWarning === 4 || card?.supplementFollowsWarning === true,
    supplementSmallerThanWarning: card?.supplement ? card.supplement.fontPx < card.quoteFontPx : null,
    card,
    share: card?.hasShareButton,
    viewed: viewedNames(events),
    ga: ga.length,
  };
}

async function controlCell(browser, { vp, lang, control }) {
  const { context, page, events, ga } = await openPage(browser, { viewport: vp.viewport, lang, scenarioA: control });
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const card = await readCard(page);
  await context.close();
  return { kind: "control", label: `${vp.label}-${lang}-${control}`, viewport: vp.label, lang, control, card, share: card?.hasShareButton, supplementPresent: !!card?.supplement, viewed: viewedNames(events), ga: ga.length };
}

// Small viewport: the supplement starts partly visible. Partial is not an exposure.
async function partialVisibilityCell(browser) {
  const target = "rain_heavy_25";
  const pin = pinForSupplement(target);
  const { context, page, events } = await openPage(browser, { viewport: { width: 390, height: 520 }, lang: "en", scenarioA: "heavy_rain", pin: pin.value });
  // Place the supplement's top edge near the bottom of the viewport: partly visible.
  await page.evaluate(() => {
    const s = document.querySelector("[data-weather-voice-supplement]");
    const top = s.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top - (window.innerHeight - 6));
  });
  await page.waitForTimeout(700);
  const partial = await readCard(page);
  await page.screenshot({ path: path.join(OUT_DIR, "partial-visibility-mobile-390-en-rain_heavy_25.png") });
  const partialViewed = viewedNames(events).filter((e) => e.includes("weather_voice_supplement_viewed")).length;
  await page.evaluate(() => {
    const s = document.querySelector("[data-weather-voice-supplement]");
    const top = s.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top - 60);
  });
  await page.waitForTimeout(900);
  const full = await readCard(page);
  const fullViewed = viewedNames(events).filter((e) => e.includes("weather_voice_supplement_viewed")).length;
  await context.close();
  return { kind: "partial", target, partialFraction: partial.supplementInViewportFraction, supplementEventsWhilePartial: partialViewed, supplementEventsAfterFull: fullViewed, fullFraction: full.supplementInViewportFraction };
}

// Language transition IS -> EN on a heavy-rain episode (toggle, not reload).
async function languageTransition(browser) {
  const pin = pinForSupplement("rain_heavy_24");
  const { context, page, events } = await openPage(browser, { viewport: { width: 1280, height: 900 }, lang: "is", scenarioA: "heavy_rain", pin: pin.value });
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const before = await readCard(page);
  const settings = page.getByRole("button", { name: /Stillingar|Settings/ }).first();
  if ((await settings.count()) > 0) await settings.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => (x.textContent || "").trim().startsWith("🌐"));
    if (!b) throw new Error("language toggle not found");
    b.click();
  });
  await page.waitForTimeout(900);
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const after = await readCard(page);
  await page.screenshot({ path: path.join(OUT_DIR, "lang-transition-is-to-en.png") });
  await context.close();
  return { kind: "lang-transition", before: before?.supplement?.text ?? null, after: after?.supplement?.text ?? null, warningAfter: after?.text ?? null, viewed: viewedNames(events) };
}

// Site transition: heavy-rain site A to a sarcastic site B; the supplement must go.
async function siteTransition(browser) {
  const pin = pinForSupplement("rain_heavy_29");
  const { context, page, events } = await openPage(browser, { viewport: { width: 1280, height: 900 }, lang: "is", scenarioA: "heavy_rain", scenarioB: "good", pin: pin.value });
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const before = await readCard(page);
  await page.locator('button[title="Velja tjaldsvæði"]').first().click();
  await page.getByRole("dialog").getByRole("button", { name: SITE_B.name, exact: false }).click();
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const after = await readCard(page);
  await context.close();
  return { kind: "site-transition", before: { warning: before?.text, supplement: before?.supplement?.text ?? null }, after: { text: after?.text, supplement: after?.supplement?.text ?? null, share: after?.hasShareButton }, viewed: viewedNames(events) };
}

// Stale dialog: open the share dialog on a sarcastic episode, then switch under it to heavy rain.
async function staleDialog(browser) {
  const pin = pinForPrimary("good_16");
  const { context, page, events } = await openPage(browser, { viewport: { width: 1280, height: 900 }, lang: "is", scenarioA: "good", scenarioB: "heavy_rain", pin: pin.value });
  await page.locator("[data-weather-voice-surface]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.locator("[data-weather-voice-surface]").getByRole("button", { name: /Deila Tjaldi|Share Tjaldur/ }).click();
  await page.waitForTimeout(300);
  const openBefore = (await page.getByRole("dialog").count()) > 0;
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
  const openAfter = (await page.getByRole("dialog").count()) > 0;
  const after = await readCard(page);
  await page.screenshot({ path: path.join(OUT_DIR, "stale-dialog-to-heavy-rain.png") });
  await context.close();
  return { kind: "stale-dialog", openBefore, openAfter, after: { text: after?.text, supplement: after?.supplement?.text ?? null, share: after?.hasShareButton }, viewed: viewedNames(events) };
}

async function main() {
  const browser = await chromium.launch();
  const results = { baseUrl: BASE_URL, today: TODAY, primary: [], supplement: [], controls: [], extra: {} };
  const vps = [
    { label: "desktop-1280", viewport: { width: 1280, height: 900 } },
    { label: "mobile-390", viewport: { width: 390, height: 844 } },
  ];
  for (const vp of vps) {
    for (const lang of ["is", "en"]) {
      for (const target of PRIMARY_TARGETS) results.primary.push(await primaryCell(browser, { vp, lang, target }));
      for (const target of SUPP_TARGETS) results.supplement.push(await supplementCell(browser, { vp, lang, target }));
      for (const control of CONTROLS) results.controls.push(await controlCell(browser, { vp, lang, control }));
    }
  }
  results.extra.partial = await partialVisibilityCell(browser);
  results.extra.languageTransition = await languageTransition(browser);
  results.extra.siteTransition = await siteTransition(browser);
  results.extra.staleDialog = await staleDialog(browser);
  await browser.close();
  fs.writeFileSync(path.join(OUT_DIR, "results.json"), JSON.stringify(results, null, 2));
  const pr = results.primary;
  console.log(`primary cells ${pr.length}: text match ${pr.filter((c) => c.textMatches).length}; share on mobile ${pr.filter((c) => c.share && c.share.loaded).length}/${pr.filter((c) => c.viewport === "mobile-390").length}`);
  const sp = results.supplement;
  console.log(`supplement cells ${sp.length}: warning match ${sp.filter((c) => c.warningMatches).length}; supplement match ${sp.filter((c) => c.supplementMatches).length}; after warning ${sp.filter((c) => c.supplementAfterWarning).length}; smaller ${sp.filter((c) => c.supplementSmallerThanWarning).length}; share ${sp.filter((c) => c.share).length}`);
  console.log(`controls ${results.controls.length}: share ${results.controls.filter((c) => c.share).length}; supplement ${results.controls.filter((c) => c.supplementPresent).length}`);
  console.log(`extra: partial ${JSON.stringify(results.extra.partial)}`);
  console.log(`ga requests total: ${[...pr, ...sp, ...results.controls].reduce((a, c) => a + c.ga, 0)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
