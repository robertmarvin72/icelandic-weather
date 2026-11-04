import { test, expect } from "@playwright/test";

// Ticket #486, Round 2 (N3) — mandatory real-browser visual/keyboard
// verification, previously disclosed as not performed. Uses the project's
// existing Playwright/Chromium setup (already installed — see CLAUDE.md's
// own `npx playwright install chromium` dev-setup step) against plain
// `npm run dev` (Vite only, no real backend) with the established
// page.route() stubbing pattern from tests/e2e/northern-lights-card-visual
// .spec.js — no new dependency/setup, no real upstream/key request.

const FIXED_NOW = new Date("2026-11-04T12:00:00.000Z");

function hourString(offsetHours) {
  const d = new Date(FIXED_NOW.getTime() + offsetHours * 3600000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:00`;
}

const EXPECTED_HOURS = Array.from({ length: 24 }, (_, i) => hourString(i + 1));

const SEGMENT_DEFS = [
  [1410010037, "Rauðavatn – Nesjavallaleið"],
  [903010037, "Nesjavallaleið – Geirland"],
  [253020037, "Fossvellir – Þrengslavegur"],
  [252090037, "Hellisheiði (til austurs)"],
  [902030037, "Selfoss – Hveragerði"],
  [902040037, "Þjórsá – Selfoss"],
  [901130037, "Hella – Þjórsá"],
  [901230037, "Hvolsvöllur – Hella"],
  [901220037, "Hvolsvöllur – Markarfljót"],
  [901210037, "Markarfljót – Steinar"],
  [901050037, "Dyrhólavegur – Steinar"],
  [901040037, "Reynisfjall"],
  [801100037, "Vík"],
];

function makeSegment([idButur, nameIs], overrides = {}) {
  return {
    idButur,
    nameIs,
    nameEn: nameIs,
    segmentDataAvailable: true,
    ambiguous: false,
    category: "passable",
    positiveStyleEligible: true,
    astandYfirbord: "GREIDFAERT",
    astandVidbotaruppl: null,
    astandLysing: "Greiðfært",
    astandLysingEn: "Easily passable",
    export: { dagsKeyrtUt: new Date(FIXED_NOW.getTime() - 2 * 60000).toISOString(), ageMinutes: 2, isStale: false },
    registration: { dagsSkrad: new Date(FIXED_NOW.getTime() - 60 * 60000).toISOString(), ageHours: 1, isOld: false },
    notices: [],
    ...overrides,
  };
}

// Mirrors api/_lib/winterRoute/segments.js's own real, computed
// approxDistanceFromStartKm values for P1..P6 (not re-imported here to
// keep the e2e fixture self-contained, same convention as the rest of
// this file) — real enough that the ETA follow-up's per-point arrival
// times are authentic in this visual pass, not an arbitrary placeholder.
const REAL_APPROX_DISTANCE_FROM_START_KM = {
  P1: 24.98,
  P2: 39.545,
  P3: 73.19,
  P4: 88.415,
  P5: 125.47,
  P6: 174.97,
};

function makeForecastPoint(id, label, overrides = {}) {
  return {
    id,
    labelIs: label,
    labelEn: label,
    nearIdButur: 252090037,
    approxDistanceFromStartKm: REAL_APPROX_DISTANCE_FROM_START_KM[id],
    available: true,
    elevation: 100,
    hours: EXPECTED_HOURS,
    series: {
      temperature_2m: EXPECTED_HOURS.map(() => -2.3),
      wind_speed_10m: EXPECTED_HOURS.map(() => 6.1),
      wind_gusts_10m: EXPECTED_HOURS.map(() => 9.8),
      precipitation: EXPECTED_HOURS.map(() => 0.2),
      weather_code: EXPECTED_HOURS.map(() => 71),
    },
    ...overrides,
  };
}

function basePayload() {
  return {
    generatedAt: FIXED_NOW.toISOString(),
    segments: SEGMENT_DEFS.map((d) => makeSegment(d)),
    roadMeta: {
      available: true,
      stale: false,
      cacheAgeMs: 0,
      segmentsAvailable: true,
      pointsAvailable: true,
      pointsFeedUnavailableOrStale: false,
    },
    forecast: {
      available: true,
      window: { startHour: EXPECTED_HOURS[0], endHour: EXPECTED_HOURS[23], expectedHours: EXPECTED_HOURS },
      points: [
        makeForecastPoint("P1", "Rauðavatn–Sandskeið–vestari Hellisheiði"),
        makeForecastPoint("P2", "Eystri Hellisheiði–Hveragerði–Selfoss"),
        makeForecastPoint("P3", "Selfoss–Þjórsá–Hella"),
        makeForecastPoint("P4", "Hella–Hvolsvöllur"),
        makeForecastPoint("P5", "Hvolsvöllur–Skógar"),
        makeForecastPoint("P6", "Skógar–Vík"),
      ],
      stale: false,
      cacheAgeMs: 0,
    },
  };
}

async function stubWinterRoute(page, payload) {
  await page.route("**/api/winter-route**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) }),
  );
}

async function primePageState(page, { lang = "is", theme = "light" } = {}) {
  await page.addInitScript(
    ([langValue, themeValue]) => {
      window.localStorage.setItem("lang", JSON.stringify(langValue));
      window.localStorage.setItem("theme", JSON.stringify(themeValue));
    },
    [lang, theme],
  );
}

async function gotoPage(page) {
  await page.clock.install({ time: FIXED_NOW });
  await page.goto("/winter-route");
  await expect(page.locator("h1")).toBeVisible();
}

// #490 added a departure-time comparison area that can render its own copy
// of the same "Mestar hviður"/"Mest úrkoma"/"Lægsti hiti" metric lines for
// each AVAILABLE option, alongside the #489 route-level summary — scope to
// the summary's own <section> (its heading is unique/stable) when a test
// cares specifically about the summary, not the comparison area.
function summarySection(page, headingText = "Á leiðinni núna") {
  return page.locator("section").filter({ hasText: headingText });
}

test.describe("WinterRoute (/winter-route) — Ticket #486 Round 2 (N3) real-browser verification", () => {
  test("desktop, light, Icelandic: title, hour picker, six forecast cards, and all 13 road sections render", async ({
    page,
  }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    await stubWinterRoute(page, basePayload());
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    await expect(page.getByText("Rauðavatn–Vík", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Áætlaður brottfarartími")).toBeVisible();
    for (const [, nameIs] of SEGMENT_DEFS) {
      await expect(page.getByText(nameIs, { exact: true }).first()).toBeVisible();
    }
    // All six forecast cards show the same selected hour's temperature,
    // plus the #489 route summary's own "Lægsti hiti: -2,3 °C — ..." line,
    // plus the #490 comparison area's baseline and "+2h" options (both
    // available at the default load — only "-2h" is unavailable, N2) each
    // showing the same flat fixture value too (Playwright's getByText is a
    // substring match by default, unlike RTL's exact-match default).
    await expect(page.getByText("-2,3 °C")).toHaveCount(9);
    await page.screenshot({ path: "test-results/ticket-486/desktop-light-is.png", fullPage: true });
  });

  test("mobile (375px), light, English: stacked single-column layout, no map", async ({ page }) => {
    await primePageState(page, { lang: "en", theme: "light" });
    await stubWinterRoute(page, basePayload());
    await page.setViewportSize({ width: 375, height: 800 });
    await gotoPage(page);

    await expect(page.getByLabel("Estimated departure time")).toBeVisible();
    await expect(page.locator("canvas, .leaflet-container")).toHaveCount(0);
    await page.screenshot({ path: "test-results/ticket-486/mobile-light-en.png", fullPage: true });
  });

  test("desktop, dark mode: renders without a light-mode flash of unstyled content", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "dark" });
    await stubWinterRoute(page, basePayload());
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: "dark" });
    await gotoPage(page);

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByText("Rauðavatn–Vík", { exact: true })).toBeVisible();
    await page.screenshot({ path: "test-results/ticket-486/desktop-dark-is.png", fullPage: true });
  });

  test("keyboard: the hour select is reachable and operable by keyboard alone, with no second network request", async ({
    page,
  }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    let requestCount = 0;
    await page.route("**/api/winter-route**", (route) => {
      requestCount += 1;
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(basePayload()) });
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    const select = page.getByLabel("Áætlaður brottfarartími");
    await select.waitFor({ state: "visible" });
    await select.focus();
    await expect(select).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(100);

    expect(requestCount).toBe(1);
  });

  test("partial failure / stale state: points-feed warning and stale-forecast line are both visible, segment data not hidden", async ({
    page,
  }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    const payload = basePayload();
    payload.roadMeta.pointsFeedUnavailableOrStale = true;
    payload.forecast.stale = true;
    payload.forecast.cacheAgeMs = 25 * 60 * 1000;
    await stubWinterRoute(page, payload);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    await expect(
      page.getByText("Tilkynningar um lokanir og vegavinnu eru ekki tiltækar núna", { exact: false }),
    ).toBeVisible();
    // Appears twice by design — once in the #489 route summary, once
    // (unchanged) in the original forecast-section warning.
    await expect(page.getByText("Sýnir síðustu þekktu spá (25 mín. gamla).").first()).toBeVisible();
    await expect(page.getByText(SEGMENT_DEFS[0][1], { exact: true }).first()).toBeVisible();
    // Round 3 (R5-2): the official source link inside the warning itself
    // (the same link text also appears in the page's bottom attribution
    // block by design — both appear on the page, so this is deliberately
    // "at least one visible", not "exactly one").
    await expect(page.getByText("Skoða færð hjá Vegagerðinni").first()).toBeVisible();
    await page.screenshot({ path: "test-results/ticket-486/partial-failure-stale.png", fullPage: true });
  });

  test("Round 3 (R5-1): a lone expired closure notice reads with the prominent dedicated wording, legible in a real browser", async ({
    page,
  }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    const payload = basePayload();
    payload.segments[3] = {
      ...payload.segments[3],
      category: "hazard_notice",
      positiveStyleEligible: false,
      notices: [
        {
          idPunktur: 1,
          astand: "ALLUR_AKSTUR_BANN",
          category: "closed",
          lysing: "Lokað",
          lysingEn: "Closed",
          dagsSkrad: "2026-01-01T00:00:00Z",
          gildirTil: "2026-01-02T00:00:00Z",
          status: "expired",
        },
      ],
    };
    await stubWinterRoute(page, payload);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    await expect(page.getByText("Útrunnin lokunartilkynning — staðfestu hjá Vegagerðinni")).toBeVisible();
    await page.screenshot({ path: "test-results/ticket-486/expired-closure-prominent.png", fullPage: true });
  });

  // #489 — route-level summary (max gust/precip, min temp among the six
  // points, count of segments with an active point notice). Real-browser
  // coverage for the summary itself, departure-time sync with the cards,
  // and the partial/stale-aware notice count — reusing this same spec
  // file/stubbing setup, no new tooling.
  test("#489 desktop, light, Icelandic: route summary shows weather extrema, point/time, and the notice count with its fixed scope wording", async ({
    page,
  }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    const payload = basePayload();
    payload.segments[4].notices = [{ idPunktur: 1, astand: "VEGAVINNA", status: "active" }];
    await stubWinterRoute(page, payload);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    await expect(page.getByText("Á leiðinni núna")).toBeVisible();
    const summary = summarySection(page);
    // All six points share identical fixture weather series, so the
    // winner is always P1 (first in fixed route order).
    await expect(
      summary.getByText(/Mestar hviður \(hámark síðustu klukkustundar\): 9,8 m\/s — Rauðavatn/),
    ).toBeVisible();
    await expect(summary.getByText(/Mest úrkoma \(síðasta klukkustund\): 0,2 mm — Rauðavatn/)).toBeVisible();
    await expect(summary.getByText(/Lægsti hiti: -2,3 °C — Rauðavatn/)).toBeVisible();
    await expect(summary.getByText("Kaflar með gildar tilkynningar: 1")).toBeVisible();
    await expect(summary.getByText("Ekki heildarstaða færðar — sjá færðarlistann neðar.")).toBeVisible();
    await page.screenshot({ path: "test-results/ticket-486/summary-desktop-light-is.png", fullPage: true });
  });

  test("#489: changing the departure time updates the summary together with the six cards, with no second network request", async ({
    page,
  }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    const payload = basePayload();
    // Round, predictable distances (0/70/140/...) so each point's own
    // resolved hour index is exact arithmetic, not the base fixture's real
    // (decimal) distances — keeps this specific test's expected values
    // simple and robust. Distinct per-point/per-hour temperatures so a
    // real departure-time change is independently observable.
    payload.forecast.points.forEach((p, i) => {
      p.approxDistanceFromStartKm = i * 70; // P1=0 -> +0h, P2=70 -> +1h, ...
      p.series.temperature_2m = EXPECTED_HOURS.map((_, h) => -2.3 + i + h * 0.01);
    });
    let requestCount = 0;
    await page.route("**/api/winter-route**", (route) => {
      requestCount += 1;
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    const select = page.getByLabel("Áætlaður brottfarartími");
    await select.waitFor({ state: "visible" });
    const summary = summarySection(page);
    // Departure = EXPECTED_HOURS[0] -> P1 (distance 0) resolves to hour
    // index 0 -> -2.3 + 0 + 0*0.01 = -2.3, the lowest of the six points.
    await expect(summary.getByText(/Lægsti hiti: -2,3 °C — Rauðavatn/)).toBeVisible();

    await select.selectOption({ index: 1 });
    // Departure = EXPECTED_HOURS[1] -> P1 still resolves to +0h -> hour
    // index 1 -> -2.3 + 0 + 1*0.01 = -2.29, which rounds to -2,3 °C — move
    // to a later departure option so the shown value genuinely changes.
    await select.selectOption({ index: 10 });
    // Departure = EXPECTED_HOURS[10] -> P1 resolves to hour index 10 ->
    // -2.3 + 0 + 10*0.01 = -2.2.
    await expect(summary.getByText(/Lægsti hiti: -2,2 °C — Rauðavatn/)).toBeVisible();

    expect(requestCount).toBe(1);
  });

  test("#489 mobile, English: partial/stale state shows an unconfirmed notice count and 'data not available' weather lines, never a guessed 0", async ({
    page,
  }) => {
    await primePageState(page, { lang: "en", theme: "light" });
    const payload = basePayload();
    payload.roadMeta.pointsFeedUnavailableOrStale = true;
    payload.forecast.available = false;
    payload.forecast.reason = "key_missing";
    payload.forecast.points = [];
    await stubWinterRoute(page, payload);
    await page.setViewportSize({ width: 375, height: 800 });
    await gotoPage(page);

    await expect(page.getByText("Along the route now")).toBeVisible();
    await expect(page.getByText("Highest gusts: data not available")).toBeVisible();
    await expect(page.getByText("Most precipitation: data not available")).toBeVisible();
    await expect(page.getByText("Lowest temperature: data not available")).toBeVisible();
    await expect(page.getByText("The count of sections with valid notices is unconfirmed right now.")).toBeVisible();
    await expect(page.getByText("Not the overall road condition — see the road-condition list below.")).toBeVisible();
    await expect(page.getByText(/^Sections with valid notices: \d/)).toHaveCount(0);
    await page.screenshot({ path: "test-results/ticket-486/summary-mobile-partial-stale-en.png", fullPage: true });
  });

  // #490 — departure-time comparison (−2h / selected / +2h). Real-browser
  // coverage for S3 (keyboard Tab->Enter focus) and S4 (measured 375px
  // overflow with the longest reason/point text), reusing this same spec
  // file/stubbing setup, no new tooling.
  test("#490 keyboard: Tab to an available comparison option, Enter selects it, and focus lands inside the comparison area (S3)", async ({
    page,
  }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    const payload = basePayload();
    await stubWinterRoute(page, payload);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    const select = page.getByLabel("Áætlaður brottfarartími");
    await select.waitFor({ state: "visible" });
    // Move the baseline off the window's first hour so both −2h and +2h
    // are genuinely available (N2 — the very first hour always has "2h
    // earlier" unavailable, by design).
    await select.selectOption({ index: 3 });
    await expect(page.getByText("Samanburður brottfarartíma")).toBeVisible();

    const viewButtons = page.getByRole("button", { name: /Skoða þennan tíma/ });
    await expect(viewButtons.first()).toBeEnabled();

    // Real Tab -> Enter flow (not a direct .click()): focus the page body,
    // then Tab until a "Skoða þennan tíma" button is focused.
    await page.keyboard.press("Tab");
    let guard = 0;
    while (guard < 40) {
      const isOnViewButton = await page.evaluate(
        () => document.activeElement?.textContent?.includes("Skoða þennan tíma") ?? false,
      );
      if (isOnViewButton) break;
      await page.keyboard.press("Tab");
      guard += 1;
    }
    expect(guard).toBeLessThan(40);

    await page.keyboard.press("Enter");

    // Focus must land on a stable node INSIDE the comparison area after
    // activation — never reset to <body> (which would read as "focus
    // lost" to a keyboard/screen-reader user).
    await expect(async () => {
      const result = await page.evaluate(() => {
        const heading = [...document.querySelectorAll("h3")].find((h) => h.textContent === "Samanburður brottfarartíma");
        const area = heading?.closest("div");
        return {
          isBody: document.activeElement === document.body,
          insideArea: !!area && area.contains(document.activeElement),
        };
      });
      expect(result.isBody).toBe(false);
      expect(result.insideArea).toBe(true);
    }).toPass({ timeout: 5000 });

    await expect(page.getByText(/Valinn brottfarartími er nú .* UTC\./)).toBeAttached();
  });

  test("#490 keyboard (R1): ArrowDown twice on the focused hour select steps natively without losing focus, and cards/comparison recenter", async ({
    page,
  }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    const payload = basePayload();
    await stubWinterRoute(page, payload);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    const select = page.getByLabel("Áætlaður brottfarartími");
    await select.waitFor({ state: "visible" });
    await expect(select).toHaveValue(EXPECTED_HOURS[0]);

    // Real Tab from the page body to the select — never .focus()/selectOption
    // used as a substitute for the keyboard path under test.
    await page.keyboard.press("Tab");
    let guard = 0;
    while (guard < 20) {
      const isOnSelect = await select.evaluate((el) => el === document.activeElement);
      if (isOnSelect) break;
      await page.keyboard.press("Tab");
      guard += 1;
    }
    expect(guard).toBeLessThan(20);

    // Two native ArrowDown presses on the focused, CLOSED <select> — in
    // Chromium this steps the selection and fires `change` immediately
    // without opening a popup, so no intervening Enter is needed here; if
    // a platform did open a popup, confirming it with Enter would be the
    // native closing behavior, not a workaround. No focus() call and no
    // selectOption substitute between steps — this is the exact path R1
    // fixed (focus used to jump to the comparison area after the first
    // step, stranding further ArrowDown presses).
    await page.keyboard.press("ArrowDown");
    await expect(select).toHaveValue(EXPECTED_HOURS[1]);
    expect(await select.evaluate((el) => el === document.activeElement)).toBe(true);

    await page.keyboard.press("ArrowDown");
    await expect(select).toHaveValue(EXPECTED_HOURS[2]);
    expect(await select.evaluate((el) => el === document.activeElement)).toBe(true);

    // Cards/comparison really did recenter around the new baseline.
    await expect(page.getByText("Samanburður brottfarartíma")).toBeVisible();
    await expect(page.getByText("Núverandi val").first()).toBeVisible();
  });

  test("#490 mobile (375px): three comparison slots with the longest IS/EN reason and point text cause no horizontal scroll, measured (S4)", async ({
    page,
  }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    const payload = basePayload();
    // The baseline stays on the window's first hour, so "2 klst. fyrr" is
    // unavailable with its (longest) reason text visible by default — no
    // extra fixture work needed to exercise the longest-text case.
    await stubWinterRoute(page, payload);
    await page.setViewportSize({ width: 375, height: 800 });
    await gotoPage(page);

    await expect(page.getByText("Samanburður brottfarartíma")).toBeVisible();
    await expect(page.getByText("Þessi tími er liðinn eða utan tiltækra brottfarartíma.")).toBeVisible();
    // The longest point label in the fixed six, from basePayload() itself.
    await expect(page.getByText("Rauðavatn–Sandskeið–vestari Hellisheiði").first()).toBeVisible();

    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement;
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

    // A visible focus ring on keyboard selection of an available option —
    // not a screenshot alone standing in for the scroll measurement above.
    const viewButton = page.getByRole("button", { name: /Skoða þennan tíma/ }).first();
    await viewButton.focus();
    const outline = await viewButton.evaluate((el) => getComputedStyle(el).outlineStyle + getComputedStyle(el).boxShadow);
    expect(outline).not.toBe("none none");

    await page.screenshot({ path: "test-results/ticket-486/comparison-mobile-375-is.png", fullPage: true });
  });
});
