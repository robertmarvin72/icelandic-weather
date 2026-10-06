// #435 browser evidence: Settings row presentation (units, language, theme, PWA, DEV-exempt, logout).
// Production build via `vite preview` on localhost:4173. /api/* mocked per session; external requests
// aborted; no live account, Neon, GA or payment call. Theme and language are set through the real
// localStorage keys ("theme" and "lang", JSON-encoded, see useLocalStorageState in src/hooks).
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:4173";
const OUT = path.resolve("outputs/ticket-435-browser-evidence");
fs.mkdirSync(OUT, { recursive: true });

const LABELS = {
  is: { settings: "Stillingar", logout: "Skrá út", pending: "Skrái út…", failure: "Ekki tókst að skrá út. Reyndu aftur." },
  en: { settings: "Settings", logout: "Log out", pending: "Logging out…", failure: "Could not log out. Please try again." },
};

const SIGNED_IN = {
  ok: true,
  user: { id: "u1", email: "mock-camper@example.com" },
  subscription: { status: "active" },
  entitlements: { pro: true, proUntil: "2030-01-01T00:00:00.000Z" },
};
const ANONYMOUS = { ok: true, user: null, subscription: null, entitlements: { pro: false, proUntil: null } };
const SITES = [
  { id: "site-a", name: "Alpha Camp", lat: 64.1, lon: -21.9, tier: "free" },
  { id: "site-b", name: "Beta Camp", lat: 64.2, lon: -21.8, tier: "pro" },
];

const W = (name, w, h) => ({ name, width: w, height: h });
const VP = { 320: W("320", 320, 720), 375: W("375", 375, 760), 768: W("768", 768, 900), 1280: W("1280", 1280, 800) };

// 29 reportable scenarios (see v1 evidence matrix).
const SCENARIOS = [];
for (const w of [320, 375, 768, 1280]) for (const lang of ["is", "en"]) for (const theme of ["light", "dark"]) {
  SCENARIOS.push({ id: `signed-in-nopwa-${w}-${lang}-${theme}`, w, lang, theme, session: "signed-in", pwa: false, kind: "layout" });
}
SCENARIOS.push(
  { id: "pwa-visible-320-en-light", w: 320, lang: "en", theme: "light", session: "signed-in", pwa: true, kind: "layout" },
  { id: "pwa-visible-320-is-dark", w: 320, lang: "is", theme: "dark", session: "signed-in", pwa: true, kind: "layout" },
  { id: "pwa-visible-768-en-light", w: 768, lang: "en", theme: "light", session: "signed-in", pwa: true, kind: "layout" },
  { id: "pwa-visible-1280-is-light", w: 1280, lang: "is", theme: "light", session: "signed-in", pwa: true, kind: "layout" },
  { id: "pending-320-en-light", w: 320, lang: "en", theme: "light", session: "signed-in", pwa: false, kind: "pending" },
  { id: "pending-320-is-light", w: 320, lang: "is", theme: "light", session: "signed-in", pwa: false, kind: "pending" },
  { id: "pending-1280-en-dark", w: 1280, lang: "en", theme: "dark", session: "signed-in", pwa: false, kind: "pending" },
  { id: "pending-1280-is-dark", w: 1280, lang: "is", theme: "dark", session: "signed-in", pwa: false, kind: "pending" },
  { id: "anonymous-320-en-light", w: 320, lang: "en", theme: "light", session: "anon", pwa: false, kind: "anon" },
  { id: "anonymous-1280-is-dark", w: 1280, lang: "is", theme: "dark", session: "anon", pwa: false, kind: "anon" },
  { id: "keyboard-320-en-light", w: 320, lang: "en", theme: "light", session: "signed-in", pwa: false, kind: "keyboard" },
  { id: "keyboard-1280-is-dark", w: 1280, lang: "is", theme: "dark", session: "signed-in", pwa: false, kind: "keyboard" },
  { id: "failure-375-en-light", w: 375, lang: "en", theme: "light", session: "signed-in", pwa: false, kind: "failure" },
);

