// api/_lib/winterRoute/raudavatnSelfossMvpPolicy.js
//
// Ticket #501 Rauðavatn<->Selfoss/Hella MVP pilot. A small, PAIR-SCOPED
// directed-policy builder for exactly four ordered pilot pairs
// (Rauðavatn<->Selfoss, Rauðavatn<->Hella) -- never a general
// traversal-rule framework, never applied to any other pair, and
// deliberately NOT a set-expansion that would also catch Selfoss<->Hella
// (that pair stays on the plain undirected API contract -- see
// raudavatn-hella-mvp/approved-prompt-v1.md P1/P4: the module's own
// name/exports are unchanged from the original Selfoss-only round to
// avoid a cosmetic rename, but the pair predicate now names exactly
// four ordered pairs, not a 3-place set). The pure geometryComposition.js
// core is unchanged; this module only builds its `mode`/`policy` INPUT
// and one synthetic pilot connector line, reused unmodified for both
// rounds, per approved-prompt-v1.md P1-P6 (Jonesy, 2026-11-18) and
// raudavatn-hella-mvp/approved-prompt-v1.md P1-P5 (Jonesy, 2026-11-18).
//
// Every rule's `directionBasis` is literally "OWNER_APPROVED_MVP_ASSUMPTION"
// -- this is a simple, visible, owner-approved MVP assumption about
// ordinary two-way Hringvegur travel, NEVER an official Vegagerðin
// confirmation of real traffic direction (see direction-authority's own
// authority-report.md: no such confirmation exists). `drivingAccess`
// on every composed result stays "UNVERIFIED" regardless.
//
// VEGHLUTI role -> MVP assumption (Round 1, owner-approved):
//   1, 8          -> "both"    (ordinary two-way Hringvegur carriageway)
//   3, 4, 6, 7     -> "forward" (follows the piece's own digitized vertex
//                                 order -- 7 ("against kaflastefna") is
//                                 deliberately NOT auto-flipped to
//                                 "reverse" just because of its name)
//   5 (roundabout) -> "forward" (retained rings are drawn counter-
//                                 clockwise; forward follows one
//                                 continuous traversal to the correct exit
//                                 in this pilot)
//   anything else  -> no rule at all (treated as "missing" by the core:
//                                      contributes zero edges -- never
//                                      silently authorized)

import crypto from "node:crypto";

export const MVP_ASSUMPTION_BASIS = "OWNER_APPROVED_MVP_ASSUMPTION";

// Reserved synthetic sourceId for the one pilot connector line -- a
// negative number can never collide with a real IDFERILL (always
// positive in the retained data). Never presented as an IDFERILL/IDBUTUR.
export const CONNECTOR_SOURCE_ID = -1;

const BOTH_VEGHLUTI = new Set([1, 8]);
const FORWARD_VEGHLUTI = new Set([3, 4, 5, 6, 7]);

// P1 (Jonesy): the one real gap in this pilot is NOT at Hellisheiði --
// it is Rauðavatn-side: 2021's own end vertex and the shared 1735/2071
// node, 44.214687625802 m apart (independently recomputed here from the
// SAME literal retained vertices, within the 45 m limit by ~0.8 m).
// Read literally from the dataset, never recalculated/snapped.
const CONNECTOR_VERTICES = [
  { x: 369314.313, y: 400649.381, z: null }, // 2021's own end
  { x: 369350.3714, y: 400623.7933, z: null }, // shared 1735/2071 node
];

// P1 (raudavatn-hella-mvp): an explicit list of exactly four ordered
// pairs -- NOT a 3-place set of {reykjavik-raudavatn, selfoss, hella}.
// A set would also match Selfoss<->Hella, which must stay on the plain
// undirected API contract this round (P4) -- directed Selfoss->Hella
// under this same policy gives 35,696.542 m, different from the
// undirected 35,646.177 m, so including it here would silently change
// that pair's own API response.
const MVP_PILOT_ORDERED_PAIRS = new Set([
  "reykjavik-raudavatn|selfoss",
  "selfoss|reykjavik-raudavatn",
  "reykjavik-raudavatn|hella",
  "hella|reykjavik-raudavatn",
]);

/** True only for one of the four explicit ordered pilot pairs. */
export function isRaudavatnSelfossPair(from, to) {
  return MVP_PILOT_ORDERED_PAIRS.has(`${from}|${to}`);
}

/**
 * The one synthetic pilot connector line -- estimated, not a Vegagerðin
 * feature. `idbutur` is null (never fabricated); `evidenceRef` is a
 * literal, non-WFS-looking marker so it can never be mistaken for real
 * source evidence.
 */
export function buildMvpConnectorLine(tier) {
  return {
    sourceId: CONNECTOR_SOURCE_ID,
    idbutur: null,
    tier,
    vertices: CONNECTOR_VERTICES,
    evidenceRef: "pilot-connector:estimated",
  };
}

function buildMvpRules(lines, tier) {
  const rules = [];
  for (const line of lines) {
    if (BOTH_VEGHLUTI.has(line.veghluti)) {
      rules.push({ sourceId: line.sourceId, tier, direction: "both", directionBasis: MVP_ASSUMPTION_BASIS });
    } else if (FORWARD_VEGHLUTI.has(line.veghluti)) {
      rules.push({ sourceId: line.sourceId, tier, direction: "forward", directionBasis: MVP_ASSUMPTION_BASIS });
    }
    // Any other (or missing) veghluti value gets no rule at all -- the
    // core treats an un-ruled sourceId as "missing" (zero edges), never
    // silently authorized (no unknown-category default-allow).
  }
  rules.push({ sourceId: CONNECTOR_SOURCE_ID, tier, direction: "forward", directionBasis: MVP_ASSUMPTION_BASIS });
  return rules;
}

/**
 * Builds the full directed `mode`/`policy`/`lines` input for exactly
 * this pilot pair, given the shared dataset's own `lines`/`tier`. The
 * connector is appended only to this call's own line list -- never
 * written back into the shared dataset (P3).
 *
 * `policyVersion` is a deterministic hash over the canonical rules AND
 * the connector's own coordinates (P4) -- datasetVersion itself never
 * covers policy, so this is the only thing that changes if either the
 * MVP rule table or the connector's coordinates are ever revised.
 */
export function buildMvpDirectedInput({ lines, tier }) {
  const rules = buildMvpRules(lines, tier);
  const canonical = JSON.stringify({ basis: MVP_ASSUMPTION_BASIS, rules, connector: CONNECTOR_VERTICES });
  const hash = crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 16);
  return {
    lines: [...lines, buildMvpConnectorLine(tier)],
    policy: { policyVersion: `raudavatn-selfoss-mvp-v1-${hash}`, rules },
  };
}
