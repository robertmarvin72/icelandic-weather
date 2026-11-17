# #500 — round 1 evidence

## Authorization

- Approved prompt: `docs/ai/tasks/ticket-500/approved-prompt-v1.md` (Jonesy APPROVED with MB1).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage: READY_FOR_CC`, 2026-11-14.

## What this round delivers

- `places-v1.json` — four already-owner-selected base points (R1 Rauðavatn, E1
  Egilsstaðir, S2 Seyðisfjörður, C Akureyri) as a small, versioned data
  contract: stable non-Hagstofa IDs, IS/EN display names, neutral approach
  description, owner-selection reference, lat/lon/CRS, road/piece/IDBUTUR
  role, provenance (path + SHA-256 for raw/native/ledger references), and an
  explicit access/routability status for each point. E1's coordinates were
  pulled directly from `ticket-493-endpoint-acquisition/endpoint-wgs84.json`
  (confirmed against the raw response and cross-checked against the raw
  WFS feature properties directly, which also confirmed E1's IDBUTUR
  911040037 and S2's IDBUTUR 911170037 — neither file carried an explicit
  IDBUTUR field in the exact form expected, so both were verified by reading
  the underlying raw WFS JSON feature properties directly rather than
  assumed from registry prose).
- `r1-north-connection.json` — a bounded extract of the already-retained
  `#491` 29-piece chain, from R1's point (western end of IDFERILL 1436) to
  the start of IDFERILL 3025 (`#491`'s own P1 reference point). 15 chain
  pieces (IDFERILL 1477 through 49285) plus the terminal reference point are
  reused verbatim (order/role/orientation/gap/native coordinates) from
  `route-data-candidate.json`; no new call, no recomputed Borgarnes route, no
  new candidate. The extract records the MB1 correction explicitly: the
  "Kjalarnes" section (IDBUTUR 903030037) begins at piece 2532 (~11.7 km from
  R1), not at 3025 — 3025's start is a reference point ~12 km further into
  that same section, not the section's entry.

## What was reused (no new acquisition)

- `#499`'s `endpoint-registry.json` (R1/E1/S2/C owner-selection and
  provenance blocks) and `#493`'s `endpoint-wgs84.json`/raw WFS samples for
  the four coordinates.
- `#491`'s final-validation chain data (`route-data-candidate.json`,
  `evidence-table-final.md`, `result-review-final-validation.md`) for the
  R1-north chain segments, reused, not re-derived or re-measured.
- No new network call, no new dependency, no new service.

## The one precise next data gap for R1

**What is missing:** an authoritative source for the permitted driving
direction on the Rauðavatn → Kjalarnes-interchange arc, and which specific
ramp/arc at that interchange is the through-route (vs. a one-way or
restricted-direction ramp). The retained `#491` chain records measured geometric proximity with 15
gaps of about 2.9–41.5 m, followed by an exact 0.0 m contact at the
terminal point (start of IDFERILL 3025); it does not prove continuous contact, and the chain's own stored
digital direction (H1, VEGHLUTI 6 northbound) is a topology hint, not a
confirmed legal traffic direction — `route-data-candidate.json` says this
about itself.

**Why retained data does not resolve it:** no field in the retained WFS
layer (`faerdferlar2017_1`) encodes one-way/access/legal-direction
information for any of the four endpoints or for this chain (confirmed
again this round for E1/S2's raw 24-property schema, and already documented
as `EXACT_GAP` for all four points). `#491`'s own final validation passed
the chain's *data consistency*, explicitly while stating that exact
direction/roundabout traversal remain unconfirmed.

**Stopping here, not starting new acquisition work:** per
approved-prompt-v1.md's own scope boundary, this round does not start a new
map/traffic-authority lookup to close this gap. If a future round is
authorized to acquire a legal-direction source (e.g. a Vegagerðin signage/
access dataset, or a manual map/street-view check), that is new work outside
this contract's retained-data-only scope and needs its own owner-approved
prompt.

Other 68 places from the GitHub-tracked 72-place proposal list are not
addressed by this round and are not excluded from `#500` by this round
either — they wait for later, separately scoped rounds.