const results = [];
let assertPass = 0;
let assertTotal = 0;
let current = "";
function check(name, pass, detail = "") {
  results.push({ scenario: current, check: name, pass: !!pass, detail: String(detail) });
  assertTotal += 1;
  if (pass) assertPass += 1;
  console.log(`${pass ? "PASS" : "FAIL"} [${current}] ${name}${detail !== "" ? ` — ${detail}` : ""}`);
}
function observe(name, detail) {
  results.push({ scenario: current, check: name, pass: null, detail: String(detail) });
  console.log(`OBS  [${current}] ${name} — ${detail}`);
}

// Measures the settings row inside the open panel. Runs in the page.
const SNAPSHOT = (labels) => {
  const panel = document.getElementById("toolbar-settings-panel");
  if (!panel) return null;
  const buttons = [...panel.querySelectorAll("button")];
  const find = (pred) => buttons.find(pred) || null;
  const units = find((b) => /units/i.test(b.getAttribute("aria-label") || ""));
  const lang = find((b) => b.textContent.includes("🌐"));
  const theme = find((b) => /mode/i.test(b.getAttribute("aria-label") || ""));
  const logout = find((b) => b.textContent.includes(labels.logout) || b.textContent.includes(labels.pending));
  const pwa = find((b) => (b.getAttribute("aria-label") || "").startsWith("Setja"));
  const dev = find((b) => b.textContent.includes("Dev Pro"));

  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, top: Math.round(r.top) };
  };
  const cursor = (el) => (el ? getComputedStyle(el).cursor : null);

  // Contrast over the composited background. Canvas parses oklch/color-mix values to sRGB.
  const toRgba = (c) => {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (top, bottom) => {
    const a = top[3] + bottom[3] * (1 - top[3]);
    if (a === 0) return [0, 0, 0, 0];
    const mix = (i) => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / a;
    return [mix(0), mix(1), mix(2), a];
  };
  const lum = ([r, g, b]) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrastFor = (el) => {
    if (!el) return null;
    const dark = document.documentElement.classList.contains("dark");
    let bg = dark ? [2, 6, 23, 1] : [255, 255, 255, 1];
    const chain = [];
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) chain.unshift(n);
    for (const n of chain) {
      const c = getComputedStyle(n).backgroundColor;
      if (!c || c === "transparent") continue;
      const rgba = toRgba(c);
      if (rgba[3] > 0) bg = over(rgba, bg);
    }
    const fg = toRgba(getComputedStyle(el).color);
    const l1 = lum(fg);
    const l2 = lum(bg);
    const hi = Math.max(l1, l2);
    const lo = Math.min(l1, l2);
    return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
  };

  const row = [units, lang, theme, logout].filter(Boolean);
  const tops = [...new Set(row.map((el) => Math.round(el.getBoundingClientRect().top)))];
  const panelRect = panel.getBoundingClientRect();
  const logoutGroup = logout ? logout.parentElement : null;

  return {
    overflowPx: document.documentElement.scrollWidth - window.innerWidth,
    panel: { w: panelRect.width, h: panelRect.height },
    units: rect(units),
    lang: rect(lang),
    theme: rect(theme),
    logout: rect(logout),
    pwa: rect(pwa),
    dev: rect(dev),
    cursors: { units: cursor(units), lang: cursor(lang), theme: cursor(theme), logout: cursor(logout) },
    contrast: { logout: contrastFor(logout), units: contrastFor(units) },
    logoutGroupBorderLeft: logoutGroup ? getComputedStyle(logoutGroup).borderLeftWidth : null,
    logoutGroupHasBorderTop: logoutGroup ? getComputedStyle(logoutGroup).borderTopWidth !== "0px" : null,
    rowTops: tops,
    logoutDisabled: logout ? logout.disabled : null,
    logoutAriaBusy: logout ? logout.getAttribute("aria-busy") : null,
    logoutText: logout ? logout.textContent.trim() : null,
    logoutSvgs: logout ? logout.querySelectorAll("svg").length : null,
    logoutCls: logout ? logout.className : null,
    logoutGroupWidth: logoutGroup ? logoutGroup.getBoundingClientRect().width : null,
    lastChildIsLogoutGroup: panel.lastElementChild === logoutGroup,
  };
};

