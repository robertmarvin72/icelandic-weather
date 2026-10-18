// Ticket #441 — the details modal's escape-suggestion eligibility used to
// default to the RAW engine verdict (decisionLower) instead of the card's
// canonical, comparisonState-overridden tone (displayDecisionLower). That
// meant a user could see the card headline read "Stay" (because
// comparisonState downgraded the raw move/consider verdict to stay) while
// opening a candidate's details modal still showed a "move"-style escape
// suggestion for that same site — a visible contradiction. The fix
// (RoutePlannerCard.jsx:~1626) now passes displayDecisionLower explicitly
// at both call sites, matching CLAUDE.md's Canonical Decision Tone rule.
//
// This suite uses the REAL RoutePlannerCard and REAL RoutePlannerDetailsModal
// (only the data-fetching hooks and the summary deriver are mocked, to
// inject explicit, controlled fixtures) and asserts against the actual
// rendered DOM — no mocked escape-suggestion output.
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
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

// G1: the modal renders only escapeSuggestion.title and the
// routeEscapeStormCalmerNearby sentence (plus an optional base-window
// line) — never .body or the destination line. Literal strings, not
// dictionary lookups, per the "avoid tautology" instruction.
const EN_ESCAPE_TITLE = "🚐 Escape the storm";
const EN_ESCAPE_CALMER = "Calmer conditions may be available nearby.";
const IS_ESCAPE_TITLE = "🚐 Forðastu óveðrið";
const IS_ESCAPE_CALMER = "Rólegra veður gæti verið í nágrenninu.";

// G5: base warning data as consumed by baseSliceDays — result.explain.base
// .windowDays, sliced to the card's own windowDays state (default 3), NOT
// candidate.windowDays. At least one of the first 3 days needs a "warn" or
// "high" level warning so baseRank >= 1 (otherwise every absence assertion
// below would pass vacuously, since getEscapeSuggestion bails at baseRank<1
// regardless of toneLower).
function baseExplainWindowDays() {
  return [
    { warnings: [{ type: "wind", level: "warn", value: 15 }] },
    { warnings: [] },
    { warnings: [] },
  ];
}

// Eligible candidate: hasWarning/hasHighWarning false -> candidateRank 0 <
// baseRank 1; deltaVsBase (10) >= requiredDelta (1); aggregateType "better"
// (never "worse"). Satisfies every getEscapeSuggestion guard on its own
// fields, independent of toneLower.
function eligibleCandidate(overrides = {}) {
  return {
    siteId: "site-fludir",
    siteName: "Flúðir",
    distanceKm: 20,
    betterDays: 3,
    sameDays: 0,
    worseDays: 0,
    windowDays: [],
    reasons: [],
    aggregateType: "better",
    hasWarning: false,
    hasHighWarning: false,
    hazardBlocked: false,
    roughWeatherWindow: null,
    deltaVsBase: 10,
    requiredDelta: 1,
    ...overrides,
  };
}

// Second, distinct candidate for the non-best tests (D). hasWarning:true
// gives candidateRank 1, equal to baseRank 1 -> candidateRank >= baseRank
// -> ineligible on ITS OWN fields (G4(ii)), independent of toneLower/best.
function ineligibleSecondCandidate(overrides = {}) {
  return eligibleCandidate({
    siteId: "site-hveragerdi",
    siteName: "Hveragerði",
    distanceKm: 15,
    hasWarning: true,
    ...overrides,
  });
}

function setUp({
  top3,
  best,
  decisionLower, // RAW engine verdict
  comparisonState = null,
  isPro = true,
  lang = "en",
}) {
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
    result: {
      ranked: top3,
      recommendation: decisionLower,
      explain: { base: { windowDays: baseExplainWindowDays() } },
    },
    routeRiskData: null,
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
      comparisonState={comparisonState}
    />
  );
}

function expandVerdict(lang = "en") {
  fireEvent.click(screen.getByText(translations[lang].travelAdvisorShowDetails));
}

// G3: every row's details button carries the same aria-label suffix
// (routeDetailsOpenHint), so the click is scoped to the named candidate's
// own <li>.
function openDetailsFor(siteName, lang = "en") {
  const openHint = translations[lang].routeDetailsOpenHint;
  const nameEl = screen.getByText(siteName);
  const li = nameEl.closest("li");
  const openBtn = within(li).getByRole("button", { name: new RegExp(openHint) });
  fireEvent.click(openBtn);
  return li;
}

