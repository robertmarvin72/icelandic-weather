// Ticket #423 Phase 2 Round 5 — integration tests with REAL translations for
// truthful update time/aging, readable outlooks + accessibility, scoped
// comparison copy, and the restored landing analytics. Kept beside (not
// inside) NorthernLightsThreeNight.test.jsx, which retains the Round 4
// identity-translator tests unchanged.
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import NorthernLightsThreeNight from "./NorthernLightsThreeNight";
import { trackEvent } from "../lib/analytics";
import { clearAuroraDecisionCache } from "../lib/auroraDecisionCache";
import { AURORA_CANDIDATE_LOCATION_IDS } from "../config/auroraCandidates";
import { northernLightsTranslations } from "../i18n/translations.northernLights";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("./NorthernLightsMap", () => ({
  default: ({ locations }) => <div data-testid="nl-map-container">{locations.map((l) => `${l.id}:${l.band}`).join(",")}</div>,
}));

const tReal = (k) => northernLightsTranslations.en[k] ?? k;
const tRealIs = (k) => northernLightsTranslations.is[k] ?? k;
const NOW = () => new Date("2026-09-25T20:00:00.000Z");

function loc(id, score, band, name) {
  return { locationId: id, name, lat: 64, lon: -20, score, band, reasons: ["meaningful_activity", "clear_sky"], flags: [] };
}
const allSix = (baseScore, band) => AURORA_CANDIDATE_LOCATION_IDS.map((id, i) => loc(id, baseScore - i, band, `Place ${i + 1}`));
const mixedSix = () =>
  AURORA_CANDIDATE_LOCATION_IDS.map((id, i) => loc(id, 95 - i, i === 0 ? "excellent" : i === 1 ? "good" : "fair", `Place ${i + 1}`));

function successBody(evening, entries, sourceFetchedAt = "2026-09-25T18:00:00.000Z") {
  const [best, ...alternatives] = entries;
  return {
    ok: true,
    evening,
    auroraCache: { state: "fresh", sourceFetchedAt, ageMinutes: 0 },
    viewingWindow: { start: `${evening}T22:00:00.000Z`, end: `${evening}T23:00:00.000Z` },
    status: "success",
    best,
    alternatives,
    excluded: [],
    warnings: [],
  };
}

function unavailableBody(evening) {
  return {
    ok: true,
    evening,
    auroraCache: { state: "fresh", sourceFetchedAt: "2026-09-25T18:00:00.000Z", ageMinutes: 0 },
    viewingWindow: null,
    status: "unavailable",
    reason: "night_not_found",
    best: null,
    alternatives: [],
    excluded: [],
    warnings: [],
  };
}

const json = (body) => ({ ok: true, status: 200, json: async () => body });

function routed(byEvening) {
  return vi.fn().mockImplementation((url, opts) => {
    const { evening } = JSON.parse(opts.body);
    return Promise.resolve(json(byEvening[evening] ?? unavailableBody(evening)));
  });
}

function element(props = {}) {
  return (
    <NorthernLightsThreeNight
      t={tReal}
      lang="en"
      entitlements={{ isPro: false }}
      onUpgrade={vi.fn()}
      theme="light"
      now={NOW}
      loadingMe={false}
      fetchImpl={routed({
        "2026-09-25": successBody("2026-09-25", mixedSix()),
        "2026-09-26": successBody("2026-09-26", allSix(70, "good")),
        "2026-09-27": successBody("2026-09-27", allSix(30, "poor")),
      })}
      {...props}
    />
  );
}
const renderModule = (props) => render(element(props));

beforeEach(() => {
  vi.clearAllMocks();
  clearAuroraDecisionCache();
  sessionStorage.clear();
});

