# #501 closure scope and blocker list

Written against `approved-prompt-v1.md` P1-P8. Documents only, read-only
investigation. No production code, runtime JSON, or prior approved
prompt/result-review file was touched while producing this document. Every
figure below is from a real call to the production handler/core in this
session (via a temporary scratchpad script, never committed), not copied
from `prompt-review.md`'s own sandbox citations without independent
re-verification. Where a number matches a citation from the review
history, that match is noted as a cross-check.

## 1. Current support list (generated from the real handler, not the plan)

A temporary scratchpad script called the real `api/winter-route-geometry.js`
handler for every ordered pair among all 60 ids (56 `winter-route-places.json`
ids + `flokalundur` + the 3 junction ids: `junction-1-60-baulan`,
`junction-1-68-stadarskali`, `junction-60-61-throskuldar`) -- 3,600 calls.
Results:

| Bucket | Count |
|---|---|
| `geometry_only` | 36 directional (18 unordered) |
| `same_place` | 5 (one per id) |
| `200 unsupported endpoint_mapping_unavailable` | 3,107 |
| `400 unknown_place_id` | 452 |

This reproduces the approved prompt's own cited expectation exactly
(36/5; the 452/3,107 split was not independently pre-cited but sums
correctly: 36+5+3,107+452 = 3,600).

### 18 unordered `geometry_only` pairs (10 ring pilot + 8 Vestfirðir)

**Ring pilot (tier 2, the five nodes `{reykjavik-raudavatn, egilsstadir, seydisfjordur, hella, selfoss}`, C(5,2)=10 unordered pairs):**

| Pair | Length (m) | Option | geometryId (one direction) |
|---|---|---|---|
| reykjavik-raudavatn ↔ hella | 80,681.31193354058 | south (default) | `a7137730003351c3d1b81cd43755b632` |
| reykjavik-raudavatn ↔ selfoss | 44,984.77037809235 | south (default) | `215a1805457eb42ad937c6d8217f10aa` |
| reykjavik-raudavatn ↔ egilsstadir | 615,333.3403813917 | -- | `2e22ddd927a7ba2f56c30f282c855501` |
| reykjavik-raudavatn ↔ seydisfjordur | 639,482.2012623339 | -- | `293f06413173aeaa74529759f11f3e7d` |
| egilsstadir ↔ seydisfjordur | 24,148.860880942146 | -- | `e79c0f7e8237d6c2ecd910771b8b8bda` |
| egilsstadir ↔ hella | 584,988.7322487979 | -- | `a041d9ee159987438d648ac75b971508` |
| egilsstadir ↔ selfoss | 620,628.5319733637 | -- | `3eb67fbf700c14cc6681c0b309708274` |
| seydisfjordur ↔ hella | 609,137.59312974 | -- | `7e0447a52e32f20553b72cabad008649` |
| seydisfjordur ↔ selfoss | 644,777.3928543058 | -- | `f845d08b328e1c00c23d74e82d27bc2b` |
| hella ↔ selfoss | 35,646.17744949154 | -- | `6c8979a3345eb95c1a582277835834c1` |

All ten are **selectable endpoints** (each of the 5 ring-pilot ids has a
real literal endpoint mapping in the tier-2 pilot dataset). Only the
`reykjavik-raudavatn↔hella`/`↔selfoss` pairs carry a real `south`/`north`
option (the default, shorter, confirmed `south`); the other eight ring
pairs have no `option` field (the core always returns one real path for
them). These ten pairs' own citations are correctly **omitted** from
`closure-plan.md`'s own plan table, per this prompt's own P1 instruction
-- but they ARE a real part of the current 18-pair support list.

**Vestfirðir (tier 0, 8 region files, each its own `regionVersion`):**

