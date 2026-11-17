# #500 — fixing the last 2 product approach points, CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-500/east-selection/approved-prompt-v1.md`
  (Jonesy APPROVED without blockers, OM1–OM2 incorporated; Ripley
  2026-11-16).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-16.
- The visual map check itself was performed by Ripley (with the owner's
  authorization) in a separate session with image-rendering capability,
  recorded in `docs/ai/tasks/ticket-500/east-selection/map-check.md` —
  **not** a CC or Jonesy visual check, and not re-attributed as one
  anywhere in this round's output. This round needed no browser/network
  access, matching the approved prompt's own framing.

## Step 1 (data verification) — re-confirmed this round

Re-verified (not merely copied from the approved prompt's table) against
the real retained files:

- `docs/ai/tasks/ticket-493-place-network/samples/road-links.csv` and
  `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` (tier -1, native
  EPSG:3057): Reyðarfjörður's `2553 START` = `(722850.6187, 511691.7700)`,
  OBJECTID `5331`, exactly matching `2813`'s own END (0.0 m shared
  endpoint). Fáskrúðsfjörður's `2536 END` = `(733763.5297, 501861.9080)`,
  OBJECTID `5271`, exactly matching `3843`'s own START.
- WGS84 projection, using the same inverse Lambert Conformal Conic
  implementation verified in earlier rounds (GRS80, ISN93 parameters, no
  new dependency): `2553 START` → **65.02999390726326,
  -14.266008824536579**; `2536 END` → **64.93458924724804,
  -14.051426350254996** — both match the approved prompt's own table to
  the precision given.

## What was created / changed

- **`server_data/winter-route-approach-selections.json`** (edited) —
  Reyðarfjörður and Fáskrúðsfjörður changed from
  `CURRENT_CANDIDATE_NOT_SELECTED` to `SELECTED_PRODUCT_APPROACH`, each
  with `selection_basis: MAP_JUNCTION_APPROVED_VIA_PROMPT`,
  `source.database: "road-links"`, the new idferill/stored-field,
  `native_xy`/`native_crs`/`wgs84`/`wgs84_derivation` (same schema as
  Reykjahlíð's own entry), `access_status: EXACT_GAP`, and a new
  `map_observation` block (`source_role: RIPLEY_VISUAL_CHECK`, the exact
  OSM URL, the observation text, `estimated_offset_m: [0, 10]`) pointing
  to `map-check.md` — never presented as a new CC/Jonesy check. **The old
  `CURRENT_CANDIDATE_NOT_SELECTED` disposition for each place is
  preserved verbatim under `previous_disposition`** — that rejection was
  about a *different* source point (`2520 START` for Reyðarfjörður; `2536
  START`, the opposite end of the same piece, for Fáskrúðsfjörður) and
  remains correct; it is not overwritten or implied to have been a
  mistake. All other 21 entries are untouched. Total now 23 dispositions,
  **all** `SELECTED_PRODUCT_APPROACH`.
- **`server_data/winter-route-places.json`** (edited, targeted) — only
  these 2 places' `coordinates`, `approach`, `connectionStatus`,
  `selectionReference`, `selection_basis`, and a new
  `coordinateDerivationReference` were set. All prior reference fields
  kept. The other 54 places — including the 25 already selected — are
  untouched. The file's own top-level `note` now says 27 of 56 places
  have a selected approach, 29 remain unselected. **Confirmed by direct
  inspection: exactly these 2 places carry `selection_basis:
  MAP_JUNCTION_APPROVED_VIA_PROMPT`, and exactly 27 of 56 places have
  non-null coordinates.**
- **`api/_lib/winterRoute/approachSelections.test.js`** (extended) — new
  independent expected list for the 2 junction points; new tests
  verifying: the native coordinate against the real retained
  `wfs-vegnr1-all.json` (a different source file than the acquisition
  round's own raw data — a real lookup bug was caught and fixed here, see
  below); the 0.0 m shared endpoint with the "other" piece; the WGS84
  projection; the `map_observation`/`map_reference` fields; that
  `previous_disposition` is preserved and genuinely differs from the new
  live selection (with a real mutation test); a 4-category
  `selection_basis` check (MAP / RETAINED / MAP_JUNCTION / none) replacing
  the earlier 3-category one. All prior tests for the other 21 selections
  are unchanged in behavior (counts updated where the new total required
  it).
- **Two other test files adapted** (`places.test.js`,
  `remainingCoverage.test.js`) — each got `reydarfjordur`/`faskrudsfjordur`
  added to its own already-narrow `SELECTED_PRODUCT_APPROACH_IDS`
  exception set. No null-requirement was weakened for any other place.
  `southConnections.test.js`, `acquiredGeometry.test.js`,
  `approachAnalysis.test.js`, and `placeEvidence.test.js` needed no
  change — none of their own scoped place sets include Reyðarfjörður or
  Fáskrúðsfjörður.
- `docs/ai/tasks/ticket-500/east-selection/cc-report.md` (this file).

## A real bug caught and fixed before this was considered done

My first version of the new native/WGS84 verification test reused the
existing `findRawFeature()` helper, which only searches the acquisition
round's own `docs/ai/tasks/ticket-500/acquisition/samples/raw-*.json`
files (the 82-IDBUTUR WFS set). Reyðarfjörður/Fáskrúðsfjörður's pieces
(`2553`, `2813`, `2536`, `3843`) were never part of that acquisition and
are not in those files — the test failed with "idferill 2553 not found",
correctly catching that I'd pointed the check at the wrong source. Fixed
by adding a separate `findVegnr1Feature()` helper reading the actual
source these two points come from
(`docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json`), and by
comparing native EPSG:3057 metres against `native_xy` (not degrees
against `wgs84`, which an earlier draft of the same test also confused) —
the WGS84 check is done separately via the same Lambert projection
already verified in prior rounds.

## Verification performed

- `npx vitest run api/_lib/winterRoute/` — **196/196 tests pass**.
- `npx eslint` on all touched test files — clean.
- `git diff --check` — clean.
- `git status --porcelain` confirms only the files the approved prompt's
  own "Leyfðar skrár" section permits were touched.
- Direct before/after inspection (files are untracked, so not a git diff):
  exactly 2 places gained `selection_basis:
  MAP_JUNCTION_APPROVED_VIA_PROMPT`; exactly 27 of 56 places now have
  non-null coordinates (4 earlier owner-selected + 11 MAP + 10 RETAINED +
  2 MAP_JUNCTION).

## Status

PASS for this round's own stated acceptance: the last 2 of the
previously-rejected candidates are now fixed as selected product approach
points, at a genuinely different, Ripley-visually-confirmed junction (not
the earlier, still-correctly-rejected endpoint), with every retained-data
figure re-verified against real source files this round. This is **not**
`#500` closure:

- 0 of 56 places are `SUPPORTED`/routable — driving access/direction
  remains `EXACT_GAP` on all 23 selected product-approach points.
- Road 92 (Norðfjarðarvegur) and road 955 (Búðavegur) are visible on the
  map at these junctions but are not present in the retained VEGNR=1
  dataset — no external graph connection, direction, or current access is
  confirmed by this round.
- 29 of 56 places still have no selected or candidate approach point.

No GitHub issue was closed or edited; no commit/push performed.
