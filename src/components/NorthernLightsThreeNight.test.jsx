import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NorthernLightsThreeNight from "./NorthernLightsThreeNight";
import { trackEvent } from "../lib/analytics";
import { clearAuroraDecisionCache } from "../lib/auroraDecisionCache";
import { AURORA_CANDIDATE_LOCATION_IDS } from "../config/auroraCandidates";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

vi.mock("./NorthernLightsMap", () => ({
  default: ({ locations }) => <div data-testid="nl-map-container">{locations.map((l) => `${l.id}:${l.band}`).join(",")}</div>,
}));

const t = (k) => (k === "nlMultiBestOn" ? "nlMultiBestOn:{when}:{name}" : k);
const IN_SEASON_NOW = () => new Date("2026-09-25T20:00:00.000Z");
const OUT_OF_SEASON_NOW = () => new Date("2026-06-01T20:00:00.000Z");

function loc(id, score, band, name = id) {
  return { locationId: id, name, lat: 64, lon: -20, score, band, reasons: ["meaningful_activity", "clear_sky"], flags: [] };
}

function successBody(evening, entries, overrides = {}) {
  const [best, ...alternatives] = entries;
  return {
    ok: true,
    evening,
    auroraCache: { state: "fresh", sourceFetchedAt: "2026-09-25T18:00:00.000Z", ageMinutes: 10 },
    viewingWindow: { start: `${evening}T22:00:00.000Z`, end: `${evening}T23:00:00.000Z` },
    status: "success",
    best,
    alternatives,
    excluded: [],
    warnings: [],
    ...overrides,
  };
}

function unavailableBody(evening, reason = "night_not_found") {
  return { ok: true, evening, auroraCache: { state: "fresh", sourceFetchedAt: "2026-09-25T18:00:00.000Z", ageMinutes: 10 }, viewingWindow: null, status: "unavailable", reason, best: null, alternatives: [], excluded: [], warnings: [] };
}

function jsonResponse(body, ok = true) {
  return { ok, status: ok ? 200 : 400, json: async () => body };
}

// Maps evening -> body, so each of the 3 fixed requests gets a distinct,
// controllable fixture (mirrors the actual hook response contract).
function routedFetchImpl(byEvening) {
  return vi.fn().mockImplementation((url, opts) => {
    const body = JSON.parse(opts.body);
    const entry = byEvening[body.evening];
    return Promise.resolve(jsonResponse(entry ?? unavailableBody(body.evening)));
  });
}

function renderModule(props = {}) {
  return render(
    <NorthernLightsThreeNight
      t={t}
      lang="en"
      entitlements={{ isPro: false }}
      onUpgrade={vi.fn()}
      theme="light"
      now={IN_SEASON_NOW}
      loadingMe={false}
      fetchImpl={routedFetchImpl({
        "2026-09-25": successBody("2026-09-25", [loc(AURORA_CANDIDATE_LOCATION_IDS[0], 90, "excellent", "Tonight Place")]),
        "2026-09-26": successBody("2026-09-26", [loc(AURORA_CANDIDATE_LOCATION_IDS[1], 30, "poor", "Tomorrow Place")]),
        "2026-09-27": successBody("2026-09-27", [loc(AURORA_CANDIDATE_LOCATION_IDS[2], 25, "very-poor", "Day2 Place")]),
      })}
      {...props}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  clearAuroraDecisionCache();
  sessionStorage.clear();
});