| Pair | Length (m) | geometryId (fwd / rev) | regionVersion |
|---|---|---|---|
| junction-1-60-baulan ↔ budardalur | 42,155.20284701861 | `742bbdeda4fa8e8a43497d8baf81ca78` / `559dde16d36824995bbe9cfe143b1896` | `1db44672a059e700` |
| budardalur ↔ flokalundur | 172,474.2228360156 | `9d3e8ed90702ba8c1ddd42da6b77967d` / `751dbdae1921b182d2f595a78c737ecb` | `2f68aa481848357b` |
| flokalundur ↔ isafjordur | 87,618.54830414167 | `8b97e2e43a594e5c9b5efc24b82d6736` / `0eebee66c0e5303de512b9f643fcc75a` | `06fca99f301d1444` |
| isafjordur ↔ holmavik | 223,136.98949144362 | `2d47312feaa4fa8aa674c7af85616461` / `ffe6847001f2be1ed57d85a874d2c48a` | `adfc38ce4897744c` |
| junction-1-68-stadarskali ↔ holmavik | 110,073.97484054108 | `124d9ec93d3906a17c9b2d91d2cb0a73` / `f1933968efffd50843055023053ef516` | `c1e9cd24a2aaa02c` |
| junction-60-61-throskuldar ↔ holmavik | 30,555.315457176555 | `e72b5d8434200eb4976b94ad63d32426` / `3faa1848ce9584700999026dc7d6ef46` | `af6b37ce8086a587` |
| flokalundur ↔ patreksfjordur | 61,400.098965121026 | `c4312f35bf25f0bc3394423f20927a6a` / `b326156f58b6cf5a91c70c01fc9ffe57` | `1c09dfb6f6fde51c` |
| patreksfjordur ↔ talknafjordur | 17,114.94341971567 | `b0c4c6228ca16ca0ebe5507710db9875` / `5def85456ea881da8b8d36c7f6abd55e` | `656802aa4d9332f6` |

All eight are **selectable endpoints**, each from its own independent
region file (no shared `regionVersion`). `junction-1-60-baulan`,
`junction-1-68-stadarskali`, and `junction-60-61-throskuldar` are **not**
place ids (not in `winter-route-places.json`) -- they are literal road-junction
coordinates, recognized only as one side of their own single approved
pair. `flokalundur` is likewise not a place id; it is recognized only
paired with `budardalur`, `isafjordur`, or `patreksfjordur`.

### same_place (exactly 5, all ring-pilot ids)

`reykjavik-raudavatn`, `egilsstadir`, `seydisfjordur`, `hella`, `selfoss` --
confirmed `same_place` for `from===to`. Every other id, including every
Vestfjarðir endpoint (`budardalur`, `isafjordur`, `holmavik`,
`patreksfjordur`, `talknafjordur`) and `flokalundur`, returns `unsupported`
(not `400`) for `from===to` -- confirmed by direct real calls (`budardalur→budardalur`,
`holmavik→holmavik`, `isafjordur→isafjordur`, `patreksfjordur→patreksfjordur`,
`talknafjordur→talknafjordur` all returned `200 unsupported endpoint_mapping_unavailable`).
This is the shown blocker **B1** (section 5).

### `400 unknown_place_id` (flokalundur + 3 junction ids)

`flokalundur`, `junction-1-60-baulan`, `junction-1-68-stadarskali`, and
`junction-60-61-throskuldar` each return `400` with every other id except
their own approved partner(s) -- 452 directional cases confirmed by the
real enumeration. Not listed row-by-row (452 rows would not aid review);
collapsed into this one description per this prompt's own P1 instruction.

### All other pairs (3,107 directional)

Every pair between two of the 56 known-but-unmapped-or-mapped place ids
that isn't one of the 36 `geometry_only` pairs or the 5 `same_place` cases
returns `200 unsupported endpoint_mapping_unavailable` -- confirmed by the
real enumeration, collapsed into this one line per this prompt's own P1
instruction (not 3,500+ individual rows).

