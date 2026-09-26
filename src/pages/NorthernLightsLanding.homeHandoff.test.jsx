// Ticket #425 — real-component router integration for the homepage three-night
// module and its hand-off to the English landing page. Nothing here mocks the
// shared module, hook, policy or presentation: the homepage side is the real
// NorthernLightsThreeNight (surface="homepage") and the destination is the
// real NorthernLightsLanding, both inside one MemoryRouter, fed by one
// deterministic global fetch stub. Only analytics, auth (useMe), Helmet and
// the Leaflet wrapper are stubbed.
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import NorthernLightsThreeNight from "../components/NorthernLightsThreeNight";
import NorthernLightsLanding from "./NorthernLightsLanding";
import { trackEvent } from "../lib/analytics";
import { clearAuroraDecisionCache } from "../lib/auroraDecisionCache";
import { AURORA_CANDIDATE_LOCATION_IDS } from "../config/auroraCandidates";
import { northernLightsTranslations } from "../i18n/translations.northernLights";

vi.mock("react-helmet-async", () => ({ Helmet: ({ children }) => <>{children}</>, HelmetProvider: ({ children }) => <>{children}</> }));
vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../hooks/useMe", () => ({ useMe: vi.fn() }));
vi.mock("../components/NorthernLightsMap", () => ({
  default: ({ locations }) => <div data-testid="nl-map-container">{locations.map((l) => l.id).join(",")}</div>,
}));

import { useMe } from "../hooks/useMe";

const D0 = "2026-09-25";
const D1 = "2026-09-26";
const D2 = "2026-09-27";
const FETCHED = "2026-09-25T18:00:00.000Z";

const tFor = (lang) => (k) => northernLightsTranslations[lang][k] ?? k;

function loc(id, score, band, name) {
  return { locationId: id, name, lat: 64, lon: -20, score, band, reasons: ["meaningful_activity", "clear_sky"], flags: [] };
}
const six = (base, bandFn, tag) => AURORA_CANDIDATE_LOCATION_IDS.map((id, i) => loc(id, base - i, bandFn(i), `${tag} ${i + 1}`));
function body(evening, entries) {
  const [best, ...alternatives] = entries;
  return {
    ok: true,
    evening,
    auroraCache: { state: "fresh", sourceFetchedAt: FETCHED, ageMinutes: 0 },
    viewingWindow: { start: `${evening}T22:00:00.000Z`, end: `${evening}T23:00:00.000Z` },
    status: "success",
    best,
    alternatives,
    excluded: [],
    warnings: [],
  };
}
const unavailable = (evening) => ({
  ok: true,
  evening,
  auroraCache: { state: "fresh", sourceFetchedAt: FETCHED, ageMinutes: 0 },
  viewingWindow: null,
  status: "unavailable",
  reason: "night_not_found",
  best: null,
  alternatives: [],
  excluded: [],
  warnings: [],
});

const FIXTURES = () => ({
  [D0]: body(D0, six(95, (i) => (i === 0 ? "excellent" : i === 1 ? "good" : "fair"), "Night0 Spot")),
  [D1]: body(D1, six(70, () => "good", "Night1 Spot")),
  [D2]: body(D2, six(30, () => "poor", "Night2 Spot")),
});

let fetchMock;
function stubFetch(byEvening = FIXTURES(), gate = null) {
  fetchMock = vi.fn(async (url, opts) => {
    if (String(url).includes("/api/aurora-decision")) {
      const { evening } = JSON.parse(opts.body);
      if (gate) await gate;
      return { ok: true, status: 200, json: async () => byEvening[evening] ?? unavailable(evening) };
    }
    return { ok: false, status: 404, json: async () => null };
  });
  vi.stubGlobal("fetch", fetchMock);
}
const auroraCalls = () => fetchMock.mock.calls.filter((c) => String(c[0]).includes("/api/aurora-decision"));

const events = (name) => trackEvent.mock.calls.filter((c) => c[0] === name);

function Probe() {
  const location = useLocation();
  return <div data-testid="loc">{location.pathname + location.search}</div>;
}
function NavButtons() {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate(-1)}>history-back</button>
      <button onClick={() => navigate(1)}>history-forward</button>
    </>
  );
}

function HomeHost({ lang = "is", isPro = false, onUpgrade = vi.fn(), loadingMe = false }) {
  return (
    <div id="northern-lights">
      <NorthernLightsThreeNight t={tFor(lang)} lang={lang} entitlements={{ isPro }} onUpgrade={onUpgrade} theme="light" loadingMe={loadingMe} surface="homepage" />
    </div>
  );
}

