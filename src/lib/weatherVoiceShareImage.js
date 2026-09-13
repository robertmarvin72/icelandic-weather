// src/lib/weatherVoiceShareImage.js
//
// Ticket 410 (#410) — standalone 1080x1080 PNG composition for the
// Weather Voice share image. Browser canvas + existing local PNG/logo
// assets only — no screenshot-of-UI, no new dependency, no backend/AI
// image generation. Text layout (wrapping/floor-size decision) is split
// into small, PURE, injectable-measurer functions so it is unit-testable
// without a real canvas (jsdom has no working 2D canvas context); the
// actual asset loading/drawing/export is exercised by real-browser
// evidence instead (outputs/ticket-410-weather-voice-share-evidence/).
//
// Weather context rendered here is explicitly DAILY (the same normalized
// `tmax`/`code` Weather Voice already reads), never presented as a live
// "now" reading, and is explicitly LABELED as daily forecast / daily high
// via i18n — see buildDailyContextLabel below.
//
// Revision 2 (#410, Ripley Round 1 REVISE) — two geometry defects fixed:
// (1) fitCommentText previously accepted an unbroken token wider than
// maxWidth as if it "fit" merely because it produced <= maxLines lines —
// every wrapped line's own measured width is now verified too
// (linesFitWidth). (2) the context line was drawn unconditionally on one
// unmeasured line and could overlap the branding block at 5 accepted
// comment lines — fitShareLayout now reserves real vertical space for
// comment+context ABOVE a fixed branding region and wraps/shrinks the
// context text (site name included) within that reserved budget,
// shrinking the comment first before ever failing. The date/label also
// no longer depends on Intl weekday locale data (a real IS-locale gap
// that produced an English "Saturday" in an Icelandic export) — dates are
// now formatted deterministically, with no Intl dependency, and always
// include the year.

import { resolveWeatherPresentation } from "./weatherPresentation";

export const SHARE_IMAGE_SIZE = 1080;

// A comment must remain fully readable — reducing font size to fit is
// allowed only down to this floor; below it, rendering must fail clearly
// rather than crop or ellipsize the actual comment (approved prompt §2/§3).
export const COMMENT_FONT_FLOOR_PX = 34;
export const COMMENT_FONT_START_PX = 64;
export const COMMENT_FONT_STEP_PX = 2;
export const COMMENT_MAX_LINES = 5;
export const COMMENT_LINE_HEIGHT_RATIO = 1.25;

// Context (site name + daily forecast/date/temperature) — smaller, but
// still measured/wrapped/shrunk like the comment, never drawn as a single
// unmeasured line (Ripley Round 1 finding #2).
export const CONTEXT_FONT_FLOOR_PX = 20;
export const CONTEXT_FONT_START_PX = 30;
export const CONTEXT_FONT_STEP_PX = 2;
export const CONTEXT_MAX_LINES = 2;
export const CONTEXT_LINE_HEIGHT_RATIO = 1.3;

export const COMMENT_CONTEXT_GAP_PX = 24;

/**
 * wrapTextToLines({ text, measureWidth, maxWidth }) -> string[]
 *
 * Pure, greedy word-wrap. `measureWidth(candidateLine) -> number` is
 * injected so this is testable without a real canvas context. A single
 * word wider than `maxWidth` on its own is still placed on its own line
 * (never split mid-word) — callers must separately verify the returned
 * lines actually fit (see linesFitWidth) rather than assuming a short
 * line count implies a fitting width.
 */
