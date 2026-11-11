# #493 phase2 — Evidence (v2, correction round)

2026-11-09, CC. **This is a CORRECTION round, not a new pre-registration.**
Executed `approved-prompt-v2.md` (items 1-6, conditions K1-K8), following
Jonesy's result review round 1 (`result-review.md`, REVISE, findings
S1-S8) and Ripley's acceptance of REVISE S1-S8. **No new network exchange
was made or authorised this round** (K6) — this is a purely OFFLINE
reprocessing/correction of data already retained from `approved-
prompt-v1.md`'s own real exchanges (`pre-sample-plan.md`, the frozen
request table, and `samples/exchange-ledger.jsonl`'s 3 lines are
unchanged and preserved as the evidence of what was actually run).

v1's own bytes (`evidence.md`, `cc-report.md`, `place-inventory.csv`) are
preserved unchanged in `samples/v1/*-superseded.*` and hashed as
`superseded` in `HASHES-v2.json`, so the exact text this round retracts
is never lost. The root `place-inventory.csv` file itself is also
untouched; the corrected registry is the new `place-inventory-v2.csv`.

Outcome label: **see §9.**

## 0. Retraction table — v1 claims that change this round

| # | v1's exact claim (verbatim) | Source | What changed | Finding |
|---|---|---|---|---|
| R1 | "Result: `NOT_AVAILABLE` for road-93's own road-condition/notice status — not guessed, not a new fetch." | v1 `evidence.md` §4 | **RETRACTED.** Both target IDBUTUR (911040037, 911170037) ARE present with real condition data in both retained `legacy-faerd-*.json` samples; the `faerdpunktar` (notice) samples genuinely have none, which v1 should have stated as an explicit "No", not folded into "NOT_AVAILABLE". | S1 |
| R2 | "**Population brackets** ... **≥200: 74 settlements. ≥500: 49. ≥1000: 32.**" and "summing all **119** non-`\"Alls\"` settlement rows" | v1 `evidence.md` §2 | **CORRECTED to 111 settlements; ≥200: 67, ≥500: 42, ≥1000: 27.** v1's 119/74/49/32 wrongly counted 8 `RURAL_AGGREGATE` ("Strjálbýli á…") rows as settlements. | S2 |
| R3 | CSV cell: `676.0013 (CC-attributed, cited from phase1 v4 chain-walks)` paired with coordinate `715153.7400,536679.9300` and `instance=fwd/fwd` | v1 `place-inventory.csv`, `EGILSSTADIR` row | **CORRECTED and split into two rows.** `715153.7400,536679.9300` is the JUNCTION node (cum excl. 1436 = **677.6344**, not 676.0013); 676.0013 is actually the DIFFERENT phase-1 node's own without-1436 figure, at a different coordinate (`714320.9956,536912.9869`). The walk direction is `rev`, not `fwd/fwd`. | S3 |
| R4 | "same validator reused unchanged from phase 1" / "Both directions ... validated" (`cc-report.md` §"Key findings") | v1 `cc-report.md` | **CORRECTED.** No v1 script actually called `validate_route`; the claim was prose-only. This round actually imports and calls it (hash-verified source) AND adds a separate continuity check `validate_route` itself does not perform. | S4 |
| R5 | "every planned item (metadata, data, VEGNR=93 geometry, the route example, the P5 fix) completed successfully within budget." / "**Outcome: `EVIDENCE_READY_FOR_OWNER_REVIEW`.** No `BLOCKED_WITH_EXACT_GAPS` sub-item was triggered" | v1 `cc-report.md` | **QUALIFIED.** True for what v1 actually attempted, but v1's own scope silently excluded the full work-list match and the weather-point proposal (item 5) without flagging either as its own `BLOCKED` sub-item, as the prompt requires when a part is not finished. | S5 |

## 1. Budget actually used — UNCHANGED, not reopened

Carried over verbatim from v1 (no new exchange this round, K6):