async function openPage(browser, sc) {
  const context = await browser.newContext({ viewport: { width: sc.w, height: 800 } });
  await context.addInitScript(
    ({ lang, theme }) => {
      try {
        window.localStorage.setItem("lang", JSON.stringify(lang));
        window.localStorage.setItem("theme", JSON.stringify(theme));
      } catch {}
    },
    { lang: sc.lang, theme: sc.theme }
  );

  const counts = { me: 0, logout: 0, meState: null };
  let releaseLogout = null;
  let logoutMode = "ok";
  await context.route(/^https?:\/\/(?!localhost:4173)/, (route) => route.abort());
  await context.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/me") {
      counts.me += 1;
      return route.fulfill({ json: sc.session === "anon" ? ANONYMOUS : SIGNED_IN });
    }
    if (url.pathname === "/api/campsites") {
      return route.fulfill({ json: { ok: true, tier: "pro", campsites: SITES } });
    }
    if (url.pathname === "/api/logout") {
      counts.logout += 1;
      if (sc.kind === "pending") {
        await new Promise((r) => (releaseLogout = r));
      }
      if (logoutMode === "fail") {
        return route.fulfill({ status: 500, json: { ok: false, error: "mock failure" } });
      }
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({ json: { ok: true } });
  });

  const page = await context.newPage();
  page.on("pageerror", (e) => console.log(`[pageerror ${sc.id}] ${e.message}`));
  // Anchor: /api/me is registered before navigation and its state is recorded.
  const meResponse = page.waitForResponse((r) => new URL(r.url()).pathname === "/api/me");
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  const meRes = await meResponse;
  counts.meState = (await meRes.json()).user ? "signed-in" : "anonymous";
  // WORKAROUND (same as #434): the boot Splash overlay only clears after a forecast returns rows,
  // and the mocked forecast is empty. Hidden with CSS so it does not intercept clicks.
  await page.addStyleTag({ content: "div.fixed.inset-0.z-\\[9999\\]{display:none!important}" });
  // WORKAROUND: screenshot-only; hides the bottom-left toast stack from unrelated mocked forecast errors.
  const hideToasts = () => page.addStyleTag({ content: "div.fixed.bottom-4.left-4{display:none!important}" });
  return { context, page, counts, release: () => releaseLogout && releaseLogout(), setLogoutMode: (m) => (logoutMode = m), hideToasts };
}

async function openSettings(page, lang) {
  const toggle = page.getByRole("button", { name: new RegExp(LABELS[lang].settings) });
  await toggle.waitFor({ state: "visible", timeout: 20000 });
  await toggle.click();
  await page.locator("#toolbar-settings-panel").waitFor({ state: "visible" });
  return toggle;
}

