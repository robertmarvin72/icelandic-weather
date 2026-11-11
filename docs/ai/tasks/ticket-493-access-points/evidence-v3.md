# #493 access-points — Evidence v3 (correction round, D1–D7/F1–F6)

2026-11-10, CC. This file is an **index** over the v3 correction
round's own authoritative outputs — it does not rewrite or supersede
v1's or v2's own `evidence.md`/`evidence-v2.md` (neither is marked
SUPERSEDED; both remain on disk, byte-unchanged, confirmed in
`samples/v3/HASHES-v3.json`). Where a v2 claim was wrong, §1 below
quotes it verbatim and states the correction — the error stands
uncorrected in `evidence-v2.md` itself, per F6(a).

## 0. File index (F6d)

| File | Role |
|---|---|
| `rules-v3.md` / `.sha256` | Closed vocabulary, pre-registered decisions, numeric-schema allowlists, mutation-test table — written and hashed before the build ran |
| `samples/v3/snapshot_v2_and_inputs.py` → `v1_v2_and_input_baseline.json` | Read-only pre-build snapshot of all 49 v1+v2+input files (run FIRST, before `rules-v3.md`) |
| `samples/v3/build_access_points_v3.py` | Main build script |
| `samples/v3/input_hashes_v3.json` | This round's own recorded input hashes (12 labels, used as `source_hash_key`) |
| `place-access-status-v3.csv` | Main 72-row table (task root) |
| `endpoint-candidates-v3.json` | Reykjavík/Rauðavatn/Egilsstaðir-Seyðisfjörður/Akureyri candidate data (task root) |
| `samples/v3/place-node-references-v3.json` | Selfoss/Hella/Hvolsvöllur dual candidate records |
| `samples/v3/phase1_role_readout_v3.json` | Per-place role readout (11 entries — see §2) |
| `samples/v3/role_divergences_v3.json` | The 4 pre-registered `ROLE_SOURCE_DIVERGENCE` records (F1) |
| `samples/v3/stem_search_hints_v3.json` | Stem-search hints, each now carrying a `mention_category` (F4) |
| `samples/v3/gap_list_v3.json` | 70 gap entries, corrected wording/counts/host-reason |
| `samples/v3/counts_summary_v3.json` | All counts recomputed in code (D7b/c) |
| `samples/v3/mutation_test_summary_v3.json` | Build-time pre-output mutation tests (80, now incl. `stored_field_swap`) |
| `samples/v3/validate_final_outputs_v3.py` | Independent, path-parameterised final validator (F3a), no import of the build script |
| `samples/v3/mutation_tests_v3.py` → `mutation_test_report_v3.json` | 41 mutation tests run against the real final validator on `tempfile` copies outside the repo (F3b/c/d) |
| `samples/v3/compare_v3_vs_v2.py` → `compare_v3_vs_v2_report.json` | F5 coded v3-vs-v2 comparison (0 undocumented deviations) |
| `samples/v3/generate_hashes_v3.py` → `HASHES-v3.json`/`.sha256` | Final hash table (run last) |

## 1. V2 claims retracted, quoted verbatim (F6a)

