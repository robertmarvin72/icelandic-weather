import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import NorthernLightsCard from "./NorthernLightsCard";
import { trackEvent } from "../lib/analytics";
import { clearAuroraDecisionCache } from "../lib/auroraDecisionCache";
import { northernLightsTranslations } from "../i18n/translations.northernLights";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

// NorthernLightsMap is a thin lazy-Leaflet wrapper, covered independently in
// NorthernLightsMap.test.jsx. Mocked here so these tests exercise
// NorthernLightsCard's own logic without needing a jsdom IntersectionObserver
// polyfill. Captures `band` too, so map-consistency tests can assert order.
vi.mock("./NorthernLightsMap", () => ({
  default: ({ locations }) => (
    <div data-testid="nl-map-container">{locations.map((l) => `${l.id}:${l.band}`).join(",")}</div>
  ),
}));

// Identity translator, with ONE special case: nlBestTonight needs a real
// "{name}" placeholder to prove interpolation actually happens (an identity
// mapping alone has nothing to substitute into, since the raw key string
// contains no "{name}" token) — mirrors the same technique already used
// elsewhere in this suite for interpolated copy.
const t = (k) => (k === "nlBestTonight" ? "nlBestTonight:{name}" : k);
const IN_SEASON_NOW = () => new Date("2026-09-01T20:00:00.000Z");
const OUT_OF_SEASON_NOW = () => new Date("2026-06-01T20:00:00.000Z");

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
      lang="is"
      entitlements={{ isPro: false }}
      onUpgrade={vi.fn()}
      theme="light"
      now={IN_SEASON_NOW}
      fetchImpl={makeFetchImpl(successBody())}
      {...props}
    />,
  );
}

function loc(id, band) {
  return { locationId: id, name: id, lat: 64, lon: -20, score: 50, band, reasons: [], flags: ["national_reference_times"] };
}

beforeEach(() => {
  vi.clearAllMocks();
  clearAuroraDecisionCache();
  sessionStorage.clear();
});

describe("NorthernLightsCard — seasonal visibility", () => {
  it("renders nothing and never fetches when out of season", () => {
    const fetchImpl = vi.fn();
    const { container } = renderCard({ now: OUT_OF_SEASON_NOW, fetchImpl });
    expect(container).toBeEmptyDOMElement();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("mounts and fetches when in season", async () => {
    const fetchImpl = makeFetchImpl(successBody());
    renderCard({ fetchImpl });
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("nl-card")).toBeInTheDocument();
  });
});

describe("NorthernLightsCard — dark feature-surface shell (#398)", () => {
  it("the shell keeps the same dark background/text classes regardless of theme — only border/shadow differ via dark: variants", () => {
    renderCard();
    const card = screen.getByTestId("nl-card");
    expect(card.className).toContain("bg-gradient-to-br");
    expect(card.className).toContain("text-slate-100");
    // Never swaps to a light background class.
    expect(card.className).not.toMatch(/bg-white(?!\/)/);
    // Theme-specific separation exists as an explicit dark: variant, distinct from the light-mode value.
    expect(card.className).toContain("shadow-lg");
    expect(card.className).toContain("dark:shadow-md");
    expect(card.className).toContain("border-slate-800/70");
    expect(card.className).toContain("dark:border-slate-500/40");
  });

  it("header (icon/title/badge) renders identically across every state, including loading", () => {
    renderCard({ fetchImpl: vi.fn(() => new Promise(() => {})) });
    expect(screen.getByText("nlCardTitle")).toBeInTheDocument();
    expect(document.querySelector("svg.lucide-sparkles")).toBeInTheDocument();
  });

  it("the decorative icon is aria-hidden and does not duplicate the adjacent spoken title", () => {
    renderCard();
    const icon = document.querySelector("svg.lucide-sparkles");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).not.toHaveAttribute("aria-label");
  });

  it("no accent glow renders during loading (no premature success treatment)", () => {
    renderCard({ fetchImpl: vi.fn(() => new Promise(() => {})) });
    expect(document.querySelector('[aria-hidden="true"].blur-2xl')).toBeNull();
  });
});

describe("NorthernLightsCard — loading state", () => {
  it("shows an accessible loading status before resolution", () => {
    const fetchImpl = vi.fn(() => new Promise(() => {}));
    renderCard({ fetchImpl });
    expect(screen.getByTestId("nl-loading")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("nlPillGood")).toBeNull();
  });
});

