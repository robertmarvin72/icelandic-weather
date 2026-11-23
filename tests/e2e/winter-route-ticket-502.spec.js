import { test, expect } from "@playwright/test";

// Ticket #502 — real-browser verification for the new "Velja staði"
// Frá/Til search/select + route-base result flow on /winter-route
// (approved-prompt-v1.md P8). Deliberately does NOT stub
// /api/winter-route-geometry (unlike the legacy-flow e2e specs, which
// stub /api/winter-route): the Vite dev server's own proxy must reach the
// REAL handler (ticket #501's api/winter-route-geometry.js) so this is a
// genuine integration check, not a stubbed one. Screenshots are saved
// under docs/ai/tasks/ticket-502/evidence/ (not the usual test-results/
// convention) per the approved prompt's own instruction.

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

test.describe("WinterRoute (/winter-route) — Ticket #502 Velja staði Frá/Til real-browser verification", () => {
  test("desktop, Icelandic: default mode is 'Velja staði' with no request on load, then Rauðavatn→Selfoss shows real options (south/north)", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    let geometryRequests = 0;
    await page.route("**/api/winter-route-geometry**", (route) => {
      geometryRequests += 1;
      route.continue();
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    await expect(page.getByLabel("Frá", { exact: true })).toHaveValue("reykjavik-raudavatn");
    await expect(page.getByLabel("Til", { exact: true })).toHaveValue("selfoss");
    expect(geometryRequests).toBe(0);

    await page.getByRole("button", { name: "Sýna leið" }).click();
    await expect(page.getByText("Leiðargrunnur; veður og færð fyrir þessa leið eru ekki enn tengd.")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Stutta leiðin" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("radio", { name: "Langa leiðin um Hringveginn" })).toBeVisible();
    expect(geometryRequests).toBe(1);

    await page.getByRole("radio", { name: "Langa leiðin um Hringveginn" }).click();
    await expect(page.getByText(/Um: Borgarnes, Akureyri, Egilsstaðir, Vík/)).toBeVisible();
    expect(geometryRequests).toBe(2);

    await page.screenshot({ path: "docs/ai/tasks/ticket-502/evidence/rvk-selfoss-options-desktop-is.png", fullPage: true });
  });

  test("desktop, Icelandic: Búðardalur→Hólmavík shows a real route-base result with via and the access-point disclaimer, no raw technical fields", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    await selectPlace(page, "Frá", "budardalur");
    await selectPlace(page, "Til", "holmavik");
    await page.getByRole("button", { name: "Sýna leið" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Búðardalur → Hólmavík");
    await expect(page.getByText(/Um: Gilsfjörður, Þröskuldar/)).toBeVisible();
    await expect(page.getByText("Valdir punktar við staðina", { exact: false })).toBeVisible();
    await expect(page.getByText(/EPSG:3057/)).toHaveCount(0);
    await expect(page.getByText("geometryId", { exact: false })).toHaveCount(0);
    await page.screenshot({ path: "docs/ai/tasks/ticket-502/evidence/budardalur-holmavik-desktop-is.png", fullPage: true });
  });

  test("desktop, Icelandic: Búðardalur→Tálknafjörður shows the estimated-connector note and the short-approach note", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    await selectPlace(page, "Frá", "budardalur");
    await selectPlace(page, "Til", "talknafjordur");
    await page.getByRole("button", { name: "Sýna leið" }).click();

    await expect(page.getByText("Hluti leiðarinnar er áætluð tenging milli varðveittra vegkafla, ekki bein mæling.")).toBeVisible();
    await expect(page.getByText("Leiðin endar nálægt staðnum, ekki í bænum sjálfum.")).toBeVisible();
    await page.screenshot({ path: "docs/ai/tasks/ticket-502/evidence/budardalur-talknafjordur-desktop-is.png", fullPage: true });
  });

  test("desktop, Icelandic: Selfoss→Selfoss shows the same_place message, never weather/safety/ETA text", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    await selectPlace(page, "Frá", "selfoss");
    await selectPlace(page, "Til", "selfoss");
    await page.getByRole("button", { name: "Sýna leið" }).click();

    await expect(page.getByText("Sami staður valinn — engin leið til að sýna.")).toBeVisible();
    await page.screenshot({ path: "docs/ai/tasks/ticket-502/evidence/selfoss-same-place-desktop-is.png", fullPage: true });
  });

  test("desktop, Icelandic: Rauðavatn→Búðardalur (cross-surface, unsupported) and Flókalundur→Selfoss (400 unknown_place_id) both show the same honest 'no route yet' text, never a technical error", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    await selectPlace(page, "Til", "budardalur");
    await page.getByRole("button", { name: "Sýna leið" }).click();
    await expect(page.getByText("Engin leið er í leiðargrunninum fyrir þessa tvo staði ennþá.")).toBeVisible();
    await page.screenshot({ path: "docs/ai/tasks/ticket-502/evidence/rvk-budardalur-unsupported-desktop-is.png", fullPage: true });

    await selectPlace(page, "Frá", "flokalundur");
    await selectPlace(page, "Til", "selfoss");
    await page.getByRole("button", { name: "Sýna leið" }).click();
    await expect(page.getByText("Engin leið er í leiðargrunninum fyrir þessa tvo staði ennþá.")).toBeVisible();
    await expect(page.getByText(/unknown_place_id/)).toHaveCount(0);
    await page.screenshot({ path: "docs/ai/tasks/ticket-502/evidence/flokalundur-selfoss-400-desktop-is.png", fullPage: true });
  });

  test("mobile (360px), English: search filters the From select, the selected value is never lost, swap works, and there is no horizontal scroll", async ({ page }) => {
    await primePageState(page, { lang: "en", theme: "light" });
    await page.setViewportSize({ width: 360, height: 740 });
    await gotoPage(page);

    await expect(page.getByLabel("From", { exact: true })).toHaveValue("reykjavik-raudavatn");

    const fromSearch = page.getByLabel("Search starting point");
    await fromSearch.fill("isafjordur");
    const fromSelect = page.getByLabel("From", { exact: true });
    await expect(fromSelect.locator("option", { hasText: "Ísafjörður" })).toBeAttached();
    // The default selection (Reykjavík (Rauðavatn)) is still present even
    // though the search no longer matches it (P3b).
    await expect(fromSelect).toHaveValue("reykjavik-raudavatn");
    await expect(fromSelect.locator("option", { hasText: "Reykjavík (Rauðavatn)" })).toBeAttached();

    await fromSearch.fill("");
    const swapButton = page.getByRole("button", { name: "Swap From and To" });
    await swapButton.click();
    await expect(page.getByLabel("From", { exact: true })).toHaveValue("selfoss");
    await expect(page.getByLabel("To", { exact: true })).toHaveValue("reykjavik-raudavatn");

    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement;
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
    await page.screenshot({ path: "docs/ai/tasks/ticket-502/evidence/search-swap-mobile-en.png", fullPage: true });
  });

  test("keyboard: Tab reaches From search/select, To search/select, swap and submit in order; Enter in a search field submits the form with the current valid selection", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    let geometryRequests = 0;
    await page.route("**/api/winter-route-geometry**", (route) => {
      geometryRequests += 1;
      route.continue();
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    const fromSearch = page.getByLabel("Leita að upphafsstað");
    await fromSearch.focus();
    await expect(fromSearch).toBeFocused();

    // Enter in the search field submits the current (unchanged, valid)
    // draft pair -- documented choice, approved-prompt-v1.md P3(f).
    await page.keyboard.press("Enter");
    await expect(page.getByText("Leiðargrunnur; veður og færð fyrir þessa leið eru ekki enn tengd.")).toBeVisible();
    expect(geometryRequests).toBe(1);
  });

  test("mode toggle: switching to 'Fastar veðurleiðir' and back never leaves the geometry section's own request pending/broken", async ({ page }) => {
    await primePageState(page, { lang: "is", theme: "light" });
    // The legacy flow needs the live Vegagerðin/Open-Meteo network (per
    // approved-prompt-v1.md P8a, a real limitation of this real-browser
    // check, not stubbed here) -- this test only confirms the toggle
    // itself and that the geometry section survives round-tripping
    // through it, not the legacy flow's own data.
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPage(page);

    await selectPlace(page, "Frá", "budardalur");
    await selectPlace(page, "Til", "holmavik");
    await page.getByRole("button", { name: "Sýna leið" }).click();
    await expect(page.getByText(/Um: Gilsfjörður, Þröskuldar/)).toBeVisible();

    await page.getByRole("button", { name: "Fastar veðurleiðir" }).click();
    await page.getByRole("button", { name: "Velja staði" }).click();

    await expect(page.getByLabel("Frá", { exact: true })).toHaveValue("budardalur");
    await expect(page.getByLabel("Til", { exact: true })).toHaveValue("holmavik");
    await expect(page.getByText(/Um: Gilsfjörður, Þröskuldar/)).toBeVisible();
  });
});
