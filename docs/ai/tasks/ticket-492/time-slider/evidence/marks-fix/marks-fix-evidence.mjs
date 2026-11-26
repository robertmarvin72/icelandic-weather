// Ticket #492, time-slider, marks-fix round, P2 -- real-browser
// measurement for the mark-overlap fix. Reuses the SAME fixture/evidence
// technique as ../time-slider-evidence.mjs (page.route + real-handler-
// built STUB data, no live upstream), writing new data/images into THIS
// marks-fix/ folder only -- nothing in the parent evidence/ folder is
// overwritten or deleted. Run from the repo root with vite dev already
// listening on :5173:
//   node docs/ai/tasks/ticket-492/time-slider/evidence/marks-fix/marks-fix-evidence.mjs
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, "marks-fix-fixtures.json"), "utf-8"));
// P3 -- the original round-1 fixture (24-hour window, NOT one of the
// midnight-edge-case windows above), reused for the corrected "control
// + table in view" screenshots: round-1's own captioned claim that
// images 01/02 showed "control+table in view" was wrong (the slider was
// cut off at the very bottom edge of the viewport, no table row visible
// at all) -- this is the SAME scenario, re-shot with a real computed
// scroll position this time.
const parentFixtures = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "time-slider-fixtures.json"), "utf-8"));

function respondFor(fixture) {
  return (route, request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/winter-route-geometry") return route.fulfill({ json: fixture.geometry });
    if (url.pathname === "/api/winter-route-data") return route.fulfill({ json: fixture.data });
    return route.continue();
  };
}

async function setupPage(context, { lang, theme }) {
  const page = await context.newPage();
  await page.addInitScript(([lang, theme]) => {
    window.localStorage.setItem("lang", JSON.stringify(lang));
    window.localStorage.setItem("theme", JSON.stringify(theme));
  }, [lang, theme]);
  return page;
}

async function selectBudardalurHolmavik(page, fixture, lang) {
  await page.route("**/api/winter-route-geometry**", respondFor(fixture));
  await page.route("**/api/winter-route-data**", respondFor(fixture));
  await page.goto("http://localhost:5173/winter-route");
  const chooseLabel = lang === "is" ? "Velja staði" : "Choose places";
  await page.getByRole("button", { name: chooseLabel }).click();
  const fromLabel = lang === "is" ? "Frá" : "From";
  const toLabel = lang === "is" ? "Til" : "To";
  const fromInput = page.getByRole("combobox", { name: fromLabel, exact: true });
  await fromInput.click();
  await fromInput.fill("budardal");
  await page.locator('[data-place-id="budardalur"]').first().click();
  const toInput = page.getByRole("combobox", { name: toLabel, exact: true });
  await toInput.click();
  await toInput.fill("holmav");
  await page.locator('[data-place-id="holmavik"]').first().click();
  const submitLabel = lang === "is" ? "Sýna leið" : "Show route";
  await page.getByRole("button", { name: submitLabel }).click();
  await page.getByTestId("winter-route-data").waitFor({ state: "visible" });
  await page.waitForFunction(() => document.fonts.ready);
}

// P2(ii)/(iii) -- real measured track width, every VISIBLE mark's own
// rect, the smallest real gap between any two consecutive visible
// marks' edges (not just centers, and not counting a `display:none`
// secondary mark's own zero-size rect -- the exact measurement bug
// found and fixed in the prior evidence round), and font metadata.
async function measureMarks(page) {
  return page.evaluate(() => {
    const slider = document.querySelector('input[type="range"]');
    const sliderRect = slider.getBoundingClientRect();
    const marksContainer = slider.parentElement.querySelector('[aria-hidden="true"]');
    const allMarkEls = marksContainer ? [...marksContainer.querySelectorAll("span")] : [];
    const visible = allMarkEls
      .map((el) => ({ label: el.textContent, rect: el.getBoundingClientRect() }))
      .filter((m) => m.rect.width > 0 && m.rect.height > 0)
      .sort((a, b) => a.rect.left - b.rect.left);

    let minGapPx = Infinity;
    for (let i = 1; i < visible.length; i++) {
      const gap = visible[i].rect.left - visible[i - 1].rect.right;
      if (gap < minGapPx) minGapPx = gap;
    }
    const overlapCount = visible.reduce((acc, m, i) => (i > 0 && m.rect.left < visible[i - 1].rect.right ? acc + 1 : acc), 0);

    return {
      trackWidth: sliderRect.width,
      totalMarkCount: allMarkEls.length,
      visibleMarkCount: visible.length,
      visibleMarks: visible.map((m) => ({ label: m.label, left: Math.round(m.rect.left), right: Math.round(m.rect.right), width: Math.round(m.rect.width) })),
      minGapPx: Number.isFinite(minGapPx) ? Math.round(minGapPx * 10) / 10 : null,
      overlapCount,
    };
  });
}

async function pageMeta(page) {
  return page.evaluate(() => ({
    isDark: document.documentElement.classList.contains("dark"),
    dpr: window.devicePixelRatio,
    fontFamily: getComputedStyle(document.body).fontFamily,
    lang: JSON.parse(window.localStorage.getItem("lang") ?? "null"),
    theme: JSON.parse(window.localStorage.getItem("theme") ?? "null"),
  }));
}

const EVIDENCE_DIR = __dirname;
const results = {};
const browser = await chromium.launch();

