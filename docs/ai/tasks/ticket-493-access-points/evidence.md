# #493 access-points — Evidence (connectivity status + endpoint candidates)

2026-11-10, CC. Executed `approved-prompt-v1.md` (G1-G8) for
`ticket-493-access-points`. **Offline only — no new network exchange,
no new host, no app/API/dependency/subagent change.** `rules.md` (and
its own `rules.sha256`) was written and hashed BEFORE
`samples/build_access_points.py` ran. All 12 of G7's named input files
are confirmed byte-identical before and after this round
(`samples/input_hashes.json`, independently re-verified).

Outcome label: see §7.

## 1. What this round actually is

A connectivity/decision-preparation pass over the 72 work-list places,
separating four previously-conflated questions (Hagstofa name-pairing,
road connection, coordinate authority, direction knowledge) for every
place, using only data already retained from prior rounds (phase-1
`ticket-493-place-network`, phase-2 `ticket-493-place-data-phase2`,
`ticket-493-north-data`). No place-count or threshold decision is made
here — this is evidence preparation, not a release decision.

**Most of the 72 places resolve to a gap, not a connection** — this was
predicted in `prompt-review.md` and is confirmed: only 2 of 72
(Egilsstaðir, Akureyri) have no gap entry at all; 70 do. 24 of 72 were
already individually assessed by phase-1 (`place-inventory.csv`); the
other 48 were not and are resolved this round by a word-boundary name
search of VEGNR=1's own `name`/`desc` fields
(`road-links.csv`) — of which exactly **0** produced a genuine match
(one candidate, "Laugar" matching inside "Laugardælavegur", was caught
and rejected by the word-boundary fix before being trusted — see §4).

## 2. Connectivity table (`place-access-status.csv`)