// G2: the modal is a bare createPortal into document.body with no
// role="dialog" — scope to the direct body child that contains the "Close
// modal" button instead of any CSS class or role query.
function modalContainer() {
  const closeBtn = screen.queryByLabelText("Close modal");
  if (!closeBtn) return null;
  return Array.from(document.body.children).find((el) => el.contains(closeBtn));
}

// The candidate's site name can legitimately appear twice inside the modal
// (the heading, and RouteCompareTable's column header) — the heading is
// always the first occurrence in DOM order.
function modalHeadingText(modal, siteName) {
  return within(modal).getAllByText(siteName)[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.setItem("campcast_route_disclaimer_seen", "true");
});

describe("#441 A — positive controls (no overriding comparison)", () => {
  it("raw move, showComparison=false: modal opens for the eligible best candidate and shows the escape anchors", () => {
    const best = eligibleCandidate();
    setUp({ top3: [best], best, decisionLower: "move", comparisonState: null });
    expandVerdict();

    expect(modalContainer()).toBeNull();
    openDetailsFor("Flúðir");
    const modal = modalContainer();
    expect(modal).not.toBeNull();
    expect(modalHeadingText(modal, "Flúðir")).toBeInTheDocument(); // candidate-specific heading
    expect(within(modal).getByText(EN_ESCAPE_TITLE)).toBeInTheDocument();
    expect(within(modal).getByText(EN_ESCAPE_CALMER)).toBeInTheDocument();
  });

  it("raw consider, showComparison=false: same eligible fixture, modal shows the escape anchors (consider copy elsewhere unchanged)", () => {
    const best = eligibleCandidate();
    setUp({ top3: [best], best, decisionLower: "consider", comparisonState: null });
    expandVerdict();

    openDetailsFor("Flúðir");
    const modal = modalContainer();
    expect(within(modal).getByText(EN_ESCAPE_TITLE)).toBeInTheDocument();
    expect(within(modal).getByText(EN_ESCAPE_CALMER)).toBeInTheDocument();
  });
});

describe("#441 B — regression matrix: raw move/consider x direction similar/current_better, showComparison=true", () => {
  it.each([
    ["move", "similar"],
    ["move", "current_better"],
    ["consider", "similar"],
    ["consider", "current_better"],
  ])("raw=%s, direction=%s: card shows canonical stay AND the opened modal has no escape block", (raw, direction) => {
    const best = eligibleCandidate();
    setUp({
      top3: [best],
      best,
      decisionLower: raw,
      comparisonState: { showComparison: true, direction },
    });
    expandVerdict();

    // Canonical stay headline (displayDecisionLower overridden).
    expect(screen.getByText(translations.en.routeStayGoodSpot)).toBeInTheDocument();

    openDetailsFor("Flúðir");
    const modal = modalContainer();
    expect(modal).not.toBeNull();
    expect(modalHeadingText(modal, "Flúðir")).toBeInTheDocument(); // still the right candidate
    expect(within(modal).queryByText(EN_ESCAPE_TITLE)).toBeNull();
    expect(within(modal).queryByText(EN_ESCAPE_CALMER)).toBeNull();
  });

  it("IS literal strings: raw move, direction similar -> modal has no escape block (Icelandic)", () => {
    const best = eligibleCandidate();
    setUp({
      top3: [best],
      best,
      decisionLower: "move",
      comparisonState: { showComparison: true, direction: "similar" },
      lang: "is",
    });
    expandVerdict("is");

    openDetailsFor("Flúðir", "is");
    const modal = modalContainer();
    expect(within(modal).queryByText(IS_ESCAPE_TITLE)).toBeNull();
    expect(within(modal).queryByText(IS_ESCAPE_CALMER)).toBeNull();
  });
});

describe("#441 C — red/green sensitivity (documented manually in cc-report.md via a temporary revert)", () => {
  it("sanity: the fixed call site is reachable and produces the expected green result (smoke test for the suite itself)", () => {
    const best = eligibleCandidate();
    setUp({
      top3: [best],
      best,
      decisionLower: "move",
      comparisonState: { showComparison: true, direction: "current_better" },
    });
    expandVerdict();
    openDetailsFor("Flúðir");
    expect(within(modalContainer()).queryByText(EN_ESCAPE_TITLE)).toBeNull();
  });
});

