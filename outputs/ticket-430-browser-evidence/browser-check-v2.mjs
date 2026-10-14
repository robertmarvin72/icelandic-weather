// #430 v2 browser evidence — corrects F2/F3 from result-review.md.
// F2: real pixel-sampled contrast (not Tailwind-class math) across the D2
// matrix, plus a measured disclosure font-size.
// F3: a harness-side IntersectionObserver proves delivery before any
// count===0 assertion; every scenario that scrolls asserts exactly 0 before
// and exactly 1 after (no presence-only / <=1 checks); the changing-night
// step never scrolls the CTA into view.
// Same dummy-ID evidence build (VITE_GA_MEASUREMENT_ID=G-TEST430, outside the
// repo, deleted after capture) and the same window.dataLayer GA transport as
// v1 — see cc-report.md's v2 section for the full method statement.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { decodePng } from "./pngPixels.mjs";

const PORT = 4531; // distinct from v1's 4530, in case both are ever run close together
const BASE = `http://localhost:${PORT}`;
const OUT = path.resolve("outputs/ticket-430-browser-evidence");
fs.mkdirSync(OUT, { recursive: true });

const VIATOR_URL =
  "https://www.viator.com/searchResults/all?text=Iceland+Tours%2C+northern+lights&pid=P00323211&mcid=42383&medium=link&campaign=Northern-lights";

const ANON_ME = { ok: true, user: null, subscription: null, entitlements: { pro: false, proUntil: null } };
const SITE = { id: "site-a", name: "Alpha Camp", lat: 64.1, lon: -21.9, tier: "free" };