- v2's own handoff/code comment claimed the role readout was "printed for all 24" individually-assessed places. **Retracted**: `phase1_role_readout.json`/`_v3.json` have **11** entries (places with a retained `access_node_idferill`; the other 13 of the 24 have `access_node_idferill=NONE`, so no role applies) — both v2's own file and this round's re-run agree on 11.
- v2's own `validate_final_outputs_v2.py` docstring/handoff claimed the final validator "repeats" the build script's mutation tests. **Retracted**: it ran exactly 2 v1-verbatim negative tests, not the mutation set. This round's `mutation_tests_v3.py` runs 41 real mutation tests against the actual final validator (`validate_final_outputs_v3.run()`) on `tempfile` copies, per F3.
- v2's own CSV/JSON coordinates carried no `(file, sha256, feature/piece-id, field, CRS)` provenance despite the handoff claiming they did. **Retracted and fixed**: every non-null coordinate in v3's outputs carries `source_path`/`source_hash_key`/`piece_id`/`source_field`/`crs`, independently resolved and re-verified by the final validator (F2).
- `evidence-v2.md`'s Outcome section said "68 ordinary + 3 dual-candidate" gaps; 68+3=71≠70. **Retracted**: the correct breakdown, computed in code, is `70 = 2 predictable (REY-CORE, Seyðisfjörður) + 3 dual-candidate + 65 ordinary` (see `counts_summary_v3.json`'s own `gap_breakdown_check`).
- v2's gap text for Selfoss/Hella/Hvolsvöllur said the two candidate records "disagree by 0.3-6.4 km". **Retracted**: the real, individually-computed differences are 2.0076 km (Selfoss), 0.8318 km (Hella), 0.2794 km (Hvolsvöllur) — each gap entry now states its own place's own exact figure, not a shared range.
- H6's own restatement was logged as "no behavioural change", but v2's own `direction_status` column reads `INFERRED` on 6 rows and `UNKNOWN` on 4 (v1 had `INFERRED` on 9) — a real behavioural difference from v1, just not from H6's own restatement itself. v3 does not re-open the rule; this just corrects the "no change" framing.
- v2's own `record_source` value `"PHASE1_ACCESS_NODE_END+PHASE2_V3_NODE"` (3 rows) was outside its own closed vocabulary in `rules-v2.md`. **Retracted and fixed**: replaced by the single closed-vocabulary token `PHASE1_AND_PHASE2_PAIR` (D7e).
- v2's own `endpoint-candidates-v2.json`→`raudavatn_comparison_anchor` reported only the EXIT/START end of piece 1436, despite H2's own instruction that both ends are unselected candidates. **Retracted and fixed**: both ends are now reported (`raudavatn_candidate_ENTRY_stored_END`, `raudavatn_candidate_EXIT_stored_START`); the old single-ended field is removed, not reused with different content (D6/F6c).
- v2's own `host_candidates_reason` said no retained file names a host, without citing where the general (non-per-place) sources actually appear. **Fixed**: now cites `national-place-coverage.md` lines 35-36/37-40 and `place-inventory-v3.csv` lines 2-12 (both grepped at run time, not hand-counted) — see §5.

## 2. D1 — Borgarnes

Confirmed in sandbox before fixing: `chain-walks-v4.json`'s own `ccw_short.steps[28]` (piece 2819) has `direction: fwd`, `exit` = stored END `(361119.191, 454127.5752)`. Under `fwd`, stored END is the piece's own **EXIT**, not ENTRY — v2's own Borgarnes branch hardcoded `node_role=ENTRY`, contradicting both this and `phase1_role_readout.json`'s own `derived_node_role: null` for Borgarnes.

**v3 fix:** `node_role`/`stored_field`/`cum_*` are left **empty** for Borgarnes (not EXIT) with an explicit reason in `notes`: piece 2819 is on `ccw_short`, out of this round's `cw_long`-based validator scope, and this round does not extend validation to a second basis (per the precision decision in `rules-v3.md`, chosen specifically to avoid scope creep). For transparency, `role_from_access_node_end('end','fwd')` is still **computed and printed** (`EXIT`/`END`) in `samples/v3/phase1_role_readout_v3.json` and in the row's own `notes` — not silently withheld, just not published into the schema-validated `node_role` column. The independent final validator (`validate_final_outputs_v3.py`) re-derives `final_validation_outcome=NOT_VALIDATED_OUTSIDE_CW_LONG` for Borgarnes from the row's own other fields (never trusts the written column) and asserts the sum across all four outcome categories is 72 (`VALIDATED=6, NOT_VALIDATED_OUTSIDE_CW_LONG=1, NO_NODE=62, PAIR_REFERENCE=3` → 72).

All other places whose role is sourced from `PHASE1_ACCESS_NODE_END` (Vík, Fáskrúðsfjörður, Reyðarfjörður, Reykjahlíð, and the generic phase-1-individually-assessed branch) now carry an explicit runtime `assert (node_role, stored_field) == role_from_access_node_end(...)` — not just construction-by-equality, an actual asserted check (F1).

## 3. D2/F2 — Coordinate provenance