## 2. Table of the eight original #501 closure criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Stable route id/version, ends, selected option, ordered geometry/segments, weather/færð tie points | **Delivery boundary -- tie-point surface is NOT unified** | `api/winter-route-geometry.js` carries `geometryId`/`regionVersion`/`datasetVersion`/`compositionVersion` consistently across all 18 pairs (tests: `api/winter-route-geometry.test.js`, 257/257 focused tests independently passed in the prior Ripley Tálknafjörður assessment; 813/813 full api/ was CC-reported in that prior round, not rerun here). **But** the tie-point field itself differs by surface: Vestfirðir pairs expose `idButurIds`; the tier-2 ring pilot exposes only `slices[].idbutur` (no top-level `idButurIds` field); the pre-existing fixed route (`src/lib/winterRouteRoutes.js`, `api/winter-route.js`) exposes neither -- only `FORECAST_POINTS` for Vík/Borgarnes. A green `geometry_only` test never proves these three surfaces are unified; they are not, and no code change was made or proposed here to unify them. |
| 2 | Reykjavík→Selfoss/Hella short route + the other Ring Road option where data allows | **Satisfied** | Confirmed live: `reykjavik-raudavatn↔hella` 80,681.31193354058 m (`south`, default); `↔selfoss` 44,984.77037809235 m (`south`, default). The `north` option is implemented (`api/_lib/winterRoute/raudavatnSelfossNorthOption.js`) and selectable via `?option=north` (tests: `raudavatnSelfossNorthOption.test.js`, `ring-options-mvp`/`hella-ring-options-mvp` rounds' own handler tests). |
| 3 | Egilsstaðir→Seyðisfjörður direct vegur 93 | **Satisfied** | Confirmed live: 24,148.860880942146 m, both directions, real `geometryId`s above. |
| 4 | Reversal/role/direction and clear same_place | **Shown blocker (B1) for Vestfjarðir endpoints** | Reversal confirmed for all 18 unordered pairs (same length, different `geometryId`). `same_place` is correctly returned only for the 5 ring-pilot ids -- the 6 Vestfjarðir endpoints (and `flokalundur`) return `unsupported`/`400` instead of `same_place` for `from===to`, confirmed by direct real calls. This is the literal gap criterion 4 flags. |
| 5 | No double-counting of ring closure/1436/shared segments | **Satisfied for existing pairs; composed pairs remain B2** | Existing focused tests cover current pairs. Experiment A is a real script-based composition check, not a shipped API or regression test; step 2 must pin the composed result and no repeated real edges in tests. |
| 6 | Broken graph/unconfirmed connection gives unsupported/gap | **Satisfied** | Confirmed structurally: `disconnected_graph` is returned whenever a required connector/line is removed (every connector round's own P7 negative test, e.g. the Patreksfjörður round's "without the connector → `unsupported`/`disconnected_graph`" test). `endpoint_mapping_unavailable` is returned for every known-but-unmapped place (3,107 cases above). A green `geometry_only` result is never read as proof of `same_place`/closure/#503 tie points (explicitly not conflated anywhere in this document or the production code). |
| 7 | Targeted tests on options/both directions/shared tie-road/closure/reversal/same_place/data gap | **Partly satisfied — B1/B2 still need same_place and composed-pair tests** | Prior focused tests cover existing behavior; 257/257 is attributed to the previous Ripley assessment. 813/813 was the previous CC-reported full api/ suite, not a cumulative count of rounds or a new run here. Script-based Experiment A is not a replacement for the step-2 tests. |
| 8 | Existing fixed routes continue working or verified migration | **Satisfied by focused fixed-route regression checks; no migration** | Separate fixed-route surface retained. CC did not run these focused tests in this round. Jonesy sandbox reported 32/32; Ripley independently reran api/winter-route.test.js and api/_lib/winterRoute/routes.test.js on Windows (Vitest 4.1.10): 32/32 PASS, 2026-11-20. No migration to the geometry API was performed or required. |

`drivingAccess` remains `UNVERIFIED` on every pair -- an approved MVP
assumption from the start of this ticket, not a new Vegagerðin
confirmation requirement, and not re-litigated here.

## 3. Real test and Experiment A

### Real handler calls (current state)

- `budardalur → holmavik`: `200 unsupported endpoint_mapping_unavailable` (confirmed live).
- `holmavik → budardalur`: `200 unsupported endpoint_mapping_unavailable` (confirmed live, reversed).
- One reversed existing pair: `seydisfjordur → egilsstadir` = 24,148.860880942146 m, `geometryId` `3f67cfaa1ab61fd70a7dccfaf0ebbac0` (same length as the forward direction, different id -- confirmed live).
- `same_place` for the 5 working ids: confirmed above (section 1).
- One Vestfjarðir id showing `unsupported`, not `same_place`: `holmavik → holmavik` = `200 unsupported endpoint_mapping_unavailable` (confirmed live, not `same_place`).

### Experiment A -- merging region files by sourceId (read-only, offline)

A temporary scratchpad script loaded all 8 existing Westfjords region
loaders and merged their own `lines` arrays into one map keyed by
`sourceId`, asserting that any sourceId appearing in more than one region
file is identical where it overlaps.

**Result: 7 distinct sourceIds overlap across the 8 regions (9 overlap
occurrences, since `3648` and `3883` each appear in 3 regions), 0 real
conflicts.** One metadata difference affecting via was found and is worth recording
precisely: `sourceId 3611` (shared between the `junction-1-68-stadarskali↔holmavik`
and `junction-60-61-throskuldar↔holmavik` regions) carries an extra
`idbuturName` field in the former's own copy (used only for that round's
own `via`-matching against the retained 708 IdButur table) that the
latter's own copy lacks -- the geometry, `idbutur`, `name`, and `veghluti`
are byte-identical in both copies; this difference does not affect geometry, length, or IdButur, but idbuturName is used for via. Six of seven overlapping full objects are JSON-equal; 3611 has an extra field. Step 2 must preserve the superset of compatible fields, keep the existing J68 pair unchanged and pin via for new pairs explicitly in tests.

