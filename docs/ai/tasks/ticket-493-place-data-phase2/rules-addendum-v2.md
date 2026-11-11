# #493 phase2 — Rules addendum v2

2026-11-09, CC. **Correction after Jonesy's result review round 1
(S1-S8/K1-K8), not an original pre-registration.** `pre-sample-plan.md`
is unchanged (no new network exchange this round — this file corrects
PROCESSING of already-retained data). Written and committed to disk
BEFORE `samples/build_phase2_v2.py` is run.

## K1/S1 — road-condition footprint, IdButur normalization

Replicates `api/_lib/winterRoute/roadFetch.js`'s own `normalizeIdButur`
exactly (read this round, not assumed): a number is kept if
`Number.isInteger`; a non-empty string is converted via `Number(...)`
and kept only if the result is integral; anything else (null,
non-integral, empty) is `None`. Python equivalent, with an assertion
that the two target IDBUTUR (`911040037`, `911170037`) survive this
normalization from BOTH retained `legacy-faerd-*.json` samples'
`IdButur` field (stored as a float, e.g. `506070037.0`, in the raw
JSON) before any lookup is attempted.

Sources (SHA-256 verified against `approved-prompt-v2.md`'s own
citations, confirmed this round): `ticket-483/samples/legacy-faerd-
fresh.json` (2026-10-28), `ticket-485/samples/legacy-faerd-https.json`
(2026-11-02), `ticket-483/samples/legacy-faerdpunktar.json`,
`ticket-485/samples/legacy-faerdpunktar-https.json`.

Age reference: a FIXED UTC instant, `2026-11-09T00:00:00Z` — not
`now()` at script-run time — stated here as a research reference point,
not a live "as of today" claim.

"Notices tied to this key" means: the key appears at least once in a
`faerdpunktar*` sample's own `IdButur` field (after normalization). If
it appears zero times, the footprint explicitly records **No**, not
silence or an omitted row.

## K2/S2/S2b/S6 — Hagstofa row classification and year rule

**Row classification** (deterministic, from the data's own shape, not
chosen per-row): `TOTAL` if `code == "0"`; `RURAL_AGGREGATE` if the
settlement NAME starts with `"Strjálbýli á"` (a known, consistent
Hagstofa naming convention for a region's own scattered-rural residual
row — not a þéttbýlisstaður); otherwise `SETTLEMENT`. This rule is
compared against (not forced to match) Jonesy's and Ripley's own
independently-stated counts (111 settlement rows; 67/42/27 at the
200/500/1000 brackets for 2025) — agreement is read as a consistency
check, disagreement is reported and explained, never silently adjusted
to match.

**Year-rule, TWO interpretations shown side by side (dated addendum to
the ORIGINAL `pre-sample-plan.md` §3 rule, per Ripley's own instruction
— the original rule itself is not rewritten, this is a dated
clarification layered on top):**

- **Interpretation A — zero counts as a valid numeric value**: every
  settlement row with a real (non-null) number, including an actual
  `0`, counts as "numerically complete" for that year. Under this
  reading, every year 1998-2025 is 100% numerically complete in this
  table (no nulls anywhere in the requested range) — the 95% test can
  never fail on this table, so "2025 passes the rule" reduces to "2025
  is simply the newest requested year," not a meaningful pass of a real
  threshold.
- **Interpretation B — zero does NOT by itself prove a genuine,
  continuously-reported settlement** (a `0` may equally mean "this code
  was discontinued/reclassified/never applicable that year," which the
  data cannot distinguish from "really is uninhabited that year" without
  an external source): under this reading, a zero-value `SETTLEMENT`
  row does not count as numerically valid for the 95% test. This
  produces a DIFFERENT completeness percentage per year, computed from
  the actual `SETTLEMENT`-only row set (not the raw 120-row table,
  which also includes `TOTAL`/`RURAL_AGGREGATE` rows that are irrelevant
  to this test).

