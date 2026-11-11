# #493 phase2 — Rules addendum v3

2026-11-09, CC. **Correction after Jonesy's result review round 2
(N1-N6/M1-M6), not an original pre-registration.** Corrects a real bug
in v2's own `egilsstadir_nodes()`: `chain-walks-v4.json`'s own
`cw_long.steps` already starts with piece 1436 as step 0, so its own
running sum already is the WITH-1436 total. v2 treated that sum as
WITHOUT-1436 and added `piece_1436_length_m` a second time, producing a
value 2.56 km too high and mislabelled. Written and hashed BEFORE
`samples/build_phase2_v3.py` runs, same discipline as v2.

## M1 — independent suffix-based validator (no shared code with production)

**Production (prefix sum, from the start):** for step index `i` in
`cw_long.steps`, let `prefix(i)` = sum of `(gap_into_m + piece_cost_m)`
over `steps[0:i]`. Then:

- `entry_cum_incl_1436(i) = prefix(i) + steps[i].gap_into_m`
- `exit_cum_incl_1436(i) = entry_cum_incl_1436(i) + steps[i].piece_cost_m`
- `*_excl_1436 = *_incl_1436 - piece_1436_length_m` (a single subtraction,
  not an addition -- `cw_long`'s own running sum already includes 1436
  from step 0 onward).

**Validator (suffix sum, from the end -- independent method, not a
restatement of the above):** let `S = total_cost_m_incl_1436` and
`suffix(i)` = sum of `(gap_into_m + piece_cost_m)` over `steps[i:]`.
Then `prefix(i) = S - suffix(i)`, so:

- `entry_cum_incl_1436(i) = S - suffix(i) + steps[i].gap_into_m`
- `exit_cum_incl_1436(i) = S - suffix(i+1)`
- `*_excl_1436` by the same single subtraction as above.

Both paths are implemented as separate functions reading the same raw
`chain-walks-v4.json`, never calling each other. The validator checks a
produced node record against ITS OWN suffix-computed expectation --
comparing the **(value, label) pair**, not a bare number (this is the
exact gap that let v2's bug slip through: `evidence.md` v2 compared
"677.6344 == target 677.6344" and called it exact, without checking that
v2's own field was labelled `excl_1436` while the target is the
`incl_1436` figure). Tolerance: 0.1 m, applied only at comparison time;
distances themselves are computed in full float precision and rounded
only for display (4 decimals, km).

**Sandbox comparison values (not hardcoded as output, independently
reproduced this round -- see `samples/build_phase2_v3.py` run log),
km, incl / excl 1436:**

| Piece | Entry (into the piece) | Exit (out of the piece) |
|---|---|---|
| 2345 (Egilsstaðir ring/road93 junction) | 677.6344 / 675.0743 | 678.5614 / 676.0013 |
| 2138 (Selfoss) | 43.7329 / 41.1727 | 45.7405 / 43.1803 |
| 3591 (Hella) | 80.9378 / 78.3776 | 81.7696 / 79.2094 |
| 3593 (Hvolsvöllur) | 94.3749 / 91.8148 | 94.6543 / 92.0942 |

Direction in `cw_long` for all four pieces is `rev`: ENTRY = the piece's
own stored END coordinate (`road-links.csv`), EXIT = the piece's own
stored START coordinate. A produced node whose coordinate does not match
its own claimed entry/exit role (cross-checked against `road-links.csv`,
0.1 m tolerance) is rejected by the same validator.

Note (M3): v1/v2 both display Hvolsvöllur's exit as `94.6544` km; this
round's own unrounded suffix sum gives `94654.348...` m = `94.6543` km.
The 0.1 mm difference is within the 0.1 m display tolerance -- recorded
as the reason to compute first in full precision and round only at
display time, not to silently prefer one rounding.

## M2 — mutation tests (same validator that accepts the correct record)

Run BEFORE any v3 output file is written, using the one validator
function that also accepts the correct record:

1. **Entry/exit coordinate swap** -- must be rejected (coordinate no
   longer matches its own claimed stored end/start).
2. **Incl/excl field swap** -- must be rejected (value no longer matches
   its own claimed (value, label) pair within tolerance).
3. **Double-counted 1436** -- add `piece_1436_length_m` a second time on
   top of the already-inclusive prefix/suffix sum -- must be rejected.
4. **The actual wrong v2 values**, as a regression negative test:
   `(680.1945, 677.6344)` incl/excl for the junction node and
   `(681.1216, 678.5614)` incl/excl for the phase-1 node, taken verbatim
   from `samples/egilsstadir_nodes-v2.json` -- must be rejected by the
   SAME validator that accepts this round's own corrected values.