describe("truthful update time and aging", () => {
  it("shows each resolved night's own Aurora data update time (fresh and poor included), switching with the selected date", async () => {
    renderModule({
      fetchImpl: routed({
        "2026-09-25": successBody("2026-09-25", allSix(95, "excellent"), "2026-09-25T18:00:00.000Z"),
        "2026-09-26": successBody("2026-09-26", allSix(30, "poor"), "2026-09-25T15:00:00.000Z"),
      }),
    });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(screen.getByTestId("nl3-data-updated")).toHaveTextContent("Aurora data updated 2 hours ago");

    fireEvent.click(screen.getByRole("button", { name: /Tomorrow night/ }));
    await waitFor(() => expect(screen.getByTestId("nl3-all-poor")).toBeInTheDocument());
    expect(screen.getByTestId("nl3-data-updated")).toHaveTextContent("Aurora data updated 5 hours ago");
  });

  it("an over-age (>1440 min) result is expired: no ranking/map/winner, retry offered, no best-night event", async () => {
    const old = "2026-09-23T12:00:00.000Z";
    renderModule({
      entitlements: { isPro: true },
      fetchImpl: routed({
        "2026-09-25": successBody("2026-09-25", mixedSix(), old),
        "2026-09-26": successBody("2026-09-26", mixedSix(), old),
        "2026-09-27": successBody("2026-09-27", mixedSix(), old),
      }),
    });
    await waitFor(() => expect(screen.getByTestId("nl3-expired")).toBeInTheDocument());
    expect(screen.getByText("This Aurora forecast has expired. Refresh to check again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.queryByTestId("nl-map-container")).toBeNull();
    expect(document.body.textContent).not.toContain("Place 1");
    expect(screen.getByText("We couldn't determine conditions for the next three nights.")).toBeInTheDocument();
    expect(trackEvent).not.toHaveBeenCalledWith("northern_lights_best_night_viewed", expect.anything());
  });

  it("stale-but-usable results stay visible with the existing stale notice and update time", async () => {
    renderModule({ fetchImpl: routed({ "2026-09-25": successBody("2026-09-25", mixedSix(), "2026-09-25T04:00:00.000Z") }) });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(screen.getByText(/Data was last updated 16 hours ago/)).toBeInTheDocument();
    expect(screen.getByTestId("nl3-data-updated")).toHaveTextContent("16 hours ago");
  });
});

describe("readable outlooks and accessibility", () => {
  it("renders visible localized outlook text for every night, including loading and unavailable", async () => {
    let releaseNight3;
    renderModule({
      fetchImpl: vi.fn().mockImplementation((url, opts) => {
        const { evening } = JSON.parse(opts.body);
        if (evening === "2026-09-27") return new Promise((resolve) => (releaseNight3 = () => resolve(json(unavailableBody(evening)))));
        if (evening === "2026-09-26") return Promise.resolve(json(unavailableBody(evening)));
        return Promise.resolve(json(successBody(evening, mixedSix())));
      }),
    });
    const group = screen.getByRole("group", { name: "Northern Lights forecast" });
    await waitFor(() => expect(within(group).getByRole("button", { name: /Tonight.*Excellent conditions/ })).toBeInTheDocument());
    expect(within(group).getByRole("button", { name: /Tomorrow night.*Status unavailable/ })).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: /Checking…/ })).toBeInTheDocument();
    releaseNight3();
  });

  it("uses a labelled button group with aria-pressed — never a tablist of plain toggle buttons", async () => {
    renderModule();
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    const buttons = within(screen.getByRole("group", { name: "Northern Lights forecast" })).getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(buttons.map((b) => b.getAttribute("aria-pressed"))).toEqual(["true", "false", "false"]);
  });

  it("keyboard selection works on the real button elements", async () => {
    renderModule();
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    const tomorrow = screen.getByRole("button", { name: /Tomorrow night/ });
    tomorrow.focus();
    expect(document.activeElement).toBe(tomorrow);
    fireEvent.click(tomorrow); // keyboard activation of a <button> dispatches click
    expect(tomorrow).toHaveAttribute("aria-pressed", "true");
  });

  it("excellent stays distinct from good in both the overview and the selected-night pill (#414 purple)", async () => {
    renderModule();
    await waitFor(() => expect(screen.getByTestId("nl3-status-pill")).toBeInTheDocument());
    const pill = screen.getByTestId("nl3-status-pill");
    expect(pill).toHaveTextContent("Excellent conditions");
    expect(pill.className).toContain("purple");

    const group = screen.getByRole("group", { name: "Northern Lights forecast" });
    expect(within(group).getByRole("button", { name: /Tonight.*Excellent conditions/ })).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: /Tomorrow night.*Good conditions/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Tomorrow night/ }));
    await waitFor(() => expect(screen.getByTestId("nl3-status-pill")).toHaveTextContent("Good conditions"));
    expect(screen.getByTestId("nl3-status-pill").className).not.toContain("purple");
  });

  it("Free overview names only canonical outlooks — never a location name or coordinate", async () => {
    renderModule();
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    const group = screen.getByRole("group", { name: "Northern Lights forecast" });
    expect(group.textContent).not.toMatch(/Place|64\.|-20\./);
    expect(document.body.textContent).not.toMatch(/Place \d/);
  });

  it("Icelandic dictionary renders the same overview/pill/timestamp structure", async () => {
    renderModule({ t: tRealIs, lang: "is" });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(screen.getByTestId("nl3-status-pill")).toHaveTextContent("Frábær skilyrði");
    expect(screen.getByTestId("nl3-data-updated").textContent).toContain("Norðurljósagögn uppfærð");
  });
});

