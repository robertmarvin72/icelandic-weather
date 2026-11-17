# #500 — place-evidence: corrected outcome

## Ripley corrections — 2026-11-15 (OF1–OF4)

No new searches or opens. CC reports 12 searches and 9 opens; ledger totals agree. Eleven of 29 targets were researched, eighteen were not checked. Web content and tool outcomes remain attributed to CC; Ripley did not reopen sources.

- 2 CONFIRMED_AUTHORITY_NO_GEOMETRY_BINDING: Skaftafell and Höfn, with opened source URLs recorded by CC; no candidate coordinates.
- 6 LEAD_NOT_INDEPENDENTLY_VERIFIED: Hafnarfjörður, Hvammstangi, Mosfellsbær, Þórshöfn, Skagaströnd and Keflavík. Snippets are leads only. For Þórshöfn/Skagaströnd the opened project names/status are recorded separately from unverified junction detail.
- 1 PARTIAL_AREA_LEVEL: Súðavík, project in the municipality, no town approach established.
- 1 SEARCHED_INCONCLUSIVE: Kirkjubæjarklaustur.
- 1 ATTEMPTED_BLOCKED_TOOL_OBSTACLE: Ísafjörður.
- 18 NOT_CHECKED_THIS_RUN: budget boundary, no absence claim.

The Hafnarfjörður candidate was withdrawn: neither the snippet nor STADARLYSING chooses a town approach, and piece 2807 START has no exact contact with road-40 endpoints. No new owner decision or candidate was established. Earlier 17/16 candidate totals in CC's original report were stale: the corrected approaches sheet has 7 recommended places and 7 two-option places, plus references to nine earlier unselected places. These are place counts, not emitted-coordinate counts.

All 56 places remain; no place promoted to SUPPORTED/ROUTABLE/OWNER_SELECTED. Driving access remains EXACT_GAP. #500 remains open; this data task does not deliver Frá/Til or a route engine. No new research/geometry step is started automatically.

## Original CC report — superseded claims retained for audit

The following original candidate, confirmation and total claims are superseded by the correction above; validation commands below remain CC-attributed.

# #500 — place-evidence round, CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-500/place-evidence/approved-prompt-v1.md`
  (Jonesy APPROVED without conditions, OE1–OE3 incorporated; Ripley
  2026-11-15).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-15.

## The real web research performed

Per approved-prompt-v1.md: domains restricted to `vegagerdin.is` and
`umferdin.is`, `gagnaveita.vegagerdin.is` excluded from opens, no new
WFS/API calls, no new HTTP client. Full per-search/per-open log in
`docs/ai/tasks/ticket-500/place-evidence/search-ledger.md`.

- **First test** (per the approved prompt's own instruction): one search
  + two opens for Ísafjörður/Djúpvegur. Result: a real tool-level
  obstacle (an otherwise-promising PDF could not be decoded by WebFetch
  or rendered locally — poppler-utils missing), but a second open on a
  plain HTML project page succeeded and surfaced a real fact for Súðavík.
  This confirmed the method works for HTML pages, so the round continued.
- **Total: 12 of 12 searches used, 9 of 24 opens used.** Covered, across
  the 29-place target set: Ísafjörður (blocked), Súðavík, Keflavík (town),
  Skaftafell, Þórshöfn, Kirkjubæjarklaustur, Hafnarfjörður, Mosfellsbær,
  Höfn, Hvammstangi, Skagaströnd — 11 of 29 places actively researched.
  The remaining 18 are `NOT_CHECKED_THIS_RUN` — an honest budget boundary,
  stated as such, never as "no authority exists."

## What was created / changed

- **`server_data/winter-route-place-evidence.json`** (new) — all 29
  target places, each with a `status`, the real new fact (or `null`),
  cited sources (query/URL + access method), a `candidate` where one is
  grounded (1 place), and an explicit `geometry_gap` note otherwise.
- **`server_data/winter-route-remaining-coverage.json`** and
  **`winter-route-places.json`** (edited, targeted) — only a new
  `place_evidence_reference`/`placeEvidenceReference` field added to the
  29 relevant entries. All prior status/candidate/disposition snapshots,
  coordinates, names, ids, order, and the other 27 places are untouched
  (verified by test).
- **`server_data/winter-route-approach-analysis.json`** (edited, one
  field) — Hafnarfjörður's entry gained a `place_evidence_reference`
  pointing to its new candidate; nothing else in that file changed.
- **`api/_lib/winterRoute/placeEvidence.test.js`** (new) — 12 tests.
- `docs/ai/tasks/ticket-500/place-evidence/search-ledger.md` — every
  search and open, logged with UTC/query-or-URL/result, as it happened.
- `docs/ai/tasks/ticket-500/place-evidence/evidence.md` — short summary
  (this round's own, separate from `cc-report.md`).
- `docs/ai/tasks/ticket-500/place-evidence/owner-decisions-addendum.md` —
  the one new candidate (Hafnarfjörður) plus a reference to the prior
  16-candidate sheet; the approaches round's own `owner-decisions.md` was
  not rewritten.
- `docs/ai/tasks/ticket-500/place-evidence/cc-report.md` (this file).

## A real, substantive finding: new authority bound to existing retained geometry

For Hafnarfjörður, the new web authority (Vegagerðin's own 2022/2015
annual reports, 2021 traffic counts, and a crash-location study,
independently and consistently naming junctions at Álftanesvegur and
Arnarnesvegur on Hafnarfjarðarvegur) was cross-checked directly against
the already-acquired geometry set and found to match — piece IDFERILL
2807's own `STADARLYSING` field reads "Álftanesvegur að Garðahraunsvegi"
(an exact textual match to the web-confirmed junction), and a separate
ramp piece (38401/38402, "fráreinar frá Arnarnesvegi") independently
confirms the other web-named junction. This is the one case this round
where new authority closes both the naming gap and the geometry gap at
once — a real `RECOMMENDED` candidate, still owner-unselected.

## Verification performed

- `npx vitest run api/_lib/winterRoute/` — **166/166 tests pass**.
- `npx eslint` on the new test file — one real lint error (unused `id` in
  a destructured loop) caught and fixed before considering this done;
  clean after.
- `git diff --check` — clean.
- `git status --porcelain` confirms only the files the approved prompt's
  own "Afhending og leyfðar breytingar"/"Mörk" sections permit were
  touched.
- The Hafnarfjörður candidate's idferill/OBJECTID/coordinate is checked
  against the real raw acquisition file directly, not against the new
  product file's own claim about itself.

## Status

PASS for this round's own stated acceptance: real new place/road
authority was found and recorded for 11 of 29 targets (1 with a bound
candidate, 6 authority-only, 1 unverified lead, 1 inconclusive, 1 blocked
by a tool limitation), within the approved search/open budget, with every
search and open logged. This is **not** `#500` closure:

- 0 of 56 places are `SUPPORTED`/routable/owner-selected.
- 17 candidates now await one combined owner decision (16 from the
  approaches round + the 1 new Hafnarfjörður candidate).
- 6 places have a real new named-road fact but still need a
  separately-authorized geometry step.
- 18 of the 29 targets were not reached this round (budget boundary).
- Driving access/direction remains `EXACT_GAP` everywhere.

No GitHub issue was closed or edited; no commit/push performed.