Every non-null coordinate in `place-access-status-v3.csv`, `endpoint-candidates-v3.json`, and `samples/v3/place-node-references-v3.json` now carries `source_path` (repo-relative, `as_posix()`), `source_hash_key` (a unique label in `samples/v3/input_hashes_v3.json`), `piece_id`, `source_field`, and `crs` (`EPSG:3057` native, `EPSG:4326` only for Akureyri's WGS84 pair). Null coordinates carry no provenance (no invented source). The independent final validator resolves the key, **recomputes the live file's own sha256**, and compares it against the recorded value (catching a changed input file, not just a changed label) — see `check_provenance()` in `validate_final_outputs_v3.py`.

Akureyri's WGS84 pair is **parsed directly** from `akureyri-endpoint-decision.md`'s own text via regex (`"65.69570405° N, 18.12371406° V"`), asserted to succeed (no hardcoded fallback) — confirmed in the run log: `Akureyri WGS84 parsed from akureyri-endpoint-decision.md: 65.69570405 N, 18.12371406 V`. The two exit-length-variant figures (26.9266/27.8536 km) are written from the computed values (`cum93_at()`/`production_node()`), re-verified against retained geometry, unchanged numerically from v2 — confirmed by `compare_v3_vs_v2.py`.

## 4. D3/D4 — Numeric schema completeness and the final validator (F3)

`assert_numeric_schema()` is now a **complete, allowlist-based** walk: every string leaf must be under a documented `TEXT_KEYS` entry, every number must be under a `NUMERIC_KEY_SUFFIXES`-matching key or a documented `ID_EXEMPT_KEYS` identifier, every bool must be under `BOOL_KEYS`, and `coord` is special-cased — a value under an undocumented key fails regardless of type. This is exactly the form that would have caught v2's own 4 missed fields; `lat_deg_n`/`lon_deg_w` now match the `_deg_n`/`_deg_w` suffixes, and the two length-variant fields were **renamed** to end in `_km` (`from_ring_junction_2345_km`, `from_phase1_node_via_2345_927m_km`) so the generic `_km` suffix covers them. Four dedicated D3 negative tests (one per field) each confirm a string injection is rejected — run log: `D3 field-specific negative tests (all 4 must reject): {'akureyri.wgs84.lat_deg_n': True, 'akureyri.wgs84.lon_deg_w': True, 'egilsstadir_seydisfjordur.exit_length_variants_km.from_ring_junction_2345_km': True, 'egilsstadir_seydisfjordur.exit_length_variants_km.from_phase1_node_via_2345_927m_km': True}`.

`validate_final_outputs_v3.py` now reads and compares `stored_field` (D4a) alongside `node_role`/`coord`/`cum_*`, and resolves/verifies provenance. `samples/v3/mutation_tests_v3.py` copies the real written outputs into `tempfile.mkdtemp()` (outside the repo, deleted after use, never hashed or indexed) and calls the real, unmodified `validate_final_outputs_v3.run()` — the same code path as production — against each mutated copy. **41 mutation tests** ran: 5 role/coord/cum kinds × 2 pieces (Reyðarfjörður/2520, Vík/3849) in the main CSV, the same 5 kinds × 2 pieces (Selfoss/2138, Hella/3591) in `place-node-references-v3.json`, a reduced relevant subset on `endpoint-candidates-v3.json`'s Egilsstaðir (2345) node and Akureyri's WGS84 pair, plus 5 F2-provenance kinds on the same CSV/reference targets. Every test's pre-registered expected check-ID (`ROLE_COORD_MISMATCH`, `STORED_FIELD_MISMATCH`, `ROLE_CUM_MISMATCH`, `PROVENANCE_HASH_KEY_INVALID`, `PROVENANCE_PATH_MISMATCH`, `PROVENANCE_CRS_INVALID`, `PROVENANCE_MISSING`, `AKUREYRI_WGS84_MISMATCH`) appeared in the raised error — see `samples/v3/mutation_test_report_v3.json` for the full by-kind breakdown (`samples/v3/mutation_test_report_v3.json`'s own `by_kind_counts`). A sanity check (unmutated temp copy) was also run and confirmed to pass before any mutation was applied.

## 5. D5/F4 — Stem-hint classification

