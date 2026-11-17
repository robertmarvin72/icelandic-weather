# #500 — remaining-map-selection round (27 product approach points), CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-500/remaining-map-selection/approved-prompt-v1.md`
  (Jonesy APPROVED without blockers, OR1–OR3 incorporated; Ripley 2026-11-16).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage: READY_FOR_CC`,
  2026-11-16.
- The visual OpenStreetMap review of all 27 points was performed by Ripley
  (owner-authorized), recorded in `docs/ai/tasks/ticket-500/remaining-map-selection/map-review.md`
  and `candidate-review.json` — **not** a CC or Jonesy visual check, and not
  re-attributed as one anywhere in this round's output. This round needed no
  browser/network access, matching the approved prompt's own framing.

## Step 1 (data verification) — performed before any file was written

Per the approved prompt's own "first real test" instruction, verified ONE
point (Búðardalur, 2769 START) directly against `docs/ai/tasks/ticket-500/acquisition/samples/raw-BATCH-2.json`
(SHA-256 match, OBJECTID 4902, tier -1, start vertex `[-21.76505686, 65.10591772]`
exactly matching the approved prompt's table) and confirmed the current
`places.json` entry was null, **before** proceeding to the other 26.

Then verified all remaining 26 the same way:

- **25 acquisition-raw points**: each of SHA-256, IDFERILL, OBJECTID, tier -1,
  and the exact stored start/end vertex re-checked directly against the real
  `raw-BATCH-1.json` … `raw-BATCH-7.json` files (not copied from
  `candidate-review.json`). All 25 matched exactly; all 25 places were null
  beforehand. (Script used for this: a one-off Python verification run over
  the real raw files — not retained as product code.)
- **2 native EPSG:3057 points** (Skaftafell `3513 END`, Kirkjubæjarklaustur
  `2313 END`): re-verified against `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json`
  (SHA-256, OBJECTID 5875/5747, tier -1) **and** cross-checked against
  `docs/ai/tasks/ticket-493-place-network/samples/road-links.csv`'s own
  `end_x`/`end_y` columns (exact match to the native vertex). Projected to
  WGS84 using the same inverse Lambert Conformal Conic implementation
  (GRS80, ISN93 parameters) verified in prior rounds; deviation from the
  approved prompt's own table value was ~3.6×10⁻¹⁵°, far inside the OR2
  requirement of `< 1e-7`°.

No mismatch was found on any of the 27 points — no blocker, no substitution.

## What was created / changed

- **`server_data/winter-route-approach-selections.json`** (edited) — added
  27 new entries, each `status: SELECTED_PRODUCT_APPROACH`,
  `selection_basis: MAP_PRODUCT_APPROVED_VIA_PROMPT`, `access_status:
  EXACT_GAP`. `source.database` is `"acquisition-raw"` for 25 entries and
  `"road-links"` for the 2 native entries (which also carry `native_xy`,
  `native_crs`, `wgs84_derivation` — same schema as the east-selection
  round's Reyðarfjörður/Fáskrúðsfjörður). Each carries `map_reference:
  "docs/ai/tasks/ticket-500/remaining-map-selection/map-review.md"` and a
  `map_observation` block (`source_role: RIPLEY_VISUAL_CHECK`, the real OSM
  URL, Ripley's own observation text) — **deliberately with no
  `estimated_offset_m`/uniform distance figure**, per the approved prompt's
  explicit instruction not to fabricate a 0–10 m-style figure across all 27
  (that figure was specific to the earlier two-junction round's own
  map-check.md). The old 23 entries (including Reyðarfjörður/
  Fáskrúðsfjörður's `previous_disposition`) are completely untouched — the
  merge script asserted no existing key would be overwritten. Total now 50
  dispositions, all `SELECTED_PRODUCT_APPROACH`, across 4
  `selection_basis` categories (11 MAP + 10 RETAINED + 2 MAP_JUNCTION + 27
  MAP_PRODUCT). Top-level `note` updated to reflect this.
- **`server_data/winter-route-places.json`** (edited, targeted) — only the
  27 target places' `coordinates`, `approach`, `connectionStatus`,
  `selectionReference`, and `selection_basis` were set (plus
  `coordinateDerivationReference` for the 2 native ones). All prior
  reference fields (`coverageReference`, `acquiredGeometryReference`,
  `approachAnalysisReference`, `placeEvidenceReference`) were preserved
  unchanged. Keflavík (town) and Þórshöfn — and all other 27 already-
  selected/retained places — are byte-for-byte unchanged. **Confirmed by
  direct inspection**: exactly 54 of 56 places now have coordinates; the
  only 2 remaining null are `keflavik` and `thorshofn`. Top-level `note`
  updated to the real achieved counts (54/56, 2 null, 50 selections).
- **OR1-required risk wording** — embedded verbatim and verified directly
  against the live data (not just asserted in tests):
  - Akranes: contains "2,5" and "21441", states the gap is unresolved.
  - Dalvík: contains "3501" and "innri" (explicitly internal, not external).
  - Kirkjubæjarklaustur: contains "2409", states the source gap is
    unresolved.
  - Höfn: contains "982" and "3170", with an explicit "EKKI notaður" denial
    that the airport road point was used.
  - Kópavogur: contains "gegnumveg" (through-road); **does not** contain
    "gatnamót" (junction) anywhere in `approach`/`connectionStatus.reason`/
    `map_recommendation_reason`/`approach_is`.
  - Hafnarfjörður: explicitly names the withdrawn `2807 START` candidate
    and states it is not revived.
- **`api/_lib/winterRoute/approachSelections.test.js`** (extended) — new
  independent expected list (`EXPECTED_PRODUCT` / `EXPECTED_PRODUCT_NATIVE`,
  hand-typed from the approved prompt's own table, not from
  `candidate-review.json`), with: literal-equality checks against the real
  raw EPSG:4326 vertices (not rounded `toBeCloseTo`); OR2's `Math.abs(...) <
  1e-7` tolerance for both acquisition-raw and native-projected points; OR3
  presence/no-new-claim check on `approach_en`; the 6 OR1 wording-guard
  tests (Akranes/Dalvík/Kirkjubæjarklaustur/Höfn/Kópavogur/Hafnarfjörður);
  a no-false-routability check across all 27; and real negative/mutation
  tests (wrong source file for a native idferill, native-vs-WGS84 unit
  confusion, a moved-coordinate literal-equality catch, confirmation that
  Keflavík/Þórshöfn and the prior 23 dispositions were not touched). Also
  updated the pre-existing count assertions (23→50 dispositions, 27→54
  places with coordinates, 29→2 null, 23→50 places with
  `selectionReference`).
- **Five other test files adapted** (`places.test.js`,
  `remainingCoverage.test.js`, `acquiredGeometry.test.js`,
  `approachAnalysis.test.js`, `placeEvidence.test.js`) — each got exactly
  the subset of the 27 new ids that fall within that file's own place-scope
  added to its own `SELECTED_PRODUCT_APPROACH_IDS` exception set (25 for
  `acquiredGeometry`/`approachAnalysis`, since Skaftafell/Kirkjubæjarklaustur
  are native-only places never part of the 39-place acquisition scope; all
  27 for `places`/`remainingCoverage`/`placeEvidence`). No null-requirement
  was weakened for any other place; `southConnections.test.js` needed no
  change (none of its 5 south-corridor ids overlap this round's 27).

## A genuinely checked edge case, not a bug

`remainingCoverage.test.js` and `placeEvidence.test.js` both already carry
tests asserting `kirkjubaejarklaustur`'s coverage entry is
`NAME_MENTION_ONLY_NO_GEOMETRY` (candidate null) and `skaftafell`'s is
`NO_RETAINED_MATCH` (candidate null) — those findings are about the
**coverage file's own candidate search**, not about the final product
selection, and remain correct. This round's selection for both places comes
from a **different, independent source** (the native EPSG:3057 `road-links`
set), exactly the same already-established pattern used for
Reyðarfjörður/Fáskrúðsfjörður in the east-selection round. I verified this
distinction holds (the coverage entries are unchanged; the new coordinates
come from `wfs-vegnr1-all.json`/`road-links.csv`, not from
`winter-route-remaining-coverage.json`) rather than assuming it.

## Verification performed

- **`npx vitest run` is currently broken in this environment for every test
  file in the repo**, including files I never touched this round (confirmed
  on `api/_lib/winterRoute/routes.test.js`, which fails identically with
  `TypeError: Cannot read properties of undefined (reading 'config')`,
  reproduced with both the default pool and `--pool=forks`, and after
  clearing the Vite/Vitest cache). All `vitest`/`@vitest/*` package versions
  are consistent (4.1.10), so this is not a dependency mismatch I can see;
  the active Node version here is 24.11.0, while `CLAUDE.md` documents CI as
  running Node 20 — a plausible cause, but changing the Node version is an
  environment change outside this round's scope, so I did not attempt it.
  **This is a pre-existing tooling defect, not a defect in this round's
  deliverable** — per the project's own distinction between a helper-tool
  flaw and a product blocker, I stopped troubleshooting the tool after two
  bounded attempts and relied on direct verification instead:
  - `npx eslint` on all 6 touched/extended test files — clean, no output.
  - `git diff --check` — clean.
  - `git status --porcelain` — only files within the approved prompt's own
    "Leyfðar skrár" scope are touched (plus the expected `CURRENT.md`
    stage change).
  - A dedicated before/after inspection script (direct JSON reads, not
    `git diff`, since these files are untracked) ran **145 independent
    checks** against the live data: 56 places / unique ids, exactly 54
    with coordinates and exactly `{keflavik, thorshofn}` without, each of
    the 27 new places has the right `selection_basis`/coordinates/
    approach/`selectionReference`, the old 23 dispositions' categories are
    byte-for-byte unchanged, Keflavík/Þórshöfn carry no new fields, KEF
    remains distinct from Keflavík, selections total exactly 50 with no
    unexpected ids, and no place anywhere claims SUPPORTED/ROUTABLE.
    **144/145 passed**; the one flagged line was a false positive in my own
    ad-hoc regex (it matched the word "unsupported" inside an unrelated,
    pre-existing `#501` note on `reykjavik-raudavatn`'s `reason` text, a
    place this round never touches) — not a real issue, and not something
    the actual `isWronglyPromoted()` test helpers (which check `state` only,
    not `state + reason` concatenated) would ever flag.
  - The Lambert projection for the 2 native points was independently
    recomputed in Python and matched the approved prompt's table to
    ~3.6×10⁻¹⁵°.

Because the automated suite could not be executed, I could not reproduce
the "N tests fail in the old state / all N+k pass in the new state" style
confirmation used in prior rounds. The test code itself has been written
and is believed correct (ESLint-clean, logically mirrors the verified data
exactly), but it has **not been run** this round. This should be re-run by
whoever next has a working `vitest` in this environment, and is the one
open item I'm flagging rather than silently asserting as PASS.

## Status

The 27 product approach points are fixed in `places.json`/
`winter-route-approach-selections.json`, each independently re-verified
against real retained source data (not copied from any summary document),
with the exact OR1 risk wording embedded and confirmed present, and OR2/OR3
followed in both the data and the (unexecuted) test code. This is **not**
`#500` closure:

- 54/56 places now have a selected product approach point; 2 (Keflavík town,
  Þórshöfn) remain without any retained source geometry — unchanged by this
  round, no new acquisition attempted, per the approved prompt's own
  boundary.
- 0 of 56 places are `SUPPORTED`/routable — driving access/direction remains
  `EXACT_GAP` on every selected point, including all 27 added this round.
- The specific unresolved caveats called out in the approved prompt (Akranes
  2,5 m gap to ring 21441; Dalvík's internal seam at 3501; Kirkjubæjarklaustur's
  unresolved gap to 2409; Höfn's point distinguished from the airport road)
  remain exactly that — unresolved, honestly recorded, not silently closed.
- **Open item**: `npx vitest run` could not be executed in this environment
  (pre-existing, reproduces on untouched files) — the extended/new test code
  has not been run this round and should be re-run before `RESULT_REVIEW`
  relies on a reported pass count from this session.

No GitHub issue was closed or edited; no commit/push performed.

## Ripley correction and validation addendum — 2026-11-16

OQ1 fixed directly: the older selection_basis test now covers MAP_PRODUCT as its fifth category. OQ2 corrected in the same bounded change: all27 source objects now retain file/sha256/objectid/tier from the frozen candidate manifest, with each SHA independently checked against local source bytes; new test resolves actual source feature/endpoint and checks each map URL's mlat/mlon against the selected coordinates. All27 current-place reason texts now name Ripley explicitly; places-note spelling corrected to Þórshöfn. Native projection parameters checked for both native entries. No selected coordinates or previous choices changed.

Independent local validation now succeeds: `node node_modules/vitest/vitest.mjs run api/_lib/winterRoute/` — **215/215 PASS across15 files**, Vitest4.1.10. ESLint on the six touched tests and git diff --check clean (Git emitted a line-ending conversion warning for CURRENT, no whitespace error). This resolves the open test-execution item for final assessment; it does not establish why Vitest failed in the earlier CC session, whose environment diagnosis remains unverified.
