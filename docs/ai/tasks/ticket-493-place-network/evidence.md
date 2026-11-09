# #493 place-network — Phase 1 evidence (offline, 0 network exchanges)

2026-11-09, CC. Executed `approved-prompt-v1.md` items 1-4/6, phase 1
scope only (E1), corrected under `approved-prompt-v2.md` (X1-X6),
corrected again under `approved-prompt-v3.md` (W1-W5/Z1-Z5), and **now
corrected a third time under `approved-prompt-v4.md` (T1-T5/Q1-Q7)**
after Jonesy's result review round 3 found v3's own substantive numbers
all survived independent recomputation, but: the script itself contained
no `assert`/raising validation at all (so a broken future run would
still have written output, despite the report saying "asserted"); the
tie-break rule `rules-addendum-v3.md` described in prose was never
actually implemented (a plain `nd < dist` comparison was used instead,
which — demonstrated in sandbox — would make the counterclockwise search
fail its own 29-piece reference under the rule AS WRITTEN, for the wrong
reason: unspecified first-found order, not the stated rule); VEGHLUTI=8
was misidentified as piece 1735 (actually VEGHLUTI=1 — the real role-8
piece, 36487, is on neither path and affects nothing); the Borgarnes
roundabout's two seam gaps were hardcoded rounded literals instead of
being read from north-data's own retained JSON; and the closure test's
own "Selfoss" target was selected by an unfiltered `next()` over IDBUTUR
matches, landing on the wrong instance (54.06 km away, not the ≈43-45 km
point `evidence.md` itself described). Each correction is documented as
a dated retraction (§1-v4/§1/§1-history below), not a silent rewrite —
prior text is superseded, not deleted from project history.

Outcome label: **EVIDENCE_READY_FOR_OWNER_REVIEW**, with explicit
`BLOCKED`/`NODE_UNDETERMINED`/`NOT_RUN` sub-items named throughout
(§8/§9).

## 1-v4. Dated retraction table — v4 correction (2026-11-09, applies on top of §1 below)

