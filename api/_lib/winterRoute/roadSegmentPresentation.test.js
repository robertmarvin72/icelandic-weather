// api/_lib/winterRoute/roadSegmentPresentation.test.js — Ticket #503, P5(a)
import { describe, it, expect } from "vitest";
import { computePointsFeedUnavailableOrStale, buildNoticePayload, classifySegmentAmbiguous } from "./roadSegmentPresentation.js";
import { SEGMENT_CATEGORY } from "./roadConditionCodes.js";

describe("computePointsFeedUnavailableOrStale", () => {
  it("true when the points result itself failed", () => {
    expect(computePointsFeedUnavailableOrStale({ ok: false }, new Date())).toBe(true);
  });

  it("true when the feed export is stale/missing, false when fresh", () => {
    const now = new Date("2026-11-23T12:00:00Z");
    expect(computePointsFeedUnavailableOrStale({ ok: true, feedDagsKeyrtUt: null }, now)).toBe(true);
    expect(computePointsFeedUnavailableOrStale({ ok: true, feedDagsKeyrtUt: "2026-11-23T11:59:00Z" }, now)).toBe(false);
    expect(computePointsFeedUnavailableOrStale({ ok: true, feedDagsKeyrtUt: "2026-11-23T11:00:00Z" }, now)).toBe(true);
  });
});

describe("buildNoticePayload", () => {
  it("maps a raw notice to its own category plus the unchanged fields", () => {
    const notice = { idPunktur: 1, astand: "VEGAVINNA", lysing: "is", lysingEn: "en", dagsSkrad: "d", gildirTil: "g", status: "active" };
    expect(buildNoticePayload(notice)).toEqual({
      idPunktur: 1, astand: "VEGAVINNA", category: expect.any(String),
      lysing: "is", lysingEn: "en", dagsSkrad: "d", gildirTil: "g", status: "active",
    });
  });
});

describe("classifySegmentAmbiguous", () => {
  it("a forced closure among duplicates wins regardless of notices", () => {
    const category = classifySegmentAmbiguous({ forcedCategory: SEGMENT_CATEGORY.CLOSED }, []);
    expect(category).toBe(SEGMENT_CATEGORY.CLOSED);
  });

  it("no forced closure and no notices -> unknown_unclassified", () => {
    const category = classifySegmentAmbiguous({ forcedCategory: null }, []);
    expect(category).toBe(SEGMENT_CATEGORY.UNKNOWN_UNCLASSIFIED);
  });
});