describe("comparison conclusions limited to available nights", () => {
  const twoUsable = (scoreA, scoreB, bandB = "good") => ({
    "2026-09-25": successBody("2026-09-25", allSix(scoreA, "good")),
    "2026-09-26": successBody("2026-09-26", allSix(scoreB, bandB)),
    "2026-09-27": unavailableBody("2026-09-27"),
  });

  it("two usable + one unavailable, unique best: explicitly limited to the available nights", async () => {
    renderModule({ fetchImpl: routed(twoUsable(90, 40, "poor")) });
    await waitFor(() => expect(screen.getByText("Best conditions among the available nights: tonight")).toBeInTheDocument());
    expect(screen.queryByText("Best conditions expected: tonight")).toBeNull();
  });

  it("two usable + one unavailable, similar: limited wording", async () => {
    renderModule({ fetchImpl: routed(twoUsable(80, 78)) });
    await waitFor(() => expect(screen.getByText("Similar conditions among the available nights: tonight, tomorrow night")).toBeInTheDocument());
    expect(screen.queryByText(/Similar conditions expected/)).toBeNull();
  });

  it("two usable + one unavailable, exact tie: limited wording", async () => {
    renderModule({ fetchImpl: routed(twoUsable(80, 80)) });
    await waitFor(() => expect(screen.getByText("Conditions are evenly matched among the available nights: tonight, tomorrow night")).toBeInTheDocument());
  });

  it("all three usable keeps the unscoped wording", async () => {
    renderModule({
      fetchImpl: routed({
        "2026-09-25": successBody("2026-09-25", allSix(95, "excellent")),
        "2026-09-26": successBody("2026-09-26", allSix(35, "poor")),
        "2026-09-27": successBody("2026-09-27", allSix(35, "poor")),
      }),
    });
    await waitFor(() => expect(screen.getByText("Best conditions expected: tonight")).toBeInTheDocument());
  });

  it("scoped copy exists in both languages", () => {
    for (const key of ["nlCompBestNightScoped", "nlCompSimilarScoped", "nlCompExactTieScoped"]) {
      expect(northernLightsTranslations.is[key]).toBeTruthy();
      expect(northernLightsTranslations.en[key]).toBeTruthy();
    }
  });
});

