// Fixtures mirror Ticket 3's real parsed contract exactly (see
// docs/ai/tasks/ticket-391/cc-report.md §4 illustrative responses).
import { describe, it, expect } from "vitest";
import { classifyAuroraOutcome } from "./auroraDecisionClassify";

const SCORED_LOCATION = {
  locationId: "loc-clear", name: "Clear Site", lat: 64.1, lon: -21.9,
  score: 100, band: "excellent", reasons: ["meaningful_activity", "clear_sky"], flags: ["national_reference_times"],
};

function successBody(overrides = {}) {
  return {
    ok: true,
    evening: "2026-09-01",
    auroraCache: { state: "fresh", sourceFetchedAt: "2026-09-01T10:00:00.000Z", ageMinutes: 120 },
    viewingWindow: { start: "2026-09-01T22:00:00.000Z", end: "2026-09-02T05:00:00.000Z" },
    status: "success",
    best: SCORED_LOCATION,
    alternatives: [],
    excluded: [],
    warnings: ["national_reference_window"],
    ...overrides,
  };
}

describe("classifyAuroraOutcome — transport/HTTP first", () => {
  it("classifies a network failure as transport_error", () => {
    expect(classifyAuroraOutcome({ transportError: true })).toEqual({ primary: "transport_error", freshness: null });
  });

  it("classifies a missing/undefined outcome as transport_error", () => {
    expect(classifyAuroraOutcome(null)).toEqual({ primary: "transport_error", freshness: null });
  });

  it("classifies a generic 5xx as transport_error", () => {
    const outcome = { httpOk: false, httpStatus: 500, body: { ok: false, code: "internal_error" } };
    expect(classifyAuroraOutcome(outcome).primary).toBe("transport_error");
  });
});

describe("classifyAuroraOutcome — unknown_location_ids is a distinct contract defect", () => {
  it("routes it separately from transport_error and unavailable", () => {
    const outcome = {
      httpOk: false,
      httpStatus: 400,
      body: { ok: false, code: "unknown_location_ids", error: "...", details: { unknownIds: ["ghost-1"] } },
    };
    const result = classifyAuroraOutcome(outcome);
    expect(result.primary).toBe("contract_defect");
    expect(result.unknownIds).toEqual(["ghost-1"]);
  });
});

describe("classifyAuroraOutcome — success/partial", () => {
  it("classifies status:success as success with the reported freshness", () => {
    const result = classifyAuroraOutcome({ httpOk: true, httpStatus: 200, body: successBody() });
    expect(result).toMatchObject({ primary: "success", freshness: "fresh" });
  });

  it("classifies status:partial as partial, preserving stale freshness", () => {
    const body = successBody({
      status: "partial",
      auroraCache: { state: "stale", sourceFetchedAt: "2026-09-01T02:00:00.000Z", ageMinutes: 600 },
      excluded: [{ locationId: "loc-x", name: "X", status: "weather_fetch_failed", reasons: ["weather_fetch_failed"] }],
      warnings: ["national_reference_window", "aurora_data_stale", "some_locations_excluded"],
    });
    const result = classifyAuroraOutcome({ httpOk: true, httpStatus: 200, body });
    expect(result).toMatchObject({ primary: "partial", freshness: "stale" });
  });
});

describe("classifyAuroraOutcome — unavailable: no_darkness vs domain_unavailable", () => {
  it("invalid_darkness_window is unambiguous no_darkness", () => {
    const body = successBody({ status: "unavailable", reason: "invalid_darkness_window", best: null, alternatives: [], excluded: [], viewingWindow: null });
    expect(classifyAuroraOutcome({ httpOk: true, httpStatus: 200, body }).primary).toBe("no_darkness");
  });

  it("night_not_found is a data gap, NOT no_darkness — generic domain_unavailable", () => {
    const body = successBody({ status: "unavailable", reason: "night_not_found", best: null, alternatives: [], excluded: [], viewingWindow: null });
    expect(classifyAuroraOutcome({ httpOk: true, httpStatus: 200, body }).primary).toBe("domain_unavailable");
  });

  it("aurora_cache_unavailable is generic domain_unavailable", () => {
    const body = successBody({
      status: "unavailable",
      reason: "aurora_cache_unavailable",
      auroraCache: { state: "unavailable", reason: "too_old", sourceFetchedAt: "2026-08-24T10:00:00.000Z", ageMinutes: 1560 },
      best: null, alternatives: [], excluded: [], viewingWindow: null,
    });
    const result = classifyAuroraOutcome({ httpOk: true, httpStatus: 200, body });
    expect(result.primary).toBe("domain_unavailable");
    expect(result.freshness).toBe("unavailable");
  });

  it("no_locations_scored is no_darkness ONLY when every excluded location unambiguously agrees", () => {
    const allNoDarkness = successBody({
      status: "unavailable", reason: "no_locations_scored", best: null, alternatives: [],
      excluded: [
        { locationId: "a", name: "A", status: "not_viewable_tonight", reasons: ["no_darkness_overlap"] },
        { locationId: "b", name: "B", status: "not_viewable_tonight", reasons: ["no_observation_data"] },
      ],
    });
    expect(classifyAuroraOutcome({ httpOk: true, httpStatus: 200, body: allNoDarkness }).primary).toBe("no_darkness");
  });

  it("no_locations_scored is generic domain_unavailable when reasons are mixed", () => {
    const mixed = successBody({
      status: "unavailable", reason: "no_locations_scored", best: null, alternatives: [],
      excluded: [
        { locationId: "a", name: "A", status: "not_viewable_tonight", reasons: ["no_darkness_overlap"] },
        { locationId: "b", name: "B", status: "weather_fetch_failed", reasons: ["weather_fetch_failed"] },
      ],
    });
    expect(classifyAuroraOutcome({ httpOk: true, httpStatus: 200, body: mixed }).primary).toBe("domain_unavailable");
  });

  it("no_locations_scored with an insufficient_data mix is generic domain_unavailable, not no_darkness", () => {
    const mixed = successBody({
      status: "unavailable", reason: "no_locations_scored", best: null, alternatives: [],
      excluded: [{ locationId: "a", name: "A", status: "insufficient_data", reasons: ["missing_activity"] }],
    });
    expect(classifyAuroraOutcome({ httpOk: true, httpStatus: 200, body: mixed }).primary).toBe("domain_unavailable");
  });
});