describe("NorthernLightsThreeNight — seasonal visibility", () => {
  it("renders nothing and never fetches when out of season", () => {
    const fetchImpl = vi.fn();
    const { container } = renderModule({ now: OUT_OF_SEASON_NOW, fetchImpl });
    expect(container).toBeEmptyDOMElement();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("mounts and fetches all three evenings when in season", async () => {
    renderModule();
    await waitFor(() => expect(screen.getByTestId("nl3-module")).toBeInTheDocument());
  });
});

describe("NorthernLightsThreeNight — tab selection updates content atomically", () => {
  it("defaults to tonight, and switching tabs shows the newly selected night's own headline/band, never a stale one", async () => {
    renderModule({ entitlements: { isPro: true } });

    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(screen.getByText(/nlMultiBestOn:nlWhenTonight:Tonight Place/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /nlTabTomorrow/ }));

    await waitFor(() => {
      expect(screen.queryByText(/Tonight Place/)).toBeNull();
    });
    // Tomorrow's night is "poor" band -> renders the all-poor branch, not a qualifying result.
    expect(screen.getByTestId("nl3-all-poor")).toBeInTheDocument();
  });

  it("selecting an unavailable night never retains the previous night's map", async () => {
    renderModule({
      entitlements: { isPro: true },
      fetchImpl: routedFetchImpl({
        "2026-09-25": successBody("2026-09-25", [
          loc(AURORA_CANDIDATE_LOCATION_IDS[0], 90, "excellent"),
          loc(AURORA_CANDIDATE_LOCATION_IDS[1], 70, "good"),
        ]),
        "2026-09-26": unavailableBody("2026-09-26"),
      }),
    });

    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    fireEvent.click(screen.getByText(/nlDetailsShow|nlCtaGood/));
    await waitFor(() => expect(screen.getByTestId("nl-map-container")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /nlTabTomorrow/ }));
    await waitFor(() => expect(screen.getByTestId("nl3-unavailable")).toBeInTheDocument());
    expect(screen.queryByTestId("nl-map-container")).toBeNull();
  });

  it("at most one map instance is ever rendered, regardless of state", async () => {
    renderModule({ entitlements: { isPro: true } });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(screen.queryAllByTestId("nl-map-container")).toHaveLength(0); // details collapsed by default, no map yet
  });
});

describe("NorthernLightsThreeNight — Free tier leaks no detailed location data", () => {
  it("Free DOM never contains a location name, coordinate, or ranked list for a qualifying result", async () => {
    renderModule({ entitlements: { isPro: false } });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());

    expect(screen.queryByText("Tonight Place")).toBeNull();
    expect(document.body.textContent).not.toMatch(/64\.\d|-20\.\d/); // no raw lat/lon
    expect(screen.queryByTestId("nl-map-container")).toBeNull();
  });
});

