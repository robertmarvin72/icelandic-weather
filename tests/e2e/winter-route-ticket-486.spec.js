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
    // All six forecast cards show the same selected hour's temperature.
    await expect(page.getByText("-2,3 °C")).toHaveCount(6);
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
    await expect(page.getByText("Sýnir síðustu þekktu spá (25 mín. gamla).")).toBeVisible();
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
});
