# #493 access-points — Evidence v4 (validator-closure round, I1–I6/AA1–AA6)

2026-11-10, CC. This round rebuilds no data: `place-access-status-v3.csv`,
`endpoint-candidates-v3.json`, and `samples/v3/place-node-references-v3.json`
are the SAME authoritative v3 outputs this file verifies, read directly
(no fourth copy). This file is an index over v4's own closure
artefacts and corrects v3's own overstated wording — `evidence-v3.md`
is not rewritten, superseded, or marked SUPERSEDED (it remains on
disk, byte-unchanged, confirmed in `samples/v4/HASHES-v4.json`).

## 0. File index

| File | Role |
|---|---|
| `rules-v4.md` / `.sha256` | Required-field lists, frozen/derived-column rules, tolerances/CRS, coverage inventory, mutation-test plan — written and hashed before the validator ran |
| `samples/v4/snapshot_v3_and_inputs.py` → `v1_v2_v3_and_input_baseline.json` | Read-only pre-round snapshot (77 files: every file that existed in this task directory + 12 inputs, found by walking the directory) |
| `samples/v4/direction_status_frozen_map.json` | Frozen, hash-locked 72-row `direction_status` regression-lock (AA2) |
| `samples/v4/validate_final_outputs_v4.py` | The closure validator — self-contained, no import of the build script or v3's own validator |
| `samples/v4/mutation_tests_v4.py` → `mutation_test_report_v4.json` | 41 v3-mutation reruns (Part A) + 140 new I1-I4 tests (Part B), all against the real v4 validator on `tempfile` copies |
| `samples/v4/compute_7_of_15_v4.py` → `seven_of_fifteen_analysis_v4.json` | AA6(d)'s informative-compound analysis (read-only, SHA-verifies `stem_search_hints_v3.json` unchanged) |
| `samples/v4/generate_hashes_v4.py` → `HASHES-v4.json`/`.sha256` | Final hash table (run last) |

## 1. V3 overstatements retracted, quoted verbatim (I6/AA6a)