Both percentages are computed and shown; **2025 is reported as "the
newest requested year" — its own finality/provisional status is
`NOT_DETERMINED`**, because the metadata response itself contains no
provisional/finality field at all (its own `updated` timestamp,
2024-03-17, predates 2025's own existence in the table, which is
informative about WHEN the table's schema/description was last edited,
not about whether 2025's own data cells are final).

**Code `50` ("Reykjavík")**: this is the table's own largest
þéttbýlisstaður row; whether it also, in the public's everyday sense,
"contains" other nearby municipalities (Kópavogur, Hafnarfjörður,
Garðabær, Seltjarnarnes, Mosfellsbær) is proposed as
`INCLUDED_IN_CODE_50_INFERRED` **only** from the fact that no separate
row for those names exists anywhere in the 120-row table — never from
an outside population figure recalled from training knowledge. This is
a proposal, explicitly labelled INFERRED, not a confirmed municipal
boundary fact.

**The 25-person discrepancy** between the sum of all non-`TOTAL` rows
and the table's own `TOTAL` row (§2 of `evidence.md`) is recorded as
**unexplained**, with one INFERRED candidate explanation (independent
per-row rounding of an "average population" measure) explicitly labelled
as a guess, not a proof.

## K3/S3/P5 — Egilsstaðir: two distinct, never-conflated points

Two genuinely different points exist near Egilsstaðir and must never
share one coordinate/distance pair:

1. **The ring/road-93 JUNCTION node** — piece 2345's own stored END
   coordinate. In the long (clockwise) walk, piece 2345 is traversed
   `rev` (entry = stored end, exit = stored start) — so this junction
   coordinate is the walk's own **ENTRY** point into 2345, not its exit.
   Cumulative distance to THIS point: **677.6344 km including piece
   1436 / 675.0743 km excluding it** (computed by summing
   `chain-walks-v4.json`'s own per-step costs up to and including the
   gap INTO 2345, stopping before 2345's own length is added).
2. **Phase-1's own inventory node** — piece 2345's own stored START
   coordinate (what phase-1's `place-inventory.csv` actually recorded).
   This is the walk's own **EXIT** point from 2345 (after traversing its
   full length). Cumulative distance to THIS point: **678.5614 km
   including 1436 / 676.0013 km excluding it**.

Both are computed directly from `chain-walks-v4.json`'s own step list
(summing `piece_cost_m`/`gap_into_m` in order), cross-checked against
`road-links.csv`'s own stored `start`/`end` fields for piece 2345 — not
typed from prose, and not asserted without that cross-check.

**Mutation tests that MUST fail** (run before any output is trusted):
swapping the junction/phase-1 coordinate pair; swapping which of the
two cumulative figures (incl./excl. 1436) is attached to which point.

## K4/S4 — road-93 continuity, independent of `validate_route`

Phase-1's own `validate_route` (reused, unchanged, source-hash-checked
before import — see below) checks direction/repetition rules but does
**not** check inter-piece contact at all — confirmed this round: it
accepts all 20 of 20 random permutations of the 6 road-93 pieces tested
in sandbox (none repeat, none violate a direction rule, so none are
rejected — contact was never part of its contract). A **separate**
continuity check is therefore required and pre-registered here, BEFORE
running it: pieces are ordered by `KAFLANR` (ascending, confirmed
monotonic with the real digitized coordinates — not assumed); the gap
between consecutive pieces' own stored endpoints must be `<= 100 m`
(the same E2a threshold used throughout this project); any gap `> 100 m`
is a reported discontinuity, not silently accepted.

**Negative tests that MUST fail this continuity check**: a random
permutation of the 6 pieces; a duplicated piece in the sequence; a
synthetic inserted gap `> 100 m` between two real pieces.

**Supply-chain integrity**: before importing `national_inventory_v4.py`
(phase-1's own file, to reuse its `validate_route`), its own SHA-256 is
computed and compared against the value already on record
(`a3fa0bd4891405081fa25a1087e409c21582006f0777f3f8fbe91a2246ab3ad8`,
from phase-1's own `HASHES-v4.sha256`) — a mismatch is a STOP, not a
silent import.

**Tier sensitivity, reported not hidden**: the canonical (most-vertices,
tier `-1`) chain length is 26,9266 km; the coarsest tier (`2`) gives
24.7525 km (−8.1%) — the SAME tier-sensitivity phenomenon already
documented for the main ring, now also shown for road 93.
**Two length figures, both reported**: from the junction node, 26.9266
km; from phase-1's own node (via piece 2345's own 927.0346 m length),
27.8536 km. Neither replaces the other.

## K5/S5 — work-list extraction and weather-point proposals

**Source**: `national-place-coverage.md`'s own "Vinnulisti eftir
svæðum" table, columns 2 and 3 ONLY (not phase-1's own smaller, already-
curated 27-row inventory). Each cell is split on commas, trimmed,
NFC-normalized. The editorial phrase "og fleiri firðir eftir nákvæmri
yfirferð tenginga" is stripped as non-place text (it is a qualifying
remark about the table itself, not a place name) and
**"Gatnamót tenginga við veg 1" is excluded** (it names a type of
connection point, not a settlement) — both exclusions are logged with
their own reason, not silently dropped. The input and output COUNT of
cells is recorded before and after cleaning, so nothing silently
disappears. A settlement name appearing more than once across the
table's own rows (e.g. "Stöðvarfjörður," listed once as a ring town and
once as a connecting-road fjord town) is merged into ONE output row
carrying BOTH source references, not two separate or one silently
dropped.

**Matching**: exact NFC string match against the Hagstofa
`Þéttbýlisstaðir` dimension's own `valueText` list. A name with more
than one plausible match (e.g. "Reykholt" — codes `193` and `1162` both
plausible; "Vogar" — codes `160` and `705` both plausible) is marked
`AMBIGUOUS`, never auto-resolved to either one. A name with zero match
is `UNMATCHED`. Region (from the work-list's own row grouping) may be
used as an INFERRED disambiguating hint in the OUTPUT notes, but never
as grounds to silently pick one candidate over another.

**Assertion**: the count of work-list entries fed in equals the count
of result rows produced (after the Stöðvarfjörður-style merge is
accounted for) — nothing is silently lost.

**Weather-point proposals**: defined purely as a distance or fraction
along the canonical (tier `-1`) road-93 polyline, with the coordinate
computed by linear interpolation between the two nearest real vertices
— never from an elevation, terrain, or named-landmark claim (no such
authorised source exists for this task). Each proposed point records
its own piece (IDFERILL), distance from the junction node, and the
IDBUTUR of the segment it falls on. Point selection itself remains an
owner decision, unchanged from phase 1's own position.

## Scope note

Does not reopen `rules.md`, `rules-addendum-v2/v3/v4.md` (phase-1,
`ticket-493-place-network`'s own files), or this task's own
`pre-sample-plan.md` — all unchanged, confirmed by SHA-256. No new
network exchange this round (K6).