function renderApp(entry = "/", homeProps = {}, initialEntries) {
  return render(
    <MemoryRouter initialEntries={initialEntries ?? [entry]} initialIndex={initialEntries ? initialEntries.length - 1 : 0}>
      <Probe />
      <NavButtons />
      <Routes>
        <Route path="/" element={<HomeHost {...homeProps} />} />
        <Route path="/en/northern-lights" element={<NorthernLightsLanding />} />
      </Routes>
    </MemoryRouter>,
  );
}

const group = () => screen.getByRole("group", { name: /Northern Lights forecast|Norðurljósaspá/ });
const pressed = () => within(group()).getAllByRole("button").find((b) => b.getAttribute("aria-pressed") === "true");
const landingPath = (date) => `/en/northern-lights?date=${date}`;

beforeEach(() => {
  vi.clearAllMocks();
  clearAuroraDecisionCache();
  sessionStorage.clear();
  localStorage.clear();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-25T20:00:00.000Z"));
  useMe.mockReturnValue({ me: { ok: true, user: null, entitlements: { pro: false, proUntil: null } }, loadingMe: false, refetchMe: vi.fn() });
  stubFetch();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("homepage module (real shared components)", () => {
  it("Icelandic homepage: IS text, one data owner, 3 requests, and a details link that names the English page", async () => {
    renderApp("/", { lang: "is" });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(screen.getByText("Norðurljósaspá")).toBeInTheDocument();
    expect(screen.getAllByTestId("nl3-module")).toHaveLength(1);
    expect(auroraCalls()).toHaveLength(3);

    const link = screen.getByTestId("nl3-details-link");
    expect(link).toHaveTextContent("Sjá nánar á ensku síðunni");
    expect(link.getAttribute("href")).toBe(landingPath(D0));
  });

  it("English homepage: normal detail-page copy and the same three requests", async () => {
    renderApp("/", { lang: "en" });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(screen.getByTestId("nl3-details-link")).toHaveTextContent("See full details for this night");
    expect(auroraCalls()).toHaveLength(3);
  });

  it("selection updates in place with no extra request, and the link follows the SELECTED evening (including an unavailable one)", async () => {
    stubFetch({ ...FIXTURES(), [D2]: unavailable(D2) });
    renderApp("/", { lang: "en" });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Tomorrow night/ }));
    expect(screen.getByTestId("nl3-details-link").getAttribute("href")).toBe(landingPath(D1));

    fireEvent.click(within(group()).getAllByRole("button")[2]); // day 2, unavailable
    await waitFor(() => expect(screen.getByTestId("nl3-unavailable")).toBeInTheDocument());
    expect(screen.getByTestId("nl3-details-link").getAttribute("href")).toBe(landingPath(D2));
    expect(screen.getByTestId("loc")).toHaveTextContent(/^\/$/); // homepage never rewrites its own URL
    expect(auroraCalls()).toHaveLength(3);
  });

  it("the details link is not a second recommendation: it uses the selected date, never the recommended one", async () => {
    renderApp("/", { lang: "en" });
    await waitFor(() => expect(screen.getByText("Best conditions expected: tonight")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Tomorrow night/ }));
    // Recommended night is still tonight; the link points at the selected one.
    expect(screen.getByText("Best conditions expected: tonight")).toBeInTheDocument();
    expect(screen.getByTestId("nl3-details-link").getAttribute("href")).toBe(landingPath(D1));
  });

  it("shows no landing marketing block on the homepage; Free gets the compact hint and one upgrade button", async () => {
    renderApp("/", { lang: "en" });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(screen.queryByText("Pro shows you:")).toBeNull();
    expect(screen.getByText("Conditions may be worth checking somewhere in Iceland.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "See where and why (Pro)" })).toHaveLength(1);
  });

  it("Free DOM leaks no location identity, coordinates or reasons on the homepage", async () => {
    renderApp("/", { lang: "en" });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(document.body.textContent).not.toMatch(/Night\d Spot|64\.|-20\.|Meaningful aurora activity|Clear sky/);
    expect(screen.queryByTestId("nl-map-container")).toBeNull();
  });

  it("season off: renders nothing and makes zero Aurora requests", async () => {
    vi.setSystemTime(new Date("2026-06-15T20:00:00.000Z"));
    renderApp("/", { lang: "en" });
    expect(screen.queryByTestId("nl3-module")).toBeNull();
    expect(auroraCalls()).toHaveLength(0);
  });
});

