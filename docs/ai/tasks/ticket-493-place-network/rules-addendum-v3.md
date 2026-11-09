# #493 place-network — Rules addendum v3

2026-11-07, CC. **This is a correction after Jonesy's result review (round
2), not an original pre-registration.** `rules.md` and `rules-addendum-
v2.md` are unchanged by this addendum. Written and committed to disk
**before** `national_inventory_v3.py` is run — per Z1, the selection rule
below is fixed now, before any result is seen; if the positive reference
tests (below) fail after this rule is applied, that is reported as
`BLOCKED_WITH_EXACT_GAPS` with the exact divergence, not a reason to
change the rule and re-run.

## Why Dijkstra, not simple greedy nearest-piece (Z1)

Jonesy's own result-review round 2 sandbox testing found that a simple
"always take the single nearest unused candidate piece" greedy walk —
even with the v2 direction/6↔7-ban rules applied — fails at a different
point than the Hádegismóa fork: it takes a wrong turn at **49926→23681**
on the counterclockwise reference walk. A locally-nearest choice is not
guaranteed to be the one the real chain actually uses whenever two
candidates sit close together at a junction with several short stub/
ramp/roundabout pieces nearby (exactly the Hádegismóa/Rauðavatn
interchange's own shape). **This round therefore replaces the greedy
walker with a directed Dijkstra shortest-path search** between fixed
endpoints, which is not vulnerable to a single local tie-break mistake —
the GLOBALLY shortest path is computed once, over the whole graph, not
chosen step-by-step.

## Directed graph model

Each canonical piece (from `road-links.csv`, E2d selection — unchanged)
contributes one or two **directed instances**, depending on its own
VEGHLUTI:

- **VEGHLUTI 1** (undivided, INFERRED bidirectional): **two** directed
  instances — forward (`entry=start, exit=end`) and reverse
  (`entry=end, exit=start`) — each costing the piece's own planar length.
- **VEGHLUTI 3, 4, 6, 7** (one-directional, role-documented per
  `research-report.md`): **one** directed instance only —
  `entry=start, exit=end` — costing the piece's own planar length. There
  is **no** reverse instance; a route may never traverse one of these
  pieces end→start. This is the rule v2 only partially enforced (it
  banned 6↔7 ADJACENCY but still allowed either end of a 6/7/3/4 piece to
  be entered, which is how the v2 counterclockwise walk still produced
  two directional violations even though no two came from DIFFERENT 6/7
  pieces back to back).
- **VEGHLUTI 8** (the single nationwide instance, idferill 1735):
  **[correction, found and fixed before this round's own result was
  reported — not carried over from an earlier mistake]** `rules.md`'s own
  original E2(b) already treats role 8 as its own distinct **UNKNOWN**
  direction case, explicitly separate from the documented one-directional
  roles (3/4/6/7) — it is "undocumented... reported as UNKNOWN... not
  silently folded into the 1 treatment." A first draft of this file
  bucketed it together with 3/4/6/7 as one-directional `start→end` only;
  running the search under that rule made the CW (long) search unable to
  find any valid onward edge out of Rauðavatn's own east exit at all
  (piece 1735's own digitized `start→end` direction runs INTO Rauðavatn,
  not out of it — forcing one-way-only there blocks the real route
  entirely, which is exactly what the first run surfaced: a `381 km`
  "long route" that was actually the SHORT route in disguise, Dijkstra
  having no other way to reach the target). **Corrected treatment:**
  UNKNOWN direction means both traversals are permitted (two instances,
  `fwd` and `rev`, like VEGHLUTI=1, each costing the piece's own length)
  — UNKNOWN is not the same claim as VERIFIED-bidirectional, but
  behaviourally it must not block a traversal we have no evidence against
  either. This affects ONLY idferill 1735, the one nationwide instance.
- **VEGHLUTI 5** (roundabout): **two** zero-length pass-through
  instances (`entry=start, exit=end` and `entry=end, exit=start`, cost
  **0**, per the already-established north-data convention that a
  roundabout's own loop length is never counted as driven distance). The
  Borgarnes roundabout (idferill 30401) additionally has its own
  specifically-measured two seam gaps already on record (see "Roundabout
  traversal state" below) — this generic pass-through rule is the
  default for every OTHER roundabout the search happens to use; no other
  roundabout's seams are separately pre-measured this round, so if the
  shortest path ever needs one, that step's own gap is measured the same
  way as any other inter-piece gap (plain endpoint distance), not
  assumed.

**Inter-piece edges:** for every pair of directed instances belonging to
DIFFERENT pieces, if the exit point of one is within 100 m (E2a) of the
entry point of the other, a directed edge exists with cost equal to that
measured gap (0 for exact contact). **Hard-banned, no exception, no
fallback:** an edge is never created between a VEGHLUTI=6 instance's exit/
entry and a VEGHLUTI=7 instance's entry/exit (in either direction) — this
is a graph-construction rule, not a step-time preference, so there is no
"forced exception" path left for the search to take (closing the exact
gap v2 left open). **Excluded unless it is the only piece left:**
idferill 2982 ("Hvalfjarðargöng til suðurs") — same rule as v2,
restated: if the search's own shortest path genuinely has no alternative
but to use 2982, that is reported explicitly, not silently substituted.

## Roundabout traversal state (Borgarnes seam, Z2)

The Borgarnes roundabout (idferill 30401) is not treated as a generic
zero-length pass-through for the purposes of the SHORT route's own bridge
accounting (though it IS zero-length for distance) — it has its own two
already-measured seam gaps on record from north-data's own retained
derivation: **2819→30401 = 1.7704 m** and **30401→2816 = 42.8409 m**.
Both are counted as their own bridged seams in the short route's own
bridge summary (W3) — this is a deliberate, two-seam traversal (enter the
roundabout, then exit it), not a single direct 2819→2816 gap. This
decision changes the short route's own total nonzero-bridge count (18
counting both roundabout seams, vs. 17 if a single direct gap were used
instead) — the actual count used in this round's own output is whichever
the chosen graph model (two measured seams, as stated here) produces,
reported and explained, not forced to match a pre-written target number.

No other roundabout the search happens to traverse gets this kind of
specific, pre-measured two-seam treatment this round — per the generic
rule above, its own entry/exit gaps are measured the same way as any
other inter-piece connection.

## Cost function and tie-break (fixed before computing)

Edge cost = the destination piece's own planar length (0 for a roundabout
pass-through instance) + the measured gap distance into it. Dijkstra from
a fixed start port to a fixed target port, standard binary-heap
implementation, no heuristic. **Tie-break:** if two paths have exactly
equal total cost, the one visiting the lower-numbered IDFERILL at the
first point of difference wins — stated once, applied uniformly, not
decided after seeing which path "looks right."

## Closure test, route-level (Z4)

The closure test does **not** remove edges from the graph and re-run a
search (removing edges from an already-closed ring graph does not
disconnect it, and even a correctly-restricted search could still find a
real detour elsewhere — which the real product never offers, since it
has no auto-detour feature at all). Instead: compute the Rauðavatn→
Selfoss shortest path ONCE, unrestricted. A route is **CLOSED** with
respect to a given closure set if any piece on that fixed, already-
computed path has an IDBUTUR in the closure set. **With** closure set
`{252090037, 902020037}` (Hellisheiði, both carriageway members): the
test must find the fixed route IS closed (since the real route uses
piece 2117, IDBUTUR 252090037). **Non-vacuity:** the identical check,
run with an unrelated closure set (any IDBUTUR not on the computed route,
e.g. a Mývatn-area one), must find the route is NOT closed — proving the
test can return a negative result, not just always "closed" regardless of
input.

## Positive reference tests (must pass via genuine search, never hardcoded)

- Dijkstra from the END of piece 1436 to the EXIT of piece 2819 must
  produce, as its own OUTPUT (not a pre-written answer the code already
  knows), the exact 29-IDFERILL order of the #491 reference chain
  (`derivation-29-pieces.md`), with piece 2982 excluded.
- Dijkstra from the START of piece 1436, continuing to the exit of piece
  3876 (C's own paired piece), must produce the #483 13-IDBUTUR Rauðavatn
  →Vík order (collapsed to IDBUTUR) for its own first 13 named sections,
  then continue to reach 3876.
- Both are checked by `assert` against the cited reference sequences
  (hardcoded as the REFERENCE to compare against, never as the
  algorithm's own answer) — if either fails, the exact point of
  divergence is reported and the result is `BLOCKED_WITH_EXACT_GAPS` for
  that specific item, per Z1's own "STOP, not a new investigation" rule.

## Scope note

This addendum does not re-open `rules.md`'s E2a/E2c/E2d or `rules-
addendum-v2.md`'s branch-exclusion rule (2982) — those stand unchanged.
It REPLACES v2's own 6↔7-adjacency-ban walker logic with the directed-
instance graph + Dijkstra described above, because v2's own ban did not
actually implement the one-directional `start→end`-only constraint for
VEGHLUTI 3/4/6/7/8 (it still allowed entering such a piece from either
end, which is how the v2 counterclockwise search still produced two
real directional violations despite the 6↔7-adjacency check passing).
