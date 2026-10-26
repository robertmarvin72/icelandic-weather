import { test, expect } from "@playwright/test";

// Ticket #460 — browser acceptance evidence for the P0 fix: missing/invalid
// route-weather data must show visible uncertainty, never fabricated LOW.
// Run via playwright.ticket460.config.js, which serves the real production
// build (`vite preview` against dist/, not the dev server) — J6: a
// production build has no /api at all, so every /api/* response here is
// fully mocked via page.route().
//
// Architectural limitation discovered while building these scenarios (see
// cc-report.md "Browser evidence" section): the route estimator's
// origin/destination are EXACTLY the base/candidate campsite coordinates,
// and forecastCache caches per-coordinate for the page's whole lifetime. So
// the two route points that coincide with the base/candidate coordinates
// (interpolateRoutePoints' first and last of 7) are served from the SAME
// cache entry the relocation engine already populated to produce its own
// recommendation — a literal "all 7 of 7 route points fail" is therefore
// not reachable in the real app without also breaking the recommendation
// itself. The achievable, real-app floor is 5 of 7 (every strictly-interior
// point fails, "severe-partial-unknown" below) — that is the scenario that
// actually matters for #437/#460 (majority of route data missing, two edge
// points known-calm/known-bad). The literal all-failed/all-null case is
// already proven at the pure-function level in src/lib/routeRisk.test.js
// (RC-17 reproduced, plus the real rejection path), and at the hook level
// in src/hooks/useRoutePlanner.test.js ("thrown estimator" test).
//
// Correction v2 (Ripley waiver, narrowly scoped) — the exact tests the
// above claim rests on, by name: src/lib/routeRisk.test.js's "RC-17
// reproduced with 7 points: every point resolves null -> UNKNOWN, not LOW"
// and "real getForecast rejection path: every point throws -> estimator
// does not abort, resolves UNKNOWN"; src/hooks/useRoutePlanner.test.js's
// "thrown estimator (failed path): visible UNKNOWN, never the old silent
// null". This waiver covers ONLY the 7-of-7-network-rejection case inside a
// still-successful recommendation; it is NOT a waiver for null/short-array
// inputs, which are covered by additional focused estimator tests (see
// routeRisk.test.js's short-array and explicit-null-value tests).
//
// Stale-candidate race (switching to a new candidate before the previous
// one's route-risk call resolves) is likewise NOT exercised in a browser
// here — that claim rests entirely on src/hooks/useRoutePlanner.test.js's
// "cancellation/new-candidate race: a stale resolve after a new candidate
// is selected must not win" test, which directly asserts the stale HIGH
// result cannot label the new (LOW) candidate. No browser coverage is
// claimed for this scenario.
//
// What this file does NOT establish: real Open-Meteo missing-data response
// shapes (null entries vs. short arrays vs. omitted fields) are UNKNOWN —
// every mock here is a synthetic fixture chosen to exercise this app's own
// branches, not a claim about what the live provider actually returns.

const BASE_SITE = { id: "base-camp", name: "Base Camp", lat: 64.0, lon: -21.5 };
const CANDIDATE_SITE = { id: "calm-haven", name: "Calm Haven", lat: 64.25, lon: -21.1 };

const CAMPSITE_STUB = { ok: true, tier: "pro", campsites: [BASE_SITE, CANDIDATE_SITE] };

const ME_STUB = {
  ok: true,
  user: { email: "evidence@example.com" },
  subscription: null,
  entitlements: { pro: true, proUntil: null },
};

