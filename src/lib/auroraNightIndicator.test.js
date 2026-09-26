import { describe, it, expect } from "vitest";
import { auroraNightOverview } from "./auroraNightIndicator";

function resolved(primary, band) {
  return { status: "resolved", classification: { primary, freshness: "fresh", body: { best: band ? { band, name: "Secret Place" } : null } } };
}

describe("auroraNightOverview — visible text keys and accents per night", () => {
  it("loading (or unresolved) shows the loading text", () => {
    expect(auroraNightOverview({ status: "loading", classification: null })).toMatchObject({ kind: "loading", textKey: "nlTabLoading" });
    expect(auroraNightOverview({ status: "idle", classification: null }).kind).toBe("loading");
  });

  it("excellent keeps its own pill text and purple accent — never collapsed into good", () => {
    const excellent = auroraNightOverview(resolved("success", "excellent"));
    const good = auroraNightOverview(resolved("success", "good"));
    expect(excellent.textKey).toBe("nlPillExcellent");
    expect(good.textKey).toBe("nlPillGood");
    expect(excellent.dotClass).toContain("purple");
    expect(excellent.dotClass).not.toBe(good.dotClass);
  });

  it("fair, poor and very-poor map to their coarse texts (poor bands share the date-neutral 'Low chance')", () => {
    expect(auroraNightOverview(resolved("success", "fair")).textKey).toBe("nlPillFair");
    expect(auroraNightOverview(resolved("partial", "poor")).textKey).toBe("nlMultiPillPoor");
    expect(auroraNightOverview(resolved("success", "very-poor")).textKey).toBe("nlMultiPillPoor");
  });

  it("no-darkness, unavailable, transport error and expired each get their own truthful text", () => {
    expect(auroraNightOverview(resolved("no_darkness")).textKey).toBe("nlTabNoDarkness");
    expect(auroraNightOverview(resolved("domain_unavailable")).textKey).toBe("nlPillNeutral");
    expect(auroraNightOverview({ status: "resolved", classification: { primary: "transport_error", freshness: null } }).textKey).toBe("nlPillNeutral");
    expect(auroraNightOverview({ status: "resolved", classification: { primary: "domain_unavailable", expired: true, body: null } })).toMatchObject({ kind: "expired", textKey: "nlTabExpired" });
  });

  it("a result with an unknown band never masquerades as a known outlook", () => {
    expect(auroraNightOverview(resolved("success", "mystery")).kind).toBe("unavailable");
  });

  it("never exposes location names, only canonical text keys/classes", () => {
    const out = auroraNightOverview(resolved("success", "good"));
    expect(JSON.stringify(out)).not.toContain("Secret Place");
  });
});