describe("NorthernLightsCard — #398 visual-state pill/headline/body per band (good/fair/poor), IS and EN", () => {
  it.each(["is", "en"])("%s: excellent/good band -> GOOD visual state copy", async (lang) => {
    const dict = northernLightsTranslations[lang];
    const realT = (k) => dict[k] ?? k;
    render(
      <NorthernLightsCard t={realT} lang={lang} entitlements={{ isPro: false }} onUpgrade={vi.fn()} theme="light" now={IN_SEASON_NOW} fetchImpl={makeFetchImpl(successBody({ best: loc("a", "excellent") }))} />,
    );
    await waitFor(() => expect(screen.getByText(dict.nlHeadlineGood)).toBeInTheDocument());
    expect(screen.getByText(dict.nlPillGood)).toBeInTheDocument();
    expect(screen.getByText(dict.nlBodyGood)).toBeInTheDocument(); // Free body line
  });

  it.each(["is", "en"])("%s: fair band -> FAIR visual state copy, hedged", async (lang) => {
    const dict = northernLightsTranslations[lang];
    const realT = (k) => dict[k] ?? k;
    render(
      <NorthernLightsCard t={realT} lang={lang} entitlements={{ isPro: false }} onUpgrade={vi.fn()} theme="light" now={IN_SEASON_NOW} fetchImpl={makeFetchImpl(successBody({ best: loc("a", "fair") }))} />,
    );
    await waitFor(() => expect(screen.getByText(dict.nlHeadlineFair)).toBeInTheDocument());
    expect(screen.getByText(dict.nlPillFair)).toBeInTheDocument();
  });

  it.each(["is", "en"])("%s: all-poor -> POOR visual state copy, never advertising a location", async (lang) => {
    const dict = northernLightsTranslations[lang];
    const realT = (k) => dict[k] ?? k;
    render(
      <NorthernLightsCard
        t={realT}
        lang={lang}
        entitlements={{ isPro: false }}
        onUpgrade={vi.fn()}
        theme="light"
        now={IN_SEASON_NOW}
        fetchImpl={makeFetchImpl(successBody({ best: loc("a", "poor"), alternatives: [loc("b", "very-poor")] }))}
      />,
    );
    await waitFor(() => expect(screen.getByText(dict.nlHeadlinePoor)).toBeInTheDocument());
    expect(screen.getByText(dict.nlPillPoor)).toBeInTheDocument();
    expect(screen.getByText(dict.nlBodyPoor)).toBeInTheDocument();
  });
});

describe("NorthernLightsCard — Free: coarse guidance without Pro data leakage", () => {
  it("shows visual-state headline/pill/body but never the exact name, score, coordinates, reasons, or map", async () => {
    renderCard({ entitlements: { isPro: false } });
    await waitFor(() => expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument());

    expect(screen.getByText("nlPillGood")).toBeInTheDocument();
    expect(screen.getByText("nlBodyGood")).toBeInTheDocument();
    expect(screen.queryByText(BEST.name)).toBeNull();
    expect(screen.queryByText("90")).toBeNull();
    expect(screen.queryByText(String(BEST.lat))).toBeNull();
    expect(screen.queryByText("nlReasonClearSky")).toBeNull();
    expect(screen.queryByTestId("nl-map-container")).toBeNull();
    expect(screen.queryByText("nlQualifyingHeading")).toBeNull();
    expect(screen.getByText("nlFreeHint")).toBeInTheDocument();
    expect(screen.getByText("nlUpgradeCta")).toBeInTheDocument();
  });

  it("never renders hidden Pro data even in the accessible DOM (full body text)", async () => {
    renderCard({ entitlements: { isPro: false } });
    await waitFor(() => expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument());
    expect(document.body.textContent).not.toContain(BEST.name);
    expect(document.body.textContent).not.toContain(String(BEST.lon));
  });

  it("upgrade attribution remains northern_lights_card, semantically separate from analytics source", async () => {
    const onUpgrade = vi.fn();
    renderCard({ entitlements: { isPro: false }, onUpgrade });
    await waitFor(() => expect(screen.getByText("nlUpgradeCta")).toBeInTheDocument());
    fireEvent.click(screen.getByText("nlUpgradeCta"));
    expect(onUpgrade).toHaveBeenCalledWith("northern_lights_card");
    expect(trackEvent).toHaveBeenCalledWith("northern_lights_upgrade_clicked", expect.objectContaining({ source: "northern_lights_card" }));
  });
});

