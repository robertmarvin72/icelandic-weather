import { test, expect } from "@playwright/test";

const CAMPSITE_STUB = {
  ok: true,
  tier: "free",
  campsites: [{ id: "test_site", name: "Test Campsite", lat: 64.14, lon: -21.89 }],
};

const FORECAST_STUB = {
  daily: {
    time: ["2026-04-10"],
    temperature_2m_max: [10],
    temperature_2m_min: [5],
    precipitation_sum: [0],
    windspeed_10m_max: [5],
    windgusts_10m_max: [8],
    winddirection_10m_dominant: [180],
    weathercode: [0],
  },
};

async function stubAppBootstrapApis(page) {
  // Broad catch-all first — covers /api/me, /api/login, etc.
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
  );

  // Specific overrides registered after (Playwright evaluates last-in/first-out)
  await page.route("**/api/campsites**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(CAMPSITE_STUB),
    })
  );

  await page.route("**/api/forecast**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(FORECAST_STUB),
    })
  );
}

test.describe("Footer — Blog link", () => {
  test.beforeEach(async ({ page }) => {
    await stubAppBootstrapApis(page);
  });

  test("Blog link is visible in footer and navigates to /blog", async ({ page }) => {
    await page.goto("/");

    // Wait for the app loading splash to clear (requires campsites + forecast loaded)
    await page.locator(".fixed.inset-0.z-\\[9999\\]").waitFor({ state: "hidden" });

    const blogLink = page.getByRole("link", { name: "Blog" });
    await expect(blogLink).toBeVisible();

    await blogLink.click();
    await expect(page).toHaveURL("/blog");
  });
});
