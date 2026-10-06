// #434 browser evidence: Settings "Skrá út" / "Log out" row.
// Runs against the production build (vite preview). /api/* is mocked per session,
// external requests are aborted, and no live account is touched.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:4173";
const OUT = path.resolve("outputs/ticket-434-browser-evidence");
fs.mkdirSync(OUT, { recursive: true });

const PRO_ME = {
  ok: true,
  user: { id: "u1", email: "mock-camper@example.com" },
  subscription: { status: "active" },
  entitlements: { pro: true, proUntil: "2030-01-01T00:00:00.000Z" },
};
const ANON_ME = { ok: true, user: null, subscription: null, entitlements: { pro: false, proUntil: null } };
const SITES = [
  { id: "site-a", name: "Alpha Camp", lat: 64.1, lon: -21.9, tier: "free" },
  { id: "site-b", name: "Beta Camp", lat: 64.2, lon: -21.8, tier: "pro" },
];

const LABELS = {
  is: { settings: "Stillingar", logout: "Skrá út", failure: "Ekki tókst að skrá út. Reyndu aftur." },
  en: { settings: "Settings", logout: "Log out", failure: "Could not log out. Please try again." },
};

const VIEWPORTS = [
  { name: "mobile-320", width: 320, height: 720 },
  { name: "desktop-1280", width: 1280, height: 800 },
];

const results = [];
const record = (scenario, check, pass, detail = "") => {
  results.push({ scenario, check, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} [${scenario}] ${check}${detail ? ` — ${detail}` : ""}`);
};

async function openPage(browser, { vp, lang, session, logoutMode = "ok" }) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  await context.addInitScript((l) => {
    try {
      window.localStorage.setItem("lang", JSON.stringify(l));
    } catch {}
  }, lang);

  const counts = { me: 0, logout: 0 };
  await context.route(/^https?:\/\/(?!localhost:4173)/, (route) => route.abort());
  await context.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/me") {
      counts.me += 1;
      return route.fulfill({ json: session === "pro" ? PRO_ME : ANON_ME });
    }
    if (url.pathname === "/api/campsites") {
      return route.fulfill({ json: { ok: true, tier: session === "pro" ? "pro" : "free", campsites: SITES } });
    }
    if (url.pathname === "/api/logout") {
      counts.logout += 1;
      if (logoutMode === "fail") {
        return route.fulfill({ status: 500, json: { ok: false, error: "mock failure" } });
      }
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({ json: { ok: true } });
  });

  const page = await context.newPage();
  page.on("pageerror", (e) => console.log(`[pageerror] ${e.message}`));
  // Anchor: register the /api/me wait before navigation and record which session it answered.
  const meResponse = page.waitForResponse((r) => new URL(r.url()).pathname === "/api/me");
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  const meRes = await meResponse;
  const meBody = await meRes.json();
  counts.meState = meBody.user ? "signed-in" : "anonymous";
  // Harness workaround: the boot Splash (z-[9999]) only clears after a real forecast
  // returns rows, and the mocked forecast is intentionally empty. Hide the overlay so
  // it does not intercept clicks. This does not change the logout behavior under test.
  await page.addStyleTag({ content: "div.fixed.inset-0.z-\\[9999\\]{display:none!important}" });
  return { context, page, counts };
}

async function run() {
  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    for (const lang of ["is", "en"]) {
      const L = LABELS[lang];
      const scenario = `${vp.name}-${lang}`;

      // ── signed-in Pro ───────────────────────────────────────────────────
      {
        const { context, page, counts } = await openPage(browser, { vp, lang, session: "pro" });
        const toggle = page.getByRole("button", { name: new RegExp(L.settings) });
        await toggle.waitFor({ state: "visible", timeout: 20000 });
        await toggle.click();

        const logoutBtn = page.getByRole("button", { name: new RegExp(L.logout) });
        await logoutBtn.waitFor({ state: "visible" });
        const box = await logoutBtn.boundingBox();
        record(scenario, "signed-in shows logout row", true);
        record(scenario, "logout touch target >= 44px", box.height >= 44, `height=${box.height}`);

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        record(scenario, "no horizontal page overflow with panel open", overflow <= 0, `overflowPx=${overflow}`);

        // Screenshot-only: hide the toast stack so it does not cover the panel.
        await page.addStyleTag({ content: "div.fixed.bottom-4.left-4{display:none!important}" });
        const panel = page.locator("#toolbar-settings-panel");
        await panel.screenshot({ path: path.join(OUT, `${scenario}-signed-in-panel.png`) });

        await logoutBtn.click();
        await page.locator("#toolbar-settings-panel").waitFor({ state: "detached", timeout: 10000 });
        record(scenario, "successful logout closes panel", true);
        record(scenario, "POST /api/logout sent exactly once", counts.logout === 1, `count=${counts.logout}`);

        const focusedIsToggle = await toggle.evaluate((el) => document.activeElement === el);
        record(scenario, "focus returns to Settings toggle", focusedIsToggle);

        await toggle.click();
        await page.locator("#toolbar-settings-panel").waitFor({ state: "visible" });
        const stillShown = await page.getByRole("button", { name: new RegExp(L.logout) }).count();
        record(scenario, "anonymous after logout: row gone", stillShown === 0, `count=${stillShown}`);
        record(scenario, "no verification /api/me refetch after logout", counts.me === 1, `me=${counts.me}`);

        await page.locator("#toolbar-settings-panel").screenshot({
          path: path.join(OUT, `${scenario}-after-logout-panel.png`),
        });
        await context.close();
      }

      // ── anonymous ──────────────────────────────────────────────────────
      {
        const { context, page, counts } = await openPage(browser, { vp, lang, session: "anon" });
        record(scenario, "anonymous anchor: /api/me answered anonymous", counts.meState === "anonymous", counts.meState);
        const toggle = page.getByRole("button", { name: new RegExp(L.settings) });
        await toggle.waitFor({ state: "visible", timeout: 20000 });
        await toggle.click();
        await page.locator("#toolbar-settings-panel").waitFor({ state: "visible" });
        const count = await page.getByRole("button", { name: new RegExp(L.logout) }).count();
        record(scenario, "anonymous: no logout row", count === 0, `count=${count}`);
        await context.close();
      }

      // ── failure path (desktop only, to keep the run short) ─────────────
      if (vp.name === "desktop-1280") {
        const { context, page, counts } = await openPage(browser, { vp, lang, session: "pro", logoutMode: "fail" });
        const toggle = page.getByRole("button", { name: new RegExp(L.settings) });
        await toggle.waitFor({ state: "visible", timeout: 20000 });
        await toggle.click();
        await page.getByRole("button", { name: new RegExp(L.logout) }).click();
        const toast = page.getByText(L.failure);
        await toast.waitFor({ state: "visible", timeout: 10000 });
        record(scenario, "failure shows translated toast", true, L.failure);
        record(scenario, "failure keeps panel open and row enabled", await page.locator("#toolbar-settings-panel").count() === 1 &&
          (await page.getByRole("button", { name: new RegExp(L.logout) }).isEnabled()));
        record(scenario, "failure sent one request", counts.logout === 1, `count=${counts.logout}`);
        await page.screenshot({ path: path.join(OUT, `${scenario}-failure.png`) });
        await context.close();
      }
    }
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exitCode = 1;
}

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
