// api/_lib/winterRoute/raudavatnSelfossNorthOption.js
//
// Ticket #501 ring-options-mvp. The "north" Rauðavatn<->Selfoss option:
// the long Route 1 ring via Vesturland/Norðurland/Austurland/the south
// coast, built as two FIXED LEGS through the Egilsstaðir (E1) junction
// -- never a generalized route/alternatives engine. Reuses the
// existing south MVP policy input byte-for-byte (buildMvpDirectedInput)
// and adds exactly two new, small, estimated connector lines needed
// ONLY for the E1->R1 leg's own gap near Hádegismóar in Reykjavík (a
// different gap from the south pilot's own Rauðavatn-side connector,
// sourceId -1, which this module never reuses or duplicates).
//
// P1 (Jonesy): a naive compose(E1, R1) under the existing MVP policy,
// without these two connectors, is DISCONNECTED at this gap and falls
// back to the only other available path -- detouring via Selfoss and
// the short south leg (~665.8 km) -- which is NOT the north ring route
// at all, just mislabeled. These two connectors close that one real
// gap so E1->R1 actually resolves to the genuine ~615.5 km ring route.

import crypto from "node:crypto";
import { buildMvpDirectedInput, MVP_ASSUMPTION_BASIS } from "./raudavatnSelfossMvpPolicy.js";

// Reserved synthetic sourceIds -- distinct from the south pilot's -1.
export const NORTH_CONNECTOR_SOURCE_IDS = [-2, -3];

// Literal retained vertices (read directly from the dataset, never
// recalculated) for the one real gap on this leg, near Hádegismóar:
//   9924's own end  -> 49926's own end   (11.025 m)
//   49926's own start -> 42244's own start (2.344 m)
// Direction is one-way (forward only, E1->R1 sense) -- this is the
// same owner-approved MVP assumption pattern as the south connector,
// never an official confirmation.
const CONNECTOR_A_VERTICES = [
  { x: 364304.1134, y: 405437.7883, z: null }, // 9924's own end
  { x: 364310.0491, y: 405428.4975, z: null }, // 49926's own end
];
const CONNECTOR_B_VERTICES = [
  { x: 364380.1477, y: 405259.4325, z: null }, // 49926's own start
  { x: 364381.0676, y: 405257.2764, z: null }, // 42244's own start
];

function buildNorthConnectorLines(tier) {
  return [
    { sourceId: NORTH_CONNECTOR_SOURCE_IDS[0], idbutur: null, tier, vertices: CONNECTOR_A_VERTICES, evidenceRef: "pilot-connector:estimated-north-haegismoar-1" },
    { sourceId: NORTH_CONNECTOR_SOURCE_IDS[1], idbutur: null, tier, vertices: CONNECTOR_B_VERTICES, evidenceRef: "pilot-connector:estimated-north-haegismoar-2" },
  ];
}

/**
 * Builds the directed `mode`/`policy`/`lines` input for the north
 * option's own legs (R1<->E1, E1<->Selfoss). Reuses the exact south
 * `buildMvpDirectedInput` output as its base (same VEGHLUTI rules, same
 * south connector at sourceId -1, left in but unused on these legs) and
 * appends the two north-only connectors/rules on top. Its own
 * `policyVersion` is a fresh hash covering the combined rule table and
 * both connectors' own coordinates -- so it can never be confused with
 * the south-only `policyVersion`, and changes if either connector or
 * the base rules ever change.
 */
export function buildNorthDirectedInput({ lines, tier }) {
  const base = buildMvpDirectedInput({ lines, tier });
  const northConnectorLines = buildNorthConnectorLines(tier);
  const northRules = NORTH_CONNECTOR_SOURCE_IDS.map((sourceId) => ({
    sourceId,
    tier,
    direction: "forward",
    directionBasis: MVP_ASSUMPTION_BASIS,
  }));

  const allLines = [...base.lines, ...northConnectorLines];
  const allRules = [...base.policy.rules, ...northRules];

  const canonical = JSON.stringify({
    basis: MVP_ASSUMPTION_BASIS,
    rules: allRules,
    connectors: [CONNECTOR_A_VERTICES, CONNECTOR_B_VERTICES],
  });
  const hash = crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 16);

  return {
    lines: allLines,
    policy: { policyVersion: `raudavatn-selfoss-north-v1-${hash}`, rules: allRules },
  };
}
