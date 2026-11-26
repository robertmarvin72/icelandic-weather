// Ticket #492, direct-flow, C7/P8 -- real-browser STUB evidence for this
// round: the removed mode toggle (no more "Velja staði" click needed --
// the choose-flow is now the ONLY flow), the fixed-route adapter (Vík/
// Borgarnes via /api/winter-route?routeId=...), the redesigned
// RoadOverviewSection (one dense default list, one "Sjá alla vegkafla"
// toggle, no duplicates), and the P6 "Óþekkt ástand" surface-category
// fix. Same no-live-network convention as every prior round (page.route
// interception only, built from direct-flow-fixtures.json). Kept on
// disk after running (P8 convention). Run from the repo root with vite
// dev already listening on :5173:
//   node docs/ai/tasks/ticket-492/direct-flow/evidence/direct-flow-evidence.mjs
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, "direct-flow-fixtures.json"), "utf-8"));
// Reuse the existing time-slider fixtures for the one old ring-option
// pair regression check (real-handler-built, already on disk -- not
// rebuilt here).
const ringFixtures = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "..", "time-slider", "evidence", "time-slider-fixtures.json"), "utf-8")
);

function respondFixedRoute(payload) {
  return (route, request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/winter-route") return route.fulfill({ json: payload });
    return route.continue();
  };
}
function respondGeometryPair(fixture) {
  return (route, request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/winter-route-geometry") return route.fulfill({ json: fixture.geometry });
    if (url.pathname === "/api/winter-route-data") return route.fulfill({ json: fixture.data24 });
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

// No more "Velja staði" click -- the choose-flow is the only flow now.
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

const EVIDENCE_DIR = __dirname;
const results = {};
const browser = await chromium.launch();

try {
  // --- Negative control: prove the "exactly one section instance" check
  // below can actually detect a duplicate, by deliberately re-rendering
  // the fixture's HTML twice via a tiny injected script after load. ---
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await setupPage(context, { lang: "is", theme: "light" });
    await page.route("**/api/winter-route**", respondFixedRoute(fixtures.vik));
    await selectAndSubmit(page, "reykjavik-raudavatn", "vik", "is");
    const nameEl = await page.locator('[data-testid="winter-route-data"] >> text=Rauðavatn').first().elementHandle().catch(() => null);
    // Deliberately duplicate the road-section list container's innerHTML
    // to simulate what the OLD "lifted chip + collapsed-details copy"
    // bug would have produced, and confirm the real check below would
    // have caught it.
    const dup = await page.evaluate(() => {
      const lists = document.querySelectorAll('[data-testid="winter-route-data"] ol');
      if (lists.length === 0) return false;
      const first = lists[0];
      first.insertAdjacentHTML("beforeend", first.innerHTML);
      return true;
    });
    const names = await page.evaluate(() =>
      [...document.querySelectorAll('[data-testid="winter-route-data"] li span.font-medium')].map((e) => e.textContent)
    );
    const counts = {};
    for (const n of names) counts[n] = (counts[n] ?? 0) + 1;
    const hasDuplicate = Object.values(counts).some((c) => c > 1);
    results.negativeControl = { dupInjected: dup, counts, hasDuplicate };
    if (!hasDuplicate) throw new Error("NEGATIVE CONTROL FAILED: duplicate-name check did not detect the deliberately injected duplicate");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "00-negative-control-duplicate.png") });
    await context.close();
  }

  // --- Main matrix: Vík (fixed-route adapter), 1280/360 x is/en, each
  // narrow -> open full list -> close again, checking: section names
  // appear exactly once in the DOM at every step, exactly one toggle
  // control exists, no live network call, single fetch total. ---
  for (const width of [1280, 360]) {
    for (const lang of ["is", "en"]) {
      const context = await browser.newContext({ viewport: { width, height: width === 1280 ? 900 : 800 } });
      const page = await setupPage(context, { lang, theme: "light" });
      let fetchCount = 0;
      await page.route("**/api/winter-route**", (route, request) => {
        fetchCount += 1;
        return respondFixedRoute(fixtures.vik)(route, request);
      });
      await selectAndSubmit(page, "reykjavik-raudavatn", "vik", lang);

      const readNames = () =>
        page.evaluate(() => [...document.querySelectorAll('[data-testid="winter-route-data"] li span.font-medium')].map((e) => e.textContent));

      const namesNarrow = await readNames();
      await page.screenshot({ path: path.join(EVIDENCE_DIR, `01-vik-${width}-${lang}-narrow.png`), fullPage: width !== 1280 });

      const toggleBtn = page.getByRole("button", { name: toggleLabel(lang) });
      await toggleBtn.click();
      const namesOpen = await readNames();
      await page.screenshot({ path: path.join(EVIDENCE_DIR, `02-vik-${width}-${lang}-open.png`), fullPage: width !== 1280 });

      await toggleBtn.click();
      const namesClosed = await readNames();
      await page.screenshot({ path: path.join(EVIDENCE_DIR, `03-vik-${width}-${lang}-closed-again.png`), fullPage: width !== 1280 });

      const dupCheck = (names) => {
        const counts = {};
        for (const n of names) counts[n] = (counts[n] ?? 0) + 1;
        return Object.entries(counts).filter(([, c]) => c > 1);
      };

      results[`vik_${width}_${lang}`] = {
        fetchCountAfterNarrow: fetchCount,
        namesNarrowCount: namesNarrow.length,
        namesOpenCount: namesOpen.length,
        namesClosedCount: namesClosed.length,
        duplicatesNarrow: dupCheck(namesNarrow),
        duplicatesOpen: dupCheck(namesOpen),
        duplicatesClosed: dupCheck(namesClosed),
        toggleCountOnPage: await page.getByRole("button", { name: /Sjá alla vegkafla|View all road sections/ }).count(),
      };
      await context.close();
    }
  }

  // --- Borgarnes (the second fixed-route-adapter pair) -- single
  // representative capture, 1280px/IS, plus the section-coverage note. ---
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await setupPage(context, { lang: "is", theme: "light" });
    await page.route("**/api/winter-route**", respondFixedRoute(fixtures.borgarnes));
    await selectAndSubmit(page, "reykjavik-raudavatn", "borgarnes", "is");
    const coverageNoteVisible = await page.getByText("Færðargögn fyrir suma kafla geta náð yfir lengri vegkafla en þann hluta sem þessi leið notar.").isVisible();
    results.borgarnes = { coverageNoteVisible };
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "04-borgarnes-1280-is.png") });
    await context.close();
  }

  // --- P6 cases A/B/C/D -- single 1280px/IS capture each, open details
  // to show the first segment's own pill + notices directly. ---
  for (const [key, label] of [
    ["caseA_knownSurfaceUnclassifiedNotice", "05-p6-caseA"],
    ["caseB_ambiguous", "06-p6-caseB"],
    ["caseC_unclassifiedSurface", "07-p6-caseC"],
    ["caseD_knownSurfaceUnclassifiedVidbotaruppl", "08-p6-caseD"],
  ]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
    const page = await setupPage(context, { lang: "is", theme: "light" });
    await page.route("**/api/winter-route**", respondFixedRoute(fixtures[key]));
    await selectAndSubmit(page, "reykjavik-raudavatn", "vik", "is");
    // The first segment is always flagged in every P6 case (unknown or
    // hazard), so it's already in the default list -- no need to open.
    const firstRowText = await page.locator('[data-testid="winter-route-data"] ol li').first().innerText();
    results[key] = { firstRowText };
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `${label}.png`) });
    await context.close();
  }

  // --- One old ring-option pair, as a regression check (budardalur<->
  // holmavik, real existing RoadOverviewSection consumer, untouched by
  // the fixed-route adapter at all). ---
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await setupPage(context, { lang: "is", theme: "light" });
    await page.route("**/api/winter-route-geometry**", respondGeometryPair(ringFixtures));
    await page.route("**/api/winter-route-data**", respondGeometryPair(ringFixtures));
    await selectAndSubmit(page, "budardalur", "holmavik", "is");
    const toggleBtn = page.getByRole("button", { name: toggleLabel("is") });
    const toggleExists = await toggleBtn.count();
    results.regressionRingPair = { toggleExists, dataVisible: await page.getByTestId("winter-route-data").isVisible() };
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "09-regression-ring-pair.png") });
    await context.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(EVIDENCE_DIR, "results.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