async function runScenario(browser, sc) {
  current = sc.id;
  const L = LABELS[sc.lang];
  const { context, page, counts, release, setLogoutMode, hideToasts } = await openPage(browser, sc);
  const dir = (f) => path.join(OUT, `${sc.id}-${f}.png`);
  if (sc.kind !== "failure") await hideToasts();
  try {
    check("anchor: /api/me answered as the scenario session", counts.meState === (sc.session === "anon" ? "anonymous" : "signed-in"), counts.meState);

    const toggle = await openSettings(page, sc.lang);
    if (sc.pwa) {
      // Dispatch only after Settings is open: InstallPWA listens while mounted.
      await page.evaluate(() => {
        const e = new Event("beforeinstallprompt", { cancelable: true });
        e.prompt = () => Promise.resolve();
        e.userChoice = Promise.resolve({ outcome: "dismissed" });
        window.dispatchEvent(e);
      });
      await page.getByRole("button", { name: /Setja/ }).waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    }
    await page.waitForTimeout(150);

    const snap = await page.evaluate(SNAPSHOT, L);
    if (!snap) throw new Error("settings panel missing");

    if (sc.kind === "layout") {
      check("no horizontal page overflow", snap.overflowPx <= 0, `overflowPx=${snap.overflowPx}`);
      const signedIn = sc.session === "signed-in";
      if (signedIn) {
        check("logout control present for signed-in user", !!snap.logout);
        check("logout text is visible translated label", snap.logoutText === L.logout, snap.logoutText);
        check("logout icon: exactly one SVG", snap.logoutSvgs === 1, `svgs=${snap.logoutSvgs}`);
        check("logout is the last control group", snap.lastChildIsLogoutGroup === true);
        check("logout group has left divider, no top border", snap.logoutGroupBorderLeft !== "0px" && snap.logoutGroupHasBorderTop === false, `borderLeft=${snap.logoutGroupBorderLeft}`);
        const sizes = [snap.units, snap.lang, snap.theme, snap.logout].map((r) => r.h);
        check("four row controls each >= 44px high", sizes.every((h) => h >= 44), sizes.map((h) => h.toFixed(1)).join(","));
        check("four row controls share equal height (<=1px)", Math.max(...sizes) - Math.min(...sizes) <= 1, `${Math.min(...sizes).toFixed(1)}..${Math.max(...sizes).toFixed(1)}`);
        check("logout is content-sized (group < 60% of panel width)", snap.logoutGroupWidth < snap.panel.w * 0.6, `group=${snap.logoutGroupWidth.toFixed(0)} panel=${snap.panel.w.toFixed(0)}`);
        check("controls use pointer cursor", Object.values(snap.cursors).every((c) => c === "pointer"), JSON.stringify(snap.cursors));
        check("logout contrast >= 4.5:1 (normal state, composited bg)", snap.contrast.logout >= 4.5, `ratio=${snap.contrast.logout}`);
        observe("units control contrast (composited)", snap.contrast.units);
      }
      const rowCount = snap.rowTops.length;
      if (sc.w === 1280 && !sc.pwa) check("ample width: units/lang/theme/logout share one row", rowCount === 1, `rows=${rowCount}`);
      else observe("row wrap state", `distinct row tops=${rowCount} at ${sc.w}px${sc.pwa ? " (PWA visible)" : ""}`);
      if (sc.pwa) {
        check("InstallPWA visible with shared class", !!snap.pwa, snap.pwa ? `h=${snap.pwa.h.toFixed(1)}` : "absent");
        if (snap.pwa) check("InstallPWA height >= 44px", snap.pwa.h >= 44, snap.pwa.h.toFixed(1));
      }
      await page.screenshot({ path: dir("viewport") });
      await page.locator("#toolbar-settings-panel").screenshot({ path: dir("panel") });
    }

    if (sc.kind === "anon") {
      check("anonymous: no logout control", snap.logout === null);
      check("anonymous: panel has exactly three direct buttons", snap.lastChildIsLogoutGroup === false && (await page.locator("#toolbar-settings-panel > button").count()) === 3);
      check("anonymous: no divider group", (await page.locator("#toolbar-settings-panel .border-l").count()) === 0);
      await page.locator("#toolbar-settings-panel").screenshot({ path: dir("panel") });
    }

    if (sc.kind === "pending") {
      const logoutBtn = page.getByRole("button", { name: new RegExp(L.logout) });
      await logoutBtn.click();
      await page.getByRole("button", { name: new RegExp(L.pending) }).waitFor({ state: "visible", timeout: 5000 });
      const pendingSnap = await page.evaluate(SNAPSHOT, L);
      check("pending label shown and button disabled", pendingSnap.logoutDisabled === true && pendingSnap.logoutText.includes(L.pending.replace("…", "")), pendingSnap.logoutText);
      check("pending: aria-busy true", pendingSnap.logoutAriaBusy === "true");
      const sizes = [pendingSnap.units, pendingSnap.lang, pendingSnap.theme, pendingSnap.logout].map((r) => r.h);
      check("pending: all row controls still >= 44px", sizes.every((h) => h >= 44), sizes.map((h) => h.toFixed(1)).join(","));
      check("pending: no horizontal overflow", pendingSnap.overflowPx <= 0, `overflowPx=${pendingSnap.overflowPx}`);
      observe("pending group width vs idle", `${pendingSnap.logoutGroupWidth.toFixed(0)}px pending`);
      await page.screenshot({ path: dir("pending-viewport") });
      await page.locator("#toolbar-settings-panel").screenshot({ path: dir("pending-panel") });
      release();
      await page.locator("#toolbar-settings-panel").waitFor({ state: "detached", timeout: 10000 });
      check("pending: resolution closes the panel and returns focus to Settings", await toggle.evaluate((el) => document.activeElement === el));
    }

    if (sc.kind === "keyboard") {
      await toggle.focus();
      let presses = 0;
      let reached = false;
      for (; presses < 60; presses++) {
        await page.keyboard.press("Tab");
        const isLogout = await page.evaluate((label) => (document.activeElement?.textContent || "").includes(label), L.logout);
        if (isLogout) {
          reached = true;
          break;
        }
      }
      check("keyboard: Tab reaches logout within bounded presses", reached, `presses=${presses + 1}`);
      const ring = await page.evaluate(() => {
        const cs = getComputedStyle(document.activeElement);
        return { boxShadow: cs.boxShadow, outline: cs.outlineStyle + " " + cs.outlineWidth };
      });
      check("keyboard: focused logout shows a visible ring", ring.boxShadow !== "none" || (!ring.outline.startsWith("none")), JSON.stringify(ring));
      await page.screenshot({ path: dir("focus-viewport") });
      await page.locator("#toolbar-settings-panel").screenshot({ path: dir("focus-panel") });
      await page.keyboard.press("Enter");
      await page.locator("#toolbar-settings-panel").waitFor({ state: "detached", timeout: 10000 });
      check("keyboard: Enter activates logout (one request)", counts.logout === 1, `count=${counts.logout}`);
      check("keyboard: success returns focus to Settings toggle", await toggle.evaluate((el) => document.activeElement === el));
    }

    if (sc.kind === "failure") {
      setLogoutMode("fail");
      await page.getByRole("button", { name: new RegExp(L.logout) }).click();
      await page.getByText(L.failure).waitFor({ state: "visible", timeout: 10000 });
      check("failure: translated feedback shown", true, L.failure);
      const after = await page.evaluate(SNAPSHOT, L);
      check("failure: logout re-enabled for retry", after.logoutDisabled === false);
      check("failure: panel stays open", (await page.locator("#toolbar-settings-panel").count()) === 1);
      await page.screenshot({ path: dir("failure-viewport") });
      await page.locator("#toolbar-settings-panel").screenshot({ path: dir("failure-panel") });
    }
  } catch (e) {
    check("scenario completed without error", false, e.message.split("\n")[0]);
    await page.screenshot({ path: dir("error") }).catch(() => {});
  } finally {
    await context.close();
  }
}

async function run() {
  const browser = await chromium.launch();
  const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
  for (const sc of SCENARIOS) {
    if (only && !only.test(sc.id)) continue;
    await runScenario(browser, sc);
  }
  await browser.close();
  const scenarioIds = [...new Set(results.map((r) => r.scenario))];
  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
  const failedScenarios = scenarioIds.filter((id) => results.some((r) => r.scenario === id && r.pass === false));
  console.log(`\nScenarios run: ${scenarioIds.length} (matrix defines ${SCENARIOS.length}); scenarios with a failed assertion: ${failedScenarios.length}`);
  console.log(`Assertions passed: ${assertPass}/${assertTotal}`);
  if (assertPass !== assertTotal) process.exitCode = 1;
}

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
