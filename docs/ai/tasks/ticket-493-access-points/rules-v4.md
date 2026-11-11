# #493 access-points — Rules v4 (validator-closure round, I1-I6/AA1-AA6)

2026-11-10, CC. Executes `approved-prompt-v4.md`. **This round rebuilds
no data.** v1, v2 and v3's own outputs, rules, and scripts are
UNCHANGED. `samples/v4/validate_final_outputs_v4.py` reads the
authoritative v3 outputs (`place-access-status-v3.csv`,
`endpoint-candidates-v3.json`, `samples/v3/place-node-references-v3.json`)
**directly** — no fourth copy of the data tables, no unnecessary
re-run of `build_access_points_v3.py`. The read-only baseline snapshot
(`samples/v4/v1_v2_v3_and_input_baseline.json`, 77 files: every file
that existed in this task directory before this round + the 12
retained inputs, found by walking the directory rather than a
hand-maintained list) was taken BEFORE this file was written.

## I1–I6, copied verbatim from approved-prompt-v4.md (govern on conflict)

- **I1** — `validate_final_outputs_v3.py` only ran role/cum/provenance checks when `node_role`, `native_x`, `cum_km_incl_1436` AND `piece_id` were all non-blank; a VALIDATED row with a blank cum or blank `native_x` still passed. Fix: require ALL necessary fields for each of the 6 VALIDATED rows; assert the pre-registered name set and the 6/1/62/3 distribution in the validator itself; add a blank-field mutation test.
- **I2** — Borgarnes was classified by `row["name"]=="Borgarnes"` with no check that its fields are actually empty; the v2 bug (`node_role=ENTRY`, `stored_field=END`) or a filled cum would both pass unnoticed. Fix: assert Borgarnes's `node_role`/`stored_field`/`cum_*` are empty, `final_validation_outcome=NOT_VALIDATED_OUTSIDE_CW_LONG`, reason in `notes`; two mutation tests (role set, cum filled).
- **I3** — provenance/G4 coverage was narrower than claimed: wrong `crs`, wrong `native_source_field` text, and G4 node 3410 mutations (+5m, wrong hash key, wrong tier-cum) all passed, because the validator only checked G4 node 2345 and never tied `source_field`/`crs` to the coordinate itself. Fix: resolve all 7 G4 nodes against `road-links.csv`/`wfs93-raw.json`; require `source_field` to match `stored_field`; require `crs` to match the coordinate's own coordinate system; fail (not skip) when a source file is missing.
- **I4** — `role_divergence`, `coordinate_source`, `direction_status` were not defended at all. Fix: a frozen, hash-locked 72-row map or retained-source derivation per column, compared against — never against the CSV itself or `role_divergences_v3.json`.
- **I5** — the stem-hint classification's rule 1 (prefix match) claims compound road names before rule 2 (compound-suffix match) runs, so 7 of 15 informative compounds land in `HOME_PIECE_OR_ROUTE_ENDPOINT` instead of `ROAD_NAME_COMPOUND_MENTION`; `evidence-v3.md`'s "exactly" claim about rule 2 is wrong for 7 of 15. No `road_connection` impact. Fix: document the limitation and correct the "exactly" wording; do not reclassify (v3 data is frozen).
- **I6** — `evidence-v3.md` overstated validator coverage ("validated on every applicable row", "41 mutation tests" implying full coverage) and the handoff wrongly said `result-review.md` grew during the v3 round. Fix: quote and correct each overstatement; separate validator-v4-proven claims from Jonesy's own sandbox-only findings from CC-attributed claims.

## Binding scope (from approved-prompt-v4.md)

I1/I2 are mandatory fixes. I3 closes the full stated provenance scope (not deferred). I4 defends 4 columns against a retained-source derivation or frozen map, never against the file being checked. I5 keeps v3's 102/8/0/3 classification and all 113 matches unchanged — documented limitation only. I6 corrects wording to match actual proof. No unrelated hardening added.

## AA1–AA6, copied verbatim (govern on conflict, folded in before this round runs)