export function wrapTextToLines({ text, measureWidth, maxWidth }) {
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || measureWidth(candidate) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// A tiny floating-point epsilon avoids rejecting a line that measures
// 0.001px over maxWidth due to rounding — never large enough to mask a
// genuinely too-wide line.
const WIDTH_EPSILON_PX = 0.5;

/**
 * linesFitWidth(lines, measureWidth, maxWidth) -> boolean
 *
 * Ripley Round 1 finding #2: `wrapTextToLines` alone can return a line
 * wider than `maxWidth` when a single unbreakable token (a long real
 * campsite name, or any run of text with no spaces) has nowhere to break.
 * A short line COUNT is not evidence every line actually fits — this
 * checks each line's own measured width explicitly.
 */
export function linesFitWidth(lines, measureWidth, maxWidth) {
  return lines.every((line) => measureWidth(line) <= maxWidth + WIDTH_EPSILON_PX);
}

function buildSizeList(startSize, floorSize, step) {
  const sizes = [];
  for (let size = startSize; size > floorSize; size -= step) sizes.push(size);
  sizes.push(floorSize); // always explicitly try the exact floor, regardless of step alignment
  return sizes;
}

/**
 * fitCommentText({ text, measureWidthAtSize, maxWidth, ... }) -> { size, lines } | null
 *
 * Pure. Tries font sizes from `startSize` down to `floorSize` (inclusive),
 * returning the FIRST (largest) size whose wrapped lines are BOTH within
 * `maxLines` AND each individually within `maxWidth` (see linesFitWidth —
 * a line count alone is not sufficient, per Ripley Round 1 finding #2).
 * Returns `null` when even the floor size doesn't fit — the caller must
 * treat that as a hard failure ("fail clearly rather than crop/ellipsis
 * the actual comment"), never silently truncating text or shrinking
 * further.
 *
 * @param {{
 *   text: string,
 *   measureWidthAtSize: (candidateLine: string, fontSizePx: number) => number,
 *   maxWidth: number,
 *   maxLines?: number,
 *   startSize?: number,
 *   floorSize?: number,
 *   step?: number,
 * }} args
 * @returns {{ size: number, lines: string[] } | null}
 */
export function fitCommentText({
  text,
  measureWidthAtSize,
  maxWidth,
  maxLines = COMMENT_MAX_LINES,
  startSize = COMMENT_FONT_START_PX,
  floorSize = COMMENT_FONT_FLOOR_PX,
  step = COMMENT_FONT_STEP_PX,
}) {
  for (const size of buildSizeList(startSize, floorSize, step)) {
    const measure = (line) => measureWidthAtSize(line, size);
    const lines = wrapTextToLines({ text, measureWidth: measure, maxWidth });
    if (lines.length > maxLines) continue;
    if (!linesFitWidth(lines, measure, maxWidth)) continue;
    return { size, lines };
  }
  return null;
}

/**
 * fitContextText({ text, measureWidthAtSize, maxWidth, maxHeight, ... })
 * -> { size, lines, height } | null
 *
 * Same width/line-count discipline as fitCommentText, plus an optional
 * `maxHeight` budget (the vertical space actually left after the comment
 * — see fitShareLayout) — a context that fits by width/line-count alone
 * but would still overlap the branding block below it does not count as
 * fitting.
 */
export function fitContextText({
  text,
  measureWidthAtSize,
  maxWidth,
  maxHeight = Infinity,
  maxLines = CONTEXT_MAX_LINES,
  startSize = CONTEXT_FONT_START_PX,
  floorSize = CONTEXT_FONT_FLOOR_PX,
  step = CONTEXT_FONT_STEP_PX,
  lineHeightRatio = CONTEXT_LINE_HEIGHT_RATIO,
}) {
  for (const size of buildSizeList(startSize, floorSize, step)) {
    const measure = (line) => measureWidthAtSize(line, size);
    const lines = wrapTextToLines({ text, measureWidth: measure, maxWidth });
    if (lines.length > maxLines) continue;
    if (!linesFitWidth(lines, measure, maxWidth)) continue;
    const height = lines.length * size * lineHeightRatio;
    if (height > maxHeight) continue;
    return { size, lines, height };
  }
  return null;
}

/**
 * fitShareLayout({ commentText, contextText, measureWidthAtSize, maxWidth, availableHeight })
 * -> { comment: {size,lines,height}, context: {size,lines,height} } | null
 *
 * Pure. Fits the comment FIRST (largest size that fits width/line-count),
 * then fits the context within whatever vertical space remains under
 * `availableHeight` after the comment's own height. If the context
 * cannot fit in the space left by the current comment size, the comment
 * is shrunk further (freeing more room) and the whole search retries —
 * this is what lets a long real campsite name (long context text) still
 * render correctly by giving it more room, rather than silently
 * overlapping the branding block or cropping either text. Returns `null`
 * only when no comment size (down to its floor) leaves enough room for
 * the context to fit even at ITS floor — the caller must fail clearly in
 * that case, never overlap branding or crop text.
 */
export function fitShareLayout({ commentText, contextText, measureWidthAtSize, maxWidth, availableHeight }) {
  for (const commentSize of buildSizeList(COMMENT_FONT_START_PX, COMMENT_FONT_FLOOR_PX, COMMENT_FONT_STEP_PX)) {
    const measure = (line) => measureWidthAtSize(line, commentSize);
    const commentLines = wrapTextToLines({ text: commentText, measureWidth: measure, maxWidth });
    if (commentLines.length > COMMENT_MAX_LINES) continue;
    if (!linesFitWidth(commentLines, measure, maxWidth)) continue;

    const commentHeight = commentLines.length * commentSize * COMMENT_LINE_HEIGHT_RATIO;
    const remainingHeight = availableHeight - commentHeight - COMMENT_CONTEXT_GAP_PX;
    if (remainingHeight <= 0) continue;

    const contextFit = fitContextText({ text: contextText, measureWidthAtSize, maxWidth, maxHeight: remainingHeight });
    if (!contextFit) continue;

    return {
      comment: { size: commentSize, lines: commentLines, height: commentHeight },
      context: contextFit,
    };
  }
  return null;
}

/**
 * languageAppropriateQuote(text, lang) -> string
 * Icelandic uses „…"; English uses “…”. Never the raw text unquoted.
 */
export function languageAppropriateQuote(text, lang) {
  return lang === "is" ? `„${text}“` : `“${text}”`;
}

const EN_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * formatShareDate(dateString, lang) -> string
 *
 * Ripley Round 1 finding #1: the previous `Intl.DateTimeFormat(..., {
 * weekday: "long" })` call produced an English "Saturday" inside an
 * Icelandic export — a real is-IS weekday-locale-data gap, not a display
 * bug in this module's own logic. Deterministic, dependency-free
 * formatting sidesteps that gap entirely rather than working around one
 * engine's locale data: IS uses a fully numeric dd.mm.yyyy date (a
 * standard Icelandic convention, explicitly acceptable per the review's
 * own "a localized numeric full date is acceptable when weekday locale
 * support is absent"); EN uses "D Mon YYYY". Both ALWAYS include the
 * year, since an exported image is a persistent, dated artifact, not a
 * same-day-only reference. Falls back to the raw ISO string on any
 * malformed input rather than throwing.
 */
export function formatShareDate(dateString, lang) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateString ?? ""));
  if (!match) return String(dateString ?? "");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) {
    return String(dateString);
  }
  if (lang === "is") {
    return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`;
  }
  return `${day} ${EN_MONTHS_SHORT[month - 1]} ${year}`;
}