try {
  // --- P2(iv): negative control -- prove the measurement can still
  // detect a real overlap, using the SAME deliberately-broken-CSS
  // technique the prior evidence round used (not a baseline rebuild).
  {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await setupPage(context, { lang: "is", theme: "light" });
    await selectBudardalurHolmavik(page, fixtures.start2300, "is");
    await page.addStyleTag({ content: '[data-testid="winter-route-data"] [aria-hidden="true"] span.absolute { position: static !important; display: inline-block !important; width: 300px !important; }' });
    const broken = await measureMarks(page);
    results.negativeControl = broken;
    if (broken.overlapCount === 0) throw new Error("NEGATIVE CONTROL FAILED: measurement did not detect the deliberately broken marks row");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "00-negative-control-broken.png") });
    await context.close();
  }

  // --- The exact regression windows: 23:00 and 03:00 UTC start, 360 and 320px. ---
  for (const [name, fixtureKey] of [["2300", "start2300"], ["0300", "start0300"]]) {
    for (const width of [360, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 800 } });
      const page = await setupPage(context, { lang: "is", theme: "light" });
      await selectBudardalurHolmavik(page, fixtures[fixtureKey], "is");
      const m = await measureMarks(page);
      const meta = await pageMeta(page);
      results[`start${name}_${width}px`] = { ...m, ...meta };
      const slider = page.locator('input[type="range"]');
      await slider.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(EVIDENCE_DIR, `0${name === "2300" ? "1" : "2"}-start${name}-${width}px-is-light.png`) });
      await context.close();
    }
  }

  // --- EN/dark re-check at 360px for the same 23:00 window (language/theme don't change geometry, but logged per P2(iii)). ---
  {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await setupPage(context, { lang: "en", theme: "dark" });
    await selectBudardalurHolmavik(page, fixtures.start2300, "en");
    const m = await measureMarks(page);
    const meta = await pageMeta(page);
    results.start2300_360px_en_dark = { ...m, ...meta };
    await context.close();
  }

  // --- sm:-threshold window (start 11:00) at 640 and 768px -- where SECONDARY marks also become visible. ---
  for (const width of [640, 768]) {
    const context = await browser.newContext({ viewport: { width, height: 800 } });
    const page = await setupPage(context, { lang: "is", theme: "light" });
    await selectBudardalurHolmavik(page, fixtures.start1100, "is");
    const m = await measureMarks(page);
    results[`start1100_${width}px`] = m;
    const slider = page.locator('input[type="range"]');
    await slider.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `03-start1100-${width}px-is-light.png`) });
    await context.close();
  }

  // --- 1280px desktop re-check (unaffected widths still clean). ---
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
    const page = await setupPage(context, { lang: "is", theme: "light" });
    await selectBudardalurHolmavik(page, fixtures.start2300, "is");
    const m = await measureMarks(page);
    results.start2300_1280px = m;
    await context.close();
  }

  // --- P3: corrected "control + table in view" screenshots, with the
  // scroll position/temp-difference genuinely COMPUTED and recorded in
  // JSON, not just claimed in a caption. Scrolls so the control sits
  // near the TOP of the viewport (not merely "the slider is somewhere
  // on screen"), leaving room below it for real table rows.
  async function scrollControlNearTop(page, offsetFromTop = 96) {
    await page.evaluate((offset) => {
      const slider = document.querySelector('input[type="range"]');
      const rect = slider.getBoundingClientRect();
      window.scrollBy(0, rect.top - offset);
    }, offsetFromTop);
  }
  async function controlAndFirstRowInView(page) {
    return page.evaluate(() => {
      const slider = document.querySelector('input[type="range"]');
      const firstRow = document.querySelectorAll('[role="row"]')[1]; // [0] is the header row
      const sRect = slider.getBoundingClientRect();
      const rRect = firstRow ? firstRow.getBoundingClientRect() : null;
      const fits = (r) => r && r.top >= 0 && r.bottom <= window.innerHeight;
      return {
        scrollY: window.scrollY,
        sliderInViewport: fits(sRect),
        firstRowInViewport: fits(rRect),
        sliderRect: { top: Math.round(sRect.top), bottom: Math.round(sRect.bottom) },
        firstRowRect: rRect ? { top: Math.round(rRect.top), bottom: Math.round(rRect.bottom) } : null,
        innerHeight: window.innerHeight,
      };
    });
  }
  async function firstTempCell(page) {
    return page.locator('[role="cell"] span.whitespace-nowrap').nth(1).textContent();
  }

  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await setupPage(context, { lang: "is", theme: "light" });
    await selectBudardalurHolmavik(page, { geometry: parentFixtures.geometry, data: parentFixtures.data24 }, "is");
    await scrollControlNearTop(page);
    const viewA = await controlAndFirstRowInView(page);
    const tempA = await firstTempCell(page);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "04-control-table-in-view-1280-is-light-slot-a.png") });

    const nextBtn = page.getByRole("button", { name: "Næsti klukkutími" });
    await nextBtn.click();
    await nextBtn.click();
    await nextBtn.click();
    // A native button click moves focus to it, and focus-visible native
    // scroll-into-view behavior undoes the manual scroll above -- the
    // scroll must be re-applied before capturing slot B's own view.
    await scrollControlNearTop(page);
    const viewB = await controlAndFirstRowInView(page);
    const tempB = await firstTempCell(page);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "05-control-table-in-view-1280-is-light-slot-b.png") });

    results.controlTableInView_1280 = { viewA, viewB, tempA, tempB, distinctTemps: tempA !== tempB };
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await setupPage(context, { lang: "en", theme: "dark" });
    await selectBudardalurHolmavik(page, { geometry: parentFixtures.geometry, data: parentFixtures.data24 }, "en");
    await scrollControlNearTop(page);
    const view = await controlAndFirstRowInView(page);
    const temp = await firstTempCell(page);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "06-control-table-in-view-360-en-dark.png") });
    results.controlTableInView_360 = { view, temp };
    await context.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(EVIDENCE_DIR, "results.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
