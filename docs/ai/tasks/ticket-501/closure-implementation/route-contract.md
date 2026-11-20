# /api/winter-route-geometry -- response contract by surface (ticket #501 step 2)

This documents which fields exist on which surface's response, and the
contract differences between surfaces discovered/confirmed while building
this round's own two new branches. It is informational, not a spec change --
no existing surface's behavior was altered.

## Surfaces

1. **Ring-pilot pairs** (Rauðavatn/Selfoss/Hella, Egilsstaðir/Seyðisfjörður) -- oldest surface.
2. **Vegur 93** (Egilsstaðir<->Seyðisfjörður) -- same shape as ring-pilot.
3. **The eight existing specific Westfjords branches** (junction-1-60-baulan<->budardalur, budardalur<->flokalundur, flokalundur<->isafjordur, isafjordur<->holmavik, junction-1-68-stadarskali<->holmavik, junction-60-61-throskuldar<->holmavik, flokalundur<->patreksfjordur, patreksfjordur<->talknafjordur) -- each its own dedicated region dataset + branch.
4. **This round's 10 new cross-leg pairs** (combined region, `isWestfjordsCombinedPair`).
5. **`same_place`** (any surface, including this round's own 6 new ids).
6. **`unsupported`** (reasons: `endpoint_mapping_unavailable`, `disconnected_graph`).

## Field presence by surface

| Field                       | Ring-pilot/vegur93 | 8 existing Westfjords | 10 new combined pairs | same_place | unsupported |
| ---------------------------- | :-: | :-: | :-: | :-: | :-: |
| `schemaVersion`              | yes | yes | yes | yes | no |
| `compositionVersion`         | yes | yes | yes | yes | no |
| `datasetVersion`             | yes (ring/vegur93 use the single shared `geometryDataset.js`) | **no** | **no** | no | no |
| `regionVersion`              | no | yes (per-region, own loader) | yes (combined region's own hash) | yes | no |
| `mode`                       | yes (ring-pilot only, legacy field) | **no** | **no** | no | no |
| `status`                     | yes | yes | yes | yes | yes |
| `geometryId`                 | yes | yes | yes | yes (hash of `same_place:${id}:...`, distinct scheme) | no |
| `lengthM`                    | yes | yes | yes | `0` (literal) | no |
| `lengthNote`                 | yes | yes | yes (assembled per-result, see below) | yes (fixed same-point text) | no |
| `estimatedConnectorLengthM`  | n/a (no connectors on that surface) | only B–F, F–P, P–T; omitted by the other five old branches | yes (0 if none used) | `0` (literal) | no |
| `via`                        | yes (ring-pilot's own fixed list) | yes (own fixed list) | yes (own longer fixed list, see below) | `[]` | no |
| `idButurIds` (top-level array) | n/a | yes | yes | `[]` | no |
| `slices[].idbutur` (per-slice) | yes | yes | yes | `[]` (no slices) | no |
| `accessApproach`             | no | yes (shape varies by pair -- single-object for same-region-pair branches, keyed-by-placeId for multi-endpoint pairs like patreksfjordur<->talknafjordur) | yes, always keyed by `{[from]: {...}, [to]: {...}, note}` | yes, keyed by `{[id]: {...}, note}` | no |
| `coordinates`                | yes | yes | yes | `[{x, y, z}]` (single point) | no |
| `slices`                     | yes | yes | yes | `[]` | no |
| `FORECAST_POINTS` association | Vík/Borgarnes only (unrelated subsystem, not part of this endpoint's own response body) | n/a | n/a | n/a | n/a |

## `via` direction-reversal contract difference (not fixed, documented only)

- **This round's 10 new combined pairs**: `via` is computed independently per
  request direction by walking `result.slices` in that direction's own real
  travel order and recording each candidate name's first occurrence. This
  means the reverse direction's `via` array is the exact reverse of the
  forward direction's `via` array (confirmed for all 10 pairs, both
  directions, in `api/winter-route-geometry.test.js`).
- **The 8 older Westfjords branches**: reverse-of-forward is not a general guarantee. B–J60, B–F, I–H, J68–H and F–P return the same via order in both directions. Existing branches remain unchanged.
- **Conclusion**: reverse-equals-reverse-of-forward is a confirmed contract
  for the 10 new pairs specifically. Treat it as a per-branch property, not
  a global guarantee, until/unless a future round audits and asserts it for
  every branch.

## `lengthNote` assembly (10 new combined pairs)

Built from sentences conditionally appended based on what is actually present
in that specific result's own `slices` (never copy-pasted from another
pair):

1. Fixed tier-0/EPSG:3057 opening sentence (always).
2. Connector -4 sentence (~5mm Búðardalur<->Flókalundur gap) -- only if `-4` is in `slices`.
3. Connector -5 sentence (~4.39m Patreksfjörður approach gap) -- only if `-5` is in `slices`.
4. Roundabout 3834 sentence, reading the real `slice.direction` for 3834 on that specific result -- only if `3834` is in `slices`.
5. Tálknafjörður coverage-gap sentence -- only if `talknafjordur` is `from` or `to`.
6. Kleifaheiði/Brjánslækur ferry-out-of-scope sentence -- only if any of a fixed `ROAD_62_CORRIDOR_SOURCE_IDS` set is present.
7. Fixed closing "no claim about winter closure..." sentence (always).

## `via` candidate list (10 new combined pairs)

Longer than any single older branch's own list, since this corridor spans
every earlier round's own via vocabulary: `Gilsfjörður, Þorskafjörður,
Klettsháls, Þröskuldar, Brjánslækur, Kleifaheiði, Dýrafjarðargöng,
Miklidalur`. Matched by substring against each slice's own real `name`
field (never `idbuturName`), first-occurrence-in-travel-order only, same
established pattern as every earlier branch.

## `same_place` -- two surfaces with different fields

`same_place` exists for two different id groups via two different code
paths with different envelopes:

- The 5 ring-pilot ids (selfoss, hella, reykjavik-raudavatn, egilsstadir,
  seydisfjordur) -- existing, general-purpose same_place handling keyed off
  `KNOWN_PLACE_IDS`.
- This round's own 6 Westfjords ids (budardalur, flokalundur, isafjordur,
  holmavik, patreksfjordur, talknafjordur) -- a dedicated
  `isSupportedWestfjordsSamePlace` branch, checked before the general
  `KNOWN_PLACE_IDS` gate (so it also catches `flokalundur`, which the
  general gate's own list does not include).

Both produce lengthM 0, empty slices and a single coordinate. The old ring-pilot same_place uses its datasetVersion/tier-2 envelope (z can be null); the new six-endpoint response uses regionVersion/tier 0, real endpoint z, via/idButurIds empty arrays, estimatedConnectorLengthM 0 and keyed accessApproach. Do not infer those extra fields exist on the old surface.

## Junction ids remain permanently excluded

`junction-1-60-baulan`, `junction-1-68-stadarskali`, `junction-60-61-throskuldar`
are never added to `KNOWN_PLACE_IDS`, never added to
`WESTFJORDS_SAME_PLACE_IDS`, and never added to
`WESTFJORDS_COMBINED_ALLOWLIST` -- confirmed by this round's own tests. Any
pair involving one of them outside its own existing specific branch falls
through to the general gate and returns `400 unknown_place_id`.

## Ring options and legacy fields

Rauðavatn↔Selfoss/Hella expose options and selectedOption (south/north), with policyVersion/mode where supplied by that surface. Other ring-pilot/93 pairs do not automatically offer those options. Consumers must use the actual surface envelope; this round adds no normalization or live weather/road retrieval.