/**
 * buildDailyContextLabel({ snapshot, t }) -> string
 *
 * Explicitly labels this as a DAILY forecast and the temperature as the
 * day's HIGH — via real i18n keys (`weatherVoiceShareDailyForecastLabel`/
 * `weatherVoiceShareHighTempLabel`), never an unqualified "now: 16°C"
 * reading and never a bare date with no forecast-scope label at all
 * (Ripley Round 1 finding #1). Reuses the same canonical WMO-code-family
 * text keys the rest of the app already shows for daily weather
 * (weatherPresentation.js), not a new copy string. Site name (when
 * present) is prefixed — the same public campsite name already shown
 * elsewhere, never coordinates or a personal location label.
 */
export function buildDailyContextLabel({ snapshot, t }) {
  const { date, tmax, code, language, siteName } = snapshot;
  const dateLabel = formatShareDate(date, language);
  const presentation = resolveWeatherPresentation(code, { isDay: true });
  const weatherLabel = typeof t === "function" ? t(presentation.textKey) : presentation.textKey;
  const dailyForecastLabel = typeof t === "function" ? t("weatherVoiceShareDailyForecastLabel") : "Daily forecast";
  const highTempLabel = typeof t === "function" ? t("weatherVoiceShareHighTempLabel") : "High";
  const tempLabel = `${highTempLabel} ${Math.round(tmax)}°C`;
  const forecastPart = `${dailyForecastLabel} ${dateLabel} · ${weatherLabel} · ${tempLabel}`;
  return siteName ? `${siteName} · ${forecastPart}` : forecastPart;
}

// ── Real canvas rendering (not unit-tested directly — see file header) ──

