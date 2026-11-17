# #500 — fixing 10 more retained-candidate approach points, CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-500/retained-selection/approved-prompt-v1.md`
  (Jonesy APPROVED without conditions, OI1–OI2 incorporated; Ripley
  2026-11-16).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-16. This single handoff authorizes exactly this
  10-point retained-data selection, per the approved prompt's own framing.
- This round builds on the approach-selection round's own corrected base
  (Jonesy's OH1–OH3 fixes, already applied to `places.json`/
  `approach-selections.json` before this round started) — confirmed read
  fresh, not assumed from an earlier snapshot.

## First real test, then the rest

Per the approved prompt: compared one point (Bolungarvík, piece 2215
START) against its real raw endpoint and current (null) place entry
before writing anything. Matched exactly. Verified the other nine the
same simple way before touching any file.

## What was created / changed

- **`server_data/winter-route-approach-selections.json`** (edited,
  additive only) — 10 new `SELECTED_PRODUCT_APPROACH` entries added:
  Grindavík, Bolungarvík, Siglufjörður, Ólafsfjörður, Vopnafjörður,
  Grundarfjörður, Ólafsvík, Hveragerði, Vík, Borgarnes — each with
  `selection_basis: RETAINED_CANDIDATE_APPROVED_VIA_PROMPT` (distinct from
  the earlier 11's `MAP_RECOMMENDATION_APPROVED_VIA_PROMPT`),
  `access_status: EXACT_GAP`, exact source idferill/stored-field, and a
  short Icelandic/English approach description. **The original 13 entries
  (11 selected + 2 not-selected) are untouched.** Total now 23
  dispositions (21 selected + 2 not-selected).
- **`server_data/winter-route-places.json`** (edited, targeted) — only
  these 10 places' `coordinates`, `approach`, `connectionStatus`,
  `selectionReference`, and a new `selection_basis` field were set (the
  last one matching the pattern the approach-selection round's own OH2
  fix established on the earlier 11). All prior reference fields kept.
  The other 46 places — including the 15 already selected and
  Reyðarfjörður/Fáskrúðsfjörður — are untouched. The file's own top-level
  `note` now says 25 of 56 places have a selected approach, 31 remain
  unselected. **Confirmed by direct inspection: exactly these 10 places
  carry `selection_basis: RETAINED_CANDIDATE_APPROVED_VIA_PROMPT`, and
  exactly 25 of 56 places have non-null coordinates.**
- **`api/_lib/winterRoute/approachSelections.test.js`** (extended) — new
  independent expected list for the 10, new tests for: the 7
  acquisition-sourced points against real raw tier -1 data; the
  Vopnafjörður seam naming **3182** specifically (not the first-encountered
  same-named piece 3671), per OI2; the OI1-required cautious wording and
  technical caveats (34.75 m / 629 m / cw_long) in Hveragerði/Vík/
  Borgarnes's own `approach`/`connectionStatus.reason` text; a 3-way
  `selection_basis` distinction (MAP / RETAINED / none) replacing the
  earlier binary check. The original 11-point tests are unchanged.
- **Five other test files adapted** (`places.test.js`,
  `remainingCoverage.test.js`, `southConnections.test.js`,
  `approachAnalysis.test.js`, `acquiredGeometry.test.js`) — each got the
  10 new ids added to its own existing, already-narrow
  `SELECTED_PRODUCT_APPROACH_IDS` exception set, scoped to exactly the
  subset relevant to that file (e.g. only 7 of the 10 fall inside the
  39-place acquisition/analysis scope; only Hveragerði/Vík fall inside the
  5-place south-corridor scope). No null-requirement was weakened for any
  other place. `placeEvidence.test.js` needed no change — none of its 29
  targets overlap this round's 10, confirmed before touching it.
- `docs/ai/tasks/ticket-500/retained-selection/cc-report.md` (this file).

## Source verification performed (not just the selections file)

- The 7 acquisition-sourced points (Grindavík, Bolungarvík, Siglufjörður,
  Ólafsfjörður, Vopnafjörður, Grundarfjörður, Ólafsvík) were checked
  directly against the real raw tier -1 features in
  `docs/ai/tasks/ticket-500/acquisition/samples/raw-*.json` — exact match
  at the cited idferill/stored-field.
- **Vopnafjörður (OI2):** piece 3707's END vertex is genuinely close to
  *both* the same-named piece 3671's end *and* piece 3182's
  ("Vopnafjörður-Skógavegur") start — confirmed directly against the raw
  coordinates, not assumed. The selection's own reason text names 3182
  specifically, not the first-encountered same-named piece, per the
  approved prompt's own instruction.
- Hveragerði and Vík were confirmed to be each place's single
  `RECOMMENDED` candidate in `winter-route-south-connections.json`,
  cross-checked against native start/end in `road-links.csv`. Hveragerði's
  34.75 m gap to the Hellisheiði segment and Vík's 629 m internal-seam
  caveat (the fixed runtime route continues further east) are both stated
  explicitly in the place's own `approach`/`connectionStatus.reason`, per
  OI1 — neither is called a confirmed town approach or boundary.
- Borgarnes was confirmed to reuse the exact same WGS84 point as `#491`'s
  own `end_borgarnes`/`P4` (IDFERILL 2819, OBJECTID 5082, tier -1, from
  `wfs-vesturland-4326.json`) — not a new coordinate. The retained
  ccw_short/cw_long caveat from `remaining-coverage.json` is carried into
  the new selection's own reason text unchanged.

## Verification performed

- `npx vitest run api/_lib/winterRoute/` — **192/192 tests pass**.
- `npx eslint` on all touched test files — clean.
- `git diff --check` — clean.
- `git status --porcelain` confirms only the files the approved prompt's
  own "Leyfðar skrár" section permits were touched.
- Direct before/after inspection (not git diff, since the files are
  untracked): exactly 10 places gained `selection_basis:
  RETAINED_CANDIDATE_APPROVED_VIA_PROMPT`; exactly 25 of 56 places now
  have non-null coordinates (4 earlier owner-selected + 11 MAP-selected +
  10 RETAINED-selected).

## Status

PASS for this round's own stated acceptance: 10 more product approach
points fixed from already-reviewed retained candidates (no new
coordinates invented, no new acquisition), each verified against real
source data, with every pre-existing exception-based test still enforcing
"null until selected" for the other 31 places. This is **not** `#500`
closure:

- 0 of 56 places are `SUPPORTED`/routable — driving access/direction
  remains `EXACT_GAP` on all 21 selected product-approach points.
- Hveragerði's 34.75 m gap and Vík's 629 m internal-seam caveat are
  unresolved, by design — selection does not close them.
- Reyðarfjörður/Fáskrúðsfjörður are untouched this round, as instructed.
- 31 of 56 places still have no selected or candidate approach point.

No GitHub issue was closed or edited; no commit/push performed.
