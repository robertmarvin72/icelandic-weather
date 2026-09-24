// scripts/weatherVoiceShareExportLib.mjs
//
// Ticket 417 (#417) Round 2 correction — small, isolated, testable helpers
// extracted out of scripts/exportWeatherVoiceShare.mjs. Importing this
// module must NEVER launch Chromium or run the export main routine — it
// has no Playwright import and no top-level side effects, specifically so
// it can be safely imported by real Vitest tests (see
// weatherVoiceShareExportLib.test.js).
//
// Round 1 defect (Ripley Round 1 REVISE, P1): the original
// loadExistingManifest() built a file:// URL via `new URL(path, "file://")`
// — on Windows this silently produces an INVALID URL (a Windows drive
// letter like "C:" is parsed as its own URL scheme, discarding the
// "file://" base entirely), so the dynamic import always threw, was
// swallowed by a bare try/catch, and every run behaved as if no manifest
// existed at all — the released-content drift guard was completely inert
// on Windows. Fixed here with Node's own `pathToFileURL`, the documented
// correct way to build a file:// URL from a filesystem path on every
// platform including Windows.

import { pathToFileURL } from "node:url";
import { existsSync, readFileSync } from "node:fs";

/**
 * loadExistingManifest(manifestPath) -> Promise<
 *   | { status: "absent" }
 *   | { status: "invalid", error: string }
 *   | { status: "ok", manifest: object, version: string | undefined }
 * >
 *
 * Distinguishes a genuinely absent first-export manifest (status:"absent",
 * safe to treat as a fresh catalogue) from an EXISTING file that fails to
 * load or has an invalid shape (status:"invalid" — the caller MUST abort
 * before any writes; this is never silently treated as "no manifest").
 */
export async function loadExistingManifest(manifestPath) {
  if (!existsSync(manifestPath)) return { status: "absent" };

  let mod;
  try {
    // Cache-busting query so a rerun within the same long-lived process
    // (not the normal CLI invocation, but harmless to guard) re-reads the
    // file from disk instead of an ESM module-cache hit.
    const url = `${pathToFileURL(manifestPath).href}?t=${Date.now()}`;
    mod = await import(url);
  } catch (err) {
    return { status: "invalid", error: `failed to import existing manifest: ${err?.message || err}` };
  }

  const manifest = mod?.WEATHER_VOICE_SHARE_MANIFEST;
  const invalidShapeReason = describeManifestShapeProblem(manifest);
  if (invalidShapeReason) {
    return { status: "invalid", error: `existing manifest has an invalid schema: ${invalidShapeReason}` };
  }

  return { status: "ok", manifest, version: mod?.WEATHER_VOICE_SHARE_MANIFEST_VERSION };
}

/**
 * describeManifestShapeProblem(manifest) -> string | null
 * Pure. Returns a human-readable reason the manifest is malformed, or null
 * when it looks structurally usable. Deliberately permissive about WHICH
 * entries exist (that is the catalogue's job to compare) — only checks the
 * container and per-entry shape are sane enough to trust.
 */
export function describeManifestShapeProblem(manifest) {
  if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
    return `WEATHER_VOICE_SHARE_MANIFEST export is missing or not a plain object`;
  }
  for (const [key, entry] of Object.entries(manifest)) {
    if (!entry || typeof entry !== "object") return `entry "${key}" is not an object`;
    for (const field of ["voiceId", "language", "mood", "text", "pageUrl", "imageUrl"]) {
      if (typeof entry[field] !== "string" || entry[field].length === 0) {
        return `entry "${key}" is missing a non-empty string field "${field}"`;
      }
    }
  }
  return null;
}

/**
 * detectExistingReleasedFilesWithoutManifest(paths) -> boolean
 * Pure (aside from the fs reads). Round 1 defect (P1, second half): a
 * missing/invalid manifest must not be silently treated as "fresh
 * catalogue" when real released HTML/PNG files already exist on disk —
 * that combination is an inconsistent, unrecoverable-without-review state
 * (the manifest is the only record of what those files' text/mood
 * actually were) and must stop the run with a clear recovery message.
 *
 * @param {string[]} paths - absolute paths to check for existence
 */
export function detectExistingReleasedFilesWithoutManifest(paths) {
  return paths.some((p) => existsSync(p));
}

/**
 * classifyEntryAction({ destinationPath, newContent }) -> "create" | "reuse" | "mismatch"
 *
 * Compares newly-rendered content (a Buffer or string) against whatever
 * actually exists on disk at destinationPath BYTE-FOR-BYTE — not merely
 * the manifest's recorded text/mood fields. This is what protects against
 * a changed TEMPLATE or mascot ARTWORK silently regenerating a released
 * file even when the underlying comment text/mood are unchanged (Round 1
 * only compared manifest text/mood, which a template/artwork change would
 * not have touched at all).
 *
 * - "create": no file exists yet at destinationPath — genuinely new.
 * - "reuse": a file exists and its bytes are already identical to the
 *   newly-rendered content — nothing needs to change; the caller must NOT
 *   rewrite it (never touch a released file on an ordinary regeneration).
 * - "mismatch": a file exists and its bytes differ from the newly-rendered
 *   content — a hard error requiring a version bump, never a silent
 *   overwrite.
 *
 * @param {{ destinationPath: string, newContent: Buffer | string }} args
 */
export function classifyEntryAction({ destinationPath, newContent }) {
  if (!existsSync(destinationPath)) return "create";
  const existing = readFileSync(destinationPath);
  const next = Buffer.isBuffer(newContent) ? newContent : Buffer.from(newContent, "utf8");
  return existing.equals(next) ? "reuse" : "mismatch";
}

/**
 * isValidPngSignature(buffer) -> boolean
 * Pure. The standard 8-byte PNG file signature — used by both the export
 * pipeline's own sanity check and by tests, so a corrupt/truncated/
 * non-image write is caught immediately rather than trusting HTML
 * width/height metadata alone.
 */
export function isValidPngSignature(buffer) {
  const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.isBuffer(buffer) && buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE);
}

/**
 * readPngDimensions(buffer) -> { width: number, height: number } | null
 * Pure. Reads the width/height directly from the PNG's own IHDR chunk
 * (bytes 16-23 of a valid PNG) — ground truth independent of whatever an
 * HTML page's own og:image:width/height metadata claims.
 */
export function readPngDimensions(buffer) {
  if (!isValidPngSignature(buffer) || buffer.length < 24) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}