describe("NorthernLightsCard — Pro: keeps the best-location name visible while collapsed", () => {
  it("good result: headline + interpolated best-location name visible collapsed, one primary details action", async () => {
    renderCard({ entitlements: { isPro: true } });
    await waitFor(() => expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument());

    expect(screen.getByText("nlBestTonight:" + BEST.name)).toBeInTheDocument();
    // Reason-summary tiles are hierarchy item (4), independent of the details
    // disclosure (item 5) — they're visible collapsed by design.
    expect(screen.getByText("nlReasonClearSky")).toBeInTheDocument();
    // The full reasons list, viewing-window caveat, ranked list, and map are
    // still gated behind the details disclosure.
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByTestId("nl-map-container")).toBeNull();

    const toggle = screen.getByRole("button", { name: "nlCtaGood" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);

    expect(screen.getByRole("button", { name: "nlDetailsHide" })).toHaveAttribute("aria-expanded", "true");
    // Now present twice: once as the collapsed reason-summary tile, once in
    // the expanded full-reasons list.
    expect(screen.getAllByText("nlReasonClearSky")).toHaveLength(2);
    expect(screen.getByTestId("nl-map-container")).toBeInTheDocument();

    const rankedList = screen.getByRole("list", { name: "nlQualifyingHeading" });
    const items = within(rankedList).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent(BEST.name);
    expect(items[1]).toHaveTextContent(ALTERNATIVE.name);
  });

  it("fair result: uses the hedged nlCtaFair label for the collapsed toggle", async () => {
    renderCard({ entitlements: { isPro: true }, fetchImpl: makeFetchImpl(successBody({ best: loc("loc-1", "fair"), alternatives: [] })) });
    await waitFor(() => expect(screen.getByText("nlHeadlineFair")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "nlCtaFair" })).toBeInTheDocument();
  });

  it("shows up to two reason-summary tiles for Pro when supported canonical reasons are available", async () => {
    renderCard({ entitlements: { isPro: true } });
    await waitFor(() => expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument());
    // BEST.reasons = ["meaningful_activity", "clear_sky"] — both supported.
    expect(screen.getByText("nlReasonMeaningfulActivity")).toBeInTheDocument();
    expect(screen.getByText("nlReasonClearSky")).toBeInTheDocument();
  });

  it("omits reason tiles (no empty boxes) when no supported reason is available", async () => {
    renderCard({
      entitlements: { isPro: true },
      fetchImpl: makeFetchImpl(successBody({ best: { ...BEST, reasons: ["precipitation_reduced_visibility"] } })),
    });
    await waitFor(() => expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument());
    expect(screen.queryByText("nlReasonPrecipitation")).toBeNull(); // not summarized as a tile
  });
});

describe("NorthernLightsCard — stale + partial disclose simultaneously, for both tiers", () => {
  const stalePartialBody = successBody({
    status: "partial",
    auroraCache: { state: "stale", sourceFetchedAt: "2026-09-01T12:00:00.000Z", ageMinutes: 480 },
    excluded: [{ locationId: "x", name: "X", status: "weather_fetch_failed", reasons: ["weather_fetch_failed"] }],
    warnings: ["national_reference_window", "aurora_data_stale", "some_locations_excluded"],
  });

  it("Free sees both the stale and partial disclosures without them dominating the headline", async () => {
    renderCard({ entitlements: { isPro: false }, fetchImpl: makeFetchImpl(stalePartialBody) });
    await waitFor(() => expect(screen.getByText("nlWarningPartial")).toBeInTheDocument());
    expect(screen.getByText((text) => text.startsWith("nlWarningStale"))).toBeInTheDocument();
    expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument();
  });

  it("Pro sees both disclosures without any change to result/order", async () => {
    renderCard({ entitlements: { isPro: true }, fetchImpl: makeFetchImpl(stalePartialBody) });
    await waitFor(() => expect(screen.getByText("nlWarningPartial")).toBeInTheDocument());
    expect(screen.getByText((text) => text.startsWith("nlWarningStale"))).toBeInTheDocument();
    expect(screen.getByText("nlBestTonight:" + BEST.name)).toBeInTheDocument();
  });

  it("stale+partial composes correctly with the all-poor presentation too", async () => {
    const stalePartialAllPoor = successBody({
      status: "partial",
      auroraCache: { state: "stale", sourceFetchedAt: "2026-09-01T12:00:00.000Z", ageMinutes: 480 },
      best: loc("loc-poor-1", "poor"),
      alternatives: [loc("loc-poor-2", "very-poor")],
      excluded: [{ locationId: "x", name: "X", status: "weather_fetch_failed", reasons: ["weather_fetch_failed"] }],
      warnings: ["national_reference_window", "aurora_data_stale", "some_locations_excluded"],
    });
    renderCard({ entitlements: { isPro: false }, fetchImpl: makeFetchImpl(stalePartialAllPoor) });
    await waitFor(() => expect(screen.getByTestId("nl-all-poor")).toBeInTheDocument());
    expect(screen.getByText("nlWarningPartial")).toBeInTheDocument();
    expect(screen.getByText((text) => text.startsWith("nlWarningStale"))).toBeInTheDocument();
    expect(screen.getByText("nlHeadlinePoor")).toBeInTheDocument();
  });
});

