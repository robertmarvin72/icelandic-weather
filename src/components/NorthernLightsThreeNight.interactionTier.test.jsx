// Ticket #431 v2 — Ripley's corrective final-assessment REVISE on two gaps
// in v1's own already-approved items 4 and 6:
//  (a) immediate interaction events (night selection, details toggle, the
//      recommended-night action) could record a premature "free" guess
//      while entitlement resolution (loadingMe) was still in flight;
//  (b) the aurora map's marker click was wired to a no-op — a real,
//      user-initiated action was never measured at all.
// This file exercises both corrections directly, with the real
// NorthernLightsThreeNight/AuroraNightOutlook components (not mocked).
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NorthernLightsThreeNight from "./NorthernLightsThreeNight";
import { trackEvent } from "../lib/analytics";
import { clearAuroraDecisionCache } from "../lib/auroraDecisionCache";
import { AURORA_CANDIDATE_LOCATION_IDS } from "../config/auroraCandidates";
import { NL_FREE_EXPERIMENT_ID } from "../config/features";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));

// A richer map mock than the other NL test files' own (which never forward
// onSelect) — this one renders one clickable "marker" per location so a
// real user click can be simulated and the real onSelect(locationId)
// callback chain (AuroraNightOutlook -> NorthernLightsThreeNight) exercised
// end to end, exactly as MapView's own real marker click does
// (`onSelect?.(site.id)`, confirmed by reading MapView.jsx directly).
vi.mock("./NorthernLightsMap", () => ({
  default: ({ locations, onSelect }) => (
    <div data-testid="nl-map-container">
      {locations.map((l) => (
        <button key={l.id} type="button" data-testid={`marker-${l.id}`} onClick={() => onSelect(l.id)}>
          {l.id}:{l.band}
        </button>
      ))}
    </div>
  ),
}));

const t = (k) => (k === "nlMultiBestOn" ? "nlMultiBestOn:{when}:{name}" : k);
const IN_SEASON_NOW = () => new Date("2026-09-25T20:00:00.000Z");

function loc(id, score, band, name = id) {
  return { locationId: id, name, lat: 64, lon: -20, score, band, reasons: ["meaningful_activity", "clear_sky"], flags: [] };
}

function successBody(evening, entries) {
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
  };
}

function jsonResponse(body) {
  return { ok: true, status: 200, json: async () => body };
}

function routedFetchImpl(byEvening) {
  return vi.fn().mockImplementation((url, opts) => {
    const body = JSON.parse(opts.body);
    return Promise.resolve(jsonResponse(byEvening[body.evening]));
  });
}

// Two qualifying, differently-banded locations on every night, so the map
// (>=2 qualifying, >=2 distinct bands) is always eligible once details open.
function twoLocationFixtures() {
  return {
    "2026-09-25": successBody("2026-09-25", [
      loc(AURORA_CANDIDATE_LOCATION_IDS[0], 90, "excellent", "Night0 A"),
      loc(AURORA_CANDIDATE_LOCATION_IDS[1], 70, "good", "Night0 B"),
    ]),
    "2026-09-26": successBody("2026-09-26", [
      loc(AURORA_CANDIDATE_LOCATION_IDS[0], 85, "excellent", "Night1 A"),
      loc(AURORA_CANDIDATE_LOCATION_IDS[1], 65, "good", "Night1 B"),
    ]),
    "2026-09-27": successBody("2026-09-27", [
      loc(AURORA_CANDIDATE_LOCATION_IDS[0], 80, "excellent", "Night2 A"),
      loc(AURORA_CANDIDATE_LOCATION_IDS[1], 60, "good", "Night2 B"),
    ]),
  };
}

function element(props = {}) {
  return (
    <MemoryRouter>
      <NorthernLightsThreeNight
        t={t}
        lang="en"
        entitlements={{ isPro: false }}
        theme="light"
        now={IN_SEASON_NOW}
        loadingMe={false}
        fetchImpl={routedFetchImpl(twoLocationFixtures())}
        {...props}
      />
    </MemoryRouter>
  );
}
const renderModule = (props) => render(element(props));

beforeEach(() => {
  vi.clearAllMocks();
  clearAuroraDecisionCache();
  sessionStorage.clear();
});

