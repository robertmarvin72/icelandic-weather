# CC report — ticket-493-access-points

Executed `approved-prompt-v1.md` (G1-G8) — offline, retained-data-only
connectivity/decision preparation for the 72 work-list places. **No
network exchange this round.**

## Reading list

`AGENTS.md`, `CLAUDE.md`, `docs/ai/README.md`/`CURRENT.md`, phase-2's
own final result-review assessment, `prompt-review.md` (G1-G8 in full),
`release-definition-proposal.md`, `akureyri-endpoint-decision.md`,
phase-1's own `place-inventory.csv`, phase-2's own `worklist_matching-
v3.json`/`place_nodes-v3.json`/`place-inventory-v3.csv`/`road93_section-
v2.json`/`wfs93-raw.json`, `chain-walks-v4.json`, `road-links.csv`,
north-data's own `route-data-candidate.json`/`wfs-north-4326.json`,
`national-place-coverage.md`.

## Sequence actually followed

1. `rules.md` written FIRST (closed status vocabulary for the four
   independent columns, coordinate-authority rule, Reykjavík/Egilsstaðir/
   Seyðisfjörður definitions, schema/validator method, gap-entry schema,
   two decision lists, outcome-label pre-registration) and hashed into
   its own `rules.sha256` BEFORE `samples/build_access_points.py` ran.
2. `samples/build_access_points.py`: recorded all 12 of G7's named input
   file hashes/sizes/line-endings FIRST (`samples/input_hashes.json`);
   static-checked itself for no `socket`/`http`/`urllib`/`requests`/
   `ssl` import; ran the schema validator's own negative test (the
   literal v3 Seyðisfjörður text-in-numeric-column row, which correctly
   failed) before the cleaned equivalent (which correctly passed); ran
   an equality check against phase-2's own `place_nodes-v3.json` for
   the four already-validated pieces (2345/2138/3591/3593, exact match
   on all fields); built the 72-row connectivity table; ran the same
   independent suffix-sum/prefix-sum validator and its 4 mutation tests
   (entry/exit swap, incl./excl. swap, double-counted 1436, the literal
   wrong v2 values) on 9 pieces, all correctly rejected/accepted as
   required; wrote `place-access-status.csv`, `endpoint-candidates.json`,
   `samples/name_match_candidates.json`, `samples/gap_list.json`.
3. `evidence.md` written from the script's own run output.
4. `samples/generate_hashes.py` run LAST (after `evidence.md` reached
   final form): hashed this round's own 9 files and independently
   re-verified all 12 of G7's input files are still byte-identical
   (`all_g7_inputs_unchanged: true`).

## A real bug caught and fixed before this report was written

The first version of the 48-never-individually-assessed-place name
search used plain substring containment and matched "Laugar" inside
piece 8676's own `desc` field, `"Hringv.: Laugardælavegur -
Eyrarbakkavegur"` — an unrelated place name ("Laugardælir", near
Selfoss) that merely starts with the same letters. Caught before being
trusted (the result looked suspicious: a never-before-assessed place
getting a match on the very first run), fixed by switching to a
word-boundary-aware match (Icelandic letters as word characters), and
the full 72-place run was redone. After the fix, zero of the 48 bucket
places produce a genuine match — `samples/name_match_candidates.json`
is empty, confirmed correct, not a leftover bug.

A second bug (coordinate fields read from the CSV's raw string columns
instead of the already-parsed float list, and road-93 pieces'
coordinates looked up in the wrong file — they are not in
`road-links.csv`, which is VEGNR=1 only) was also caught and fixed
during development, before any output was reported, via a `TypeError`
on the first attempt in each case — not silently worked around.

## Key findings (full detail in `evidence.md`)

- **24 of 72 places were already individually assessed by phase-1;
  48 were not.** Of those 48, zero produce a genuine VEGNR=1 name/desc
  match this round (after the word-boundary fix) — the connectivity
  table's own job for this round is mostly to turn "never assessed" into
  "assessed and genuinely undetermined," which is itself the useful
  result for the next round's own data-gathering plan.
- **road_connection counts**: 1 `OWNER_APPROVED_ANCHOR` (Akureyri), 2
  `MAPPED_CONTACT_VERIFIED` (Egilsstaðir, Seyðisfjörður's own connecting
  road), 8 `NAME_MATCH_INFERRED`, 61 `NODE_UNDETERMINED`.
