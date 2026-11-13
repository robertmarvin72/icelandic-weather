# #499 — Reykjavík approach candidate for R1

**Status: `PROPOSED_AWAITING_OWNER_SELECTION`.** Not yet approved for
R1. Resolved entirely from retained data — no new network call was
needed (see "Why no call was made" below). Full detail/citations:
`candidate.json`.

## Candidate: Rauðavatn (IDFERILL 1436, IDBUTUR 1410010037)

- **Name**: "Rauðavatn - Nesjavallaleið" — the server's own
  `STUTTNAFNLEIDAR` field (`wfs-vegnr1-all.json`), not informal prose.
- **Coordinates**: 64.10152894, -21.75906405 (western end) — server-
  returned WGS84 (`srsName=EPSG:4326` in the original request), never
  an offline reprojection. Retained in `wfs-chain-4326.json`,
  confirmed identical across all 4 precision tiers.
- **Native reference**: EPSG:3057 (365522.0175, 402772.762) — the same
  physical point also appears, under a *different* ID scheme
  (`road-links.csv`'s own "piece 1436"), in
  `ticket-493-access-points/endpoint-candidates-v3.json` — two
  independent retained datasets agree.

## Connections — both ring directions

**Toward Vík (clockwise)** — **VERIFIED**: real, measured ISN93
adjacency (`ticket-483/harness/01_chain_geometry_check.py`):
`1410010037 → 903010037: 0.0m`, continuing with every consecutive pair
under 100m for the full 13-segment chain. This exact chain is the
**live, shipped production route** (`api/_lib/winterRoute/segments.js`,
ticket #486) — real usage, not only a geometric claim.

**Toward Reykjavík city / the Kjalarnes–Borgarnes fork
(counterclockwise)** — connectivity itself is **VERIFIED**, but the
exact through-route arc is **UNKNOWN**, not just unmeasured:
`1410010037 → 914020037: 1.3m → 903020037: 10.8m → 903030037
("Kjalarnes"): 20.9m` (same harness script). `914020037`/`903020037`
are themselves multi-ramp/roundabout interchange features — the
harness's own conclusion is "connectivity CONFIRMED, length NOT
COMPUTED." A *separate*, independently-measured check in
`ticket-491/evidence-owner-scope-2026-11-04.md` (item O5, using the
place-network dataset's own piece/roundabout IDs — not IDFERILL)
found similarly close distances to a nearby roundabout and reached
the same conclusion in its own words: **"Nákvæm leiðarstefna og
bogaval áfram óleyst"** (exact route direction and arc selection
remain unresolved). Two independent retained sources agree the point
really is connected in this direction; neither resolves which exact
ramp/arc is "the" through-route.

**Driving access, both directions: `EXACT_GAP`** — unchanged from the
rest of `endpoint-registry.json`. Nothing retained or acquired
anywhere in this dataset encodes one-way/direction/permission.

## Why no new network call was made

Step 1 of the approved prompt asks to check retained data first and
skip new calls if it already gives one traceable candidate meeting
the goal. It does: a real name, real server-returned coordinates, and
a documented (not guessed) connection state in both directions. The
two authorized GET calls (`vegleid_stadur` place names;
`faerdferlar2017_1` BBOX) would not have resolved the one remaining
gap here (which interchange arc is "the" through-route) — that is a
route-design question, not a missing-data gap a GET request can
answer. If the owner wants a fresh, independent re-measurement of
either junction (rather than relying on the retained #483/#491 work
cited above), that is what those two calls remain available for in a
future round.

## Important: this is not already an R1 approval

The owner approved Rauðavatn on 2026-11-04 as the start point of a
**different, already-shipped product** — the #486/#491 Rauðavatn–Vík
winter route. That is real, strong precedent (same point, same
coordinates, already running), but `endpoint-candidates-v3.json`
(2026-11-11, a week later) still calls this point an "unselected
comparison candidate" for the `#493`/`#499` R1 purpose specifically.
**This candidate asks the owner to decide whether to extend that same
approval to R1 too — it does not assume that decision is already
made.**

## Next owner decision (smallest, not executed here)

Approve (or decline) Rauðavatn/`IDBUTUR 1410010037` as R1 for `#499`'s
own Frá/Til purpose, explicitly separate from its existing `#491`
approval. If approved, the Kjalarnes/Borgarnes-direction "which arc"
question (above) is a smaller follow-up, not a blocker to naming R1 —
the candidate can be delivered with that one open item clearly
labelled, exactly as this document already does.