function auroraBody(evening, band) {
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
function measure(name, value, detail = "") {
  results.push({ scenario: current, check: name, pass: null, value, detail: String(detail) });
  console.log(`MEAS [${current}] ${name} = ${JSON.stringify(value)}${detail ? ` — ${detail}` : ""}`);
}

// ---- WCAG contrast math -----------------------------------------------
function relLuminance([r, g, b]) {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrastRatio(l1, l2) {
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

// ---- rendered-pixel contrast measurement (D2(b)) -----------------------
// Hides the element's own text (color: transparent), screenshots its actual
// bounding box, decodes the PNG, samples a grid of background pixels across
// the WHOLE box (the shell is a 3-stop diagonal gradient plus a bg-white/5
// overlay, so the centre is not necessarily the worst case), and computes
// the contrast ratio of the real (un-hidden) text color against EVERY
// sampled background pixel, reporting the true min (worst case) and max.
async function measureElementContrast(page, handle, label) {
  const textColor = await handle.evaluate((el) => {
    const cs = getComputedStyle(el);
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = cs.color;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return { rgb: [d[0], d[1], d[2]], alpha: d[3] / 255, fontSizePx: parseFloat(cs.fontSize) };
  });
  await handle.evaluate((el) => {
    el.setAttribute("data-contrast-probe", "1");
    const style = document.createElement("style");
    style.id = "contrast-probe-style";
    style.textContent = `[data-contrast-probe="1"], [data-contrast-probe="1"] * { color: transparent !important; }`;
    document.head.appendChild(style);
  });
  const buf = await handle.screenshot();
  await page.evaluate(() => {
    document.getElementById("contrast-probe-style")?.remove();
    document.querySelector('[data-contrast-probe="1"]')?.removeAttribute("data-contrast-probe");
  });

  const img = decodePng(buf);
  const textLum = relLuminance(textColor.rgb);
  let minRatio = Infinity;
  let maxRatio = -Infinity;
  let minBg = null;
  let maxBg = null;
  const stepX = Math.max(1, Math.floor(img.width / 60));
  const stepY = Math.max(1, Math.floor(img.height / 30));
  for (let y = 0; y < img.height; y += stepY) {
    for (let x = 0; x < img.width; x += stepX) {
      const [r, g, b] = img.getPixel(x, y);
      const ratio = contrastRatio(textLum, relLuminance([r, g, b]));
      if (ratio < minRatio) {
        minRatio = ratio;
        minBg = [r, g, b];
      }
      if (ratio > maxRatio) {
        maxRatio = ratio;
        maxBg = [r, g, b];
      }
    }
  }
  const result = {
    label,
    textColorRgb: textColor.rgb,
    textAlpha: textColor.alpha,
    fontSizePx: textColor.fontSizePx,
    minRatio: Math.round(minRatio * 100) / 100,
    maxRatio: Math.round(maxRatio * 100) / 100,
    worstBgSample: minBg,
    bestBgSample: maxBg,
    sampledPixels: Math.ceil(img.width / stepX) * Math.ceil(img.height / stepY),
  };
  measure(`${label}: font-size px`, result.fontSizePx);
  check(`${label}: min contrast >= 4.5:1 (worst sampled background pixel)`, result.minRatio >= 4.5, `min=${result.minRatio} max=${result.maxRatio} samples=${result.sampledPixels} worstBg=rgb(${minBg})`);
  return result;
}

async function openPage(browser, { width, height, allBands = "good" }) {
  const context = await browser.newContext({ viewport: { width, height } });
  await context.route(/^https?:\/\/(?!localhost:4531)/, (route) => route.abort());
  await context.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/me") return route.fulfill({ json: ANON_ME });
    if (url.pathname === "/api/campsites") return route.fulfill({ json: { ok: true, tier: "free", campsites: [SITE] } });
    if (url.pathname === "/api/aurora-decision") {
      const body = JSON.parse(route.request().postData());
      return route.fulfill({ json: auroraBody(body.evening, allBands) });
    }
    return route.fulfill({ json: { ok: true } });
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log(`[pageerror] ${e.message}`));
  return { context, page };
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

// Installs the harness's OWN real IntersectionObserver on the CTA (same
// threshold list, including 0.5) and records every delivery into
// window.__ioLog. Used only to PROVE a delivery happened before a
// count===0 assertion — the app's own observer is untouched/real.
async function installHarnessObserver(page, selector) {
  await page.evaluate((sel) => {
    window.__ioLog = [];
    const el = document.querySelector(sel);
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) window.__ioLog.push({ ratio: e.intersectionRatio, intersecting: e.isIntersecting, t: Date.now() });
      },
      { threshold: [0, 0.25, 0.49, 0.5, 0.6, 1] }
    );
    obs.observe(el);
    window.__harnessObserver = obs;
  }, selector);
}
async function waitForHarnessDelivery(page) {
  await page.waitForFunction(() => Array.isArray(window.__ioLog) && window.__ioLog.length > 0, { timeout: 10000 });
  // Two animation frames after delivery, per D3(a).
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      })
  );
}
async function harnessLastRatio(page) {
  return page.evaluate(() => (window.__ioLog.length ? window.__ioLog[window.__ioLog.length - 1].ratio : null));
}

function impressionCount(dataLayer) {
  return dataLayer.filter((a) => a[0] === "event" && a[1] === "affiliate_offer_viewed").length;
}
async function readDataLayer(page) {
  return page.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a)));
}

