# #493 place-network — Rules addendum v2

2026-11-06, CC. **This is a correction after Jonesy's result review
(round 1), not an original pre-registration.** `rules.md` is unchanged by
this addendum (its E2a-d/E3 rules still apply); this file adds the
direction model and branch-selection rule that v1's own mechanical walker
lacked, and which caused the wrong-direction 6<->7 jump near Kjalarnes
(U2) and the resulting false "2.75 km ring-closure gap." Written and
committed to disk **before** `national_inventory_v2.py` is run.

## E2b′ — directed carriageway model (supersedes v1's informal VEGHLUTI
preference order, which was not pre-registered and caused U2)

- **VEGHLUTI 6, 7, 3, 4, 8**: one-directional, `start → end` only,
  direction grade **INFERRED** (role-documented for 6/7/3/4 per
  `research-report.md`; 8 remains undocumented, grade INFERRED by the
  same majority-pattern reasoning as VEGHLUTI=1, named explicitly where
  it occurs).
- **VEGHLUTI 1**: bidirectional, grade **INFERRED** (one mapped line
  serving both directions — unchanged from `rules.md` E2b).
- **VEGHLUTI 5** (roundabout): pass-through, not counted as a "driven"
  directional edge; its own length is still recorded but is not treated
  as advancing in a fixed direction.
- **Banned direct transition:** a walk step may never go directly from a
  VEGHLUTI=6 piece to a VEGHLUTI=7 piece, or from 7 to 6, in consecutive
  steps — this is a carriageway switch (crossing from one direction's own
  line to the opposite direction's own line), not a direction of travel.
  If, at some step, the ONLY candidate within the gap threshold is the
  banned-direction twin, the walker takes it as a **forced exception**,
  logs it explicitly (`forced_direction_switch: true` in the step record),
  and this is reported as a defect to investigate — never silently
  allowed as if it were a normal continuation.

## Branch-selection rule (alternate pieces, e.g. Hvalfjarðargöng)

Where more than one candidate piece sits within the gap threshold and one
of them is a **documented alternate/duplicate** already identified in a
prior, already-PASSed round, the alternate is excluded unless it is the
only remaining option. This round's one known instance: IDFERILL 2982
("Hvalfjarðargöng til suðurs", IDBUTUR 814700037) is excluded in favor of
its sibling sequence (3023/56002/3796, IDBUTUR 904690037), per the
already-established #491 chain (`derivation-29-pieces.md`), which uses the
latter and never the former. Any further such alternate discovered this
round is handled by the same rule: excluded-unless-only-option, named
explicitly, not silently dropped or silently preferred.

## Positive/negative test obligations (X2b/c), fixed before running

- **Positive (clockwise):** the corrected walk from the START of piece
  1436 (Rauðavatn) must reproduce the #483 13-IDBUTUR Rauðavatn→Vík
  reference in the same order (collapsed to IDBUTUR, since #483's own
  reference is at IDBUTUR granularity), and must continue to reach piece
  3876 (C's own paired piece, per `akureyri-endpoint-decision.md`). The
  walk is truncated at 3876 — it is NOT continued further into the
  Kjalarnes/Borgarnes stretch this round (that stretch is where v1's own
  bug was found; fixing the generic walker for the ENTIRE remaining
  network is out of this correction's scope, per Ripley's own scoping of
  this round to "offline afleiðsla og rannsóknarskjöl").
- **Positive (counterclockwise):** the corrected walk from the END of
  piece 1436 must reproduce the #491 29-piece reference chain
  (`derivation-29-pieces.md`) in the same IDFERILL order. **If it does
  not**, the exact divergence point is reported, and the short route's
  own figures are taken from the #491 citation directly (Ripley's own
  sanctioned fallback, `approved-prompt-v2.md` §"Samræming Ripley"/X2b) —
  never a silent substitution.
- **Negative:** no step sequence produced this round (clockwise or
  counterclockwise) may contain an adjacent VEGHLUTI 6/7 pair, nor the
  specific step 49282→49281 — checked by assertion over every produced
  sequence, not by inspection alone.

## Scope note

This addendum does not re-open or change `rules.md`'s own E2a (contact
bands), E2c (tunnel handling), E2d (canonical-instance selection), or E3
(settlement-coordinate origin) — those stand as originally registered.
