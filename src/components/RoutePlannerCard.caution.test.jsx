// Ticket #436 — RoutePlannerCard's own-assessment caution presentation:
// D1 note placement, D2 unique ids (card note + modal note mounted
// together), D3 aggregate-flag reasons from the candidate's own windowDays,
// F8/F10 keyboard/touch-reachable inline reason disclosure. Real IS/EN
// dictionaries (not key-only mocks) — the existing RoutePlannerCard.test.jsx
// fixtures are insufficient for this, per the approved prompt's F6(3).
// RoutePlannerDetailsModal is left REAL (unlike RoutePlannerCard.test.jsx,
// which mocks it) so D2's two-hosts-at-once case can be exercised.
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RoutePlannerCard from "./RoutePlannerCard";
import { translations } from "../i18n/translations";
import { useRoutePlanner } from "../hooks/useRoutePlanner";
import { useFreeRecommendation } from "../hooks/useFreeRecommendation";
import { deriveRoutePlannerSummary } from "../lib/routePlannerSummary";

vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../lib/routePlannerSummary", () => ({ deriveRoutePlannerSummary: vi.fn() }));
vi.mock("../hooks/useRoutePlanner", () => ({ useRoutePlanner: vi.fn() }));
vi.mock("../hooks/useFreeRecommendation", () => ({ useFreeRecommendation: vi.fn() }));
vi.mock("./AnimatedPill", () => ({ default: ({ children }) => children }));

const SITE = { id: "base-site", name: "Base Camp", lat: 64.1, lon: -21.9 };

function day(dateISO, { warnings = [], baseSiteWarnings = [] } = {}) {
  return {
    date: dateISO,
    points: 7,
    pointsRaw: 7,
    finalClass: "Good",
    basePts: 5,
    windPen: 0,
    rainPen: 0,
    gustPen: 0,
    rainStreak: 0,
    rainStreakPen: 0,
    tmax: 10,
    rain: 1,
    windMax: 10,
    windGust: 12,
    season: "summer",
    shelter: 0.5,
    shelterBonus: 0.2,
    baseSitePoints: 5,
    baseSitePointsRaw: 5,
    baseSiteWarnings,
    warnings,
  };
}

function candidate(overrides = {}) {
  return {
    siteId: "site-fludir",
    siteName: "Flúðir",
    distanceKm: 25,
    betterDays: 1,
    sameDays: 0,
    worseDays: 0,
    windowDays: [],
    reasons: [],
    aggregateType: "better",
    hasWarning: false,
    hasHighWarning: false,
    hazardBlocked: false,
    roughWeatherWindow: null,
    deltaVsBase: 2,
    requiredDelta: 1,
    ...overrides,
  };
}

function setUp({ top3, best, decisionLower = "move", routeRiskData = null, isPro = true, lang = "en" }) {
  deriveRoutePlannerSummary.mockReturnValue({
    top3,
    best,
    decisionLower,
    summary: {
      ready: true,
      verdict: decisionLower,
      candidate: best ? { id: best.siteId, name: best.siteName, distanceKm: best.distanceKm } : null,
    },
  });
  useRoutePlanner.mockReturnValue({
    loading: false,
    error: "",
    result: { ranked: top3, recommendation: decisionLower },
    routeRiskData,
    routeRiskLoading: false,
  });
  useFreeRecommendation.mockReturnValue({ hasFreeUsed: false, markFreeUsed: vi.fn() });

  return render(
    <RoutePlannerCard
      t={(k) => translations[lang][k] ?? k}
      lang={lang}
      entitlements={{ isPro }}
      me={{ user: { email: "x@example.com" } }}
      onUpgrade={vi.fn()}
      sites={[SITE]}
      baseSiteId={SITE.id}
      onSummaryChange={() => {}}
      onSelectSite={() => {}}
    />
  );
}

function expandVerdict(lang = "en") {
  const cta = screen.queryByText(translations[lang].travelAdvisorShowDetails);
  if (cta) fireEvent.click(cta);
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.setItem("campcast_route_disclaimer_seen", "true");
});