- `evidence-v3.md` §10 (Outcome) says: *"role/coord/cum/`stored_field`/provenance validated on every applicable row"*. **Retracted.** Against the actual v3-era `validate_final_outputs_v3.py`, this did not hold: a VALIDATED row with a blank `cum_km_incl_1436` or blank `native_x` still passed (I1); Borgarnes was checked by name, not by its own empty-field contract (I2); only node 2345 of the 7 G4 nodes was checked, and `crs`/`source_field` were never tied to the coordinate itself (I3); `role_divergence`/`coordinate_source`/`direction_status` were never compared against anything (I4). `validate_final_outputs_v4.py` (this round) closes all four gaps — see §§2-4 below for what it actually proves at run time.
- `evidence-v3.md` §4/§10 describes "**41 mutation tests**" in a way that reads as comprehensive coverage. **Retracted as stated.** The 41 v3 tests covered only 5 role/coord/cum kinds + 5 provenance kinds on 2 CSV rows, 2 reference records, and the Egilsstaðir/Akureyri endpoints — no blank-field test, no Borgarnes test, no G4-node-other-than-2345 test, no `role_divergence`/`coordinate_source`/`direction_status` test. This round's own mutation harness (`mutation_tests_v4.py`) reruns all 41 (Part A, same expected check-IDs, two with a documented ID-widening because AA3 moved node 2345's own coord/cum check to the dedicated G4 path) and adds 140 new tests (Part B) covering exactly the I1-I4 gaps — see §5.
- `evidence-v3.md` §5 says rule 2 (compound road names) is "**exactly**" the Eyrarbakkavegur-in-a-Selfoss-piece pattern. **Corrected.** Running the actual classification rule against the full v3 output shows rule 1 (prefix match on the first token of a `name`/`desc` segment) claims a compound BEFORE rule 2 is reached in 11 of 19 cases meeting the "informative compound" test (ends in `vegur`/`braut`/`stígur`/`gata`, longer than the bare name) — not just the Eyrarbakkavegur case. See §6.
- The v3 CC handoff/`cc-report.md` says the pre-round snapshot "confirmed the two append-only files (`cc-report.md`, `result-review.md`) had grown with their v2-recorded bytes as an exact prefix". **Imprecise, not false, but corrected for clarity.** This sentence describes the comparison against **v2's own** recorded baseline, at which point BOTH files had indeed already grown — but for two different reasons, in two different time windows, neither of them during CC's own v3 execution: `cc-report.md` grew because CC's own v2-round addendum was appended (before v3 started); `result-review.md` grew because Jonesy's own round-2 review was appended (also before v3 started, between the v2 and v3 rounds). **Validator-v4-proven** (§7): `samples/v3/HASHES-v3.json`'s own recorded check for `result-review.md` shows `old_size: 26091` and `new_total_size: 26091` — identical — meaning result-review.md was **not touched at all during CC's own v3 execution** (CC_IN_PROGRESS→CC_COMPLETE); only `cc-report.md` grew during that window (CC's own v3 addendum, appended at the end of the round). The ambiguous wording is not reused here.

## 2. I1/AA1 — required-field enforcement on VALIDATED rows

**Pre-registered (rules-v4.md):** 21 required non-empty fields for the 6 VALIDATED rows (`REQUIRED_NONEMPTY_FOR_VALIDATED`), the VALIDATED name set `{Akureyri, Egilsstaðir, Vík, Fáskrúðsfjörður, Reyðarfjörður, Reykjahlíð}`, and the 6/1/62/3 outcome distribution.

**Validator-v4-proven at run time:** `validate_final_outputs_v4.run()` asserts all three — name set equality, 6/1/62/3 distribution, and (for every VALIDATED row) that none of the 21 required fields is blank, with the row-wise `continue` guard documented in-code so a blank field can never silently fall through into a downstream `KeyError`. Run log: `main CSV: 72 rows checked, outcome distribution {'VALIDATED': 6, 'NOT_VALIDATED_OUTSIDE_CW_LONG': 1, 'NO_NODE': 62, 'PAIR_REFERENCE': 3} matches pre-registered 6/1/62/3 ... Blank-field test surface: 126 (6 rows x 21 fields).`

**Mutation-tested (Part B):** 126 blank-field tests (one per field per row), each confirmed to raise `VALIDATED_ROW_MISSING_REQUIRED_FIELD` — not a `NO_NODE` side-effect, not a traceback, not an unrelated ID.

## 3. I2/AA1(b) — Borgarnes verified by its own contract, not by name

**Pre-registered:** `REQUIRED_EMPTY_FOR_BORGARNES = [node_role, stored_field, cum_km_incl_1436, cum_km_excl_1436]`, `final_validation_outcome == NOT_VALIDATED_OUTSIDE_CW_LONG`, and a reason mentioning `ccw_short`/`cw_long` in `notes`.

**Validator-v4-proven:** `check_borgarnes_required_empty()` asserts all four fields are blank and the reason/outcome are correct — on the real, unmutated v3 data, this passes (Borgarnes's own row satisfies its contract).

**Mutation-tested:** (1) reintroducing the literal v2 bug (`node_role=ENTRY, stored_field=END`) → `BORGARNES_FIELD_NOT_EMPTY`; (2) filling `cum_km_incl_1436`/`cum_km_excl_1436` → `BORGARNES_FIELD_NOT_EMPTY`. Both confirmed.

## 4. AA1(c) — NO_NODE and PAIR_REFERENCE rows

**Sandbox-attributed finding, re-confirmed by validator-v4:** empirically, all 62 `NO_NODE` rows and all 3 `PAIR_REFERENCE` rows have every one of `node_role`/`stored_field`/`native_x`/`native_y`/`cum_km_incl_1436`/`cum_km_excl_1436`/`source_path`/`source_hash_key`/`piece_id`/`source_field`/`crs` blank in the main CSV. Mutation-tested: filling `native_x`/`native_y` on Reykjavík (`NO_NODE`) and Selfoss (`PAIR_REFERENCE`) each raise `NO_NODE_OR_PAIR_FIELD_NOT_EMPTY`.

## 5. I3/AA3/AA4 — provenance, G4, CRS, coverage

**Pre-registered (rules-v4.md):** coordinate tolerance 0.1 m, cum tolerance 0.0001 km (both unchanged from v2/v3, rationale: matches the 4-decimal display rounding); CRS rule (`EPSG:3057` inside a registered ISN93 box `X∈[300000,800000], Y∈[300000,650000]` derived from `road-links.csv`'s own observed range; `EPSG:4326` only for Akureyri's WGS84 pair, `lat∈[63,67], lon_w∈[13,25]`); `source_field` must match the row's own `stored_field`; G4 tier lengths recomputed via a **fresh** `cum93_at()`-equivalent in the validator itself (no import of the build script, no reuse of `build_access_points_v3.py`'s own functions).

**Validator-v4-proven at run time:** all 7 G4 nodes (not just 2345) are resolved against `wfs93-raw.json`/`road-links.csv`/`chain-walks-v4.json`; Akureyri's native coord and WGS84 pair are both checked (coord, value, provenance, CRS); the Reykjavík legs and both Rauðavatn candidates are checked; a generic structural walk over the written JSON/CSV finds **26** non-null coordinate pairs, and exactly 26 were specifically checked — equal, so nothing can slip through unchecked (the walk itself would fail the run if a 27th coordinate appeared with no matching check). Run log: `AA4 coverage: generic walk found 26 non-null coordinate pairs; 26 were specifically checked -- equal, nothing unchecked.`

**Mutation-tested:** G4 node 3410 +0.2 m and +5 m coordinate shifts both raise `G4_COORD_MISMATCH`; a tier-cum shift raises `G4_CUM_MISMATCH`; a wrong `source_hash_key` on a G4 node raises `PROVENANCE_HASH_KEY_INVALID`; a native coordinate relabelled `crs=EPSG:4326` raises `PROVENANCE_CRS_INVALID`; a wrong `source_field` on node 2345 raises `PROVENANCE_SOURCE_FIELD_MISMATCH`; a missing source file (tested via a fake, empty `repo_root` passed to `run()` — `task_dir`/`network_dir`/`phase2_dir`/`ticket493_dir` stay real, so the geometry math is unaffected, only the provenance file-existence check sees every source file as absent) raises `PROVENANCE_SOURCE_FILE_MISSING` for all 19 non-null-coordinate provenance checks — a named check-ID, never a `FileNotFoundError` traceback.

**Jonesy's sandbox-attributed reference figures** (G4 node cum values, the 26.9266/24.7525 km tier totals) are cited in her own I3/AA3 review as informal, independently-computed confirmation — not wired into this validator as its own pass/fail source; the validator's own fresh recomputation (above) is.

## 6. I4/AA2 — role_divergence, record_source, coordinate_source, direction_status

**Derived (category i), verified against retained source, never against the CSV or `role_divergences_v3.json`:** `record_source`, `coordinate_source`, and `role_divergence` are fully reproducible for all 72 rows (and the 6 reference records) from a small named-set rule reading `place-inventory.csv`'s own `access_node_end` and `cw_long`'s own `direction` via a freshly re-implemented `role_from_access_node_end()`/`suffix_sum_node()` — zero mismatches confirmed against the live v3 output.

**Regression-locked (category ii), documented as a genuine limitation per AA2's own allowance:** `direction_status` has no comparable retained-source derivation (its value is a product rule from H6/J6 about what a validated role MEANS, not a pure geometry function) — defended instead by a frozen, hash-locked 72-row map (`samples/v4/direction_status_frozen_map.json`, SHA-256 `be5466db74a832597387f2abdfbe505d654b88c9e7c837663122b9deeeae34c0`, re-verified at every validator run; distribution `NOT_APPLICABLE=62, UNKNOWN=4, INFERRED=6`). This is explicitly NOT called "source verification" anywhere in this file or `cc-report.md`.

**Mutation-tested:** altering `role_divergence` on Egilsstaðir → `ROLE_DIVERGENCE_MISMATCH`; altering `coordinate_source` on Akureyri → `COORDINATE_SOURCE_MISMATCH`; altering `direction_status` on Vík → `DIRECTION_STATUS_MISMATCH`.

## 7. AA5 — preservation, separation, determinism

- **(a)** All 41 v3 mutation tests rerun against `validate_final_outputs_v4.run()` (Part A) — reported separately (`v3_mutation_tests_rerun_count: 41`) from the 140 new tests (`v4_new_mutation_tests_count: 140`) in `mutation_test_report_v4.json`. Two of the 41 (node 2345's own coord/cum mutations) legitimately surface a widened check-ID set (`G4_COORD_MISMATCH`/`G4_CUM_MISMATCH` alongside the original `ROLE_COORD_MISMATCH`/`ROLE_CUM_MISMATCH`) because AA3 moved that node's own checking to the dedicated, more precise G4 path — documented in `mutation_tests_v4.py`'s own comment, not silently forced.
- **(b)** Clean v3 data passes v4 (confirmed, `ALL FINAL-OUTPUT VALIDATION CHECKS PASSED`). v3 data is byte-identical before and after this round — see `samples/v4/HASHES-v4.json`'s own 77-file baseline re-check.
- **(c)** `mutation_test_report_v4.json` contains no `tempfile` paths or temp-directory names (grepped, zero hits); two consecutive validator runs and two consecutive mutation-harness runs are byte-identical (diffed, no output).
- **(d)** Writes this round: `rules-v4.md`/`.sha256`, `evidence-v4.md`, the `cc-report.md` appendix, `docs/ai/CURRENT.md`, and `samples/v4/*` only.

## 8. AA6(d) — "7 of 15", recomputed honestly

Running the pre-registered rule (`matched_token` ends in `vegur`/`braut`/`stígur`/`gata` and is longer than the bare searched-for name) against `stem_search_hints_v3.json` (SHA-verified byte-unchanged: `0db96b9669636ff231011d6e8b718d4e4e5d20b85acc0c86673ca25a283a682c`) gives **11 of 19**, not Jonesy's own cited "7 of 15". Her own I5 review named only the three examples in her own text (Skagastrandarvegur ×3, Þorlákshafnarvegur ×2, Eyrarbakkavegur ×2-wrongly-classified = 7 of 3+2+2+8=15) and did not include the 4 `Hvammstangavegur` matches (`idferill` 3825/3826/3827/3828), which satisfy the identical rule. Per I6's own principle, the real code-computed figure is reported (`samples/v4/seven_of_fifteen_analysis_v4.json`), not forced to match the prose. `102/8/0/3` and `113` are unchanged (re-verified); this is an analysis, not a reclassification — `stem_search_hints_v3.json` was never written to.

## 9. Outcome

`EVIDENCE_READY_FOR_OWNER_REVIEW` — describes the dataset with its open gaps, not a finished product. All AA1-AA5 conditions passed their own real run against the actual v3 data (72=72 classification; 21-field required-field contract on all 6 VALIDATED rows; Borgarnes's own empty-field contract; NO_NODE/PAIR emptiness; full 26-pair coordinate coverage incl. all 7 G4 nodes; role_divergence/record_source/coordinate_source derived and verified; direction_status regression-locked and verified; 181 mutation tests — 41 rerun + 140 new — each firing its pre-registered expected check-ID; v1-verbatim negative tests preserved and still failing as required; two-run determinism). I5's limitation is documented, not fixed (v3's own 102/8/0/3 classification and all 113 matches stand unchanged, per the binding scope's explicit "no reclassification"). The open gaps are unchanged from v1/v2/v3 and are NOT resolved by this round: `REY-CORE` (no Reykjavík core coordinate), road-93 WGS84 (no retained geometry), Reykholt's AMBIGUOUS Hagstofa pairing, the 4 UNMATCHED places, the Selfoss/Hella/Hvolsvöllur dual-candidate choice, Borgarnes's own `ccw_short` scope boundary, and the 61 `NODE_UNDETERMINED` places. `LICENSE_NOT_DETERMINED` stands. #493/From-To routing is not completed by this validator-closure round. Production NOT_TESTED — no app/API file touched.