**Merging just the two region files relevant to Búðardalur↔Hólmavík**
(`budardalur-flokalundur` for the Búðardalur-side leg up to and including
line `3755`, `throskuldar-holmavik` for the Hólmavík-side leg from line
`3321` onward) gives 24 lines, 0 conflicts, and:

- `budardalur → holmavik`: **78,697.77054505677 m**, 12 slices, sourceId order
  `2769[3->4], 3197, 3247, 3462, 40961, 3460, 3771, 3755, 3321, 3324, 3611, 3883[0->3]`,
  **no connector**, reverse gives the identical length (diff 0 m).
- `3755`'s own end is confirmed byte-identical (x/y/**z**, `42.058`) to
  `3321`'s own start -- the literal join that makes this leg possible
  without touching Flókalundur at all.

This is an **exact match** to the approved prompt's own cited sandbox
figure (78,697.77054505677 m) -- CC's own real measurement, not a copied
citation.

**A first full-merge attempt (all 8 regions) initially mis-measured the
other pairs** because the merge script omitted one of the two connectors
(`-4`, the Búðardalur↔Flókalundur 5 mm bridge) -- with it missing, Dijkstra
correctly found the *next-best real path* through the Þröskuldar/Hólmavík
road network instead of the direct, shorter one, giving a plausible but
wrong ~383 km figure for `budardalur↔flokalundur` on the merged graph.
This was caught by comparing the merged-graph result against the already-established
172,474 m figure for that same pair, diagnosed to the missing connector,
and fixed (collect **every** region's own `connector` field, not just two
of them) before any figure below was treated as final. This is recorded
here as a concrete example of why Jonesy's own "±0.05 m / different slice
order = STOP" instruction is the right discipline -- it is exactly how this
error was caught.

### Experiment A -- the ten new pairs (full 8-region merge, corrected)

With both connectors (`-4`, `-5`) and all 88 non-connector lines correctly
merged (90 composable lines total), CC's own real measurement for all ten
proposed new pairs:

| Pair | Length (m) | Slices | estimatedConnectorLengthM | Cross-check vs. prompt-review's own sandbox figure |
|---|---|---|---|---|
| budardalur ↔ isafjordur | 260,092.771140 | 38 | 0.0050 | 260 092,77 -- exact |
| budardalur ↔ holmavik | 78,697.770545 | 12 | 0 | 78 697,77 -- exact |
| budardalur ↔ patreksfjordur | 233,874.321801 | 28 | 4.3982 | 233 874,32 -- exact |
| budardalur ↔ talknafjordur | 248,219.989743 | 28 | 0.0050 | 248 219,99 -- exact |
| flokalundur ↔ holmavik | 154,887.083205 | 17 | 0.0050 | 154 887,08 -- exact |
| flokalundur ↔ talknafjordur | 75,745.766907 | 8 | 0 | 75 745,77 -- exact |
| isafjordur ↔ patreksfjordur | 148,325.101540 | 24 | 4.3932 | 148 325,10 -- exact |
| isafjordur ↔ talknafjordur | 162,670.769481 | 24 | 0 | 162 670,77 -- exact |
| holmavik ↔ patreksfjordur | 216,287.182170 | 24 | 4.3982 | 216 287,18 -- exact |
| holmavik ↔ talknafjordur | 230,632.850112 | 24 | 0.0050 | 230 632,85 -- exact |

All ten real measurements match the approved prompt's own cited sandbox
figures exactly (within the real floating-point precision available), 0
double-counted sourceIds in every case (checked programmatically), and
reverse gives the identical length in every case. `budardalur↔talknafjordur`,
`flokalundur↔talknafjordur`, and `isafjordur↔talknafjordur` are confirmed
to contain **neither** `53127` nor `-5` in their own sourceId list (they
reach Tálknafjörður via `2271→3361→2889` directly, never via Patreksfjörður) --
confirming the approved prompt's own exclusion rule precisely.
`budardalur↔patreksfjordur` and `holmavik↔patreksfjordur` both carry
**two** connectors (`-4` and `-5`, summing to 4.3982 m) -- confirming the
approved prompt's own worked example for `budardalur↔patreksfjordur` and
extending the same logic (independently, not copied) to `holmavik↔patreksfjordur`.

### The Ring Road danger (independently re-verified)