describe("NorthernLightsCard — truthful unavailable/no-darkness/transport/contract-defect states", () => {
  it("domain_unavailable: neutral copy, retry, no upgrade CTA, no favorable pill", async () => {
    const body = { ok: true, evening: "2026-09-01", auroraCache: { state: "unavailable", reason: "too_old" }, viewingWindow: null, status: "unavailable", reason: "aurora_cache_unavailable", best: null, alternatives: [], excluded: [], warnings: [] };
    renderCard({ entitlements: { isPro: false }, fetchImpl: makeFetchImpl(body) });
    await waitFor(() => expect(screen.getByTestId("nl-unavailable")).toBeInTheDocument());
    expect(screen.queryByText("nlUpgradeCta")).toBeNull();
    expect(screen.getByText("nlRetry")).toBeInTheDocument();
    expect(screen.queryByText(/^nlPill/)).toBeNull();
  });

  it("unambiguous no_darkness: natural non-error copy, no upgrade CTA, no poor-scoring treatment", async () => {
    const body = { ok: true, evening: "2026-06-01", auroraCache: { state: "fresh" }, viewingWindow: null, status: "unavailable", reason: "invalid_darkness_window", best: null, alternatives: [], excluded: [], warnings: [] };
    renderCard({ entitlements: { isPro: false }, fetchImpl: makeFetchImpl(body) });
    await waitFor(() => expect(screen.getByTestId("nl-no-darkness")).toBeInTheDocument());
    expect(screen.queryByText("nlUpgradeCta")).toBeNull();
    expect(screen.queryByText(/^nlPill/)).toBeNull();
  });

  it("transport error: neutral message and a working retry", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));
    renderCard({ fetchImpl });
    await waitFor(() => expect(screen.getByTestId("nl-transport-error")).toBeInTheDocument());
    fireEvent.click(screen.getByText("nlRetry"));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
  });

  it("unknown_location_ids contract defect: distinct branch, no ID leak, no upgrade CTA, no automatic retry loop", async () => {
    const fetchImpl = makeFetchImpl(
      { ok: false, code: "unknown_location_ids", error: "bad ids", details: { unknownIds: ["ghost-id-123"] } },
      false,
    );
    renderCard({ fetchImpl });
    await waitFor(() => expect(screen.getByTestId("nl-contract-defect")).toBeInTheDocument());
    expect(document.body.textContent).not.toContain("ghost-id-123");
    expect(screen.queryByText("nlUpgradeCta")).toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe("NorthernLightsCard — #397 mixed-band filtering, order, and cap (unchanged by #398)", () => {
  it("filters to only excellent/good/fair, preserves canonical order, and caps at six without backfill", async () => {
    const mixedBody = successBody({
      best: loc("loc-1", "excellent"),
      alternatives: [
        loc("loc-2", "poor"),
        loc("loc-3", "good"),
        loc("loc-4", "very-poor"),
        loc("loc-5", "fair"),
        loc("loc-6", "fair"),
        loc("loc-7", "good"),
        loc("loc-8", "excellent"),
      ],
    });
    renderCard({ entitlements: { isPro: true }, fetchImpl: makeFetchImpl(mixedBody) });
    await waitFor(() => expect(screen.getByText("nlBestTonight:loc-1")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "nlCtaGood" }));

    const rankedList = screen.getByRole("list", { name: "nlQualifyingHeading" });
    const items = within(rankedList).getAllByRole("listitem");
    expect(items).toHaveLength(6);
    expect(items.map((el) => el.textContent)).toEqual([
      expect.stringContaining("loc-1"),
      expect.stringContaining("loc-3"),
      expect.stringContaining("loc-5"),
      expect.stringContaining("loc-6"),
      expect.stringContaining("loc-7"),
      expect.stringContaining("loc-8"),
    ]);
  });
});

describe("NorthernLightsCard — #397/#398 all-poor state", () => {
  const allPoorBody = successBody({
    best: loc("loc-poor-1", "poor"),
    alternatives: [loc("loc-poor-2", "very-poor"), loc("loc-poor-3", "poor")],
  });

  it("Free: honest no-good-place headline, no six-place list, no map, no upgrade CTA, no identity leaked", async () => {
    renderCard({ entitlements: { isPro: false }, fetchImpl: makeFetchImpl(allPoorBody) });
    await waitFor(() => expect(screen.getByTestId("nl-all-poor")).toBeInTheDocument());
    expect(screen.getByText("nlHeadlinePoor")).toBeInTheDocument();
    expect(screen.getByText("nlPillPoor")).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByTestId("nl-map-container")).toBeNull();
    expect(screen.queryByText("nlUpgradeCta")).toBeNull();
    expect(screen.queryByText("nlFreeHint")).toBeNull();
    expect(document.body.textContent).not.toContain("loc-poor-1");
  });

  it("Pro: shows at most one canonical bestAvailable behind the details disclosure — never promoted into the headline, never the six-place list/map", async () => {
    renderCard({ entitlements: { isPro: true }, fetchImpl: makeFetchImpl(allPoorBody) });
    await waitFor(() => expect(screen.getByTestId("nl-all-poor")).toBeInTheDocument());
    expect(screen.queryByText("loc-poor-1")).toBeNull(); // not shown until expanded

    fireEvent.click(screen.getByRole("button", { name: "nlDetailsShow" }));
    expect(screen.getByText("loc-poor-1")).toBeInTheDocument();
    expect(document.getElementById("nl-all-poor-details-panel").textContent).toContain("nlBandPoor");
    expect(screen.queryByText("loc-poor-2")).toBeNull();
    expect(screen.queryByText("loc-poor-3")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByTestId("nl-map-container")).toBeNull();
  });

  it("a persisted expanded-details preference does not leak list/map content or fire their analytics in the all-poor state", async () => {
    sessionStorage.setItem("nl_details_expanded", "true");
    renderCard({ entitlements: { isPro: true }, fetchImpl: makeFetchImpl(allPoorBody) });
    await waitFor(() => expect(screen.getByTestId("nl-all-poor")).toBeInTheDocument());

    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByTestId("nl-map-container")).toBeNull();
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_ranking_viewed")).toBe(false);
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_map_viewed")).toBe(false);
  });
});