describe("restored landing analytics", () => {
  const cardViewed = () => trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_card_viewed");
  const scenario = () =>
    routed({
      "2026-09-25": successBody("2026-09-25", mixedSix()),
      "2026-09-26": successBody("2026-09-26", allSix(30, "poor")),
      "2026-09-27": unavailableBody("2026-09-27"),
    });

  it("card_viewed fires once for the selected night with the original payload, never for background nights", async () => {
    renderModule({ fetchImpl: scenario() });
    await waitFor(() => expect(cardViewed()).toHaveLength(1));
    expect(cardViewed()[0][1]).toEqual({ lang: "en", outcome: "success", freshness: "fresh", band: "excellent", tier: "free", resultState: "qualifying" });
    await waitFor(() => expect(within(screen.getByRole("group")).getByRole("button", { name: /Tomorrow night.*Low chance/ })).toBeInTheDocument());
    expect(cardViewed()).toHaveLength(1);
  });

  it("switching exposes the new night once; switching back and rerendering do not duplicate", async () => {
    const { rerender } = renderModule({ fetchImpl: scenario() });
    await waitFor(() => expect(cardViewed()).toHaveLength(1));

    fireEvent.click(screen.getByRole("button", { name: /Tomorrow night/ }));
    await waitFor(() => expect(cardViewed()).toHaveLength(2));
    expect(cardViewed()[1][1]).toMatchObject({ outcome: "success", band: "poor", resultState: "all_poor" });

    fireEvent.click(screen.getByRole("button", { name: /Tonight/ }));
    expect(cardViewed()).toHaveLength(2);

    rerender(element({ fetchImpl: scenario() }));
    expect(cardViewed()).toHaveLength(2);
  });

  it("an unavailable selected night fires card_viewed + unavailable_viewed; a same-outcome retry does not re-fire", async () => {
    renderModule({ fetchImpl: scenario() });
    await waitFor(() => expect(cardViewed()).toHaveLength(1));
    fireEvent.click(screen.getByRole("button", { name: /Sunday/ }));
    await waitFor(() => expect(screen.getByTestId("nl3-unavailable")).toBeInTheDocument());
    expect(trackEvent).toHaveBeenCalledWith("northern_lights_unavailable_viewed", { lang: "en", outcome: "domain_unavailable", tier: "free" });
    const before = trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_unavailable_viewed").length;

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByTestId("nl3-unavailable")).toBeInTheDocument());
    expect(trackEvent.mock.calls.filter((c) => c[0] === "northern_lights_unavailable_viewed")).toHaveLength(before);
  });

  it("stale_viewed fires only for a visible usable stale result", async () => {
    renderModule({ fetchImpl: routed({ "2026-09-25": successBody("2026-09-25", mixedSix(), "2026-09-25T04:00:00.000Z") }) });
    await waitFor(() => expect(trackEvent).toHaveBeenCalledWith("northern_lights_stale_viewed", { lang: "en", outcome: "success", tier: "free" }));
    expect(cardViewed()[0][1]).toMatchObject({ freshness: "stale" });
  });

  it("holds tier-bearing exposure events while entitlement is loading, then fires once with the real tier", async () => {
    const fetchImpl = scenario();
    const { rerender } = renderModule({ loadingMe: true, fetchImpl });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(cardViewed()).toHaveLength(0);

    rerender(element({ loadingMe: false, entitlements: { isPro: true }, fetchImpl }));
    await waitFor(() => expect(cardViewed()).toHaveLength(1));
    expect(cardViewed()[0][1].tier).toBe("pro");
  });

  it("Free never fires details/ranking/map events", async () => {
    renderModule({ fetchImpl: scenario() });
    await waitFor(() => expect(cardViewed()).toHaveLength(1));
    for (const name of ["northern_lights_details_opened", "northern_lights_ranking_viewed", "northern_lights_map_viewed"]) {
      expect(trackEvent.mock.calls.some((c) => c[0] === name)).toBe(false);
    }
  });

  it("Pro: details_opened, ranking_viewed and map_viewed each fire once, only once details are actually shown", async () => {
    renderModule({ entitlements: { isPro: true }, fetchImpl: scenario() });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_ranking_viewed")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "See the best spots" }));
    await waitFor(() => expect(screen.getByTestId("nl-map-container")).toBeInTheDocument());

    expect(trackEvent).toHaveBeenCalledWith("northern_lights_details_opened", { lang: "en", tier: "pro" });
    expect(trackEvent).toHaveBeenCalledWith("northern_lights_ranking_viewed", { lang: "en", tier: "pro" });
    expect(trackEvent).toHaveBeenCalledWith("northern_lights_map_viewed", { lang: "en", tier: "pro" });
    for (const name of ["northern_lights_details_opened", "northern_lights_ranking_viewed", "northern_lights_map_viewed"]) {
      expect(trackEvent.mock.calls.filter((c) => c[0] === name)).toHaveLength(1);
    }
  });

  it("Pro with details expanded: switching to an all-poor night fires no ranking/map exposure for it", async () => {
    renderModule({ entitlements: { isPro: true }, fetchImpl: scenario() });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "See the best spots" }));
    await waitFor(() => expect(screen.getByTestId("nl-map-container")).toBeInTheDocument());
    trackEvent.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /Tomorrow night/ }));
    await waitFor(() => expect(screen.getByTestId("nl3-all-poor")).toBeInTheDocument());
    expect(trackEvent.mock.calls.some((c) => c[0] === "northern_lights_ranking_viewed" || c[0] === "northern_lights_map_viewed")).toBe(false);
  });
});
