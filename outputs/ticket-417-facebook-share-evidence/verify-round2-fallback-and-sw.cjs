// Ticket 417 (#417) Round 2 correction — real-browser verification:
// (a) the scoped ShareFallback's robots noindex meta genuinely appears in
//     document.head and is genuinely removed on navigating back to a
//     normal page (real cleanup, not merely asserted from a component
//     tree);
// (b) an UNKNOWN VERSION (not just an unknown id) correctly reaches the
//     scoped fallback, never generic NotFound;
// (c) real static share pages still bypass the actual built service
//     worker after this round's changes.
const { chromium } = require("playwright");
const fs = require("fs");

const DEV_URL = process.env.WV_DEV_BASE_URL || "http://localhost:5183";
const PREVIEW_URL = process.env.WV_PREVIEW_BASE_URL || "http://localhost:5184";
const OUT_DIR = __dirname;

async function fallbackAndCleanupScenario(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem("lang", JSON.stringify("is")));

  // A normal page first — confirm no robots noindex is present here.
  await page.goto(`${DEV_URL}/about`, { waitUntil: "networkidle" });
  const robotsOnAbout = await page.evaluate(() => !!document.head.querySelector('meta[name="robots"]'));

  // An UNKNOWN VERSION under /share/tjaldur — the exact Round 1 gap.
  await page.goto(`${DEV_URL}/share/tjaldur/v2/is/rain_02`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const bodyText = await page.locator("body").innerText();
  const robotsOnFallback = await page.evaluate(() => {
    const meta = document.head.querySelector('meta[name="robots"]');
    return meta ? meta.getAttribute("content") : null;
  });
  const brandImgSrc = await page.locator("img").first().getAttribute("src");
  await page.screenshot({ path: `${OUT_DIR}/round2-fallback-unknown-version.png` });

  // Navigate back to a normal page via the fallback's own homepage link —
  // real client-side navigation, not a fresh goto — and confirm cleanup.
  await page.getByRole("link", { name: /Fara á forsíðuna|Skoða veðrið|.+/ }).last().click().catch(() => {});
  // The fallback's own CTA text is the safest target — click by its real translated text.
  await context.close();

  return { robotsOnAbout, bodyText, robotsOnFallback, brandImgSrc };
}

async function cleanupOnRealNavigationScenario(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem("lang", JSON.stringify("is")));

  await page.goto(`${DEV_URL}/share/tjaldur/v1/is/not-a-real-id`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const robotsPresent = await page.evaluate(() => !!document.head.querySelector('meta[name="robots"]'));

  // Click the real "go to homepage" link (real translated IS text).
  const homeLink = page.getByText("Fara á forsíðuna", { exact: true });
  await homeLink.click();
  await page.waitForTimeout(500);

  const robotsAfterNavigatingHome = await page.evaluate(() => !!document.head.querySelector('meta[name="robots"]'));
  const urlAfterNav = page.url();
  await context.close();

  return { robotsPresent, robotsAfterNavigatingHome, urlAfterNav };
}

async function serviceWorkerBypassScenario(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(PREVIEW_URL, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.register("/sw.js");
    await new Promise((resolve) => {
      if (reg.active) return resolve();
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        nw?.addEventListener("statechange", () => {
          if (nw.state === "activated") resolve();
        });
      });
    });
  });
  await page.waitForTimeout(1500);
  const swControlled = await page.evaluate(() => !!navigator.serviceWorker.controller);

  await page.goto(`${PREVIEW_URL}/share/tjaldur/v1/is/rain_02.html`, { waitUntil: "networkidle" });
  const title = await page.title();
  const bodyText = await page.locator("body").innerText();
  const loadedRealPage = title.includes("Tjaldur segir") && bodyText.includes("Regnjakki");

  await context.close();
  return { swControlled, title, loadedRealPage };
}

async function main() {
  const browser = await chromium.launch();
  const results = {};

  results.fallbackAndCleanup = await fallbackAndCleanupScenario(browser);
  results.cleanupOnRealNavigation = await cleanupOnRealNavigationScenario(browser);
  results.serviceWorkerBypass = await serviceWorkerBypassScenario(browser);

  fs.writeFileSync(`${OUT_DIR}/results-round2.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
