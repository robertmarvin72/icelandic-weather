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
// this file). Ticket #493 removed the frontend's per-point ETA/distance
// resolution entirely, but the backend payload still carries this field
// (API payload/route config is out of scope for #493) — kept here only
// for fixture realism, not used by anything these tests assert on.
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
    routeId: "raudavatn-vik",
    expectedPointCount: 6,
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

// Ticket #493 removed the #490 departure-time comparison area entirely,
// which used to render its own copy of the same "Mestar hviður"/"Mest
// úrkoma"/"Lægsti hiti" metric lines. Scoping to the summary's own
// <section> (its heading is unique/stable) is kept for robustness.
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

    // Ticket #491, V1 — h1 now comes from WINTER_ROUTE_OPTIONS' own nameIs
    // (spaced en dash) — same text as the route <select>'s own option, so
    // this must be a heading/role lookup, not plain getByText (ambiguous).
    await expect(page.getByRole("heading", { level: 1, name: "Rauðavatn – Vík" })).toBeVisible();
    await expect(page.getByLabel("Spátími")).toBeVisible();
    for (const [, nameIs] of SEGMENT_DEFS) {
      await expect(page.getByText(nameIs, { exact: true }).first()).toBeVisible();
    }
    // All six forecast cards show the same shared selected hour's
    // temperature, plus the #489 route summary's own "Lægsti hiti: -2,3 °C
    // — ..." line (Playwright's getByText is a substring match by default,
    // unlike RTL's exact-match default). The #490 comparison area that
    // used to add two more matching copies here was removed by #493.
    await expect(page.getByText("-2,3 °C")).toHaveCount(7);
    await page.screenshot({ path: "test-results/ticket-486/desktop-light-is.png", fullPage: true });
  });

  test("mobile (375px), light, English: stacked single-column layout, no map", async ({ page }) => {
    await primePageState(page, { lang: "en", theme: "light" });
    await stubWinterRoute(page, basePayload());
    await page.setViewportSize({ width: 375, height: 800 });
    await gotoPage(page);

    await expect(page.getByLabel("Forecast time")).toBeVisible();
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
    await expect(page.getByRole("heading", { level: 1, name: "Rauðavatn – Vík" })).toBeVisible();
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

    const select = page.getByLabel("Spátími");
    await select.waitFor({ state: "visible" });
    await select.focus();
    await expect(select).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(100);

    expect(requestCount).toBe(1);
  });

  // Ticket #493 correction round, V4 (T1/U4) — the previous keyboard tests
  // above ran at 1280px, never proving the keyboard interaction at a narrow
  // viewport as T1 required. This confirms the measured viewport width
  // itself, keyboard-driven stepping of the forecast-time picker, that
  // BOTH the summary and all six cards move to the new hour's own value
  // (not just `select.value`), that the request count stays unchanged, and
  // that there is no horizontal scroll at 375px.
  test("mobile (375px) keyboard (V4): stepping the forecast-time picker with the keyboard updates the summary and all six cards to the new hour's value, with no extra request and no horizontal scroll", async ({
    page,
  }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    const payload = basePayload();
    payload.forecast.points.forEach((p) => {
      p.series.temperature_2m = EXPECTED_HOURS.map((_, h) => -2.3 + h * 0.01);
    });
    let requestCount = 0;
    await page.route("**/api/winter-route**", (route) => {
      requestCount += 1;
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
    });
    await page.setViewportSize({ width: 375, height: 800 });
    await gotoPage(page);

    const viewport = page.viewportSize();
    expect(viewport.width).toBe(375);

    const summary = summarySection(page);
    await expect(summary.getByText(/Lægsti hiti: -2,3 °C — Rauðavatn/)).toBeVisible();

    const select = page.getByLabel("Spátími");
    await select.waitFor({ state: "visible" });
    await select.focus();
    await expect(select).toBeFocused();
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("ArrowDown");
    }
    await expect(select).toHaveValue(EXPECTED_HOURS[10]);

    // Selected hour = EXPECTED_HOURS[10] -> -2.3 + 10*0.01 = -2.2 — both the
    // summary AND a card move to this new hour's own value.
    await expect(summary.getByText(/Lægsti hiti: -2,2 °C — Rauðavatn/)).toBeVisible();
    await expect(page.getByText("-2,2 °C").first()).toBeVisible();

    expect(requestCount).toBe(1);

    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement;
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
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
  // coverage for the summary itself, shared-forecast-time sync with the
  // cards (#493), and the partial/stale-aware notice count — reusing this
  // same spec file/stubbing setup, no new tooling.
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

  test("#489/#493: changing the forecast time updates the summary together with the six cards, with no second network request", async ({
    page,
  }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    const payload = basePayload();
    // Ticket #493 — every point now reads the SAME shared selected hour
    // directly (no per-point distance/ETA resolution), so a distinct
    // per-hour (not per-point) temperature is enough to independently
    // observe a real forecast-time change.
    payload.forecast.points.forEach((p) => {
      p.series.temperature_2m = EXPECTED_HOURS.map((_, h) => -2.3 + h * 0.01);
    });
    let requestCount = 0;
    await page.route("**/api/winter-route**", (route) => {
      requestCount += 1;
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    const select = page.getByLabel("Spátími");
    await select.waitFor({ state: "visible" });
    const summary = summarySection(page);
    // Selected hour = EXPECTED_HOURS[0] -> -2.3 + 0*0.01 = -2.3. All six
    // points share this identical value, so the tie-break winner is
    // always P1 (first in fixed route order) — "Rauðavatn...".
    await expect(summary.getByText(/Lægsti hiti: -2,3 °C — Rauðavatn/)).toBeVisible();

    await select.selectOption({ index: 10 });
    // Selected hour = EXPECTED_HOURS[10] -> -2.3 + 10*0.01 = -2.2.
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
});