describe("Ticket #431 v2 — interaction events never guess a tier while loadingMe is true", () => {
  it("night_selected: records user_tier 'unknown' while loading, then the real tier once resolved — no duplicate, no retroactive relabel", async () => {
    // The same fetchImpl instance is reused across the render and the
    // rerender below — a fresh mock function reference on rerender would
    // look like a genuinely new fetchImpl to the underlying hook and
    // reset the module back to its loading state, as every other real
    // render/rerender test in this suite already establishes.
    const fetchImpl = routedFetchImpl(twoLocationFixtures());
    const { rerender } = renderModule({ loadingMe: true, entitlements: { isPro: false }, fetchImpl });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /nlTabTomorrow/ }));
    expect(trackEvent).toHaveBeenCalledWith(
      "northern_lights_night_selected",
      expect.objectContaining({ selected_date: "2026-09-26", user_tier: "unknown", business_model_experiment: NL_FREE_EXPERIMENT_ID }),
    );
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_night_selected")).toHaveLength(1);

    // Entitlement resolution completes, truthfully as Pro.
    rerender(element({ loadingMe: false, entitlements: { isPro: true }, fetchImpl }));

    // The already-fired "unknown" event is never resent/relabeled.
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_night_selected")).toHaveLength(1);
    expect(trackEvent).toHaveBeenCalledWith(
      "northern_lights_night_selected",
      expect.objectContaining({ selected_date: "2026-09-26", user_tier: "unknown" }),
    );

    // A genuinely NEW interaction after resolution uses the real tier.
    // (Day index 2's tab label is a real computed weekday, not identity
    // text under this file's `t` — selected positionally, matching this
    // repo's own established convention for that case.)
    const dayTabs = screen.getByRole("group").querySelectorAll("button");
    fireEvent.click(dayTabs[2]);
    expect(trackEvent).toHaveBeenCalledWith(
      "northern_lights_night_selected",
      expect.objectContaining({ selected_date: "2026-09-27", user_tier: "pro" }),
    );
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_night_selected")).toHaveLength(2);
  });

  it("night_selected resolves to 'free' (not a guess — the genuine tier) when entitlement resolution confirms Free", async () => {
    const fetchImpl = routedFetchImpl(twoLocationFixtures());
    const { rerender } = renderModule({ loadingMe: true, entitlements: { isPro: false }, fetchImpl });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());

    rerender(element({ loadingMe: false, entitlements: { isPro: false }, fetchImpl }));
    fireEvent.click(screen.getByRole("button", { name: /nlTabTomorrow/ }));
    expect(trackEvent).toHaveBeenCalledWith(
      "northern_lights_night_selected",
      expect.objectContaining({ selected_date: "2026-09-26", user_tier: "free" }),
    );
  });

  it("details_opened: 'unknown' while loading, real tier after resolution, for a genuinely new toggle", async () => {
    const fetchImpl = routedFetchImpl(twoLocationFixtures());
    const { rerender } = renderModule({ loadingMe: true, entitlements: { isPro: false }, fetchImpl });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());

    fireEvent.click(screen.getByText(/nlCtaGood/));
    expect(trackEvent).toHaveBeenCalledWith("northern_lights_details_opened", { lang: "en", tier: "unknown", business_model_experiment: NL_FREE_EXPERIMENT_ID });
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_details_opened")).toHaveLength(1);

    // Collapse, resolve entitlement, then re-expand: a new interaction.
    fireEvent.click(screen.getByText(/nlDetailsHide/));
    rerender(element({ loadingMe: false, entitlements: { isPro: true }, fetchImpl }));
    fireEvent.click(screen.getByText(/nlCtaGood/));

    expect(trackEvent).toHaveBeenCalledWith("northern_lights_details_opened", { lang: "en", tier: "pro", business_model_experiment: NL_FREE_EXPERIMENT_ID });
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_details_opened")).toHaveLength(2);
    // The first ("unknown") call is still intact, untouched.
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_details_opened")[0][1].tier).toBe("unknown");
  });

  it("the recommended-night action ('see tonight' CTA) records 'unknown' tier on both events it fires while loading", async () => {
    // Eligibility for a "best_night" comparison requires the COMPLETE
    // configured 6-candidate set scored on every compared night (matching
    // NorthernLightsThreeNight.test.jsx's own established `allSix` pattern
    // for this exact scenario) — a single-location fixture per night is
    // "ineligible" and never renders the recommended-night CTA at all.
    // Tonight (day0, the default-selected night) is deliberately the POOR
    // one and tomorrow (day1) the recommended "best_night" — so clicking
    // the recommendation CTA genuinely changes the selection (selectNight
    // early-returns on a no-op re-selection of the already-current date),
    // firing both northern_lights_night_selected and _details_opened.
    const allSix = (baseScore, band) => AURORA_CANDIDATE_LOCATION_IDS.map((id, i) => loc(id, baseScore - i, band));
    renderModule({
      loadingMe: true,
      entitlements: { isPro: false },
      fetchImpl: routedFetchImpl({
        "2026-09-25": successBody("2026-09-25", allSix(35, "poor")),
        "2026-09-26": successBody("2026-09-26", allSix(95, "excellent")),
        "2026-09-27": successBody("2026-09-27", allSix(35, "poor")),
      }),
    });
    await waitFor(() => expect(screen.getByTestId("nl3-all-poor")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /nlCompSeeNight/ }));

    expect(trackEvent).toHaveBeenCalledWith("northern_lights_night_selected", expect.objectContaining({ selected_date: "2026-09-26", user_tier: "unknown" }));
    expect(trackEvent).toHaveBeenCalledWith("northern_lights_details_opened", expect.objectContaining({ tier: "unknown" }));
  });

  it("exposure events (card_viewed, best_night_viewed) are unaffected — they were already correctly gated by loadingMe in v1", async () => {
    renderModule({ loadingMe: true, entitlements: { isPro: false } });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_card_viewed")).toBe(false);
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_best_night_viewed")).toBe(false);
  });
});