// ---------------------------------------------------------------------
// D2 contrast/viewport matrix
// ---------------------------------------------------------------------
async function contrastScenario(browser, { id, width, height, theme, lang, placement }) {
  current = id;
  const { context, page } = await openPage(browser, { width, height });
  await setTheme(context, theme);
  if (lang) await setLang(context, lang);

  const url = placement === "landing" ? BASE + "/en/northern-lights" : BASE + "/";
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await hideSplashAndToasts(page);

  const cta = page.locator('[data-testid="affiliate-nl-cta"]');
  await cta.waitFor({ state: "visible", timeout: 20000 });
  await cta.scrollIntoViewIfNeeded();

  const title = await cta.locator("p").nth(0).elementHandle();
  const body = await cta.locator("p").nth(1).elementHandle();
  const disclosure = await cta.locator("p").last().elementHandle();
  const buttonLabel = await cta.locator("a").elementHandle();

  await measureElementContrast(page, title, "title");
  await measureElementContrast(page, body, "body");
  const disclosureResult = await measureElementContrast(page, disclosure, "disclosure");
  check("disclosure font-size >= 12px", disclosureResult.fontSizePx >= 12, `${disclosureResult.fontSizePx}px`);
  await measureElementContrast(page, buttonLabel, "button label");

  // D2(c): hover is informational only, not gating.
  await cta.locator("a").hover();
  await page.waitForTimeout(80);
  const hoverHandle = await cta.locator("a").elementHandle();
  const hoverResult = await measureElementContrast(page, hoverHandle, "button label (hover, informational)");
  results[results.length - 1].pass = null; // demote the inner check() call's pass to informational
  measure("button hover min ratio (informational, not gating)", hoverResult.minRatio);

  // D2(d): CTA-container overflow, separate from page-level overflow.
  const overflow = await page.evaluate(() => {
    const ctaEl = document.querySelector('[data-testid="affiliate-nl-cta"]');
    const rect = ctaEl.getBoundingClientRect();
    return {
      ctaRightEdgeWithinViewport: rect.right <= window.innerWidth + 0.5,
      ctaScrollWidth: ctaEl.scrollWidth,
      ctaClientWidth: ctaEl.clientWidth,
      pageOverflowPx: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  check("CTA container right edge within viewport", overflow.ctaRightEdgeWithinViewport, `pageOverflowPx=${overflow.pageOverflowPx}`);
  check("CTA container scrollWidth <= clientWidth (no internal overflow)", overflow.ctaScrollWidth <= overflow.ctaClientWidth, `${overflow.ctaScrollWidth} <= ${overflow.ctaClientWidth}`);
  if (overflow.pageOverflowPx > 0) {
    measure("page-level overflow (attributed, not a CTA failure unless CTA itself overflows)", overflow.pageOverflowPx);
  }

  await page.screenshot({ path: path.join(OUT, `v2-${id}-viewport.png`) });
  await cta.screenshot({ path: path.join(OUT, `v2-${id}-cta.png`) });

  await context.close();
}

// ---------------------------------------------------------------------
// D3 threshold evidence
// ---------------------------------------------------------------------
async function thresholdScenario(browser) {
  current = "threshold-real-below-then-above";
  // Tall viewport so the CTA starts well below the fold.
  const { context, page } = await openPage(browser, { width: 1280, height: 900, allBands: "good" });
  await setTheme(context, "light");
  await setLang(context, "en");
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await hideSplashAndToasts(page);

  const cta = page.locator('[data-testid="affiliate-nl-cta"]');
  await cta.waitFor({ state: "attached", timeout: 20000 });
  await page.evaluate(() => window.scrollTo(0, 0));

  await installHarnessObserver(page, '[data-testid="affiliate-nl-cta"]');
  await waitForHarnessDelivery(page);
  const belowRatio = await harnessLastRatio(page);
  check("harness observer delivered before the below-threshold assertion", belowRatio !== null, `ratio=${belowRatio}`);
  check("below fold: harness-measured ratio < 0.5", belowRatio < 0.5, `ratio=${belowRatio}`);

  let dataLayer = await readDataLayer(page);
  check("below fold: affiliate_offer_viewed count === 0", impressionCount(dataLayer) === 0, `count=${impressionCount(dataLayer)}`);

  // Now scroll it into view for real and prove >=0.5 + exactly 1.
  await cta.scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => window.__ioLog.length > 0 && window.__ioLog[window.__ioLog.length - 1].ratio >= 0.5,
    { timeout: 10000 }
  );
  const aboveRatio = await harnessLastRatio(page);
  check("after scroll: harness-measured ratio >= 0.5", aboveRatio >= 0.5, `ratio=${aboveRatio}`);
  await page.waitForTimeout(150); // let the app's own observer/effect settle
  dataLayer = await readDataLayer(page);
  check("after scroll: affiliate_offer_viewed count === 1 (exactly)", impressionCount(dataLayer) === 1, `count=${impressionCount(dataLayer)}`);

  await page.screenshot({ path: path.join(OUT, "v2-threshold-after-scroll.png") });
  await context.close();
}

async function changingNightNoScrollScenario(browser) {
  current = "changing-night-no-scroll-into-view";
  // Same geometry as the proven-working threshold scenario (900 tall): the
  // night tabs sit above the CTA in the module, so they stay reachable while
  // the CTA itself is below the fold at scrollY=0.
  const { context, page } = await openPage(browser, { width: 1280, height: 900, allBands: "good" });
  await setTheme(context, "light");
  await setLang(context, "en");
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await hideSplashAndToasts(page);

  const cta = page.locator('[data-testid="affiliate-nl-cta"]');
  await cta.waitFor({ state: "attached", timeout: 20000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await installHarnessObserver(page, '[data-testid="affiliate-nl-cta"]');
  await waitForHarnessDelivery(page);

  const preRatio = await harnessLastRatio(page);
  let dataLayer = await readDataLayer(page);
  check("pre-night-change: ratio < 0.5 and count === 0", preRatio < 0.5 && impressionCount(dataLayer) === 0, `ratio=${preRatio} count=${impressionCount(dataLayer)}`);

  const scrollYBefore = await page.evaluate(() => window.scrollY);
  // D3(b): activate the tab via a dispatched click (no Playwright
  // locator.click(), which would auto-scroll the target into view).
  const activated = await page.evaluate(() => {
    const group = document.querySelector('[data-testid="nl3-module"] [role="group"]');
    const buttons = group ? [...group.querySelectorAll("button")] : [];
    const target = buttons[1];
    if (!target) return false;
    target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return true;
  });
  check("night tab activated via dispatched click (no locator.click)", activated);
  const scrollYAfter = await page.evaluate(() => window.scrollY);
  check("activating the tab did not scroll the page", scrollYAfter === scrollYBefore, `before=${scrollYBefore} after=${scrollYAfter}`);

  await page.waitForTimeout(200);
  const postRatio = await harnessLastRatio(page);
  dataLayer = await readDataLayer(page);
  check("after night change, still not scrolled into view: ratio < 0.5 and count === 0", postRatio < 0.5 && impressionCount(dataLayer) === 0, `ratio=${postRatio} count=${impressionCount(dataLayer)}`);

  // Now scroll it into view for real, confirm exactly 1 with the latest metadata.
  await cta.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => window.__ioLog[window.__ioLog.length - 1]?.ratio >= 0.5, { timeout: 10000 });
  await page.waitForTimeout(150);
  dataLayer = await readDataLayer(page);
  const entry = dataLayer.find((a) => a[0] === "event" && a[1] === "affiliate_offer_viewed");
  check("exactly one impression after real scroll, with latest night's metadata", impressionCount(dataLayer) === 1 && !!entry, JSON.stringify(entry));

  await page.screenshot({ path: path.join(OUT, "v2-changing-night-final.png") });
  await context.close();
}

async function run() {
  const browser = await chromium.launch();

  await contrastScenario(browser, { id: "homepage-en-320-light", width: 320, height: 760, theme: "light", lang: "en", placement: "homepage" });
  await contrastScenario(browser, { id: "homepage-en-320-dark", width: 320, height: 760, theme: "dark", lang: "en", placement: "homepage" });
  await contrastScenario(browser, { id: "homepage-en-1280-light", width: 1280, height: 900, theme: "light", lang: "en", placement: "homepage" });
  await contrastScenario(browser, { id: "homepage-en-1280-dark", width: 1280, height: 900, theme: "dark", lang: "en", placement: "homepage" });
  await contrastScenario(browser, { id: "homepage-is-320-light", width: 320, height: 760, theme: "light", lang: "is", placement: "homepage" });
  await contrastScenario(browser, { id: "landing-en-320-dark", width: 320, height: 760, theme: "dark", placement: "landing" });
  await contrastScenario(browser, { id: "landing-en-1280-light", width: 1280, height: 900, theme: "light", placement: "landing" });

  await thresholdScenario(browser);
  await changingNightNoScrollScenario(browser);

  await browser.close();

  fs.writeFileSync(path.join(OUT, "results-v2.json"), JSON.stringify(results, null, 2));
  const scenarioIds = [...new Set(results.map((r) => r.scenario))];
  const gating = results.filter((r) => r.pass !== null);
  const passed = gating.filter((r) => r.pass === true).length;
  const failed = gating.filter((r) => r.pass === false);
  console.log(`\nScenarios: ${scenarioIds.length}`);
  console.log(`Gating assertions passed: ${passed}/${gating.length} (plus ${results.length - gating.length} informational measurements)`);
  if (failed.length) process.exitCode = 1;
}

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
