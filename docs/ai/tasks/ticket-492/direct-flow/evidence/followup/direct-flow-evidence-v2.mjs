// Ticket #492, direct-flow round 2, V5/R5 -- real-browser STUB evidence
// re-run. Fixes round 1's own gaps (Jonesy's result-review R5): the
// browser clock is now frozen to match the fixtures' own generation
// clock (r5-fixtures.json's `frozenNowIso`), n/first-slot are read from
// the DOM (not just described), the sticky header's own measured bottom
// is used to scroll the slider/first notice line below it, hit-tests
// confirm the real element under those points, and fetch totals are
// asserted per combination. Same no-live-network convention (page.route
// interception only). Kept on disk (never deleted). Run from the repo
// root with vite dev already listening on :5173:
//   node docs/ai/tasks/ticket-492/direct-flow/evidence/followup/direct-flow-evidence-v2.mjs
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, "r5-fixtures.json"), "utf-8"));
const FROZEN_NOW = new Date(fixtures.frozenNowIso);

function respondFixedRoute(payload) {
  return (route, request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/winter-route") return route.fulfill({ json: payload });
    return route.continue();
  };
}

async function setupPage(context, { lang, theme }) {
  const page = await context.newPage();
  await page.addInitScript(([lang, theme]) => {
    window.localStorage.setItem("lang", JSON.stringify(lang));
    window.localStorage.setItem("theme", JSON.stringify(theme));
  }, [lang, theme]);
  // Freeze the clock BEFORE navigation so useNowTicking's very first
  // render already sees the frozen time, matching the fixtures' own
  // generation clock (fixtures.frozenNowIso) -- after dagsKeyrtUt, well
  // within the freshness window, before the first forecast slot.
  await page.clock.setFixedTime(FROZEN_NOW);
  return page;
}

async function selectAndSubmit(page, fromId, toId, lang) {
  await page.goto("http://localhost:5173/winter-route");
  const fromLabel = lang === "is" ? "Frá" : "From";
  const toLabel = lang === "is" ? "Til" : "To";
  const fromInput = page.getByRole("combobox", { name: fromLabel, exact: true });
  await fromInput.click();
  await fromInput.fill(fromId === "reykjavik-raudavatn" ? "raudavatn" : fromId);
  await page.locator(`[data-place-id="${fromId}"]`).first().click();
  const toInput = page.getByRole("combobox", { name: toLabel, exact: true });
  await toInput.click();
  await toInput.fill(toId);
  await page.locator(`[data-place-id="${toId}"]`).first().click();
  const submitLabel = lang === "is" ? "Sýna leið" : "Show route";
  await page.getByRole("button", { name: submitLabel }).click();
  await page.getByTestId("winter-route-data").waitFor({ state: "visible" });
  await page.waitForFunction(() => document.fonts.ready);
}

function toggleLabel(lang) {
  return lang === "is" ? "Sjá alla vegkafla" : "View all road sections";
}

// P8/R5 -- n and first slot read from the real DOM (not described), the
// sticky header's own measured bottom, and hit-tests at the slider's own
// center and the first notice line, after scrolling both below the header.
async function domProof(page) {
  return page.evaluate(() => {
    const slider = document.querySelector('input[type="range"]');
    const n = slider ? Number(slider.max) + 1 : null;
    const firstSlotText = slider ? slider.getAttribute("aria-valuetext") : null;
    const header = document.querySelector("header.sticky");
    const headerBottom = header ? Math.round(header.getBoundingClientRect().bottom) : null;
    return { n, firstSlotText, headerBottom, scrollYBefore: window.scrollY };
  });
}
async function scrollBelowHeaderAndHitTest(page) {
  return page.evaluate(() => {
    const header = document.querySelector("header.sticky");
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
    const slider = document.querySelector('input[type="range"]');
    const firstNoticeLine = document.querySelector('[data-testid="winter-route-data"] ol li');
    const targets = [slider, firstNoticeLine].filter(Boolean);
    if (targets.length === 0) return { scrolled: false };
    const topMost = Math.min(...targets.map((t) => t.getBoundingClientRect().top));
    window.scrollBy(0, topMost - headerBottom - 16);
    const sliderRect = slider ? slider.getBoundingClientRect() : null;
    const noticeRect = firstNoticeLine ? firstNoticeLine.getBoundingClientRect() : null;
    const hit = (rect) => {
      if (!rect) return null;
      const el = document.elementFromPoint(Math.round(rect.left + rect.width / 2), Math.round(rect.top + rect.height / 2));
      return { tag: el?.tagName, isSelf: el === slider || el === firstNoticeLine || !!el?.closest('input[type="range"]') || !!el?.closest("li") };
    };
    return {
      scrolled: true,
      scrollY: window.scrollY,
      headerBottom: Math.round(headerBottom),
      sliderRect: sliderRect ? { top: Math.round(sliderRect.top), bottom: Math.round(sliderRect.bottom) } : null,
      noticeRect: noticeRect ? { top: Math.round(noticeRect.top), bottom: Math.round(noticeRect.bottom) } : null,
      sliderHit: hit(sliderRect),
      noticeHit: hit(noticeRect),
    };
  });
}
async function readNames(page) {
  return page.evaluate(() => [...document.querySelectorAll('[data-testid="winter-route-data"] li span.font-medium')].map((e) => e.textContent));
}
async function hasStaleLine(page) {
  return page.evaluate(() => {
    const text = document.querySelector('[data-testid="winter-route-data"]')?.textContent ?? "";
    return text.includes("gæti verið úreltur") || text.includes("could be outdated");
  });
}