72 rows (asserted 72=72, phase-2's own order, no duplicates), four
independent status columns plus a gap pointer:

| `road_connection` | Count | Meaning |
|---|---|---|
| `OWNER_APPROVED_ANCHOR` | 1 | Akureyri only. |
| `MAPPED_CONTACT_VERIFIED` | 2 | Egilsstaðir (ring/road93 junction, 0.0 m); Seyðisfjörður (the connecting ROAD's own contact to the ring, not the settlement's own point). |
| `NAME_MATCH_INFERRED` | 8 | Selfoss, Hella, Hvolsvöllur, Vík, Fáskrúðsfjörður, Reyðarfjörður, Reykjahlíð (all individually assessed by phase-1), plus Borgarnes. |
| `NODE_UNDETERMINED` | 61 | Everything else, including the 9 regression-test names and 48 never-before-assessed bucket places. |

`hagstofa_pairing`/`hagstofa_match_type`/`hagstofa_codes` are copied
directly from `worklist_matching-v3.json`, unedited. No population
figure appears anywhere in this file.

**Regression test (G1) passed**: all nine phase-1-retracted names
(Hveragerði, Kirkjubæjarklaustur, Höfn, Djúpivogur, Breiðdalsvík,
Fellabær, Varmahlíð, Blönduós, Mosfellsbær) resolve to
`NODE_UNDETERMINED` — their already-settled phase-1 status is read
directly, never re-derived or upgraded by this round's own name search.

## 3. Distance validation (G5)

`samples/build_access_points.py` reuses phase-2 v3's own independent
suffix-sum/prefix-sum validator unmodified in method. Results:

- **Equality check against `place_nodes-v3.json`** for the four
  phase-2 pieces (2345, 2138, 3591, 3593): exact match on all four
  incl./excl.-1436 figures.
- **Schema validator negative test**: the literal v3
  `place-inventory-v3.csv` SEYDISFJORDUR row (a length-comparison
  SENTENCE packed into a numeric column) is rejected; the cleaned
  equivalent (number or empty, text moved to `notes`) is accepted.
- **cum validated via `cw_long`** (and reported in the table) for 9
  pieces this round: 2345 (Egilsstaðir), 2138 (Selfoss), 3591 (Hella),
  3593 (Hvolsvöllur), 3849 (Vík), 2536 (Fáskrúðsfjörður), 2520
  (Reyðarfjörður), 3566 (Reykjahlíð), 3876 (Akureyri's own C, via its
  own exit = piece 2940's own stored end). All eight non-Egilsstaðir
  figures match the independent sandbox figures from `prompt-review.md`
  exactly (e.g. Vík 175.1712/172.6111 km, Reykjahlíð 842.9571/840.3969 km).
- **Mutation tests, same validator used for acceptance, run on all 9
  of the above pieces** (entry/exit coordinate swap, incl./excl. field
  swap, double-counted 1436) — all correctly rejected on every piece —
  plus the literal wrong `egilsstadir_nodes-v2.json` values tested
  again as a regression case on piece 2345, also correctly rejected.
- **Borgarnes (piece 2819) is NOT validated this round**: it sits on
  `ccw_short`, not `cw_long`, and this round's validator only covers
  `cw_long` (the same scope phase-2 v3 used). `cum` for Borgarnes is
  `null`/`NOT_VALIDATED`; `direction_status=UNKNOWN`, not `INFERRED`.
  This is a scoped limitation, recorded here, not a silent gap.

## 4. A real false positive caught before being trusted

The first version of the name-search used plain substring containment
and matched "Laugar" (one of the 48 never-before-assessed places)
inside piece 8676's own `desc` field, "Hringv.: Laugardælavegur -
Eyrarbakkavegur" — a completely different place name
("Laugardælir", near Selfoss) that merely happens to start with the
same letters. Fixed by switching to a word-boundary-aware match
(Icelandic letters treated as word characters) before any output was
trusted; re-run confirmed zero genuine matches among the 48 bucket
places (`samples/name_match_candidates.json` is empty).

## 5. Reykjavík, Egilsstaðir/Seyðisfjörður, Akureyri (G3/G4, `endpoint-candidates.json`)

- **Reykjavík**: directions are named by piece 1436's own stored
  endpoints, not compass words. Stored END `(365522.0175, 402772.7620)`
  starts the short/western leg toward Borgarnes (excl. 1436); stored
  START `(367768.9400, 401667.0900)` starts the long/eastern leg
  (traversing 1436 itself backward, incl. 1436). Both offsets (0 km /
  2.5601 km) reported on both bases. `REY-CORE` itself gets
  `NO_COORDINATE_SOURCE` — no VEGNR=1 piece represents the city core.
  Rauðavatn (identical to the long leg's own start) is reported strictly
  as `candidate`/`INFERRED`, never a confirmed core; no distance is
  claimed between it and a city-core point, because no city-core
  coordinate is retained.
- **Egilsstaðir/Seyðisfjörður**: all six named node sets from retained
  data, not just the two the draft mentioned — ring/road93 junction
  (2345/2344, VERIFIED 0.0 m), end of 2344 (1.7162/1.6049 km), end of
  3410 (11.5982/10.6441 km), start of 2894 "kirkjugarðshorn"
  (25.6094/23.5081 km), junction 2894/2892 (26.2523/24.1489 km),
  junction 2892/2891 (26.5131/24.4007 km), and the ferry pier/end of
  2891 (26.9266/24.7525 km) — all independently re-derived this round
  and matching `prompt-review.md`'s own sandbox figures exactly. Piece
  2894's own `STADARLYSING` says "Hánefsstaðavegur"; piece 2892's says
  "Hánesstaðavegur" — preserved verbatim, not normalised. **No node is
  pre-selected**; the choice is an owner decision (§6). Both exit-length
  variants (26.9266 km from the ring junction; 27.8536 km from phase-1's
  own node via piece 2345) are reported, neither replacing the other.
  No WGS84 exists anywhere for road 93 — a genuine gap (§7), not a
  failure.
- **Akureyri**: `OWNER_APPROVED`, not reopened. Native coordinate
  `(540259.2615, 577843.7582)` (end of 2940 = start of 3876, 0.0 m
  shared point, confirmed from `road-links.csv`); WGS84
  `65.69570405°N, 18.12371406°W` copied verbatim from
  `akureyri-endpoint-decision.md`, never recomputed (no EPSG:3057->4326
  arithmetic was run this round, per G2).

## 6. Decisions the owner can take from this delivery vs. what needs new authorisation

**`owner_decisions_available`** (each with real options and a
measurable difference, no option pre-selected):

1. **Egilsstaðir/Seyðisfjörður access point** — six candidates in
   `endpoint-candidates.json`, cum ranging 0 (ring junction) to
   26.9266 km (ferry pier); the "town entrance" candidates (2894/2892
   junction) differ from the pier by 0.6743 km (tier −1). `PROPOSAL`
   per `release-definition-proposal.md`, not chosen here.
2. **Reykjavík's own representative point** — adopt Rauðavatn formally
   as a named comparison anchor (still not a confirmed core), or defer
   entirely pending new data. `PROPOSAL`, not chosen.
3. **72-place release scope** — accept all 72 as the v1 target (70 of
   which currently have a gap), or trim to a smaller, already-connected
   subset (Akureyri + Egilsstaðir, optionally + the 8
   `NAME_MATCH_INFERRED` places with caveats) for a faster first
   release. `PROPOSAL` per `release-definition-proposal.md`, not chosen.
4. **Reykholt's own ambiguous Hagstofa code** (193 vs. 1162) — pick one
   via a region rule, or exclude Reykholt from Hagstofa-linked scoring
   until resolved.

**`requires_new_authorisation`** (none of these can be done from
retained data alone):

1. A geographic source for Reykjavík's own city core (`REY-CORE`) —
   no such source is retained; host/layer/licence all `UNKNOWN`.
2. A WGS84 (EPSG:4326) fetch of the road-93 WFS layer, if haversine
   distance to Seyðisfjörður is wanted (currently EPSG:3057 only).
3. Connecting-road geometry for the 61 `NODE_UNDETERMINED` places —
   each likely needs its own VEGNR/connecting-road identification; two
   have an INFERRED textual hint already in retained notes (Hvammstangi:
   "Hvammstangavegur" junction pieces mentioned by phase-1; Vopnafjörður:
   none) but nothing has been fetched for either.

Neither list re-authorises `gagnaveita.vegagerdin.is`/`px.hagstofa.is`
for a future round merely because prior rounds used them (G6).

**`PROPOSAL` tagging**: the 72-place target list itself, the
Seyðisfjörður town-entry choice, a named Reykjavík point, and the
ferry-pier end — all floated in `release-definition-proposal.md` — are
tagged `PROPOSAL` throughout this round's own output and never promoted
to approved. Only Akureyri C (`OWNER_APPROVED`, the owner's own
2026-11-06 decision) and Borgarnes (`PRIOR_ROUND_REFERENCE`, #491's own
established rule — not an owner decision, and not re-derived from a
fresh name match alone, see `rules.md`) carry a different tag.

## 7. Gaps (`samples/gap_list.json`, 70 entries)

Every row without a confirmed connection AND a coordinate has at least
one gap entry (asserted). Each entry carries `place`, `missing_fact`,
`purpose`, `required_data` (fields/CRS/precision), `proposed_host`
(always `UNVERIFIED_PROPOSAL`: existence/layer/licence/CRS all
`UNKNOWN`, nothing fetched), and `authorisation: NOT_AUTHORISED`.

**The two gaps predictable before this round even started, named
explicitly as their own `BLOCKED_WITH_EXACT_GAPS` sub-items (G8), not
folded into the overall label:**

- **`BLOCKED_WITH_EXACT_GAPS` sub-item: `REY-CORE`** — no VEGNR=1 piece,
  no retained coordinate, no fetch authorised this round.
- **`BLOCKED_WITH_EXACT_GAPS` sub-item: road 93 WGS84** — no retained
  EPSG:4326 geometry exists for VEGNR=93 at all; haversine distance for
  Seyðisfjörður/Egilsstaðir-via-93 cannot be computed this round.

The remaining 68 gap entries are the ordinary consequence of 61 places
being `NODE_UNDETERMINED` (minus the overlap already counted above) and
are listed in full in `samples/gap_list.json`, not individually narrated
here.

## 8. What this round did NOT do

- Did not select a 72-place (or any other) release scope — that is
  `owner_decisions_available` item 3, untaken.
- Did not select an Egilsstaðir/Seyðisfjörður or Reykjavík access
  point — unselected candidates only.
- Did not fetch any new data, re-authorise any host, or add any
  dependency.
- Did not validate Borgarnes's own cum (out of this round's `cw_long`-
  only validator scope — see §3).
- Did not resolve Reykholt's own dual-code ambiguity.
- No app/UI/API/commit/push. Production NOT_TESTED.

## 9. Outcome

72 = 72 rows (asserted); the schema validator's own negative case
failed and the cleaned case passed; every distance validator and
mutation test passed/failed exactly as required (§3); the Reykjavík,
Egilsstaðir, and Seyðisfjörður comparisons are delivered with every
candidate explicitly tagged and none pre-selected (§5). Per G8, this
means the delivery-readiness bar is met.

**Outcome: `EVIDENCE_READY_FOR_OWNER_REVIEW`**, with the two
predictable gaps named explicitly as `BLOCKED_WITH_EXACT_GAPS`
sub-items in §7 (not hidden by the overall label), and the remaining 68
gap entries counted and itemised in `samples/gap_list.json`. No
`INFERRED` finding is described as "clearly" or "confirmed"; a verified
contact (Egilsstaðir's 0.0 m junction, Akureyri's shared 2940/3876
coordinate) is never described as proof of a legal driving direction.
`LICENSE_NOT_DETERMINED` (inherited from phase-2) stands; no population
figure appears anywhere in this round's output.