| Exchange | Host | Method | Status | Bytes | Truncated |
|---|---|---|---|---|---|
| 1 | px.hagstofa.is | GET (metadata) | 200 | 5,055 | No |
| 2 | px.hagstofa.is | POST (data) | 200 | 6,091 | No |
| 3 | gagnaveita.vegagerdin.is | GET (WFS, VEGNR=93) | 200 | 37,991 | No |

**Total: 3 of 12 exchanges, 49,137 of 33,554,432 B (0.15%).** Ledger
(`samples/exchange-ledger.jsonl`, 3 lines) and raw responses are
byte-unchanged this round — confirmed by SHA-256 in `HASHES-v2.json`.
This round's own new script (`samples/build_phase2_v2.py`) contains no
`socket`/`http`/`urllib`/`requests`/`ssl` import — verified by a static
regex check run at the top of its own `__main__` block (K6).

## 2. Road-condition footprint — CORRECTED (K1/S1)

`samples/build_phase2_v2.py::build_road_condition_footprint()` replicates
the REAL app's own `normalizeIdButur` contract, read this round from
`api/_lib/winterRoute/roadFetch.js` (not assumed): a number is kept via
`Number.isInteger`; a non-empty string is converted and kept only if
integral. Applied to both retained `legacy-faerd-*.json` samples'
`IdButur` field (a JSON float, e.g. `911040037.0`) before any lookup.

**Result (`samples/road_condition_footprint-v2.json`):**

- `legacy-faerd-fresh.json` (2026-10-28): IDBUTUR 911040037 "Egilsstaðir"
  → GREIDFAERT; 911170037 "Fjarðarheiði" → **HÁLKUBLETTIR**.
  `legacy-faerd-https.json` (2026-11-02): both GREIDFAERT.
  `Snjomokstursregla`="7X" on all four matched entries. Age at the fixed
  research reference `2026-11-09T00:00:00Z` is recorded per entry
  (`age_seconds_from_reference`), computed from `DagsKeyrtUt`, not
  `now()`.
- `legacy-faerdpunktar*.json` (notice samples): **both target IDBUTUR
  return explicit `has_notices: False`** (0/43 and 0/26 occurrences) —
  stated as a definite "No", not silence or an omitted row.
- IDBUTUR→IDFERILL/VEGNR footprint, built from `road-links.csv` (ring)
  and `wfs93-raw.json` (road 93), not typed from memory: **911040037**
  reaches ring pieces **1483, 2345, 2347, 2349** plus road-93 piece
  **2344**; **911170037** reaches road-93 pieces only (five pieces, the
  remainder of the 6-piece road-93 chain).

**v1's `NOT_AVAILABLE` claim is RETRACTED** (R1 above) — real condition
data was present in the retained samples the whole time; v1's own lookup
(or its own claim-writing) was wrong, not the underlying data.

## 3. Hagstofa settlement classification and year rule — CORRECTED (K2/S2/S2b/S6)

`samples/build_phase2_v2.py::classify_hagstofa_rows()` classifies all 120
rows via a rule derived from the data's own shape (not chosen per-row):
`code=="0"` → `TOTAL`; name starts with `"Strjálbýli á"` → `RURAL_AGGREGATE`;
else → `SETTLEMENT`. Result (`samples/hagstofa_classification-v2.json`):
**111 SETTLEMENT rows**, brackets for 2025 **≥200: 67, ≥500: 42, ≥1000: 27**.
These are COMPUTED from the rule, then COMPARED against Jonesy's/Ripley's
own independently-stated targets (111; 67/42/27) as a consistency check —
not asserted equal to them (would be circular). They match exactly.

**v1's 119/74/49/32 (R2 above) wrongly included 8 `RURAL_AGGREGATE` rows**
(codes 100, 180, 331, 521, 641, 861, 1081, 1301 — "Strjálbýli á…", 17,508
people total in 2025) as if they were settlements.

**Year rule — two interpretations, shown side by side as a dated
addendum** (not a silent rewrite of the original rule; see
`rules-addendum-v2.md`):

- **Interpretation A** (zero counts as valid): every year is 100%
  numerically complete — the 95% threshold can never fail on this table,
  so "2025 passes" reduces to "2025 is simply the newest requested year."
