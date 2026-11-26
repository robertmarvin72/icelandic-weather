// Ticket #492, time-slider, P8 -- Playwright/Chromium evidence script.
// Intercepts /api/winter-route-geometry and /api/winter-route-data via
// page.route with the STUB fixtures built by time-slider-fixtures.mjs
// (real handler output) -- no request ever reaches the real vite dev
// proxy or any upstream. KEPT after use (not deleted) per P8's own
// explicit instruction and Jonesy's round-3 finding R4. Run from the
// repo root with vite dev already listening on :5173:
//   node docs/ai/tasks/ticket-492/time-slider/evidence/time-slider-evidence.mjs
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, "time-slider-fixtures.json"), "utf-8"));

function respondFor(dataFixture) {
  return (route, request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/winter-route-geometry") return route.fulfill({ json: fixtures.geometry });
    if (url.pathname === "/api/winter-route-data") return route.fulfill({ json: dataFixture });
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

async function selectBudardalurHolmavik(page, dataFixture, lang) {
  await page.route("**/api/winter-route-geometry**", respondFor(dataFixture));
  await page.route("**/api/winter-route-data**", respondFor(dataFixture));
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

const EVIDENCE_DIR = __dirname;

// P8 -- measurement: the control+buttons+marks must stay within the
// viewport (no horizontal page scroll), each step button's own
// touch-target must be >= 44x44 (or its real measured size recorded),
// and no two sibling tick-mark labels may overlap horizontally.
async function measureSlider(page) {
  return page.evaluate(() => {
    const region = document.querySelector('[data-testid="winter-route-data"]');
    const slider = region.querySelector('input[type="range"]');
    const prevBtn = slider.closest("div").previousElementSibling;
    const nextBtn = slider.closest("div").nextElementSibling;
    const marks = [...region.querySelectorAll('[aria-hidden="true"] span.absolute')];

    const horizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    const prevRect = prevBtn.getBoundingClientRect();
    const nextRect = nextBtn.getBoundingClientRect();
    const sliderRect = slider.getBoundingClientRect();
    const viewportFit = {
      prevInViewport: prevRect.left >= 0 && prevRect.right <= document.documentElement.clientWidth,
      nextInViewport: nextRect.left >= 0 && nextRect.right <= document.documentElement.clientWidth,
      sliderInViewport: sliderRect.left >= 0 && sliderRect.right <= document.documentElement.clientWidth,
    };
    const touchTargets = { prev: { w: prevRect.width, h: prevRect.height }, next: { w: nextRect.width, h: nextRect.height } };

    // Only VISIBLE marks (a `hidden` secondary mark below `sm:` has a
    // zero-size rect, not a real position) can meaningfully overlap --
    // counting hidden marks' (0,0,0,0) rects as real geometry would
    // produce a false "overlap" that has nothing to do with the actual
    // rendered page.
    const visibleMarkRects = marks
      .map((m) => m.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0)
      .sort((a, b) => a.left - b.left);
    let markOverlaps = 0;
    for (let i = 1; i < visibleMarkRects.length; i++) {
      if (visibleMarkRects[i].left < visibleMarkRects[i - 1].right) markOverlaps++;
    }

    return { horizontalScroll, viewportFit, touchTargets, markCount: marks.length, visibleMarkCount: visibleMarkRects.length, markOverlaps };
  });
}

async function measureNegativeControl(page) {
  // Deliberately break the layout: force the marks row far wider than
  // its own container, which must overlap and overflow -- proves the
  // measurement above can actually detect a real problem.
  await page.addStyleTag({ content: '[data-testid="winter-route-data"] [aria-hidden="true"] span.absolute { position: static !important; display: inline-block !important; width: 300px !important; }' });
  return measureSlider(page);
}

const results = {};
const browser = await chromium.launch();

try {
  // --- Negative control first (1280, IS light, 24-hour fixture). ---
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
    const page = await setupPage(context, { lang: "is", theme: "light" });
    await selectBudardalurHolmavik(page, fixtures.data24, "is");
    const broken = await measureNegativeControl(page);
    results.negativeControl = broken;
    if (broken.markOverlaps === 0) throw new Error("NEGATIVE CONTROL FAILED: measurement did not detect the deliberately broken marks row");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "00-negative-control-broken.png") });
    await context.close();
  }

  // --- Real desktop, 1280 IS light, 24-hour (midnight-crossing) fixture. ---
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
    const page = await setupPage(context, { lang: "is", theme: "light" });
    await selectBudardalurHolmavik(page, fixtures.data24, "is");

    const before = await measureSlider(page);
    const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    const dpr = await page.evaluate(() => window.devicePixelRatio);
    const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    results.desktop1280 = { ...before, isDark, dpr, fontFamily, lang: "is", theme: "light", hours: fixtures.data24.forecast.window.expectedHours.length };

    // Real keyboard flow on the slider itself.
    const slider = page.locator('input[type="range"]');
    await slider.focus();
    await page.keyboard.press("End");
    const valAfterEnd = await slider.inputValue();
    await page.keyboard.press("Home");
    const valAfterHome = await slider.inputValue();
    await page.keyboard.press("ArrowRight");
    const valAfterArrow = await slider.inputValue();
    await page.keyboard.press("PageUp");
    const valAfterPageUp = await slider.inputValue();
    results.keyboardFlow = { valAfterEnd, valAfterHome, valAfterArrow, valAfterPageUp };

    // Scroll so the slider AND a bit of the table are in view (not the
    // page header), capture the table at this slot, then step to a
    // different slot in the SAME session for the 2nd value.
    await slider.scrollIntoViewIfNeeded();
    // Index 1 (not 0) among .whitespace-nowrap spans in the first data
    // row is the TEMPERATURE value -- index 0 is the weather condition
    // text, which repeats across hours in this fixture (weather_code is
    // only varied every 6h) and would make this check vacuously pass.
    const tempCellsBefore = await page.locator('[role="cell"] span.whitespace-nowrap').nth(1).textContent();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "01-desktop-1280-is-light-slot-a.png") });

    // Step forward from wherever the keyboard flow above left it (h=3)
    // -- NOT reset to Home first, which would land back on the exact
    // same h=3 slot after 3 "next" clicks and make this check vacuous.
    const nextBtn = page.getByRole("button", { name: "Næsti klukkutími" });
    await nextBtn.click();
    await nextBtn.click();
    await nextBtn.click();
    const tempCellsAfter = await page.locator('[role="cell"] span.whitespace-nowrap').nth(1).textContent();
    results.twoDistinctSlots = { tempCellsBefore, tempCellsAfter, distinct: tempCellsBefore !== tempCellsAfter };
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "02-desktop-1280-is-light-slot-b.png") });

    // Mouse drag via Playwright pointer actions directly on the slider.
    const box = await slider.boundingBox();
    await page.mouse.move(box.x + 5, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 5, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    const valAfterDrag = await slider.inputValue();
    results.mouseDrag = { valAfterDrag, expectedMax: String((fixtures.data24.forecast.window.expectedHours.length - 1)) };

    await context.close();
  }

  // --- Real mobile, 360 EN dark. ---
  {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await setupPage(context, { lang: "en", theme: "dark" });
    await selectBudardalurHolmavik(page, fixtures.data24, "en");
    const m = await measureSlider(page);
    const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    results.mobile360 = { ...m, isDark, lang: "en", theme: "dark" };
    const slider = page.locator('input[type="range"]');
    await slider.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "03-mobile360-en-dark.png") });
    await context.close();
  }

  // --- 320px (information-only, per P8's own "upplýsingaviðmið"). ---
  {
    const context = await browser.newContext({ viewport: { width: 320, height: 800 } });
    const page = await setupPage(context, { lang: "is", theme: "light" });
    await selectBudardalurHolmavik(page, fixtures.data24, "is");
    const m = await measureSlider(page);
    results.info320 = m;
    await context.close();
  }

  // --- n=1 boundary example (one screenshot is enough per P8). ---
  {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await setupPage(context, { lang: "is", theme: "light" });
    await selectBudardalurHolmavik(page, fixtures.data1, "is");
    const slider = page.locator('input[type="range"]');
    results.oneSlot = {
      disabled: await slider.isDisabled(),
      prevDisabled: await page.getByRole("button", { name: "Fyrri klukkutími" }).isDisabled(),
      nextDisabled: await page.getByRole("button", { name: "Næsti klukkutími" }).isDisabled(),
    };
    await slider.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "04-mobile360-is-light-n1.png") });
    await context.close();
  }

  // --- n=0 boundary example. ---
  {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await setupPage(context, { lang: "is", theme: "light" });
    await selectBudardalurHolmavik(page, fixtures.data0, "is");
    results.zeroSlots = { sliderPresent: (await page.locator('input[type="range"]').count()) > 0 };
    await page.getByText("Veðurspá er ekki tiltæk.").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "05-mobile360-is-light-n0.png") });
    await context.close();
  }

  results.touchEmulation = "NOT performed as a real touch device -- Playwright's own touch emulation (hasTouch context option) was not exercised this round; mouse+keyboard flows above are real, touch is NOT_TESTED, not substituted silently.";
  results.realZoom200 = "NOT_TESTED -- no OS-level zoom tool/computer-use available in this environment. Owner step: open /winter-route, Velja staði, Búðardalur->Hólmavík, Sýna leið; press Ctrl/Cmd + three times; confirm the slider/buttons/marks and table stay legible with no clipped text.";
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(EVIDENCE_DIR, "results.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
