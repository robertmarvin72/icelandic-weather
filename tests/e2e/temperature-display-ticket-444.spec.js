import { test, expect } from "@playwright/test";

// Ticket #444 — browser acceptance evidence for the presentation-only
// temperature display fix. Correction v4 (Jonesy R1/R2): rewrites the v3
// round's spec to (a) prove real site-name readability at 320/375px via
// actual DOM geometry (name span scrollWidth <= clientWidth), not merely
// "button width > 20px", following the matching WeatherFinderCard.jsx
// layout fix (name gets its own full-width row below `sm`, metric/period
// drop to a second line instead of squeezing it); (b) dismiss the REAL
// toast that actually appears in this environment (the PWA "offline
// ready" success toast, via ToastHub's generic aria-label="Dismiss"
// button — NOT the separate needRefresh/"Later" toast the v3 round's
// helper was built for, which never fires on a fresh install) and verify
// dismissal actually succeeds rather than swallowing a failure; (c) cover
// the full 320/375/desktop × EN/IS matrix for complete+incomplete rows,
// Free at 375px, a real Pro 3->5->7 window switch with 7-row fixtures, and
// an imperial parent/browser case; (d) retain and re-verify Brochure
// (both languages) and the Pro comparison factor row.
//
// Reuses the exact pattern established for ticket #460
// (playwright.ticket444.config.js serves the real production build via
// `vite preview`; every /api/* response is mocked, fresh context per
// scenario via Playwright's default per-test page).

const BASE_SITE = { id: "base-camp", name: "Base Camp", lat: 64.0, lon: -21.5 };
const WARM_COMPLETE = { id: "warm-complete", name: "Warm Complete", lat: 64.2, lon: -21.1 };
const INCOMPLETE_SITE = { id: "incomplete-site", name: "Gap Valley", lat: 64.4, lon: -20.7 };
const COMPARE_OTHER = { id: "compare-other", name: "Compare Other", lat: 64.6, lon: -20.3 };
// A realistic (not artificially absurd) long Icelandic campsite-style name,
// to document wrap/ellipsis behavior explicitly and separately from the
// short, must-never-truncate fixture names above.
const LONG_NAME_SITE = {
  id: "long-name-site",
  name: "Tjaldsvæðið við Jökulsárlón Austur",
  lat: 64.8,
  lon: -19.9,
};

const ALL_SITES = [BASE_SITE, WARM_COMPLETE, INCOMPLETE_SITE, COMPARE_OTHER, LONG_NAME_SITE];

const CAMPSITE_STUB = { ok: true, tier: "pro", campsites: ALL_SITES };

function meStub(isPro) {
  return {
    ok: true,
    user: { email: "evidence@example.com" },
    subscription: null,
    entitlements: { pro: isPro, proUntil: null },
  };
}

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