describe("homepage analytics", () => {
  it("landing-only CTA event never fires on the homepage; the two shared events do, with source metadata; checkout source unchanged", async () => {
    const onUpgrade = vi.fn();
    renderApp("/", { lang: "en", onUpgrade });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "See where and why (Pro)" }));

    expect(onUpgrade).toHaveBeenCalledTimes(1);
    expect(onUpgrade).toHaveBeenCalledWith("northern_lights_card");
    expect(events("northern_lights_landing_cta_clicked")).toHaveLength(0);
    expect(events("northern_lights_upgrade_clicked")).toEqual([["northern_lights_upgrade_clicked", { lang: "en", source: "northern_lights_card", tier: "free" }]]);
    expect(events("northern_lights_multi_day_upgrade_clicked")).toEqual([
      ["northern_lights_multi_day_upgrade_clicked", { selected_date: D0, days_ahead: 0, forecast_status: "success", user_tier: "free", source: "homepage" }],
    ]);
  });

  it("night_selected carries source=homepage and exact metadata, once per genuine different-date selection; same-date clicks fire nothing", async () => {
    renderApp("/", { lang: "en" });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(events("northern_lights_night_selected")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: /Tonight/ })); // same date
    expect(events("northern_lights_night_selected")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: /Tomorrow night/ }));
    expect(events("northern_lights_night_selected")).toEqual([
      ["northern_lights_night_selected", { selected_date: D1, days_ahead: 1, forecast_status: "success", user_tier: "free", source: "homepage" }],
    ]);
  });

  it("the recommendation CTA counts as a selection (source=homepage); following the details link is navigation, not a selection", async () => {
    renderApp("/", { lang: "en" });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Tomorrow night/ }));
    expect(events("northern_lights_night_selected")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "See tonight" })); // recommendation CTA -> different date
    expect(events("northern_lights_night_selected")).toHaveLength(2);
    expect(events("northern_lights_night_selected")[1][1]).toMatchObject({ selected_date: D0, source: "homepage" });

    const before = events("northern_lights_night_selected").length;
    fireEvent.click(screen.getByTestId("nl3-details-link"));
    await waitFor(() => expect(screen.getByTestId("loc")).toHaveTextContent(landingPath(D0)));
    expect(events("northern_lights_night_selected")).toHaveLength(before); // navigation only
  });

  it("best_night_viewed records source=homepage once", async () => {
    renderApp("/", { lang: "en" });
    await waitFor(() => expect(events("northern_lights_best_night_viewed")).toHaveLength(1));
    expect(events("northern_lights_best_night_viewed")[0][1]).toEqual({ selected_date: D0, days_ahead: 0, forecast_status: "success", user_tier: "free", source: "homepage" });
  });

  it("holds exposure events while entitlement loading is unresolved, then records the real tier", async () => {
    const { rerender } = renderApp("/", { lang: "en", loadingMe: true, isPro: true });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(events("northern_lights_card_viewed")).toHaveLength(0);
    expect(events("northern_lights_best_night_viewed")).toHaveLength(0);

    rerender(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<HomeHost lang="en" isPro loadingMe={false} />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(events("northern_lights_card_viewed").length).toBeGreaterThan(0));
    expect(events("northern_lights_card_viewed").every((c) => c[1].tier === "pro")).toBe(true);
  });
});

