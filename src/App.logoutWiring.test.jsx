// Settings "Skrá út" wiring through the REAL App: useMe (resetMe, refetchMe), useCampsites,
// PageHeader, Toolbar and useLogout. Only fetch and heavy unrelated children are stubbed.
// The fetch stub is stateful: /api/logout flips the server session, and /api/campsites
// answers from that session, so the Pro-to-Free reload is observable.
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import App from "./App";

const recorded = vi.hoisted(() => ({ current: null }));

// The sole useMe change in this file: call the real hook and record its return object.
vi.mock("./hooks/useMe", async () => {
  const actual = await vi.importActual("./hooks/useMe");
  return {
    useMe: () => {
      const value = actual.useMe();
      recorded.current = value;
      return value;
    },
  };
});

vi.mock("@vercel/analytics/react", () => ({ Analytics: () => null }));
vi.mock("@vercel/speed-insights/react", () => ({ SpeedInsights: () => null }));
vi.mock("./lib/analytics", () => ({ trackEvent: vi.fn(), trackPageView: vi.fn(), initAnalytics: vi.fn() }));

vi.mock("./components/NorthernLightsThreeNight", () => ({ default: () => null }));
vi.mock("./components/RoutePlannerCard", () => ({ default: () => null }));
vi.mock("./components/CampsiteComparisonSection", () => ({ default: () => null }));
vi.mock("./components/LazyMap", () => ({ default: () => null }));
vi.mock("./components/WeatherFinder", () => ({ default: () => null }));
vi.mock("./components/HomeDecisionCard", () => ({ default: () => null }));
vi.mock("./components/ForecastTable", () => ({ default: () => null }));
vi.mock("./hooks/useCheckoutFlow", () => ({
  useCheckoutFlow: () => ({ startCheckout: vi.fn(), openBillingPortal: vi.fn() }),
}));
vi.mock("./hooks/useForecast", () => ({
  useForecast: () => ({
    rows: [],
    windDir: null,
    shelter: null,
    loading: false,
    error: null,
    retrying: false,
    refetch: vi.fn(),
    requestedFor: null,
  }),
}));
vi.mock("./hooks/useWeatherVoice", () => ({
  useWeatherVoice: () => ({ presentation: { show: false }, action: null, onVisible: vi.fn(), episodeKey: null, shareSnapshot: null }),
}));
vi.mock("./hooks/useLeaderboardScores", () => ({
  useLeaderboardScores: () => ({ scoresById: {}, loadingWave1: false, loadingBg: false }),
}));

const SITE_A = { id: "site-a", name: "Alpha Camp", lat: 64.1, lon: -21.9, tier: "free" };
const SITE_B = { id: "site-b", name: "Beta Camp", lat: 64.2, lon: -21.8, tier: "pro" };
const FREE_LIST = [SITE_A];
const PRO_LIST = [SITE_A, SITE_B];

const ANON_BODY = { ok: true, user: null, subscription: null, entitlements: { pro: false, proUntil: null } };
const PRO_BODY = {
  ok: true,
  user: { id: "u1", email: "camper@example.com" },
  subscription: { status: "active" },
  entitlements: { pro: true, proUntil: "2030-01-01T00:00:00.000Z" },
};
const FREE_BODY = {
  ok: true,
  user: { id: "u2", email: "free@example.com" },
  subscription: null,
  entitlements: { pro: false, proUntil: null },
};

// Server-side session state. resetServer() reinstates a known starting point.
let serverState;
function resetServer(body = PRO_BODY) {
  serverState = {
    body,
    meHold: null, // deferred { promise } that holds the next /api/me response open
    logoutFail: false,
    logoutThrow: false,
  };
}

