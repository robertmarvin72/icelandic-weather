import { it, expect } from "vitest";
import { fitCommentText } from "./weatherVoiceShareImage";

it("rejects a single token wider than the available width even at the floor", () => {
  const result = fitCommentText({
    text: "X".repeat(100),
    measureWidthAtSize: (line, size) => line.length * size,
    maxWidth: 885.6,
  });
  expect(result).toBeNull();
});
