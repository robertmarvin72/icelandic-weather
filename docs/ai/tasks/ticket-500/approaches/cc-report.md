# #500 — approach analysis, CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-500/approaches/approved-prompt-v1.md`
  (Jonesy APPROVED without conditions; Ripley 2026-11-14).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-14/15.
- No new network calls — entirely offline, working from the 8 raw
  responses already on disk under `docs/ai/tasks/ticket-500/acquisition/samples/`.

## What was created / changed

- **`server_data/winter-route-approach-analysis.json`** (new) — all 39
  acquired places, each with a `disposition`:
  - **8 `RECOMMENDED`** — Grindavík, Þingeyri, Bolungarvík, Siglufjörður,
    Ólafsfjörður, Dalvík, Vopnafjörður, Akranes. Each grounded in a real
    geometric seam (shared coordinate) between a place-named piece and a
    separately-named connecting road (a tunnel, a named "X-vegur" road, or
    — for Akranes — the node where the "Akranesvegur"-named piece meets
    its own roundabout, handled as a node reference per OC2, never as a
    line candidate itself).
  - **8 `AMBIGUOUS_TWO_OPTIONS`** — Grundarfjörður, Ólafsvík, Bíldudalur,
    Sauðárkrókur, Varmahlíð, Patreksfjörður, Tálknafjörður,
    Keflavíkurflugvöllur (KEF). Two real, separately-grounded candidates
    each, shown honestly with no invented preference.
  - **23 `PRECISE_GAP`** — geometry exists; no defensible single endpoint.
    10 of these carry a specific, named road citation (e.g.
    Hvammstangavegur, Hafnarfjarðarvegur) the earlier round's exact-match
    rule missed; the other 13 have only dash-pair names.
- **`server_data/winter-route-remaining-coverage.json`** and
  **`winter-route-places.json`** (edited, targeted) — only a new
  `approach_analysis_reference`/`approachAnalysisReference` field added to
  the 39 relevant entries. The acquisition round's own
  status/candidate/gap snapshot is untouched (verified by test). All 56
  names/ids/regions/order/aliases unchanged; `coordinates`/`approach` stay
  `null` for all 39.
- **`api/_lib/winterRoute/approachAnalysis.test.js`** (new) — 12 tests.
- `docs/ai/tasks/ticket-500/approaches/owner-decisions.md` — one combined
  decision sheet (3 groups + cross-reference to the other 9 unselected
  candidates), not 39 separate write-ups.
- `docs/ai/tasks/ticket-500/approaches/cc-report.md` (this file).

## Method

For each of the 39, built a full-geometry seam graph (shared coordinates
within ~50 m, not just the start/end extract in
`winter-route-acquired-geometry.json`) among that place's own acquired
pieces, and identified "boundary nodes" — endpoints where a place-named
piece touches a *differently*-named piece (a real connecting road). Where
exactly one such boundary existed with a clearly primary road (tunnel,
named highway), that became the `RECOMMENDED` candidate. Where a chain had
two legitimate boundaries (both real, neither clearly primary), both are
shown as `AMBIGUOUS_TWO_OPTIONS` — this is the literal fix for the
approved prompt's own instruction not to invent a preference. Closed-ring
features (start==end, VEGHLUTI 5) were never used as a line candidate
(OC2) — Akranes uses the ring's own node explicitly instead. For the 23
gaps, road names and `STADARLYSING` text were checked for a specific tie
to the place even without an exact string match (the prior round's own
OB3 finding), and cited in the gap text where found, without being
promoted to a candidate.

## Two re-examined candidates (the approved prompt's own step 4)

- **Patreksfjörður** (piece 53127): the prior round's unjustified `END`
  pick is retracted. The piece is isolated — no seam to any other acquired
  piece, nor to the retained EPSG:4326 cross-check files, at either end.
  Both ends are now shown as an honest tie.
- **Sauðárkrókur** (piece 2485): the prior round's unjustified `END` pick
  is retracted. `END` is a real 3-way junction (Sauðárkrókur–Hofsós road
  AND Varmahlíð–Sauðárkrókur road both meet there) while `START` meets only
  one road (from Skagaströnd) — a real, documented difference in
  connectivity, but not proof either one is the town centre. Both are
  shown, with the junction detail spelled out.

## A real bug caught by the new test before this was considered done

The Akranes candidate initially cited the *roundabout's* own coordinate
(IDFERILL 21441) as if it were literally piece 3797's own end vertex.
`approachAnalysis.test.js`'s real-feature lookup caught a ~2.5 m
discrepancy between the two (`toBeCloseTo` at 6 decimal places failed).
Fixed by citing piece 3797's own real end vertex directly, with the
roundabout node named as the connecting feature (not the coordinate
source) — the ~2.5 m gap itself is a genuine ring-closure quirk in the
source data, now documented rather than silently absorbed.

## Verification performed

- `npx vitest run api/_lib/winterRoute/` — **152/152 tests pass** (all
  prior suites plus the new 12).
- `npx eslint` on the new test file — clean.
- `git diff --check` — clean.
- `git status --porcelain` confirms only the files the approved prompt's
  "Mörk og handoff" section permits were touched.
- Every emitted candidate (including the "not recommended" alternatives)
  is checked against the real raw response files directly — right
  idferill, right tier, right OBJECTID, right SHA-256, and the cited
  WGS84 point is confirmed to be that piece's own actual start/end vertex
  — not a self-comparison against the analysis file's own claims.
- Real mutation tests confirm a wrong idferill, a wrong OBJECTID, and an
  attempted `SUPPORTED` promotion are all caught by the same functions
  used on the real (correct) data.

## Status

PASS for this round's own stated acceptance: all 39 places now have a
source-grounded recommendation, an honest two-option tie, or a precisely
cited gap — never an invented endpoint, never a silently-dropped place.
This is **not** `#500` closure:

- 0 of 56 places are `SUPPORTED`/routable.
- 16 candidates (8 single + 8 two-option, 16 distinct points across the
  8 two-option places) await one combined owner decision.
- 23 places still need either a chain-walk-style disambiguation or a
  different source before any candidate exists.
- Keflavík, Skaftafell, Þórshöfn, Kirkjubæjarklaustur remain outside this
  round's own scope, untouched.
- Driving access/direction remains `EXACT_GAP` everywhere, independent of
  all of the above.

No GitHub issue was closed or edited; no commit/push performed.

## Ripley correction after Jonesy review — 2026-11-15

The report above is the historical CC delivery, not the corrected final disposition. OD1–OD4 corrected directly: Dalvík/Akranes are PRECISE_GAP (same-road interior contact / 2.5 m gap to same-named ring); Grundarfjörður/Ólafsvík retain only their differently-named-road START contact; Þingeyri is now AMBIGUOUS_TWO_OPTIONS, without a geometry-based claim that one road is primary. Candidate IDBUTUR corrected from raw for Ólafsvík 2698 and Varmahlíð 2477; source names normalized against raw. Totals are **7 recommended places + 7 ambiguous places + 25 gaps = 39**, with **21 emitted points**, not 16 points. Contacts refer to exact endpoint equality, not a 50 m merge. Current owner-decisions.md replaces the misleading owner recommendations; no owner choice or legal access is inferred. Two targeted tests added for raw seam/IDBUTUR/name validation, required candidate count/allowed disposition and genuine wrong-seam/name/ID mutation checks. Ripley ran the five data suites: **59/59 PASS** with installed Vitest 4.1.10.