| # | Old claim (v3) | New figure/status (v4) | Why |
|---|---|---|---|
| 1 | "asserted over the full sequence" (§3), "assertion-checked" | **`grep assert` on v3's own script returned nothing — no code-level assertion existed.** v4 adds a real `validate_route()` that raises on any violation, run on both real paths AND four constructed negative cases (synthetic 54723/1477 `rev`, a synthetic 6/7-adjacent pair, the synthetic 49282→49281 U-turn, a synthetic repeated piece) — each negative case is confirmed REJECTED before any output file is written (T1). | The v3 script computed booleans (`matches_491_reference_29`, `negative_violations`) and printed them, but nothing would have stopped it from writing output if those booleans had been false (T1). |
| 2 | Tie-break rule stated in `rules-addendum-v3.md` prose, implemented as `if nd < dist_to[nxt]` | **A single comparable signature `(cost bucketed by 1e-6 m, piece_count, idferill_tuple, orientation_tuple)`, used as BOTH the priority-queue key and the relaxation test** (`rules-addendum-v4.md`, Q1). Demonstrated explicitly: the search avoids the zero-cost roundabout detours at 2791 and 49284 on the counterclockwise path (and 52492/36807 on the clockwise path), because "fewest pieces" is now a real tie-break criterion, not an accident of heap/visitation order. | Sandbox testing found 9 equally-optimal node-paths in each direction (4 distinct IDFERILL sequences each) caused by optional zero-cost roundabout insertions; under the rule AS WRITTEN but not coded, applying strict lowest-IDFERILL-first would have produced a 30-piece ccw sequence (via 2791) that fails the 29-piece reference — v3's own result only matched because of unspecified first-found behavior, not the stated rule (T2). |
| 3 | "VEGHLUTI 8 (the single nationwide instance, piece 1735)" | **RETRACTED. The single nationwide VEGHLUTI=8 instance is piece 36487** ("Vesturlandsvegur," 312.8675 m); **piece 1735 is VEGHLUTI=1.** Asserted from `road-links.csv` this round. Piece 36487 is on neither the ccw nor the cw path — forcing it one-directional (Ripley's decision, matching the ORIGINAL W1 instruction) changes nothing in any output, confirmed by byte-identical `chain-walks`/`bridge-summary`/stdout against v3's own retained files. | v3's first draft's real bug (an unreachable long route) came from the separately-documented start-point and C-target orientation mistakes — role 8 was never the cause, despite v3's own text saying so (T3). |
| 4 | Borgarnes roundabout seams hardcoded as `[1.7704, 42.8409]` (rounded) in the script | **Read from `docs/ai/tasks/ticket-493-north-data/route-data-candidate.json`'s own `unrounded_gap_from_prev_m` field, by IDFERILL key (30401, 2816): `1.7704337999295003` and `42.8408915829423`.** Source path + SHA-256 (`094fb5d3…`) recorded in this round's own output. Asserted: 18 = 16 + 2, no piece or the ring double-counted. | "Matching north-data exactly" was a tautology when the values were copied by hand from that same source in the first place — W3/Q4 required reading them programmatically (T4). |
| 5 | Closure test's own "Selfoss" target selected by `next(iterable)` over the first instance matching IDBUTUR 902030037 | **Named precisely: the EXIT of instance `(2138, "rev")`, = piece 2138's own stored START coordinate, (401739.850, 383119.047).** Cost 45,740.46 m incl. piece 1436 / 43,180.3 m excl. Route `[1436, 1735, 2071, 2024, 2117, 2135, 2138]`. Asserted this round. | `next()` over an unfiltered match landed on `(2135, "fwd")` at 54.06 km — a real, different point, not the ≈43-45 km "Rauðavatn–Selfoss" `evidence.md` itself already described elsewhere in the same document (T4/Q3). |
| 6 | §5's own "difference 0.0666 km" compared #491's JSON-stated short-route figure against this round's own canonical figure, but never did the SAME comparison for the Borgarnes→C leg | **North-data leg: canonical basis (every piece after 2819 through 2940, excluding the ring 30401, summed from `road-links.csv`, plus the two Q4 seam gaps) = 309.8270 km, vs. north-data's own JSON-stated 309.6507 km — difference 0.1763 km.** Full canonical ring ≈1309.04 km; canonical-basis detour estimate ≈1263.30 km, reported ALONGSIDE (not replacing) the mixed-basis 1308.7937 km / ≈1263.05 km figures, both clearly labeled (T5/Q5). | Z3/T5 required this comparison to be made explicit for BOTH legs, not just the Rauðavatn→Borgarnes one; the mixed-basis ring/detour figures were otherwise silently treated as more precise than they are (a ≈0.25 km / 0.02% gap, not material, but the basis itself needed naming). |

Positive confirmation (not a retraction): every substantive v3 NUMBER —
70,846.57 m (ccw), 928,362.95 m (cw), the Hella/long/short bridge counts,
the AKUREYRI/ANCHOR/MOSFELLSBAER inventory fixes — independently
reproduces byte-for-byte/value-for-value in v4's own, differently-built
script. Nothing numeric in §1/§1-history below needed a further number
change this round; only the SIX items above (process/assertion gaps,
one misidentified piece with zero output effect, hardcoded vs.
data-sourced constants, an imprecisely-targeted closure instance, and
one missing basis comparison).

## 1. Dated retraction table — v3 correction (2026-11-07, applies on top of §1-history below)

| # | Old claim (v2) | New figure/status (v3) | Why |
|---|---|---|---|
| 1 | "directed carriageway model... banned direct 6↔7" fully implemented | **Was only a 6↔7-adjacency check; the one-directional `start→end`-only constraint for VEGHLUTI 3/4/6/7 was never coded.** v3 replaces the greedy walker entirely with a directed-instance graph (each one-directional piece contributes exactly one traversable direction) + Dijkstra shortest path — see `rules-addendum-v3.md`. | The v2 counterclockwise search still used pieces 1477 (VEGHLUTI 6) and 54723 (VEGHLUTI 7) in their banned/backwards orientation; this was not caught by the 6↔7-adjacency check alone (Y1). |
| 2 | AKUREYRI node: `access_node_idferill=2940`, `access_node_end=start` | **`access_node_end=end`** — native (540259.2615, 577843.7582) | `start` of 2940 is 4.96 km (4747 m straight-line) short of C; C is specifically the END of 2940 (Y2). |
| 3 | Bridge counts: Hella "2 bridged, highest 34.75"; long-to-C "7 bridged ≥25m"; short "16, highest 41.45 — #491's own count" | **Computed by the script from the actual path, not hand-typed: Hella 4 nonzero (1×≤5m + 3×≤100m, highest 42.30 m); long-to-C 6 nonzero (1×≤5m + 5×≤100m, highest 42.30 m); short 16 nonzero to Borgarnes alone (highest 41.45 m) / 18 nonzero including the Borgarnes roundabout's own two measured seams (highest 42.84 m)** | The v2 numbers were written by hand while drafting, not computed from `chain-walks-v2.json`'s own data (Y3). |
| 4 | "Ring total... within 0.1 km of Jonesy's own ≈1308.7 km target" (treated as confirmation) | **1308.7937 km relabeled as a prior SUM of two separately-sourced legs (JSON-basis short + canonical-basis long), not an independently-verified closed loop.** The clockwise Borgarnes→Rauðavatn leg is `NOT_RUN` this round (out of scope). The "other way around" estimate is corrected to **≈1263.05 km** (1308.7937 − 45.7404, using the Rauðavatn–Selfoss distance INCLUDING piece 1436, since the other way around the ring does not pass through 1436 at all) | Comparing a computed figure against a number that appeared in the prompt's own text is not independent confirmation; the old ≈1265.6 km subtracted the wrong (excl.-1436) Selfoss figure (Y4). |
| 5 | `national_inventory_v2.py` imported `hashlib` and described writing a hash table, but never actually wrote one; `HASHES.sha256` lacked size/line-ending columns | **`national_inventory_v3.py` is not responsible for the hash table at all this round — a separate, explicit hash-generation step runs LAST** (after this file and `place-inventory.csv` reached their final v3 form), writing `HASHES-v3.json`/`.sha256` with path+SHA-256+size+line-ending columns, independently verified via `sha256sum -c` | The v2 script's own header/import overstated what its code actually did (Y5). |
| 6 | MOSFELLSBAER: `ON_RING_NAME_MATCH_INFERRED` at piece 9923 ("Vesturlandsvegur") | **`NODE_UNDETERMINED`** | "Vesturlandsvegur" is not an exact name match for "Mosfellsbær" under this round's own exact-standalone-name rule; no coordinate from memory is used as a substitute source (Y6). |

Four more v3 fixes are mechanical: the v2 `entered_at`/START/END wording
confusion is moot in v3 (each step now carries an unambiguous `fwd`/`rev`
direction field instead); the closure test is redefined at the **route
level** (§6) rather than as a graph/walker experiment, because the ring
is a cycle and removing edges from it never disconnects the graph
regardless of which two pieces are chosen — a limitation the v2 test
itself had already been corrected once for, and which needed a different
fix again (testing route-membership of a fixed, already-computed
shortest path, not a second graph search); and the comment misnaming
piece 2024's own IDBUTUR (which appeared in v2's code, not reused in v3)
is noted here rather than edited into the preserved v2 file.

