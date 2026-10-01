import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NorthernLightsCard from "./NorthernLightsCard";
import { trackEvent } from "../lib/analytics";
import { clearAuroraDecisionCache } from "../lib/auroraDecisionCache";

// Ticket 403 (#403) — variant="landing" is an additive presentation switch
// on the canonical NorthernLightsCard. This file originally proved: (a) the
// locked four-part value treatment renders only for Free + a qualifying
// result, with zero Pro-data leakage; (b) Pro/all-poor/no-darkness/
// unavailable/loading states are unaffected by the variant; (c) the default
// (no variant prop) path — used by the homepage — is byte-for-byte
// unchanged; (d) the landing CTA analytics event fires correctly and does
// not disturb the existing upgrade event.
//
// Ticket #431: this unmounted legacy card shares the same
// isFeatureAvailable("northernLights", ...) registry entry as the active
// three-night module, which now unconditionally grants access
// (freeDuringExperiment) regardless of actual entitlements. Its own
// internal `isPro` is therefore always true in practice — the entire
// Free-locked landing treatment and the default-variant Free upgrade CTA
// below are unreachable via any real entitlements shape. Tests exercising
// those paths are updated to that now-true reality; the component's own
// code is left untouched since it is not part of the active user journey.

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("./NorthernLightsMap", () => ({
  default: ({ locations }) => (
    <div data-testid="nl-map-container">{locations.map((l) => `${l.id}:${l.band}`).join(",")}</div>
  ),
}));

const t = (k) => (k === "nlBestTonight" ? "nlBestTonight:{name}" : k);
const IN_SEASON_NOW = () => new Date("2026-09-01T20:00:00.000Z");

const BEST = {
  locationId: "osm_way_712155124",
  name: "Camper Resort Reykjavík",
  lat: 64.1,
  lon: -21.9,
  score: 90,
  band: "excellent",
  reasons: ["meaningful_activity", "clear_sky"],
  flags: ["national_reference_times"],
};

const ALTERNATIVE = {
  locationId: "osm_relation_17808139",
  name: "Vík í Mýrdal",
  lat: 63.4,
  lon: -19.0,
  score: 70,
  band: "good",
  reasons: ["meaningful_activity", "partial_cloud"],
  flags: ["national_reference_times"],
};

function successBody(overrides = {}) {
  return {
    ok: true,
    evening: "2026-09-01",
    auroraCache: { state: "fresh", sourceFetchedAt: "2026-09-01T18:00:00.000Z", ageMinutes: 120 },
    viewingWindow: { start: "2026-09-01T22:00:00.000Z", end: "2026-09-02T05:00:00.000Z" },
    status: "success",
    best: BEST,
    alternatives: [ALTERNATIVE],
    excluded: [],
    warnings: ["national_reference_window"],
    ...overrides,
  };
}

function loc(id, band) {
  return { locationId: id, name: id, lat: 64, lon: -20, score: 50, band, reasons: [], flags: ["national_reference_times"] };
}

function jsonResponse(body, ok = true) {
  return { ok, status: ok ? 200 : 400, json: async () => body };
}

function makeFetchImpl(body, ok = true) {
  return vi.fn().mockResolvedValue(jsonResponse(body, ok));
}

function renderCard(props = {}) {
  return render(
    <NorthernLightsCard
      t={t}
      lang="en"
      entitlements={{ isPro: false }}
      onUpgrade={vi.fn()}
      theme="light"
      now={IN_SEASON_NOW}
      fetchImpl={makeFetchImpl(successBody())}
      {...props}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  clearAuroraDecisionCache();
  sessionStorage.clear();
});

describe("NorthernLightsCard — variant='landing': Ticket #431 — the locked treatment is now unreachable for any entitlements", () => {
  it("shows the full canonical result instead of the locked four-part value treatment, even with nominal Free entitlements", async () => {
    renderCard({ variant: "landing" });
    await waitFor(() => expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument());

    expect(screen.queryByText("nlLandingLockedHeading")).toBeNull();
    expect(screen.queryByRole("button", { name: "nlLandingCtaPrimary" })).toBeNull();
    expect(screen.getByText("nlBestTonight:" + BEST.name)).toBeInTheDocument();
    expect(screen.getByText("nlReasonClearSky")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "nlCtaGood" }));
    expect(screen.getByTestId("nl-map-container")).toBeInTheDocument();
  });

  it("the qualifying headline still uses only the existing canonical visual-state copy for a fair band (no new state invented)", async () => {
    renderCard({ variant: "landing", fetchImpl: makeFetchImpl(successBody({ best: loc("a", "fair") })) });
    await waitFor(() => expect(screen.getByText("nlHeadlineFair")).toBeInTheDocument());
    expect(screen.queryByText("nlLandingLockedHeading")).toBeNull();
  });
});

