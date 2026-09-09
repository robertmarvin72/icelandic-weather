import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NorthernLightsCard from "./NorthernLightsCard";
import { trackEvent } from "../lib/analytics";
import { clearAuroraDecisionCache } from "../lib/auroraDecisionCache";

// Ticket 403 (#403) — variant="landing" is an additive presentation switch
// on the canonical NorthernLightsCard. This file proves: (a) the locked
// four-part value treatment renders only for Free + a qualifying result,
// with zero Pro-data leakage; (b) Pro/all-poor/no-darkness/unavailable/
// loading states are unaffected by the variant; (c) the default (no
// variant prop) path — used by the homepage — is byte-for-byte unchanged;
// (d) the new landing CTA analytics event fires correctly and does not
// disturb the existing upgrade event.

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

describe("NorthernLightsCard — variant='landing', Free qualifying result", () => {
  it("renders the locked four-part value treatment, the outcome-led CTA, and the Pro inclusion note", async () => {
    renderCard({ variant: "landing" });
    await waitFor(() => expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument());

    expect(screen.getByText("nlLandingLockedHeading")).toBeInTheDocument();
    expect(screen.getByText("nlLandingLockedBestLocation")).toBeInTheDocument();
    expect(screen.getByText("nlLandingLockedAlternatives")).toBeInTheDocument();
    expect(screen.getByText("nlLandingLockedReasons")).toBeInTheDocument();
    expect(screen.getByText("nlLandingLockedMap")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "nlLandingCtaPrimary" })).toBeInTheDocument();
    expect(screen.getByText("nlLandingCtaNote")).toBeInTheDocument();

    // The old default free-hint/CTA copy must not also appear.
    expect(screen.queryByText("nlFreeHint")).toBeNull();
    expect(screen.queryByText("nlUpgradeCta")).toBeNull();
  });

  it("never renders or exposes any Pro-only location name, ranking, reason, coordinate, or map content — DOM, accessible names, or attributes", async () => {
    renderCard({ variant: "landing" });
    await waitFor(() => expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument());

    // Full-body-text sweep — catches leaks in hidden/aria/attribute form too,
    // not just visible query misses.
    const html = document.body.innerHTML;
    expect(html).not.toContain(BEST.name);
    expect(html).not.toContain(ALTERNATIVE.name);
    expect(html).not.toContain(String(BEST.lat));
    expect(html).not.toContain(String(BEST.lon));
    expect(html).not.toContain("nlReasonClearSky");
    expect(html).not.toContain("nlReasonMeaningfulActivity");
    expect(html).not.toContain("nlQualifyingHeading");
    expect(screen.queryByTestId("nl-map-container")).toBeNull();
    // The generic 4-benefit bullet list is fine (no location data in it);
    // the Pro-only ranked-locations list specifically must be absent.
    expect(screen.queryByRole("list", { name: "nlQualifyingHeading" })).toBeNull();
  });

  it("the qualifying headline may still connect to the offer using only the existing canonical visual-state copy (no new state invented)", async () => {
    renderCard({ variant: "landing", fetchImpl: makeFetchImpl(successBody({ best: loc("a", "fair") })) });
    await waitFor(() => expect(screen.getByText("nlHeadlineFair")).toBeInTheDocument());
    // Still the pre-existing shared visual-state headline/body — nothing new.
    expect(screen.getByText("nlLandingLockedHeading")).toBeInTheDocument();
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

describe("NorthernLightsCard — default variant (homepage) is unchanged", () => {
  it("omitting variant renders the pre-existing free-hint/CTA copy, not the landing locked-value block", async () => {
    renderCard(); // no variant prop at all
    await waitFor(() => expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument());

    expect(screen.getByText("nlFreeHint")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "nlUpgradeCta" })).toBeInTheDocument();
    expect(screen.queryByText("nlLandingLockedHeading")).toBeNull();
    expect(screen.queryByRole("button", { name: "nlLandingCtaPrimary" })).toBeNull();
  });

  it('variant="default" explicitly behaves identically to omitting it', async () => {
    renderCard({ variant: "default" });
    await waitFor(() => expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument());
    expect(screen.getByText("nlFreeHint")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "nlUpgradeCta" })).toBeInTheDocument();
  });

  it("clicking the default CTA fires only the existing northern_lights_upgrade_clicked — never the new landing event", async () => {
    const onUpgrade = vi.fn();
    renderCard({ onUpgrade });
    await waitFor(() => expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "nlUpgradeCta" }));

    expect(trackEvent).toHaveBeenCalledWith("northern_lights_upgrade_clicked", { lang: "en", source: "northern_lights_card", tier: "free" });
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_landing_cta_clicked")).toBe(false);
    expect(onUpgrade).toHaveBeenCalledWith("northern_lights_card");
  });
});

describe("NorthernLightsCard — variant='landing' CTA analytics", () => {
  it("clicking the card's landing CTA fires northern_lights_landing_cta_clicked (placement: card) exactly once, then the existing upgrade event, then forwards the same source to onUpgrade", async () => {
    const onUpgrade = vi.fn();
    renderCard({ variant: "landing", onUpgrade });
    await waitFor(() => expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "nlLandingCtaPrimary" }));

    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_landing_cta_clicked")).toHaveLength(1);
    expect(trackEvent).toHaveBeenCalledWith("northern_lights_landing_cta_clicked", {
      lang: "en",
      tier: "free",
      placement: "card",
      source: "northern_lights_card",
    });

    // The pre-existing card event is unchanged and still fires — both are
    // intentional from the same click (separate semantic layers).
    expect(trackEvent).toHaveBeenCalledWith("northern_lights_upgrade_clicked", { lang: "en", source: "northern_lights_card", tier: "free" });
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_upgrade_clicked")).toHaveLength(1);

    expect(onUpgrade).toHaveBeenCalledWith("northern_lights_card");
  });
});