On the same merged 90-line Westfjords-only network (deliberately excluding
any Ring Road line, since none of the 8 region files carry one), composing
between the two junction ids gives a real, measured, wrong detour:

- `junction-1-60-baulan ↔ junction-1-68-stadarskali`: **219,478.01638676506 m**,
  26 slices -- exact match to the approved prompt's own cited 219,478.02 m.
- `budardalur ↔ junction-1-68-stadarskali`: **177,322.81353974645 m**, 20 slices --
  exact match to the approved prompt's own cited 177,322.81 m.

For contrast, composing the same `junction-1-60-baulan ↔ junction-1-68-stadarskali`
pair on the **full retained national tier-0 fitja** (read-only, the raw
GeoJSON already used throughout this ticket's own negative tests --
not a new acquisition), which DOES include the real Ring Road lines
between these two points, gives **51,570.87852880872 m**, 6 slices
(`3103, 3406, 3407, 3408, 2243, 1481`) -- an exact match to the approved
prompt's own cited 51,570.88 m. This confirms, independently, why junction
ids must not be added to any new place-pair allowlist without a deliberate,
separate owner decision to add the real Ring Road lines themselves: the
Westfjords-only network silently produces a plausible but ~4x-too-long
wrong answer for any junction-to-junction query, exactly the kind of
silent wrong-answer risk this entire ticket has treated as a STOP
condition throughout.

## 4. Fixed proposal for step 2

**One merged Westfjords network** (either the stub-free 88-line + 2-connector
merge demonstrated in Experiment A, or the same result reached by extending
the sourceId-merge method into a dedicated runtime file -- both are
equivalent and already verified above) for the six place endpoints
`{budardalur, flokalundur, isafjordur, holmavik, patreksfjordur, talknafjordur}`,
with an explicit allowlist covering exactly the ten new pairs verified in
section 3, both directions.

