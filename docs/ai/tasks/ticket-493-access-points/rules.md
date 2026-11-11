# #493 access-points — Rules (written and hashed BEFORE the build script runs)

2026-11-10, CC. Executes `approved-prompt-v1.md` (G1-G8). Offline,
retained-data-only decision preparation — no new network exchange, no
new host, no app/API/dependency change. This file and its own
`rules.sha256` are written and hashed first; `samples/build_access_
points.py` reads this file's own rules by convention (the vocabulary
and decision tables below), not the other way around.

## G1 — closed status vocabulary (four independent columns + gap pointer)

- **`hagstofa_pairing`**: copied directly from `worklist_matching-v3.json`'s
  own `status` (`MATCHED`/`AMBIGUOUS`/`UNMATCHED`) and `match_type`
  (`EXACT`/`PREFIX_SINGLE`/`NONE`/`AMBIGUOUS`), plus `candidates` (codes).
  No population figure is carried into this table.
- **`road_connection`**: one of `OWNER_APPROVED_ANCHOR`,
  `MAPPED_CONTACT_VERIFIED`, `NAME_MATCH_INFERRED`, `NODE_UNDETERMINED`.
  The first two mark either an owner-approved anchor or a MEASURED
  contact between two separately-mapped lines (e.g. ring piece 2345's
  own stored end touching road-93 piece 2344's own stored start at
  0.0 m). A place name found only inside a VEGNR=1 piece's own `name`/
  `desc` text authorises AT MOST `NAME_MATCH_INFERRED` — never
  "connected" and never treated as proof of a legal driving direction.
- **`coordinate_source`**: one of `RETAINED_GEOMETRY`,
  `OWNER_APPROVED_RETAINED`, `NO_COORDINATE_SOURCE`. A coordinate not
  traceable to a specific retained file (own SHA-256, feature/piece id,
  field, CRS) is banned — including from training memory or the web —
  and the row gets `NO_COORDINATE_SOURCE` instead.
- **`direction_status`**: one of `INFERRED`, `UNKNOWN`,
  `NOT_APPLICABLE`. `INFERRED` requires BOTH a specific retained primary
  source AND a pre-registered rule (below) — otherwise `UNKNOWN`.
  `NOT_APPLICABLE` is used only where no node/coordinate exists at all
  (direction is not a meaningful question for a place with
  `NODE_UNDETERMINED` + `NO_COORDINATE_SOURCE`).
- **`gap_id`**: null, or a pointer into the gap list (`samples/gap_list.json`).

**Keys**: the 72 cleaned names from `worklist_matching-v3.json`, in
that file's own order. Assert 72 = 72, same order, no duplicate.
Reykholt is already a single row there carrying both Hagstofa codes
(193/1162); this task adds no disambiguation between them, only a gap
entry about which one (if either) the product needs.

**Name alias map (pre-registered, for matching this task's 72 names
against phase-1's own individually-assessed rows, which used slightly
different labels for the same place)**: `"Reykjavík (city core)" ->
"Reykjavík"`, `"Reykjahlíð (Mývatn)" -> "Reykjahlíð"`. No other aliasing
is applied.

**Phase-1 status -> this round's `road_connection` mapping** (phase-1's
already-corrected v2/v3/v4 file, `ticket-493-place-network/place-
inventory.csv` — never v1, never re-derived from scratch where phase-1
already has a per-place row):