function loadImage(src, { signal } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const img = new Image();
    function cleanup() {
      img.onload = null;
      img.onerror = null;
      signal?.removeEventListener("abort", onAbort);
    }
    function onAbort() {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    }
    img.onload = async () => {
      try {
        if (typeof img.decode === "function") await img.decode();
      } catch {
        // Some environments' decode() rejects even for a usable image;
        // onload already fired, so fall through and use it.
      }
      cleanup();
      resolve(img);
    };
    img.onerror = () => {
      cleanup();
      reject(new Error(`Failed to load image: ${src}`));
    };
    signal?.addEventListener("abort", onAbort);
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

function drawContainedImage(ctx, img, box) {
  const scale = Math.min(box.w / img.naturalWidth, box.h / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const x = box.x + (box.w - w) / 2;
  const y = box.y + (box.h - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}

/**
 * renderWeatherVoiceShareImage(snapshot, { t, moodAssetPath, brandingAssetPath, signal })
 * -> Promise<Blob>
 *
 * Renders the standalone 1080x1080 share PNG for an already-built,
 * structurally-valid snapshot (see weatherVoiceShareSnapshot.js — every
 * displayed Tjaldur is shareable as of Ticket 410's Round 2 correction;
 * this renderer itself never re-applies any condition-based eligibility).
 * Rejects (never resolves with a blank/partial image) on: asset load/
 * decode failure, text/context that doesn't fit even at the readable
 * floor sizes and reserved layout, an aborted `signal`, or a
 * `canvas.toBlob` failure (including a tainted canvas).
 *
 * @param {{voiceId:string,text:string,language:string,mood:string,condition:string,severity:number,siteName:string|null,date:string,tmax:number,code:number}} snapshot
 * @param {{ t: Function, moodAssetPath: string, brandingAssetPath: string, signal?: AbortSignal }} args
 * @returns {Promise<Blob>}
 */
export async function renderWeatherVoiceShareImage(snapshot, { t, moodAssetPath, brandingAssetPath, signal } = {}) {
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("Canvas rendering is unavailable in this environment.");
  }

  const [moodImg, brandingImg] = await Promise.all([loadImage(moodAssetPath, { signal }), loadImage(brandingAssetPath, { signal })]);

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // proceed with fallback fonts rather than failing the whole export
    }
  }
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const size = SHARE_IMAGE_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable.");

  // Warm light surface with a restrained orange accent band, matching the
  // card's own amber/orange palette (WeatherVoiceCard.jsx) rather than
  // inventing a new brand color.
  ctx.fillStyle = "#FFFBEB";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#FDBA74";
  ctx.fillRect(0, 0, size, 18);

  // Mascot: prominent, centered horizontally, preserving aspect ratio.
  const mascotBox = { x: size * 0.28, y: size * 0.08, w: size * 0.44, h: size * 0.34 };
  drawContainedImage(ctx, moodImg, mascotBox);

  const fontFamily = `"Segoe UI", system-ui, -apple-system, sans-serif`;
  const quoted = languageAppropriateQuote(snapshot.text, snapshot.language);
  const contextLabel = buildDailyContextLabel({ snapshot, t });
  const textMaxWidth = size * 0.82;

  // Reserved vertical budget for comment+context, strictly ABOVE a fixed
  // branding region — this is what makes the "advertised line count"
  // genuinely never overlap branding (Ripley Round 1 finding #2), rather
  // than only capping line count independent of actual pixel height.
  const contentTop = size * 0.5;
  const brandingTop = size - 130;
  const contentBottomLimit = brandingTop - 30;
  const availableHeight = contentBottomLimit - contentTop;

  function measureWidthAtSize(line, fontSize, weight = 700) {
    ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
    return ctx.measureText(line).width;
  }

  const layout = fitShareLayout({
    commentText: quoted,
    contextText: contextLabel,
    maxWidth: textMaxWidth,
    availableHeight,
    measureWidthAtSize: (line, fontSize) => measureWidthAtSize(line, fontSize, 700),
  });
  if (!layout) {
    throw new Error(
      `Weather Voice share content does not fit within the readable floor sizes and reserved layout (comment floor ${COMMENT_FONT_FLOOR_PX}px/${COMMENT_MAX_LINES} lines, context floor ${CONTEXT_FONT_FLOOR_PX}px/${CONTEXT_MAX_LINES} lines).`
    );
  }

  ctx.fillStyle = "#1E293B";
  ctx.font = `700 ${layout.comment.size}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const commentLineHeight = layout.comment.size * COMMENT_LINE_HEIGHT_RATIO;
  layout.comment.lines.forEach((line, i) => {
    ctx.fillText(line, size / 2, contentTop + i * commentLineHeight + commentLineHeight / 2);
  });

  ctx.fillStyle = "#78716C";
  ctx.font = `500 ${layout.context.size}px ${fontFamily}`;
  const contextLineHeight = layout.context.size * CONTEXT_LINE_HEIGHT_RATIO;
  const contextTop = contentTop + layout.comment.height + COMMENT_CONTEXT_GAP_PX;
  layout.context.lines.forEach((line, i) => {
    ctx.fillText(line, size / 2, contextTop + i * contextLineHeight + contextLineHeight / 2);
  });

  // Modest branding + canonical domain, bottom of the image — a fixed
  // region the comment/context layout above was solved to never overlap.
  const brandingBox = { x: size * 0.5 - 90, y: brandingTop, w: 180, h: 60 };
  drawContainedImage(ctx, brandingImg, brandingBox);
  ctx.fillStyle = "#78716C";
  ctx.font = `600 26px ${fontFamily}`;
  ctx.fillText("eltumvedrid.is", size / 2, size - 46);

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas export failed (toBlob returned null) — possibly a tainted canvas."));
          return;
        }
        resolve(blob);
      }, "image/png");
    } catch (err) {
      // A tainted canvas throws synchronously in some browsers rather than
      // calling back with null.
      reject(err);
    }
  });
}
