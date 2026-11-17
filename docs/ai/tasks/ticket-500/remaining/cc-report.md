# #500 — combined review of 47 remaining places, CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-500/remaining/approved-prompt-v1.md`
  (Jonesy APPROVED without conditions; Ripley 2026-11-14).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-14.

## What was created / changed

- **`server_data/winter-route-remaining-coverage.json`** (new) — exactly 47
  entries, one per still-PENDING place, each with a `status`
  (`RETAINED_CANDIDATE_NAME_MATCH_INFERRED` / `ROAD_IDENTIFIER_RETAINED_NO_GEOMETRY`
  / `NAME_MENTION_ONLY_NO_GEOMETRY` / `NO_RETAINED_MATCH`), a `candidate`
  object where one exists (native coordinates, IDFERILL, stored field,
  WGS84 where retained — only Borgarnes has it), `road_condition_refs`
  (IDBUTUR + name) where a road-condition identifier exists, a
  `name_mention_ref` where only a text mention exists, and a `gap` object
  naming exactly what's missing and which sources were checked. A shared
  `sources` table carries path/SHA-256 for every retained file used once,
  referenced by key from each entry.
- **`server_data/winter-route-places.json`** (edited, targeted) — only the
  47 places' `connectionStatus` (now one of the four states above, no
  longer the generic `PENDING`) and a new `coverageReference` field were
  changed. `coordinates`/`approach` stay `null` for all 47 — a retained
  candidate is not an owner selection. The 9 already-resolved places
  (R1/E1/S2/C and the 5 south-corridor candidates) are untouched. All
  56 names/ids/regions/order/aliases are unchanged (confirmed below).
- **`api/_lib/winterRoute/remainingCoverage.test.js`** (new) — 11 tests.
- **`api/_lib/winterRoute/places.test.js`** (targeted adaptation) — the one
  test that asserted "47 still strictly PENDING" was replaced with two
  tests: the 5 south places still carry their proposed-candidate status
  (unchanged, re-asserted), and the 47 reviewed places now carry one of
  the four new states plus a `coverageReference`, never `PENDING` again.
  No alias/south test was touched beyond that.
- `docs/ai/tasks/ticket-500/remaining/evidence.md` — totals + one grouped
  gap list (4 groups, by data source/action type), not a restatement of
  all 47 entries.
- `docs/ai/tasks/ticket-500/remaining/cc-report.md` (this file).

## Method, briefly

For each of the 47: checked `place-access-status-v3.csv` (name match +
final_validation_outcome), `samples/v3/stem_search_hints_v3.json`
(INFERRED text-mention hints, already vetted by a prior round),
`place-inventory.csv` (bulk work-list rows), and both road-condition files
(`vegagerdin-faerd2017-1.json`, `legacy-faerd-fresh.json`, name/IDBUTUR
only, no geometry — confirmed by inspecting their field lists). Four
places (Borgarnes/Reykjahlíð/Reyðarfjörður/Fáskrúðsfjörður) already had a
real `VALIDATED`/`NOT_VALIDATED_OUTSIDE_CW_LONG` row in v3 with native
coordinates — reused directly, not re-derived. Borgarnes additionally
reuses the exact WGS84 point already established in `#491`'s own
`end_borgarnes`/`four_points.P4` (same IDFERILL 2819, same native and WGS84
values — confirmed by direct comparison, not re-fetched).

## A real naming-declension bug caught during this round

The road-condition cross-check initially relied on
`stem_search_hints_v3.json`'s own `stem_variants` for each place. Two of
those stored variants turned out to be internally inconsistent with normal
Icelandic genitive declension (e.g. Tálknafjörður's own stored variant list
never actually included the "Tálknafjarðar-" genitive stem that the real
road name "Tálknafjarðarvegur" uses) — so the automated search silently
returned zero road-condition matches for Tálknafjörður and Reykhólar even
though real matches exist in both road-condition files (Tálknafjarðarvegur
506170037; Reykhólasveitarvegur 506070037/905120037 — the latter explicitly
flagged as a two-IDBUTUR example in the approved prompt's own NE1 note).
Caught by manually re-deriving the correct declined stems and re-running
the search directly against the raw files, not by trusting the prior
round's stem list as-is. Fixed by adding the two real matches directly,
cited to the actual file content. A third over-broad match (Þorlákshöfn's
automated search pulling in unrelated Hellisheiði/Selfoss pieces that only
mention "Þorlákshafnarvegur" deep inside a longer route description) was
trimmed to the two clean, directly-named matches instead.

## Verification performed

- `npx vitest run api/_lib/winterRoute/` — **130/130 tests pass** (all
  pre-existing tests plus the adapted `places.test.js` and the new
  `remainingCoverage.test.js`).
- `npx eslint` on both touched/new test files — clean.
- `git diff --check` — clean.
- `git status --porcelain` confirms only the files the approved prompt's
  "Mörk og lifecycle" section permits were touched.
- Real cross-file checks inside `remainingCoverage.test.js`: the four
  candidate coordinates are recomputed from `road-links.csv` directly (not
  compared against the new JSON's own copy of the number); Borgarnes's
  WGS84 is matched against the real `wfs-vesturland-4326.json` feature at
  its cited OBJECTID; every `road_condition_refs` IDBUTUR is checked to
  actually exist in the real road-condition files; a fabricated IDBUTUR and
  a fabricated coordinate are both confirmed to be caught by the same
  real-data checks (not a self-comparison).

## Status / #500 closure assessment

PASS for this round's own stated acceptance: all 47 places now have a
traceable, source-cited result (a candidate, a road identifier, a text
mention, or a confirmed absence) instead of the generic "not reviewed"
status, confirmed by the tests above. This is **not** a statement that
`#500` is closed or that nationwide coverage is complete:

- 0 of the 56 places are `SUPPORTED`/routable.
- 4 places have an owner decision pending on a NAME_MATCH_INFERRED
  candidate (G1 in `evidence.md`).
- 37 places (36 road-identifier + 1 name-mention) need a new, scoped
  geometry acquisition before any candidate can be proposed (G2/G3).
- 6 places have nothing retained at all and need either a new scoped check
  or an owner-approved acquisition (G4).
- Driving access/direction remains `EXACT_GAP` everywhere, independent of
  all of the above.

No GitHub issue was closed or edited; no commit/push performed.