Every one of the (unchanged, 113) stem-search matches now carries a `mention_category` from a closed, pre-registered, text-position-only rule: `HOME_PIECE_OR_ROUTE_ENDPOINT` (X is a named endpoint of the piece's own `name`/`desc`, 102 matches), `ROAD_NAME_COMPOUND_MENTION` (the matched token is a longer compound ending in `vegur`/`braut`/`stígur`/`gata`, 8 matches — this is exactly the "Eyrarbakkavegur mentioned inside a Selfoss piece" pattern Jonesy flagged), `DESTINATION_MENTION` (token is the last word of `desc`, 0 matches this round — none of the 113 matches happened to be a pure trailing destination not already caught by the other two rules), `UNCLASSIFIED_TEXT_MENTION` (3 matches, genuinely ambiguous, not forced into a confident category). Counts: `{'HOME_PIECE_OR_ROUTE_ENDPOINT': 102, 'ROAD_NAME_COMPOUND_MENTION': 8, 'UNCLASSIFIED_TEXT_MENTION': 3}` (sums to 113). Classification never changed `road_connection`/`coordinate_source`/`direction_status` for any place — confirmed unchanged by `compare_v3_vs_v2.py`. Gap entries for places with stem hints now report the per-category breakdown, not just a bare count.

## 6. D6/F6(c) — Rauðavatn, both ends

`endpoint-candidates-v3.json`'s `reykjavik` block now reports BOTH ends of piece 1436 as unselected Rauðavatn comparison candidates (`raudavatn_candidate_ENTRY_stored_END`, `raudavatn_candidate_EXIT_stored_START`), each with its own role/provenance/offset. v2's own single-ended `raudavatn_comparison_anchor` field is removed — the final validator asserts it is absent (`"raudavatn_comparison_anchor" not in rj`), confirming this is a genuine supersession, not a silent reuse with different content.

## 7. D7(b/c/e/f/g) — Counts, record_source vocabulary, index, host reason

See `samples/v3/counts_summary_v3.json`: `70 = 2 predictable + 3 dual-candidate + 65 ordinary` (was wrongly "68+3=71"); role readout is 11 entries (was claimed "24"); `record_source` vocabulary is fully closed (`PHASE1_AND_PHASE2_PAIR` replaces the composite string). This file (§0) indexes every new v3 file, closing the v2 index gap. `host_candidates_reason` now cites `national-place-coverage.md` lines 35-36 (Hagstofa) and 37-40 (Vegagerðin), plus `place-inventory-v3.csv` lines 2-12 (`px.hagstofa.is`) — all three grepped at run time, not hand-counted — and states plainly that none of these name a per-place host, so `host_candidates` stays `[]` and no new host is proposed.

## 8. F1 — Role-source divergence (new)

4 records are pre-registered and confirmed as `ROLE_SOURCE_DIVERGENCE` (phase-1's own `access_node_end`-implied role differs from the published `PHASE2_V3_NODE`-sourced role, by deliberate editorial choice, not a bug): Egilsstaðir's main-table ENTRY row (phase-1 implies EXIT), and the three dual-places' own EXIT/`PHASE2_V3_NODE` reference records — Selfoss, Hella, Hvolsvöllur (phase-1 implies ENTRY on each) — see `samples/v3/role_divergences_v3.json`. Both values are printed for each; none is a silently-skipped assertion.

## 9. F5 — Preservation (v3 vs v2 coded comparison)

`samples/v3/compare_v3_vs_v2.py` confirms, in code, zero undocumented deviations between v2's and v3's own written outputs across: 72 row names/order, Hagstofa columns, `road_connection` counts (61/8/1/2 both rounds), `coordinate_source`, `native_x/y`, `cum_km_incl_1436/excl_1436`, `direction_status`, the Reykjavík leg offsets, all 7 G4 nodes (coord/cum/ring fields), the 2345 ring-cum fields, and all `place-node-references` coord/cum values. The only documented deviations are Borgarnes's own `node_role`/`stored_field` (D1) and the new provenance/classification columns/vocabulary — see `samples/v3/compare_v3_vs_v2_report.json` (`f5_pass: true`, `undocumented_deviations: []`).

## 10. Outcome

`EVIDENCE_READY_FOR_OWNER_REVIEW`. All F1-F6 acceptance criteria passed their own actual run (72=72 rows/classification; numeric schema completeness accepted the real output and rejected all negative tests incl. the 4 D3 field tests and both v1-verbatim tests; role/coord/cum/`stored_field`/provenance validated on every applicable row; 41/41 mutation tests fired their pre-registered expected check-ID against the real final validator on temp copies; F4 classification covers all 113 matches with no `road_connection` side-effect; F5 shows 0 undocumented deviations from v2; vocabulary/index/host-reason corrections in place; determinism confirmed, two consecutive build runs byte-identical). The two predictable gaps remain named `BLOCKED_WITH_EXACT_GAPS` sub-items, unchanged from v1/v2:

- **REY-CORE** — no VEGNR=1 piece or retained geometry represents the Reykjavík city core itself; only piece 1436's own two ends (both now reported, D6) and the unselected Rauðavatn candidates exist.
- **Road-93 WGS84** — no retained WGS84 geometry exists for road 93 (Egilsstaðir–Seyðisfjörður); the G4 seven-node comparison remains delivered unselected, ISN93/EPSG:3057 only.

All other gaps (70 total: 2 predictable + 3 dual-candidate + 65 ordinary) are named with their own specific missing-fact/required-data in `samples/v3/gap_list_v3.json`, each with a factual, non-fabricated `host_candidates_reason`. Open items carried forward unchanged from v1/v2 (not reopened this round): Reykholt's AMBIGUOUS Hagstofa pairing; the 4 UNMATCHED places (Kópavogur, Garðabær, Hafnarfjörður, Reykjanesbær); the Selfoss/Hella/Hvolsvöllur dual-candidate choice; Seyðisfjörður's own settlement coordinate; Borgarnes's `ccw_short` validation scope; the 61 `NODE_UNDETERMINED` places. Production NOT_TESTED — no app/API file touched this round.