function json(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function deferred() {
  let resolve;
  const promise = new Promise((res) => (resolve = res));
  return { promise, resolve };
}

let fetchMock;
function installFetch() {
  fetchMock = vi.fn(async (url) => {
    const u = String(url);
    if (u === "/api/me") {
      if (serverState.meHold) return serverState.meHold.promise;
      return json(serverState.body);
    }
    if (u.startsWith("/api/campsites")) {
      const pro = !!serverState.body.user && serverState.body.entitlements.pro;
      return json({ ok: true, tier: pro ? "pro" : "free", campsites: pro ? PRO_LIST : FREE_LIST });
    }
    if (u === "/api/logout") {
      if (serverState.logoutThrow) throw new TypeError("Failed to fetch");
      if (serverState.logoutFail) return json({ ok: false, error: "nope" }, 500);
      serverState.body = ANON_BODY;
      return json({ ok: true });
    }
    return json({ ok: true });
  });
  vi.stubGlobal("fetch", fetchMock);
}

const callsTo = (path) => fetchMock.mock.calls.filter(([u]) => String(u) === path);
const campsiteCalls = () => fetchMock.mock.calls.filter(([u]) => String(u).startsWith("/api/campsites"));
const tick = () => new Promise((r) => setTimeout(r, 0));

async function waitResolved() {
  await waitFor(() => {
    expect(recorded.current?.loadingMe).toBe(false);
    expect(recorded.current?.me).not.toBeNull();
  });
}

async function openSettings(lang) {
  const label = lang === "is" ? "Stillingar" : "Settings";
  const toggle = await screen.findByRole("button", { name: new RegExp(label) });
  fireEvent.click(toggle);
  return toggle;
}

const logoutRow = () => screen.queryByRole("button", { name: /Log out|Skrá út/ });

describe("App logout wiring (real useMe/useCampsites/PageHeader/Toolbar/useLogout)", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
    recorded.current = null;
    resetServer(PRO_BODY);
    installFetch();
    vi.stubEnv("DEV", false);
    vi.stubEnv("MODE", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("shows the logout row for a signed-in user, logs out, resets identity and does no verification fetch", async () => {
    localStorage.setItem("lang", JSON.stringify("en"));
    render(<App />);
    await waitResolved();

    const toggle = await openSettings("en");
    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: /Log out/ }));
    });

    await waitFor(() => expect(callsTo("/api/logout")).toHaveLength(1));
    const opts = callsTo("/api/logout")[0][1];
    expect(opts.method).toBe("POST");
    expect(opts.credentials).toBe("include");

    await waitFor(() => expect(document.getElementById("toolbar-settings-panel")).toBeNull());
    expect(document.activeElement).toBe(toggle);

    fireEvent.click(toggle);
    await waitFor(() => expect(document.getElementById("toolbar-settings-panel")).not.toBeNull());
    expect(logoutRow()).toBeNull();
    expect(callsTo("/api/me")).toHaveLength(1);
  });

  it("keeps /about as the current route after logout (no navigation)", async () => {
    localStorage.setItem("lang", JSON.stringify("en"));
    window.history.replaceState({}, "", "/about");
    render(<App />);
    await waitResolved();

    await openSettings("en");
    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: /Log out/ }));
    });

    await waitFor(() => expect(callsTo("/api/logout")).toHaveLength(1));
    await waitFor(() => expect(document.getElementById("toolbar-settings-panel")).toBeNull());
    expect(window.location.pathname).toBe("/about");
    expect(logoutRow()).toBeNull();
  });

  // F2: absence is asserted only after /api/me has resolved, using the same wait as the
  // signed-in positive control below.
  it("anonymous resolved user: no logout row (anchored to resolved me)", async () => {
    localStorage.setItem("lang", JSON.stringify("en"));
    resetServer(ANON_BODY);
    render(<App />);
    await waitResolved();
    expect(recorded.current.me.user).toBeNull();

    await openSettings("en");
    await waitFor(() => expect(document.getElementById("toolbar-settings-panel")).not.toBeNull());
    expect(logoutRow()).toBeNull();
  });

  it("signed-in resolved user: logout row present under the same resolved-state wait", async () => {
    localStorage.setItem("lang", JSON.stringify("en"));
    render(<App />);
    await waitResolved();
    expect(recorded.current.me.user).not.toBeNull();

    await openSettings("en");
    await waitFor(() => expect(logoutRow()).not.toBeNull());
  });

  // F1a: DEV=true + MODE=development + stored devPro=true must not expose logout to anonymous users.
  it("anonymous with DEV override active (Dev Pro ON, DEV=true, MODE=development): still no logout row", async () => {
    localStorage.setItem("lang", JSON.stringify("en"));
    localStorage.setItem("devPro", JSON.stringify(true));
    vi.stubEnv("DEV", true);
    vi.stubEnv("MODE", "development");
    resetServer(ANON_BODY);
    render(<App />);
    await waitResolved();

    await openSettings("en");
    // Positive proof the override is active: the real DEV toggle reports Pro ON.
    const devToggle = await screen.findByRole("button", { name: /Dev Pro: ON/ });
    expect(devToggle.getAttribute("aria-pressed")).toBe("true");
    expect(logoutRow()).toBeNull();
  });

  // F1b: signed-in Free user (user present, pro false) sees logout.
  it("signed-in Free user: logout row shown (visibility is user existence, not tier)", async () => {
    localStorage.setItem("lang", JSON.stringify("en"));
    resetServer(FREE_BODY);
    render(<App />);
    await waitResolved();
    expect(recorded.current.me.entitlements.pro).toBe(false);

    await openSettings("en");
    await waitFor(() => expect(logoutRow()).not.toBeNull());
  });

  // Unresolved state: a held /api/me must not expose logout.
  it("initial unresolved state (held /api/me): no logout row", async () => {
    localStorage.setItem("lang", JSON.stringify("en"));
    serverState.meHold = deferred();
    render(<App />);
    await waitFor(() => expect(recorded.current?.loadingMe).toBe(true));

    await openSettings("en");
    await waitFor(() => expect(document.getElementById("toolbar-settings-panel")).not.toBeNull());
    expect(logoutRow()).toBeNull();
    serverState.meHold.resolve(json(PRO_BODY));
  });

  // F1c: retained user during a pending refetch keeps the row visible.
  it("retained signed-in user during a pending refetch keeps the logout row", async () => {
    localStorage.setItem("lang", JSON.stringify("en"));
    render(<App />);
    await waitResolved();
    await openSettings("en");
    await waitFor(() => expect(logoutRow()).not.toBeNull());

    serverState.meHold = deferred();
    await act(async () => {
      recorded.current.refetchMe();
    });
    await waitFor(() => expect(recorded.current.loadingMe).toBe(true));
    expect(recorded.current.me.user).not.toBeNull();
    expect(logoutRow()).not.toBeNull();

    await act(async () => {
      serverState.meHold.resolve(json(PRO_BODY));
    });
    await waitFor(() => expect(recorded.current.loadingMe).toBe(false));
    expect(logoutRow()).not.toBeNull();
  });

  // F3: Pro-to-Free reload. Pro-only lastSite falls back to first Free site; eligible one is kept.
  it("Pro-only lastSite falls back to the first Free site after logout; one extra campsite request", async () => {
    localStorage.setItem("lang", JSON.stringify("en"));
    localStorage.setItem("lastSite", JSON.stringify("site-b"));
    render(<App />);
    await waitResolved();
    await screen.findByRole("button", { name: /Beta Camp/ });
    await act(async () => {
      await tick();
    });
    const baseline = campsiteCalls().length;

    await openSettings("en");
    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: /Log out/ }));
    });
    await waitFor(() => expect(document.getElementById("toolbar-settings-panel")).toBeNull());
    await screen.findByRole("button", { name: /Alpha Camp/ });
    await act(async () => {
      await tick();
    });

    expect(campsiteCalls().length).toBe(baseline + 1);
    expect(JSON.parse(localStorage.getItem("lastSite"))).toBe("site-a");
    fireEvent.click(screen.getByRole("button", { name: /Alpha Camp/ }));
    expect(screen.queryByRole("button", { name: /^Beta Camp/ })).toBeNull();
  });

  it("free-eligible lastSite is kept through the Pro-to-Free reload", async () => {
    localStorage.setItem("lang", JSON.stringify("en"));
    localStorage.setItem("lastSite", JSON.stringify("site-a"));
    render(<App />);
    await waitResolved();
    await screen.findByRole("button", { name: /Alpha Camp/ });
    await act(async () => {
      await tick();
    });

    await openSettings("en");
    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: /Log out/ }));
    });
    await waitFor(() => expect(document.getElementById("toolbar-settings-panel")).toBeNull());
    await act(async () => {
      await tick();
    });

    expect(JSON.parse(localStorage.getItem("lastSite"))).toBe("site-a");
    expect(screen.getByRole("button", { name: /Alpha Camp/ })).not.toBeNull();
  });

  // F3c: signed-in Free logout changes no tier, so it sends no campsite request.
  it("signed-in Free logout sends no extra campsite request", async () => {
    localStorage.setItem("lang", JSON.stringify("en"));
    resetServer(FREE_BODY);
    render(<App />);
    await waitResolved();
    await screen.findByRole("button", { name: /Alpha Camp/ });
    await act(async () => {
      await tick();
    });
    const baseline = campsiteCalls().length;

    await openSettings("en");
    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: /Log out/ }));
    });
    await waitFor(() => expect(document.getElementById("toolbar-settings-panel")).toBeNull());
    await act(async () => {
      await tick();
    });

    expect(callsTo("/api/logout")).toHaveLength(1);
    expect(campsiteCalls().length).toBe(baseline);
  });

  it("keeps the user signed in and shows a translated Icelandic toast when logout fails", async () => {
    localStorage.setItem("lang", JSON.stringify("is"));
    serverState.logoutFail = true;
    render(<App />);
    await waitResolved();

    await openSettings("is");
    const logoutBtn = await screen.findByRole("button", { name: /Skrá út/ });
    await act(async () => {
      fireEvent.click(logoutBtn);
    });

    expect(await screen.findByText("Ekki tókst að skrá út. Reyndu aftur.")).not.toBeNull();
    expect(document.getElementById("toolbar-settings-panel")).not.toBeNull();
    expect(screen.getByRole("button", { name: /Skrá út/ })).not.toBeNull();
  });

  it("shows the English failure toast when lang is en", async () => {
    localStorage.setItem("lang", JSON.stringify("en"));
    serverState.logoutThrow = true;
    render(<App />);
    await waitResolved();

    await openSettings("en");
    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: /Log out/ }));
    });

    expect(await screen.findByText("Could not log out. Please try again.")).not.toBeNull();
    expect(screen.queryByText(/Failed to fetch/)).toBeNull();
  });
});
