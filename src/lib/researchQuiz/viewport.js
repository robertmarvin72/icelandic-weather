// src/lib/researchQuiz/viewport.js
//
// Coarse mobile/desktop category only — never an exact viewport size
// (approved prompt: "Do not include ... exact viewport").

const MOBILE_MAX_WIDTH_PX = 767;

export function coarseViewportCategory(widthPx) {
  if (!Number.isFinite(widthPx)) return "desktop";
  return widthPx <= MOBILE_MAX_WIDTH_PX ? "mobile" : "desktop";
}

export function getCoarseViewportCategory() {
  if (typeof window === "undefined" || typeof window.innerWidth !== "number") return "desktop";
  return coarseViewportCategory(window.innerWidth);
}
