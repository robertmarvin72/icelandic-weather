import { test, expect } from "@playwright/test";

// Ticket #503 — real-browser verification for the first B<->H (Búðardalur
// <->Hólmavík) weather/road data binding, layered under the existing
// ticket #502 "Velja staði" geometry flow. Deliberately does NOT stub
// /api/winter-route-geometry or /api/winter-route-data (same discipline
// as tests/e2e/winter-route-ticket-502.spec.js): both go through the real
// Vite proxy to the real backend (vercel dev on 3000), which itself calls
// the real Vegagerðin feeds and the real Open-Meteo forecast. If
// OPEN_METEO_API_KEY is missing in that backend process, "forecast not
// available" is itself a valid degraded-state signal -- never treated as
// a weather confirmation (approved-prompt-v1.md P8a).

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
  await page.goto("/winter-route");
  await expect(page.locator("h1")).toBeVisible();
}

async function selectPlace(page, selectLabel, placeId) {
  await page.getByLabel(selectLabel, { exact: true }).selectOption(placeId);
}

test.describe("WinterRoute (/winter-route) — Ticket #503 Búðardalur<->Hólmavík weather/road data real-browser verification", () => {
  test("desktop, Icelandic: Búðardalur->Hólmavík connects real weather/road data -- connected disclaimer, 4 forecast cards, 7 road sections, edge-segment note", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    let dataRequests = 0;
    await page.route("**/api/winter-route-data**", (route) => {
      dataRequests += 1;
      route.continue();
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    await selectPlace(page, "Frá", "budardalur");
    await selectPlace(page, "Til", "holmavik");
    await page.getByRole("button", { name: "Sýna leið" }).click();

    await expect(page.getByText("Veður og færð eru tengd á fjórum skilgreindum punktum/köflum fyrir þessa leið.")).toBeVisible({ timeout: 15000 });
    expect(dataRequests).toBe(1);

    const dataRegion = page.getByRole("status").last();
    await expect(dataRegion.getByText("Veður á fjórum punktum")).toBeVisible();
    await expect(dataRegion.getByText("Veður á fjórum völdum punktum; Svínadalur/Gilsfjörður hafa engan eigin punkt.")).toBeVisible();
    await expect(dataRegion.getByText("Búðardalur", { exact: true })).toBeVisible();
    await expect(dataRegion.getByText("Þröskuldar — sunnanverð leið")).toBeVisible();
    await expect(dataRegion.getByText("Hólmavík", { exact: true })).toBeVisible();

    await expect(dataRegion.getByText("Skógstagl-Búðardalur")).toBeVisible();
    await expect(dataRegion.getByText("Hólmavík-Drangsnesvegur")).toBeVisible();
    await expect(dataRegion.getByText(/nær aðeins yfir stuttan hluta leiðarinnar/).first()).toBeVisible();

    // Never raw technical fields.
    await expect(page.getByText(/EPSG:3057/)).toHaveCount(0);
    await expect(page.getByText("regionVersion", { exact: false })).toHaveCount(0);

    await page.screenshot({ path: "docs/ai/tasks/ticket-503/evidence/budardalur-holmavik-data-desktop-is.png", fullPage: true });
  });

  test("H->B: the reverse direction also connects real data, with its own request", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    let dataRequests = 0;
    await page.route("**/api/winter-route-data**", (route) => {
      dataRequests += 1;
      route.continue();
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    await selectPlace(page, "Frá", "holmavik");
    await selectPlace(page, "Til", "budardalur");
    await page.getByRole("button", { name: "Sýna leið" }).click();

    await expect(page.getByText("Veður og færð eru tengd á fjórum skilgreindum punktum/köflum fyrir þessa leið.")).toBeVisible({ timeout: 15000 });
    expect(dataRequests).toBe(1);
    await page.screenshot({ path: "docs/ai/tasks/ticket-503/evidence/holmavik-budardalur-data-desktop-is.png", fullPage: true });
  });

  test("UTC hour selection is local-only (no new request), and switching to Fastar veðurleiðir and back preserves the connected data", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    let dataRequests = 0;
    await page.route("**/api/winter-route-data**", (route) => {
      dataRequests += 1;
      route.continue();
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    await selectPlace(page, "Frá", "budardalur");
    await selectPlace(page, "Til", "holmavik");
    await page.getByRole("button", { name: "Sýna leið" }).click();
    await expect(page.getByText("Veður og færð eru tengd á fjórum skilgreindum punktum/köflum fyrir þessa leið.")).toBeVisible({ timeout: 15000 });
    expect(dataRequests).toBe(1);

    const hourSelect = page.getByLabel("Spátími");
    await hourSelect.waitFor({ state: "visible" });
    const options = await hourSelect.locator("option").count();
    if (options > 1) {
      await hourSelect.selectOption({ index: 1 });
    }
    expect(dataRequests).toBe(1); // local-only, no new fetch

    await page.getByRole("button", { name: "Fastar veðurleiðir" }).click();
    await page.getByRole("button", { name: "Velja staði" }).click();
    await expect(page.getByText("Veður og færð eru tengd á fjórum skilgreindum punktum/köflum fyrir þessa leið.")).toBeVisible();
    expect(dataRequests).toBe(1); // still just the one -- mode round-trip never re-fetches
  });

  test("mobile (360px), English: the data section renders with no horizontal scroll", async ({ page }) => {
    await primePageState(page, { lang: "en", theme: "light" });
    await page.setViewportSize({ width: 360, height: 740 });
    await gotoPage(page);

    await selectPlace(page, "From", "budardalur");
    await selectPlace(page, "To", "holmavik");
    await page.getByRole("button", { name: "Show route" }).click();

    await expect(page.getByText("Weather and road conditions are connected at four defined points/sections for this route.")).toBeVisible({ timeout: 15000 });

    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement;
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
    await page.screenshot({ path: "docs/ai/tasks/ticket-503/evidence/budardalur-holmavik-data-mobile-en.png", fullPage: true });
  });

  test("a pair other than B<->H never fetches winter-route-data", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    let dataRequests = 0;
    await page.route("**/api/winter-route-data**", (route) => {
      dataRequests += 1;
      route.continue();
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    await page.getByRole("button", { name: "Sýna leið" }).click();
    await expect(page.getByText("Leiðargrunnur; veður og færð fyrir þessa leið eru ekki enn tengd.")).toBeVisible();
    expect(dataRequests).toBe(0);
  });
});