describe("homepage -> landing hand-off", () => {
  it.each([
    ["is", "Annað kvöld", D1, "Good conditions"],
    ["en", "Tomorrow night", D1, "Good conditions"],
  ])("%s homepage: choose tomorrow, follow the link, landing selects the same night with the same content", async (lang, tabName, date, pillText) => {
    renderApp("/", { lang });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: new RegExp(tabName) }));
    expect(screen.getByTestId("nl3-status-pill")).toHaveTextContent(lang === "is" ? "Góð skilyrði" : pillText);

    const before = events("northern_lights_night_selected").length;
    fireEvent.click(screen.getByTestId("nl3-details-link"));

    await waitFor(() => expect(screen.getByTestId("loc")).toHaveTextContent(landingPath(date)));
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument());
    expect(screen.getByText("Northern Lights forecast")).toBeInTheDocument(); // forced English
    await waitFor(() => expect(pressed()).toHaveTextContent(/Tomorrow night/));
    expect(screen.getByTestId("nl3-status-pill")).toHaveTextContent("Good conditions");
    expect(events("northern_lights_night_selected")).toHaveLength(before); // hydration is not a selection
    expect(auroraCalls()).toHaveLength(3); // cache reuse: no refetch on the landing page
  });

  it("day 2: an all-poor night carries over and shows its own content on the landing page", async () => {
    renderApp("/", { lang: "en" });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    fireEvent.click(within(group()).getAllByRole("button")[2]);
    await waitFor(() => expect(screen.getByTestId("nl3-all-poor")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("nl3-details-link"));
    await waitFor(() => expect(screen.getByTestId("loc")).toHaveTextContent(landingPath(D2)));
    await waitFor(() => expect(screen.getByTestId("nl3-all-poor")).toBeInTheDocument());
    expect(pressed()).toHaveTextContent(/Low chance/);
  });

  it("identical fixtures give an identical summary and selected canonical content on home and landing", async () => {
    const home = renderApp("/", { lang: "en" });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    const homeSummary = screen.getByText(/Best conditions expected/).textContent;
    const homePill = screen.getByTestId("nl3-status-pill").textContent;
    const homeOverview = within(group()).getAllByRole("button").map((b) => b.textContent);
    home.unmount();

    renderApp(landingPath(D0));
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(screen.getByText(/Best conditions expected/).textContent).toBe(homeSummary);
    expect(screen.getByTestId("nl3-status-pill").textContent).toBe(homePill);
    expect(within(group()).getAllByRole("button").map((b) => b.textContent)).toEqual(homeOverview);
  });
});

describe("landing query handling", () => {
  it.each([
    ["impossible calendar date", "?date=2026-02-30"],
    ["malformed", "?date=tomorrow"],
    ["duplicate parameters", `?date=${D1}&date=${D2}`],
    ["out-of-window (future)", "?date=2026-09-30"],
    ["out-of-window (past)", "?date=2026-09-24"],
  ])("%s falls back to tonight, normalizes the query, and fires no selection event", async (_label, query) => {
    renderApp(`/en/northern-lights${query}`);
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(pressed()).toHaveTextContent(/Tonight/);
    await waitFor(() => expect(screen.getByTestId("loc")).toHaveTextContent(landingPath(D0)));
    expect(events("northern_lights_night_selected")).toHaveLength(0);
    expect(auroraCalls()).toHaveLength(3); // the replace did not refetch or loop
  });

  it("a missing date defaults to tonight without writing anything to the URL", async () => {
    renderApp("/en/northern-lights");
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(pressed()).toHaveTextContent(/Tonight/);
    expect(screen.getByTestId("loc")).toHaveTextContent(/^\/en\/northern-lights$/);
    expect(events("northern_lights_night_selected")).toHaveLength(0);
  });

  it("a valid deep link selects its date immediately (before results) and keeps it after results, never overridden by the recommended night", async () => {
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    stubFetch(FIXTURES(), gate);
    renderApp(landingPath(D2));
    expect(pressed()).toHaveTextContent(/Checking…/); // day 2 selected while everything is pending
    expect(screen.getByTestId("nl3-loading")).toBeInTheDocument();

    await act(async () => {
      release();
    });
    await waitFor(() => expect(screen.getByTestId("nl3-all-poor")).toBeInTheDocument());
    expect(screen.getByText("Best conditions expected: tonight")).toBeInTheDocument(); // recommendation exists...
    expect(pressed()).toHaveTextContent(/Low chance/); // ...but never took over the selection
    expect(events("northern_lights_night_selected")).toHaveLength(0);
  });

  it("a valid but unavailable date stays selected and shows its own explanation", async () => {
    stubFetch({ ...FIXTURES(), [D2]: unavailable(D2) });
    renderApp(landingPath(D2));
    await waitFor(() => expect(screen.getByTestId("nl3-unavailable")).toBeInTheDocument());
    expect(pressed()).toHaveTextContent(/Status unavailable/);
    expect(screen.getByTestId("loc")).toHaveTextContent(landingPath(D2));
  });

  it("user selection replaces the query (no history entry), preserves unrelated params, and fires one source=landing event", async () => {
    renderApp("/", {}, ["/", `/en/northern-lights?utm_source=news&date=${D1}`]);
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(pressed()).toHaveTextContent(/Tomorrow night/);

    fireEvent.click(within(group()).getAllByRole("button")[2]);
    await waitFor(() => expect(screen.getByTestId("loc").textContent).toContain(`date=${D2}`));
    expect(screen.getByTestId("loc").textContent).toContain("utm_source=news");
    expect(events("northern_lights_night_selected")).toEqual([
      ["northern_lights_night_selected", { selected_date: D2, days_ahead: 2, forecast_status: "success", user_tier: "free", source: "landing" }],
    ]);
    expect(auroraCalls()).toHaveLength(3);

    // REPLACE semantics: one back step leaves the landing page entirely.
    fireEvent.click(screen.getByText("history-back"));
    await waitFor(() => expect(screen.getByTestId("loc")).toHaveTextContent(/^\/$/));
  });

  it("browser back/forward re-select the matching date without a selection event or extra request", async () => {
    renderApp("/", {}, [landingPath(D1), landingPath(D2)]);
    await waitFor(() => expect(screen.getByTestId("nl3-all-poor")).toBeInTheDocument());
    expect(pressed()).toHaveTextContent(/Low chance/); // D2

    fireEvent.click(screen.getByText("history-back"));
    await waitFor(() => expect(pressed()).toHaveTextContent(/Tomorrow night/));
    fireEvent.click(screen.getByText("history-forward"));
    await waitFor(() => expect(pressed()).toHaveTextContent(/Low chance/));

    expect(events("northern_lights_night_selected")).toHaveLength(0);
    expect(auroraCalls()).toHaveLength(3);
    expect(screen.getByTestId("loc")).toHaveTextContent(landingPath(D2)); // no URL/state loop
  });

  it("landing keeps its own analytics: source=landing and the landing-only CTA event with the unchanged checkout source", async () => {
    const { container } = renderApp(landingPath(D0));
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    const moduleEl = within(container.querySelector('[data-testid="nl3-module"]'));
    fireEvent.click(moduleEl.getByRole("button", { name: "Show me where to go" }));
    expect(events("northern_lights_landing_cta_clicked")).toEqual([
      ["northern_lights_landing_cta_clicked", { lang: "en", tier: "free", placement: "card", source: "northern_lights_card" }],
    ]);
    expect(events("northern_lights_multi_day_upgrade_clicked")[0][1].source).toBe("landing");
  });
});