describe("NorthernLightsCard — #397 map visibility rule (>=2 qualifying, >=2 distinct bands), unchanged by #398", () => {
  it("shown with two-or-more qualifying locations across two distinct bands, receiving exact canonical order + bands", async () => {
    renderCard({
      entitlements: { isPro: true },
      fetchImpl: makeFetchImpl(successBody({ best: loc("loc-1", "excellent"), alternatives: [loc("loc-2", "fair")] })),
    });
    await waitFor(() => expect(screen.getByText("nlBestTonight:loc-1")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "nlCtaGood" }));
    const mapContainer = screen.getByTestId("nl-map-container");
    expect(mapContainer).toHaveTextContent("loc-1:excellent,loc-2:fair");
  });

  it("hidden with two-or-more qualifying locations that share the SAME band", async () => {
    renderCard({
      entitlements: { isPro: true },
      fetchImpl: makeFetchImpl(successBody({ best: loc("loc-1", "good"), alternatives: [loc("loc-2", "good")] })),
    });
    await waitFor(() => expect(screen.getByText("nlBestTonight:loc-1")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "nlCtaGood" }));
    expect(screen.queryByTestId("nl-map-container")).toBeNull();
  });

  it("map-view analytics never fires when the map is hidden, even with details expanded", async () => {
    renderCard({
      entitlements: { isPro: true },
      fetchImpl: makeFetchImpl(successBody({ best: loc("loc-1", "good"), alternatives: [loc("loc-2", "good")] })),
    });
    await waitFor(() => expect(screen.getByText("nlBestTonight:loc-1")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "nlCtaGood" }));
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_map_viewed")).toBe(false);
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_ranking_viewed")).toBe(true);
  });
});