describe("#441 D — non-best alternative: candidate identity and eligibility are per-candidate, not per-best", () => {
  it("raw move, no override: opening the eligible best shows the escape block; opening the ineligible second candidate (own fields) does not", () => {
    const best = eligibleCandidate();
    const second = ineligibleSecondCandidate();
    setUp({ top3: [best, second], best, decisionLower: "move", comparisonState: null });
    expandVerdict();

    openDetailsFor("Flúðir");
    expect(within(modalContainer()).getByText(EN_ESCAPE_TITLE)).toBeInTheDocument();

    openDetailsFor("Hveragerði");
    const modal2 = modalContainer();
    expect(modalHeadingText(modal2, "Hveragerði")).toBeInTheDocument(); // (i) own heading/name, not best's
    expect(within(modal2).queryByText(EN_ESCAPE_TITLE)).toBeNull(); // (ii) ineligible via its own warning rank
  });

  it("canonical stay (comparisonState downgrade): opening either candidate shows no escape block", () => {
    const best = eligibleCandidate();
    const second = eligibleCandidate({
      siteId: "site-hveragerdi-eligible",
      siteName: "Hveragerði",
      distanceKm: 15,
    });
    setUp({
      top3: [best, second],
      best,
      decisionLower: "move",
      comparisonState: { showComparison: true, direction: "similar" },
    });
    expandVerdict();

    openDetailsFor("Flúðir");
    expect(within(modalContainer()).queryByText(EN_ESCAPE_TITLE)).toBeNull();

    openDetailsFor("Hveragerði");
    const modal2 = modalContainer();
    expect(modalHeadingText(modal2, "Hveragerði")).toBeInTheDocument();
    expect(within(modal2).queryByText(EN_ESCAPE_TITLE)).toBeNull(); // (iii) neither shows it under stay
  });
});

describe("#441 E — boundaries", () => {
  it("raw stay with an otherwise-eligible candidate: modal opens but shows no escape block", () => {
    const best = eligibleCandidate();
    setUp({ top3: [best], best, decisionLower: "stay", comparisonState: null });
    expandVerdict();

    openDetailsFor("Flúðir");
    const modal = modalContainer();
    expect(modal).not.toBeNull();
    expect(within(modal).queryByText(EN_ESCAPE_TITLE)).toBeNull();
  });

  it("no comparison / no candidate: renders without crashing, no suggestion fabricated", () => {
    setUp({ top3: [], best: null, decisionLower: "stay", comparisonState: null });
    expandVerdict();
    expect(modalContainer()).toBeNull();
  });

  it("missing-data candidate under raw move: modal opens but shows no suggestion; a separate fully-eligible control still shows it", () => {
    const missingDataCandidate = eligibleCandidate({
      siteId: "site-missing",
      siteName: "Selfoss",
      deltaVsBase: null, // no qualifying delta
      requiredDelta: null,
    });
    const eligibleControl = eligibleCandidate();
    setUp({
      top3: [missingDataCandidate, eligibleControl],
      best: missingDataCandidate,
      decisionLower: "move",
      comparisonState: null,
    });
    expandVerdict();

    openDetailsFor("Selfoss");
    const modal1 = modalContainer();
    expect(modal1).not.toBeNull();
    expect(modalHeadingText(modal1, "Selfoss")).toBeInTheDocument();
    expect(within(modal1).queryByText(EN_ESCAPE_TITLE)).toBeNull();

    openDetailsFor("Flúðir");
    expect(within(modalContainer()).getByText(EN_ESCAPE_TITLE)).toBeInTheDocument();
  });
});

describe("#441 G6 — gate controls: the override keys specifically on showComparison && direction in {similar, current_better}", () => {
  it("(a) showComparison=false with direction='similar' still shows the escape block (override never fires without showComparison)", () => {
    const best = eligibleCandidate();
    setUp({
      top3: [best],
      best,
      decisionLower: "move",
      comparisonState: { showComparison: false, direction: "similar" },
    });
    expandVerdict();
    openDetailsFor("Flúðir");
    expect(within(modalContainer()).getByText(EN_ESCAPE_TITLE)).toBeInTheDocument();
  });

  it("(b) showComparison=true with a non-downgrading direction ('nearby_better') still shows the escape block", () => {
    const best = eligibleCandidate();
    setUp({
      top3: [best],
      best,
      decisionLower: "move",
      comparisonState: { showComparison: true, direction: "nearby_better" },
    });
    expandVerdict();
    openDetailsFor("Flúðir");
    expect(within(modalContainer()).getByText(EN_ESCAPE_TITLE)).toBeInTheDocument();
  });
});
