# #493 place-network — Pre-registered rules (E2, E3)

2026-11-06, CC. Written and committed to disk BEFORE running any inventory
script or examining contact/continuity results this round (E2's own
requirement: "í fyrstu skrá lotunnar, áður en inventory er keyrt"). These
rules are comparisons against measurement, not thresholds chosen after
seeing the data, and they do not change retroactively based on what the
inventory script finds.

## E2(a) — contact-step classification

For every pair of piece *endpoints* belonging to different IDFERILL (never
comparing a piece's own two ends to itself), the planar (EPSG:3057, native
ISN93) distance between them is computed and classified into exactly one
of these bands:

| Band | Distance | Meaning |
|---|---|---|
| `exact` | `== 0.0 m` (native xy tuple equality, not rounded) | Mapped lines share a literal vertex |
| `contact_5m` | `> 0.0 m` and `<= 5 m` | Effectively touching; sub-pixel digitizing slack |
| `contact_25m` | `<= 25 m` | Close; plausibly a shared junction, not independently verified |
| `contact_100m` | `<= 100 m` | Loosely proximate; treated as a BRIDGED gap, not a verified contact |
| `gap` | `> 100 m` | Not treated as contact at all — a genuine discontinuity |

These bands are a comparison against the measured number for reporting,
never a condition that changes which number is reported. A bridged gap
(`contact_25m`/`contact_100m`) is always labeled BRIDGED in the output and
is never presented as `exact` contact. This mirrors the north-data round's
own C1/K1 distinction between exact 0.00 m contact and the two
pre-registered roundabout bridges (1.77 m, 42.84 m).

## E2(b) — direction-by-VEGHLUTI rule (continuing #483 `research-report.md` A2)

Documented (per `research-report.md` line 42): `0`=centerline, `3`=on-ramp,
`4`=off-ramp, `5`=roundabout, `6`/`7`=carriageway with/against the stated
travel direction. **Undocumented in any retained source:** `1` (the
majority of pieces; inferred "undivided carriageway") and `8` (4 features
nationwide this round, 1 distinct IDFERILL). Direction grade, decided
BEFORE reading per-piece results:

- `VEGHLUTI=1`: **INFERRED** bidirectional-ordinary-road, sharing one
  mapped line for both directions. Reason: undocumented role; no 6/7 pair
  exists for the vast majority of the nationwide chain, so "both
  directions" rests on the shared line being driven both ways, not on a
  second verified line.
- `VEGHLUTI=6`/`7`: **VERIFIED** which of the pair matches a stated travel
  direction (per #483's own worked example — east/south from Reykjavík
  picks the `7` member of a 6/7 pair), the opposite member is the
  OTHER direction's own verified line, not an inference from the first.
- `VEGHLUTI=5` (roundabout): direction is **UNKNOWN** by convention — a
  roundabout's own geometry does not encode a single travel direction; it
  is included in length/continuity bookkeeping with an explicit
  "over-counts true driven length" caveat (a car does not drive the full
  loop), per #483's own §2 roundabout decision.
- `VEGHLUTI=3`/`4` (on/off-ramp): **VERIFIED** one-directional by the
  on-ramp/off-ramp role itself.
- `VEGHLUTI=8`: **UNKNOWN** — undocumented, like `1`, but with too few
  nationwide instances (1 distinct IDFERILL) to even inherit the
  majority-pattern inference; reported as UNKNOWN with the instance named
  explicitly, not silently folded into the `1` treatment.
- Tunnels (see E2(c)): direction grade follows the VEGHLUTI of the
  tunnel's own piece(s), with the traversal decision layered on top.

## E2(c) — tunnel handling

Both named tunnels found on VEGNR=1 in the retained nationwide dataset are
handled explicitly, decided before inspecting contact results:

