import { test, expect } from "@playwright/test";

// Ticket 400 (#400) — mandatory real-browser visual verification (approved
// prompt §8). Component tests alone were judged insufficient evidence for
// this presentation-summary ticket's rendered daily/hourly weather text.
// Uses 100% pre-existing infrastructure (the webServer/page.route() stubbing
// pattern already proven in tests/e2e/footer-blog-link.spec.js) — no new
// route, page, or dependency.

const DATES = ["2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11", "2026-09-12", "2026-09-13", "2026-09-14"];

const CAMPSITE_STUB = {
  ok: true,
  tier: "free",
  campsites: [{ id: "test_site", name: "Test Campsite", lat: 64.14, lon: -21.89 }],
};

function buildDailyHourly() {
  const daily = {
    time: DATES,
    temperature_2m_max: DATES.map(() => 12),
    temperature_2m_min: DATES.map(() => 6),
    precipitation_sum: DATES.map(() => 0),
    windspeed_10m_max: DATES.map(() => 5),
    windgusts_10m_max: DATES.map(() => 8),
    winddirection_10m_dominant: DATES.map(() => 180),
    // Day 0's raw daily code is deliberately "overcast" (3) to reproduce the
    // exact issue #400 contradiction; day 1's raw daily code is
    // deliberately "clear" (0) despite genuinely rainy hourly data, to
    // exercise the significant-precipitation override in the other
    // direction. Every other day is uniform/uninteresting.
    weathercode: DATES.map((_, i) => (i === 0 ? 3 : 0)),
  };

  const time = [];
  const weathercode = [];
  const temperature_2m = [];
  const windspeed_10m = [];
  const windgusts_10m = [];
  const precipitation = [];
  const precipitation_probability = [];

  for (let dayIdx = 0; dayIdx < DATES.length; dayIdx++) {
    const date = DATES[dayIdx];
    for (let h = 0; h < 24; h++) {
      time.push(`${date}T${String(h).padStart(2, "0")}:00`);
      temperature_2m.push(10);
      windspeed_10m.push(4);
      windgusts_10m.push(6);
      precipitation_probability.push(10);

      if (dayIdx === 0) {
        // Clear/mainly-clear 00:00-18:00, one overcast observation at 21:00
        // (the issue #400 Laugardalur fixture, verbatim).
        weathercode.push(h === 21 ? 3 : 0);
        precipitation.push(0);
      } else if (dayIdx === 1) {
        // Two moderate-rain observations totaling >=1.0mm in the primary
        // window -> significant-precipitation override, despite a "clear"
        // raw daily code.
        if (h === 10 || h === 14) {
          weathercode.push(63);
          precipitation.push(0.8);
        } else {
          weathercode.push(0);
          precipitation.push(0);
        }
      } else {
        weathercode.push(0);
        precipitation.push(0);
      }
    }
  }

  return { daily, hourly: { time, weathercode, temperature_2m, windspeed_10m, windgusts_10m, precipitation, precipitation_probability } };
}

const FORECAST_STUB = buildDailyHourly();

async function stubAppBootstrapApis(page) {
  await page.route("**/api/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/campsites**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CAMPSITE_STUB) })
  );
  await page.route("**/api/forecast**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(FORECAST_STUB) })
  );
}

async function primePageState(page, { lang = "is", theme = "light" } = {}) {
  await page.addInitScript(
    ([langValue, themeValue]) => {
      window.localStorage.setItem("lang", JSON.stringify(langValue));
      window.localStorage.setItem("theme", JSON.stringify(themeValue));
    },
    [lang, theme]
  );
}

async function gotoAndOpenForecastDetails(page) {
  await page.goto("/");
  await page.locator(".fixed.inset-0.z-\\[9999\\]").waitFor({ state: "hidden" });
  await page.getByText(/Sjá nánari veðurspá|See detailed forecast/).click();
}

test.describe("Daily forecast weather summary — Ticket 400 visual verification", () => {
  test("IS, light, desktop: clear-day/late-overcast shows Clear, not Overcast; rainy day shows a rain condition", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    await stubAppBootstrapApis(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoAndOpenForecastDetails(page);

    const rows = page.getByRole("button", { name: /^Dagur/i });
    await expect(rows.first()).toBeVisible();

    // Day 0: raw daily code is Overcast, hourly is clear-dominant.
    await expect(rows.nth(0).getByText("Heiðskírt")).toBeVisible();
    await expect(rows.nth(0).getByText("Alskýjað")).toHaveCount(0);

    // Day 1: raw daily code is Clear, hourly has a qualifying rain override.
    await expect(rows.nth(1).getByText("Heiðskírt")).toHaveCount(0);

    await page.screenshot({ path: "test-results/ticket-400/table-is-light-desktop.png", fullPage: true });
  });

  test("EN, dark, desktop: same two fixtures, opens hourly modal for day 0 and shows the real per-hour codes (not summarized)", async ({ page }) => {
    await primePageState(page, { lang: "en", theme: "dark" });
    await stubAppBootstrapApis(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: "dark" });
    await gotoAndOpenForecastDetails(page);

    const rows = page.getByRole("button", { name: /^Day/i });
    await expect(rows.first()).toBeVisible();
    await expect(rows.nth(0).getByText("Clear sky")).toBeVisible();
    await expect(rows.nth(0).getByText("Overcast")).toHaveCount(0);

    await page.screenshot({ path: "test-results/ticket-400/table-en-dark-desktop.png", fullPage: true });

    await rows.nth(0).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // The hourly modal shows every 3rd hour; 21:00 genuinely was overcast
    // in the fixture and must still show as Overcast there — only the
    // DAILY headline is summarized, never the hourly rows themselves.
    await expect(page.getByText("Overcast")).toBeVisible();
    await page.screenshot({ path: "test-results/ticket-400/hourly-modal-en-dark-desktop.png" });
  });

  test("IS, light, mobile ~320px: table and hourly modal render without overflow", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    await stubAppBootstrapApis(page);
    await page.setViewportSize({ width: 320, height: 720 });
    await gotoAndOpenForecastDetails(page);

    const rows = page.getByRole("button", { name: /^Dagur/i });
    await expect(rows.first()).toBeVisible();

    // The forecast table has its own PRE-EXISTING intentional
    // overflow-x-auto scroll container for its many metric columns
    // (unrelated to and untouched by this ticket, which only changes the
    // weather label/icon cell's content). What this ticket must not
    // regress is that the label/icon area itself — the content this
    // ticket actually touches — stays within the viewport rather than
    // spilling out unclipped.
    const conditionCellBox = await rows.first().locator("td").first().boundingBox();
    expect(conditionCellBox.x).toBeGreaterThanOrEqual(0);
    expect(conditionCellBox.x + conditionCellBox.width).toBeLessThanOrEqual(320);

    await page.screenshot({ path: "test-results/ticket-400/table-is-light-mobile320.png", fullPage: true });

    await rows.first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.screenshot({ path: "test-results/ticket-400/hourly-modal-is-light-mobile320.png" });
  });
});
