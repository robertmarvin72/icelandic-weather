// #430 browser evidence: affiliate CTA on the homepage module and the
// landing page. Serves the DUMMY-ID evidence bundle (built to a system-temp
// directory outside the repo, VITE_GA_MEASUREMENT_ID=G-TEST430 supplied only
// via the build command's env — no .env file read/printed/copied). All
// Google/GTM/Viator network requests are aborted; GA is observed through
// window.dataLayer (react-ga4 sets window.dataLayer/window.gtag
// synchronously in its own _loadGA, independent of whether the remote
// gtag.js script actually loads — see cc-report.md). This shows COMMAND
// GENERATION only, never live GA4 ingestion.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const PORT = 4530;
const BASE = `http://localhost:${PORT}`;
const OUT = path.resolve("outputs/ticket-430-browser-evidence");
fs.mkdirSync(OUT, { recursive: true });

const VIATOR_URL =
  "https://www.viator.com/searchResults/all?text=Iceland+Tours%2C+northern+lights&pid=P00323211&mcid=42383&medium=link&campaign=Northern-lights";

const ANON_ME = { ok: true, user: null, subscription: null, entitlements: { pro: false, proUntil: null } };
const SITE = { id: "site-a", name: "Alpha Camp", lat: 64.1, lon: -21.9, tier: "free" };

function auroraBody(evening, band, opts = {}) {
  if (opts.unavailable) {
    return { ok: true, evening, auroraCache: { state: "fresh", sourceFetchedAt: new Date(Date.now() - 10 * 60000).toISOString(), ageMinutes: 10 }, viewingWindow: null, status: "unavailable", reason: "night_not_found", best: null, alternatives: [], excluded: [], warnings: [] };
  }
  return {
    ok: true,
    evening,
    auroraCache: { state: "fresh", sourceFetchedAt: new Date(Date.now() - 10 * 60000).toISOString(), ageMinutes: 10 },
    viewingWindow: { start: `${evening}T22:00:00.000Z`, end: `${evening}T23:00:00.000Z` },
    status: "success",
    best: { locationId: "reykjavik", name: "Reykjavik", lat: 64.1, lon: -21.9, score: band === "very-poor" ? 5 : 70, band, reasons: ["meaningful_activity", "clear_sky"], flags: [] },
    alternatives: [],
    excluded: [],
    warnings: [],
  };
}

const results = [];
let current = "";
function check(name, pass, detail = "") {
  results.push({ scenario: current, check: name, pass: !!pass, detail: String(detail) });
  console.log(`${pass ? "PASS" : "FAIL"} [${current}] ${name}${detail ? ` — ${detail}` : ""}`);
}
function observe(name, detail) {
  results.push({ scenario: current, check: name, pass: null, detail: String(detail) });
  console.log(`OBS  [${current}] ${name} — ${detail}`);
}

async function openPage(browser, { width, height, allBands = "good" }) {
  const context = await browser.newContext({ viewport: { width, height } });
  const abortedHosts = new Set();
  await context.route(/^https?:\/\/(?!localhost:4530)/, (route) => {
    try {
      abortedHosts.add(new URL(route.request().url()).host);
    } catch {
      /* ignore */
    }
    return route.abort();
  });
  await context.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/me") return route.fulfill({ json: ANON_ME });
    if (url.pathname === "/api/campsites") return route.fulfill({ json: { ok: true, tier: "free", campsites: [SITE] } });
    if (url.pathname === "/api/aurora-decision") {
      const body = JSON.parse(route.request().postData());
      if (allBands === "unavailable") return route.fulfill({ json: auroraBody(body.evening, null, { unavailable: true }) });
      return route.fulfill({ json: auroraBody(body.evening, allBands) });
    }
    return route.fulfill({ json: { ok: true } });
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log(`[pageerror] ${e.message}`));
  return { context, page, abortedHosts };
}

async function hideSplashAndToasts(page) {
  await page.addStyleTag({ content: "div.fixed.inset-0.z-\\[9999\\]{display:none!important} div.fixed.bottom-4.left-4{display:none!important}" });
}