- **Hvalfjarðargöng** — already on the ring and already present in every
  prior retained chain walk (#483/#491). **Included** in any route that
  passes through it, with its own VEGHLUTI-based direction grade (no
  special-case override).
- **Vaðlaheiðargöng** (IDBUTUR 909350037/909360037, piece 32961/32964
  area) — excluded from the north-data round's own westward chain walk
  (Borgarnes→C) by the accepted C endpoint decision itself, since C
  (IDFERILL 2940, end-of-piece at the 2940→3876 junction) is a **place
  endpoint, not a cut in the ring** — the native chain continues east of
  2940 through 3876 and then the tunnel. For THIS round's ring-continuity
  work: Vaðlaheiðargöng is **included** when the chain walk actually
  reaches it while tracing the ring eastward *through* Akureyri and beyond
  C, exactly like Hvalfjarðargöng is included on the western side. It is
  excluded only from the already-decided C anchor's own weather/route
  scope (per `akureyri-endpoint-decision.md`), not from the underlying
  national ring-continuity question this round answers. If the walk from
  C eastward does not reach a next matching endpoint within the gap
  thresholds above, that is reported as an honest gap, not assumed closed
  because Vaðlaheiðargöng is "obviously" the next piece.
- **Fáskrúðsfjarðargöng** — present in the nationwide dataset per Jonesy's
  own prompt-review read; handled identically to Hvalfjarðargöng (included
  wherever the chain walk reaches it, own VEGHLUTI-based direction grade).
- Any further tunnel discovered during this round's own chain walk is
  handled by this same rule (included, own VEGHLUTI grade), not a new
  ad-hoc exception.

## E2(d) — canonical-instance selection (duplicate/parallel pieces)

The retained nationwide dataset carries exactly 4 geometry copies per
IDFERILL (996 features / 249 IDFERILL = 4.0 exactly, confirmed before this
rule was written — counting copies is not "inspecting results", it is
confirming the rule applies to the actual file shape). **Canonical-instance
rule, fixed before any contact/length computation:** for each IDFERILL,
select the copy with the greatest number of coordinate vertices; on an
exact tie, select the lowest native `OBJECTID`. This rule is deterministic
and stated once — it is not re-applied differently per IDFERILL based on
which copy happens to "look right" for continuity. All contact-threshold
and length computations in this round use ONLY the canonical copy per
IDFERILL; the other 3 copies per IDFERILL are not loaded into the pieces
list at all (not silently included as near-duplicates that would
double-count length).

Parallel carriageways (VEGHLUTI 6/7 pairs) and roundabout branches
(VEGHLUTI 5) are **separate IDFERILL values**, not duplicate copies of the
same IDFERILL — they are never merged or dropped by the canonical-instance
rule above; they are counted once each as their own piece, with the
direction/roundabout handling from E2(b) applied to decide whether a given
route traversal uses one, the other, both (roundabout), or neither.

## E3 — settlement-coordinate origin (no new host approved this round)

Hagstofa supplies population counts, not coordinates; no retained document
in this repository carries a settlement coordinate list. Two possible
origins exist, and only one is in scope for THIS round:

- **(a) Name-lookup against the road layer's own `STUTTNAFNLEIDAR`/
  `STADARLYSING` fields** — e.g. a piece literally named "Egilsstaðir" or
  "Hlíðarvegur-Fellabær". When used, the resulting point is **INFERRED**
  (a road-segment name match, not a surveyed town-center coordinate), the
  access node is offered as a PROPOSAL, and no claim is made about a town
  centroid. This is the only coordinate origin approved for use in this
  round.
- **(b) A new official host** (a settlement-centroid/place dataset outside
  the current Hagstofa + Vegagerðin allowlist) — requires a **separate
  owner decision** recording terms, licence, and attribution before any
  request. Not approved this round; not used.

Centre, access point, and road-junction point are three distinct concepts
and are never conflated: a settlement's "centre" (not resolved this round
under either origin), its proposed "access node" (the nearest VEGNR=1/
connecting-road vertex a route would actually use, from origin (a) when
available), and the "connection point" where an access road meets VEGNR=1
(read directly from the retained road layer when the connecting road
itself is already retained — e.g. Reykjavík's own junction near Rauðavatn
is already in the retained VEGNR=1 data; most connecting roads are not yet
retained — see phase-2 recommendation in `evidence.md`).

Ambiguous settlement names (e.g. multiple places sharing a name, or a name
also used for a road-segment description unrelated to a settlement) are
disambiguated by municipality or Hagstofa ID in the inventory, not by
positional guessing.

"Regionally important" / "important service" status (per the national
coverage work list) cannot be proven from either currently-approved
source (Hagstofa population counts, Vegagerðin road geometry) — it is
recorded as an **owner proposal without an evidence grade**, using
pre-registered, stated population-bracket criteria (not a single silent
cutoff), per E3's own instruction. The actual bracket values and counts
are recorded in `evidence.md`/`place-inventory.csv`, not invented here.

## Labels used throughout this round's output

`VERIFIED` / `INFERRED` / `UNKNOWN` / `NOT_TESTED` / `CC-attributed` — as
defined in E7. A value is `VERIFIED` only when this round's own
independently-run computation confirms it from retained bytes; a prior
round's own stated conclusion that this round did not itself recompute is
`CC-attributed` (naming which prior file/round), not silently adopted as
this round's own verification.