describe("NorthernLightsCard — variant='landing', non-qualifying states show no misleading offer", () => {
  it("all-poor: no locked-value block, no CTA, same honest treatment as default", async () => {
    const allPoorBody = successBody({ best: loc("p1", "poor"), alternatives: [loc("p2", "very-poor")] });
    renderCard({ variant: "landing", fetchImpl: makeFetchImpl(allPoorBody) });
    await waitFor(() => expect(screen.getByTestId("nl-all-poor")).toBeInTheDocument());
    expect(screen.queryByText("nlLandingLockedHeading")).toBeNull();
    expect(screen.queryByRole("button", { name: "nlLandingCtaPrimary" })).toBeNull();
  });

  it("no_darkness: no locked-value block or CTA", async () => {
    const body = { ok: true, evening: "2026-06-01", auroraCache: { state: "fresh" }, viewingWindow: null, status: "unavailable", reason: "invalid_darkness_window", best: null, alternatives: [], excluded: [], warnings: [] };
    renderCard({ variant: "landing", fetchImpl: makeFetchImpl(body) });
    await waitFor(() => expect(screen.getByTestId("nl-no-darkness")).toBeInTheDocument());
    expect(screen.queryByText("nlLandingLockedHeading")).toBeNull();
    expect(screen.queryByRole("button", { name: "nlLandingCtaPrimary" })).toBeNull();
  });

  it("domain_unavailable: no locked-value block or CTA", async () => {
    const body = { ok: true, evening: "2026-09-01", auroraCache: { state: "unavailable", reason: "too_old" }, viewingWindow: null, status: "unavailable", reason: "aurora_cache_unavailable", best: null, alternatives: [], excluded: [], warnings: [] };
    renderCard({ variant: "landing", fetchImpl: makeFetchImpl(body) });
    await waitFor(() => expect(screen.getByTestId("nl-unavailable")).toBeInTheDocument());
    expect(screen.queryByText("nlLandingLockedHeading")).toBeNull();
    expect(screen.queryByRole("button", { name: "nlLandingCtaPrimary" })).toBeNull();
  });

  it("transport error: no locked-value block or CTA", async () => {
    renderCard({ variant: "landing", fetchImpl: vi.fn().mockRejectedValue(new Error("network down")) });
    await waitFor(() => expect(screen.getByTestId("nl-transport-error")).toBeInTheDocument());
    expect(screen.queryByText("nlLandingLockedHeading")).toBeNull();
    expect(screen.queryByRole("button", { name: "nlLandingCtaPrimary" })).toBeNull();
  });

  it("loading: no locked-value block or CTA", () => {
    renderCard({ variant: "landing", fetchImpl: vi.fn(() => new Promise(() => {})) });
    expect(screen.getByTestId("nl-loading")).toBeInTheDocument();
    expect(screen.queryByText("nlLandingLockedHeading")).toBeNull();
    expect(screen.queryByRole("button", { name: "nlLandingCtaPrimary" })).toBeNull();
  });
});

describe("NorthernLightsCard — variant='landing', Pro users", () => {
  it("Pro retains the full canonical experience and shows no purchase lock/CTA", async () => {
    renderCard({ variant: "landing", entitlements: { isPro: true } });
    await waitFor(() => expect(screen.getByText("nlBestTonight:" + BEST.name)).toBeInTheDocument());

    expect(screen.queryByText("nlLandingLockedHeading")).toBeNull();
    expect(screen.queryByRole("button", { name: "nlLandingCtaPrimary" })).toBeNull();
    expect(screen.queryByText("nlLandingCtaNote")).toBeNull();

    // Full detail toggle still present and works exactly as default.
    fireEvent.click(screen.getByRole("button", { name: "nlCtaGood" }));
    expect(document.body.textContent).toContain(BEST.name);
    expect(screen.getByTestId("nl-map-container")).toBeInTheDocument();
  });

  it("Pro all-poor: unaffected by variant, retains existing details disclosure", async () => {
    const allPoorBody = successBody({ best: loc("p1", "poor"), alternatives: [loc("p2", "very-poor")] });
    renderCard({ variant: "landing", entitlements: { isPro: true }, fetchImpl: makeFetchImpl(allPoorBody) });
    await waitFor(() => expect(screen.getByTestId("nl-all-poor")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "nlDetailsShow" })).toBeInTheDocument();
  });
});

describe("NorthernLightsCard — default variant (homepage): Ticket #431 — the Free-hint/CTA is also unreachable now", () => {
  it("omitting variant renders the full canonical result, not the old free-hint/CTA copy or the landing locked-value block", async () => {
    renderCard(); // no variant prop at all
    await waitFor(() => expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument());

    expect(screen.queryByText("nlFreeHint")).toBeNull();
    expect(screen.queryByRole("button", { name: "nlUpgradeCta" })).toBeNull();
    expect(screen.queryByText("nlLandingLockedHeading")).toBeNull();
    expect(screen.queryByRole("button", { name: "nlLandingCtaPrimary" })).toBeNull();
    expect(screen.getByText("nlBestTonight:" + BEST.name)).toBeInTheDocument();
  });

  it('variant="default" explicitly behaves identically to omitting it', async () => {
    renderCard({ variant: "default" });
    await waitFor(() => expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument());
    expect(screen.getByText("nlBestTonight:" + BEST.name)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "nlUpgradeCta" })).toBeNull();
  });

  it("no upgrade-click event of any kind fires any more — the CTA that used to trigger it no longer exists", async () => {
    const onUpgrade = vi.fn();
    renderCard({ onUpgrade });
    await waitFor(() => expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument());

    expect(screen.queryByRole("button", { name: "nlUpgradeCta" })).toBeNull();
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_upgrade_clicked")).toBe(false);
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_landing_cta_clicked")).toBe(false);
    expect(onUpgrade).not.toHaveBeenCalled();
  });
});

describe("NorthernLightsCard — variant='landing' CTA analytics: Ticket #431 — the CTA itself no longer exists", () => {
  it("no landing CTA renders, so no landing_cta_clicked or upgrade event ever fires for it", async () => {
    const onUpgrade = vi.fn();
    renderCard({ variant: "landing", onUpgrade });
    await waitFor(() => expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument());

    expect(screen.queryByRole("button", { name: "nlLandingCtaPrimary" })).toBeNull();
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_landing_cta_clicked")).toBe(false);
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_upgrade_clicked")).toBe(false);
    expect(onUpgrade).not.toHaveBeenCalled();
  });
});
