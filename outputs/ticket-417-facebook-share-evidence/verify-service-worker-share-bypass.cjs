// Ticket 417 (#417) — confirms the REAL, built service worker (from
// `npm run build`, served by `vite preview` on the actual dist/ output)
// does not intercept navigation to a static share page and replace it
// with the SPA shell, and that the share HTML files were NOT swept into
// its install-time precache manifest.
const { chromium } = require("playwright");
const fs = require("fs");

const BASE_URL = process.env.WV_PREVIEW_BASE_URL || "http://localhost:5181";
const OUT_DIR = __dirname;

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Load the homepage first and wait for the real SW to install + activate.
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
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

  // Inspect the precache list the SW actually installed — confirms share
  // HTML was excluded via globIgnores.
  const precachedShareUrls = await page.evaluate(async () => {
    const keys = await caches.keys();
    const precacheKey = keys.find((k) => k.includes("precache"));
    if (!precacheKey) return { precacheKeyFound: false, shareUrls: [] };
    const cache = await caches.open(precacheKey);
    const requests = await cache.keys();
    return {
      precacheKeyFound: true,
      shareUrls: requests.map((r) => r.url).filter((u) => u.includes("/share/")),
      totalPrecached: requests.length,
    };
  });

  // Now actually navigate (client-side, a real top-level navigation) to a
  // real share page while the SW is active/controlling this origin, and
  // confirm the genuine static page loads — not the SPA shell.
  await page.goto(`${BASE_URL}/share/tjaldur/v1/is/rain_02.html`, { waitUntil: "networkidle" });
  const title = await page.title();
  const bodyText = await page.locator("body").innerText();
  const sharePageLoadedCorrectly = title.includes("Tjaldur segir") && bodyText.includes("Regnjakki");
  await page.screenshot({ path: `${OUT_DIR}/sw-controlled-share-page-load.png` });

  const results = {
    swControlled,
    precachedShareUrls,
    sharePageTitle: title,
    sharePageLoadedCorrectly,
  };

  fs.writeFileSync(`${OUT_DIR}/results-sw-bypass.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
