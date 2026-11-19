# #501 Rauðavatn ↔ Selfoss MVP — assumptions

All of this is `directionBasis: "OWNER_APPROVED_MVP_ASSUMPTION"` —
a simple, visible, owner-approved MVP assumption, **never** an official
Vegagerðin confirmation of real traffic direction (see
`direction-authority/authority-report.md`: no such confirmation exists
for this corridor).

## VEGHLUTI → direction

| VEGHLUTI | MVP direction | Reasoning |
|---|---|---|
| 1, 8 | `both` | Ordinary two-way Hringvegur carriageway. |
| 3, 4, 6, 7 | `forward` | Follows the piece's own digitized vertex order. **7 ("against kaflastefna") is deliberately NOT auto-flipped to `reverse`** just because of its name — see `direction-authority/authority-report.md`'s own caution that this name is not a confirmed traffic-direction authority. |
| 5 (roundabout) | `forward` | Retained rings are drawn counterclockwise; `forward` follows one continuous traversal to the correct exit in this pilot. |
| anything else | *(no rule)* | Treated as "missing" by the core — contributes zero edges. Never silently authorized. In practice every one of the 255 lines in this corridor's own dataset already falls into {1,3,4,5,6,7,8}, so this case does not currently occur here. |

## The one estimated connector

- 2021's own end (369314.313, 400649.381) ↔ the shared 1735/2071 node
  (369350.3714, 400623.7933) — 44.214687625802 m, one-way (`forward`,
  2021-end → 1735-node only).
- Reserved synthetic `sourceId: -1` — never an `IDFERILL`, never a
  fabricated `idbutur` (always `null`), `evidenceRef` is the literal
  marker `"pilot-connector:estimated"`.
- Used only in the two directed API calls for this exact pair — never
  written into the shared `winter-route-geometry-pilot.json`.
- Per-slice: marked `estimated: true` in the API response; its own
  length is additionally reported as `estimatedConnectorLengthM` in the
  response envelope.

## Not a traffic-law claim

`drivingAccess: "UNVERIFIED"` is present on every response from this
pilot, same as every other geometry-api result. This MVP makes a
*visible, labeled, reversible* assumption so a working two-direction
pilot can exist — it does not claim legal confirmation, and it does not
promote any place to `SUPPORTED`/`ROUTABLE`.