describe("NorthernLightsCard — analytics exact-once, unaffected by visual redesign", () => {
  it("fires northern_lights_card_viewed exactly once per resolved identity, not per rerender/theme/language change", async () => {
    const fetchImpl = makeFetchImpl(successBody());
    const { rerender } = renderCard({ fetchImpl });
    await waitFor(() =>
      expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_card_viewed")).toHaveLength(1),
    );
    rerender(
      <NorthernLightsCard t={t} lang="en" entitlements={{ isPro: false }} onUpgrade={vi.fn()} theme="dark" now={IN_SEASON_NOW} fetchImpl={fetchImpl} />,
    );
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_card_viewed")).toHaveLength(1);
  });

  it("locked (Free) teaser never fires ranking/map viewed events", async () => {
    renderCard({ entitlements: { isPro: false } });
    await waitFor(() => expect(screen.getByText("nlHeadlineGood")).toBeInTheDocument());
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_ranking_viewed")).toBe(false);
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_map_viewed")).toBe(false);
  });

  it("Pro fires ranking_viewed and map_viewed exactly once when details are opened, not before, and not again on collapse/reopen", async () => {
    renderCard({ entitlements: { isPro: true } });
    await waitFor(() => expect(screen.getByText("nlBestTonight:" + BEST.name)).toBeInTheDocument());
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_ranking_viewed")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "nlCtaGood" }));
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_ranking_viewed")).toHaveLength(1);
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_map_viewed")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "nlDetailsHide" })); // collapse
    fireEvent.click(screen.getByRole("button", { name: "nlCtaGood" })); // re-expand
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_ranking_viewed")).toHaveLength(1);
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_map_viewed")).toHaveLength(1);
  });

  it("the New badge itself never emits an analytics event", async () => {
    renderCard();
    await waitFor(() => expect(screen.getByText("nlNewBadge")).toBeInTheDocument());
    expect(trackEvent.mock.calls.some((c) => String(c[0]).toLowerCase().includes("badge"))).toBe(false);
  });
});

describe("NorthernLightsCard — #398 temporary New badge", () => {
  it("renders the localized New badge (controlled by the single isolated flag) alongside the title", async () => {
    renderCard();
    await waitFor(() => expect(screen.getByText("nlCardTitle")).toBeInTheDocument());
    expect(screen.getByText("nlNewBadge")).toBeInTheDocument();
  });

  it.each(["is", "en"])("%s: New badge copy is real translated text, not the key itself", (lang) => {
    const dict = northernLightsTranslations[lang];
    expect(dict.nlNewBadge).toBeTypeOf("string");
    expect(dict.nlNewBadge).not.toBe("nlNewBadge");
  });
});

describe("NorthernLightsCard — real i18n copy exists for IS and EN (not just keys)", () => {
  it.each(["is", "en"])("%s: sample keys resolve to real translated copy, not the key itself", (lang) => {
    const dict = northernLightsTranslations[lang];
    for (const key of [
      "nlCardTitle",
      "nlPillGood",
      "nlHeadlineGood",
      "nlBodyGood",
      "nlPillFair",
      "nlHeadlineFair",
      "nlBodyFair",
      "nlPillPoor",
      "nlHeadlinePoor",
      "nlBodyPoor",
      "nlPillNeutral",
      "nlHeadlineNeutral",
      "nlBodyNeutral",
      "nlCtaGood",
      "nlCtaFair",
      "nlBestTonight",
      "nlFreeHint",
      "nlUpgradeCta",
      "nlNoDarknessTitle",
      "nlRetry",
    ]) {
      expect(dict[key]).toBeTypeOf("string");
      expect(dict[key]).not.toBe(key);
      expect(dict[key].length).toBeGreaterThan(0);
    }
    // Obsolete copy fully removed once superseded (approved prompt §8).
    expect(dict).not.toHaveProperty("nlAlternativesHeading");
    expect(dict).not.toHaveProperty("nlAllPoorTitle");
    expect(dict).not.toHaveProperty("nlAllPoorBody");
  });

  it("nlBestTonight carries a real {name} interpolation placeholder in both languages", () => {
    for (const lang of ["is", "en"]) {
      expect(northernLightsTranslations[lang].nlBestTonight).toContain("{name}");
    }
  });
});
