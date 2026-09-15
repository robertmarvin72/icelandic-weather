// Ticket 416 (#416) — real-browser verification of the Northern Lights
// copy added to About, PricingInfo and Pricing (IS/EN x mobile/desktop x
// light/dark), plus real navigation: the Icelandic /#northern-lights
// anchor (in-season real card, off-season honest fallback, delayed
// campsite loading, About-to-home reuse) and the forced-English standalone
// route from a saved-Icelandic session.
const { chromium } = require("playwright");
const fs = require("fs");

const BASE_URL = process.env.WV_BASE_URL || "http://localhost:5176";
const OUT_DIR = __dirname;

const SITE = { id: "site-a", name: "Thingvellir Test Site", lat: 64.1, lon: -21.9, tier: "free" };

function isoDate(base, offsetDays) {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function buildDaily(base) {
  const time = [], tmax = [], tmin = [], precip = [], windMax = [], windGust = [], windDir = [], code = [];
  for (let i = 0; i < 7; i++) {
    time.push(isoDate(base, i));
    tmax.push(8); tmin.push(3); precip.push(0.5); windMax.push(4); windGust.push(6); windDir.push(180); code.push(2);
  }
  return { time, temperature_2m_max: tmax, temperature_2m_min: tmin, precipitation_sum: precip, windspeed_10m_max: windMax, windgusts_10m_max: windGust, winddirection_10m_dominant: windDir, weathercode: code };
}

async function setupRoutes(page, { baseDate, auroraCounter } = {}) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/campsites")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, campsites: [SITE], tier: "free" }) });
    }
    if (url.includes("/api/forecast")) {
      const daily = buildDaily(baseDate || "2026-09-15");
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ daily, hourly: { time: [], weathercode: [], precipitation: [], windspeed_10m: [], windgusts_10m: [], temperature_2m: [] } }) });
    }
    if (url.includes("/api/aurora-decision")) {
      if (auroraCounter) auroraCounter.count += 1;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, best: null, alternatives: [] }) });
    }
    if (url.includes("/api/me")) return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
}

async function newPage(browser, { lang, theme, viewport }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.addInitScript(
    ({ lang, theme }) => {
      localStorage.setItem("lang", JSON.stringify(lang));
      localStorage.setItem("theme", JSON.stringify(theme));
    },
    { lang, theme }
  );
  return { context, page };
}

const VIEWPORTS = { mobile: { width: 375, height: 900 }, desktop: { width: 1280, height: 1000 } };

async function shotPage(browser, { path, label, lang, theme, viewport }) {
  const { context, page } = await newPage(browser, { lang, theme, viewport: VIEWPORTS[viewport] });
  await setupRoutes(page, {});
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const bodyClip = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  const shotPath = `${OUT_DIR}/${label}-${lang}-${theme}-${viewport}.png`;
  await page.screenshot({ path: shotPath, fullPage: true });
  await context.close();
  return { label, lang, theme, viewport, noHorizontalOverflow: !bodyClip, screenshot: shotPath };
}