## 1-history. Dated retraction table — v2 correction (2026-11-06, superseded in part by §1 above — e.g. row 1/2/5 figures below are themselves further corrected)

| # | Old claim (v1) | New figure/status (v2) | Why |
|---|---|---|---|
| 1 | "Rauðavatn–Akureyri SHORTER ≈308.66 km (to C)" | **Rauðavatn–C (short) ≈379.23 km haversine (70.5664+308.6626, CC-attributed) / ≈380.43 km planar (70.78+309.65077, CC-attributed)** | 308.66 km was Borgarnes→C, not Rauðavatn→C — missing the 70.78/70.5664 km Rauðavatn→Borgarnes leg entirely (U1). |
| 2 | "Rauðavatn–Akureyri LONGER ≈922.44/930.76 km" | **Rauðavatn–C (long) ≈925.80 km excl. piece 1436, ≈928.36 km incl. it (this round's own corrected walk, planar, truncated AT C)** | 922.44 km never counted piece 1436 (2.560 km) at all; 930.76 km was 4.96 km PAST C (piece 2940's own far end, not the C seam itself) (U1/U4). |
| 3 | "the ring closes within 2.75 km" (near Kjalarnes) | **RETRACTED — this was a walker defect (a 49282→49281 direct 6/7-carriageway jump), not a data gap.** Ring closure in that area is answered instead by citing #491's own already-closed chain (16 bridged seams, highest 41.45 m, all `CONTINUOUS_WITH_BRIDGES`). | v1's mechanical walker took a wrong-direction carriageway switch and then genuinely got stuck 2.86 km further on — that stuck point was never a real discontinuity (U2). |
| 4 | Every example route labeled `VERIFIED-continuous` | **`CONTINUOUS_EXACT` (every seam 0 m) or `CONTINUOUS_WITH_BRIDGES (n bridged, highest m m)`, direction `INFERRED`** (VEGHLUTI=1/5/8) or verified-by-role (3/4/6/7) | `VERIFIED` is reserved for a single measurement (e.g. exact contact), never for a whole route — a route with ANY bridged seam or inferred-direction piece was never "verified continuous" (U3). |
| 5 | "Selfoss ≈41.2–43.2 km" / "Hella ≈79.2–92.1 km" (ranges) | **Selfoss: single point, end of piece 2138, ≈43.18 km. Hella: single point, end of piece 3591, ≈79.21 km.** | These were never "near-duplicate pieces" — they were ordered steps in one walk; the "92.1 km" end was Hvolsvöllur, not Hella (U4). |
| 6 | `place-inventory.csv` status `ON_RING_ACCESS_CONFIRMED` from a name search alone | **`ON_RING_NAME_MATCH_INFERRED` / `NODE_UNDETERMINED`** | A name match in `STUTTNAFNLEIDAR`/`STADARLYSING` is INFERRED (rules.md E3a), never "confirmed" (U5). |
| 7 | HVOLSVOLLUR node = piece 3638 | **Piece 3593 (the LAST 'Hvolsvöllur-Hella'-named piece, not the first)** | 3638 is ≈8 km from the town (U5). |
| 8 | HVERAGERDI node = piece 2135; HOFN node = piece 3222 | **Both `NODE_UNDETERMINED`** | 2135 ends Selfoss-side, not in Hveragerði; 3222 is literally Almannaskarðsgöng, a tunnel, not Höfn (U5). |
| 9 | "closure without auto-detour, demonstrated by construction" (not run) | **Actually run this round** (§6) — directed greedy walk with IDBUTUR 252090037+902020037 removed; stops at piece 22725 (Þrengslavegur ramp), never reaches Selfoss-Hveragerði | v1 asserted this without running it; a plain graph-connectivity check (which WOULD wrongly "succeed" on a closed ring) is not the same test (U6). |
| 10 | "zero Seyðisfjörður name matches" | **Zero VEGNR=93 pieces (unchanged finding); one STADARLYSING text does mention 'Seyðisfjarðarvegi' (piece 2345, naming the junction, not a road-93 piece)** | Imprecise wording (Z2); the BLOCKED outcome itself is unchanged. |
| 11 | "independently reproduces Jonesy's own numbers" (feature/VEGHLUTI counts) | **Reworded: reproduces the same OUTPUT because both this round and Jonesy used the same "most vertices" canonical-instance rule — this does not by itself demonstrate insensitivity to that choice** | The original claim overstated what matching outputs under the SAME rule can prove (U7e). |