// `tmaxByDay` may contain `null` for a missing day — produces a genuinely
// incomplete window, never a fabricated 0.
function forecastPayload(tmaxByDay, { rain = 0, wind = 5, gust = 8 } = {}) {
  const time = dailyDates(tmaxByDay.length);
  const fill = (v) => tmaxByDay.map(() => v);
  return {
    daily: {
      time,
      temperature_2m_max: tmaxByDay,
      temperature_2m_min: fill(2),
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

// Full 7 real days each — satisfies "seven-row fixtures" at every Pro
// window size (3/5/7); the incomplete site's hole at index 1 is inside
// every one of those windows, so it stays incomplete regardless.
const FORECAST_BY_ID = {
  "base-camp": forecastPayload(Array(7).fill(10)),
  "warm-complete": forecastPayload(Array(7).fill(18)),
  "incomplete-site": forecastPayload([12, null, 12, 12, 12, 12, 12]),
  "compare-other": forecastPayload(Array(7).fill(16)),
  "long-name-site": forecastPayload(Array(7).fill(9)),
};

function closeTo(a, b, eps = 0.01) {
  return Math.abs(a - b) < eps;
}

// Request/response accounting (R2) — records every real /api/forecast
// request's matched site and whether its payload actually contains a
// missing (null) day, so the test can assert the missing value genuinely
// reached the real parent/network layer, not merely that the UI happens to
// say the right thing for an unrelated reason.
function createRequestLog() {
  return [];
}

async function stubApis(page, { isPro }, requestLog) {
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
  );
  await page.route("**/api/me**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(meStub(isPro)) })
  );
  await page.route("**/api/campsites**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CAMPSITE_STUB) })
  );
  await page.route("**/api/forecast**", (route) => {
    const url = new URL(route.request().url());
    const lat = Number(url.searchParams.get("latitude"));
    const lon = Number(url.searchParams.get("longitude"));
    const site = ALL_SITES.find((s) => closeTo(lat, s.lat) && closeTo(lon, s.lon));
    const payload = site ? FORECAST_BY_ID[site.id] : FORECAST_BY_ID["base-camp"];
    if (requestLog) {
      requestLog.push({
        siteId: site?.id ?? "unmatched",
        hasMissingDay: payload.daily.temperature_2m_max.includes(null),
      });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
  });
}

async function primeStorage(page, { lang }) {
  await page.addInitScript((langValue) => {
    window.localStorage.setItem("lang", JSON.stringify(langValue));
    window.localStorage.setItem("theme", JSON.stringify("light"));
    window.localStorage.setItem("lastSite", JSON.stringify("base-camp"));
  }, lang);
}

// Correction v4, R2 — the toast that actually appears in this environment
// is the PWA "offline ready" success toast (App.jsx's onOfflineReady,
// fired once the real service worker finishes precaching against the
// real production build). It is dismissed via ToastHub's own generic
// aria-label="Dismiss" control — not a "Later"/"Síðar" action (that belongs
// to the separate needRefresh toast, which cannot fire on a fresh
// install/fresh context and is not exercised here). A dismissal that is
// attempted but fails is NOT swallowed — it fails the test.
async function dismissRealToastIfPresent(page) {
  const toastContainer = page.locator(".fixed.bottom-4.left-4.z-\\[9999\\]");
  let appeared = await toastContainer.isVisible().catch(() => false);
  if (!appeared) {
    try {
      await toastContainer.waitFor({ state: "visible", timeout: 4000 });
      appeared = true;
    } catch {
      return; // genuinely never appeared this run — nothing to dismiss.
    }
  }
  await page.getByRole("button", { name: "Dismiss" }).first().click();
  await expect(toastContainer).toBeHidden({ timeout: 3000 });
}

async function gotoHome(page) {
  await page.goto("/");
  await page
    .locator(".fixed.inset-0.z-\\[9999\\]")
    .waitFor({ state: "hidden" })
    .catch(() => {});
  await dismissRealToastIfPresent(page);
}

async function openWeatherFinderWarmest(page, lang) {
  const showRanking = lang === "is" ? "Sjá röðun staða eftir veðri" : "See sites ranked by weather";
  await page.getByRole("button", { name: showRanking }).first().click();
  const warmestTab = lang === "is" ? "Hlýjast" : "Warmest";
  await page.getByRole("button", { name: warmestTab }).first().click();
  // Wait for the actual warmest list to have genuinely rendered (Jonesy
  // N5) before any capture/assertion — not just the click having fired.
  const completeLabel = lang === "is" ? "Meðaltal hámarkshita" : "Average daily high";
  await expect(page.getByText(completeLabel).first()).toBeVisible({ timeout: 15000 });
}

function nameLocatorFor(page, siteName) {
  // The name's own leaf span — this is the element whose scrollWidth vs
  // clientWidth proves whether IT (not some ancestor) is being visually
  // truncated (`truncate` = overflow-hidden + text-ellipsis on this span).
  return page.getByText(siteName, { exact: true }).first();
}

async function assertNameNotTruncated(page, siteName) {
  const span = nameLocatorFor(page, siteName);
  await expect(span).toBeVisible();
  const { scrollWidth, clientWidth } = await span.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));
  expect(scrollWidth, `${siteName}: scrollWidth (${scrollWidth}) should not exceed clientWidth (${clientWidth}) — name must not be visually truncated`).toBeLessThanOrEqual(
    clientWidth
  );
}

const VIEWPORTS = [
  { label: "320", width: 320, height: 760 },
  { label: "375", width: 375, height: 800 },
  { label: "desktop", width: 1280, height: 900 },
];
const LANGS = ["en", "is"];

test.describe("Ticket #444 correction v4 — Weather Finder complete/incomplete matrix (320/375/desktop x EN/IS)", () => {
  for (const viewport of VIEWPORTS) {
    for (const lang of LANGS) {
      test(`${viewport.label}px, ${lang.toUpperCase()}: complete site shows the honest label; incomplete shows '${
        lang === "is" ? "Ófullnægjandi gögn" : "Insufficient data"
      }'; both names stay readable`, async ({ page }) => {
        const requestLog = createRequestLog();
        await primeStorage(page, { lang });
        await stubApis(page, { isPro: true }, requestLog);
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await gotoHome(page);
        await openWeatherFinderWarmest(page, lang);

        const completeText = lang === "is" ? /18,0°C — Meðaltal hámarkshita|18\.0°C — Meðaltal hámarkshita/ : /18\.0°C — Average daily high/;
        const insufficientText = lang === "is" ? "Ófullnægjandi gögn" : "Insufficient data";

        await expect(page.getByText(completeText).first()).toBeVisible();
        await expect(page.getByText(insufficientText).first()).toBeVisible();

        // Request/response accounting — the incomplete site's own real
        // network response genuinely contained a missing day; this is not
        // a UI-only coincidence.
        const incompleteRequest = requestLog.find((r) => r.siteId === "incomplete-site");
        expect(incompleteRequest?.hasMissingDay).toBe(true);

        // R1 — the actual DOM geometry proof, not a width-in-pixels proxy.
        await assertNameNotTruncated(page, "Warm Complete");
        await assertNameNotTruncated(page, "Gap Valley");

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewport.width);

        // Correction v5, R3 — at `sm`+ (this suite's "desktop" case) every
        // warmest row's metric block must share the SAME right edge (the
        // name wrapper's `sm:flex-1` is what makes this true — explicitly
        // identified by data-testid, not inferred from text width).
        if (viewport.label === "desktop") {
          const metricBlocks = page.getByTestId("weather-finder-warmest-metric");
          const count = await metricBlocks.count();
          expect(count).toBeGreaterThan(1);
          const rightEdges = [];
          for (let i = 0; i < count; i++) {
            const box = await metricBlocks.nth(i).boundingBox();
            rightEdges.push(box.x + box.width);
          }
          const maxEdge = Math.max(...rightEdges);
          const minEdge = Math.min(...rightEdges);
          expect(
            maxEdge - minEdge,
            `warmest metric blocks' right edges should align within 1px, got: ${JSON.stringify(rightEdges)}`
          ).toBeLessThanOrEqual(1);
        }

        await page.screenshot({
          path: `outputs/ticket-444-browser-evidence/finder-matrix-${viewport.label}-${lang}.png`,
          fullPage: true,
        });
      });
    }
  }
});