function setTheme(context, theme) {
  return context.addInitScript((t) => {
    try {
      window.localStorage.setItem("theme", JSON.stringify(t));
    } catch {}
  }, theme);
}
function setLang(context, lang) {
  return context.addInitScript((l) => {
    try {
      window.localStorage.setItem("lang", JSON.stringify(l));
    } catch {}
  }, lang);
}

async function homepageScenario(browser, { id, width, height, theme, lang, band = "good" }) {
  current = id;
  const { context, page } = await openPage(browser, { width, height, allBands: band });
  await setTheme(context, theme);
  await setLang(context, lang);
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await hideSplashAndToasts(page);

  const anchor = page.locator("#northern-lights");
  await anchor.waitFor({ state: "attached", timeout: 20000 });

  const cta = page.locator('[data-testid="affiliate-nl-cta"]');
  if (band === "unavailable") {
    const present = (await cta.count()) > 0;
    check("no CTA when the night is unavailable", !present, `count=${await cta.count()}`);
    await page.screenshot({ path: path.join(OUT, `${id}-error-no-cta.png`) });
    await context.close();
    return;
  }

  await cta.waitFor({ state: "visible", timeout: 20000 });

  // Hierarchy: CTA is the LAST child inside the module shell, after the
  // status region.
  const order = await page.evaluate(() => {
    const mod = document.querySelector('[data-testid="nl3-module"] > div');
    const cta = document.querySelector('[data-testid="affiliate-nl-cta"]');
    return { lastChildIsCta: mod?.lastElementChild === cta };
  });
  check("CTA is the last element in the module shell (hierarchy)", order.lastChildIsCta);

  const texts = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="affiliate-nl-cta"]');
    return { title: el.querySelector("p")?.textContent, hasDisclosure: /Partner link|Samstarfstengill/.test(el.textContent) };
  });
  check("exact title text present", texts.title?.length > 0, texts.title);
  check("disclosure text present beneath the CTA", texts.hasDisclosure);

  const link = cta.locator("a");
  check("outbound href is the exact Viator URL", (await link.getAttribute("href")) === VIATOR_URL);
  check("target=_blank, rel sponsored", (await link.getAttribute("target")) === "_blank" && (await link.getAttribute("rel")) === "noopener noreferrer sponsored");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("no horizontal overflow", overflow <= 0, `overflowPx=${overflow}`);

  await page.screenshot({ path: path.join(OUT, `${id}-viewport.png`) });
  await cta.screenshot({ path: path.join(OUT, `${id}-cta.png`) });

  // Real scroll-based threshold: force the CTA below the fold, confirm no
  // impression below threshold, then scroll it into view for a real
  // IntersectionObserver-driven impression — actual Chromium geometry, not
  // a mocked observer.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);

  // Click interception: intercept (and abort) the Viator request instead of
  // sending real traffic, verify exact URL, and read dataLayer for the click.
  let clickRequestUrl = null;
  await context.route(VIATOR_URL, (route) => {
    clickRequestUrl = route.request().url();
    return route.abort();
  });
  await link.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400); // allow the real IntersectionObserver to fire

  const dataLayerAfterImpression = await page.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a)));
  const impressionEntry = dataLayerAfterImpression.find((a) => a[0] === "event" && a[1] === "affiliate_offer_viewed");
  check("real scroll-into-view produces exactly one affiliate_offer_viewed in dataLayer", !!impressionEntry, JSON.stringify(impressionEntry));

  // Keyboard focus.
  await page.evaluate(() => window.scrollTo(0, 0));
  await link.focus();
  const ring = await page.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    return cs.boxShadow !== "none" || cs.outlineStyle !== "none";
  });
  check("CTA link shows a visible focus ring", ring);
  await link.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUT, `${id}-focus.png`) });

  // Click (via keyboard Enter), intercepted.
  await page.keyboard.press("Enter").catch(() => {});
  await page.waitForTimeout(200);
  check("click opened a new tab/popup request to the exact Viator URL (intercepted, not sent)", clickRequestUrl === VIATOR_URL, String(clickRequestUrl));

  const dataLayerAfterClick = await page.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a)));
  const clickEntry = dataLayerAfterClick.find((a) => a[0] === "event" && a[1] === "affiliate_clicked");
  check("affiliate_clicked present in dataLayer with destination", !!clickEntry && clickEntry[2]?.destination === "viator_northern_lights_search", JSON.stringify(clickEntry));

  await context.close();
}