Confirming that two CORRECT numbers differ from each other is not a
mutation test and does not satisfy this condition (v2's own two checks
did only this, which is why N1 slipped past them).

## M3 — Selfoss/Hella/Hvolsvöllur under the same validator

Pieces 2138, 3591, 3593 (plus 2345) are all computed and validated by
the identical function used in M1/M2 -- not a separate, unverified path.
A record built from the wrong basis or the wrong point for any of these
four must fail the same way the Egilsstaðir mutation tests fail.

## M4 — integrity proof separated from unenforced protections

Final assert, run by `samples/build_phase2_v3.py`: exactly 3 lines in
`exchange-ledger.jsonl`, and for each line, `sha256_of_received_bytes`
and `bytes_received` match the actual SHA-256/byte-length of the
corresponding retained raw file on disk
(`metadata-MAN030106-raw.json`, `data-MAN030106-raw.json`,
`wfs93-raw.json`). This is a proof that the retained bytes are exactly
what the real exchanges received -- not a proof that any protection
mechanism was exercised.

Limitations, recorded as **untested/unenforced in the real exchanges**,
not fixed this round (no fetch-script change, no new network attempt):
a response that stalls mid-body can look like `status 200`, `error:
None`, `truncated: false`, 0 bytes, with only the key `timeout: true`
set -- `exchange*.py` never checks that key; the 20 s limit is a SOCKET
timeout, not a wall-clock total; `remaining_total_budget_bytes` was
never actually sent in any of the 3 real requests (`cap_applied_bytes`
= 8,388,608 in all three ledger lines), so the `min()` cap was only
exercised indirectly; no code guards the aggregate exchange count or
elapsed time. The mid-body/timeout behaviour above was Jonesy's own
127.0.0.1 sandbox finding (her result review round 1, S7) -- cited here
as hers, not re-run or claimed as this round's own test (no new network
attempt is authorised).

## M5 — work-list matching: exact-match priority, match_type, generic flags

**Exact NFC match is checked FIRST and, if found, is final** -- it does
not continue on to consider prefix candidates. This is the fix for v2's
own "Vogar" bug: "Vogar" exactly matches Hagstofa code 160's own name
"Vogar"; v2's rule additionally treated "Vogar við Mývatn" (code 705) as
a rival candidate via its own prefix check, wrongly making the result
AMBIGUOUS instead of MATCHED. Only when there is NO exact match does the
prefix check run (`candidate == name` already covered by exact;
`candidate.startswith(name + ",")` or `candidate.startswith(name + " ")`
otherwise) -- zero prefix candidates is `match_type=NONE`/`UNMATCHED`,
exactly one is `match_type=PREFIX_SINGLE`/`MATCHED` (e.g. "Höfn" ->
"Höfn í Hornafirði"; "Vík" -> "Vík í Mýrdal"), more than one is
`match_type=AMBIGUOUS`.

**Sandbox comparison** (independent, not the assert target): 67
MATCHED, 1 AMBIGUOUS (Reykholt, codes 193/1162), 4 UNMATCHED (Kópavogur,
Hafnarfjörður, Garðabær, Reykjanesbær); Vogar = code 160, MATCHED,
EXACT.