- **Interpretation B** (zero does not by itself prove a genuine,
  continuously-reported settlement): 2023 = **87.39%**, 2024 = **95.50%**,
  2025 = **94.59%** (of 111 `SETTLEMENT` rows only, not the raw 120-row
  table).

**2025's own finality/provisional status is `NOT_DETERMINED`**: the
metadata response has no provisional/finality field at all; its own
`updated` timestamp (2024-03-17) predates 2025's own existence in the
table and describes when the table's schema was last edited, not whether
2025's own cells are final.

**Six `SETTLEMENT` rows are exactly 0 in 2025**: Mosfellsbær, Hjalteyri,
Kristnes, Eiðar, Skógar, Rauðalækur.

**Code 50 ("Reykjavík")**: `INCLUDED_IN_CODE_50_INFERRED` is proposed, and
ONLY from retained-data absence, for Kópavogur, Hafnarfjörður, Garðabær,
and Seltjarnarnes — **none of the four has any row at all** anywhere in
the 120-row table. **Mosfellsbær is explicitly excluded from this
proposal**: it HAS its own code (70), just with a genuinely zero value —
a different, still-unresolved anomaly (§6 below), not evidence it is
"inside" code 50 the same way the other four are proposed to be. No
outside population figure is used for any of this.

**The 25-person discrepancy** (sum of non-`TOTAL` rows = 391,909 vs. the
`TOTAL` row's own 391,884, 2025) remains **unexplained**, with one
INFERRED (not proven) candidate cause: independent per-row rounding of an
"average population" measure.

**Grindavík, year-selection effect (K2d)**: 2023=3,567 → 2024=2,409 →
2025=1,030 — above the 1,000 bracket in all three years, but by a
shrinking margin each year (2025 is only 30 over). No crossing is
claimed; the sensitivity is shown, not asserted as a crossing.

## 4. Egilsstaðir — two distinct points, never conflated (K3/S3/P5)

`samples/build_phase2_v2.py::egilsstadir_nodes()` reads
`chain-walks-v4.json`'s own `cw_long` step list directly (summing
`piece_cost_m`/`gap_into_m` in order — never typed from prose) and
cross-checks both resulting coordinates against `road-links.csv`'s own
stored `start`/`end` for piece 2345 (within 0.1 m). Direction in
`cw_long` is `rev` (entry = piece's own stored end; exit = piece's own
stored start).

**Result (`samples/egilsstadir_nodes-v2.json`):**