test.describe("Ticket #444 correction v4 — Free, Pro window switch, imperial, long-name", () => {
  test("Free, EN, 375px: forced 3-day period, no Pro day-count controls, names still readable", async ({
    page,
  }) => {
    const requestLog = createRequestLog();
    await primeStorage(page, { lang: "en" });
    await stubApis(page, { isPro: false }, requestLog);
    await page.setViewportSize({ width: 375, height: 800 });
    await gotoHome(page);
    await openWeatherFinderWarmest(page, "en");

    await expect(page.getByText(/18\.0°C — Average daily high/).first()).toBeVisible();
    await expect(page.getByText("First 3 forecast days, including today").first()).toBeVisible();
    await expect(page.getByText("5d", { exact: true })).toHaveCount(0);
    await assertNameNotTruncated(page, "Warm Complete");

    await page.screenshot({
      path: "outputs/ticket-444-browser-evidence/finder-free-en-375.png",
      fullPage: true,
    });
  });

  test("Pro, IS, desktop: 3 -> 5 -> 7 window switch over real 7-row fixtures; incomplete site stays incomplete at every size", async ({
    page,
  }) => {
    const requestLog = createRequestLog();
    await primeStorage(page, { lang: "is" });
    await stubApis(page, { isPro: true }, requestLog);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoHome(page);
    await openWeatherFinderWarmest(page, "is");

    await expect(page.getByText("Fyrstu 3 spádagar, dagurinn í dag meðtalinn").first()).toBeVisible();
    await expect(page.getByText("Ófullnægjandi gögn").first()).toBeVisible();

    await page.getByText("5d", { exact: true }).click();
    await expect(page.getByText("Fyrstu 5 spádagar, dagurinn í dag meðtalinn").first()).toBeVisible();
    await expect(page.getByText("Ófullnægjandi gögn").first()).toBeVisible();

    await page.getByText("7d", { exact: true }).click();
    await expect(page.getByText("Fyrstu 7 spádagar, dagurinn í dag meðtalinn").first()).toBeVisible();
    await expect(page.getByText("Ófullnægjandi gögn").first()).toBeVisible();
    await expect(page.getByText(/18,0°C — Meðaltal hámarkshita|18\.0°C — Meðaltal hámarkshita/).first()).toBeVisible();

    await page.screenshot({
      path: "outputs/ticket-444-browser-evidence/finder-period-switch-is-desktop.png",
      fullPage: true,
    });
  });

  test("imperial, EN, desktop: real Fahrenheit conversion for the complete site; incomplete site never shows a number", async ({
    page,
  }) => {
    const requestLog = createRequestLog();
    await primeStorage(page, { lang: "en" });
    await stubApis(page, { isPro: true }, requestLog);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoHome(page);
    await page.evaluate(() => window.localStorage.setItem("units", JSON.stringify("imperial")));
    await page.reload();
    await page
      .locator(".fixed.inset-0.z-\\[9999\\]")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await dismissRealToastIfPresent(page);
    await openWeatherFinderWarmest(page, "en");

    // 18°C * 9/5 + 32 = 64.4 -> toFixed(0) = "64°F".
    await expect(page.getByText(/64°F — Average daily high/).first()).toBeVisible();
    await expect(page.getByText("Insufficient data").first()).toBeVisible();
    // Digit-boundary anchored: Base Camp's own real, complete "50°F" row
    // elsewhere in the ranked list must not false-match a bare "0°F" check.
    const finderPanel = page.locator("#weather-finder-panel");
    await expect(finderPanel.getByText(/(?<!\d)0°F/)).toHaveCount(0);

    await page.screenshot({
      path: "outputs/ticket-444-browser-evidence/finder-imperial-en-desktop.png",
      fullPage: true,
    });
  });

  test("long (but realistic) campsite name: no horizontal page overflow at 375px; documented ellipsis is acceptable for this fixture only", async ({
    page,
  }) => {
    const requestLog = createRequestLog();
    await primeStorage(page, { lang: "en" });
    await stubApis(page, { isPro: true }, requestLog);
    await page.setViewportSize({ width: 375, height: 800 });
    await gotoHome(page);
    await openWeatherFinderWarmest(page, "en");
    const showFullBtn = page.getByRole("button", { name: /Show full ranking|See all/i });
    if (await showFullBtn.count()) await showFullBtn.first().click();

    const longNameSpan = page.getByText("Tjaldsvæðið við Jökulsárlón Austur", { exact: true }).first();
    // This fixture is long enough that ellipsis truncation is an accepted,
    // documented outcome (unlike the short names asserted elsewhere) — the
    // real requirement here is that it never causes the PAGE itself to
    // scroll horizontally, and the control remains a real, clickable
    // button (not that its own text is fully visible).
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
    await expect(longNameSpan.locator("xpath=ancestor::button")).toBeVisible();

    await page.screenshot({
      path: "outputs/ticket-444-browser-evidence/finder-long-name-375.png",
      fullPage: true,
    });
  });
});

