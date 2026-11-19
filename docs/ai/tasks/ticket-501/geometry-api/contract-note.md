# #501 geometry-api — contract note

## What this is

`GET /api/winter-route-geometry?from=<place-id>&to=<place-id>` — a new,
separate, **geometry-only** backend entry point (`api/winter-route-geometry.js`).
It is not wired into the existing `api/winter-route.js` routeId/forecast/
road/cache contract, not wired into any UI, and not a driving-direction
or legal-access authority. Every response carries `drivingAccess:
"UNVERIFIED"` permanently.

## The 5-mapping pilot vs. the 56-place list

The full 56-place `server_data/winter-route-places.json` list is used
as-is to validate `from`/`to` — every one of the 56 is a real, known,
valid place ID. Only **five** of them have a real native coordinate
mapping in this pilot round: `reykjavik-raudavatn`, `selfoss`, `hella`,
`egilsstadir`, `seydisfjordur`. The other **51** return `unsupported` /
`endpoint_mapping_unavailable` — never a 400, and never "place does not
exist". This is a first backend pilot for 5 endpoints, not an approved
reduction to 5 places, and not a promise the other 51 will ever be
mapped.

## Status codes

- `200` — for every *known-identity* outcome: `geometry_only`,
  `same_place`, and `unsupported` (including the 51 unmapped places and
  a genuinely disconnected graph). An "unsupported but known" answer is
  not an HTTP error.
- `400` — missing/empty/array(repeated)/non-string `from` or `to`, or a
  value that is not one of the 56 known place IDs. Never echoes the
  submitted string.
- `405` — method other than `GET`.
- `500` — the pilot dataset failed to load or failed its own schema
  check. Never silently downgraded to a `200 unsupported`.

## Response envelope (every outcome)

```
schemaVersion, datasetVersion, compositionVersion, from, to, crs, tier,
drivingAccess: "UNVERIFIED", status, (reason if unsupported)
```

`geometry_only` / `same_place` additionally carry: `geometryId`,
`lengthM`, `lengthNote` (tier-2 planar length, not a driving-distance
contract), `coordinates` (the literal, continuous XY(Z) line,
reconstructed from the source slices — no docs access needed to use
the response), and `slices` (`sourceId`, `idbutur`, `veghluti`, `name`
pass-through provenance, `direction`, `fromIndex`/`toIndex`, `lengthM`,
`evidenceRef`).

`veghluti`/`name` are **provenance pass-through only** — never used in
path selection, never a traversal-direction constraint (P2).

## Real example invocation

`GET /api/winter-route-geometry?from=selfoss&to=hella` (real handler
run against the real runtime dataset, JSON shortened — full output in
`cc-report.md`):

```json
{
  "schemaVersion": 1,
  "datasetVersion": "f64c379cd8d029922c705bb14a9fa61b0f340358aa29235a7bf4cd639858f92a",
  "compositionVersion": 1,
  "from": "selfoss",
  "to": "hella",
  "crs": "EPSG:3057",
  "tier": 2,
  "drivingAccess": "UNVERIFIED",
  "status": "geometry_only",
  "geometryId": "1e5ec24e068b90156c1c9b0ec1c00d39",
  "lengthM": 35646.17744949154,
  "lengthNote": "Tier-2 planar geometry length (EPSG:3057) -- not a driving-distance contract.",
  "coordinates": [
    { "x": 401739.85, "y": 383119.047, "z": 0 },
    { "x": 401763.64, "y": 383099.782, "z": 0 },
    "... 19 more points ...",
    { "x": 430972.1263, "y": 370845.6043, "z": 28.6819 }
  ],
  "slices": [
    { "sourceId": 8676, "idbutur": 902040037, "veghluti": 5, "name": "Þjórsá-Selfoss", "direction": "reverse", "fromIndex": 2, "toIndex": 1, "lengthM": 30.61215975723227, "evidenceRef": "wfs-vegnr1-all.json#IDFERILL=8676&OBJECTID=873&tier=2" },
    "... 8 more slices ..."
  ]
}
```

## Known-but-unmapped example

`GET /api/winter-route-geometry?from=selfoss&to=keflavik` →

```json
{
  "schemaVersion": 1, "datasetVersion": "...", "compositionVersion": 1,
  "from": "selfoss", "to": "keflavik", "crs": "EPSG:3057", "tier": 2,
  "drivingAccess": "UNVERIFIED",
  "status": "unsupported", "reason": "endpoint_mapping_unavailable"
}
```

## Dataset

`server_data/winter-route-geometry-pilot.json` — generated offline by
`docs/ai/tasks/ticket-501/geometry-api/build-pilot-dataset.mjs` (task-
local, one-off; run with `node docs/ai/tasks/ticket-501/geometry-api/build-pilot-dataset.mjs`).
255 lines / 946 vertices at tier 2 (249 VEGNR=1 + 6 VEGNR=93), read
straight from the already-retained raw WFS files — no new network
access. The file stores `schemaVersion`/`normalizationVersion`/`crs`/
`tier`/`sources` (raw file + SHA-256)/`lines`/`endpoints`; it does
**not** store its own `datasetVersion` — that is a canonical-content
hash computed at load time by `api/_lib/winterRoute/geometryDataset.js`
over the normalized runtime contract.

No `vercel.json` change was needed — `functions."api/**/*.js".includeFiles`
already matches `server_data/**`.

## Limits of this round

- Only 5/56 places have a real mapping; the dataset is the same fixed
  tier-2 pilot cut for every query (no per-query tier selection).
- No UI entry point, no wiring into `#502`/`#503`, no road/forecast/
  upstream fetch, no caching framework beyond `Cache-Control: no-store`.
- `veghluti`/`name` are source metadata only — the underlying path is
  still entirely undirected; a `reverse`-direction slice against a
  one-way `VEGHLUTI` role is not flagged or blocked here (P2 — an
  inferred pattern, not confirmed traffic law).
- This does not close ticket #501, does not promise a full ring, and
  does not promote any place to `SUPPORTED`/`ROUTABLE`.