function todayISO() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function dailyDates(n = 7) {
  const start = todayISO();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function forecastPayload({ wind, gust, rain, days = 7 }) {
  const time = dailyDates(days);
  const fill = (v) => Array.from({ length: time.length }, () => v);
  return {
    daily: {
      time,
      temperature_2m_max: fill(10),
      temperature_2m_min: fill(4),
      precipitation_sum: fill(rain),
      windspeed_10m_max: fill(wind),
      windgusts_10m_max: fill(gust),
      winddirection_10m_dominant: fill(180),
      weathercode: fill(1),
    },
    hourly: {
      time: [],
      weathercode: [],
      temperature_2m: [],
      windspeed_10m: [],
      windgusts_10m: [],
      precipitation: [],
      precipitation_probability: [],
    },
  };
}

// Base is deliberately rainy (bad) and the candidate deliberately dry
// (good) in BOTH wind variants, so the relocation recommendation reliably
// comes out "move"/"consider" regardless of which route-risk scenario is
// under test — wind is equal between the two sites, so it cancels out of
// that comparison and only rain drives the verdict.
const BASE_FORECAST = {
  calm: forecastPayload({ wind: 5, gust: 8, rain: 20 }),
  windy: forecastPayload({ wind: 20, gust: 22, rain: 20 }),
};
const CANDIDATE_FORECAST = {
  calm: forecastPayload({ wind: 5, gust: 8, rain: 0 }),
  windy: forecastPayload({ wind: 20, gust: 22, rain: 0 }),
};

function closeTo(a, b, eps = 0.01) {
  return Math.abs(a - b) < eps;
}

// Correction v2, R2 (Jonesy/Ripley) — explicit request-response accounting.
// Every real /api/forecast request this page makes (base site, candidate
// site, and each of the route estimator's 5 strictly-interior sample
// points — see the file-header note on why only 5, not 7, reach the
// network) is recorded here with its matched coordinate kind and the exact
// HTTP status this mock delivered. The test then asserts directly against
// this log — not just against the resulting UI text — so the test FAILS
// if the handler below is ever changed to answer an interior point with
// 200 instead of the intended 500 (the log would show the wrong status,
// independent of what the UI happens to render).
function createRequestLog() {
  return [];
}

async function stubApis(page, { wind, interiorFails }, requestLog) {
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
  );
  await page.route("**/api/me**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ME_STUB) })
  );
  await page.route("**/api/campsites**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CAMPSITE_STUB) })
  );
  await page.route("**/api/forecast**", (route) => {
    const url = new URL(route.request().url());
    const lat = Number(url.searchParams.get("latitude"));
    const lon = Number(url.searchParams.get("longitude"));

    const isBase = closeTo(lat, BASE_SITE.lat) && closeTo(lon, BASE_SITE.lon);
    const isCandidate = closeTo(lat, CANDIDATE_SITE.lat) && closeTo(lon, CANDIDATE_SITE.lon);
    const kind = isBase ? "base" : isCandidate ? "candidate" : "interior";

    if (isBase) {
      requestLog.push({ kind, lat, lon, status: 200 });
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(BASE_FORECAST[wind]),
      });
    }
    if (isCandidate) {
      requestLog.push({ kind, lat, lon, status: 200 });
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(CANDIDATE_FORECAST[wind]),
      });
    }
    // A strictly-interior route-risk sample point (never a base/candidate
    // coordinate, since the 7 interpolated points only coincide with the
    // endpoints at index 0 and index 6).
    if (interiorFails) {
      requestLog.push({ kind, lat, lon, status: 500 });
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "synthetic failure" }),
      });
    }
    requestLog.push({ kind, lat, lon, status: 200 });
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(CANDIDATE_FORECAST[wind]),
    });
  });
}

// Asserts the exact, real network shape for this test's 2-site fixture:
// base/candidate are each requested exactly once over the network (every
// OTHER reference to those same coordinates — including the route
// estimator's own point[0]/point[6], which are numerically identical to
// base/candidate — is served from forecastCache's in-page cache, never
// hitting this route handler again); the 5 strictly-interior route-risk
// sample points are genuinely fresh network requests, each carrying the
// expected status. This is the "distinguish the 7 estimator sample
// attempts from cache-deduped endpoint requests" accounting: the estimator
// always attempts 7 (pinned at the unit level by
// src/lib/routeRisk.test.js's "per-point request count is deterministic"
// test), but only 5 of those 7 ever reach the network in this fixture.
function assertForecastRequestShape(requestLog, { interiorStatus }) {
  const base = requestLog.filter((r) => r.kind === "base");
  const candidate = requestLog.filter((r) => r.kind === "candidate");
  const interior = requestLog.filter((r) => r.kind === "interior");

  expect(requestLog.length, "total /api/forecast network requests").toBe(7);
  expect(base.length, "base-site network requests (deduped by cache, not 2+)").toBe(1);
  expect(candidate.length, "candidate-site network requests (deduped by cache, not 2+)").toBe(1);
  expect(interior.length, "strictly-interior route-point network requests").toBe(5);
  expect(base[0].status).toBe(200);
  expect(candidate[0].status).toBe(200);
  for (const r of interior) {
    expect(r.status, `interior request at (${r.lat}, ${r.lon})`).toBe(interiorStatus);
  }
}