test.describe("Ticket #444 correction v4 — Brochure and comparison, re-verified", () => {
  test("Brochure (EN + IS, static demo data, no network mocking needed): temperature qualifier visible under both site cards", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto("/brochure?lang=en");
    await dismissRealToastIfPresent(page);
    await expect(page.getByText("Average daily high, up to 3 days").first()).toBeVisible();
    await page.screenshot({
      path: "outputs/ticket-444-browser-evidence/brochure-qualifier-en-desktop.png",
      fullPage: true,
    });

    await page.goto("/brochure?lang=is");
    await dismissRealToastIfPresent(page);
    await expect(page.getByText("Meðaltal hámarkshita, allt að 3 dagar").first()).toBeVisible();
    await page.screenshot({
      path: "outputs/ticket-444-browser-evidence/brochure-qualifier-is-desktop.png",
      fullPage: true,
    });
  });

  test("Campsite comparison (Pro, EN, desktop): temperature factor row reads 'High temperature', never bare 'Temp'", async ({
    page,
  }) => {
    const requestLog = createRequestLog();
    await primeStorage(page, { lang: "en" });
    await stubApis(page, { isPro: true }, requestLog);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoHome(page);

    const pickerButtons = page.getByRole("button", { name: /Select campsite/i });
    await pickerButtons.last().click();
    await page.getByRole("button", { name: "Compare Other" }).click();

    await expect(page.getByText("High temperature").first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Temp", { exact: true })).toHaveCount(0);

    await page.screenshot({
      path: "outputs/ticket-444-browser-evidence/comparison-temp-label-en-desktop.png",
      fullPage: true,
    });
  });
});