| Phase-1 status (as recorded) | Maps to `road_connection` | Note |
|---|---|---|
| `AKUREYRI_C_OWNER_DECISION` | `OWNER_APPROVED_ANCHOR` | Sourced from `akureyri-endpoint-decision.md`, not re-derived. |
| `ON_RING_NAME_MATCH_INFERRED` | `NAME_MATCH_INFERRED` | Name-matched piece on the ring itself; literally the old status name. |
| `BORGARNES_PER_PRIOR_ROUND_RULE` | `NAME_MATCH_INFERRED` | Piece 2819's own `name`/`desc` ("Borgarnes-Baulan"/"Borgarnes") independently also contains the name — not purely a convention call. |
| `NODE_UNDETERMINED` | `NODE_UNDETERMINED` | Identity. |
| `INFERRED_OUTSIDE_VEGNR1` (Reykjavík core) | `NODE_UNDETERMINED` | No VEGNR=1 piece represents the city core at all; see G3. |
| `CONNECTING_ROAD_NEEDED_PHASE2` | `NODE_UNDETERMINED` | Unless phase-2 has since resolved it (Seyðisfjörður only — see below). |
| `CONNECTING_ROAD_VERIFIED_EXACT_CONTACT_TO_RING` (Seyðisfjörður, from phase-2's own `place-inventory-v3.csv`) | `MAPPED_CONTACT_VERIFIED` | The CONNECTING ROAD's own contact to the ring is measured and verified (0.0 m); the SETTLEMENT's own coordinate is a separate, still-undetermined question (`coordinate_source=NO_COORDINATE_SOURCE`, several unpicked candidates — see G4/endpoint-candidates.json). |

**Regression negative test (G1)**: the nine places phase-1 already
retracted to `NODE_UNDETERMINED` — Hveragerði, Kirkjubæjarklaustur,
Höfn, Djúpivogur, Breiðdalsvík, Fellabær, Varmahlíð, Blönduós,
Mosfellsbær — must each resolve to `road_connection` in
`{NODE_UNDETERMINED, NAME_MATCH_INFERRED}` this round, never
`{MAPPED_CONTACT_VERIFIED, OWNER_APPROVED_ANCHOR}`. Since all nine are
already individually present in phase-1's own corrected file, this
round's lookup reads their already-settled status directly rather than
re-deriving it — the test only guards against a future change to this
script accidentally re-promoting one of them via a blind name search.

**Places in phase-1's own "(all other work-list towns)" aggregate row**
(not individually assessed in any prior round) are resolved this round
by a generic search of VEGNR=1's own `name`+`desc` fields
(`road-links.csv`, NFC-normalized substring containment of the place's
own cleaned name): zero hits -> `NODE_UNDETERMINED`; one or more hits ->
`NAME_MATCH_INFERRED`, never higher, with every matching piece's own
IDFERILL/`name`/`desc` recorded. Ferries (Vestmannaeyjar, Hrísey,
Grímsey, Flatey) are not part of the 72-name work list and are excluded
from this table (phase-1's own `FERRY_SEPARATE_CLASSIFICATION`).

## G2 — coordinate authority, no unsupported arithmetic

"Unsupported arithmetic" means ANY EPSG:3057->4326 (or any other CRS)
reprojection computed in this round, including a plain stdlib
implementation — banned regardless of how it is coded. WGS84 may only
be COPIED verbatim from an already-retained EPSG:4326 response:
`ticket-493-north-data/samples/wfs-north-4326.json` (the north-data
ring geometry) and `ticket-493/akureyri-endpoint-decision.md` (which
states Akureyri C's own WGS84 directly: 65.69570405°N, 18.12371406°W).
Road 93 (Egilsstaðir/Seyðisfjörður) has no retained WGS84 anywhere —
this is a data gap, not a failure, and is listed as such. Haversine
distance is used only where retained WGS84 geometry exists; otherwise
distances are planar ISN93 (EPSG:3057), explicitly labelled as such.

Every coordinate reported anywhere in this round's output carries its
own `(file, sha256, feature_or_piece_id, field, crs)` provenance tuple.
A coordinate without this provenance is not reported at all — the row
gets `NO_COORDINATE_SOURCE` instead.

## G3 — Reykjavík

Directions are named by piece 1436's own stored endpoints, never by
compass words: its own stored END, `(365522.0175, 402772.7620)`, is the
start of the SHORT/WESTERN leg toward Borgarnes (excluding 1436's own
length); its own stored START, `(367768.9400, 401667.0900)`, is the
start of the LONG/EASTERN leg, which traverses 1436 itself backward
(including 1436's own length). Both legs' lengths are reported on both
bases (incl./excl. 1436), clearly labelled. `REY-CORE` (the Reykjavík
city core itself) gets `coordinate_source=NO_COORDINATE_SOURCE` and its
own gap entry with an exact purpose — no VEGNR=1 piece represents it.
The only retained-data candidate is Rauðavatn (piece 1436's own anchor
from prior rounds), reported strictly as `candidate`/`INFERRED`, never
as a confirmed Reykjavík core. No distance claim between Rauðavatn and
any city-core point is made (no retained coordinate exists for the
latter).

## G4 — Egilsstaðir / Seyðisfjörður comparison table

Covers every NAMED node set in retained data, not only the two the
draft prompt mentioned: ring/road-93 junction 2345/2344 (`VERIFIED`,
0.0 m gap), end of 2344, start of 2894 ("kirkjugarðshorn"), junction
2894/2892, junction 2892/2891, and the ferry pier (end of 2891). Each
node carries its own native coordinate, its own piece's `name`/`desc`
verbatim (no normalisation of the "Hánefs-"/"Háness-" spelling
inconsistency between adjacent pieces), and cumulative distance on
tier −1 and tier 2. No node is pre-selected as "the" access point — the
choice is an owner decision, presented as unselected candidates. Both
Egilsstaðir exit-length figures (26.9266 km from the ring junction;
27.8536 km from phase-1's own node via piece 2345) are reported with
their own labels. Akureyri C remains `OWNER_APPROVED` and is not
reopened.

## G5 — schema and validators

Numeric columns hold a finite number or are empty — any text (such as
v3's own literal Seyðisfjörður `cum_km_excl_1436` string) goes into a
separate `notes` field instead. A schema validator with its own
negative reference case (the verbatim v3 Seyðisfjörður row, which MUST
fail) is run before any other processing. Distance validation reuses
phase-2's own method (`build_phase2_v3.py`'s `validate_node`/suffix-sum
approach): independent suffix-sum vs. forward prefix-sum, compared as
`(value, label)` pairs, `gap_into_m` included at entry, rounding only
at display (4 decimals km, 0.1 m tolerance) — run for EVERY place that
gets a cum value in this round's table, not only the four phase-2
pieces already in `place_nodes-v3.json` (2345, 2138, 3591, 3593, which
must reproduce `place_nodes-v3.json` exactly). A place whose candidate
piece is not found in `cw_long.steps` gets `cum=null`/
`NOT_VALIDATED` rather than a guessed figure. The same four phase-2
mutation tests (entry/exit swap, incl./excl. swap, double-counted
1436, the literal wrong `egilsstadir_nodes-v2.json` values) are run
again on more than one piece this round, before any output is written.

## G6 — gap list and decision lists

Each gap entry: `place`, `missing_fact`, `purpose`, `required_data`
(fields/CRS/precision), `proposed_host` (always `UNVERIFIED_PROPOSAL`:
existence/layer/licence/CRS all `UNKNOWN`; nothing fetched; no URL or
layer name from memory unless it already appears in retained data —
e.g. `gagnaveita.vegagerdin.is`/`px.hagstofa.is` are NOT automatically
re-authorised for a future round just because prior rounds used them),
`authorisation: NOT_AUTHORISED`. Every row without a confirmed
connection (`road_connection != MAPPED_CONTACT_VERIFIED/OWNER_APPROVED_
ANCHOR`, or `coordinate_source == NO_COORDINATE_SOURCE`) gets at least
one gap entry. Two separate top-level lists: `owner_decisions_available`
(each with real options and a measurable difference between them) and
`requires_new_authorisation`. Every proposal already floated in
`release-definition-proposal.md` (the 72-place target list itself, a
Seyðisfjörður town-entry choice, a named Reykjavík point, the ferry-
pier end) is tagged `PROPOSAL` in this round's own output and never
promoted to approved. Only Akureyri C (`OWNER_APPROVED`, from the
owner's own 2026-11-06 decision) and Borgarnes (`PRIOR_ROUND_REFERENCE`,
from #491's own established rule) get a different tag.

## G7 — provenance and re-run determinism

Input files hashed before AND after this round (unchanged), at minimum:
`place_nodes-v3.json`, `worklist_matching-v3.json`, `road93_section-v2.json`,
`wfs93-raw.json`, `chain-walks-v4.json`, `road-links.csv`, phase-1's own
`place-inventory.csv`, `place-inventory-v3.csv`, `route-data-candidate.json`,
`wfs-north-4326.json`, `national-place-coverage.md`. This file
(`rules.md`) and `rules.sha256` are written and hashed BEFORE
`samples/build_access_points.py` runs — not left to file mtime order.
The build script is statically checked for no `socket`/`http`/`urllib`/
`requests`/`ssl` import. Output JSON uses a fixed key order and no
timestamps, so a re-run is byte-identical. `HASHES.json`/`HASHES.sha256`
are generated LAST; `cc-report.md` and `CURRENT.md` are outside that
table, explicitly marked as such.

## G8 — outcome label, pre-registered

`EVIDENCE_READY_FOR_OWNER_REVIEW` applies only if: 72 = 72 rows; the
schema validator's own negative case fails and the cleaned case passes;
every distance validator and mutation test passes/fails as expected;
and the Reykjavík/Egilsstaðir/Seyðisfjörður comparisons are delivered
with every candidate explicitly tagged. Data gaps are not failures but
ARE counted; the two gaps already predictable going in (`REY-CORE`'s
own `NO_COORDINATE_SOURCE`, and road 93's own missing WGS84) are named
explicitly as `BLOCKED_WITH_EXACT_GAPS` sub-items, not hidden inside an
overall PASS-sounding label. `INFERRED` findings are never described as
"clearly" or "confirmed"; a verified CONTACT never implies a legal
driving direction. Tested vs. untested, and sandbox vs. CC-run, stay
clearly distinguished throughout.

## Scope note

Offline only. No new network exchange, no new host, no app/API,
dependencies, subagents, commit/push, or GitHub action. Writes are
confined to `docs/ai/tasks/ticket-493-access-points/` and the mandatory
`docs/ai/CURRENT.md` entries.
