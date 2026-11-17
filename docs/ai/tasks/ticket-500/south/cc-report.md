# #500 — Hveragerði–Vík corridor, CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-500/south/approved-prompt-v1.md`
  (Jonesy APPROVED without conditions; Ripley 2026-11-14).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-14.

## What was created / changed

- **`server_data/winter-route-south-connections.json`** (new) — the shared
  25-piece road corridor (IDFERILL 2135..23041, reused verbatim from the
  retained `cw_long` chain in `chain-walks-v4.json`) plus one recommended +
  alternative approach candidate per place for Hveragerði/Selfoss/Hella/
  Hvolsvöllur, and the single retained candidate for Vík. Every candidate's
  native and WGS84 coordinates are cited to tier/OBJECTID in the retained
  source files (`wfs-vegnr1-all.json`, `wfs-chain-4326.json`), not invented
  and not reprojected. Measured gaps (30.1 m, 32.63 m, and the 34.75 m
  boundary gap outside the corridor) are preserved explicitly, never
  bridged as a drawn road. `driving_access_and_direction.status` is
  `EXACT_GAP` for the whole corridor.
- **`server_data/winter-route-places.json`** (edited, targeted) — only the
  five places (`hveragerdi`, `selfoss`, `hella`, `hvolsvollur`, `vik`) had
  their `connectionStatus` changed from `PENDING` to
  `APPROACH_CANDIDATE_PROPOSED_ACCESS_UNCONFIRMED` and a new
  `candidateReference` field added. `coordinates`/`approach` stay `null`
  for all five — a candidate is not an owner selection. All other 51 places
  (name/id/region/order/aliases, and the four R1/E1/S2/C points) are
  byte-for-byte unchanged; verified by diff and by re-running the existing
  `places.test.js`.
- **`api/_lib/winterRoute/southConnections.test.js`** (new) — 11 tests.
- **`api/_lib/winterRoute/places.test.js`** (targeted adaptation) — the one
  test that asserted all 52 non-retained places are strictly `PENDING` was
  split into two: 47 still-strictly-`PENDING` places, and the 5
  south-corridor places now carrying the proposed-candidate status with a
  `candidateReference`. No other test in this file changed.
- `docs/ai/tasks/ticket-500/south/evidence.md` — one shared decision table
  for all five places, and the next precise data gap.
- `docs/ai/tasks/ticket-500/south/cc-report.md` (this file).

## Real bugs found and fixed during this round

Two real bugs were caught by the new tests before I considered this done,
both from my own data-entry when building the corridor file, not from the
underlying retained data:

1. **Field-direction inconsistency between pieces.** I initially mixed two
   different conventions for `native_start`/`native_end` on different
   pieces (intrinsic native START/END for pieces 2135/2138, but the
   chain-walk's own traversal entry/exit for all 23 other pieces) — caught
   by `findDiscontinuities()` reporting a ~11.3 km "gap" where the data
   says 0.0 m. Fixed by making every piece consistently use the
   chain-walk's own entry/exit values (and re-pointing the
   `place_node_at_start`/`place_node_at_end` attachments on pieces 2135/2138
   to match), documented in the file's own top-level `note`.
2. **Field-name mismatch in the promotion guard.** My own
   `isWronglyPromoted()` helper checked `.state`, but
   `driving_access_and_direction` uses `.status` — caught because the
   guard returned `false` for the real (correct) data when it should have
   confirmed a non-promoted baseline before the mutation test ran. Fixed to
   check either field name.

Both were caught by assertions against recomputed real values (Euclidean
distance from the raw coordinates, not a copy of the recorded number), not
by trusting the data file's own claims — exactly what the approved prompt's
"kalla raunverulegu athugunina" requirement is for.

## Verification performed

- `npx vitest run api/_lib/winterRoute/` — **118/118 tests pass** (all
  pre-existing winterRoute tests plus the 12 in `places.test.js` and 11 in
  `southConnections.test.js`).
- `npx eslint` on both touched/new test files — clean.
- `git diff --check` — clean.
- `git status --porcelain` confirms only the files the approved prompt's
  "Mörk og lifecycle" section permits were touched: `CURRENT.md` (tracked)
  plus the two new `server_data/` files, the new/adapted test files, and
  `docs/ai/tasks/ticket-500/south/`.
- The five approach-candidate coordinates were cross-checked directly
  against the raw retained WFS files (native and WGS84) inside
  `southConnections.test.js`, at the cited tier/OBJECTID — not just
  compared against the new JSON's own internal claims.

## What was NOT done (explicitly, per scope)

- No new web search or page fetch was performed — see `evidence.md` for
  why (the approved prompt's own authoritative-source bar would not be met
  by a generic road-mention page, and the EXACT_GAP status is a structural
  fact about the WFS schema, not an open question research would resolve).
- No owner candidate selection was made — all five places remain
  `APPROACH_CANDIDATE_PROPOSED...`, never `SUPPORTED`/`ROUTABLE`.
- No route engine, `/winter-route` UI, or `#501` wiring.
- No other place outside these five was touched; all 56 places, names,
  ids, and order are unchanged.
- No commit, push, or GitHub action.

## Status

PASS for this round's own stated acceptance: a bounded shared corridor
with traceable approach proposals (or precise obstacles) for the five
named places, confirmed by the tests above, with the result clearly
labeled as candidate data, not a finished driving route. `#500` as a whole
remains open — 47 places still need an access-point decision, and even
these five need owner selection plus the driving-direction authority named
in `evidence.md` before `#501` can treat them as supported.