- **9 cum-validated pieces this round** (2345, 2138, 3591, 3593, 3849,
  2536, 2520, 3566, 3876), all matching the independently-computed
  sandbox figures in `prompt-review.md` exactly; Borgarnes's own piece
  (2819) is on `ccw_short`, out of this round's `cw_long`-only validator
  scope, left `NOT_VALIDATED` rather than guessed.
- **Regression test passed**: all 9 phase-1-retracted names resolve to
  `NODE_UNDETERMINED`, never upgraded.
- **70 of 72 places get at least one gap entry**; the two gaps
  predictable going in (`REY-CORE`'s own `NO_COORDINATE_SOURCE`; road
  93's own missing WGS84) are named explicitly as `BLOCKED_WITH_EXACT_
  GAPS` sub-items in `evidence.md` §7, not folded into the overall label.
- Two decision lists produced in `evidence.md` §6:
  `owner_decisions_available` (4 items, each with real options and a
  measurable difference) and `requires_new_authorisation` (3 items).
  Every proposal from `release-definition-proposal.md` is tagged
  `PROPOSAL`, never promoted to approved; only Akureyri
  (`OWNER_APPROVED`) and Borgarnes (`PRIOR_ROUND_REFERENCE`) differ.

## Run log

```
python3 samples/build_access_points.py
  -> static import check: PASS
  -> recorded 12 input file hashes
  -> schema validator negative test: v3_literal_row_rejected=True, cleaned_row_accepted=True
  -> equality with place_nodes-v3.json (4 phase-2 pieces): all True
  -> mutation tests run on 9 pieces + literal-v2-wrong-values regression: all rejected as required
  -> road_connection counts: {NODE_UNDETERMINED: 61, NAME_MATCH_INFERRED: 8, OWNER_APPROVED_ANCHOR: 1, MAPPED_CONTACT_VERIFIED: 2}
  -> gap entries: 70
  -> regression test passed for all 9 phase-1-retracted names
python3 samples/generate_hashes.py   -> samples/HASHES.json, samples/HASHES.sha256 (run LAST)
sha256sum -c samples/HASHES.sha256   -> 9/9 OK
```

Determinism confirmed separately: the build script was re-run a second
time and its three output files (`place-access-status.csv`,
`endpoint-candidates.json`, `samples/gap_list.json`) compared
byte-for-byte identical to the first run (`diff`, no output).

## Scope discipline

```
git status --short
```
Touched this round: `docs/ai/CURRENT.md`, and only files inside the new
`docs/ai/tasks/ticket-493-access-points/` directory (all listed above).
No product/app/API file touched. All 12 of G7's own named input files
(`place_nodes-v3.json`, `worklist_matching-v3.json`, `road93_section-
v2.json`, `wfs93-raw.json`, `chain-walks-v4.json`, `road-links.csv`,
phase-1's own `place-inventory.csv`, `place-inventory-v3.csv`,
`route-data-candidate.json`, `wfs-north-4326.json`, `national-place-
coverage.md`, `akureyri-endpoint-decision.md`) confirmed byte-identical
before and after, independently via `samples/HASHES.json`'s own
`g7_input_files_before_after` table. No commit, no push, no GitHub
action — per standing project rules, the owner commits manually.

## Not done / out of scope (per the approved prompt)

- No release-scope, Egilsstaðir/Seyðisfjörður endpoint, or Reykjavík
  point was selected — all remain unselected candidates/proposals.
- No new data fetched, no host re-authorised, no dependency added.
- Borgarnes's own cum (ccw_short) not validated this round.
- Reykholt's own dual-code (193/1162) ambiguity not resolved.
- No app/UI/API/commit/push. Production NOT_TESTED.

**Outcome: `EVIDENCE_READY_FOR_OWNER_REVIEW`**, with the two
predictable `BLOCKED_WITH_EXACT_GAPS` sub-items (`REY-CORE`, road-93
WGS84) named explicitly in `evidence.md` §7, and the remaining 68 gap
entries itemised in `samples/gap_list.json` — none hidden by the
overall label.

---

## v2 addendum (2026-11-10) — correction round, append-only

Executed `approved-prompt-v2.md` after Jonesy's result review round 1
(`result-review.md`, REVISE, findings H1-H8) and her prompt-review
approval of the correction prompt with conditions J1-J6
(`correction-prompt-review.md`). **No new network exchange. v1's own
files above this line are byte-unchanged** — confirmed at the end of
this round (`samples/v2/HASHES-v2.json`'s own `v1_and_inputs_still_
unchanged` table, 30/30 OK). Full disposition of every finding is in
`evidence-v2.md`; this section is the run log and scope check.

### What H1-H8 found and what changed (one line per finding)

- **H1 (coord/cum role mismatch in 7 rows, most severe)**: v1 always
  read a piece's own stored END but always reported the EXIT cum
  (stored START's own distance) — a 0.3-6.4 km self-contradiction.
  Fixed: Selfoss/Hella/Hvolsvöllur now emit TWO labelled, independently
  self-consistent candidate records (`samples/v2/place-node-
  references.json`); Vík/Fáskrúðsfjörður/Reyðarfjörður/Reykjahlíð now
  use phase-1's own EXIT/START reference, self-consistent. See
  `evidence-v2.md` H1.
- **H2 (Reykjavík offsets swapped)**: corrected, derived from `cw_long`
  step 0's own named fields, no hardcoded length. See `evidence-v2.md`
  H2.
- **H3 (text in a numeric field, node 2345)**: fixed by splitting into
  two differently-named field groups (`cum_km_tier_minus1/2` = road-93's
  own 0,0 origin; `ring_cum_km_incl/excl_1436` = the ring's own
  677.6344/675.0743 km), and by auto-deriving the numeric-field list
  instead of hand-picking two CSV columns. See `evidence-v2.md` H3.
- **H4 (coordinate provenance, bare literals)**: every coordinate now
  carries its own file/feature/field; the 26.9266/27.8536 km figures
  are re-derived from retained geometry this round, not trusted as
  literals. See `evidence-v2.md` H4.
- **H5 (generic gap list, narrow stem search)**: Reykholt/Kópavogur/
  Garðabær/Hafnarfjörður/Reykjanesbær each get their own specific gap
  reason; a GENERAL stem-search rule (not tailored to 3 hints) now
  covers all 72 names, with full transparency and a passing recall
  assertion for all three known hints (including piece 2478, which v1
  missed). See `evidence-v2.md` H5.
- **H6 (direction rule source)**: restated with its own explicit
  source and scope distinction (digitisation direction vs. legal
  driving permission) — no behavioural change. See `evidence-v2.md` H6.
- **H7 (path format, determinism)**: `Path.as_posix()` used throughout;
  two consecutive runs confirmed byte-identical on all 5 output files.
  See `evidence-v2.md` H7.
- **H8 (candidate search on the 9 retracted places; exact counts)**:
  all 9 genuinely re-searched this round (still `NODE_UNDETERMINED`,
  as required); exact counts (70 gaps = 68 ordinary + 2 predictable;
  60 mutation-test assertions across 20 (piece,role) pairs on 10
  pieces) recomputed in code, not restated as fixed text; the
  Vopnafjörður "none" claim is now a verified finding (zero hits from
  a real search), not an unchecked assertion. See `evidence-v2.md` H8.

### Run log (v2)

```
python3 samples/v2/snapshot_v1_and_inputs.py     -> samples/v2/v1_and_input_baseline.json (30 files, FIRST action)
python3 samples/v2/build_access_points_v2.py
  -> static import check: PASS
  -> schema validator v1-verbatim negative test: v1_endpoint_candidates_rejected=True
  -> J1 per-place role readout: 11 printed (Rauðavatn + the 10 idferill-bearing places)
  -> pre-output mutation tests: 60 tests across 20 (piece,role) pairs on 10 pieces -- all rejected as required
  -> stem-search recall check PASS: Skagaströnd->[2423,2456,2478], Þorlákshöfn->[22722,22725], Eyrarbakki->10 pieces
  -> regression test (9 names) passed; all 9 received a real stem-hint search
  -> road_connection counts: {NODE_UNDETERMINED: 61, NAME_MATCH_INFERRED: 8, OWNER_APPROVED_ANCHOR: 1, MAPPED_CONTACT_VERIFIED: 2}
  -> numeric schema check (both outputs): PASS
  -> H2 negative test: v1's own swapped Reykjavik offsets confirmed present
  -> H4: 26.9266/27.8536 km re-verified against retained geometry
  -> counts summary: total_gap_entries=70, ordinary=68, predictable=2, dual_candidate=3 (Selfoss/Hella/Hvolsvöllur), vopnafjordur_hints=0, hvammstangi_hints=6
python3 samples/v2/validate_final_outputs_v2.py  (SEPARATE script, no import of the build script)
  -> static import check: PASS (no network import, no build-script import)
  -> main CSV: 6 role-bearing rows independently re-validated, all consistent
  -> place-node-references.json: 6 records independently re-validated, all consistent
  -> endpoint-candidates-v2.json: Egilsstaðir (2345) and Akureyri (3876) nodes independently re-validated
  -> Reykjavik legs independently re-derived from piece 1436's own suffix sum: PASS
  -> J2 negative test 1 PASS: v1's own verbatim Selfoss row correctly fails self-consistency as ENTRY
  -> J2 negative test 2 PASS: v1's own verbatim swapped Reykjavik offsets both correctly mismatch
python3 samples/v2/generate_hashes_v2.py         -> samples/v2/HASHES-v2.json/.sha256 (run LAST)
```

Determinism confirmed separately: `build_access_points_v2.py` was run
twice in direct succession; all 5 of its own output files compared
byte-for-byte identical (`diff`, no output).

### Scope discipline (v2)

```
git status --short
```
Touched this round: `docs/ai/CURRENT.md`, and only files inside
`docs/ai/tasks/ticket-493-access-points/` (`rules-v2.md`/`.sha256`,
`evidence-v2.md`, `place-access-status-v2.csv`, `endpoint-candidates-
v2.json`, `cc-report.md` appended, everything under `samples/v2/`). No
v1 file inside this task was modified (confirmed byte-identical, see
below). No product/app/API file touched. No commit, no push, no
GitHub action — owner commits manually.

### Final v1/input integrity check

All 30 files recorded in `samples/v2/v1_and_input_baseline.json`
(every pre-existing v1 task file + all 12 of G7's original inputs)
re-hashed at the end of this round: 29 confirmed byte-identical, and
`cc-report.md` (this file) confirmed to have its OLD bytes as an exact
PREFIX of the new, appended file (`samples/v2/HASHES-v2.json`'s own
`v1_and_inputs_still_unchanged` table, `all_ok: true`).

### Outcome (v2)

**`EVIDENCE_READY_FOR_OWNER_REVIEW`** — same two predictable
`BLOCKED_WITH_EXACT_GAPS` sub-items as v1 (`REY-CORE`; road 93's own
missing WGS84/Seyðisfjörður settlement coordinate), now with H1-H8 all
disposed of per `evidence-v2.md`, and with the SEPARATE final-output
validator (J2) independently confirming every record this round emits.

## v3 addendum (2026-11-10) — correction round, append-only

Executed `approved-prompt-v3.md` (D1-D7/F1-F6, offline correction
round) for `ticket-493-access-points`, following Jonesy's result
review round 2 (REVISE D1-D7) and her APPROVED-with-F1-F6 prompt
review of the correction prompt. **No new network exchange; v1's and
v2's own files untouched.** First action per F6(d)/J6: a read-only
SHA/size/line-ending snapshot of all 16 v1 + 21 v2 task files + all 12
of G7's original inputs (`samples/v3/v1_v2_and_input_baseline.json`,
49 files) BEFORE `rules-v3.md` or any other v3 output was written;
confirmed the two append-only files (`cc-report.md`, `result-review.md`)
had grown with their v2-recorded bytes as an exact prefix, nothing
else changed. Wrote `rules-v3.md` (D1-D7/F1-F6 copied/summarised,
plus this round's own closed vocabulary extensions, numeric-schema
allowlists, mutation-test table, stem-hint classification rule) and
hashed it before the build script ran; `rules-v3.sha256` was
regenerated twice during this round's own development (to cover three
fields discovered only while writing the build script —
`native_source_piece`'s ID-exempt status, the free-text `note` key,
and the `origin_marked` bool key — all folded into the TEXT_KEYS/
ID_EXEMPT_KEYS/BOOL_KEYS lists before the FINAL build run that
produced the delivered outputs; this is normal same-round drafting
iteration, not a second correction cycle).

**D1 (Borgarnes):** confirmed in sandbox that `chain-walks-v4.json`'s
own `ccw_short.steps[28]` (piece 2819) has `direction: fwd`, and under
`fwd` the piece's own stored END is its own EXIT, not ENTRY as v2 had
hardcoded. Fixed by leaving `node_role`/`stored_field`/`cum_*` **empty**
for Borgarnes with an explicit reason (piece 2819 is on `ccw_short`,
outside this round's `cw_long`-based validator scope; not extended to
a second basis, per the precision decision in `rules-v3.md` chosen to
avoid scope creep) — not silently promoted to EXIT. For transparency,
`role_from_access_node_end('end','fwd')` is still computed and printed
(`EXIT`/`END`) in `samples/v3/phase1_role_readout_v3.json` and the
row's own `notes`, just not published into the schema-validated
column. All other `PHASE1_ACCESS_NODE_END`-sourced rows (Vík,
Fáskrúðsfjörður, Reyðarfjörður, Reykjahlíð, and the generic phase-1
branch) now carry an explicit runtime `assert (node_role, stored_field)
== role_from_access_node_end(...)`, not just construction-by-equality.
The independent final validator re-derives `final_validation_outcome`
for every one of the 72 rows from the row's OWN other fields (never
trusts the written column) — `VALIDATED=6, NOT_VALIDATED_OUTSIDE_CW_LONG=1
(Borgarnes), NO_NODE=62, PAIR_REFERENCE=3` (sum 72, asserted).

**D2/F2 (provenance):** every non-null coordinate in
`place-access-status-v3.csv`, `endpoint-candidates-v3.json`, and
`samples/v3/place-node-references-v3.json` now carries `source_path`
(repo-relative, `as_posix()`), `source_hash_key` (unique label in
`samples/v3/input_hashes_v3.json`), `piece_id`, `source_field`, `crs`
(`EPSG:3057` native, `EPSG:4326` for Akureyri's WGS84 only). Null
coordinates carry no provenance. The independent final validator
resolves the key, **recomputes the live file's own sha256**, and
compares the recorded path/sha/crs against it — catching a changed
input file, not just a relabelled one. Akureyri's WGS84 pair is parsed
directly from `akureyri-endpoint-decision.md`'s own text via regex
(asserted to match, no hardcoded fallback) — run log: "Akureyri WGS84
parsed from akureyri-endpoint-decision.md: 65.69570405 N, 18.12371406
V". The two exit-length-variant figures (26.9266/27.8536 km) are
written from the computed values, unchanged numerically from v2.

**D3/F3(e) (numeric schema completeness):** `assert_numeric_schema()`
is now a complete, allowlist-based walk (every string leaf must be
under a documented `TEXT_KEYS` entry, every number under
`NUMERIC_KEY_SUFFIXES`/`ID_EXEMPT_KEYS`, every bool under `BOOL_KEYS`,
`coord` special-cased) — a value under an undocumented key fails
regardless of type, closing the exact gap that let v2's own 4 fields
(`lat_deg_n`, `lon_deg_w`, and the two length-variant fields, the
latter now renamed with an explicit `_km` suffix) escape detection.
Four dedicated D3 negative tests (one per field) each confirmed a
string injection is rejected: `{'akureyri.wgs84.lat_deg_n': True,
'akureyri.wgs84.lon_deg_w': True,
'egilsstadir_seydisfjordur.exit_length_variants_km.from_ring_junction_2345_km':
True,
'egilsstadir_seydisfjordur.exit_length_variants_km.from_phase1_node_via_2345_927m_km':
True}`.

**D4/F3 (final validator + real mutation set):**
`samples/v3/validate_final_outputs_v3.py` now reads and compares
`stored_field` (not just `node_role`/`coord`/`cum_*`), resolves and
verifies provenance, and is parameterised (`run(task_dir, network_dir,
repo_root)`) so it runs unmodified against `tempfile.mkdtemp()` copies
of the written outputs (outside the repo, deleted after use, never
hashed or indexed). `samples/v3/mutation_tests_v3.py` imports this
module (no re-implementation) and ran **41 mutation tests**: 5
role/coord/cum kinds × 2 pieces (Reyðarfjörður/2520, Vík/3849) in the
main CSV, the same 5 kinds × 2 pieces (Selfoss/2138, Hella/3591) in
`place-node-references-v3.json`, a reduced relevant subset on
`endpoint-candidates-v3.json`'s Egilsstaðir node (2345) and Akureyri's
WGS84 pair, plus 5 provenance kinds on the same CSV/reference targets.
Each test asserted its own pre-registered expected check-ID appeared
in the real validator's raised error (not "something failed") — see
`samples/v3/mutation_test_report_v3.json`
(`by_kind_counts`: `role_label_only=4, coord_deviation_0.2m=5,
stored_field_swap=4, cum_incl_excl_swap=5, double_counted_1436=4,
wrong_source_hash_key=5, wrong_source_path=4, wrong_crs=5,
provenance_missing_on_real_coord=4, akureyri_wgs84_digit_altered=1`).
A sanity check (unmutated temp copy) was run first and confirmed to
pass. 80 build-time pre-output mutation tests also ran (unchanged
method from v2, now including `stored_field_swap`, across 20
(piece,role) pairs on 10 pieces).

**D5/F4 (stem-hint classification):** every one of the unchanged 113
stem-search matches now carries a `mention_category` from a closed,
pre-registered, text-position-only rule applied uniformly to all 72
names (not fitted to the 3 known hints): `HOME_PIECE_OR_ROUTE_ENDPOINT`
(102), `ROAD_NAME_COMPOUND_MENTION` (8 — the "Eyrarbakkavegur inside a
Selfoss piece" pattern Jonesy flagged), `DESTINATION_MENTION` (0),
`UNCLASSIFIED_TEXT_MENTION` (3, genuinely ambiguous, not forced).
Classification never changed `road_connection`/`coordinate_source`/
`direction_status` for any place (confirmed by F5's own comparison).

**D6/F6(c) (Rauðavatn):** `endpoint-candidates-v3.json`'s `reykjavik`
block now reports BOTH ends of piece 1436 as unselected Rauðavatn
comparison candidates. v2's own single-ended
`raudavatn_comparison_anchor` field is removed, not reused with
different content — the final validator asserts its absence.

**D7 (counts/vocabulary/index/host-reason):** `70 = 2 predictable + 3
dual-candidate + 65 ordinary` (was wrongly stated as "68 ordinary + 3
dual-candidate" = 71 ≠ 70, in `evidence-v2.md`); role readout is 11
entries (was claimed "24" in v2's handoff/comments; the real 24-
individually-assessed-places figure is unrelated to the 11-with-a-
retained-idferill figure the readout actually targets); Selfoss/Hella/
Hvolsvöllur gap text now states each place's own exact difference
(2.0076/0.8318/0.2794 km) instead of a shared "0.3-6.4 km" range;
`record_source`'s composite string `"PHASE1_ACCESS_NODE_END+PHASE2_V3_NODE"`
replaced by the closed-vocabulary token `PHASE1_AND_PHASE2_PAIR`;
`evidence-v3.md` indexes every new v3 file including the helper
scripts v2's own index omitted; `host_candidates_reason` now cites
`national-place-coverage.md` lines 35-36/37-40 and
`place-inventory-v3.csv` lines 2-12 (grepped at run time, not hand-
counted), stating plainly neither is a per-place host.

**F1 (role-source divergence, new):** 4 records pre-registered and
confirmed `ROLE_SOURCE_DIVERGENCE` (phase-1-implied role differs from
the published `PHASE2_V3_NODE` role, by deliberate editorial choice):
Egilsstaðir's main-table ENTRY row, and the three dual-places' own
EXIT/`PHASE2_V3_NODE` reference records (Selfoss, Hella, Hvolsvöllur)
— see `samples/v3/role_divergences_v3.json`. Both values printed for
each; no silently-skipped assertion.

**F5 (preservation, v3 vs v2 coded comparison):**
`samples/v3/compare_v3_vs_v2.py` confirmed, in code, zero undocumented
deviations across 72 row names/order, Hagstofa columns,
`road_connection` counts (61/8/1/2 both rounds), `coordinate_source`,
`native_x/y`, cum values, `direction_status`, the Reykjavík leg
offsets, all 7 G4 nodes, the 2345 ring-cum fields, and all
`place-node-references` coord/cum values — see
`samples/v3/compare_v3_vs_v2_report.json` (`f5_pass: true`,
`undocumented_deviations: []`). The only documented deviations are
Borgarnes's own `node_role`/`stored_field` and the new provenance/
classification columns/vocabulary.

**Determinism:** two consecutive runs of `build_access_points_v3.py`
confirmed byte-identical on all written output files (CSV + 7 JSON
files), diffed explicitly before proceeding. A stray `__pycache__`
(side effect of importing `validate_final_outputs_v3` from the
mutation-test harness) was removed before the final scope check.

**Hash table:** `samples/v3/HASHES-v3.json`/`.sha256` generated LAST,
after `evidence-v3.md` reached final form (21 new v3 files),
independently verified via `sha256sum -c` (21/21 OK); all 49 files in
the v1/v2/input baseline re-hashed and confirmed unchanged (47 byte-
identical + `cc-report.md`/`result-review.md`'s own prefix-SHA match,
`all_ok=true`). `git status` confirms only `CURRENT.md` and this
task's own directory touched; the two pre-existing untracked items
from earlier sessions (`ticket-493-place-data-phase2/`,
`ticket-493/release-definition-proposal.md`) were correctly left
untouched. No app/API file touched, no commit/push/GitHub action.

### Outcome (v3)

**`EVIDENCE_READY_FOR_OWNER_REVIEW`** — same two predictable
`BLOCKED_WITH_EXACT_GAPS` sub-items as v1/v2 (`REY-CORE`; road 93's
own missing WGS84/Seyðisfjörður settlement coordinate), now with
D1-D7 all disposed of per `evidence-v3.md`, independently re-confirmed
by the parameterised final validator and 41/41 real mutation tests.
Production NOT_TESTED. Full detail in `evidence-v3.md`.

## v4 addendum (2026-11-10) — validator-closure round, append-only

Executed `approved-prompt-v4.md` (I1-I6/AA1-AA6, offline
validator-closure round) for `ticket-493-access-points`, following
Jonesy's result review round 3 (REVISE I1-I6) and her
APPROVED-with-AA1-AA6 prompt review. **No data rebuild this round:**
`place-access-status-v3.csv`, `endpoint-candidates-v3.json`, and
`samples/v3/place-node-references-v3.json` are the authoritative v3
outputs, read directly — no fourth copy, no unnecessary rerun of
`build_access_points_v3.py`. First action: a read-only SHA/size/
line-ending snapshot of every file that already existed in this task
directory (65, found by walking the directory, not a hand-maintained
list — 16 v1 + 21 v2 + 26 v3 + `approved-prompt-v4.md` +
`validator-v4-prompt-review.md`) plus the 12 retained inputs
(`samples/v4/v1_v2_v3_and_input_baseline.json`, 77 files) BEFORE
`rules-v4.md` or any other v4 output was written. Wrote `rules-v4.md`
(I1-I6/AA1-AA6 plus this round's own required-field lists, derived/
frozen-column rules, tolerances/CRS box, coverage inventory, mutation
plan) and hashed it before the validator ran.

**I1/I2 (required-field + Borgarnes contracts):** `validate_final_outputs_v4.py`
now asserts, for each of the 6 pre-registered VALIDATED rows
(Akureyri, Egilsstaðir, Vík, Fáskrúðsfjörður, Reyðarfjörður,
Reykjahlíð), that all 21 pre-registered required fields are
non-blank — a blank field raises `VALIDATED_ROW_MISSING_REQUIRED_FIELD`
cleanly (with an explicit `continue` guard so it can never fall
through into a downstream `KeyError`), not silently pass. Borgarnes is
now checked by its own empty-field contract (`node_role`/
`stored_field`/`cum_*` must be blank, `final_validation_outcome`
must read `NOT_VALIDATED_OUTSIDE_CW_LONG`, reason present in `notes`)
rather than by `row["name"]=="Borgarnes"` alone. Confirmed empirically
(not assumed) that all 62 `NO_NODE` and all 3 `PAIR_REFERENCE` rows
already have every relevant field blank in the main CSV; this is now
asserted, with `NO_NODE_OR_PAIR_FIELD_NOT_EMPTY` as the mutation-test
check-ID.

**I3/AA3/AA4 (provenance/G4/coverage):** all 7 G4 nodes (not just
2345) are now resolved against `wfs93-raw.json`/`road-links.csv` via a
**fresh**, independent `cum93_at()`-equivalent (no import of the build
script, no reuse of its own functions); `source_field` is required to
match the row's own `stored_field`; `crs` is required to match the
coordinate's own coordinate system (`EPSG:3057` inside a registered
ISN93 box derived from `road-links.csv`'s own observed range,
`EPSG:4326` only for Akureyri's WGS84 pair inside a registered
lat/lon box); a missing source file now raises
`PROVENANCE_SOURCE_FILE_MISSING`, never a raw traceback. A generic
structural walk over the written JSON/CSV finds exactly 26 non-null
coordinate pairs; the validator specifically checks exactly 26 — equal,
so an unrecognised 27th coordinate would fail the run rather than pass
silently. Run log: `AA4 coverage: generic walk found 26 non-null
coordinate pairs; 26 were specifically checked -- equal, nothing
unchecked.`

**I4/AA2 (role_divergence/record_source/coordinate_source/direction_status):**
`record_source`, `coordinate_source`, and `role_divergence` are now
independently re-derived for all 72 rows (and the 6 reference
records) from `place-inventory.csv`'s own `access_node_end` and
`cw_long`'s own `direction`, via a freshly re-implemented
`role_from_access_node_end()`/`suffix_sum_node()` — zero mismatches
against the live v3 output. `direction_status` has no comparable
retained-source derivation (documented as a genuine limitation, not
papered over) and is instead defended by a frozen, hash-locked 72-row
map (`samples/v4/direction_status_frozen_map.json`, SHA-256
`be5466db74a832597387f2abdfbe505d654b88c9e7c837663122b9deeeae34c0`,
re-verified at every run) — never called "source verification".

**I5 (stem classification, documented limitation, no reclassification):**
confirmed rule 1 (prefix match) claims a compound road name before
rule 2 (compound-suffix match) runs in 11 of 19 cases meeting the
"informative compound" test — not just the single Eyrarbakkavegur
example `evidence-v3.md` called "exactly" the pattern. v3's own
102/8/0/3 classification and all 113 matches are UNCHANGED (per the
binding scope's explicit "no reclassification"); `stem_search_hints_v3.json`
was never written to (SHA re-verified unchanged:
`0db96b9669636ff231011d6e8b718d4e4e5d20b85acc0c86673ca25a283a682c`).

**I6 (wording corrected, three-category separation):** `evidence-v4.md`
quotes each v3 overstatement verbatim and corrects it — §10's "validated
on every applicable row", the "41 mutation tests" framing, §5's
"exactly", and the ambiguous "grew ... exact prefix" sentence (which
was imprecise, not false: both files HAD grown relative to v2's own
baseline, for two different reasons in two different time windows,
neither during CC's own v3 execution). Separated into three
categories throughout: what `validate_final_outputs_v4.py` proves at
run time (validator-v4-proven), what Jonesy confirmed in her own
sandbox via independent computation (sandbox-attributed, her harness
is not a deliverable), and what CC asserts (CC-attributed).
`result-review.md` was confirmed NOT to have grown during CC's own v3
round: `samples/v3/HASHES-v3.json`'s own recorded check shows
`old_size: 26091` and `new_total_size: 26091` for `result-review.md` —
identical; it only grew afterward, when Jonesy appended her own round-3
review. The "7 of 15" figure (AA6d) was recomputed in code against the
exact stated rule and found to be **11 of 19**, not 7 of 15 — Jonesy's
own I5 text named only 3 of the 4 real compound-name examples
(missing `Hvammstangavegur`'s own 4 matches); the real, code-computed
figure is reported (`samples/v4/seven_of_fifteen_analysis_v4.json`),
not forced to match the prose, per I6's own "wording must match what
was proven" principle applied to this round's own new figure.

**Mutation testing (AA5):** `samples/v4/mutation_tests_v4.py` reruns
all 41 v3 mutation tests against the real v4 validator (Part A, same
expected check-IDs, two with a documented, widened check-ID set since
AA3 moved node 2345's own coord/cum checking to the dedicated G4 path)
and adds 140 new I1-I4 tests (Part B: 126 blank-field + 2 Borgarnes +
2 NO_NODE/PAIR + 3 AA2 derived-column + 6 G4/CRS/source-field + 1
missing-source-file) — all 181 fired their pre-registered expected
check-ID against the real, unmodified `validate_final_outputs_v4.run()`
on `tempfile.mkdtemp()` copies outside the repo, deleted after use
(confirmed none left afterward). A sanity check (unmutated temp copy)
passed first. Determinism confirmed: two consecutive validator runs
and two consecutive mutation-harness runs are byte-identical (diffed,
no output). A stray `__pycache__` was removed before the final scope
check.

**Hash table:** `samples/v4/HASHES-v4.json`/`.sha256` generated LAST,
after `evidence-v4.md` reached final form (11 new v4 files),
independently verified via `sha256sum -c` (11/11 OK); all 77 files in
the v1/v2/v3/input baseline re-hashed and confirmed unchanged (75
byte-identical + `cc-report.md`/`result-review.md`'s own prefix-SHA
match, `all_ok=true`). `git status` confirms only `CURRENT.md` and
this task's own directory touched; the two pre-existing untracked
items from earlier sessions left untouched. No app/API file touched,
no commit/push/GitHub action. Full detail in `evidence-v4.md`.

### Outcome (v4)

**`EVIDENCE_READY_FOR_OWNER_REVIEW`** — same two predictable
`BLOCKED_WITH_EXACT_GAPS` sub-items as v1/v2/v3 (`REY-CORE`; road 93's
own missing WGS84/Seyðisfjörður settlement coordinate), now with
I1-I6 all disposed of per `evidence-v4.md`. v3's own data is
unchanged; this round closes validator gaps only. Production
NOT_TESTED. #493/From-To routing is not completed by this round.
