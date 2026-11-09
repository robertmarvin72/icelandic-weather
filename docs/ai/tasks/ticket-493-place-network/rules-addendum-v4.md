# #493 place-network — Rules addendum v4

2026-11-09, CC. **This is a correction after Jonesy's result review
(round 3), not an original pre-registration.** `rules.md`,
`rules-addendum-v2.md`, and `rules-addendum-v3.md` are **unchanged** by
this addendum. Written and committed to disk **before**
`national_inventory_v4.py` is run — per Q1, the tie-break rule below is
fixed now, before any result is seen.

## T3 correction (role 8 misidentified in v3) — dated, v3 text untouched

v3's own `rules-addendum-v3.md`, `evidence.md` §2, and `cc-report.md`
stated that VEGHLUTI=8 is "piece 1735, the single nationwide instance,"
and that a first draft's one-directional treatment of it had made the
long route unreachable. **This is factually wrong and retracted here,
not rewritten in the v3 files themselves.** Read directly from
`road-links.csv` and asserted in this round's own script: **piece 1735
is VEGHLUTI=1** (bidirectional, undocumented-majority-pattern role,
unaffected by this correction); **the single nationwide VEGHLUTI=8
instance is piece 36487** ("Vesturlandsvegur," 312.8675 m, near
Nesbraut–Úlfarsfellsvegur). Piece 36487 is on neither the ccw nor the cw
path, so this misidentification had **zero effect on any v3 output** —
confirmed this round by running the identical search with VEGHLUTI=8
forced one-directional and finding byte-identical `chain-walks`/
`bridge-summary`/stdout to v3's own retained files. The real cause of
v3's own first-draft bug (the long route briefly being unreachable) was
the separately-documented start-point and C-target orientation mistakes,
both already fixed in v3's final form — not role 8.

**Ripley's decision (T3):** VEGHLUTI=8 is one-directional, `start→end`
only, grade **INFERRED** — per the ORIGINAL `rules-addendum-v3.md`'s own
W1 instruction (which bucketed 8 with 3/4/6/7), not the bidirectional
treatment a mistaken v3 draft applied to the WRONG piece. This is a
deliberate choice that happens to match the original instruction, now
correctly applied to piece 36487 instead of 1735.

## Q1 — single lexicographic tie-break, implemented as a comparable signature

At equal cost, the search prefers, in order:
1. **Lowest total cost** (edge weight = destination piece's own planar
   length + measured gap), compared with an explicit epsilon of
   **1e-6 m** — two costs within 1e-6 m of each other are treated as
   tied, not as one being "less."
2. **Fewest pieces** in the path (this is what makes an optional
   zero-cost roundabout detour, e.g. piece 2791 between 2796 and 10247,
   lose to the direct contact when both are available — a CONSEQUENCE
   of this rule, not a separate roundabout-specific pre-filter).
3. **Lowest IDFERILL at the first point where two equal-cost,
   equal-length paths' own piece sequences differ.**
4. **Lowest orientation ordering** (`fwd` < `rev`, alphabetically) at
   that same first point of difference, if IDFERILL also ties.

This is implemented as one comparable **signature**:
`(round(cost / 1e-6), piece_count, idferill_tuple, orientation_tuple)`
— a plain Python tuple, compared with ordinary lexicographic `<`. The
first element buckets cost into 1e-6 m-wide bins (so costs within
epsilon of each other land in the *same* bucket and fall through to the
later tie-break fields automatically); `piece_count` is the tuple's own
length; `idferill_tuple`/`orientation_tuple` are the path's own full
sequences, compared element-by-element once `piece_count` ties. This
signature is used BOTH as the priority-queue key (so pop order is
deterministic and matches the stated rule, not dependent on arbitrary
heap insertion order) and as the relaxation comparison (a neighbor's
recorded best signature is only replaced by a strictly smaller one) —
not `nd < dist_to[nxt]` on a bare scalar, which is what v3 actually used
despite this file's own v3 predecessor describing a tie-break rule in
prose.

No separate "skip the roundabout when exact contact exists" pre-filter
is implemented — Ripley's own instruction is that this behavior is a
CONSEQUENCE of criterion 2 (fewest pieces) applied uniformly, not a
special case.

**Repeated-piece guard:** the search's own graph allows both `fwd` and
`rev` instances of a bidirectional piece to exist as separate nodes,
which means an unconstrained shortest-path search CAN construct a path
that visits the same IDFERILL twice (once each direction) if that
happens to be numerically cheapest to some target — found in sandbox
testing for a mis-targeted Selfoss search (`(2138,"fwd")` previously).
This is never a valid real route. The validator (`validate_route`, Q2)
rejects any produced path containing a repeated IDFERILL — this is
checked after the search, not prevented inside it, so that a genuine
defect is caught and reported rather than silently avoided.

## Q3 — Selfoss closure target, named precisely

The closure test's own "Rauðavatn→Selfoss" route is the specific search
result targeting **the EXIT of instance `(2138, "rev")`** — piece
2138's own `rev` instance, whose exit is piece 2138's own **stored
START** coordinate, (401739.850, 383119.047) in native ISN93. This is
NOT `(2138, "fwd")` (whose exit is 2138's own stored END, a different,
further point) and NOT "the end of piece 2138" in the loose sense
`evidence.md` v3 used (which meant "the end of the WALK," i.e. this same
`(2138,"rev")` exit point, not the piece's own stored `end` field — a
wording confusion being fixed here). Expected cost: **45,740.46 m
including piece 1436 / 43,180.3 m excluding it**. Expected route:
`[1436, 1735, 2071, 2024, 2117, 2135, 2138]`, IDBUTUR set
`{252090037, 253020037, 902030037, 903010037, 1410010037}`.

## Q4 — Borgarnes roundabout seams, read from data, not hardcoded

The two seam gaps bridging the Borgarnes roundabout (IDFERILL 30401) are
read, by IDFERILL key, from the retained
`docs/ai/tasks/ticket-493-north-data/route-data-candidate.json`'s own
`unrounded_gap_from_prev_m` field for pieces **30401** and **2816** — not
written as a rounded literal in this round's own code. The file's own
path and SHA-256 are recorded in this round's output. The total nonzero
bridge count for the short route to C is asserted to be exactly
`16 (to Borgarnes alone) + 2 (these two seams) = 18`, with piece 2819
and the ring 30401 each counted at most once across the whole
accounting (2819 is #491's own P4 endpoint; 30401 is excluded from
north-data's own route-distance total by its own `is_closed_ring_
excluded_from_route_distance` flag).

## Q5 — canonical basis for the north-data leg, method stated before computing

The canonical-basis length for the Borgarnes(2819)→C leg is: every piece
in north-data's own retained chain strictly AFTER 2819 up to AND
INCLUDING 2940, EXCLUDING the ring (30401), with each piece's own length
read from **this round's own `road-links.csv`** (the same canonical
copies used everywhere else in this task) rather than north-data's own
JSON-stated lengths, plus the same two seam gaps (Q4). This is compared
against north-data's own JSON-stated figure (309.6507 km) as a basis
comparison, not a re-verification of north-data's own prior work.

## Scope note

This addendum does not reopen `rules.md`'s E2a/E2c/E2d, `rules-
addendum-v2.md`'s branch-exclusion rule (2982), or `rules-addendum-v3.md`'s
own directed-instance graph model (VEGHLUTI 1 bidirectional, 3/4/6/7
one-directional, 5 zero-length pass-through) — those stand unchanged
except for the one named T3 correction (role 8's correct piece and its
Ripley-decided one-directional treatment) above.
