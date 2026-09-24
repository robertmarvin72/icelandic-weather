// src/lib/weatherVoiceOgImage.js
//
// Ticket 417 (#417) — standalone 1200x630 static Open Graph image for one
// Weather Voice comment/language pair. Distinct from
// weatherVoiceShareImage.js's 1080x1080 in-app share image, which that
// module's own renderer (renderWeatherVoiceShareImage) is left completely
// unchanged and untouched by this ticket — this is a separate, smaller
// rendering path for the finite offline export, reusing that module's pure
// text-fit primitives (wrapTextToLines/linesFitWidth/languageAppropriateQuote)
// rather than duplicating them. Deliberately carries NO site/date/weather
// context (unlike the 1080x1080 image) — a static, versioned, comment-only
// artifact must never claim to reproduce a specific forecast.

import { wrapTextToLines, linesFitWidth, languageAppropriateQuote } from "./weatherVoiceShareImage";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

// A comment must remain fully readable at Facebook-preview size — reducing
// font size to fit is allowed only down to this floor; below it, rendering
// must fail clearly rather than crop/ellipsize the actual comment.
export const OG_COMMENT_FONT_FLOOR_PX = 30;
export const OG_COMMENT_FONT_START_PX = 56;
export const OG_COMMENT_FONT_STEP_PX = 2;
export const OG_COMMENT_MAX_LINES = 4;
export const OG_COMMENT_LINE_HEIGHT_RATIO = 1.25;

function buildSizeList(startSize, floorSize, step) {
  const sizes = [];
  for (let size = startSize; size > floorSize; size -= step) sizes.push(size);
  sizes.push(floorSize);
  return sizes;
}

/**
 * fitOgCommentText({text, measureWidthAtSize, maxWidth, ...}) -> {size, lines} | null
 *
 * Pure — same width+line-count discipline as weatherVoiceShareImage.js's
 * fitCommentText (both individual line width AND line count must fit),
 * reusing that module's wrapTextToLines/linesFitWidth directly rather than
 * re-implementing the same logic a second time.
 */
export function fitOgCommentText({
  text,
  measureWidthAtSize,
  maxWidth,
  maxLines = OG_COMMENT_MAX_LINES,
  startSize = OG_COMMENT_FONT_START_PX,
  floorSize = OG_COMMENT_FONT_FLOOR_PX,
  step = OG_COMMENT_FONT_STEP_PX,
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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        if (typeof img.decode === "function") await img.decode();
      } catch {
        // Some environments' decode() rejects even for a usable image;
        // onload already fired, so fall through and use it.
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
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
 * renderWeatherVoiceOgImage({text, language, moodAssetPath, brandingAssetPath})
 * -> Promise<Blob>
 *
 * Renders the standalone 1200x630 OG PNG for one catalogue entry. Rejects
 * (never resolves with a blank/partial image) on: asset load/decode
 * failure, text that doesn't fit even at the readable floor size, or a
 * canvas.toBlob failure. No location/date/weather context is ever drawn —
 * only the exact comment text, the correct mascot for its mood, and the
 * language-appropriate brand mark.
 *
 * @param {{text:string, language:string, moodAssetPath:string, brandingAssetPath:string}} args
 * @returns {Promise<Blob>}
 */
export async function renderWeatherVoiceOgImage({ text, language, moodAssetPath, brandingAssetPath }) {
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("Canvas rendering is unavailable in this environment.");
  }

  const [moodImg, brandingImg] = await Promise.all([loadImage(moodAssetPath), loadImage(brandingAssetPath)]);

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // proceed with fallback fonts rather than failing the whole export
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = OG_IMAGE_WIDTH;
  canvas.height = OG_IMAGE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable.");

  // Same warm amber palette as the 1080x1080 in-app image and the card
  // itself — never a new brand color.
  ctx.fillStyle = "#FFFBEB";
  ctx.fillRect(0, 0, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT);
  ctx.fillStyle = "#FDBA74";
  ctx.fillRect(0, 0, OG_IMAGE_WIDTH, 12);

  // Mascot on the left, quote text on the right — landscape layout suited
  // to the 1200x630 OG aspect ratio (unlike the square 1080x1080 image).
  const mascotBox = { x: 50, y: 85, w: 300, h: 460 };
  drawContainedImage(ctx, moodImg, mascotBox);

  const fontFamily = `"Segoe UI", system-ui, -apple-system, sans-serif`;
  const quoted = languageAppropriateQuote(text, language);
  const textAreaX = 400;
  const textMaxWidth = OG_IMAGE_WIDTH - textAreaX - 60;

  function measureWidthAtSize(line, fontSize) {
    ctx.font = `700 ${fontSize}px ${fontFamily}`;
    return ctx.measureText(line).width;
  }

  const fit = fitOgCommentText({ text: quoted, measureWidthAtSize, maxWidth: textMaxWidth });
  if (!fit) {
    throw new Error(
      `Weather Voice OG image text does not fit within the readable floor size (${OG_COMMENT_FONT_FLOOR_PX}px / ${OG_COMMENT_MAX_LINES} lines).`
    );
  }

  ctx.fillStyle = "#1E293B";
  ctx.font = `700 ${fit.size}px ${fontFamily}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const lineHeight = fit.size * OG_COMMENT_LINE_HEIGHT_RATIO;
  const totalTextHeight = fit.lines.length * lineHeight;
  const textStartY = (OG_IMAGE_HEIGHT - totalTextHeight) / 2 + lineHeight / 2;
  fit.lines.forEach((line, i) => {
    ctx.fillText(line, textAreaX, textStartY + i * lineHeight);
  });

  const brandingBox = { x: textAreaX, y: OG_IMAGE_HEIGHT - 95, w: 150, h: 48 };
  drawContainedImage(ctx, brandingImg, brandingBox);
  ctx.fillStyle = "#78716C";
  ctx.font = `600 22px ${fontFamily}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("eltumvedrid.is", textAreaX + 165, OG_IMAGE_HEIGHT - 62);

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
      reject(err);
    }
  });
}