- **AA1** — pre-register (a) the exact non-blank required-field list for the 6 VALIDATED rows (derived from v3 CSV columns and row type, not from test outcomes), (b) the exact empty-field list for Borgarnes with its reason, (c) whether the 62 NO_NODE and 3 PAIR_REFERENCE rows must have blank role/coord/cum/provenance. Validator asserts all three lists plus the name set/6-1-62-3 distribution. Blank-field test on every required field on every one of the 6 rows; count = rows × fields, computed and printed. Each variant has a pre-registered expected check-ID; a failure on a NO_NODE side-effect, an unbound exception, or an unrelated ID does not count as passing.
- **AA2** — for `role_divergence`, `record_source`, `coordinate_source`, `direction_status` on all 72 rows: a frozen, hash-locked 72-row map or a retained-source derivation rule, per column marked (i) derived or (ii) regression-lock only. Compared against the map/rule, never against the CSV itself or `role_divergences_v3.json`. `evidence-v4.md` must not call a regression-lock "source verification". A column with no retained-source derivation (expected: `direction_status`) is documented as a precise, undisputed limitation.
- **AA3** — pre-register (a) coordinate tolerance (m) and cum tolerance (km) with rationale, (b) the CRS rule (EPSG:3057 in a registered ISN93 box for Iceland; EPSG:4326 only for the Akureyri WGS84 pair with a registered range; `source_field` must match the row's `stored_field` or the WGS84-parse source), (c) that G4 tier lengths are recomputed independently in the validator from `wfs93-raw.json`/`road-links.csv`/`chain-walks-v4.json` with the same tiers, without importing the build script and without reusing `cum93_at()`/`production_node()`. Boundary tests: reproduced value passes; +0.2m and +5m fail; cum outside tolerance fails.
- **AA4** — coverage report counts, in code, EVERY non-null coordinate pair across the CSV (6 VALIDATED + Borgarnes = 7), the 6 reference records, the 7 G4 nodes, Akureyri native+WGS84, the Reykjavík legs and both Rauðavatn candidates — checked count must equal found count; a generic walk over the outputs must catch any coordinate value no specific check covers and fail the run. The missing-source-file test uses a `tempfile` copy with the file removed and requires a named check-ID, not a traceback or a silent skip. Wrong `source_hash_key`, wrong `source_field`, native CRS=4326, and altered tier-cum all have pre-registered check-IDs too.
- **AA5** — (a) each of the 41 v3 mutation tests is either rerun against validator v4 with the same expected check-ID or marked "not applicable" with a reason — the rerun count reported separately from the new tests. (b) clean v3 data passes v4; v3 data is byte-identical before and after (SHA on all older task files and the 12 inputs, plus prefix-SHA/byte-count on append-only files, taken after the CC_IN_PROGRESS update). (c) reports and the hash table contain no `tempfile` paths, temp directory names, or timestamps; two runs are byte-identical. (d) writes confined to the task root (`rules-v4.md`, `rules-v4.sha256`, `evidence-v4.md`, the `cc-report.md` appendix, CURRENT) and `samples/v4/`.
- **AA6** — `evidence-v4.md`/CC appendix (a) quote each v3 overstatement verbatim and its correction, (b) separate into three categories — what validator v4 actually proves at run time, what Jonesy confirmed in her own sandbox via independent computation (sandbox-attributed, not part of the repo, her harness is not a deliverable), and what CC asserts (CC-attributed), (c) confirm `result-review.md` was unchanged (not grown) during the CC v3 round from the baseline data, (d) present "7 of 15" as a count computed in code (reading `stem_search_hints_v3.json`, rule: `matched_token` ends in `vegur`/`braut`/`stígur`/`gata` and is longer than the bare name) alongside the unchanged 102/8/0/3 and 113, labelled as an analysis, not a reclassification; the hints file itself stays byte-unchanged (SHA verified). (e) `rules-v4.md`/`approved-prompt-v4.md` fold in AA1–AA6 verbatim; if an AA1–AA5 condition cannot be met with retained data, CC reports the exact unmet condition without guessing.

## This round's own operational decisions (pre-registered before validator runs)

### AA1(a) — required non-blank fields for the 6 VALIDATED rows

Pre-registered set (21 columns), derived from the v3 CSV's own schema and what a `VALIDATED` row's own role/coordinate/cum/provenance semantics require — not reverse-engineered from the current data:

```
REQUIRED_NONEMPTY_FOR_VALIDATED = [
    "road_connection", "coordinate_source", "node_role", "stored_field",
    "record_source", "reference_status", "role_divergence", "final_validation_outcome",
    "native_x", "native_y", "source_path", "source_hash_key", "piece_id", "source_field", "crs",
    "native_source_piece", "native_source_field",
    "cum_km_incl_1436", "cum_km_excl_1436", "direction_status", "notes",
]
```

`gap_id` is deliberately excluded: Akureyri and Egilsstaðir legitimately have an empty `gap_id` (fully resolved, no gap), while Vík/Fáskrúðsfjörður/Reyðarfjörður/Reykjahlíð legitimately have one (role resolved but still a `NAME_MATCH_INFERRED`, not `MAPPED_CONTACT_VERIFIED`/`OWNER_APPROVED_ANCHOR`, access point). Treating `gap_id` as required would fail on real, correct data.

**Pre-registered VALIDATED name set:** `{Akureyri, Egilsstaðir, Vík, Fáskrúðsfjörður, Reyðarfjörður, Reykjahlíð}` (6). **Pre-registered distribution:** `VALIDATED=6, NOT_VALIDATED_OUTSIDE_CW_LONG=1 (Borgarnes), NO_NODE=62, PAIR_REFERENCE=3 (Selfoss, Hella, Hvolsvöllur)`, sum 72.

Blank-field test count: 6 rows × 21 fields = **126** tests, computed in code. Expected check-ID for every one: `VALIDATED_ROW_MISSING_REQUIRED_FIELD` (a single, uniform, pre-registered ID — simpler than mapping 21 distinct fields to 21 distinct IDs, and still satisfies "fails for the intended reason": the reason is always "a VALIDATED row is missing a field a VALIDATED row must have").

### AA1(b) — required empty fields for Borgarnes

```
REQUIRED_EMPTY_FOR_BORGARNES = ["node_role", "stored_field", "cum_km_incl_1436", "cum_km_excl_1436"]
```

with the reason text expected to mention `ccw_short` or `cw_long` in `notes` (D1's own documented scope boundary). Validator asserts `final_validation_outcome == "NOT_VALIDATED_OUTSIDE_CW_LONG"` and that all four fields are blank and the reason is present. Mutation tests: (1) `node_role=ENTRY, stored_field=END` (the literal v2 bug reintroduced) → expected `BORGARNES_FIELD_NOT_EMPTY`; (2) `cum_km_incl_1436`/`cum_km_excl_1436` filled with a real value → expected `BORGARNES_FIELD_NOT_EMPTY`. The clean (unmutated) copy passing is the positive confirmation that the already-empty fields are correct.

### AA1(c) — NO_NODE and PAIR_REFERENCE rows

Confirmed empirically against the real v3 CSV (not assumed): **all 62 `NO_NODE` rows have an empty `native_x`** (no leaked coordinate), and **all 3 `PAIR_REFERENCE` rows (Selfoss, Hella, Hvolsvöllur) have empty `node_role`/`native_x`/`source_path`/`piece_id`** in the main table (their real data lives only in `place-node-references-v3.json`). Pre-registered rule: for every row classified `NO_NODE` or `PAIR_REFERENCE`, `node_role`, `stored_field`, `native_x`, `native_y`, `cum_km_incl_1436`, `cum_km_excl_1436`, `source_path`, `source_hash_key`, `piece_id`, `source_field`, `crs` must ALL be blank. Mutation test: fill `native_x`/`native_y` on one `NO_NODE` row (Reykjavík) and one `PAIR_REFERENCE` row (Selfoss) → expected `NO_NODE_OR_PAIR_FIELD_NOT_EMPTY`.

### AA2 — frozen/derived map for role_divergence, record_source, coordinate_source, direction_status

Verified in sandbox (full 72-row comparison, zero mismatches) that `record_source`, `coordinate_source`, and `role_divergence` are **fully derivable** from retained sources via a small, named-set rule, with no free parameters:

1. Name ∈ `{Selfoss, Hella, Hvolsvöllur}` → `record_source=PHASE1_AND_PHASE2_PAIR`, `coordinate_source=RETAINED_GEOMETRY`, `role_divergence=NONE`.
2. Name `== Akureyri` → `record_source=OWNER_APPROVED`, `coordinate_source=OWNER_APPROVED_RETAINED`, `role_divergence=NONE`.
3. Name `== Egilsstaðir` → `record_source=PHASE2_V3_NODE`, `coordinate_source=RETAINED_GEOMETRY`; `role_divergence` computed from `place-inventory.csv`'s own `access_node_end` for piece 2345 + `cw_long`'s own `direction` for that piece via `role_from_access_node_end()` (a fresh, independent re-implementation in the v4 validator, not imported from the build script): if the phase-1-implied role ≠ the published `ENTRY`, `ROLE_SOURCE_DIVERGENCE`, else `NONE`.
4. Name `== Borgarnes` or ∈ `{Vík, Fáskrúðsfjörður, Reyðarfjörður, Reykjahlíð}` → `record_source=PHASE1_ACCESS_NODE_END`, `coordinate_source=RETAINED_GEOMETRY`, `role_divergence=NONE`.
5. Name ∈ `{Reykjavík, Seyðisfjörður}` → `record_source=""`, `coordinate_source=NO_COORDINATE_SOURCE`, `role_divergence=NONE`.
6. Else, if `place-inventory.csv` has this name with a non-`NONE` `access_node_idferill` AND that piece is a `cw_long` step → `record_source=PHASE1_ACCESS_NODE_END`, `coordinate_source=RETAINED_GEOMETRY`, `role_divergence=NONE`.
7. Else → `record_source=""`, `coordinate_source=NO_COORDINATE_SOURCE`, `role_divergence=NONE`.

This is a **derivation** (category i), not a frozen map, per column `record_source`/`coordinate_source`/`role_divergence`. The same rule applied to `place-node-references-v3.json`'s own 6 records: the ENTRY record of each pair gets `record_source=PHASE1_ACCESS_NODE_END`; the EXIT record gets `record_source=PHASE2_V3_NODE` with `role_divergence` computed the same way as Egilsstaðir's (phase-1-implied role vs. published `EXIT`) — pre-registered to be `ROLE_SOURCE_DIVERGENCE` for all three (Selfoss, Hella, Hvolsvöllur), confirmed in sandbox.

**`direction_status` has no comparable retained-source derivation** (category ii, per AA2's own allowance): its `INFERRED`/`UNKNOWN`/`NOT_APPLICABLE` value is a *product rule* from H6/J6 about what a validated `cw_long` role means, not a pure function of geometry — documented here as a precise, undisputed limitation, not papered over. It is defended by a **frozen, hash-locked 72-row map** captured from the current v3 output and checked once into `samples/v4/direction_status_frozen_map.json`:

- SHA-256 of the frozen map file as written (`samples/v4/direction_status_frozen_map.json`, UTF-8, `indent=1, sort_keys=True`, LF, trailing newline): `be5466db74a832597387f2abdfbe505d654b88c9e7c837663122b9deeeae34c0`
- Distribution: `NOT_APPLICABLE=62, UNKNOWN=4 (Borgarnes + the 3 pair rows), INFERRED=6 (the VALIDATED rows)` — matching Jonesy's own sandbox count exactly.

The validator re-hashes this file at run time and refuses to proceed if it has drifted, so the lock cannot be silently edited. Negative tests: altering `role_divergence` on Egilsstaðir or Selfoss's EXIT reference, altering `coordinate_source` on any row, and altering `direction_status` on any row must each fail with a named check-ID (`ROLE_DIVERGENCE_MISMATCH`, `COORDINATE_SOURCE_MISMATCH`, `DIRECTION_STATUS_MISMATCH` respectively) — never silently pass.

### AA3 — tolerances, CRS rule, independent G4 recomputation

- **Coordinate tolerance: 0.1 m.** Unchanged from v2/v3's own `close()` function. Rationale: well within the sub-metre rounding noise of the retained ISN93 geometry, but tight enough that a real displacement (a wrong vertex, a swapped end) is always caught.
- **Cum tolerance: 0.0001 km (0.1 m).** Matches the 4-decimal-place display rounding used throughout v2/v3 — anything looser would mask the same class of error the coordinate tolerance is meant to catch; anything tighter would fail on legitimate floating-point rounding.
- **CRS rule:** `EPSG:3057` (ISN93) coordinates must fall inside a registered box derived from the retained `road-links.csv`'s own observed coordinate range (X: 357463–747380, Y: 323611–583775), rounded outward to **X ∈ [300000, 800000], Y ∈ [300000, 650000]** — a documented margin, not the official EPSG validity extent, but one that is directly justified by this project's own retained data. `EPSG:4326` applies only to the Akureyri WGS84 pair, registered range `lat_deg_n ∈ [63, 67]`, `lon_deg_w ∈ [13, 25]` (Iceland's well-known geographic extent). `source_field` must equal `"end_x/end_y"` when `stored_field=END`, `"start_x/start_y"` when `stored_field=START`, or name the WGS84-parse source for the Akureyri WGS84 pair specifically.
- **G4 tier-length independence:** the v4 validator re-implements its own `_dist()`/`_planar_len()`/`cum93_at()`-equivalent directly from `wfs93-raw.json`'s own tier `-1`/`2` features, `road-links.csv`, and `chain-walks-v4.json` — no import of `build_access_points_v3.py`, no call into its `cum93_at()`/`production_node()`. Boundary tests: the reproduced value passes; the same coordinate shifted by `+0.2 m` and by `+5 m` both fail (`G4_COORD_MISMATCH`); a tier-cum shifted beyond tolerance fails (`G4_CUM_MISMATCH`).
- Jonesy's own sandbox-computed reference figures (G4 node cum values, 26.9266/24.7525 km tier totals) are cited in `evidence-v4.md` as **sandbox-attributed**, informational only — they are not wired into the validator as its own pass/fail source; the validator's own independent recomputation is.

### AA4 — coverage inventory (26 coordinate pairs, counted in code)

| Source | Count |
|---|---|
| `place-access-status-v3.csv` (6 VALIDATED rows + Borgarnes) | 7 |
| `samples/v3/place-node-references-v3.json` (3 places × 2 records) | 6 |
| `endpoint-candidates-v3.json` → `egilsstadir_seydisfjordur.nodes` (G4) | 7 |
| `endpoint-candidates-v3.json` → `akureyri` (native + WGS84) | 2 |
| `endpoint-candidates-v3.json` → `reykjavik` (2 legs + 2 Rauðavatn candidates) | 4 |
| **Total** | **26** |

A generic walk over the written v3 JSON/CSV structures collects every non-null `coord`/`native_x`+`native_y` occurrence; the count found by the generic walk must equal 26 and must equal the count of specific checks actually run — an unrecognised 27th coordinate (e.g. a future field) fails the run rather than passing silently. Missing-source-file test: a `tempfile` copy of `samples/v3/input_hashes_v3.json` with one input file's own path pointed at a nonexistent file is used to confirm provenance resolution returns `PROVENANCE_SOURCE_FILE_MISSING`, never a raw `FileNotFoundError`/traceback.

### AA5 — rerun of the 41 v3 mutation tests

All 41 are re-applicable under v4 (none of the 41 v3 mutation targets — CSV rows Reyðarfjörður/Vík, reference records Selfoss/Hella, endpoint-candidates Egilsstaðir/Akureyri — were removed or restructured this round) and are rerun verbatim against `validate_final_outputs_v4.run()` with the same expected check-IDs, reported as `v3_mutation_tests_rerun_count` separate from `v4_new_mutation_tests_count`.

### AA6(d) — "7 of 15" computed in code

Rule: read `samples/v3/stem_search_hints_v3.json` (byte-unchanged, SHA verified against `samples/v3/HASHES-v3.sha256`); for every match, if `matched_token` ends in `vegur`/`braut`/`stígur`/`gata` (NFC) AND is longer than the bare searched-for place name, it is an "informative compound"; of those, the ones whose own `mention_category` is `HOME_PIECE_OR_ROUTE_ENDPOINT` (not `ROAD_NAME_COMPOUND_MENTION`) are the ones rule 1 swallowed.

**Running this exact rule against the real v3 output gives 11 of 19, not Jonesy's own cited "7 of 15".** Her own I5 review text names only three examples (Skagastrandarvegur ×3, Þorlákshafnarvegur ×2, Eyrarbakkavegur ×2-wrongly-classified = 7 of a 3+2+2+8=15 subset) — an informal count that did not include the 4 `Hvammstangavegur` matches (`idferill` 3825/3826/3827/3828), which satisfy the identical stated rule. Per I6's own "wording must match what was proven" principle, the real code-computed figure (**11 of 19**) is what `evidence-v4.md`/`samples/v4/seven_of_fifteen_analysis_v4.json` report — not a figure forced to match the prose. `102/8/0/3` and `113` stay unchanged; this is a labelled analysis of v3's own frozen output, not a reclassification, and does not touch `stem_search_hints_v3.json`.

## Scope note

Offline only. No new network exchange, no new data table, no coordinate reprojection, no app/API file touched, no dependency/commit/push/GitHub action. Writes confined to `rules-v4.md`/`.sha256`, `evidence-v4.md`, the `cc-report.md` appendix, `docs/ai/CURRENT.md`, and `samples/v4/`. Temporary mutation-test copies use `tempfile.mkdtemp()` outside the repo and are deleted after use — never referenced by path in any report or hash table.
