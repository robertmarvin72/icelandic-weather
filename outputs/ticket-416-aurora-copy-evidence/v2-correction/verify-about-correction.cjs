// Ticket 416 (#416) Round 2 correction — refreshed About IS/EN mobile
// screenshots confirming the corrected, longer aboutAuroraBody sentence
// wraps correctly with no clipping. Kept in its own subdirectory so v1's
// evidence (outputs/ticket-416-aurora-copy-evidence/*.png) is untouched.
const { chromium } = require("playwright");
const fs = require("fs");

const BASE_URL = process.env.WV_BASE_URL || "http://localhost:5177";
const OUT_DIR = __dirname;

const SITE = { id: "site-a", name: "Thingvellir Test Site", lat: 64.1, lon: -21.9, tier: "free" };

async function setupRoutes(page) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/campsites")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, campsites: [SITE], tier: "free" }) });
    }
    if (url.includes("/api/me")) return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
}

async function shot(browser, { lang, theme, viewport }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.addInitScript(
    ({ lang, theme }) => {
      localStorage.setItem("lang", JSON.stringify(lang));
      localStorage.setItem("theme", JSON.stringify(theme));
    },
    { lang, theme }
  );
  await setupRoutes(page);
  await page.goto(`${BASE_URL}/about`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const bodyClip = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  const auroraSection = page.locator("h2", { hasText: /Northern Lights|Norðurljós/ }).first();
  const bodyText = await auroraSection.locator("xpath=following-sibling::p[1]").textContent();
  const shotPath = `${OUT_DIR}/about-correction-${lang}-mobile.png`;
  await page.screenshot({ path: shotPath, fullPage: true });
  await context.close();
  return { lang, theme, noHorizontalOverflow: !bodyClip, bodyText, screenshot: shotPath };
}

async function main() {
  const browser = await chromium.launch();
  const results = [];
  for (const lang of ["is", "en"]) {
    results.push(await shot(browser, { lang, theme: "light", viewport: { width: 375, height: 900 } }));
  }
  fs.writeFileSync(`${OUT_DIR}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