async function dismissPwaToastIfPresent(page) {
  const later = page.getByRole("button", { name: /^(Later|Síðar)$/ }).first();
  await later.click({ timeout: 1500 }).catch(() => {});
}

async function primeStorage(page, { lang }) {
  await page.addInitScript((langValue) => {
    window.localStorage.setItem("lang", JSON.stringify(langValue));
    window.localStorage.setItem("theme", JSON.stringify("light"));
    window.localStorage.setItem("lastSite", JSON.stringify("base-camp"));
    window.localStorage.setItem("campcast_route_disclaimer_seen", "true");
  }, lang);
}

async function gotoAndExpandRoutePlanner(page, lang) {
  await page.goto("/");
  await page
    .locator(".fixed.inset-0.z-\\[9999\\]")
    .waitFor({ state: "hidden" })
    .catch(() => {});
  await dismissPwaToastIfPresent(page);
  const label = lang === "is" ? "Sjá nánar" : "See details";
  const showDetails = page.getByText(label, { exact: true }).first();
  await showDetails.waitFor({ state: "visible", timeout: 15000 });
  await showDetails.click();
}

const SCENARIOS = {
  completeCalm: { key: "complete-calm", wind: "calm", interiorFails: false },
  severePartialUnknown: { key: "severe-partial-unknown", wind: "calm", interiorFails: true },
  partialHigh: { key: "partial-high", wind: "windy", interiorFails: true },
};