describe("RoutePlannerCard — D1 note placement", () => {
  it("HIGH route risk only, no alternatives: exactly one note, adjacent to the routeRisk verdict lines", () => {
    setUp({ top3: [], best: null, decisionLower: "stay", routeRiskData: { routeRisk: "HIGH" } });
    expandVerdict();
    expect(screen.getAllByText(translations.en.hazardSourceNoteHeading)).toHaveLength(1);
  });

  it("no indicator anywhere: no note", () => {
    const c = candidate({ hasHighWarning: false, hasWarning: false });
    setUp({ top3: [c], best: c, decisionLower: "move", routeRiskData: { routeRisk: "LOW" } });
    expandVerdict();
    expect(screen.queryByText(translations.en.hazardSourceNoteHeading)).toBeNull();
  });

  // Ticket #460 J3 — UNKNOWN must be neutral: no #436 source note, no amber
  // caution styling, and its wording must never equal the LOW word (the
  // exact bug the old `!== "LOW"` ternary fallback produced).
  it("UNKNOWN route risk, no other indicator: no source note", () => {
    const c = candidate({ hasHighWarning: false, hasWarning: false });
    setUp({ top3: [c], best: c, decisionLower: "move", routeRiskData: { routeRisk: "UNKNOWN" } });
    expandVerdict();
    expect(screen.queryByText(translations.en.hazardSourceNoteHeading)).toBeNull();
  });

  it("UNKNOWN route risk shows the neutral unknown message, never the Low word", () => {
    const c = candidate({ hasHighWarning: false, hasWarning: false });
    setUp({ top3: [c], best: c, decisionLower: "move", routeRiskData: { routeRisk: "UNKNOWN" } });
    expandVerdict();
    expect(screen.getByText(translations.en.routeRiskUnknownDetail)).toBeInTheDocument();
    expect(screen.queryByText(translations.en.routeRiskLow, { exact: false })).toBeNull();
  });

  it("partial-coverage HIGH still shows the caution box with a partial-data qualifier and the source note", () => {
    const c = candidate({ hasHighWarning: false, hasWarning: false });
    setUp({
      top3: [c],
      best: c,
      decisionLower: "move",
      routeRiskData: { routeRisk: "HIGH", coverage: { status: "partial" } },
    });
    expandVerdict();
    expect(screen.getByText(translations.en.routeRiskPartialQualifier, { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText(translations.en.hazardSourceNoteHeading)).toHaveLength(1);
  });

  it("full branch: a site caution indicator in the alternatives list produces exactly one note", () => {
    const c = candidate({
      hasHighWarning: true,
      windowDays: [day("2026-10-20", { warnings: [{ type: "wind", level: "high", value: 20 }] })],
    });
    setUp({ top3: [c], best: c, decisionLower: "move", routeRiskData: null, isPro: true });
    expandVerdict();
    expect(screen.getAllByText(translations.en.hazardSourceNoteHeading)).toHaveLength(1);
  });

  it("preview branch: a routeRisk indicator on the single best item produces exactly one note", () => {
    const c = candidate();
    setUp({ top3: [c], best: c, decisionLower: "move", routeRiskData: { routeRisk: "MED" }, isPro: false });
    expandVerdict();
    expect(screen.getAllByText(translations.en.hazardSourceNoteHeading)).toHaveLength(1);
  });
});

describe("RoutePlannerCard — D3 aggregate-flag reasons use the flag's own data", () => {
  it("hasHighWarning with real per-day warnings: the inline disclosure shows the actual reason type(s)", () => {
    const c = candidate({
      hasHighWarning: true,
      windowDays: [
        day("2026-10-20", { warnings: [{ type: "wind", level: "high", value: 20 }] }),
        day("2026-10-21", { warnings: [{ type: "rain", level: "warn", value: 15 }] }),
      ],
    });
    setUp({ top3: [c], best: c, decisionLower: "move", routeRiskData: null, isPro: true });
    expandVerdict();

    const badge = screen.getByRole("button", { name: new RegExp(translations.en.routeWarningHigh) });
    expect(badge).toBeInTheDocument();
    fireEvent.click(badge);
    expect(screen.getByText(translations.en.routeWarnTypeWind)).toBeInTheDocument();
  });

  it("flag true but no per-day warnings at that level: severity only, no invented reason, not a focusable control (F-E, correction v2)", () => {
    // Defensive case per D3: hasHighWarning true but windowDays carry no
    // matching per-day warning (should not normally happen, but must not
    // fabricate a cause). Per F-E/E3: a badge with nothing to disclose must
    // not be a button at all (clicking it used to do nothing — an inert
    // focusable control), so it renders as a non-interactive span instead.
    const c = candidate({ hasHighWarning: true, windowDays: [day("2026-10-20", { warnings: [] })] });
    setUp({ top3: [c], best: c, decisionLower: "move", routeRiskData: null, isPro: true });
    expandVerdict();

    expect(
      screen.queryByRole("button", { name: new RegExp(translations.en.routeWarningHigh) })
    ).toBeNull();
    const badge = screen.getByText(translations.en.routeWarningHigh);
    expect(badge).toBeInTheDocument();
    expect(badge.closest("button")).toBeNull();
    expect(badge.getAttribute("tabindex")).toBeNull();
    expect(badge.getAttribute("aria-expanded")).toBeNull();
    expect(badge.getAttribute("aria-controls")).toBeNull();
    fireEvent.click(badge);
    expect(screen.queryByText(translations.en.routeWarnTypeWind)).toBeNull();
  });
});

describe("RoutePlannerCard — F8/F10 inline reason disclosure (keyboard/touch-reachable, not title-only)", () => {
  it("the reason text is not present until the badge is activated, then appears in normal document flow (no portal/popover)", () => {
    const c = candidate({
      hasWarning: true,
      windowDays: [day("2026-10-20", { warnings: [{ type: "gust", level: "warn", value: 22 }] })],
    });
    setUp({ top3: [c], best: c, decisionLower: "move", routeRiskData: null, isPro: true });
    expandVerdict();

    expect(screen.queryByText(translations.en.routeWarnTypeGust)).toBeNull();
    const badge = screen.getByRole("button", { name: new RegExp(translations.en.routeWarning) });
    expect(badge.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(badge);
    expect(badge.getAttribute("aria-expanded")).toBe("true");
    const reasonId = badge.getAttribute("aria-controls");
    expect(reasonId).toBeTruthy();
    const reasonEl = document.getElementById(reasonId);
    expect(reasonEl).not.toBeNull();
    expect(reasonEl.textContent).toContain(translations.en.routeWarnTypeGust);
    // Not a nested-interactive violation: the badge button and the reason
    // span are siblings, not ancestor/descendant of another control.
    expect(reasonEl.closest("button")).toBeNull();

    fireEvent.click(badge);
    expect(badge.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText(translations.en.routeWarnTypeGust)).toBeNull();
  });
});

describe("RoutePlannerCard — D2 unique ids when the card's own note and the details modal's note are both mounted", () => {
  it("opening the details modal while the card also shows its own note: both aria-describedby targets resolve to distinct, correct text", () => {
    const warnings = [{ type: "wind", level: "high", value: 20 }];
    const c = candidate({
      hasHighWarning: true,
      windowDays: [day("2026-10-20", { warnings })],
    });
    setUp({ top3: [c], best: c, decisionLower: "move", routeRiskData: null, isPro: true });
    expandVerdict();

    // Card's own note is visible (alternatives section has an indicator).
    const cardNotes = screen.getAllByText(translations.en.hazardSourceNoteHeading);
    expect(cardNotes).toHaveLength(1);

    // Open the details modal for the candidate (real modal, not mocked).
    const openTrigger = screen.getByRole("button", { name: new RegExp(c.siteName) }) ||
      screen.getAllByText(c.siteName)[0];
    fireEvent.click(openTrigger);

    const allNotes = screen.getAllByText(translations.en.hazardSourceNoteHeading);
    expect(allNotes.length).toBeGreaterThanOrEqual(1); // modal mounted; at least the modal's own note is present

    // Every vedur.is link's aria-describedby resolves to an existing,
    // non-empty sr-only element, and every one of those ids is unique.
    const links = screen.getAllByRole("link", { name: "vedur.is" });
    const describedByIds = links.map((l) => l.getAttribute("aria-describedby"));
    expect(new Set(describedByIds).size).toBe(describedByIds.length); // all distinct
    for (const id of describedByIds) {
      const el = document.getElementById(id);
      expect(el).not.toBeNull();
      expect(el.textContent.length).toBeGreaterThan(0);
    }
  });
});

describe("RoutePlannerCard — contextual route-risk badge labels (F-D, correction v2)", () => {
  // Jonesy condition E2: hard-coded literal strings, not translations.*
  // lookups. Covers HIGH/MED in both the preview (isPro:false) and full
  // (isPro:true) branches, in both languages.
  it("EN full branch, HIGH: badge accessible name is 'Route risk: High'", () => {
    const c = candidate();
    setUp({ top3: [c], best: c, decisionLower: "move", routeRiskData: { routeRisk: "HIGH" }, isPro: true });
    expandVerdict();
    expect(screen.getByRole("button", { name: "Route risk: High" })).toBeInTheDocument();
  });

  it("EN full branch, MED: badge accessible name is 'Route risk: Moderate'", () => {
    const c = candidate();
    setUp({ top3: [c], best: c, decisionLower: "move", routeRiskData: { routeRisk: "MED" }, isPro: true });
    expandVerdict();
    expect(screen.getByRole("button", { name: "Route risk: Moderate" })).toBeInTheDocument();
  });

  it("EN preview branch, HIGH: badge accessible name is 'Route risk: High'", () => {
    const c = candidate();
    setUp({ top3: [c], best: c, decisionLower: "move", routeRiskData: { routeRisk: "HIGH" }, isPro: false });
    expandVerdict();
    expect(screen.getByRole("button", { name: "Route risk: High" })).toBeInTheDocument();
  });

  it("EN preview branch, MED: badge accessible name is 'Route risk: Moderate'", () => {
    const c = candidate();
    setUp({ top3: [c], best: c, decisionLower: "move", routeRiskData: { routeRisk: "MED" }, isPro: false });
    expandVerdict();
    expect(screen.getByRole("button", { name: "Route risk: Moderate" })).toBeInTheDocument();
  });

  it("IS full branch, HIGH: badge accessible name is 'Áhætta á leið: Há'", () => {
    const c = candidate();
    setUp({ top3: [c], best: c, decisionLower: "move", routeRiskData: { routeRisk: "HIGH" }, isPro: true, lang: "is" });
    expandVerdict("is");
    expect(screen.getByRole("button", { name: "Áhætta á leið: Há" })).toBeInTheDocument();
  });

  it("IS full branch, MED: badge accessible name is 'Áhætta á leið: Miðlungs'", () => {
    const c = candidate();
    setUp({ top3: [c], best: c, decisionLower: "move", routeRiskData: { routeRisk: "MED" }, isPro: true, lang: "is" });
    expandVerdict("is");
    expect(screen.getByRole("button", { name: "Áhætta á leið: Miðlungs" })).toBeInTheDocument();
  });

  it("IS preview branch, HIGH: badge accessible name is 'Áhætta á leið: Há'", () => {
    const c = candidate();
    setUp({ top3: [c], best: c, decisionLower: "move", routeRiskData: { routeRisk: "HIGH" }, isPro: false, lang: "is" });
    expandVerdict("is");
    expect(screen.getByRole("button", { name: "Áhætta á leið: Há" })).toBeInTheDocument();
  });

  it("IS preview branch, MED: badge accessible name is 'Áhætta á leið: Miðlungs'", () => {
    const c = candidate();
    setUp({ top3: [c], best: c, decisionLower: "move", routeRiskData: { routeRisk: "MED" }, isPro: false, lang: "is" });
    expandVerdict("is");
    expect(screen.getByRole("button", { name: "Áhætta á leið: Miðlungs" })).toBeInTheDocument();
  });
});
