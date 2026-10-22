// Ticket #440 browser evidence capture v2 (CC, correction round per
// approved-prompt-v2.md R1-R7). Run: node capture-v2.mjs <outDir>
// Requires a `vite preview` server already running on :4440 serving a
// FRESH `npm run build` of the current (final) source.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const BASE = "http://localhost:4440";
const OUT = process.argv[2] || "outputs/ticket-440-browser-evidence/v2-final";
mkdirSync(OUT, { recursive: true });

const BASE_SITE = { id: "base-site", name: "Grunnstaður Test", lat: 64.1, lon: -21.9, shelter: 2 };
const ALT_SITE = { id: "alt-better", name: "Betri Staður Langheiti sem er nokkuð langt", lat: 64.2, lon: -21.7, shelter: 8 };
const CAMPSITES_STUB = { ok: true, tier: "pro", campsites: [BASE_SITE, ALT_SITE] };

function sevenDayDates() {
  const out = [];
  const start = new Date("2026-10-23T00:00:00.000Z");
  for (let i = 0; i < 7; i++) out.push(new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10));
  return out;
}
const DATES = sevenDayDates();
function hourlyTimesFor(dates) {
  const times = [];
  for (const d of dates) for (let h = 0; h < 24; h++) times.push(`${d}T${String(h).padStart(2, "0")}:00`);
  return times;
}
const HOURLY_TIMES = hourlyTimesFor(DATES);

function badForecastPayload() {
  return {
    daily: {
      time: DATES,
      temperature_2m_max: DATES.map(() => 1),
      temperature_2m_min: DATES.map(() => -3),
      precipitation_sum: DATES.map(() => 9),
      windspeed_10m_max: DATES.map(() => 18),
      windgusts_10m_max: DATES.map(() => 26),
      winddirection_10m_dominant: DATES.map(() => 270),
      weathercode: DATES.map(() => 65),
    },
    hourly: {
      time: HOURLY_TIMES,
      temperature_2m: HOURLY_TIMES.map(() => 0),
      weathercode: HOURLY_TIMES.map(() => 65),
      precipitation: HOURLY_TIMES.map(() => 0.6),
      precipitation_probability: HOURLY_TIMES.map(() => 90),
      windspeed_10m: HOURLY_TIMES.map(() => 17),
      windgusts_10m: HOURLY_TIMES.map(() => 25),
    },
  };
}
function goodForecastPayload() {
  return {
    daily: {
      time: DATES,
      temperature_2m_max: DATES.map(() => 14),
      temperature_2m_min: DATES.map(() => 8),
      precipitation_sum: DATES.map(() => 0),
      windspeed_10m_max: DATES.map(() => 3),
      windgusts_10m_max: DATES.map(() => 5),
      winddirection_10m_dominant: DATES.map(() => 180),
      weathercode: DATES.map(() => 1),
    },
    hourly: {
      time: HOURLY_TIMES,
      temperature_2m: HOURLY_TIMES.map(() => 11),
      weathercode: HOURLY_TIMES.map(() => 1),
      precipitation: HOURLY_TIMES.map(() => 0),
      precipitation_probability: HOURLY_TIMES.map(() => 5),
      windspeed_10m: HOURLY_TIMES.map(() => 2.5),
      windgusts_10m: HOURLY_TIMES.map(() => 4),
    },
  };
}

