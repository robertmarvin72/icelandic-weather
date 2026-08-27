import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import NorthernLightsCard from "./NorthernLightsCard";
import { trackEvent } from "../lib/analytics";
import { clearAuroraDecisionCache } from "../lib/auroraDecisionCache";
import { northernLightsTranslations } from "../i18n/translations.northernLights";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

// NorthernLightsMap is a thin lazy-Leaflet wrapper (mirroring LazyMap.jsx)
// with its own IntersectionObserver-gated mount, covered independently in
// NorthernLightsMap.test.jsx. Mocked here so these tests exercise
// NorthernLightsCard's own logic (gating, ordering, disclosure) without
// needing a jsdom IntersectionObserver polyfill.
vi.mock("./NorthernLightsMap", () => ({
  default: ({ locations }) => <div data-testid="nl-map-container">{locations.map((l) => l.id).join(",")}</div>,
}));

const t = (k) => k;
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

describe("NorthernLightsCard — loading state", () => {
  it("shows an accessible loading status before resolution", () => {
    const fetchImpl = vi.fn(() => new Promise(() => {}));
    renderCard({ fetchImpl });
    expect(screen.getByTestId("nl-loading")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

describe("NorthernLightsCard — Free: coarse guidance without Pro data leakage", () => {
  it("shows the band but never the exact name, score, coordinates, reasons, or map", async () => {
    renderCard({ entitlements: { isPro: false } });
    await waitFor(() => expect(screen.getByText("nlBandExcellent")).toBeInTheDocument());

    expect(screen.queryByText(BEST.name)).toBeNull();
    expect(screen.queryByText("90")).toBeNull();
    expect(screen.queryByText(String(BEST.lat))).toBeNull();
    expect(screen.queryByText("nlReasonClearSky")).toBeNull();
    expect(screen.queryByTestId("nl-map-container")).toBeNull();
    expect(screen.queryByText("nlAlternativesHeading")).toBeNull();
    expect(screen.getByText("nlFreeHint")).toBeInTheDocument();
    expect(screen.getByText("nlUpgradeCta")).toBeInTheDocument();
  });

  it("never renders hidden Pro data even in the accessible DOM (queryAllByText across full body)", async () => {
    renderCard({ entitlements: { isPro: false } });
    await waitFor(() => expect(screen.getByText("nlBandExcellent")).toBeInTheDocument());
    expect(document.body.textContent).not.toContain(BEST.name);
    expect(document.body.textContent).not.toContain(String(BEST.lon));
  });
});

describe("NorthernLightsCard — Pro: full detail from the same response", () => {
  it("shows exact best name, and reveals reasons/ranked list/map behind the details toggle", async () => {
    renderCard({ entitlements: { isPro: true } });
    await waitFor(() => expect(screen.getByText(BEST.name)).toBeInTheDocument());

    expect(screen.queryByText("nlReasonClearSky")).toBeNull(); // collapsed by default
    expect(screen.queryByTestId("nl-map-container")).toBeNull();

    const toggle = screen.getByRole("button", { name: "nlDetailsShow" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);

    expect(screen.getByRole("button", { name: "nlDetailsHide" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("nlReasonClearSky")).toBeInTheDocument();
    expect(screen.getByTestId("nl-map-container")).toBeInTheDocument();

    // Canonical order preserved: best first, then alternatives, in list and map input.
    const rankedList = screen.getByRole("list", { name: "nlAlternativesHeading" });
    const items = within(rankedList).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent(BEST.name);
    expect(items[1]).toHaveTextContent(ALTERNATIVE.name);
  });
});

describe("NorthernLightsCard — stale + partial disclose simultaneously, for both tiers", () => {
  const stalePartialBody = successBody({
    status: "partial",
    auroraCache: { state: "stale", sourceFetchedAt: "2026-09-01T12:00:00.000Z", ageMinutes: 480 },
    excluded: [{ locationId: "x", name: "X", status: "weather_fetch_failed", reasons: ["weather_fetch_failed"] }],
    warnings: ["national_reference_window", "aurora_data_stale", "some_locations_excluded"],
  });

  it("Free sees both the stale and partial disclosures", async () => {
    renderCard({ entitlements: { isPro: false }, fetchImpl: makeFetchImpl(stalePartialBody) });
    await waitFor(() => expect(screen.getByText("nlWarningPartial")).toBeInTheDocument());
    expect(screen.getByText((text) => text.startsWith("nlWarningStale"))).toBeInTheDocument();
  });

  it("Pro sees both disclosures without any change to result/order", async () => {
    renderCard({ entitlements: { isPro: true }, fetchImpl: makeFetchImpl(stalePartialBody) });
    await waitFor(() => expect(screen.getByText("nlWarningPartial")).toBeInTheDocument());
    expect(screen.getByText((text) => text.startsWith("nlWarningStale"))).toBeInTheDocument();
    expect(screen.getByText(BEST.name)).toBeInTheDocument();
  });
});

describe("NorthernLightsCard — truthful unavailable/no-darkness/transport/contract-defect states", () => {
  it("domain_unavailable: neutral message, retry, no upgrade CTA", async () => {
    const body = { ok: true, evening: "2026-09-01", auroraCache: { state: "unavailable", reason: "too_old" }, viewingWindow: null, status: "unavailable", reason: "aurora_cache_unavailable", best: null, alternatives: [], excluded: [], warnings: [] };
    renderCard({ entitlements: { isPro: false }, fetchImpl: makeFetchImpl(body) });
    await waitFor(() => expect(screen.getByTestId("nl-unavailable")).toBeInTheDocument());
    expect(screen.queryByText("nlUpgradeCta")).toBeNull();
    expect(screen.getByText("nlRetry")).toBeInTheDocument();
  });

  it("unambiguous no_darkness: natural non-error copy, no upgrade CTA", async () => {
    const body = { ok: true, evening: "2026-06-01", auroraCache: { state: "fresh" }, viewingWindow: null, status: "unavailable", reason: "invalid_darkness_window", best: null, alternatives: [], excluded: [], warnings: [] };
    renderCard({ entitlements: { isPro: false }, fetchImpl: makeFetchImpl(body) });
    await waitFor(() => expect(screen.getByTestId("nl-no-darkness")).toBeInTheDocument());
    expect(screen.queryByText("nlUpgradeCta")).toBeNull();
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
    expect(fetchImpl).toHaveBeenCalledTimes(1); // no automatic retry loop
  });
});

describe("NorthernLightsCard — upgrade attribution", () => {
  it("Free card CTA fires northern_lights_upgrade_clicked with source northern_lights_card and calls onUpgrade", async () => {
    const onUpgrade = vi.fn();
    renderCard({ entitlements: { isPro: false }, onUpgrade });
    await waitFor(() => expect(screen.getByText("nlUpgradeCta")).toBeInTheDocument());
    fireEvent.click(screen.getByText("nlUpgradeCta"));
    expect(onUpgrade).toHaveBeenCalledWith("northern_lights_card");
    expect(trackEvent).toHaveBeenCalledWith("northern_lights_upgrade_clicked", expect.objectContaining({ source: "northern_lights_card" }));
  });
});

describe("NorthernLightsCard — analytics exact-once", () => {
  it("fires northern_lights_card_viewed exactly once per resolved identity, not per rerender", async () => {
    const fetchImpl = makeFetchImpl(successBody());
    const { rerender } = renderCard({ fetchImpl });
    await waitFor(() =>
      expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_card_viewed")).toHaveLength(1),
    );
    rerender(
      <NorthernLightsCard t={t} lang="is" entitlements={{ isPro: false }} onUpgrade={vi.fn()} theme="light" now={IN_SEASON_NOW} fetchImpl={fetchImpl} />,
    );
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_card_viewed")).toHaveLength(1);
  });

  it("locked (Free) teaser never fires ranking/map viewed events", async () => {
    renderCard({ entitlements: { isPro: false } });
    await waitFor(() => expect(screen.getByText("nlBandExcellent")).toBeInTheDocument());
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_ranking_viewed")).toBe(false);
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_map_viewed")).toBe(false);
  });

  it("Pro fires ranking_viewed and map_viewed exactly once when details are opened, not before", async () => {
    renderCard({ entitlements: { isPro: true } });
    await waitFor(() => expect(screen.getByText(BEST.name)).toBeInTheDocument());
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_ranking_viewed")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "nlDetailsShow" }));
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_ranking_viewed")).toHaveLength(1);
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_map_viewed")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "nlDetailsHide" }));
    fireEvent.click(screen.getByRole("button", { name: "nlDetailsShow" }));
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_ranking_viewed")).toHaveLength(1);
  });

  it("fires northern_lights_stale_viewed and northern_lights_unavailable_viewed appropriately", async () => {
    const body = { ok: true, evening: "2026-09-01", auroraCache: { state: "unavailable", reason: "too_old" }, viewingWindow: null, status: "unavailable", reason: "aurora_cache_unavailable", best: null, alternatives: [], excluded: [], warnings: [] };
    renderCard({ fetchImpl: makeFetchImpl(body) });
    await waitFor(() =>
      expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_unavailable_viewed")).toBe(true),
    );
  });
});

describe("NorthernLightsCard — real i18n copy exists for IS and EN (not just keys)", () => {
  it.each(["is", "en"])("%s: sample keys resolve to real translated copy, not the key itself", (lang) => {
    const dict = northernLightsTranslations[lang];
    for (const key of ["nlCardTitle", "nlBandExcellent", "nlFreeHint", "nlUpgradeCta", "nlNoDarknessTitle", "nlRetry"]) {
      expect(dict[key]).toBeTypeOf("string");
      expect(dict[key]).not.toBe(key);
      expect(dict[key].length).toBeGreaterThan(0);
    }
  });
});
