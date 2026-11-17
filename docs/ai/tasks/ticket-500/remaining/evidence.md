# #500 — combined review of the 47 remaining places

Full per-place detail (candidate/road-identifier/name-mention references,
source citations, exact gap text) is in
`server_data/winter-route-remaining-coverage.json#coverage` — this file is
the short summary the approved prompt asks for, not a restatement of all 47
JSON entries.

## Totals

- **56** owner-approved places total — unchanged, same names/ids/order/aliases.
- **9** already resolved in earlier rounds (R1/E1/S2/C + the 5 south-corridor
  candidates) — untouched, not re-assessed this round.
- **47** reviewed this round, now split into:
  - **4** have a retained **NAME_MATCH_INFERRED** candidate point (native
    coordinates, real IDFERILL/piece): Borgarnes, Reykjahlíð (Mývatn),
    Reyðarfjörður, Fáskrúðsfjörður.
  - **39** have a retained **road-condition identifier** (IDBUTUR + name)
    that names or serves the place, but **no geometry/coordinate** in any
    retained file checked.
  - **1** (Kirkjubæjarklaustur) has only an **INFERRED text mention** inside
    another piece's description — not a dedicated node.
  - **3** (Keflavík, Skaftafell, Þórshöfn) have no usable approach or road-identifier match established in the checked sources. This is a bounded search result, not proof of global absence.

No place was marked `SUPPORTED`/`routable`. `coordinates`/`approach` stay
`null` for all 47 in `winter-route-places.json`; every new candidate
coordinate lives only in `winter-route-remaining-coverage.json`, clearly
labeled `APPROACH_CANDIDATE`-style (not an owner selection).

## Grouped gap list — next action per group

| Group | Places | What's missing | Next action | Action type |
|---|---|---|---|---|
| **G1 — NAME_MATCH_INFERRED candidates** | Borgarnes, Reykjahlíð (Mývatn), Reyðarfjörður, Fáskrúðsfjörður | Owner has not selected any of these; Reyðarfjörður/Fáskrúðsfjörður/Reykjahlíð also lack a retained WGS84 file for their native point (Borgarnes alone has WGS84, reused from `#491`'s own end-of-chain point) | Owner decision on whether to accept each NAME_MATCH_INFERRED point; for the three without WGS84, a scoped WGS84 lookup would still be needed afterward | Owner decision, then (for 3 of 4) a small scoped data step |
| **G2 — road-identifier only, no geometry (39 places)** | Everything in `winter-route-remaining-coverage.json` tagged `ROAD_IDENTIFIER_RETAINED_NO_GEOMETRY` (see that file for the full list/IDBUTUR per place) | A named road-condition record exists (`vegagerdin-faerd2017-1.json`/`legacy-faerd-fresh.json`), but neither file carries coordinates — confirmed by checking both files' own field lists | A future round would need a scoped WFS `GetFeature` lookup (by the cited IDBUTUR/road name) to find real geometry, the same kind of bounded call used for R1/E1/S2/C/the south corridor | New scoped data acquisition (not owner decision) |
| **G3 — name mention only** | Kirkjubæjarklaustur | Only one other piece's description mentions the name; no dedicated node or road-identifier record found this round | Same as G2 — a scoped geometry lookup, likely starting from the same retained stem-hint piece (1964) as a search anchor | New scoped data acquisition |
| **G4 — no usable match established (3 places)** | Keflavík, Skaftafell, Þórshöfn | No usable place approach/geometry or road-condition identifier established in the checked sources; existing inventory/name records alone are not a connection | A scoped source check/acquisition is needed; no global absence is claimed | New scoped check/acquisition |

Per approved-prompt-v1.md's own instruction, none of these four groups
starts new acquisition work in this round — they are the precise next step
for whoever picks this up next, not a new prompt written here.

## Ripley correction NF1 — 2026-11-14

Hafnarfjörður (814640037/914500037), Mosfellsbær (903040037/903050037) and KEF (341190037) have retained road-condition identifiers, verified directly in the retained feed files. They are now in G2; geometry/place approach remains unverified. Lists of road-condition identifiers are indicative, not exhaustive, and name association alone does not prove a town connection. Updated totals: 4 candidates + 39 identifier-only + 1 mention-only + 3 no-usable-match = 47.