test.describe("Ticket #460 — route risk uncertainty, real app wiring, production build", () => {
  test("complete-calm — EN desktop: full coverage, LOW, no Route risk block at all", async ({ page }) => {
    const scenario = SCENARIOS.completeCalm;
    const requestLog = createRequestLog();
    await primeStorage(page, { lang: "en" });
    await stubApis(page, scenario, requestLog);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoAndExpandRoutePlanner(page, "en");

    await expect(page.getByText(/^(Move|Consider moving)$/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Route risk/i)).toHaveCount(0);

    // By the time the UI shows the verdict above, every one of the 7
    // real network requests this scenario makes has already been
    // delivered — asserting on the log here proves that, not just that
    // the resulting text happens to look right.
    assertForecastRequestShape(requestLog, { interiorStatus: 200 });

    await page.screenshot({
      path: "outputs/ticket-460-browser-evidence/complete-calm-en-desktop.png",
      fullPage: true,
    });
  });

  test("severe-partial-unknown — EN desktop: 5/7 points fail, UNKNOWN shown, never 'Low'", async ({
    page,
  }) => {
    const scenario = SCENARIOS.severePartialUnknown;
    const requestLog = createRequestLog();
    await primeStorage(page, { lang: "en" });
    await stubApis(page, scenario, requestLog);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoAndExpandRoutePlanner(page, "en");

    await expect(page.getByText(/^(Move|Consider moving)$/)).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText(
        "Route-weather data was insufficient to evaluate driving conditions on this route."
      )
    ).toBeVisible();
    await expect(page.getByText(/Route risk:\s*Low/i)).toHaveCount(0);

    // Proves the UNKNOWN text above is genuinely backed by 5 real 500
    // responses to the interior points (not, say, a mock that silently
    // returned success while something else produced the UNKNOWN text) —
    // this assertion fails if the mock below the UI ever stops returning
    // 500 for the interior fixtures.
    assertForecastRequestShape(requestLog, { interiorStatus: 500 });

    await page.screenshot({
      path: "outputs/ticket-460-browser-evidence/severe-partial-unknown-en-desktop.png",
      fullPage: true,
    });
  });

  test("partial-high — EN desktop: 5/7 points fail but 2 known-HIGH readings still caution (lower bound)", async ({
    page,
  }) => {
    const scenario = SCENARIOS.partialHigh;
    const requestLog = createRequestLog();
    await primeStorage(page, { lang: "en" });
    await stubApis(page, scenario, requestLog);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoAndExpandRoutePlanner(page, "en");

    await expect(page.getByText(/^(Move|Consider moving)$/).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Route risk:\s*High/i).first()).toBeVisible();
    await expect(page.getByText(/based on partial route data/i)).toBeVisible();
    // The HIGH override must still have demoted move -> consider (routePlannerSummary.js).
    await expect(page.getByText("Consider moving").first()).toBeVisible();

    assertForecastRequestShape(requestLog, { interiorStatus: 500 });

    await page.screenshot({
      path: "outputs/ticket-460-browser-evidence/partial-high-en-desktop.png",
      fullPage: true,
    });
  });

  test("severe-partial-unknown — IS desktop: same scenario, Icelandic copy, never 'Lág'", async ({
    page,
  }) => {
    const scenario = SCENARIOS.severePartialUnknown;
    const requestLog = createRequestLog();
    await primeStorage(page, { lang: "is" });
    await stubApis(page, scenario, requestLog);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoAndExpandRoutePlanner(page, "is");

    await expect(page.getByText(/^(Færa sig|Íhuga að færa sig)$/)).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText("Veðurgögn á leiðinni voru ófullnægjandi til að meta akstursaðstæður.")
    ).toBeVisible();
    await expect(page.getByText(/Áhætta á leið:\s*Lág/i)).toHaveCount(0);

    assertForecastRequestShape(requestLog, { interiorStatus: 500 });

    await page.screenshot({
      path: "outputs/ticket-460-browser-evidence/severe-partial-unknown-is-desktop.png",
      fullPage: true,
    });
  });

  test("partial-high — IS desktop: Icelandic 'Há' caution with partial qualifier", async ({ page }) => {
    const scenario = SCENARIOS.partialHigh;
    const requestLog = createRequestLog();
    await primeStorage(page, { lang: "is" });
    await stubApis(page, scenario, requestLog);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoAndExpandRoutePlanner(page, "is");

    await expect(page.getByText(/^(Færa sig|Íhuga að færa sig)$/).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/Áhætta á leið:\s*Há/i).first()).toBeVisible();

    assertForecastRequestShape(requestLog, { interiorStatus: 500 });

    await page.screenshot({
      path: "outputs/ticket-460-browser-evidence/partial-high-is-desktop.png",
      fullPage: true,
    });
  });

  test("severe-partial-unknown — EN mobile 320: unknown message stays within viewport, no overflow", async ({
    page,
  }) => {
    const scenario = SCENARIOS.severePartialUnknown;
    const requestLog = createRequestLog();
    await primeStorage(page, { lang: "en" });
    await stubApis(page, scenario, requestLog);
    await page.setViewportSize({ width: 320, height: 720 });
    await gotoAndExpandRoutePlanner(page, "en");

    const message = page.getByText(
      "Route-weather data was insufficient to evaluate driving conditions on this route."
    );
    await expect(message).toBeVisible({ timeout: 15000 });

    const box = await message.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);

    assertForecastRequestShape(requestLog, { interiorStatus: 500 });

    await page.screenshot({
      path: "outputs/ticket-460-browser-evidence/severe-partial-unknown-en-mobile320.png",
      fullPage: true,
    });
  });

  test("severe-partial-unknown — EN desktop: opening the details modal shows the same neutral message", async ({
    page,
  }) => {
    const scenario = SCENARIOS.severePartialUnknown;
    const requestLog = createRequestLog();
    await primeStorage(page, { lang: "en" });
    await stubApis(page, scenario, requestLog);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoAndExpandRoutePlanner(page, "en");

    await expect(page.getByText(/^(Move|Consider moving)$/)).toBeVisible({ timeout: 15000 });

    const detailsButton = page.getByRole("button", { name: /Open details/i }).first();
    await detailsButton.click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page
        .getByRole("dialog")
        .getByText(
          "Route-weather data was insufficient to evaluate driving conditions on this route."
        )
    ).toBeVisible();

    assertForecastRequestShape(requestLog, { interiorStatus: 500 });

    await page.screenshot({
      path: "outputs/ticket-460-browser-evidence/severe-partial-unknown-en-desktop-modal.png",
    });
  });
});
