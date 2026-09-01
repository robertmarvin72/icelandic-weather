import { test, expect } from "@playwright/test";

// Ticket 398 (#398) — mandatory real-browser visual verification (approved
// prompt §12). Component DOM tests alone are not sufficient evidence for
// this ticket; this spec renders the actual redesigned NorthernLightsCard in
// a real browser via Playwright's existing webServer (plain `npm run dev`,
// no real backend) and the established page.route() stubbing pattern from
// tests/e2e/footer-blog-link.spec.js — no new route, page, or dependency.

const CAMPSITE_STUB = {
  ok: true,
  tier: "free",
  campsites: [{ id: "test_site", name: "Test Campsite", lat: 64.14, lon: -21.89 }],
};

const FORECAST_STUB = {
  daily: {
    time: ["2026-09-01"],
    temperature_2m_max: [10],
    temperature_2m_min: [5],
    precipitation_sum: [0],
    windspeed_10m_max: [5],
    windgusts_10m_max: [8],
    winddirection_10m_dominant: [180],
    weathercode: [0],
  },
};

const FIXED_NOW = new Date("2026-09-01T20:00:00.000Z"); // in-season, deterministic regardless of real run date

function loc(id, name, band, reasons = ["meaningful_activity", "clear_sky"]) {
  return { locationId: id, name, lat: 64.1, lon: -21.9, score: 50, band, reasons, flags: ["national_reference_times"] };
}

const GOOD_BODY = {
  ok: true,
  evening: "2026-09-01",
  auroraCache: { state: "fresh", sourceFetchedAt: "2026-09-01T18:00:00.000Z", ageMinutes: 120 },
  viewingWindow: { start: "2026-09-01T22:00:00.000Z", end: "2026-09-02T05:00:00.000Z" },
  status: "success",
  best: loc("osm_way_712155124", "Camper Resort Reykjavík", "excellent"),
  alternatives: [loc("osm_relation_17808139", "Vík í Mýrdal", "good"), loc("osm_relation_13660177", "Höfn í Hornafirði", "fair")],
  excluded: [],
  warnings: [],
};

const FAIR_BODY = {
  ...GOOD_BODY,
  best: loc("osm_way_712155124", "Camper Resort Reykjavík", "fair", ["low_activity", "partial_cloud"]),
  alternatives: [],
};

const ALL_POOR_BODY = {
  ...GOOD_BODY,
  best: loc("osm_way_712155124", "Camper Resort Reykjavík", "poor", ["heavy_cloud"]),
  alternatives: [loc("osm_relation_17808139", "Vík í Mýrdal", "very-poor", ["heavy_cloud"])],
};

const UNAVAILABLE_BODY = {
  ok: true,
  evening: "2026-09-01",
  auroraCache: { state: "unavailable", reason: "too_old" },
  viewingWindow: null,
  status: "unavailable",
  reason: "aurora_cache_unavailable",
  best: null,
  alternatives: [],
  excluded: [],
  warnings: [],
};

async function stubAppBootstrapApis(page, { auroraBody, auroraDelayMs = 0, isPro = false } = {}) {
  await page.route("**/api/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));

  await page.route("**/api/campsites**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CAMPSITE_STUB) }),
  );
  await page.route("**/api/forecast**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(FORECAST_STUB) }),
  );
  await page.route("**/api/me**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, entitlements: { pro: isPro, proUntil: null } }),
    }),
  );

  if (auroraBody) {
    await page.route("**/api/aurora-decision**", async (route) => {
      if (auroraDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, auroraDelayMs));
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(auroraBody) });
    });
  }
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

async function gotoAndWaitForCard(page) {
  await page.clock.install({ time: FIXED_NOW });
  await page.goto("/");
  await page.locator(".fixed.inset-0.z-\\[9999\\]").waitFor({ state: "hidden" });
  await expect(page.getByTestId("nl-card")).toBeVisible();
}

