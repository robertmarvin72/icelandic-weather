# #493 access-points — Evidence v2 (correction round, H1-H8/J1-J6)

2026-11-10, CC. Executed `approved-prompt-v2.md` after Jonesy's result
review round 1 (`result-review.md`, REVISE, findings H1-H8) and her
own prompt-review approval of the correction prompt with conditions
J1-J6 (`correction-prompt-review.md`). **This file is an INDEX over
the authoritative v2 outputs — v1's own files are byte-unchanged and
are not superseded, retracted, or marked in any way.** No new network
exchange, no coordinate reprojection, no new host.

**First action this round** (per J6's own final bullet): a read-only
SHA/size/line-ending snapshot of every pre-existing v1 task file (18
files) plus all 12 of G7's original inputs (`samples/v2/v1_and_input_
baseline.json`, 30 entries total), taken BEFORE `rules-v2.md` or any
other v2 output was written. The same 30 paths are re-hashed at the end
of this round and confirmed unchanged (`samples/v2/HASHES-v2.json`'s
own `v1_and_inputs_still_unchanged` table).

## Authoritative v2 outputs (this is the index)

| File | What it is |
|---|---|
| `rules-v2.md` / `rules-v2.sha256` | This round's own closed vocabulary, stem-search rule, numeric-schema rule, direction rule, outcome-label criteria — written and hashed before the build script ran. |
| `place-access-status-v2.csv` | The corrected 72-row connectivity table. |
| `endpoint-candidates-v2.json` | Corrected Reykjavík legs, the 7-node Egilsstaðir/Seyðisfjörður comparison (now fully numeric-schema-clean), Akureyri. |
| `samples/v2/place-node-references.json` | The two labelled candidate records each for Selfoss/Hella/Hvolsvöllur (H1). |
| `samples/v2/gap_list_v2.json` | 70 gap entries, place-specific reasons, `host_candidates`. |
| `samples/v2/stem_search_hints.json` | The general stem-search results for all 72 names (J5), informational only. |
| `samples/v2/phase1_role_readout.json` | The per-place `access_node_end`/`cw_long` role readout for all 24 individually-assessed phase-1 places (J1), not just the 7 named in the prompt. |
| `samples/v2/mutation_test_summary.json`, `samples/v2/counts_summary.json` | Test counts and gap/hint counts, computed in code (J5/H8), not restated as fixed text. |
| `samples/v2/build_access_points_v2.py` | The build script. |
| `samples/v2/validate_final_outputs_v2.py` | The SEPARATE, import-free final-output validator (J2) — re-reads the written files and independently re-derives every value from raw `chain-walks-v4.json`. |
| `samples/v2/HASHES-v2.json` / `HASHES-v2.sha256` | Generated last. |

## H1 — the actual bug, and the fix

v1's own `build_access_points.py` always read a piece's own stored
**END** coordinate but always reported the **EXIT** cum (which, under
this project's `rev` convention, belongs to the stored **START**) — a
role mismatch between coordinate and distance in the SAME row, for
seven places, producing a self-contradiction of 0.3-6.4 km:

| Place | Phase-1's own `access_node_end` | What v1 actually output | The real conflict |
|---|---|---|---|
| Selfoss (2138), Hella (3591), Hvolsvöllur (3593) | `end` (ENTRY) | ENTRY coord + EXIT cum (mismatched) | Phase-1's own pick (ENTRY) and phase-2's own validated node (EXIT, `place-inventory-v3.csv`) are genuinely TWO DIFFERENT points, 0.3-6.4 km apart — not a bug in the underlying data, a genuine unresolved disagreement between two prior rounds. |
| Vík (3849), Fáskrúðsfjörður (2536), Reyðarfjörður (2520), Reykjahlíð (3566) | `start` (EXIT) | ENTRY coord + EXIT cum (mismatched) | No real disagreement — v1 simply never read `access_node_end` and defaulted to the wrong coordinate. The cum (EXIT) was already right. |

**Fix**: `samples/v2/phase1_role_readout.json` prints, for ALL 24
individually-assessed phase-1 places (not only the 7 named above),
`access_node_end`, whether the piece is in `cw_long`, its own retained
`direction`, and the derived `node_role`/`stored_field` — read from
retained files at run time, never hardcoded. For Selfoss/Hella/
Hvolsvöllur, BOTH candidate records (ENTRY/`PHASE1_REFERENCE` and
EXIT/`PHASE2_V3_NODE`) are now emitted, each internally self-consistent
(validated by `validate_node_role()`), in `samples/v2/place-node-
references.json`; the main table's own row for these three carries
neither coordinate alone, with a note pointing at the reference file —
**no new single place endpoint is chosen**, exactly as J1 requires. For
the other four, only the phase-1 EXIT/START reference is emitted,
self-consistent this time (EXIT coord + EXIT cum); v1's own ENTRY
coordinate is explicitly NOT re-emitted as a new candidate, because it
was never phase-1's own retained choice — only an artefact of the bug.

Egilsstaðir (`access_node_end=start`, i.e. phase-1's own original pick
was the OTHER point) and Akureyri were already self-consistent in v1
and are unchanged in role; Egilsstaðir's own continued use of the ring
JUNCTION (not phase-1's original point) is phase-2's own deliberate,
already-reviewed upgrade (a VERIFIED 0.0 m multi-line contact — a
categorically stronger kind of evidence than the Selfoss-pattern three,
which is why it is not treated the same way).

## H2 — Reykjavík, derived from `cw_long` step 0, not a literal

v1 reported the short/western leg's own `excl_1436` offset as `0` and
the long/eastern leg's own `incl_1436` offset as `0` — backwards; the
correct pairing (confirmed against `place_nodes-v3.json`'s own
convention, applied to piece 1436 itself) is:

- **Short/western leg, ENTRY/stored END**: `incl_1436=0`,
  `excl_1436=-2.5601 km` (negative — the excl-basis origin is defined
  at piece 1436's own far end, which this leg has not yet reached).
- **Long/eastern leg, EXIT/stored START**: `incl_1436=+2.5601 km`,
  `excl_1436=0`.

Derived from `cw_long`'s own step 0 (`piece_cost_m`, with `gap_into_m`
asserted `== 0`) — **no hardcoded `2560.1497`** anywhere in
`build_access_points_v2.py`. `samples/v2/validate_final_outputs_v2.py`
independently re-derives both legs via its own suffix-sum
implementation and confirms the match; it also loads v1's own
`endpoint-candidates.json` by its recorded SHA-256 and confirms BOTH
of v1's own offsets mismatch the correct figures (the negative test
J2 requires).

## H3 — numeric schema now covers every output, not two CSV columns

`assert_numeric_schema()` walks the ENTIRE written structure (both
`place-access-status-v2.csv`'s own rows and all of `endpoint-
candidates-v2.json`, recursively) and asserts every key matching a
coordinate/length/cum/offset pattern holds a finite number or `None` —
the key list is derived from a fixed suffix set, not a hand-picked
column list, so a forgotten field cannot silently escape the check.

Node 2345 (the ring/road-93 junction) now carries two clearly
DIFFERENT, correctly-typed field groups instead of one text-polluted
one: `cum_km_tier_minus1`/`cum_km_tier_2` = `0.0`/`0.0` with
`origin_marked: true` (road-93's OWN distance count is defined to
start here — by construction, not measurement) and
`ring_cum_km_incl_1436`/`ring_cum_km_excl_1436` = `677.6344`/`675.0743`
(the RING's own distance from Rauðavatn, confirmed against
`place_nodes-v3.json`). v1's own literal — a length-comparison sentence
sitting in what should have been a numeric field — is read back
VERBATIM from v1's own `endpoint-candidates.json` (by its recorded
SHA-256) and confirmed to fail `assert_numeric_schema()`.

## H4 — every coordinate's own provenance, no bare literals

Every coordinate reported this round carries a `native_source_piece`
and `native_source_field` naming the exact retained file/feature/field
it came from. The two length figures `26.9266`/`27.8536` km are
RE-DERIVED this round from `wfs93-raw.json`'s own tier −1 geometry and
`chain-walks-v4.json`'s own piece 2345 length (not trusted as literals)
and confirmed to match within 0.1 mm/1 m tolerance. Akureyri's own
native coordinate and WGS84 are copied verbatim from `road-links.csv`
and `akureyri-endpoint-decision.md` respectively — no EPSG:3057->4326
arithmetic is run anywhere this round.

## H5 — specific gaps, general stem-search, transparent matches

- **Reykholt** gets its own region-disambiguation gap (codes 193 vs.
  1162), distinct from a generic UNMATCHED entry.
- **Kópavogur, Garðabær, Hafnarfjörður** each get their own UNMATCHED
  explanation, explicitly separating the confirmed Hagstofa non-match
  from the SEPARATE, INFERRED-only code-50 grouping proposal.
  **Reykjanesbær** gets its own, different explanation (no code-50
  inference applies to it at all — it is a municipality whose own
  settlement, "Keflavík og Njarðvík," code 141, is already MATCHED).
- **Stem-search rule** (`rules-v2.md`): general for all 72 names, fixed
  derivation (trailing-vowel strip, documented ö->a reversal, minimum
  stem length 7, chosen because the shortest true stem is 9 characters
  and the known false lead "Laugar" is 6). Recall assertion in code
  confirms the rule finds Skagastrandarvegur on **2423, 2456, and
  2478** (not only the two the draft prompt named), Þorlákshafnarvegur
  on 22722/22725, and Eyrarbakkavegur on (at least) the ten previously
  identified pieces. All matches for all 72 names are written to
  `samples/v2/stem_search_hints.json`, not only the three known cases.
  **Vopnafjörður was genuinely searched this round and found zero
  hits — "none" is now a verified finding** (`samples/v2/counts_
  summary.json`), not an unchecked claim as it read in v1.
  **Hvammstangi got 6 real hits** this round (`samples/v2/counts_
  summary.json`), confirming the "Hvammstangavegur" INFERRED hint.
  Every match is attached only to the searched place's own gap entry
  as an `INFERRED` text-mention note — `road_connection` is never
  changed by this search, for the searched place OR for the piece's
  own "home" place.
- **`host_candidates`**: empty for every one of the 70 gaps, with the
  uniform factual reason that no retained file in this task's own
  input set names a host/layer per place, and a host used by an
  earlier, different round is not re-authorised here.

## H6 — direction rule, restated with its own source

`direction_status=INFERRED` only where a record's role is validated
against a specific `cw_long` step's own `direction` field — unchanged
from v1's own rule, now explicit that `cw_long`'s own `direction` means
"which way this piece is traversed in the retained digitised geometry,"
never a claim about legal driving permission. Everywhere else:
`UNKNOWN`; `NOT_APPLICABLE` only where no node exists at all.

## H7 — paths and determinism

Every repo-relative path in `samples/v2/input_hashes.json` and
`samples/v2/v1_and_input_baseline.json` uses `Path.as_posix()`. The
build script was run twice in direct succession; all five of its own
output files (`place-access-status-v2.csv`, `endpoint-candidates-v2.
json`, `samples/v2/gap_list_v2.json`, `samples/v2/place-node-
references.json`, `samples/v2/stem_search_hints.json`) compared
byte-for-byte identical (`diff`, no output) — confirmed on this one
machine/OS only; no claim of cross-platform testing is made, because
none was performed.

## H8 — candidate search on the nine retracted places, and exact counts

All nine phase-1-retracted names (Hveragerði, Kirkjubæjarklaustur,
Höfn, Djúpivogur, Breiðdalsvík, Fellabær, Varmahlíð, Blönduós,
Mosfellsbær) received a REAL stem search this round (asserted in code,
not assumed); all nine still resolve to `NODE_UNDETERMINED`, confirming
the retained hints genuinely cannot raise `road_connection` past the
regression ceiling (`{NODE_UNDETERMINED, NAME_MATCH_INFERRED}`).

**Exact counts, recomputed in code this round** (`samples/v2/counts_
summary.json`), not restated as fixed text:

- 72 rows, 70 gap entries, 2 places with none (Egilsstaðir, Akureyri).
- Of the 70, exactly **2** are the predictable `BLOCKED_WITH_EXACT_
  GAPS` sub-items (Reykjavík's own `REY-CORE`; Seyðisfjörður's own
  missing settlement coordinate/road-93 WGS84) — leaving **68**
  ordinary gaps. The v1 arithmetic `68 = 70 - 2` is CONFIRMED correct
  by this recomputation, not merely repeated.
- **3** gap entries (Selfoss, Hella, Hvolsvöllur) are specifically the
  "two disagreeing candidate records" kind, distinct wording from the
  other 65 ordinary gaps (fixed this round — v1's own gap text for
  these three wrongly read like an ordinary name-match gap).
- Mutation tests: **60** individual assertions across **20**
  (piece, role) combinations on **10** distinct pieces (the original 9
  plus piece 1436 itself, newly included this round) — not "4 tests on
  9 pieces," an exact count computed in code.

## Outcome

72=72 (same order, no duplicates, no population figure); the schema
validator accepts the final written output and correctly rejects both
verbatim v1 negative cases (the Selfoss row, the swapped Reykjavík
offsets); the SEPARATE final-output validator
(`validate_final_outputs_v2.py`, no import of the build script)
independently re-derives and confirms 13 records plus both Reykjavík
legs, and independently confirms both v1 negative cases fail; the G4
seven-node comparison is delivered fully numeric-schema-clean and
unselected. Per `rules-v2.md`'s own pre-registered criteria (G8),

**Outcome: `EVIDENCE_READY_FOR_OWNER_REVIEW`**, with the same two
predictable `BLOCKED_WITH_EXACT_GAPS` sub-items as v1 (`REY-CORE`; road
93's own missing WGS84/Seyðisfjörður settlement coordinate) named
explicitly, and the 68 ordinary + 3 dual-candidate gaps itemised in
`samples/v2/gap_list_v2.json`. `LICENSE_NOT_DETERMINED` stands; no
population figure appears anywhere in this round's output; no
`INFERRED` finding is described as "clearly" or "confirmed"; a
verified contact is never described as proof of a legal driving
direction.