describe("Pro: gating, single map, and intentional details storage", () => {
  beforeEach(() => {
    useMe.mockReturnValue({ me: { ok: true, user: { email: "p@e.com" }, entitlements: { pro: true, proUntil: "2027-01-01" } }, loadingMe: false, refetchMe: vi.fn() });
  });

  it("homepage details show ranking + exactly one map; the landing page keeps its own collapsed preference and never inherits hidden content", async () => {
    renderApp("/", { lang: "en", isPro: true });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "See the best spots" }));
    await waitFor(() => expect(screen.getAllByTestId("nl-map-container")).toHaveLength(1));
    expect(events("northern_lights_map_viewed")).toHaveLength(1);
    expect(sessionStorage.getItem("nl_details_expanded")).toBe("true"); // homepage key unchanged

    fireEvent.click(screen.getByTestId("nl3-details-link"));
    await waitFor(() => expect(screen.getByTestId("loc")).toHaveTextContent(landingPath(D0)));
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    expect(screen.queryByTestId("nl-map-container")).toBeNull(); // landing preference is separate: collapsed
    expect(sessionStorage.getItem("nl3_details_expanded")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "See the best spots" }));
    await waitFor(() => expect(screen.getAllByTestId("nl-map-container")).toHaveLength(1));
  });

  it("switching nights on the homepage changes headline, ranking and map atomically (never two maps)", async () => {
    // Night 1 needs two distinct qualifying bands for its own map to exist.
    stubFetch({ ...FIXTURES(), [D1]: body(D1, six(70, (i) => (i === 0 ? "good" : "fair"), "Night1 Spot")) });
    renderApp("/", { lang: "en", isPro: true });
    await waitFor(() => expect(screen.getByTestId("nl3-result")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "See the best spots" }));
    await waitFor(() => expect(screen.getAllByTestId("nl-map-container")).toHaveLength(1));
    expect(document.body.textContent).toContain("Night0 Spot 1");

    fireEvent.click(screen.getByRole("button", { name: /Tomorrow night/ }));
    await waitFor(() => expect(document.body.textContent).toContain("Night1 Spot 1"));
    expect(document.body.textContent).not.toContain("Night0 Spot 1");
    expect(screen.getAllByTestId("nl-map-container")).toHaveLength(1);

    fireEvent.click(within(group()).getAllByRole("button")[2]); // all-poor: no ranking, no map
    await waitFor(() => expect(screen.getByTestId("nl3-all-poor")).toBeInTheDocument());
    expect(screen.queryByTestId("nl-map-container")).toBeNull();
  });
});
