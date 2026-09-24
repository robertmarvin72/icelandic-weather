// Ticket 417 (#417) — weatherVoiceOgImage.js pure text-fit logic. Real
// canvas/asset-loading/export is exercised by real-browser evidence
// instead (outputs/ticket-417-facebook-share-evidence/), same convention
// as weatherVoiceShareImage.test.js.
import { describe, it, expect } from "vitest";
import {
  fitOgCommentText,
  OG_COMMENT_FONT_FLOOR_PX,
  OG_COMMENT_FONT_START_PX,
  OG_COMMENT_MAX_LINES,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
} from "./weatherVoiceOgImage";

// Simple deterministic measurer: width = text.length * size * 0.6.
function measurer(line, size) {
  return line.length * size * 0.6;
}

describe("fitOgCommentText — Ticket 417 (#417)", () => {
  it("returns the largest size whose wrapped lines fit within maxWidth/maxLines", () => {
    const result = fitOgCommentText({ text: "short text", measureWidthAtSize: measurer, maxWidth: 900 });
    expect(result).not.toBeNull();
    expect(result.size).toBe(OG_COMMENT_FONT_START_PX);
    expect(result.lines).toEqual(["short text"]);
  });

  it("shrinks toward the floor for longer text, never below it", () => {
    const longText = "This is a fairly long Weather Voice comment that needs several lines to fit.";
    const result = fitOgCommentText({ text: longText, measureWidthAtSize: measurer, maxWidth: 700 });
    expect(result).not.toBeNull();
    expect(result.size).toBeLessThanOrEqual(OG_COMMENT_FONT_START_PX);
    expect(result.size).toBeGreaterThanOrEqual(OG_COMMENT_FONT_FLOOR_PX);
    expect(result.lines.length).toBeLessThanOrEqual(OG_COMMENT_MAX_LINES);
  });

  it("rejects a single unbroken token wider than maxWidth even at the floor size", () => {
    const result = fitOgCommentText({
      text: "X".repeat(200),
      measureWidthAtSize: measurer,
      maxWidth: 700,
    });
    expect(result).toBeNull();
  });

  it("rejects text that would need more than the max line count even at the floor size", () => {
    const words = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ");
    const result = fitOgCommentText({ text: words, measureWidthAtSize: measurer, maxWidth: 200 });
    expect(result).toBeNull();
  });

  it("every returned line individually fits within maxWidth at the chosen size (not just line count)", () => {
    const text = "A moderately long comment about Icelandic weather conditions today.";
    const result = fitOgCommentText({ text, measureWidthAtSize: measurer, maxWidth: 600 });
    expect(result).not.toBeNull();
    for (const line of result.lines) {
      expect(measurer(line, result.size)).toBeLessThanOrEqual(600 + 0.5);
    }
  });
});

describe("weatherVoiceOgImage — dimension constants", () => {
  it("is exactly 1200x630 (the required Facebook OG image size)", () => {
    expect(OG_IMAGE_WIDTH).toBe(1200);
    expect(OG_IMAGE_HEIGHT).toBe(630);
  });
});
