#!/usr/bin/env node
// scripts/exportWeatherVoiceShare.mjs
//
// Ticket 417 (#417) — small, offline asset-export script. Generates the
// finite, checked-in static-share catalogue (54 combinations today: every
// (language, comment) pair in getWeatherVoiceLibrary()) as real files
// under public/share/tjaldur/<version>/<language>/<voiceId>.{html,png},
// plus the generated runtime manifest module at
// src/lib/weatherVoiceShareManifest.generated.js.
//
// This is NOT general rendering infrastructure — it is a finite, checked
// catalogue export, run manually/offline by a developer, never at request
// time or in the production build. `npm run build` only copies the files
// this script already produced; it never invokes Chromium, a canvas, or a
// network call.
//
// Regeneration: run `npm run share:export` (requires a local Vite dev
// server already running — this script drives a real browser page against
// it via Playwright, the same pattern already used by this repo's
// outputs/*/verify-*.cjs evidence scripts, so the OG image renderer's real
// canvas/font/asset-loading code path is exercised exactly as production
// would run it, not reimplemented in Node). Default base URL is
// http://localhost:5173; override with WV_SHARE_EXPORT_BASE_URL.
//
// ── Round 2 correction (#417) — version-aware, fail-closed, two-phase ──
//
// 1. Fail-closed manifest loading (scripts/weatherVoiceShareExportLib.mjs):
//    a genuinely ABSENT manifest (first export ever) is fine; an EXISTING
//    manifest that fails to load or has an invalid schema is a hard abort
//    before any writes — never silently treated as "no manifest." Existing
//    released HTML/PNG files with no usable manifest is also a hard abort
//    (an unrecoverable-without-review inconsistent state).
//
// 2. Version-aware, byte-level protection: every entry's actual rendered
//    HTML/PNG bytes are compared against whatever already exists at that
//    entry's OWN versioned destination path — never merely the manifest's
//    recorded text/mood fields, so a changed TEMPLATE or mascot ARTWORK is
//    caught too, not only a changed quote. A version bump
//    (WEATHER_VOICE_SHARE_VERSION in weatherVoiceShareUrl.js) writes to a
//    brand-new directory, so prior-version files are never touched, never
//    compared against, and never referenced by the new active manifest —
//    they remain on disk, permanently, exactly as released.
//
// 3. Two-phase commit: ALL entries are rendered and classified
//    (create/reuse/mismatch) FIRST, with zero writes. Only if there is not
//    a single mismatch does the script proceed to phase 2 and actually
//    write anything — a "reuse" entry's existing file is never rewritten,
//    and the manifest itself is written last, after every file write
//    succeeds. A failure during phase 1 leaves the entire released
//    catalogue, and the active manifest, completely untouched.
//
// Files that exist on disk but are no longer part of the active catalogue
// are left exactly as they are — never flagged for deletion, never
// touched. Immutable released artifacts are preserved even if a future
// catalogue no longer references them.

import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadExistingManifest, detectExistingReleasedFilesWithoutManifest, classifyEntryAction, isValidPngSignature, readPngDimensions } from "./weatherVoiceShareExportLib.mjs";

// NOTE: this project's modules use extensionless imports (see AGENTS.md/
// CLAUDE.md conventions), which only resolve under Vite/browser module
// resolution, not plain Node's stricter ESM resolver — so OG_IMAGE_WIDTH/
// OG_IMAGE_HEIGHT are read via the SAME browser page.evaluate() mechanism
// as every other app module below, not a direct Node-side import.

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const BASE_URL = process.env.WV_SHARE_EXPORT_BASE_URL || "http://localhost:5173";
const MANIFEST_PATH = join(REPO_ROOT, "src/lib/weatherVoiceShareManifest.generated.js");

// Vite's dev server can trigger a full-page reload over its HMR WebSocket
// at unpredictable points while this script is running (observed via a
// frame-navigation listener: Vite's dependency optimizer appears to
// re-scan and reload more than once as previously-untouched modules are
// imported for the first time in a given dev-server process) — each such
// reload destroys any in-flight page.evaluate's execution context. Rather
// than guess a fixed delay, every evaluate call in this script goes
// through this wrapper: on a context-destroyed error, it waits for the
// page to finish (re)loading and retries the SAME call, up to a few times,
// before giving up for real.
async function evaluateResilient(page, fn, arg, { retries = 3 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await page.evaluate(fn, arg);
    } catch (err) {
      const destroyed = /execution context was destroyed/i.test(err?.message || "");
      if (!destroyed || attempt === retries) throw err;
      await page.waitForLoadState("networkidle").catch(() => {});
    }
  }
  throw new Error("unreachable");
}