Four more corrections are mechanical, not numeric: output files are now
written as UTF-8 with `\n` line endings (the v1 `national_inventory-
output.txt` was previously cp1252/CRLF — regenerated, see §7's hash
table); `chain-walks-v2.json` carries an explicit `band` field per seam;
`evidence.md`'s own old §2b START/END wording (which had the two walks'
own `entered_at` values backwards) is corrected in §3 below; and
`place-inventory.csv`'s own internal cross-reference now points at this
file's real section numbers.

## 2. Method

`rules.md`, `rules-addendum-v2.md`, and `rules-addendum-v3.md`'s own
directed-instance graph model are **unchanged** by this v4 correction
(confirmed by SHA-256, §7). The new `rules-addendum-v4.md`, written and
committed to disk **before** `national_inventory_v4.py` was run, adds
three things v3's own addendum only described in prose: (a) a single
comparable **lexicographic signature** — `(cost bucketed to 1e-6 m,
piece_count, idferill_tuple, orientation_tuple)` — used as both the
Dijkstra priority-queue key and the relaxation comparison, replacing a
bare `nd < dist_to[nxt]` scalar check; (b) the corrected identity of the
single nationwide VEGHLUTI=8 instance (piece **36487**, not 1735, which
is VEGHLUTI=1 — asserted from `road-links.csv` this round); (c) the
precise Selfoss closure target, `(2138, "rev")`. VEGHLUTI 1 remains
bidirectional; VEGHLUTI 3/4/6/7/8 are one-directional `start→end` only
(role 8 now correctly identified and, per Ripley's decision, treated
one-directionally like the documented roles — matching v3's own ORIGINAL
W1 instruction, not the mistaken bidirectional treatment v3 mistakenly
applied to the wrong piece); VEGHLUTI 5 is a zero-length pass-through.
`samples/road-links.csv` (249 canonical pieces) is **unchanged**, reused
byte-for-byte from v1/v2/v3.

## 3. The corrected walks (Dijkstra with a real validator, not a greedy walker)

**Validation, before any output file is written (T1/Q2):** one
`validate_route()` function — raises on (i) any VEGHLUTI 3/4/6/7/8 step
traversed `rev`, (ii) an adjacent 6/7 pair or the named 49282→49281
U-turn, (iii) a repeated IDFERILL in the same path (the search's own
graph allows a bidirectional piece's `fwd` and `rev` instances to both
appear in an unconstrained shortest path to a mis-targeted node — found
in sandbox testing: the shortest path to the WRONG Selfoss target,
`(2138,"fwd")`, revisits piece 2138 via a 2138→8676→2138 detour, 47.81 km
— a real defect class, not hypothetical, which is exactly why T4/Q3's
own fix to the RIGHT target, `(2138,"rev")`, matters). This same
function is run on **four constructed negative cases** — a synthetic
54723/1477 `rev` pair, a synthetic adjacent 6/7 pair, the literal
49282→49281 U-turn, and a synthetic repeated piece — each confirmed
**rejected** (raises `RouteInvalid`) before the real paths are even
checked, so the validator's own ability to fail is demonstrated, not
just its ability to pass. All four reference assertions (29-IDFERILL
ccw order, 13-IDBUTUR cw order, the C/Selfoss target coordinates, and the
W3 bridge counts) are checked the same way: any failure prints
`BLOCKED_WITH_EXACT_GAPS` with the exact mismatch and writes **no**
output file at all.

**Counterclockwise (short way), Dijkstra from the END of piece 1436 to
the exit of piece 2819:** reproduces the **exact** 29-IDFERILL order of
the #491 reference chain (`derivation-29-pieces.md`) — as the search's
own genuine output under the Q1 lexicographic tie-break, asserted
against the cited reference, never hardcoded as the answer. The search
explicitly avoids the zero-cost roundabout detours at pieces 2791 and
49284 (confirmed in the output: `ccw_chose_direct_2796_10247_not_via_
2791: true`), because "fewest pieces" now genuinely decides between
equal-cost alternatives — 22 tie-break events were logged and resolved
during this one search. Zero negative-invariant violations. Total cost
**70,846.57 m = 70.8466 km** (canonical road-links.csv basis — identical
to v3's own figure; see §5 for why this differs slightly from #491's own
JSON-stated 70.78 km).