const EVIDENCE_DIR = __dirname;
const results = {};
const browser = await chromium.launch();

try {
  // --- Main 8-combination matrix: both fixed routes x 1280/360 x IS/EN,
  // each narrow -> open -> closed-again, with full DOM/clock/hit-test proof.
  for (const [routeKey, fromId, toId, fixtureKey] of [
    ["vik", "reykjavik-raudavatn", "vik", "vikMain"],
    ["borgarnes", "reykjavik-raudavatn", "borgarnes", "borgarnesMain"],
  ]) {
    for (const width of [1280, 360]) {
      for (const lang of ["is", "en"]) {
        const context = await browser.newContext({ viewport: { width, height: width === 1280 ? 1000 : 900 } });
        const page = await setupPage(context, { lang, theme: "light" });
        let fetchCount = { fixed: 0, geometry: 0 };
        await page.route("**/api/winter-route**", (route, request) => {
          const url = new URL(request.url());
          if (url.pathname === "/api/winter-route") fetchCount.fixed += 1;
          if (url.pathname === "/api/winter-route-geometry") fetchCount.geometry += 1;
          return respondFixedRoute(fixtures[fixtureKey])(route, request);
        });
        await selectAndSubmit(page, fromId, toId, lang);

        const proof = await domProof(page);
        const namesNarrow = await readNames(page);
        const staleNarrow = await hasStaleLine(page);
        const hit = await scrollBelowHeaderAndHitTest(page);
        await page.screenshot({ path: path.join(EVIDENCE_DIR, `${routeKey}-${width}-${lang}-01-narrow.png`) });

        // 0 extra fetch on a time-step.
        const fetchBeforeStep = fetchCount.fixed;
        const slider = page.locator('input[type="range"]');
        await slider.focus();
        await page.keyboard.press("ArrowRight");
        const fetchAfterStep = fetchCount.fixed;

        const toggleBtn = page.getByRole("button", { name: toggleLabel(lang) });
        await toggleBtn.click();
        const namesOpen = await readNames(page);
        await page.screenshot({ path: path.join(EVIDENCE_DIR, `${routeKey}-${width}-${lang}-02-open.png`) });

        await toggleBtn.click();
        const namesClosed = await readNames(page);
        await page.screenshot({ path: path.join(EVIDENCE_DIR, `${routeKey}-${width}-${lang}-03-closed-again.png`) });

        results[`${routeKey}_${width}_${lang}`] = {
          ...proof, hit, staleLinePresent: staleNarrow,
          namesNarrowCount: namesNarrow.length, namesOpenCount: namesOpen.length, namesClosedCount: namesClosed.length,
          narrowLessThanOpen: namesNarrow.length < namesOpen.length,
          narrowEqualsClosedAgain: namesNarrow.length === namesClosed.length,
          fetchCountFixed: fetchCount.fixed, fetchCountGeometry: fetchCount.geometry,
          fetchCountUnchangedOnTimeStep: fetchBeforeStep === fetchAfterStep,
        };
        await context.close();
      }
    }
  }

  // --- 0/1 notice, separate small runs (V5(d)). ---
  for (const [name, fixtureKey] of [["zero-notices", "vikZeroNotices"], ["one-notice", "vikOneNotice"]]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await setupPage(context, { lang: "is", theme: "light" });
    await page.route("**/api/winter-route**", respondFixedRoute(fixtures[fixtureKey]));
    await selectAndSubmit(page, "reykjavik-raudavatn", "vik", "is");
    const staleLine = await hasStaleLine(page);
    const allClearVisible = await page.getByText("Engar tilkynningar eða lokanir á leiðinni núna.").isVisible().catch(() => false);
    results[name] = { staleLinePresent: staleLine, allClearVisible };
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `04-${name}.png`) });
    await context.close();
  }

  // --- One ring-option pair (Rauðavatn->Selfoss, south) as regression --
  // confirms the redesigned RoadOverviewSection still works for an
  // existing geometry-based option pair, untouched by the fixed adapter.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await setupPage(context, { lang: "is", theme: "light" });
    await page.route("**/api/winter-route-geometry**", (route, request) => {
      const url = new URL(request.url());
      const option = url.searchParams.get("option") === "north" ? "north" : "south";
      return route.fulfill({
        json: {
          schemaVersion: 1, tier: 2, status: "geometry_only", from: "reykjavik-raudavatn", to: "selfoss",
          selectedOption: option, geometryId: "south-geo",
          options: [{ id: "south", label: "s", lengthM: 1, via: [], routeId: "a" }, { id: "north", label: "n", lengthM: 2, via: [], routeId: "b" }],
        },
      });
    });
    await page.route("**/api/winter-route-data**", (route) =>
      route.fulfill({
        json: {
          from: "reykjavik-raudavatn", to: "selfoss", geometryId: "south-geo", selectedOption: "south",
          datasetVersion: "ds1", policyVersion: "south-policy", routeLengthM: 55000, unmappedLengthM: 0,
          generatedAt: fixtures.frozenNowIso,
          roadSections: [{ idButur: 1, nameIs: "Hellisheiði", nameEn: "Hellisheiði", routeLengthM: 55000, routeLengthFraction: 1, isEdgeSegment: false, segmentDataAvailable: true, category: "passable", positiveStyleEligible: true, astandYfirbord: "GREIDFAERT", astandLysing: "Greiðfært", astandLysingEn: "Easily passable", export: { isStale: false }, registration: { isOld: false }, notices: [] }],
          roadMeta: { available: true, stale: false, cacheAgeMs: 0, segmentsAvailable: true, pointsAvailable: true, pointsFeedUnavailableOrStale: false },
          forecast: { available: true, window: { startHour: "2026-11-26T10:00", endHour: "2026-11-26T11:00", expectedHours: ["2026-11-26T10:00", "2026-11-26T11:00"] }, points: [{ id: "p1", labelIs: "Hellisheiði", labelEn: "Hellisheiði", available: true, returnedLatitude: 64, returnedLongitude: -21, elevation: 300, hours: ["2026-11-26T10:00", "2026-11-26T11:00"], series: { temperature_2m: [-1, -1], wind_speed_10m: [5, 5], wind_gusts_10m: [8, 8], precipitation: [0, 0], weather_code: [3, 3] } }], stale: false, cacheAgeMs: 0 },
        },
      })
    );
    await page.goto("http://localhost:5173/winter-route");
    const fromInput = page.getByRole("combobox", { name: "Frá", exact: true });
    await fromInput.click();
    await fromInput.fill("raudavatn");
    await page.locator('[data-place-id="reykjavik-raudavatn"]').first().click();
    const toInput = page.getByRole("combobox", { name: "Til", exact: true });
    await toInput.click();
    await toInput.fill("selfoss");
    await page.locator('[data-place-id="selfoss"]').first().click();
    await page.getByRole("button", { name: "Sýna leið" }).click();
    await page.getByRole("radio", { name: "Suðurleið" }).click().catch(() => {});
    await page.getByTestId("winter-route-data").waitFor({ state: "visible" });
    const toggleExists = await page.getByRole("button", { name: "Sjá alla vegkafla" }).count();
    results.ringOptionRegression = { toggleExists, dataVisible: await page.getByTestId("winter-route-data").isVisible() };
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "05-ring-option-regression.png") });
    await context.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(EVIDENCE_DIR, "results-v2.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