**Smallest delivery set, if a smaller first cut is wanted:**
- `budardalur↔holmavik` (Experiment A's own 2-region, no-connector proof).
- `budardalur↔isafjordur` (exercises the `3834` roundabout caveat and the
  `-4` connector together, across two already-existing pairs, with no
  double-counting -- confirmed above).
- `holmavik↔patreksfjordur` (exercises both connectors, `-4` and `-5`,
  summing correctly -- confirmed above).

The other seven pairs are additive without new design if they pass the
same tests already run here; no further owner check-in is needed for them
unless something new turns up during actual implementation.

**Binding conditions for step 2** (verified true of the already-demonstrated
merge, to be preserved by whatever concrete implementation is chosen):

- All eight existing branches keep their own `geometryId`/`regionVersion`/length
  byte-identical; the ten new pairs are a pure addition in front of the
  general known-id gate.
- **Junction ids are excluded from the new allowlist.** Pairs involving
  `junction-1-60-baulan`, `junction-1-68-stadarskali`, or `junction-60-61-throskuldar`
  with anything other than their own already-approved partner remain
  `unsupported`/`400` exactly as today. Ring Road lines are **not** added
  in step 2 unless the owner makes that decision separately and explicitly
  (section 3's own danger finding is the reason).
- `budardalur/flokalundur/isafjordur/holmavik↔talknafjordur` never contain
  `53127` or `-5` (confirmed above).
- 0 double-counted sourceId on every pair (confirmed programmatically above).
- `estimatedConnectorLengthM` must be the sum of every slice with
  `sourceId < 0` actually on that specific route -- not reused from a
  single-connector pair's own value. `lengthNote` must be generated per
  connector actually present on the route (e.g. a two-connector pair like
  `budardalur↔patreksfjordur`/`holmavik↔patreksfjordur` must describe both
  gaps, not just one, reusing neither pair's own existing single-connector
  wording verbatim).
- Every `isafjordur`-involving pair carries the existing `3834` roundabout
  caveat; every `talknafjordur`-involving pair carries the existing 995 m
  `routeEndsShortOfOwnerCoordinate` flag. `accessApproach` stays keyed by
  `placeId` (the pattern already established for multi-endpoint pairs).
  IdButur stays in travel order, connector `null` skipped.
- `same_place` should be added for every already-supported Vestfjarðir id
  (`budardalur, isafjordur, holmavik, patreksfjordur, talknafjordur`, and
  `flokalundur` if it becomes selectable in the new pairs) -- this closes
  blocker B1 (section 5). Whether `flokalundur`'s own existing `400`
  response for *unsupported* pairs changes to `200 unsupported` for
  `flokalundur` paired with a *newly-supported-but-not-directly-connected*
  id is explicitly **Ripley/owner's decision**, not pre-decided here; this
  document's own recommendation is that `flokalundur` becomes selectable
  in the new pairs and gets `same_place`, without silently changing any
  existing `400` response for pairs that stay unsupported.
- If any part of this requires changing `geometryComposition.js`, new data
  acquisition, or changing any existing branch's own behavior: STOP with
  the smallest option before widening scope. No promise is made here of a
  Ring Road tie-in between the tier-0 Westfjords network and the tier-2
  ring pilot.

**Short route profile for #502/#503:** the Vestfjarðir surface's own top-level
field is `idButurIds` (an array, already route-validated, connector nulls
skipped); the ring-pilot surface's own equivalent is `slices[].idbutur`
(no top-level array); the pre-existing fixed route's own surface is
`FORECAST_POINTS`, unrelated to either. A `#502`/`#503` consumer must read
whichever field exists for the surface it is calling -- this is a
documentation note for that future ticket, not a code change here.

## 5. Closed blocker list

| ID | Trigger | Real wrong/missing result (measured) | Impact on approved MVP | Smallest fix |
|---|---|---|---|---|
| **B1** | `from===to` on a supported Vestfjarðir id (`budardalur, isafjordur, holmavik, patreksfjordur, talknafjordur`; `flokalundur` once selectable) | `200 unsupported endpoint_mapping_unavailable` (confirmed live for all 5 current ids; `flokalundur` gives `400` since it is not yet in `winter-route-places.json`) instead of `same_place` | Closure criterion 4 | A `same_place` branch for these ids, same response shape as the existing ring-pilot `same_place`, with its own focused test -- part of step 2's own scope (section 4). |
| **B2** | Any of the ten new place pairs today (e.g. `budardalur→holmavik`) | `200 unsupported endpoint_mapping_unavailable` (confirmed live) | The connected Westfjords flow described in `closure-plan.md` does not yet exist as an API surface | Step 2 as specified in section 4. |
| **B3** | `#503`-style tie-point consumer reading a Vestfjarðir vs. ring-pilot vs. fixed-route response | **Not a blocker** unless a real consumer-side error is shown; the three different field names (section 2, criterion 1) are a real contract difference, resolved by documentation (the route profile note in section 4), not a code change to any existing pair. | None demonstrated | N/A unless a real error surfaces later. |

**Optional (own section, never a blocker; no addition without a newly
shown error):** `lengthNote` test-tightening beyond what already exists;
pinning internal inserted-vertex coordinates against the raw GeoJSON more
tightly than the existing ±1e-6 m checks; a hypothetical 0.01 m internal-vertex
tolerance change; a real Tálknafjörður town connection (closing the 995 m
gap); adding the Hringvegur Baulan↔Staðarskáli stretch as its own runtime
branch.

## 6. Named follow-up table -- all 31 Dalir-og-Vestfirðir CSV rows (34-64)

Every row's real nearest-retained-line offset below is a genuine point-to-segment
projection against the real merged 88-line Westfjords network (not a
visual estimate), computed in this session. "Status" reflects what the
measured distance actually supports -- `prompt-review.md`'s own hypothesis
for this section was explicitly unverified ("Tilgáta mín (ósannreynd)");
where the real measurement confirms it, that is noted; where it does not
(two rows below), that is noted just as plainly, per this prompt's own
instruction that proximity alone never proves a place is visited.

| Röð | Staður | Staða | Mæld fjarlægð í næstu retained línu (raunmælt) | Nálægðardómur við línu á legg (ekki route-notkun) |
|---|---|---|---|---|
| 34 | Búðardalur | Veljanlegur endi | 160.1 m (línu 2769, eigin innskotshnútur) | Já -- endi eigin leggjar |
| 35 | Brattabrekka | Millistaður á núverandi legg | 564.8 m (3753, á `junction-1-60-baulan↔budardalur` legg) | Já |
| 36 | Dalsmynni | Ekki place-id -- fyrri "Dalsmynni-gildra", EKKI bókstaflegur vegamótapunktur | 3,707.2 m (3544) | Nei -- staðfest of langt, aldrei notaður sem endi/vegamót (fyrri lotu-niðurstaða, endurstaðfest hér) |
| 37 | Holtavörðuheiði | Framtíðargrein (Hringvegur) — owner-punktur utan núverandi Vestfjarðanets | 15,548.2 m (1796, veg68-leggur) | Nei -- Hringvegur-staður, ekki Vestfjarðagrein |
| 38 | Gilsfjörður | Millistaður á núverandi legg (nokkuð fjarri sjálfu vegamótinu) | 2,255.5 m (3771, á `budardalur↔flokalundur` legg) | Já, en athuga að fjarlægðin er meiri en flestir staðfestir millistaðir -- ekki yfirtúlka sem "beint á veginum" |
| 39 | Króksfjarðarnes | Millistaður á núverandi legg | 592.9 m (3771, sami leggur) | Já |
| 40 | Reykhólar | Framtíðargrein (afleggjari) -- EKKI millistaður á núverandi legg, þrátt fyrir að nálægasta lína sé í núverandi neti | 9,808.6 m (49925, á `budardalur↔flokalundur` legg) | Nei í reynd -- fjarlægðin er of mikil til að kalla þetta "á leiðinni"; Tilgáta prompt-review (millistaður) **ekki staðfest** af raunmælingu |
| 41 | Þröskuldar | Ekki place-id -- vegamóts-viðmið (owner-aðkoma Þröskulda, `junction-60-61-throskuldar`-leggurinn er AÐSKILINN frá þessu owner-hniti) | 809.5 m (3324, á `junction-60-61-throskuldar↔holmavik` legg) | Já, línan er á leggnum; owner-punkturinn sjálfur er samþykkt kortaviðmið, ekki endi |
| 42 | Flókalundur | Veljanlegur endi | 51.3 m (3648, eigin innskotshnútur) | Já -- endi eigin leggjar |
| 43 | Brjánslækur | Vegtengd ferjuhöfn -- framtíðargrein/gagnagat, EKKI ferjuundanþága sjálf | 346.5 m (3698, á `flokalundur↔patreksfjordur` legg) | Já, línan er á leggnum (aðkoman að höfninni), en höfnin/ferjan sjálf er utan umfangs |
| 44 | Flatey á Breiðafirði | Ferjuundanþága | 19,035.3 m (3339) | Nei -- fjarri, ferja, ekki vegtengt |
| 45 | Barðaströnd | Framtíðargrein/valleið -- borderline, ekki nógu nálægt til að kalla staðfestan millistað | 1,274.4 m (3334, á `flokalundur↔patreksfjordur` legg) | Nálægt en ekki staðfest "á leiðinni" með sömu nákvæmni og 34/42/48/49/56/61 |
| 46 | Breiðavík | Framtíðargrein (Suðurfjarðaleið) | 17,028.6 m (53127) | Nei |
| 47 | Látrabjarg | Framtíðargrein (Suðurfjarðaleið) | 26,700.8 m (53127) | Nei |
| 48 | Patreksfjörður | Veljanlegur endi | 8.8 m (53127, eigin innskotshnútur) | Já -- endi eigin leggjar |
| 49 | Tálknafjörður | Veljanlegur endi, með 995,43 m gagnagati (`routeEndsShortOfOwnerCoordinate`) | 995.4 m (2889, eigin leggur -- þetta ER hið samþykkta gagnagat, ekki ný niðurstaða) | Já -- endi eigin leggjar, en endar fyrir owner-punkti |
| 50 | Bíldudalur | Framtíðargrein | 11,974.2 m (2889) | Nei |
| 51 | Dynjandi | Millistaður á núverandi legg | 772.8 m (2870, á `flokalundur↔isafjordur` legg) | Já |
| 52 | Dýrafjarðargöng | **Tilgáta ekki staðfest** -- CSV-punkturinn er langt frá bæði raunverulegu göngunum (38085/38087/38088, 6,2-12,6 km) og frá núverandi legg (4,5 km) | 4,519.9 m (3003, á `flokalundur↔isafjordur` legg); nærvera gangalínanna sjálfra (38087) er 10.1 km | Nei með núverandi gögnum -- CSV-hnitið sjálft ("Áætlaður staðarpunktur") virðist verulega frábrugðið raunverulegri staðsetningu göngunna; skrá sem gagnagat, ekki giska á úrbót |
| 53 | Þingeyri | Framtíðargrein (afleggjari) | 2,067.3 m (3003) | Nei í reynd -- ekki nógu nálægt til að kalla millistað |
| 54 | Flateyri | Framtíðargrein (afleggjari) | 5,941.2 m (2297) | Nei |
| 55 | Suðureyri | Framtíðargrein (afleggjari) | 13,928.3 m (2618) | Nei |
| 56 | Ísafjörður | Veljanlegur endi | 164.6 m (3834, eigin leggur) | Já -- endi eigin leggjar |
| 57 | Hnífsdalur | Framtíðargrein (á leið til Bolungarvíkur) | 3,306.1 m (3834) | Nei |
| 58 | Bolungarvík | Framtíðargrein (afleggjari) | 10,918.9 m (3834) | Nei |
| 59 | Súðavík | Millistaður á núverandi legg -- **leiðrétting á tilgátu prompt-review** (var skráð sem framtíðargrein, raunmæling sýnir það ekki) | 284.4 m (3535, á `isafjordur↔holmavik` legg) | Já |
| 60 | Steingrímsfjarðarheiði | Millistaður á núverandi legg | 961.6 m (3418, á `isafjordur↔holmavik` legg) | Já |
| 61 | Hólmavík | Veljanlegur endi | 437.3 m (3883, eigin leggur) | Já -- endi eigin leggjar |
| 62 | Drangsnes | Framtíðargrein (afleggjari) | 5,704.8 m (2690) | Nei |
| 63 | Norðurfjörður | Framtíðargrein (afleggjari um Strandaveg) | 32,650.0 m (3370) | Nei |
| 64 | Hrútafjörður | Ekki place-id -- owner-kortaviðmið (`junction-1-68-stadarskali`-leggurinn er AÐSKILINN frá þessu owner-hniti) | 403.5 m (1796, á `junction-1-68-stadarskali↔holmavik` legg) | Já, línan er á leggnum; owner-punkturinn sjálfur er samþykkt kortaviðmið, ekki endi |

**Summary against the approved prompt's own hypothesis:** 6 rows are
confirmed selectable endpoints today (34, 42, 48, 49, 56, 61) -- matches
exactly. 2 rows are confirmed junction/map-reference points, not place
ids (41, 64) -- matches exactly. 1 row (43) is confirmed a road-connected
ferry harbor, distinct from the ferry exception itself -- matches exactly.
1 row (44) is confirmed the ferry exception -- matches exactly.

Of the **7 rows** `prompt-review.md` hypothesized as likely intermediate
points on an existing leg (35 Brattabrekka, 38 Gilsfjörður, 39
Króksfjarðarnes, 45 Barðaströnd, 51 Dynjandi, 52 Dýrafjarðargöng, 60
Steingrímsfjarðarheiði): **5 are confirmed** by real measurement (35,
39, 51, 60, and 38 -- though 38/Gilsfjörður's own 2.26 km is a wider
margin than the other four and is flagged in its own table row), **1 is
borderline** (45/Barðaströnd, 1.27 km -- plausible but not as tight as
the other confirmed intermediates), and **1 is not confirmed** (52/Dýrafjarðargöng
-- the CSV's own estimated coordinate measures far from both the real
tunnel lines (6.2-12.6 km) and the current leg (4.5 km); recorded as a
real, unresolved data gap rather than silently reclassified).

Of the **12 rows** `prompt-review.md` hypothesized as future branches (40
Reykhólar, 46 Breiðavík, 47 Látrabjarg, 50 Bíldudalur, 53 Þingeyri, 54
Flateyri, 55 Suðureyri, 57 Hnífsdalur, 58 Bolungarvík, 59 Súðavík, 62
Drangsnes, 63 Norðurfjörður): **11 are confirmed** as genuine distant
branches by real measurement (all measure 2-33 km from the nearest line
on an existing leg), and **1 is a real correction to the hypothesis**:
59/Súðavík measures only **284.4 m** from the `isafjordur↔holmavik` leg's
own line `3535` -- as close as the confirmed intermediate points above,
not a distant branch. This document records that correction plainly
rather than keeping the original branch label for the sake of matching
the unverified hypothesis.

**Other places from the 164-place base:** every other CSV row outside
rows 34-64 belongs to a different named regional category (Höfuðborg og
Vesturland, Norðurland, Austurland, Suðurland, etc. -- the same regional
column already present in the retained CSV itself) and is out of this
closure round's own scope; no new GitHub issue or national audit was
created or is proposed here.

## Ripley scope clarification 2026-11-20

The last column of the 31-row table is a proximity judgement, not proof that the source line is absent from a route when marked Nei. Nearest sourceIds already listed are retained; proximity never means the owner-place is visited or selectable. No new endpoints or geographic completion claims result from this table.

Step-2 implementation must explicitly include: metadata-superset merging for sourceId3611 with deterministic via for new pairs; same_place for Flókalundur without adding it to the general56list; unchanged old400responses for unsupported Flókalundur/junction pairs. Existing limitations/coverage follow-up remain as approved.