**Clockwise (long way), Dijkstra from the END of piece 1436 (the SAME
anchor point as the short route — #491's own `start_raudavatn.native_
3057_end` convention), traversing piece 1436 itself in reverse as the
first step:** reproduces the #483 13-IDBUTUR Rauðavatn→Vík reference
**exactly** for its own first 13 named sections, continues through Höfn
(Almannaskarðsgöng), Egilsstaðir, Mývatn, Vaðlaheiðargöng, and reaches
the exact C seam (piece 3876's own START, entered via its `rev` instance
from the east — confirmed identical to the native coordinate
`akureyri-endpoint-decision.md` itself names for C). Zero negative-
invariant violations, asserted over the full sequence. **A plain
unrestricted shortest-path search to this same target would simply
return the SHORT route** (it genuinely is shorter) — this is not a
defect; the long route is a specific, named alternative, found by
excluding every piece on the #491 reference chain from the graph before
searching, forcing the search onto the other side of the ring. This
exclusion is stated in the code before the result was seen, not chosen
after the fact — and is itself a named limitation, not a fresh
discovery of the ring's other half: this search's own result is
conditioned on the #491 reference chain as an INPUT exclusion, not an
independent finding that the long route avoids it (T2/Q7 scope note).
10 tie-break events were logged and resolved during this search.

- Total cost **excluding** piece 1436 itself: **925,802.81 m = 925.8028
  km** (planar, canonical basis).
- Total cost **including** piece 1436 (2,560.15 m): **928,362.95 m =
  928.3630 km** (planar, canonical basis).
- These figures are identical, to 4 decimal places, to v1/v2's own
  independently-derived greedy-walker figures (925.8028/928.3630 km) —
  two different algorithms (greedy nearest-unused-endpoint vs. Dijkstra
  shortest path), same canonical data, same answer. This is read as a
  genuine cross-check, not as proof the greedy walker was correct in
  general (it demonstrably was not, elsewhere — see §1).

Each step carries an explicit `fwd`/`rev` direction field. Full step
sequences, the tie-break event logs, and the real validation results are
in `samples/chain-walks-v4.json` (not hand-edited after running; v3's
own `chain-walks-v3.json`, and v2's own `chain-walks-v2.json`, are both
preserved unchanged as retained evidence of what each round actually
contained); the run transcript is `samples/national_inventory_v4-
output.txt`.

## 4. Required example routes (item 4), corrected figures

| Example | Status | Length | Basis | Notes |
|---|---|---|---|---|
| Rauðavatn–Selfoss | `CONTINUOUS_WITH_BRIDGES` (1 bridged, 34.75 m) · direction INFERRED (VEGHLUTI 1) | **≈43.18 km** (single point: end of piece 2138) | planar, excl. 1436 | Unchanged figure; independently reproduced by the v3 Dijkstra search. |
| Rauðavatn–Hella | `CONTINUOUS_WITH_BRIDGES` (**4 bridged: 1×≤5m + 3×≤100m, highest 42.30 m** — computed from the actual path, not hand-typed) · direction INFERRED | **≈79.21 km** (single point: end of piece 3591) | planar, excl. 1436 | **[v3 correction]** v2 said "2 bridged, highest 34.75 m" by hand; the real count is 4, highest 42.30 m. |
| Rauðavatn–C, SHORTER (via Borgarnes) | `CONTINUOUS_WITH_BRIDGES` (**16 bridged to Borgarnes/2819 alone, highest 41.4532 m — this round's own Dijkstra search, matching #491's own count exactly; 18 bridged including the Borgarnes roundabout's own two measured seams — read unrounded from north-data's own JSON this round, 1.77043 m and 42.84089 m — highest 42.84089 m**) · direction INFERRED | **≈379.23 km haversine** (70.5664+308.6626, CC-attributed) / **≈380.43 km planar** (70.78+309.65077, CC-attributed) / this round's own canonical-copy recomputation of the Rauðavatn→Borgarnes leg alone gives 70.8466 km (0.0666 km more) — see §5 | both bases given, see §5 | The #491 29-piece ORDER is now independently reproduced by genuine search under the Q1 tie-break (§3); the Borgarnes→C stretch itself is still cited, with its own canonical-basis comparison now also computed (§5), not re-walked this round. |
| Rauðavatn–C, LONGER (via Selfoss/Vík/Höfn/Egilsstaðir/Mývatn) | `CONTINUOUS_WITH_BRIDGES` (**6 bridged to C: 1×≤5m + 5×≤100m, highest 42.30 m** — computed from the actual path) · direction INFERRED, this round's own fresh, assertion-checked Dijkstra search | **≈925.80 km excl. 1436 / ≈928.36 km incl. 1436** | planar; no WGS84 coverage exists for this stretch (Vík–Mývatn) — reported as "not available," not estimated | **[v3 correction]** v2 said "7 bridged ≥25m" by hand; the real count is 6 (1 of which is ≤5m). Independently reaches C from the EAST, matching v1/v2's own greedy-walker figure to 4 decimal places (§3). |
| Reversal (C→Rauðavatn, longer way) | same ordered legs, reversed | same length | — | VEGHLUTI=1 direction grade is INFERRED both ways; VEGHLUTI 3/4/6/7 pieces are now HARD one-directional in the graph itself — a reversed route would need its own, separately-run search (not attempted this round; the claim is about direction-grade stability, not a second search). |
| Same From/To (e.g. Selfoss→Selfoss) | degenerate, zero-leg case | 0 km | — | Not run through the search; the product must special-case this directly. |
| Unconfirmed connection (Rauðavatn↔Hádegismóa/Norðlingavað stub) | `BLOCKED` | n/a | — | Superseded by §3's own success: the short route via this exact junction is now a verified SUCCESS (the #491 chain begins here, through the roundabout, correctly). The stub example is retracted — there is no remaining "unconfirmed connection" demonstration at Hádegismóa this round; see §8. |
| Closure without auto-detour (Rauðavatn→Selfoss, IDBUTUR 252090037+902020037) | **Run this round, route-level** (§6) — `CLOSED` | n/a | — | **[v4 correction]** The "Rauðavatn→Selfoss" route is now the NAMED instance `(2138, "rev")` (exit = piece 2138's own stored START, 401739.850/383119.047), not an unfiltered `next()` match — v3's own code had actually targeted a DIFFERENT, 54.06 km point despite the prose describing ≈43-45 km. |
| Egilsstaðir–Seyðisfjörður (road 93) | `BLOCKED — needs phase 2` | n/a | — | Unchanged finding (0 VEGNR=93 pieces). |

## 5. Planar vs haversine, and length basis (E6/Z3)

**Short route (Rauðavatn→Borgarnes/2819), TWO distinct length bases, now
both actually computed, not merely asserted:**

| Basis | Length | Source |
|---|---|---|
| JSON-stated (#491's own retained figures) | 70.78 km planar / 70.5664 km haversine | `route-data-candidate.json`'s own `total_route_length_km_planar_isn93_tier0` and `derivation-29-pieces.md`'s own P4 |
| This round's own canonical-copy Dijkstra (road-links.csv, E2d selection) | **70.8466 km** planar | `samples/chain-walks-v3.json`, this round's own search |

Difference: **0.0666 km**, same gaps (the inter-piece distances are
identical in both models, since they come from the same endpoint
coordinates), different PIECE-LENGTH basis — #491's own JSON evidently
used a slightly different per-piece vertex digitization than this
round's own "most vertices" canonical-instance rule (E2d). This is the
expected, bounded kind of deviation E2d's own choice can introduce
(consistent with Jonesy's own N4 instruction to compare, not assume
insensitivity) — not an error in either figure.

Short route to C (adding the cited Borgarnes→C leg, still CC-attributed,
not re-walked this round): **≈380.43 km planar** (70.78+309.65077) /
**≈379.23 km haversine** (70.5664+308.6626) — difference 1.20 km
(**0.32%**), consistent with a projected-CRS (ISN93) planar sum running
slightly longer than the true-curvature haversine sum over this
distance.

**North-data leg (Borgarnes/2819→C), TWO distinct length bases, now also
both actually computed (T5/Q5) — the same comparison §5 already did for
the Rauðavatn→Borgarnes leg, extended to this leg too:**

| Basis | Length | Method |
|---|---|---|
| JSON-stated (north-data's own retained figure) | 309.6507 km | `route-data-candidate.json`'s own stated total for this stretch |
| This round's own canonical-copy basis | **309.8270 km** | Every piece in north-data's own chain strictly after 2819 through 2940 (excluding the ring 30401), summed from `road-links.csv` (309.7824 km) + the same two Q4 seam gaps (0.0446 km) |

Difference: **0.1763 km** — the same kind of bounded, explained
deviation as the Rauðavatn→Borgarnes leg's own 0.0666 km (different
per-piece vertex digitization, not an error in either source).

**Long route:** no WGS84 coverage exists for its own Vík–Mývatn stretch
(no prior round fetched it, and 0 exchanges were made this or any prior
round of this task) — its haversine figure is reported as **"not
available,"** not estimated by a planar×ratio. There is also no separate
"JSON-stated" figure to compare against (no prior round had ever
computed this stretch before this task's own v1); this round's own
canonical-basis value (925.8028/928.3630 km) is corroborated instead by
v1/v2's own independently-run greedy walker landing on the identical
figure to 4 decimal places (§3) — two different algorithms, one number.

**Ring total — relabeled, per W4(b): a SUM of two separately-sourced
legs, not an independently-verified closed loop. Reported on BOTH bases
(T5/Q5), side by side, neither replacing the other:**

```
Mixed basis (short = JSON+CC-attributed, long = this round's canonical search):
  380.43077 km (short)  +  928.3630 km (long, incl. 1436)  =  1308.7937 km

Fully canonical basis (both legs from road-links.csv + this round's own search):
  70.8466 km (Rauðavatn->Borgarnes) + 309.8270 km (Borgarnes->C) + 928.3630 km (long, incl. 1436)
  = 380.6736 km (short, canonical) + 928.3630 km (long)
  = 1309.0366 km
```

Neither figure is a claim that the clockwise Borgarnes→Rauðavatn leg was
independently walked and found to close within some tolerance — that
leg is **`NOT_RUN`** this round (out of the approved scope — see §8).
Both are retained only as the input to the "other way around" estimates
immediately below, not as evidence the ring is independently confirmed
closed.

**"Other way around" estimates (X4ii/Y4), on BOTH bases:** the direct
Rauðavatn→Selfoss distance, **including** piece 1436 (since the OTHER
way around the ring does not pass through 1436 at all, so it must be
added back to make the two quantities comparable) is **43.1803 +
2.5601 = 45.7404 km** on either basis (this leg's own figure doesn't
change between the two ring totals above). Subtracting:

```
Mixed basis:     1308.7937 km - 45.7404 km = 1263.0533 km
Canonical basis: 1309.0366 km - 45.7404 km = 1263.2962 km
```

— both **estimates, INFERRED**, not computed/walked routes (the
clockwise Borgarnes→Rauðavatn leg itself is `NOT_RUN`, as stated above).
The ≈0.24 km (0.02%) difference between the two is exactly the north-
data leg's own basis difference (§5 above) propagating through; neither
figure is "more correct" than the other, they're simply on different,
now both clearly labeled, bases.

**Seam-accounting assertions (X1e), confirmed directly from the retained
JSON fields, not re-derived:** `route-data-candidate.json`'s own P4
(70.5664 km) is the exit of piece 2819; `north-data`'s own `route-data-
candidate.json` field `north_only_length_km_haversine_wgs84_excl_piece_
2819_and_ring` (316.7123 km) is named EXACTLY to state that it excludes
piece 2819 (already counted in P4) and the ring 30401 (not a driven
through-piece), while INCLUDING the two pre-registered roundabout bridges
(1.7704 m, 42.8409 m) exactly once. No piece or gap is counted twice
between the two cited figures.

## 6. Closure test (X4/Z4), route-level, actually run

The ring is a cycle: removing any two pieces' worth of edges from either
an undirected graph (v1's own attempt) OR a directed one (if re-searched
for an alternate path) never disconnects it — a detour always exists
somewhere in the data, which the real product never offers (it has no
auto-detour feature). **Neither "is the graph still connected" nor "does
a walker/search still find SOME path" is the right test.** The actual
test, per `rules-addendum-v3.md`'s own Z4 definition, is at the
**route level**:

1. Compute the Rauðavatn→Selfoss shortest path ONCE, unrestricted,
   targeting the NAMED instance `(2138, "rev")` — piece 2138's own
   stored START coordinate, (401739.850, 383119.047) — **not** an
   unfiltered `next()` over any instance matching IDBUTUR 902030037,
   which v3's own code actually used and which lands on a different,
   54.06 km point (T4/Q3, caught this round). The resulting route is
   `[1436, 1735, 2071, 2024, 2117, 2135, 2138]`, cost 45,740.46 m incl.
   piece 1436, whose own piece list's IDBUTUR set is `{252090037,
   253020037, 902030037, 903010037, 1410010037}`.
2. A route is **CLOSED** with respect to a given closure set if ANY
   piece on that fixed, already-computed path has an IDBUTUR in the
   closure set — a membership check, not a new search.
3. With closure set `{252090037, 902020037}` (Hellisheiði, both
   carriageway members): **CLOSED = True**, since `252090037` is in the
   route's own IDBUTUR set.
4. **Non-vacuity check:** the identical membership check, run with an
   unrelated closure set (`{810040037}`, a Mývatn-area IDBUTUR nowhere
   near this route), returns **CLOSED = False** — confirming the test
   can return a negative result, not just always "closed" regardless of
   input.
5. **"Other way around" estimates (X4ii/Y4/Q5), explicitly estimates,
   not a search — both bases, see §5:** **≈1263.05 km mixed-basis /
   ≈1263.30 km canonical-basis**, not v2's own ≈1265.6 km (which mixed a
   Selfoss distance excluding piece 1436 against a ring total that
   included it).

v1's own un-run "demonstrated by construction" claim, v2's own
graph-connectivity-based closure test (which could not actually
distinguish "closed" from "open" on this cyclic graph, per Y-round's own
finding), and v3's own imprecisely-`next()`-selected Selfoss target (a
different, 54.06 km point, per T4/Q3) are all retracted with this date;
`rules-addendum-v3.md`'s own route-level definition itself remains
correct and unchanged — only the target instance it was applied to is
fixed here.

## 7. Delivery hygiene (X5/W5/Z5/Q6)

**Hash table**, generated by a dedicated script (`samples/generate_
hashes_v4.py`) run LAST — after this file and `place-inventory.csv`
reached their final v4 form — from the final bytes on disk, with path +
SHA-256 + size (bytes) + line-ending columns, independently cross-checked
via `sha256sum -c`. See `samples/HASHES-v4.json`/`samples/HASHES-v4.sha256`
(machine-readable) and the table in `cc-report.md`'s own v4 addendum
(human-readable). This table does not list its own hash, and does not
overwrite v2's own `HASHES.sha256` or v3's own `HASHES-v3.*` (each
preserved as a dated snapshot of that round's own state, not a current
confirmation of files later rounds changed — per Q6, `sha256sum -c
HASHES-v3.sha256` is now EXPECTED to fail specifically for `evidence.md`
and `cc-report.md`, which this v4 round further edited; that failure is
the expected, documented consequence of a dated snapshot, not a defect).

**Preserved unchanged, not overwritten (Z5a/Q6):** `samples/national_
inventory_v2.py`/`chain-walks-v2.json`/output, `samples/national_
inventory_v3.py`/`chain-walks-v3.json`/`bridge-summary-v3.json`/output,
`rules-addendum-v3.md`, `samples/HASHES-v3.*` — retained evidence of each
round's own actual state, confirmed by SHA-256 before/after this round.
**Confirmed unchanged, same SHA-256 as before this round:** `rules.md`,
`rules-addendum-v2.md`, `approved-prompt-v1.md`, `approved-prompt-v2.md`,
`prompt-review.md`, `correction-prompt-review.md`,
`docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json` (`305f60d6…`),
`docs/ai/tasks/ticket-493-north-data/route-data-candidate.json`
(`094fb5d3…`, now also read PROGRAMMATICALLY this round for the Q4
seam gaps, not just hash-confirmed), and the other cited `#483`/`#491`
source files. **New this round,** all UTF-8 + `\n`:
`rules-addendum-v4.md`, `samples/national_inventory_v4.py`,
`samples/chain-walks-v4.json`, `samples/bridge-summary-v4.json`,
`samples/national_inventory_v4-output.txt`, `samples/generate_hashes_
v4.py`, `samples/HASHES-v4.json`/`.sha256`, `evidence.md`, `cc-report.md`.
`samples/road-links.csv` and `place-inventory.csv` are unchanged, reused
byte-for-byte from v1/v2/v3 (no inventory change proved necessary this
round, per Q6's own "only if a change proves necessary" scope).

## 8. What this round did NOT do

- No network exchange of any kind (0 of the 12-exchange ceiling used,
  across all rounds of this task).
- No Hagstofa population data — the full settlement selection and its
  population brackets are not resolved.
- No VEGNR=93 geometry — Egilsstaðir–Seyðisfjörður is BLOCKED, as before.
- **The clockwise Borgarnes→Rauðavatn leg (closing the ring the "short"
  way back) is `NOT_RUN`** this round — out of the approved scope (item
  4/W4's own option (b)). The "ring total" (§5) is a sum, not an
  independently-verified closure.
- **No fresh "unconfirmed connection" example** — the Hádegismóa roundabout/
  stub framing used in v1/v2 turns out to never have been part of the
  real #491 route at all (the genuine Dijkstra search goes directly
  1436→1477, bypassing the roundabout entirely); item 4's own
  "unconfirmed connection" requirement does not have a replacement
  example in this round's own output. This is named as an open item, not
  papered over with an invented scenario.
- No continuation of the corrected clockwise search PAST C into the
  Öxnadalsheiði/Varmahlíð/Blönduós/Holtavörðuheiði/Borgarnes/Kjalarnes
  stretch beyond what's needed to confirm C itself — the FULL ring
  closure question (§6/§5) remains an estimate, not a walked result.
- `HVERAGERDI`, `HOFN`, `KIRKJUBAEJARKLAUSTUR`, `DJUPIVOGUR`,
  `BREIDDALSVIK`, `STODVARFJORDUR`, `FELLABAER`, `VARMAHLID`, `BLONDUOS`,
  and now also `MOSFELLSBAER` are `NODE_UNDETERMINED` this round — not
  resolved, not guessed.
- No app/UI/API/commit/push — out of scope per item 6.
- **This round's own tie-break event counter (22 ccw / 10 cw, logged
  whenever a competing equal-or-better signature arrived at a node) is
  NOT the same metric as Jonesy's own cited "9 equally-optimal node-paths,
  4 distinct IDFERILL sequences" — the two counts measure related but
  different things (search-time relaxation events vs. a post-hoc
  enumeration of distinct optimal paths); this round reports its own
  metric honestly rather than forcing a match to the cited number.**
- Production NOT_TESTED.

## 9. Gaps named for phase 2 (X6)

VEGNR=93 geometry (Egilsstaðir–Seyðisfjörður); the Hagstofa population
table; WGS84 coverage for the Vík–Mývatn stretch (needed only for
length-reporting consistency, not for continuity); settlement
coordinates for every `NODE_UNDETERMINED` row in `place-inventory.csv`
(ten towns, listed in §8); Reykjavík's own city-core connection (not a
VEGNR=1 absence this round can resolve); the clockwise Borgarnes→
Rauðavatn leg, if a fully independent ring-closure confirmation is ever
wanted. No frozen phase-2 plan is written here — Ripley/a short Jonesy
review confirms what fetch is actually necessary, per E1's own stop
point, unchanged from v1/v2.