describe("Ticket #431 v2 — northern_lights_location_selected: the real aurora map marker click", () => {
  async function openDetailsWithMap(props = {}) {
    renderModule(props);
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    fireEvent.click(screen.getByText(/nlCtaGood/));
    await waitFor(() => expect(screen.getByTestId("nl-map-container")).toBeInTheDocument());
  }

  it("fires exactly once, with correct location_id/selected_date/days_ahead/source metadata, only on an actual marker click", async () => {
    await openDetailsWithMap();
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_location_selected")).toBe(false); // map exposure alone never fires it

    fireEvent.click(screen.getByTestId(`marker-${AURORA_CANDIDATE_LOCATION_IDS[1]}`));

    expect(trackEvent).toHaveBeenCalledWith("northern_lights_location_selected", {
      location_id: AURORA_CANDIDATE_LOCATION_IDS[1],
      selected_date: "2026-09-25",
      days_ahead: 0,
      source: "landing",
      user_tier: "free",
      business_model_experiment: NL_FREE_EXPERIMENT_ID,
    });
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_location_selected")).toHaveLength(1);
  });

  it("records 'unknown' tier for a marker click that happens before entitlement resolution completes", async () => {
    await openDetailsWithMap({ loadingMe: true });
    fireEvent.click(screen.getByTestId(`marker-${AURORA_CANDIDATE_LOCATION_IDS[0]}`));
    expect(trackEvent).toHaveBeenCalledWith("northern_lights_location_selected", expect.objectContaining({ user_tier: "unknown" }));
  });

  it("reflects the CURRENTLY selected night at click time, not the night the map first opened under", async () => {
    await openDetailsWithMap({ entitlements: { isPro: true } });
    fireEvent.click(screen.getByRole("button", { name: /nlTabTomorrow/ }));
    await waitFor(() => expect(screen.getByTestId("nl-map-container")).toBeInTheDocument());

    fireEvent.click(screen.getByTestId(`marker-${AURORA_CANDIDATE_LOCATION_IDS[0]}`));
    expect(trackEvent).toHaveBeenCalledWith(
      "northern_lights_location_selected",
      expect.objectContaining({ selected_date: "2026-09-26", days_ahead: 1, user_tier: "pro" }),
    );
  });

  it("source=homepage when mounted on that surface", async () => {
    await openDetailsWithMap({ surface: "homepage" });
    fireEvent.click(screen.getByTestId(`marker-${AURORA_CANDIDATE_LOCATION_IDS[0]}`));
    expect(trackEvent).toHaveBeenCalledWith("northern_lights_location_selected", expect.objectContaining({ source: "homepage" }));
  });

  it("generic map wiring is preserved: the real locations/selectedId props still reach the map unchanged", async () => {
    await openDetailsWithMap();
    expect(screen.getByTestId(`marker-${AURORA_CANDIDATE_LOCATION_IDS[0]}`)).toHaveTextContent(`${AURORA_CANDIDATE_LOCATION_IDS[0]}:excellent`);
    expect(screen.getByTestId(`marker-${AURORA_CANDIDATE_LOCATION_IDS[1]}`)).toHaveTextContent(`${AURORA_CANDIDATE_LOCATION_IDS[1]}:good`);
  });
});