async function main() {
  console.log(`[exportWeatherVoiceShare] Base URL: ${BASE_URL}`);
  console.log("[exportWeatherVoiceShare] Requires a running local dev server (npm run dev) at that URL.");

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 20000 });
    try {
      await page.waitForNavigation({ timeout: 4000 });
      await page.waitForLoadState("networkidle");
      console.log("[exportWeatherVoiceShare] Absorbed one Vite-triggered reload before starting export.");
    } catch {
      // No reload occurred within the window — proceed normally.
    }
  } catch (err) {
    await browser.close();
    console.error(`[exportWeatherVoiceShare] Could not reach ${BASE_URL} — start "npm run dev" first, or set WV_SHARE_EXPORT_BASE_URL.`);
    throw err;
  }

  const { catalogueEntries, version, ogWidth, ogHeight } = await evaluateResilient(page, async () => {
    const catalogueMod = await import("/src/lib/weatherVoiceShareCatalogue.js");
    const urlMod = await import("/src/lib/weatherVoiceShareUrl.js");
    const ogImageMod = await import("/src/lib/weatherVoiceOgImage.js");
    return {
      catalogueEntries: catalogueMod.buildWeatherVoiceShareCatalogue(),
      version: urlMod.WEATHER_VOICE_SHARE_VERSION,
      ogWidth: ogImageMod.OG_IMAGE_WIDTH,
      ogHeight: ogImageMod.OG_IMAGE_HEIGHT,
    };
  });

  console.log(`[exportWeatherVoiceShare] Catalogue: ${catalogueEntries.length} entries, version ${version}.`);

  // ── Fail-closed manifest loading ──────────────────────────────────────
  const manifestResult = await loadExistingManifest(MANIFEST_PATH);
  if (manifestResult.status === "invalid") {
    await browser.close();
    throw new Error(
      `[exportWeatherVoiceShare] ABORTING before any writes: ${manifestResult.error}\n` +
        `The existing manifest at ${MANIFEST_PATH} exists but could not be trusted. ` +
        `Recovery: inspect and fix or restore that file from version control before rerunning — ` +
        `this script will never treat an existing-but-broken manifest as "no manifest."`
    );
  }
  if (manifestResult.status === "absent") {
    const anyReleasedFileExists = detectExistingReleasedFilesWithoutManifest(
      catalogueEntries.flatMap((e) => [join(REPO_ROOT, e.htmlOutputPath), join(REPO_ROOT, e.imageOutputPath)])
    );
    if (anyReleasedFileExists) {
      await browser.close();
      throw new Error(
        `[exportWeatherVoiceShare] ABORTING before any writes: no manifest was found at ${MANIFEST_PATH}, ` +
          `but real exported HTML/PNG files already exist under public/share/tjaldur/${version}/. ` +
          `This is an inconsistent state (the manifest is the only record of what those files' text/mood ` +
          `actually were) — restore the manifest from version control, or confirm this is genuinely a fresh ` +
          `catalogue and manually clear the existing output directory first, before rerunning.`
      );
    }
    console.log("[exportWeatherVoiceShare] No existing manifest — this is a genuinely fresh export.");
  } else {
    console.log(`[exportWeatherVoiceShare] Loaded existing manifest (recorded version: ${manifestResult.version ?? "unknown"}).`);
  }

  // ── Phase 1: render + classify every entry, write nothing yet ─────────
  const staged = [];
  const mismatches = [];
  let rendered = 0;

  for (const entry of catalogueEntries) {
    const dataUrl = await evaluateResilient(
      page,
      async ({ entry }) => {
        const mod = await import("/src/lib/weatherVoiceOgImage.js");
        const brandingAssetPath = entry.language === "is" ? "/eltumvedrid-light-is.png" : "/chasetheweather-light-en.png";
        const blob = await mod.renderWeatherVoiceOgImage({
          text: entry.text,
          language: entry.language,
          moodAssetPath: entry.moodAssetPath,
          brandingAssetPath,
        });
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      },
      { entry }
    );

    const htmlSrc = await evaluateResilient(
      page,
      async ({ entry }) => {
        const mod = await import("/src/lib/weatherVoiceShareHtml.js");
        return mod.buildWeatherVoiceShareHtml({
          language: entry.language,
          voiceId: entry.voiceId,
          text: entry.text,
          pageUrl: entry.pageUrl,
          imageUrl: entry.imageUrl,
        });
      },
      { entry }
    );

    const pngBuffer = Buffer.from(dataUrl.split(",")[1], "base64");

    if (!isValidPngSignature(pngBuffer)) {
      mismatches.push(`${entry.language}/${entry.voiceId}: rendered output is not a valid PNG (bad signature)`);
      continue;
    }
    const dims = readPngDimensions(pngBuffer);
    if (!dims || dims.width !== ogWidth || dims.height !== ogHeight) {
      mismatches.push(
        `${entry.language}/${entry.voiceId}: rendered PNG has wrong dimensions ${dims ? `${dims.width}x${dims.height}` : "(unreadable)"}, expected ${ogWidth}x${ogHeight}`
      );
      continue;
    }

    const htmlOutPath = join(REPO_ROOT, entry.htmlOutputPath);
    const imageOutPath = join(REPO_ROOT, entry.imageOutputPath);
    const htmlAction = classifyEntryAction({ destinationPath: htmlOutPath, newContent: htmlSrc });
    const imageAction = classifyEntryAction({ destinationPath: imageOutPath, newContent: pngBuffer });

    if (htmlAction === "mismatch") {
      mismatches.push(
        `${entry.language}/${entry.voiceId}: released HTML at ${entry.htmlOutputPath} would change on an ordinary regeneration (text/mood/template drift). Bump WEATHER_VOICE_SHARE_VERSION for a new release instead of overwriting ${version}.`
      );
    }
    if (imageAction === "mismatch") {
      mismatches.push(
        `${entry.language}/${entry.voiceId}: released image at ${entry.imageOutputPath} would change on an ordinary regeneration (artwork/text/mood drift). Bump WEATHER_VOICE_SHARE_VERSION for a new release instead of overwriting ${version}.`
      );
    }

    staged.push({ entry, htmlOutPath, imageOutPath, htmlSrc, pngBuffer, htmlAction, imageAction });

    rendered += 1;
    if (rendered % 10 === 0 || rendered === catalogueEntries.length) {
      console.log(`[exportWeatherVoiceShare] ${rendered}/${catalogueEntries.length} rendered + validated…`);
    }
  }

  await browser.close();

  if (mismatches.length > 0) {
    throw new Error(`[exportWeatherVoiceShare] ABORTING before any writes — released content would change:\n${mismatches.join("\n")}`);
  }

  // ── Phase 2: every entry validated cleanly — now actually write ───────
  let created = 0;
  let reused = 0;
  const manifest = {};

  for (const { entry, htmlOutPath, imageOutPath, htmlSrc, pngBuffer, htmlAction, imageAction } of staged) {
    if (htmlAction === "create" || imageAction === "create") {
      mkdirSync(dirname(htmlOutPath), { recursive: true });
      if (htmlAction === "create") writeFileSync(htmlOutPath, htmlSrc, "utf8");
      if (imageAction === "create") writeFileSync(imageOutPath, pngBuffer);
      created += 1;
    } else {
      reused += 1; // both "reuse" — file already correct on disk, never rewritten
    }

    manifest[`${entry.language}|${entry.voiceId}`] = {
      voiceId: entry.voiceId,
      language: entry.language,
      mood: entry.mood,
      text: entry.text,
      pageUrl: entry.pageUrl,
      imageUrl: entry.imageUrl,
    };
  }

  const manifestSrc = `// src/lib/weatherVoiceShareManifest.generated.js
// AUTO-GENERATED by scripts/exportWeatherVoiceShare.mjs — do not hand-edit.
// Regenerate with: npm run share:export (requires "npm run dev" running).
// Ticket 417 (#417) — every entry pairs a released, immutable share URL
// with the exact text/mood it was generated from, so the runtime Facebook
// resolver (weatherVoiceFacebookShare.js) can verify a live snapshot still
// matches before offering to share it. Reflects only the CURRENTLY ACTIVE
// version (${version}) — a prior version's physical files remain on disk,
// permanently, but are intentionally absent from this active manifest.

export const WEATHER_VOICE_SHARE_MANIFEST_VERSION = ${JSON.stringify(version)};
export const WEATHER_VOICE_SHARE_MANIFEST_GENERATED_AT = ${JSON.stringify(new Date().toISOString())};

export const WEATHER_VOICE_SHARE_MANIFEST = ${JSON.stringify(manifest, null, 2)};
`;
  writeFileSync(MANIFEST_PATH, manifestSrc, "utf8");

  console.log(`[exportWeatherVoiceShare] Wrote manifest: ${MANIFEST_PATH}`);
  console.log(`[exportWeatherVoiceShare] Done. ${created} pair(s) created, ${reused} pair(s) reused unchanged, ${staged.length} total.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
