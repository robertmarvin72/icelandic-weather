import { test, expect } from "@playwright/test";

// Ticket #491 — real-browser verification for the Rauðavatn–Borgarnes
// route selector added to the existing /winter-route page. Same
// stubbing/clock pattern as tests/e2e/winter-route-ticket-486.spec.js (no
// new tooling); the Vík fixtures below are copied verbatim rather than
// imported, same self-contained-fixture convention as that file.

const FIXED_NOW = new Date("2026-11-04T12:00:00.000Z");

function hourString(offsetHours) {
  const d = new Date(FIXED_NOW.getTime() + offsetHours * 3600000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:00`;
}

const EXPECTED_HOURS = Array.from({ length: 24 }, (_, i) => hourString(i + 1));

const VIK_SEGMENT_DEFS = [
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

const BORGARNES_SEGMENT_DEFS = [
  [914020037, "Suðurlandsv. um Hádegismóa"],
  [903020037, "Vesturlandsvegur"],
  [903030037, "Kjalarnes"],
  [904690037, "Hvalfjarðargöng"],
  [904000037, "Hvalfjarðargöng–Grundartangi"],
  [904010037, "Melasveit"],
  [804020037, "Hafnarfjall"],
  [904040037, "Borgarnes–Baulan"],
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

function makeForecastPoint(id, label, overrides = {}) {
  return {
    id,
    labelIs: label,
    labelEn: label,
    nearIdButur: 903030037,
    approxDistanceFromStartKm: 0,
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

function vikPayload() {
  return {
    routeId: "raudavatn-vik",
    expectedPointCount: 6,
    generatedAt: FIXED_NOW.toISOString(),
    segments: VIK_SEGMENT_DEFS.map((d) => makeSegment(d)),
    roadMeta: { available: true, stale: false, cacheAgeMs: 0, segmentsAvailable: true, pointsAvailable: true, pointsFeedUnavailableOrStale: false },
    forecast: {
      available: true,
      window: { startHour: EXPECTED_HOURS[0], endHour: EXPECTED_HOURS[23], expectedHours: EXPECTED_HOURS },
      points: ["P1", "P2", "P3", "P4", "P5", "P6"].map((id) => makeForecastPoint(id, `Vík-punktur ${id}`)),
      stale: false,
      cacheAgeMs: 0,
    },
  };
}

function borgarnesPayload() {
  return {
    routeId: "raudavatn-borgarnes",
    expectedPointCount: 4,
    generatedAt: FIXED_NOW.toISOString(),
    segments: BORGARNES_SEGMENT_DEFS.map((d) => makeSegment(d)),
    roadMeta: { available: true, stale: false, cacheAgeMs: 0, segmentsAvailable: true, pointsAvailable: true, pointsFeedUnavailableOrStale: false },
    forecast: {
      available: true,
      window: { startHour: EXPECTED_HOURS[0], endHour: EXPECTED_HOURS[23], expectedHours: EXPECTED_HOURS },
      points: ["P1", "P2", "P3", "P4"].map((id) => makeForecastPoint(id, `Borgarnes-punktur ${id}`)),
      stale: false,
      cacheAgeMs: 0,
    },
  };
}

async function stubWinterRoute(page, { vik = vikPayload(), borgarnes = borgarnesPayload(), onRequest } = {}) {
  await page.route("**/api/winter-route**", (route) => {
    const url = route.request().url();
    if (onRequest) onRequest(url);
    const payload = url.includes("routeId=raudavatn-borgarnes") ? borgarnes : vik;
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
  });
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

test.describe("WinterRoute (/winter-route) — Ticket #491 route selector real-browser verification", () => {
  test("desktop, Icelandic: route select defaults to Rauðavatn – Vík and offers Rauðavatn – Borgarnes", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    await stubWinterRoute(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    const routeSelect = page.getByLabel("Leið");
    await expect(routeSelect).toBeVisible();
    await expect(routeSelect).toHaveValue("raudavatn-vik");
    // <option> elements are never reported "visible" by Playwright outside
    // an open native dropdown — checking attachment/content is correct here.
    await expect(routeSelect.locator("option", { hasText: "Rauðavatn – Borgarnes" })).toBeAttached();
    // Ticket #491, V1 (result-review-implementation.md R1) — the h1 itself
    // must read the selected (default) route's own name.
    await expect(page.locator("h1")).toHaveText("Rauðavatn – Vík");
  });

  test("switching to Rauðavatn – Borgarnes requests ?routeId=raudavatn-borgarnes and shows its own 8 sections / 4 points, no stale Vík content", async ({
    page,
  }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    let lastUrl = "";
    await stubWinterRoute(page, { onRequest: (url) => (lastUrl = url) });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    await expect(page.getByText(VIK_SEGMENT_DEFS[0][1], { exact: true }).first()).toBeVisible();

    const routeSelect = page.getByLabel("Leið");
    await routeSelect.selectOption("raudavatn-borgarnes");

    await expect(page.getByText(BORGARNES_SEGMENT_DEFS[0][1], { exact: true }).first()).toBeVisible();
    expect(lastUrl).toContain("routeId=raudavatn-borgarnes");
    await expect(page.getByText(VIK_SEGMENT_DEFS[0][1], { exact: true })).toHaveCount(0);
    // Forecast section title reads "4 points", never a leftover "6".
    await expect(page.getByText("Veðurspá á 4 punktum á leiðinni")).toBeVisible();
    // Ticket #491, V1 (result-review-implementation.md R1) — the h1 must
    // follow the switch to Borgarnes, not stay on the previous route's
    // name. (The document <title> itself was probed separately this
    // round and found to stay empty in this real-browser/dev-server
    // harness regardless of route or content — a pre-existing,
    // react-helmet-async-related environment issue reproducible even on
    // the unchanged default Vík load, not something this change caused
    // or is in scope to fix; see cc-report-implementation.md's v4
    // section.)
    await expect(page.locator("h1")).toHaveText("Rauðavatn – Borgarnes");
    await page.screenshot({ path: "test-results/ticket-491/borgarnes-desktop-light-is.png", fullPage: true });
  });

  test("mobile (375px), English: Borgarnes route renders four points, the ETA approximation note, and the section-coverage note, with no horizontal scroll", async ({
    page,
  }) => {
    await primePageState(page, { lang: "en", theme: "light" });
    await stubWinterRoute(page);
    await page.setViewportSize({ width: 375, height: 800 });
    await gotoPage(page);

    const routeSelect = page.getByLabel("Route");
    await routeSelect.selectOption("raudavatn-borgarnes");

    await expect(page.getByText("Forecast at 4 points along the route")).toBeVisible();
    await expect(
      page.getByText("Estimated arrival uses a simple distance approximation and 70 km/h", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByText("Road-condition data for some sections may cover a longer stretch of road", { exact: false }),
    ).toBeVisible();

    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement;
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
    await page.screenshot({ path: "test-results/ticket-491/borgarnes-mobile-en.png", fullPage: true });
  });

  test("switching routes and back (A→B→A) ends on Vík's own fresh data, re-fetching rather than showing anything stale", async ({
    page,
  }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    let requestCount = 0;
    await stubWinterRoute(page, { onRequest: () => (requestCount += 1) });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    const routeSelect = page.getByLabel("Leið");
    await expect(page.getByText(VIK_SEGMENT_DEFS[0][1], { exact: true }).first()).toBeVisible();

    await routeSelect.selectOption("raudavatn-borgarnes");
    await expect(page.getByText(BORGARNES_SEGMENT_DEFS[0][1], { exact: true }).first()).toBeVisible();

    await routeSelect.selectOption("raudavatn-vik");
    await expect(page.getByText(VIK_SEGMENT_DEFS[0][1], { exact: true }).first()).toBeVisible();
    await expect(page.getByText(BORGARNES_SEGMENT_DEFS[0][1], { exact: true })).toHaveCount(0);

    expect(requestCount).toBe(3);
  });

  test("a failed request on route switch shows the road-feed-unavailable message, not stale data from the previous route", async ({
    page,
  }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    await page.route("**/api/winter-route**", (route) => {
      const url = route.request().url();
      if (url.includes("routeId=raudavatn-borgarnes")) {
        return route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ error: "winter_route_error" }) });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(vikPayload()) });
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    await expect(page.getByText(VIK_SEGMENT_DEFS[0][1], { exact: true }).first()).toBeVisible();

    const routeSelect = page.getByLabel("Leið");
    await routeSelect.selectOption("raudavatn-borgarnes");

    await expect(page.getByText("Færðargögn eru ekki tiltæk sem stendur.")).toBeVisible();
    await expect(page.getByText(VIK_SEGMENT_DEFS[0][1], { exact: true })).toHaveCount(0);
  });

  test("keyboard: ArrowDown on the focused route select steps natively without losing focus, and the page re-fetches", async ({
    page,
  }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    let requestCount = 0;
    await stubWinterRoute(page, { onRequest: () => (requestCount += 1) });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    const routeSelect = page.getByLabel("Leið");
    await routeSelect.waitFor({ state: "visible" });
    await routeSelect.focus();
    await expect(routeSelect).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(routeSelect).toHaveValue("raudavatn-borgarnes");
    expect(await routeSelect.evaluate((el) => el === document.activeElement)).toBe(true);
    await expect(page.getByText(BORGARNES_SEGMENT_DEFS[0][1], { exact: true }).first()).toBeVisible();
    expect(requestCount).toBe(2);
  });

  test("Borgarnes departure-time comparison: keyboard Tab→Enter still works with only 4 points, reusing the existing comparison area", async ({
    page,
  }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    await stubWinterRoute(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    const routeSelect = page.getByLabel("Leið");
    await routeSelect.selectOption("raudavatn-borgarnes");

    const hourSelect = page.getByLabel("Áætlaður brottfarartími");
    await hourSelect.waitFor({ state: "visible" });
    await hourSelect.selectOption({ index: 3 });
    await expect(page.getByText("Samanburður brottfarartíma")).toBeVisible();

    const viewButtons = page.getByRole("button", { name: /Skoða þennan tíma/ });
    await expect(viewButtons.first()).toBeEnabled();

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

    await expect(page.getByText(/Valinn brottfarartími er nú .* UTC\./)).toBeAttached();
  });
});