**Generic flags, derived from the data for every MATCHED row** (not
hand-special-cased for one name): `zero_population` (true if the
matched code's own `pop_2025 == 0`), `is_rural_aggregate` (true if the
matched row's own `row_type == RURAL_AGGREGATE`). Mosfellsbær's own
match (code 70, EXACT) gets `zero_population=true` and an explicit
`interpretation=NOT_DETERMINED` note -- not "discontinued/reclassified"
(retracted language, see evidence.md's own v3 addendum).

**`INCLUDED_IN_CODE_50_INFERRED` linkage**: only for work-list entries
that are BOTH unmatched AND already proposed as code-50-inferred by
`classify_hagstofa_rows()`'s own absence-based proposal -- that is
Kópavogur, Hafnarfjörður, Garðabær (all three appear in the work list
AND have no row of their own in the 120-row table). Seltjarnarnes is
also absence-proposed by `classify_hagstofa_rows()` but does not appear
in the work list at all, so there is no work-list row to attach the link
to -- this is not a contradiction, just two different data sources.
Reykjanesbær is UNMATCHED with its own `reason` but is NOT linked to the
code-50 proposal (it is a municipality name, not a þéttbýlisstaður, and
nothing in retained data proposes it is inside code 50) -- no population
figure is duplicated onto it.

Every output row carries `reason`, `source_reference` (region +
column), `candidates`, `match_type`, and the flags above. Assert: one
result per cleaned work-list row (72 = 72) and 100% `reason` coverage
(no empty reason field).

## M6 — preservation and retraction (v2 artifacts superseded, not rewritten)

Before `build_phase2_v3.py` runs: `evidence.md` and `cc-report.md`'s own
CURRENT (v2-round) bytes, plus `egilsstadir_nodes-v2.json` and
`place-inventory-v2.csv` (both completely unchanged -- NOT rewritten
this round, only documented as obsolete for the Egilsstaðir question),
are copied to `samples/v2/*-superseded.*` and hashed as `superseded` in
`HASHES-v3.json`. `evidence.md` then receives a dated v3 correction
section (append-only, like `cc-report.md` -- not a full rewrite); the
pre-v3 bytes remain recoverable from the `samples/v2/` copy regardless.

**Retraction table (verbatim quotes of what v3 corrects):**

| What v2 said (verbatim) | Where | What's actually true |
|---|---|---|
| `egilsstadir_nodes-v2.json`: junction `cum_km_incl_1436: 680.1945, cum_km_excl_1436: 677.6344`; phase-1 node `cum_km_incl_1436: 681.1216, cum_km_excl_1436: 678.5614` | `samples/egilsstadir_nodes-v2.json` | Junction is 677.6344 incl / 675.0743 excl; phase-1 node is 678.5614 incl / 676.0013 excl. v2 added `piece_1436_length_m` a second time and mislabelled the un-added sum as `excl`. |
| `cc-report.md` v2 run log: "egilsstadir junction cum_km_excl_1436: 677.6344 (target 677.6344, exact)" / "egilsstadir phase1-node cum_km_excl_1436: 678.5614 (target 678.5614, exact)" | `cc-report.md` (v2 addendum) | The comparison matched the raw NUMBER against the target but never checked the target's own with/without-1436 LABEL -- 677.6344 is the target's own `incl_1436` figure, not `excl_1436`. "Exact" was true of the number, false of the claim it was attached to. |
| Mutation-test description: "swapping which cumulative figure belongs to which point" (implied by evidence.md v2 §4 and the CSV's own mutation note) | `evidence.md` v2 §4 / code comments | No such swap test existed in `egilsstadir_nodes()` -- only an entry≠exit-coordinate check and an entry_cum≠exit_cum check, both of which are true of ANY two distinct points and prove nothing about correct with/without-1436 labelling. |
| `evidence.md` v2 §9: "Mutation tests that must fail, and did... the two points are genuinely distinguished by the script, not just by this prose." | `evidence.md` v2 §4/§9 | Overstated -- the tests that existed did pass, but they were not the basis-swap test the prompt required, so this did not actually guard against the N1 bug (which existed at the time this line was written). |
| `place-inventory-v2.csv`, `EGILSSTADIR_PHASE1_NODE` row note: "cum_km_excl_1436=678.5614 here is the value v1 mistakenly attached (as 'incl_1436', at the wrong point) to its single EGILSSTADIR row." | `place-inventory-v2.csv` | Wrong attribution -- v1 actually attached **676.0013** (not 678.5614) to its single EGILSSTADIR row. This note itself needs the correction it was trying to describe. |
| `(anomaly) MOSFELLSBAER` row note: "...large enough that code 50 is clearly the whole capital-area core..." | `place-inventory-v2.csv` | "Clearly" overstates an INFERRED proposal. Corrected wording: code 50's own size is CONSISTENT WITH, and offered as one INFERRED reason for, treating it as the capital-area core -- not a confirmed boundary fact. |

`place-inventory-v2.csv` and `egilsstadir_nodes-v2.json` are NOT
rewritten -- they remain on disk exactly as v2 produced them, confirmed
byte-identical to their own `samples/v2/*-superseded.*` copies, and are
documented (here and in `evidence.md`'s v3 addendum) as superseded for
the Egilsstaðir question specifically. `place-inventory-v3.csv` is the
new, corrected registry.

**Outcome label**: `EVIDENCE_READY_FOR_OWNER_REVIEW` applies only if
M1-M5 all pass their own assertions in this round's actual run; any
failure is `BLOCKED_WITH_EXACT_GAPS` naming the specific sub-item.
`INCLUDED_IN_CODE_50_INFERRED` remains INFERRED (never asserted as
fact); `LICENSE_NOT_DETERMINED` stands; no population figure enters the
app.

## Scope note

No new network exchange (K6/M4 unchanged). Allowed new files:
`rules-addendum-v3.md` (this file), `samples/build_phase2_v3.py`,
v3-named derived JSON/CSV, `place-inventory-v3.csv`,
`samples/generate_hashes_v3.py`/`HASHES-v3.json`/`HASHES-v3.sha256`,
`samples/v2/*-superseded.*`. `evidence.md`/`cc-report.md` receive
dated/append-only corrections, not full rewrites this round.
