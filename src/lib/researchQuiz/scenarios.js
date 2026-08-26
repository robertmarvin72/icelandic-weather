// src/lib/researchQuiz/scenarios.js
//
// Frozen HomeDecisionCard scenario fixtures for the #395 decision-
// comprehension quiz. This is a hand-written, runtime-safe re-derivation of
// the same semantic setup already proven in
// src/components/HomeDecisionCard.test.jsx's makeRoutePlanner/makeCandidate/
// noCandidateState helpers — NOT an import of that test file (which would
// pull Vitest/Testing Library into the production bundle).
//
// Every scenario is a plain, versioned, frozen data object: no live weather,
// no async scoring, no comparisonState recomputation. Scenario identity
// (`id`) is the FINAL CANONICAL RENDERED TONE, never the raw verdict — see
// the `diagnostic` fixture below for the one case where they intentionally
// differ.

export const RESEARCH_QUIZ_SCENARIOS_VERSION = "1";

function routePlanner(verdict, candidateName = "Flúðir") {
  return {
    ready: true,
    verdict,
    candidate: { id: "site-fludir", name: candidateName, distanceKm: 25 },
    radiusKm: 50,
    windowDays: 3,
  };
}

function candidateComparison({ distFromBase = 30 } = {}) {
  return {
    best: { site: { id: "site-nearby", name: "Grænihvammur" }, score: 70, distFromBase },
    currentMetrics: { avgWind: 10, totalRain: 8, avgHighTemp: 14 },
    nearbyMetrics: { avgWind: 5, totalRain: 3, avgHighTemp: 14 },
    strength: "strong",
    primaryKey: "wind",
    improvements: ["wind", "rain"],
    worseningsCount: 0,
    isStrongOrDecent: true,
    scoreDiff: 15,
    tier: 2,
    showComparison: true,
    direction: "nearby_better",
  };
}

function noCandidateComparison(direction = "no_candidate") {
  return {
    best: null,
    currentMetrics: null,
    nearbyMetrics: null,
    strength: "mixed",
    primaryKey: null,
    improvements: [],
    worseningsCount: 0,
    isStrongOrDecent: false,
    scoreDiff: 0,
    tier: -1,
    showComparison: false,
    direction,
  };
}

// The three participant-facing scenarios. `id` is the canonical tone, which
// is also the answer key for interpretation scoring — never the raw verdict.
// All three deliberately use Free tier (isPro: false) so the real locked-CTA
// presentation is what participants see, matching the majority real-world
// homepage experience.
export const RESEARCH_QUIZ_SCENARIOS = [
  {
    id: "stay",
    rawVerdict: "stay",
    cardProps: {
      rows: [],
      routePlannerSummary: routePlanner("stay"),
      comparisonState: noCandidateComparison("no_candidate"),
      entitlements: { isPro: false },
    },
  },
  {
    id: "move",
    rawVerdict: "move",
    cardProps: {
      rows: [],
      routePlannerSummary: routePlanner("move"),
      comparisonState: candidateComparison(),
      entitlements: { isPro: false },
    },
  },
  {
    id: "consider",
    rawVerdict: "consider",
    cardProps: {
      rows: [],
      routePlannerSummary: routePlanner("consider"),
      comparisonState: candidateComparison(),
      entitlements: { isPro: false },
    },
  },
];

// Diagnostic-only fixture: raw verdict "move" + comparisonState.direction
// "similar" -> canonical tone "stay" (HomeDecisionCard's own tone-override
// logic). Included in tests per approved prompt §"Frozen scenario
// architecture" to prove the quiz's scenario/answer-key wiring follows
// canonical tone even under override — it is NOT a fourth participant
// scenario and must never appear in RESEARCH_QUIZ_SCENARIOS.
export const RESEARCH_QUIZ_DIAGNOSTIC_FIXTURE = {
  id: "stay", // canonical tone — the diagnostic point of this fixture
  rawVerdict: "move",
  cardProps: {
    rows: [],
    routePlannerSummary: routePlanner("move"),
    comparisonState: { ...noCandidateComparison(), showComparison: true, direction: "similar" },
    entitlements: { isPro: false },
  },
};