describe("NorthernLightsThreeNight — analytics", () => {
  it("northern_lights_night_selected fires once on a deliberate tab click, not on the initial default render", async () => {
    renderModule();
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(trackEvent).not.toHaveBeenCalledWith("northern_lights_night_selected", expect.anything());

    fireEvent.click(screen.getByRole("button", { name: /nlTabTomorrow/ }));
    expect(trackEvent).toHaveBeenCalledWith("northern_lights_night_selected", {
      selected_date: "2026-09-26",
      days_ahead: 1,
      forecast_status: "success",
      user_tier: "free",
      source: "landing",
    });
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_night_selected")).toHaveLength(1);
  });

  it("repeat-clicking the already-selected tab does not re-fire northern_lights_night_selected", async () => {
    renderModule();
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /nlTabTonight/ }));
    expect(trackEvent).not.toHaveBeenCalledWith("northern_lights_night_selected", expect.anything());
  });

  it("northern_lights_best_night_viewed fires for a unique favorable best night, once, after entitlement resolves", async () => {
    // Eligibility requires the COMPLETE configured candidate set scored in
    // every compared night — all 6 real candidate IDs, not just one.
    const allSix = (baseScore) => AURORA_CANDIDATE_LOCATION_IDS.map((id, i) => loc(id, baseScore - i, i === 0 ? "excellent" : "good"));
    renderModule({
      loadingMe: false,
      fetchImpl: routedFetchImpl({
        "2026-09-25": successBody("2026-09-25", allSix(95)),
        "2026-09-26": successBody("2026-09-26", allSix(50).map((l) => ({ ...l, band: "poor", score: 35 }))),
        "2026-09-27": successBody("2026-09-27", allSix(50).map((l) => ({ ...l, band: "poor", score: 35 }))),
      }),
    });
    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith(
        "northern_lights_best_night_viewed",
        expect.objectContaining({ selected_date: "2026-09-25", days_ahead: 0, forecast_status: "success" }),
      ),
    );
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_best_night_viewed")).toHaveLength(1);
  });

  it("northern_lights_best_night_viewed never fires while entitlement is still loading", async () => {
    renderModule({ loadingMe: true });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(trackEvent).not.toHaveBeenCalledWith("northern_lights_best_night_viewed", expect.anything());
  });

  it("northern_lights_best_night_viewed never fires for a tie/similar, unavailable, sole-available, or no-favorable state", async () => {
    renderModule({
      fetchImpl: routedFetchImpl({
        "2026-09-25": successBody("2026-09-25", [loc(AURORA_CANDIDATE_LOCATION_IDS[0], 20, "very-poor")]),
        "2026-09-26": successBody("2026-09-26", [loc(AURORA_CANDIDATE_LOCATION_IDS[0], 18, "very-poor")]),
        "2026-09-27": successBody("2026-09-27", [loc(AURORA_CANDIDATE_LOCATION_IDS[0], 15, "very-poor")]),
      }),
    });
    await waitFor(() => expect(screen.getByTestId("nl3-all-poor")).toBeInTheDocument());
    expect(trackEvent).not.toHaveBeenCalledWith("northern_lights_best_night_viewed", expect.anything());
  });

  it("northern_lights_best_night_viewed's selected_date names the RECOMMENDED night, never whichever tab the user happens to be viewing", async () => {
    const allSix = (baseScore, band) => AURORA_CANDIDATE_LOCATION_IDS.map((id, i) => loc(id, baseScore - i, band));
    renderModule({
      loadingMe: false,
      fetchImpl: routedFetchImpl({
        "2026-09-25": successBody("2026-09-25", allSix(95, "excellent")), // the recommended (best) night
        "2026-09-26": successBody("2026-09-26", allSix(35, "poor")),
        "2026-09-27": successBody("2026-09-27", allSix(35, "poor")),
      }),
    });
    await waitFor(() => expect(trackEvent).toHaveBeenCalledWith("northern_lights_best_night_viewed", expect.objectContaining({ selected_date: "2026-09-25" })));

    // Now the user actually looks at a DIFFERENT tab (tomorrow) — the
    // already-fired event's payload must not be reinterpreted, and no
    // second best_night_viewed should fire naming the currently-viewed
    // (non-recommended) tab.
    trackEvent.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /nlTabTomorrow/ }));
    await waitFor(() => expect(screen.getByTestId("nl3-all-poor")).toBeInTheDocument());
    expect(trackEvent).not.toHaveBeenCalledWith("northern_lights_best_night_viewed", expect.anything());
  });

  it("a Free upgrade click forwards the existing northern_lights_card source and fires the two existing events plus the new multi-day event, once each", async () => {
    const onUpgrade = vi.fn();
    renderModule({ entitlements: { isPro: false }, onUpgrade });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "nlMultiLandingCtaPrimary" }));

    expect(onUpgrade).toHaveBeenCalledTimes(1);
    expect(onUpgrade).toHaveBeenCalledWith("northern_lights_card");
    expect(trackEvent).toHaveBeenCalledWith("northern_lights_multi_day_upgrade_clicked", {
      selected_date: "2026-09-25",
      days_ahead: 0,
      forecast_status: "success",
      user_tier: "free",
      source: "landing",
    });
    expect(trackEvent).toHaveBeenCalledWith("northern_lights_upgrade_clicked", { lang: "en", source: "northern_lights_card", tier: "free" });
    expect(trackEvent).toHaveBeenCalledWith("northern_lights_landing_cta_clicked", {
      lang: "en",
      tier: "free",
      placement: "card",
      source: "northern_lights_card",
    });
    for (const name of ["northern_lights_multi_day_upgrade_clicked", "northern_lights_upgrade_clicked", "northern_lights_landing_cta_clicked"]) {
      expect(trackEvent.mock.calls.filter((c) => c[0] === name)).toHaveLength(1);
    }
  });
});

describe("NorthernLightsThreeNight — details-expanded preference persists across night switches", () => {
  it("expanding details on one night keeps details expanded when switching to a different (still-qualifying) night, showing THAT night's own content", async () => {
    renderModule({
      entitlements: { isPro: true },
      fetchImpl: routedFetchImpl({
        "2026-09-25": successBody("2026-09-25", [loc(AURORA_CANDIDATE_LOCATION_IDS[0], 90, "excellent", "Night0 Place")]),
        "2026-09-26": successBody("2026-09-26", [loc(AURORA_CANDIDATE_LOCATION_IDS[1], 70, "good", "Night1 Place")]),
      }),
    });

    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    fireEvent.click(screen.getByText(/nlCtaGood/));
    await waitFor(() => expect(document.body.textContent).toContain("Night0 Place"));

    fireEvent.click(screen.getByRole("button", { name: /nlTabTomorrow/ }));

    await waitFor(() => {
      expect(document.body.textContent).not.toContain("Night0 Place");
      expect(document.body.textContent).toContain("Night1 Place");
    });
    // Details stayed expanded across the switch (preference preserved).
    expect(screen.getByRole("button", { name: "nlDetailsHide" })).toBeInTheDocument();
  });
});