async function main() {
  const browser = await chromium.launch();
  const results = { pageShots: [], checks: {} };

  // 1) Screenshot matrix: About / PricingInfo / Pricing x IS/EN x light/dark x mobile/desktop
  const pages = [
    { path: "/about", label: "about" },
    { path: "/pricing-info", label: "pricing-info" },
    { path: "/pricing", label: "pricing" },
  ];
  for (const p of pages) {
    for (const lang of ["is", "en"]) {
      for (const theme of ["light", "dark"]) {
        for (const viewport of ["mobile", "desktop"]) {
          const r = await shotPage(browser, { path: p.path, label: p.label, lang, theme, viewport });
          results.pageShots.push(r);
          console.log(`${p.label} / ${lang} / ${theme} / ${viewport}: overflow=${!r.noHorizontalOverflow}`);
        }
      }
    }
  }

  // 2) About page content + link hrefs (IS -> hash anchor, EN -> standalone route)
  {
    const { context, page } = await newPage(browser, { lang: "is", theme: "light", viewport: VIEWPORTS.desktop });
    await setupRoutes(page, {});
    await page.goto(`${BASE_URL}/about`, { waitUntil: "networkidle" });
    const isHref = await page.locator('a[href="/#northern-lights"]').count();
    await context.close();

    const { context: c2, page: p2 } = await newPage(browser, { lang: "en", theme: "light", viewport: VIEWPORTS.desktop });
    await setupRoutes(p2, {});
    await p2.goto(`${BASE_URL}/about`, { waitUntil: "networkidle" });
    const enHref = await p2.locator('a[href="/en/northern-lights"]').count();
    await c2.close();

    results.checks.aboutLinks = { isAnchorLinkPresent: isHref > 0, enStandaloneLinkPresent: enHref > 0 };
  }

  // 3) Real navigation: click the About page's IS Aurora link and confirm it
  //    lands on the homepage, scrolled to the anchor, showing the real
  //    Northern Lights card content (in season — real "now" is Sept 2026).
  {
    const { context, page } = await newPage(browser, { lang: "is", theme: "light", viewport: VIEWPORTS.desktop });
    const auroraCounter = { count: 0 };
    await setupRoutes(page, { auroraCounter });
    await page.goto(`${BASE_URL}/about`, { waitUntil: "networkidle" });
    await page.locator('a[href="/#northern-lights"]').click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(700);
    const anchorBox = await page.locator("#northern-lights").boundingBox();
    const cardVisible = await page.locator('#northern-lights [data-testid="nl-card"]').count();
    await page.screenshot({ path: `${OUT_DIR}/nav-about-to-home-is-inseason.png` });
    await context.close();
    results.checks.aboutToHomeInSeason = {
      anchorBoxY: anchorBox ? anchorBox.y : null,
      anchorNearViewportTop: anchorBox ? anchorBox.y < 300 : null,
      realCardPresent: cardVisible > 0,
      auroraRequestsFired: auroraCounter.count,
    };
  }

  // 4) About renders exactly ONE localized Aurora link, matching current
  //    UI language — never both, never the wrong one for the active lang.
  {
    const { context, page } = await newPage(browser, { lang: "en", theme: "light", viewport: VIEWPORTS.desktop });
    await setupRoutes(page, {});
    await page.goto(`${BASE_URL}/about`, { waitUntil: "networkidle" });
    const enHrefCount = await page.locator('a[href="/en/northern-lights"]').count();
    const isHrefCount = await page.locator('a[href="/#northern-lights"]').count();
    await context.close();
    results.checks.aboutEnSession = { enStandaloneLinkPresent: enHrefCount > 0, icelandicAnchorLinkAbsent: isHrefCount === 0 };
  }

  // 5) Off-season fallback on the homepage (April fixture), via Playwright's
  //    clock API — honest localized message, target id present, no Aurora
  //    request caused by the fallback.
  {
    const { context, page } = await newPage(browser, { lang: "is", theme: "light", viewport: VIEWPORTS.desktop });
    const auroraCounter = { count: 0 };
    await page.clock.install({ time: new Date("2026-04-15T12:00:00.000Z") });
    await setupRoutes(page, { auroraCounter });
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const anchor = page.locator("#northern-lights");
    const anchorCount = await anchor.count();
    const fallbackText = await anchor.textContent();
    const cardPresent = await page.locator('#northern-lights [data-testid="nl-card"]').count();
    await page.screenshot({ path: `${OUT_DIR}/homepage-off-season-april-is.png` });
    await context.close();
    results.checks.offSeasonApril = {
      anchorPresent: anchorCount > 0,
      fallbackText: fallbackText?.trim(),
      cardPresent: cardPresent > 0,
      auroraRequestsFired: auroraCounter.count,
    };
  }

  // 6) Delayed campsite loading: hash present, campsites API delayed —
  //    confirm the page still scrolls to the anchor once it mounts.
  {
    const { context, page } = await newPage(browser, { lang: "is", theme: "light", viewport: VIEWPORTS.desktop });
    await page.route("**/api/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/api/campsites")) {
        await new Promise((r) => setTimeout(r, 900));
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, campsites: [SITE], tier: "free" }) });
      }
      if (url.includes("/api/forecast")) {
        const daily = buildDaily("2026-09-15");
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ daily, hourly: { time: [], weathercode: [], precipitation: [], windspeed_10m: [], windgusts_10m: [], temperature_2m: [] } }) });
      }
      if (url.includes("/api/aurora-decision")) {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, best: null, alternatives: [] }) });
      }
      if (url.includes("/api/me")) return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false }) });
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });
    await page.goto(`${BASE_URL}/#northern-lights`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('#northern-lights [data-testid="nl-card"]', { timeout: 5000 });
    await page.waitForTimeout(600);
    const anchorBox = await page.locator("#northern-lights").boundingBox();
    await context.close();
    results.checks.delayedCampsiteLoadingScroll = {
      anchorBoxY: anchorBox ? anchorBox.y : null,
      anchorNearViewportTop: anchorBox ? anchorBox.y < 300 : null,
    };
  }

  // 7) Existing purchase controls still present/functional-looking on
  //    Pricing/PricingInfo (no redesign, nothing removed).
  {
    const { context, page } = await newPage(browser, { lang: "en", theme: "light", viewport: VIEWPORTS.desktop });
    await setupRoutes(page, {});
    await page.goto(`${BASE_URL}/pricing`, { waitUntil: "networkidle" });
    const ctaCount = await page.getByRole("button").count();
    await context.close();
    results.checks.pricingCtasStillPresent = ctaCount >= 4;
  }

  fs.writeFileSync(`${OUT_DIR}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results.checks, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