- **Junction node** (ring/road-93 junction, piece 2345's own stored END,
  the walk's own ENTRY): coord `(715153.7400, 536679.9300)`, cum **677.6344
  km excl. 1436 / 680.1945 km incl.**
- **Phase-1 inventory node** (piece 2345's own stored START, the walk's
  own EXIT — what phase-1's `place-inventory.csv` actually recorded):
  coord `(714320.9956, 536912.9869)`, cum **678.5614 km excl. 1436 /
  681.1216 km incl.**

**Mutation tests that must fail, and did** (`mutation_tests_all_
correctly_distinguished: true`): swapping entry/exit coordinates, and
swapping which cumulative figure belongs to which point, both correctly
raised rather than silently passing — the two points are genuinely
distinguished by the script, not just by this prose.

v1's single `EGILSSTADIR` row (R3 above) had conflated these: it used
the JUNCTION coordinate but the PHASE-1 node's own without-1436 distance,
mislabelled `incl_1436`, with `instance=fwd/fwd` instead of `rev`. Both
points now have their own identifier in `place-inventory-v2.csv`
(`EGILSSTADIR_JUNCTION`, `EGILSSTADIR_PHASE1_NODE`).

## 5. Road 93 — continuity independent of `validate_route`, tier sensitivity, reuse (K4/S4)

`samples/build_phase2_v2.py::road93_section()`:

- **Canonical order derived from data**: `load_road93_canonical()` picks,
  per IDFERILL, the tier-`-1` (most-vertices) copy (E2d). The 6-piece
  order `2344 → 3410 → 3409 → 2894 → 2892 → 2891` is checked against
  `KAFLANR` (monotonic "01".."06", asserted) — not hardcoded as a bare
  literal and trusted; the assertion is the actual check.
- **Continuity check, SEPARATE from `validate_route`**: gap between
  consecutive pieces' own stored endpoints must be ≤ 100 m. The canonical
  order passes (all 5 gaps 0.0 m). **Negative tests that must fail, and
  did** (`passes: false` for all three): a random permutation, a
  duplicated piece, a synthetic >100 m inserted gap.
  (Confirms Jonesy's own S4 finding: phase-1's own `validate_route`
  accepts all 20/20 random permutations of these 6 pieces in sandbox —
  it does not check contact at all. This continuity check is therefore
  a genuinely new, independent check, not a restatement of `validate_route`.)
- **Supply-chain check before reuse**: `national_inventory_v4.py`'s own
  SHA-256 is verified (`a3fa0bd4891405081fa25a1087e409c21582006f0777f3f8fbe91a2246ab3ad8`,
  matches phase-1's own `HASHES-v4.sha256`) before it is imported.
  `validate_route` is then actually called (not just described in
  prose) on both the forward and reverse 6-piece sequence — both accepted
  — and on a constructed duplicate-piece sequence, which it correctly
  rejects (`RouteInvalid`). All of VEGHLUTI=1 for these 6 pieces, so the
  one-directional-veghluti branch of `validate_route` is not exercised by
  this particular route (recorded, not hidden).
- **Tier sensitivity, reported**: tier `-1` (canonical) = **26,926.55 m =
  26.9266 km**; tier `2` (coarsest) = **24,752.45 m = 24.7525 km**
  (**-8.07%**, matching the -8.1% sandbox figure within rounding).
- **Two route-length variants, both reported, neither replacing the
  other**: from the JUNCTION node, **26.9266 km**; from the phase-1 node
  (via piece 2345's own 927.0346 m), **27.8536 km**.

v1's `cc-report.md` claim "same validator reused unchanged from phase 1" /
"both directions ... validated" (R4 above) is CORRECTED: v1's own
`build_road93_candidate.py` never actually called `validate_route` — the
order was hardcoded and the claim was prose-only. This round's
`road93_section()` is the first script in this task that actually does.

## 6. Work-list extraction and matching; weather-point proposals (K5/S5)

`samples/build_phase2_v2.py::extract_work_list()` parses `national-place-
coverage.md`'s own "Vinnulisti eftir svæðum" table directly (SHA-256
verified before parsing), columns 2 and 3 only, split on commas,
NFC-trimmed (`samples/worklist_and_weatherpoints-v2.json`):

- **Input: 74 cells.** "Gatnamót tenginga við veg 1" **excluded** (reason:
  names a connection-point type, not a settlement). The editorial suffix
  "og fleiri firðir eftir nákvæmri yfirferð tenginga" is **stripped**
  from the one cell that carries it, leaving "Stöðvarfjörður". The two
  "Stöðvarfjörður" entries (one per column) are **merged into one output
  row carrying both source references** — nothing silently dropped.
  **Output: 72 rows.** Input/output cell counts are both recorded, and
  the match step asserts one result per output row (72 = 72).
- **Matching**: exact-NFC, or a prefix match (`name == candidate` or
  `candidate.startswith(name + ",")` or `candidate.startswith(name +
  " ")`) against the Hagstofa table's own 119 non-`TOTAL` names.
  **66 MATCHED, 2 AMBIGUOUS, 4 UNMATCHED.**
  - **AMBIGUOUS**: "Reykholt" (candidates: code 193 "Reykholt,
    Borgarfirði"; code 1162 "Reykholt, Biskupstungum"); "Vogar"
    (candidates: code 160 "Vogar"; code 705 "Vogar við Mývatn"). Neither
    auto-resolved.
  - **UNMATCHED**: "Kópavogur", "Hafnarfjörður", "Garðabær" (consistent
    with §3's own `INCLUDED_IN_CODE_50_INFERRED` proposal — no row for
    any of them exists at all), and "Reykjanesbær" (no corresponding
    row or proposal found in retained data; left `UNMATCHED`, not
    guessed).
  - Region is recorded as context only, never used to force a match.
- **Weather-point proposals** (`road93_weather_point_proposals()`): 4
  points placed at even fractions (0%, 33%, 67%, 100%) along the tier-`-1`
  road-93 polyline, coordinates by linear interpolation between real
  digitized vertices only. Each records its own piece (IDFERILL),
  distance from the junction node, and the IDBUTUR of the section it
  falls on. No elevation, terrain, or named-landmark claim is made.
  Point *selection* remains an owner decision, unchanged from phase 1.

This satisfies item 5/K5 for the parts that were possible from retained
data. See §9 for what is explicitly NOT finished.

## 7. What this round did NOT do / scope boundary

- `place-inventory-v2.csv` keeps v1's own example-row scope (Selfoss,
  Hella, Hvolsvöllur, the two Egilsstaðir nodes, Seyðisfjörður, the
  3 ferry rows, the Mosfellsbær anomaly) corrected per §§3-5 above. It
  does **not** inline all 72 work-list rows — those live in
  `samples/worklist_and_weatherpoints-v2.json` instead, to avoid
  duplicating the same data in two places with two different
  normalization paths.
- No new road-condition/notice sample, no Hagstofa licence/terms fetch,
  no new WFS fetch — K6, no network this round.
- The AMBIGUOUS/UNMATCHED work-list rows (§6) are not resolved further —
  doing so would require either an owner decision (ambiguous) or a new
  source (unmatched), both outside this round's own offline scope.
- Weather-point *selection* (as opposed to the proposal mechanism) is an
  owner decision, not made here.

## 8. Delivery hygiene (K7)

v1's own `evidence.md`, `cc-report.md`, and `place-inventory.csv` are
preserved byte-for-byte in `samples/v1/*-superseded.*` and hashed as
`superseded` in `HASHES-v2.json`, so this round's own retraction table
(§0) quotes text that remains independently verifiable. The root
`place-inventory.csv` is untouched; the corrected registry is the new
`place-inventory-v2.csv`. All new/changed older-file hashes (before and
after, where applicable) are in `HASHES-v2.json`/`HASHES-v2.sha256`,
generated LAST, after `cc-report.md`'s own v2 addendum — both files are
listed in the hash table, not excluded by oversight.

## 9. Outcome

Every sub-item required by `approved-prompt-v2.md` (K1-K5) that can be
answered from retained data was answered, programmatically, with
assertions and negative/mutation tests that were shown to fail where
required (§§2-6). Nothing in this round is `BLOCKED` outright. However,
§6 and §7 record real, explicit residual gaps (2 AMBIGUOUS + 4 UNMATCHED
work-list entries; weather-point *selection* not made; licence still
`LICENSE_NOT_DETERMINED`) that are not silently folded into a bare
"complete."

**Outcome: `EVIDENCE_READY_FOR_OWNER_REVIEW`**, qualified by the gaps
named in §§6-7 (none of them `BLOCKED_WITH_EXACT_GAPS` — all are
resolved as far as retained data allows, with the remainder correctly
labelled AMBIGUOUS/UNMATCHED/owner-decision rather than guessed).
`LICENSE_NOT_DETERMINED` stands; no population figure enters the app.

---

## v3 correction addendum (2026-11-09) — append-only, supersedes nothing above by deletion

Executed `approved-prompt-v3.md` (M1-M6) after Jonesy's result review
round 2 (`result-review.md`, REVISE, findings N1-N6) and Ripley's
acceptance of REVISE N1-N6. **No new network exchange this round.**
Everything above this line is v2's own text, unedited; v2's own
`egilsstadir_nodes-v2.json`, `place-inventory-v2.csv`, and this file's
and `cc-report.md`'s pre-v3 bytes are preserved in `samples/v2/*-
superseded.*`.

### §10. The real bug (N1) and its fix

`chain-walks-v4.json`'s own `cw_long.steps` list **starts with piece
1436 as step 0** — its own running prefix sum is therefore already the
WITH-1436 total from the first step onward. v2's `egilsstadir_nodes()`
treated that running sum as WITHOUT-1436 and added
`piece_1436_length_m` a SECOND time to produce what it called `incl_
1436` — a genuine double-count, 2.5601 km too high, with the labels
swapped on top of that.

**Corrected values** (`samples/place_nodes-v3.json`), computed via two
independently-implemented paths that must agree — a forward prefix sum
(production) and a backward suffix sum, `S - suffix(i)`, where `S =
total_cost_m_incl_1436` (validator) — and cross-checked against
`road-links.csv`'s own stored start/end coordinates (direction `rev`:
entry = stored end, exit = stored start):

| Piece | Entry incl/excl 1436 (km) | Exit incl/excl 1436 (km) |
|---|---|---|
| 2345 (Egilsstaðir junction/phase-1 node) | 677.6344 / 675.0743 | 678.5614 / 676.0013 |
| 2138 (Selfoss) | 43.7329 / 41.1727 | 45.7405 / 43.1803 |
| 3591 (Hella) | 80.9378 / 78.3776 | 81.7696 / 79.2094 |
| 3593 (Hvolsvöllur) | 94.3749 / 91.8148 | 94.6543 / 92.0942 |

These match Jonesy's own independently-recomputed sandbox figures
exactly. v1/v2 displayed Hvolsvöllur's exit as `94.6544`; this round's
own unrounded sum gives `94.6543` — a 0.1 mm difference, within the
0.1 m display tolerance, recorded (M3) as the reason to compute in full
precision and round only at display time, not a substantive change.

### §11. Validator and mutation tests (N2/M2)

`validate_node()` is the ONE function used both to accept the correct
record and to run every negative test — it is never duplicated or
special-cased for the positive path. Run BEFORE any v3 output file was
written (`samples/place_nodes-v3.json`'s own `mutation_tests_before_
any_output_written`), all four negative tests were REJECTED:

1. Entry/exit coordinate swap.
2. Incl/excl-1436 field swap.
3. Double-counting `piece_1436_length_m` a second time (the actual v2
   bug, reproduced deliberately as a test case).
4. **The literal wrong v2 values** (`680.1945`/`677.6344` for the
   junction; `681.1216`/`678.5614` for the phase-1 node, copied verbatim
   from `egilsstadir_nodes-v2.json`) — rejected by the SAME validator
   that accepts this round's own correct values.

v2's own two "mutation tests" (entry≠exit coordinate; entry_cum≠exit_
cum) are **retracted as not meeting this bar** — they are true of any
two distinct points and would have passed even with the N1 bug present;
they never exercised a with/without-1436 basis swap at all.

### §12. Selfoss/Hella/Hvolsvöllur under the same validator (N3/M3)

All four pieces (2138, 3591, 3593, 2345) are computed and validated by
the identical `validate_node()` function — not a separately-trusted
path. A record built from a mismatched coordinate or a wrong 1436 basis
for any of the four fails the same way. See `place-inventory-v3.csv`.

### §13. Fetch-script limitations now actually documented (N4/M4)

`samples/ledger_integrity-v3.json`: exactly 3 ledger lines (asserted),
and for each, `sha256_of_received_bytes`/`bytes_received` match the
actual retained raw file's own SHA-256/byte-length exactly
(`all_3_of_3_pass: true`) — proof that the retained bytes are exactly
what the real exchanges received, **not** proof that any guard was
exercised. Limitations recorded as untested/unenforced in the real
run: a mid-body stall can present as `status=200`, `error=None`,
`truncated=false`, 0 bytes, with only `timeout=true` set, which
`exchange*.py` never checks (Jonesy's own 127.0.0.1 sandbox finding,
cited as hers, not re-run here — no new network attempt this round);
the 20 s limit is a socket timeout, not a wall-clock total;
`remaining_total_budget_bytes` was never actually sent in any of the 3
real requests (`cap_applied_bytes=8388608` in all three); no code
guards the aggregate exchange count or elapsed time.

### §14. Work-list matching corrected (N5/M5)

Exact NFC match now runs FIRST and, if found, is final — it no longer
continues on to consider prefix candidates that would otherwise make an
exact match look ambiguous. This fixes v2's own "Vogar" bug: "Vogar"
exactly matches Hagstofa code 160's own name; v2 additionally treated
"Vogar við Mývatn" as a rival prefix candidate, wrongly producing
`AMBIGUOUS`. **Corrected counts: 67 MATCHED, 1 AMBIGUOUS (Reykholt,
codes 193/1162), 4 UNMATCHED** (Kópavogur, Hafnarfjörður, Garðabær,
Reykjanesbær) — matching Jonesy's own independent sandbox count
exactly. Every row now carries `match_type` (`EXACT`/`PREFIX_SINGLE`/
`AMBIGUOUS`/`NONE`), `reason`, `source_reference`, and generic flags
(`zero_population`, `is_rural_aggregate`) derived from the data for
every matched row, not special-cased for one name.
`INCLUDED_IN_CODE_50_INFERRED` is now actually linked for Kópavogur,
Hafnarfjörður, and Garðabær (all three UNMATCHED and already proposed
by the classification step); Reykjanesbær stays UNMATCHED with its own
reason, not linked (nothing in retained data proposes it is inside code
50); Mosfellsbær (MATCHED, code 70) gets `zero_population=true` and an
explicit `NOT_DETERMINED` interpretation note, not "discontinued/
reclassified." See `samples/worklist_matching-v3.json`.

### §15. Retraction table (verbatim quotes)

| v2 said (verbatim) | Where | Correction |
|---|---|---|
| `cum_km_incl_1436: 680.1945, cum_km_excl_1436: 677.6344` (junction); `681.1216`/`678.5614` (phase-1 node) | `egilsstadir_nodes-v2.json` | 677.6344 incl / 675.0743 excl (junction); 678.5614 incl / 676.0013 excl (phase-1 node). |
| "egilsstadir junction cum_km_excl_1436: 677.6344 (target 677.6344, exact)" | `cc-report.md` v2 addendum run log | The NUMBER matched; the LABEL (incl vs excl) did not. |
| "Mutation tests that must fail, and did ... the two points are genuinely distinguished by the script, not just by this prose." | `evidence.md` v2 §9 | Overstated — the tests that existed never tested a with/without-1436 basis swap. |
| "cum_km_excl_1436=678.5614 here is the value v1 mistakenly attached ... to its single EGILSSTADIR row." | `place-inventory-v2.csv` | Wrong attribution — v1 actually attached 676.0013, not 678.5614. |
| "...large enough that code 50 is clearly the whole capital-area core..." | `place-inventory-v2.csv` (Mosfellsbær note) | "Clearly" retracted — code 50's size is consistent with, and offered as one INFERRED reason for, this reading, not a confirmed fact. |

`place-inventory-v2.csv` and `egilsstadir_nodes-v2.json` are **not**
rewritten — both remain on disk exactly as v2 left them (confirmed
byte-identical to `samples/v2/*-superseded.*`), documented here as
obsolete for the Egilsstaðir question. `place-inventory-v3.csv` is the
corrected registry.

### §16. Outcome (v3)

M1-M5 all passed their own assertions in this round's actual run (see
`samples/build_phase2_v3.py`'s own run log in `cc-report.md`'s v3
addendum). **Outcome: `EVIDENCE_READY_FOR_OWNER_REVIEW`**, under the
same qualifications as §9 above (2 AMBIGUOUS→now 1 AMBIGUOUS + 4
UNMATCHED work-list entries; weather-point selection; fetch-script
limitations untested/unenforced). `INCLUDED_IN_CODE_50_INFERRED`
remains INFERRED, never asserted as fact. `LICENSE_NOT_DETERMINED`
stands; no population figure enters the app.