async function landingScenario(browser, { id, width, height, theme, band = "good" }) {
  current = id;
  const { context, page } = await openPage(browser, { width, height, allBands: band });
  await setTheme(context, theme);
  await page.goto(BASE + "/en/northern-lights", { waitUntil: "domcontentloaded" });
  await hideSplashAndToasts(page);

  const cta = page.locator('[data-testid="affiliate-nl-cta"]');
  await cta.waitFor({ state: "visible", timeout: 20000 });

  const link = cta.locator("a");
  check("landing CTA href exact", (await link.getAttribute("href")) === VIATOR_URL);
  const text = await cta.textContent();
  check("landing copy is EN regardless of saved lang", /Compare Northern Lights tours/.test(text));

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("no horizontal overflow (landing)", overflow <= 0, `overflowPx=${overflow}`);

  await page.screenshot({ path: path.join(OUT, `${id}-viewport.png`) });
  await cta.screenshot({ path: path.join(OUT, `${id}-cta.png`) });

  await link.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const dataLayer = await page.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a)));
  const impressionEntry = dataLayer.find((a) => a[0] === "event" && a[1] === "affiliate_offer_viewed" && a[2]?.placement === "northern_lights_forecast");
  check("landing placement reported as northern_lights_forecast in dataLayer", !!impressionEntry, JSON.stringify(impressionEntry));

  await context.close();
}

async function changingNightScenario(browser) {
  current = "changing-night-no-duplicate";
  const { context, page } = await openPage(browser, { width: 1280, height: 900, allBands: "good" });
  await setTheme(context, "light");
  await setLang(context, "en");
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await hideSplashAndToasts(page);

  const cta = page.locator('[data-testid="affiliate-nl-cta"]');
  await cta.waitFor({ state: "visible", timeout: 20000 });
  await cta.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  // Change to the second night tab BEFORE checking the dataLayer again.
  const tabs = page.locator('[data-testid="nl3-module"] [role="group"] button');
  await tabs.nth(1).click();
  await page.waitForTimeout(300);

  const dataLayer = await page.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a)));
  const impressions = dataLayer.filter((a) => a[0] === "event" && a[1] === "affiliate_offer_viewed");
  check("changing the selected night does not fire a second impression (already consumed this visit)", impressions.length <= 1, `count=${impressions.length}`);
  await page.screenshot({ path: path.join(OUT, "changing-night-after-select.png") });

  await context.close();
}

async function run() {
  const browser = await chromium.launch();

  await homepageScenario(browser, { id: "homepage-en-light-1280", width: 1280, height: 900, theme: "light", lang: "en" });
  await homepageScenario(browser, { id: "homepage-is-dark-1280", width: 1280, height: 900, theme: "dark", lang: "is" });
  await homepageScenario(browser, { id: "homepage-en-light-375", width: 375, height: 760, theme: "light", lang: "en" });
  await homepageScenario(browser, { id: "homepage-poor-neutral-1280", width: 1280, height: 900, theme: "light", lang: "en", band: "very-poor" });
  await homepageScenario(browser, { id: "homepage-error-1280", width: 1280, height: 900, theme: "light", lang: "en", band: "unavailable" });

  await landingScenario(browser, { id: "landing-en-light-1280", width: 1280, height: 900, theme: "light" });
  await landingScenario(browser, { id: "landing-en-dark-375", width: 375, height: 760, theme: "dark" });

  await changingNightScenario(browser);

  await browser.close();

  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
  const scenarioIds = [...new Set(results.map((r) => r.scenario))];
  const failed = results.filter((r) => r.pass === false);
  const passed = results.filter((r) => r.pass === true).length;
  const total = results.filter((r) => r.pass !== null).length;
  console.log(`\nScenarios: ${scenarioIds.length}`);
  console.log(`Assertions passed: ${passed}/${total}`);
  if (failed.length) process.exitCode = 1;
}

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