async function stubApis(page) {
  await page.route("**/api/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/campsites**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CAMPSITES_STUB) }));
  await page.route("**/api/me**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, entitlements: { pro: true, proUntil: null }, user: { email: "evidence@example.com" } }) }));
  await page.route("**/api/aurora-decision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, evening: "2026-10-23", auroraCache: { state: "unavailable", reason: "too_old" }, viewingWindow: null, status: "unavailable", reason: "aurora_cache_unavailable", best: null, alternatives: [], excluded: [], warnings: [] }) }));
  await page.route("**/api/forecast**", async (route) => {
    const url = new URL(route.request().url());
    const lat = Number(url.searchParams.get("latitude"));
    const isBase = Math.abs(lat - BASE_SITE.lat) < Math.abs(lat - ALT_SITE.lat);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(isBase ? badForecastPayload() : goodForecastPayload()) });
  });
}

async function primePageState(page, { lang = "is", theme = "light" } = {}) {
  await page.addInitScript(
    ([langValue, themeValue]) => {
      window.localStorage.setItem("lang", JSON.stringify(langValue));
      window.localStorage.setItem("theme", JSON.stringify(themeValue));
      window.localStorage.removeItem("lastSite");
      window.localStorage.setItem("campcast_route_disclaimer_seen", "true");
    },
    [lang, theme],
  );
}

const results = [];
function record(name, ok, note, extra) {
  results.push({ name, ok, note: note || "", ...(extra || {}) });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${note ? " — " + note : ""}`);
}

const VIEWPORTS = {
  mobile320: { width: 320, height: 568 },
  shortLandscape: { width: 667, height: 320 },
  desktop: { width: 1280, height: 900 },
};

async function openCard(page, { viewportLabel, lang, theme, hasTouch = false }) {
  await page.setViewportSize(VIEWPORTS[viewportLabel]);
  await primePageState(page, { lang, theme });
  await stubApis(page);
  if (theme === "dark") await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(BASE + "/");
  await page.locator(".fixed.inset-0.z-\\[9999\\]").first().waitFor({ state: "hidden" }).catch(() => {});

  const seeDetailsToggle = page.getByRole("button", { name: /See details|Sjá nánar/ }).first();
  await seeDetailsToggle.waitFor({ state: "visible", timeout: 20000 });
  await seeDetailsToggle.click();

  const opener = page.getByRole("button", { name: /Open details|Sjá nánar/ }).first();
  await opener.waitFor({ state: "visible", timeout: 20000 });
  return opener;
}

async function openModal(page, opener) {
  const scrollYBeforeOpen = await page.evaluate(() => window.scrollY);
  await opener.click();
  const dialog = page.getByRole("dialog");
  await dialog.first().waitFor({ state: "visible", timeout: 10000 });
  // Let the initial-focus effect settle (contentRef.focus() on mount).
  await page.waitForTimeout(150);
  const scrollYAfterOpenSettled = await page.evaluate(() => window.scrollY);
  return { scrollYBeforeOpen, scrollYAfterOpenSettled };
}

async function isDialogOpen(page) {
  return (await page.getByRole("dialog").count()) > 0;
}

// ---- B6: find whichever descendant extends furthest past the panel's own content box ----
async function findPanelOverflowCulprit(page) {
  return page.evaluate(() => {
    const panel = document.querySelector('[role="dialog"]');
    if (!panel) return null;
    const panelRect = panel.getBoundingClientRect();
    let worst = null;
    for (const el of panel.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      const overflowAmount = r.bottom - (panelRect.top + panel.clientHeight);
      if (overflowAmount > (worst ? worst.overflowAmount : 0.5)) {
        const cs = getComputedStyle(el);
        worst = {
          tag: el.tagName,
          cls: String(el.className || "").slice(0, 100),
          rect: r.toJSON(),
          overflowAmount,
          position: cs.position,
          display: cs.display,
          visibility: cs.visibility,
          hasVisibleBox: r.width > 0 && r.height > 0,
          focusable: el.matches('button, a[href], input, select, textarea, [tabindex]'),
          text: (el.textContent || "").trim().slice(0, 50),
        };
      }
    }
    return { panelClientHeight: panel.clientHeight, panelScrollHeight: panel.scrollHeight, worst };
  });
}

// ---- R2: real advanced-section expansion ----
async function expandAdvancedAndMeasure(page) {
  const toggle = page.getByRole("button", { name: /Show scoring details|Hide scoring details|Sýna stig og sundurliðun|Fela stig og sundurliðun/ }).first();
  const foundBefore = await toggle.count();
  if (!foundBefore) return { found: false };
  const labelBefore = (await toggle.textContent())?.trim();

  const scrollRegionBefore = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="route-details-scroll-region"]');
    return el ? { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight } : null;
  });

  await toggle.click();
  await page.waitForTimeout(100);

  const labelAfter = (await toggle.textContent())?.trim();
  const tableInfo = await page.evaluate(() => {
    // RouteCompareTable.jsx renders its own, always-present <table> earlier
    // in the DOM; the advanced-only score breakdown table is the one with
    // min-w-[980px] -- select it specifically, not just the first <table>.
    const table = Array.from(document.querySelectorAll('[role="dialog"] table')).find((t) => t.className.includes("min-w-"));
    if (!table) return null;
    const container = table.closest(".overflow-x-auto") || table.parentElement;
    return {
      tableVisible: !!(table.getBoundingClientRect().width && table.getBoundingClientRect().height),
      containerScrollWidth: container.scrollWidth,
      containerClientWidth: container.clientWidth,
      containerScrollLeftBefore: container.scrollLeft,
    };
  });

  const scrollRegionAfter = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="route-details-scroll-region"]');
    return el ? { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight } : null;
  });

  // Prove horizontal scroll actually moves, if the table overflows horizontally.
  let scrollLeftAfterDrag = null;
  if (tableInfo && tableInfo.containerScrollWidth > tableInfo.containerClientWidth) {
    await page.evaluate(() => {
      const table = Array.from(document.querySelectorAll('[role="dialog"] table')).find((t) => t.className.includes("min-w-"));
      const container = table.closest(".overflow-x-auto") || table.parentElement;
      container.scrollLeft = 150;
      container.dispatchEvent(new Event("scroll", { bubbles: true }));
    });
    await page.waitForTimeout(50);
    scrollLeftAfterDrag = await page.evaluate(() => {
      const table = Array.from(document.querySelectorAll('[role="dialog"] table')).find((t) => t.className.includes("min-w-"));
      const container = table.closest(".overflow-x-auto") || table.parentElement;
      return container.scrollLeft;
    });
  }

  return {
    found: true,
    labelBefore,
    labelAfter,
    labelFlipped: labelBefore !== labelAfter,
    scrollRegionBefore,
    scrollRegionAfter,
    contentGrew: !!(scrollRegionAfter && scrollRegionBefore && scrollRegionAfter.scrollHeight > scrollRegionBefore.scrollHeight),
    tableInfo,
    scrollLeftAfterDrag,
    horizontalScrollWorks: tableInfo ? scrollLeftAfterDrag === 150 : null,
  };
}

// ---- R3: lock measurement with a controlled post-open baseline ----
async function measureLock(page, { hasTouch = false } = {}) {
  const baseline = await page.evaluate(() => window.scrollY);
  const computedOverflow = await page.evaluate(() => ({
    html: getComputedStyle(document.documentElement).overflow,
    body: getComputedStyle(document.body).overflow,
    bodyInline: document.body.style.overflow,
  }));

  const region = page.locator('[data-testid="route-details-scroll-region"]').first();
  const box = await region.boundingBox();
  const points = box
    ? {
        top: { x: box.x + box.width / 2, y: box.y + 5 },
        middle: { x: box.x + box.width / 2, y: box.y + box.height / 2 },
        bottom: { x: box.x + box.width / 2, y: box.y + box.height - 5 },
      }
    : null;

  const wheelResults = {};
  if (points) {
    for (const [pos, pt] of Object.entries(points)) {
      await page.mouse.move(pt.x, pt.y);
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(60);
      wheelResults[pos] = await page.evaluate(() => window.scrollY);
    }
  }

  // Wheel directly over the backdrop (outside the panel).
  const panelBox = await page.getByRole("dialog").first().boundingBox();
  let backdropScrollY = null;
  if (panelBox) {
    await page.mouse.move(5, 5); // top-left corner, outside the centered panel
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(60);
    backdropScrollY = await page.evaluate(() => window.scrollY);
  }

  let touchResult = null;
  if (hasTouch && box) {
    try {
      const client = await page.context().newCDPSession(page);
      const x = box.x + box.width / 2;
      const yStart = box.y + box.height - 10;
      const yEnd = box.y + 10;
      await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: yStart }] });
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: (yStart + yEnd) / 2 }] });
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: yEnd }] });
      await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForTimeout(100);
      const contentScrollTopAfterTouch = await page.evaluate(() => document.querySelector('[data-testid="route-details-scroll-region"]')?.scrollTop ?? null);
      const pageScrollYAfterTouch = await page.evaluate(() => window.scrollY);
      touchResult = { ok: true, contentScrollTopAfterTouch, pageScrollYAfterTouch, mechanism: "CDP Input.dispatchTouchEvent (Chromium automation, not a real device)" };
    } catch (err) {
      touchResult = { ok: false, error: String(err) };
    }
  }

  return { baseline, computedOverflow, wheelResults, backdropScrollY, touchResult };
}

// ---- R4/v3 K1-K2: tab order walk (real browser native order, not the JS
// selector list), direction-aware, with named-target reachability so the
// harness can FAIL meaningfully instead of just dumping a sequence. ----
async function walkTabOrder(page, steps, direction = "forward") {
  const order = [];
  for (let i = 0; i < steps; i++) {
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { tag: "BODY_OR_NONE", inDialog: false };
      return {
        tag: el.tagName,
        role: el.getAttribute("role"),
        testid: el.getAttribute("data-testid"),
        ariaLabel: el.getAttribute("aria-label"),
        text: (el.textContent || "").trim().slice(0, 60),
        tabIndex: el.tabIndex,
        inDialog: !!el.closest('[role="dialog"]'),
      };
    });
    order.push(info);
    await page.keyboard.press(direction === "forward" ? "Tab" : "Shift+Tab");
    await page.waitForTimeout(20);
  }
  return order;
}

const isAdvancedToggle = (o) => o.tag === "BUTTON" && /scoring details|sundurliðun/i.test(o.text || "");
const isFooterClose = (o) => o.tag === "BUTTON" && !o.ariaLabel && /^(Close|Loka)$/.test((o.text || "").trim());
const isHeaderClose = (o) => o.ariaLabel === "Close modal";

function firstIndex(order, matcher) {
  return order.findIndex(matcher);
}
function stayedInDialog(order) {
  return order.every((o) => o.inDialog === true);
}

async function focusScrollRegion(page) {
  await page.evaluate((sel) => document.querySelector(sel)?.focus(), '[data-testid="route-details-scroll-region"]');
}

async function namedTabWalks(page, { steps = 20 } = {}) {
  await focusScrollRegion(page);
  const forward = await walkTabOrder(page, steps, "forward");
  await focusScrollRegion(page);
  const reverse = await walkTabOrder(page, steps, "reverse");
  return { forward, reverse };
}

async function fullInteractionBattery(page, opener, { hasTouch }) {
  const out = {};

  // --- Open #1: keyboard scroll immediately after open, lock measurement, B6 ---
  const openInfo1 = await openModal(page, opener);
  out.scrollY = openInfo1;

  const scrollRegionSelector = '[data-testid="route-details-scroll-region"]';
  const scrollTopBeforeKeys = await page.evaluate((sel) => document.querySelector(sel)?.scrollTop, scrollRegionSelector);
  const activeElAtOpen = await page.evaluate(() => ({ tag: document.activeElement?.tagName, testid: document.activeElement?.getAttribute("data-testid") }));
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("PageDown");
  await page.waitForTimeout(80);
  const scrollTopAfterKeys = await page.evaluate((sel) => document.querySelector(sel)?.scrollTop, scrollRegionSelector);
  out.keyboardScroll = { activeElAtOpen, scrollTopBeforeKeys, scrollTopAfterKeys, moved: scrollTopAfterKeys > scrollTopBeforeKeys };

  out.panelOverflowCulprit = await findPanelOverflowCulprit(page);

  out.lock = await measureLock(page, { hasTouch });

  // --- Named Tab/Shift+Tab walks, collapsed (v3 K1/K2) ---
  out.tabOrderCollapsed = await namedTabWalks(page, { steps: 20 });

  // --- Expand advanced, re-measure named walks ---
  out.advanced = await expandAdvancedAndMeasure(page);
  out.tabOrderExpanded = await namedTabWalks(page, { steps: 24 });

  // --- Click inside panel on non-interactive text: stays open ---
  await page.getByText(/Borið saman við|Compared to/).first().click({ force: true }).catch(() => {});
  out.staysOpenAfterPanelClick = await isDialogOpen(page);

  // --- Escape closes exactly once ---
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);
  out.closedByEscape = !(await isDialogOpen(page));
  out.bodyOverflowAfterEscapeClose = await page.evaluate(() => document.body.style.overflow);
  out.scrollYAfterEscapeClose = await page.evaluate(() => window.scrollY);
  out.focusAfterEscapeClose = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);

  // --- Reopen; header close button ---
  await openModal(page, opener);
  await page.getByRole("button", { name: "Close modal" }).click();
  await page.waitForTimeout(100);
  out.closedByHeaderButton = !(await isDialogOpen(page));

  // --- Reopen; footer close button ---
  await openModal(page, opener);
  await page.getByRole("button", { name: /^(Loka|Close)$/ }).click();
  await page.waitForTimeout(100);
  out.closedByFooterButton = !(await isDialogOpen(page));

  // --- Reopen; backdrop click closes ---
  await openModal(page, opener);
  await page.mouse.click(5, 5);
  await page.waitForTimeout(100);
  out.closedByBackdropClick = !(await isDialogOpen(page));

  // --- Reopen; focus return with preventScroll ---
  const scrollYBeforeFinalOpen = await page.evaluate(() => window.scrollY);
  await openModal(page, opener);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);
  const focusedAriaLabel = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  const scrollYAfterFinalClose = await page.evaluate(() => window.scrollY);
  out.focusReturn = {
    returnedToOpener: focusedAriaLabel ? focusedAriaLabel.includes("Open details") : false,
    scrollYBeforeFinalOpen,
    scrollYAfterFinalClose,
    scrollYUnchanged: scrollYBeforeFinalOpen === scrollYAfterFinalClose,
  };

  return out;
}

async function lightLayoutCheck(page, opener, { expandAdvanced }) {
  await openModal(page, opener);
  if (expandAdvanced) {
    const toggle = page.getByRole("button", { name: /Show scoring details|Sýna stig og sundurliðun/ }).first();
    if (await toggle.count()) await toggle.click();
    await page.waitForTimeout(100);
  }

  const measurements = await page.evaluate(() => {
    const panel = document.querySelector('[role="dialog"]');
    if (!panel) return null;
    const scrollRegion = panel.querySelector('[data-testid="route-details-scroll-region"]');
    const footer = panel.lastElementChild;
    return {
      panel: { clientHeight: panel.clientHeight, scrollHeight: panel.scrollHeight },
      scrollRegion: scrollRegion ? { clientHeight: scrollRegion.clientHeight, scrollHeight: scrollRegion.scrollHeight, scrollTop: scrollRegion.scrollTop } : null,
      footerRect: footer ? footer.getBoundingClientRect().toJSON() : null,
      viewportHeight: window.innerHeight,
    };
  });

  let scrollTopAfterWheel = null;
  if (measurements?.scrollRegion) {
    const region = page.locator('[data-testid="route-details-scroll-region"]').first();
    const box = await region.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(100);
      scrollTopAfterWheel = await page.evaluate(() => document.querySelector('[data-testid="route-details-scroll-region"]')?.scrollTop ?? null);
    }
  }

  const footerReachable = measurements?.footerRect && measurements.viewportHeight
    ? measurements.footerRect.bottom <= measurements.viewportHeight + 2 && measurements.footerRect.top >= 0
    : null;

  return { measurements, scrollTopAfterWheel, footerReachable };
}

async function main() {
  const browser = await chromium.launch();
  const buildStamp = {
    capturedAt: new Date().toISOString(),
    chromiumVersion: browser.version(),
    playwrightPackageVersion: require("@playwright/test/package.json").version,
  };
  const allData = {};

  // --- Full interaction battery: the two viewports the bug is actually about ---
  for (const viewportLabel of ["mobile320", "shortLandscape"]) {
    const context = await browser.newContext({ hasTouch: true });
    const page = await context.newPage();
    const opener = await openCard(page, { viewportLabel, lang: "en", theme: "light", hasTouch: true });
    const data = await fullInteractionBattery(page, opener, { hasTouch: true });
    allData[`${viewportLabel}-en-light-full`] = data;

    record(`${viewportLabel}-keyboard-scroll-immediately-after-open`, data.keyboardScroll.moved === true, JSON.stringify(data.keyboardScroll));
    record(`${viewportLabel}-advanced-toggle-real-expansion`, data.advanced.found && data.advanced.labelFlipped && data.advanced.contentGrew, JSON.stringify({ found: data.advanced.found, labelFlipped: data.advanced.labelFlipped, contentGrew: data.advanced.contentGrew, labelBefore: data.advanced.labelBefore, labelAfter: data.advanced.labelAfter }));
    record(`${viewportLabel}-advanced-table-overflows-horizontally`, !!(data.advanced.tableInfo && data.advanced.tableInfo.containerScrollWidth > data.advanced.tableInfo.containerClientWidth), JSON.stringify(data.advanced.tableInfo));
    record(`${viewportLabel}-advanced-table-horizontal-scroll-moves`, data.advanced.horizontalScrollWorks === true, `scrollLeftAfterDrag=${data.advanced.scrollLeftAfterDrag}`);

    // --- v3 K1/K2: named, failure-capable Tab/Shift+Tab reachability checks ---
    for (const [stateLabel, walks] of [["collapsed", data.tabOrderCollapsed], ["expanded", data.tabOrderExpanded]]) {
      const fwdToggleIdx = firstIndex(walks.forward, isAdvancedToggle);
      const fwdFooterIdx = firstIndex(walks.forward, isFooterClose);
      const revToggleIdx = firstIndex(walks.reverse, isAdvancedToggle);
      const revFooterIdx = firstIndex(walks.reverse, isFooterClose);
      const fwdWrapsToFirst = fwdFooterIdx !== -1 && walks.forward.slice(fwdFooterIdx + 1).some(isHeaderClose);

      record(`${viewportLabel}-tab-forward-${stateLabel}-reaches-advanced-toggle`, fwdToggleIdx !== -1, `atStep=${fwdToggleIdx} sequence=${JSON.stringify(walks.forward.map((o) => o.text || o.tag))}`);
      record(`${viewportLabel}-tab-forward-${stateLabel}-reaches-footer-close`, fwdFooterIdx !== -1, `atStep=${fwdFooterIdx}`);
      record(`${viewportLabel}-tab-forward-${stateLabel}-reaches-targets-in-dom-order`, fwdToggleIdx !== -1 && fwdFooterIdx !== -1 && fwdToggleIdx < fwdFooterIdx, `toggleAt=${fwdToggleIdx} footerAt=${fwdFooterIdx}`);
      record(`${viewportLabel}-tab-forward-${stateLabel}-wraps-to-first-after-footer-close`, fwdWrapsToFirst, `footerAt=${fwdFooterIdx}`);
      record(`${viewportLabel}-tab-forward-${stateLabel}-stays-in-dialog`, stayedInDialog(walks.forward), "");

      record(`${viewportLabel}-tab-reverse-${stateLabel}-reaches-advanced-toggle`, revToggleIdx !== -1, `atStep=${revToggleIdx} sequence=${JSON.stringify(walks.reverse.map((o) => o.text || o.tag))}`);
      record(`${viewportLabel}-tab-reverse-${stateLabel}-reaches-footer-close`, revFooterIdx !== -1, `atStep=${revFooterIdx}`);
      record(`${viewportLabel}-tab-reverse-${stateLabel}-reaches-targets-in-dom-order`, revToggleIdx !== -1 && revFooterIdx !== -1 && revFooterIdx < revToggleIdx, `toggleAt=${revToggleIdx} footerAt=${revFooterIdx}`);
      record(`${viewportLabel}-tab-reverse-${stateLabel}-stays-in-dialog`, stayedInDialog(walks.reverse), "");
    }

    record(`${viewportLabel}-panel-click-stays-open`, data.staysOpenAfterPanelClick === true, "");
    record(`${viewportLabel}-escape-closes`, data.closedByEscape === true, `bodyOverflowAfter=${data.bodyOverflowAfterEscapeClose}`);
    record(`${viewportLabel}-header-close-button-closes`, data.closedByHeaderButton === true, "");
    record(`${viewportLabel}-footer-close-button-closes`, data.closedByFooterButton === true, "");
    record(`${viewportLabel}-backdrop-click-closes`, data.closedByBackdropClick === true, "");
    record(`${viewportLabel}-focus-returns-to-opener`, data.focusReturn.returnedToOpener === true, JSON.stringify(data.focusReturn));
    record(`${viewportLabel}-scrollY-unchanged-after-close`, data.focusReturn.scrollYUnchanged === true, JSON.stringify(data.focusReturn));

    const lock = data.lock;
    const wheelHeld = Object.values(lock.wheelResults).every((v) => v === lock.baseline);
    record(`${viewportLabel}-lock-wheel-over-content-held`, wheelHeld, JSON.stringify({ baseline: lock.baseline, wheelResults: lock.wheelResults }));
    record(`${viewportLabel}-lock-wheel-over-backdrop-held`, lock.backdropScrollY === lock.baseline, `baseline=${lock.baseline} backdropScrollY=${lock.backdropScrollY}`);
    record(`${viewportLabel}-lock-computed-overflow-hidden`, lock.computedOverflow.body === "hidden" || lock.computedOverflow.bodyInline === "hidden", JSON.stringify(lock.computedOverflow));
    if (lock.touchResult) {
      record(`${viewportLabel}-lock-touch-swipe-page-held`, lock.touchResult.ok ? lock.touchResult.pageScrollYAfterTouch === lock.baseline : null, JSON.stringify(lock.touchResult));
    }

    await page.screenshot({ path: `${OUT}/${viewportLabel}-en-light-full-battery.png`, fullPage: false });
    await context.close();
  }

  // --- Layout + advanced-expansion matrix across required viewport/lang/theme combos ---
  const layoutMatrix = [
    ["mobile320", "en", "light", false],
    ["mobile320", "en", "light", true],
    ["shortLandscape", "en", "light", false],
    ["shortLandscape", "en", "light", true],
    ["shortLandscape", "is", "dark", false],
    ["shortLandscape", "is", "dark", true],
    ["desktop", "en", "light", false],
    ["desktop", "en", "light", true],
    ["desktop", "is", "dark", false],
    ["mobile320", "is", "dark", false],
  ];
  for (const [viewportLabel, lang, theme, expandAdvanced] of layoutMatrix) {
    const page = await browser.newPage();
    const opener = await openCard(page, { viewportLabel, lang, theme });
    const r = await lightLayoutCheck(page, opener, { expandAdvanced });
    const key = `${viewportLabel}-${lang}-${theme}-${expandAdvanced ? "advanced" : "collapsed"}`;
    allData[key] = r;

    record(`${key}-footer-reachable`, r.footerReachable === true, `footerRect=${JSON.stringify(r.measurements?.footerRect)} viewportHeight=${r.measurements?.viewportHeight}`);
    record(`${key}-content-overflows-or-fits`, r.measurements?.scrollRegion ? r.measurements.scrollRegion.scrollHeight >= r.measurements.scrollRegion.clientHeight : false, JSON.stringify(r.measurements?.scrollRegion));
    if (r.measurements?.scrollRegion && r.measurements.scrollRegion.scrollHeight > r.measurements.scrollRegion.clientHeight) {
      record(`${key}-wheel-scroll-moves-content`, typeof r.scrollTopAfterWheel === "number" && r.scrollTopAfterWheel > 0, `scrollTopAfterWheel=${r.scrollTopAfterWheel}`);
    }

    const culprit = await findPanelOverflowCulprit(page);
    allData[`${key}-panelOverflowCulprit`] = culprit;

    await page.screenshot({ path: `${OUT}/${key}.png`, fullPage: false });
    await page.close();
  }

  await browser.close();

  writeFileSync(`${OUT}/measurements.json`, JSON.stringify(allData, null, 2));
  writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
  writeFileSync(`${OUT}/build-stamp.json`, JSON.stringify(buildStamp, null, 2));

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length) {
    console.log("FAILED:");
    for (const f of failed) console.log(` - ${f.name}: ${f.note}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