test.describe("NorthernLightsCard — Ticket 398 visual verification", () => {
  test("good conditions: Free (IS, light, desktop)", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    await stubAppBootstrapApis(page, { auroraBody: GOOD_BODY, isPro: false });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoAndWaitForCard(page);

    await expect(page.getByText("Góð skilyrði í kvöld")).toBeVisible();
    await expect(page.getByText("Camper Resort Reykjavík")).toHaveCount(0); // Free never gets the name
    await page.screenshot({ path: "test-results/ticket-398/good-free-is-light-desktop.png" });
  });

  test("good conditions: Pro collapsed then expanded (EN, dark, desktop)", async ({ page }) => {
    await primePageState(page, { lang: "en", theme: "dark" });
    await stubAppBootstrapApis(page, { auroraBody: GOOD_BODY, isPro: true });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: "dark" });
    await gotoAndWaitForCard(page);

    await expect(page.getByText("Good conditions tonight")).toBeVisible();
    await expect(page.getByText(/Best conditions tonight: Camper Resort Reykjavík/)).toBeVisible();
    await page.screenshot({ path: "test-results/ticket-398/good-pro-en-dark-desktop-collapsed.png" });

    await page.getByRole("button", { name: "See the best spots" }).click();
    await expect(page.getByText("Recommended locations tonight")).toBeVisible();
    await page.screenshot({ path: "test-results/ticket-398/good-pro-en-dark-desktop-expanded.png" });
  });

  test("fair conditions: Pro (IS, light, mobile ~320px)", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    await stubAppBootstrapApis(page, { auroraBody: FAIR_BODY, isPro: true });
    await page.setViewportSize({ width: 320, height: 720 });
    await gotoAndWaitForCard(page);

    await expect(page.getByText("Gæti sést með smá heppni")).toBeVisible();
    const card = page.getByTestId("nl-card");
    const box = await card.boundingBox();
    expect(box.width).toBeLessThanOrEqual(320);
    // No horizontal overflow at this width.
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(321);
    await page.screenshot({ path: "test-results/ticket-398/fair-pro-is-light-mobile320.png" });
  });

  test("all-poor: Free vs Pro (EN, light, desktop)", async ({ page }) => {
    await primePageState(page, { lang: "en", theme: "light" });
    await stubAppBootstrapApis(page, { auroraBody: ALL_POOR_BODY, isPro: false });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoAndWaitForCard(page);

    await expect(page.getByText("Little hope tonight")).toBeVisible();
    await expect(page.getByText("Camper Resort Reykjavík")).toHaveCount(0);
    await page.screenshot({ path: "test-results/ticket-398/all-poor-free-en-light-desktop.png" });
  });

  test("all-poor: Pro can expand to see the best-of-poor identity behind disclosure", async ({ page }) => {
    await primePageState(page, { lang: "en", theme: "light" });
    await stubAppBootstrapApis(page, { auroraBody: ALL_POOR_BODY, isPro: true });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoAndWaitForCard(page);

    const card = page.getByTestId("nl-card");
    await expect(card.getByText("Little hope tonight")).toBeVisible();
    await expect(page.getByText("Camper Resort Reykjavík")).toHaveCount(0); // not shown collapsed
    await card.getByRole("button", { name: "See details" }).click();
    await expect(page.getByText("Camper Resort Reykjavík")).toBeVisible();
    await page.screenshot({ path: "test-results/ticket-398/all-poor-pro-en-light-desktop-expanded.png" });
  });

  test("loading: stable-height dark skeleton, no success glow (IS, light)", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    await stubAppBootstrapApis(page, { auroraBody: GOOD_BODY, auroraDelayMs: 5000, isPro: false });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.clock.install({ time: FIXED_NOW });
    await page.goto("/");
    await page.locator(".fixed.inset-0.z-\\[9999\\]").waitFor({ state: "hidden" });
    const card = page.getByTestId("nl-card");
    await expect(card).toBeVisible();
    await expect(page.getByTestId("nl-loading")).toBeVisible();
    await expect(page.locator('[aria-hidden="true"].blur-2xl')).toHaveCount(0);
    await page.screenshot({ path: "test-results/ticket-398/loading-is-light-desktop.png" });
  });

  test("unavailable: neutral treatment, real retry, no upgrade remedy (EN, dark)", async ({ page }) => {
    await primePageState(page, { lang: "en", theme: "dark" });
    await stubAppBootstrapApis(page, { auroraBody: UNAVAILABLE_BODY, isPro: false });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: "dark" });
    await gotoAndWaitForCard(page);

    await expect(page.getByText("Northern Lights data isn't available right now.")).toBeVisible();
    await expect(page.getByText("See where and why (Pro)")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    await page.screenshot({ path: "test-results/ticket-398/unavailable-free-en-dark-desktop.png" });
  });
});
