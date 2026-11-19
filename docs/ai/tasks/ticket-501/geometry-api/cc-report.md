# #501 geometry-api — CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-501/geometry-api/approved-prompt-v1.md`
  (Jonesy APPROVED without blockers; Round1 + Jonesy's P1–P6 incorporated
  as binding execution notes).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-18.
- Scope: one new geometry-only backend endpoint + its own test file, one
  new small dataset-loader module + its own test file, one new generated
  `server_data` JSON file, one task-local offline build script, this
  ticket's own docs/`CURRENT.md`. No change to the existing winter-route
  routeId/forecast/road/cache/UI contract, no new dependency, no
  `vercel.json` change, no network, no GitHub action, no commit/push/
  deploy.

## Git state

- `git status --porcelain`: `docs/ai/CURRENT.md` (modified), plus new
  files only — `api/winter-route-geometry.js`, `api/winter-route-geometry.test.js`,
  `api/_lib/winterRoute/geometryDataset.js`, `api/_lib/winterRoute/geometryDataset.test.js`,
  `server_data/winter-route-geometry-pilot.json`, and this ticket's docs
  directory. The carried-over `api/_lib/winterRoute/geometryComposition.js`/
  `.test.js` (from the prior geometry-composition v1/v2 rounds) are listed
  but **untouched this round** — zero edits made to either file.
- `git diff --check`: clean.
- No `vercel.json` edit — `functions."api/**/*.js".includeFiles` already
  matches `server_data/**`, confirmed by inspection before starting (P4).

## What was built

1. **`docs/ai/tasks/ticket-501/geometry-api/build-pilot-dataset.mjs`**
   (task-local, one-off, not production/ETL) — reads the two already-
   retained raw WFS files (`docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json`,
   `docs/ai/tasks/ticket-493-place-data-phase2/samples/wfs93-raw.json`),
   filters tier 2, and writes `server_data/winter-route-geometry-pilot.json`.
   Run with: `node docs/ai/tasks/ticket-501/geometry-api/build-pilot-dataset.mjs`.
   Endpoints are derived programmatically from the lines themselves (R1 =
   line 1436's own last raw vertex, E1 = line 2344's own first raw vertex,
   S2 = line 2894's own last raw vertex) or from `place_nodes-v3.json`'s
   own retained `exit_coord` (Selfoss=2138, Hella=3591) — no cum-km or
   entry/exit re-derivation, matching the prior approved pinning exactly.
2. **`server_data/winter-route-geometry-pilot.json`** — the generated
   runtime dataset: `schemaVersion`, `normalizationVersion`, `crs`
   (`EPSG:3057`), `tier` (2), `sources` (2 raw files + their real
   SHA-256), `lines` (255, 946 vertices total — matches Jonesy's own
   prototype count exactly), `endpoints` (the 5 pilot places). Does
   **not** store its own `datasetVersion`.
3. **`api/_lib/winterRoute/geometryDataset.js`** — small loader. Reads
   the JSON (default path, or an injectable path for tests), validates
   CRS/tier/shape, throws on anything invalid, and computes
   `datasetVersion` fresh on every call as a SHA-256 over the canonical
   `{schemaVersion, normalizationVersion, crs, tier, lines, endpoints}`
   payload — never `Date.now()`/random, never a self-embedded hash. No
   module-level cache (no perf/cache requirement this round, P6) — the
   endpoint handler calls it once per request.
4. **`api/winter-route-geometry.js`** — the new
   `GET /api/winter-route-geometry?from=<id>&to=<id>` handler. Validates
   method (405 otherwise), validates `from`/`to` as required, non-empty,
   non-array, own-key strings that are one of the 56 known place IDs
   (400 otherwise, never echoing the submitted value). Looks up both IDs
   in the dataset's 5-place mapping; if either is unmapped, returns
   `200 unsupported/endpoint_mapping_unavailable` (including the
   `from === to` unmapped case — never a fabricated `same_place`, P6).
   If both are mapped, calls the unmodified `composeGeometryPath()` core
   and reshapes its `geometry_only`/`same_place`/`unsupported` result
   into the full response envelope, reconstructing the literal
   continuous `coordinates` line by re-walking each slice's own original
   vertex range (skipping the shared boundary vertex between consecutive
   slices, per P5) and joining `veghluti`/`name` onto each response slice
   by `sourceId` (P2, provenance pass-through only). `Cache-Control:
   no-store` on every response; dataset-load failure is a genuine `500`,
   never a silently-fabricated `200`.

## P1–P6 disposition

- **P1**: confirmed — all 5 pinned endpoints share one connected tier-2
  component, so every ordered pair among them resolves `geometry_only`
  (verified directly: R1↔Selfoss, R1↔Hella, Selfoss↔Hella, E1↔S2,
  R1↔E1, R1↔S2 all match Jonesy's cross-check numbers to high
  precision). The handler places no 3-pair allowlist — all 20 ordered
  pairs are reachable by construction, not individually enumerated,
  since the same unmodified composer is called for any two mapped
  endpoints. `disconnected_graph` is tested with an **injected synthetic
  two-line dataset** (via a scoped `loadGeometryDataset` mock), not a
  real pair, exactly as directed. One real long-pair integration test
  (R1→E1, ≈615.33 km, >100 slices) is included.
- **P2**: every response slice carries `veghluti`/`name` pass-through,
  joined by `sourceId` from the dataset's own lines — asserted present
  on every slice of the R1→E1 test. Never used in path selection; the
  core graph/Dijkstra logic was not touched.
- **P3**: build script is task-local, not production, documented above
  with its exact run command. `geometryDataset.test.js` independently
  regenerates the tier-2 line set straight from the retained raw files
  and compares count/IDFERILL-set/vertex-counts against the dataset —
  255 lines / 946 vertices confirmed both ways. `datasetVersion` is
  derived at load time (never stored in the file); a test mutates one
  **unrelated** line in a scratch copy and confirms `datasetVersion`
  changes while `geometryId` for an unaffected real path (Selfoss↔Hella)
  does not.
- **P4**: no `vercel.json` change — confirmed by inspection that
  `includeFiles: "server_data/**"` already covers the new file.
- **P5**: `lengthNote` present on every `geometry_only`/`same_place`
  response, stating this is tier-2 planar length, not a driving-distance
  contract. `coordinates` reconstruction skips the duplicate shared
  vertex at each slice boundary; each kept vertex's own source `z` is
  used as-is, never reconciled against a neighboring slice's `z` at the
  same XY.
- **P6**: `keflavik→keflavik` (known, unmapped) returns `unsupported/
  endpoint_mapping_unavailable`, not a fabricated `same_place` — tested
  explicitly. The schema-failure/500 test uses an injected synthetic bad
  fixture via `geometryDataset.js`'s path-override parameter, never a
  mutated real file. No caching/performance work done.

## One real handler invocation (full, unshortened)

`GET /api/winter-route-geometry?from=selfoss&to=hella`, run directly
against `handler()` with the real runtime dataset (no fetch/network
involved — same as the test suite's own integration tests):

```
STATUS: 200
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
    { "x": 401763.341, "y": 383097.896, "z": 0 },
    { "x": 403016.8402, "y": 383178.3789, "z": 0 },
    { "x": 403269.528, "y": 383219.0345, "z": 0 },
    { "x": 403311.95, "y": 383221.48, "z": 0 },
    { "x": 403312.1652, "y": 383220.1527, "z": 0 },
    { "x": 409876.57, "y": 383546.82, "z": 0 },
    { "x": 412695.54, "y": 383413.1, "z": 0 },
    { "x": 416754.8471, "y": 384396.104, "z": 0 },
    { "x": 417924.33, "y": 383198.92, "z": 46.332 },
    { "x": 418201.0836, "y": 382083.3222, "z": 46.273 },
    { "x": 418302.2477, "y": 381814.9441, "z": 46.509 },
    { "x": 419118.2, "y": 380594.77, "z": 0 },
    { "x": 421576.63, "y": 379444.2, "z": 0 },
    { "x": 422096.84, "y": 378358.05, "z": 0 },
    { "x": 426188.183, "y": 375928.946, "z": 0 },
    { "x": 429082.0653, "y": 374156.5108, "z": 0 },
    { "x": 430624.987, "y": 371832.0717, "z": 39.119 },
    { "x": 430713.0138, "y": 371613.8204, "z": 38.494 },
    { "x": 430968.963, "y": 370845.236, "z": 28.656 },
    { "x": 430970.875, "y": 370845.539, "z": 28.669 },
    { "x": 430972.1263, "y": 370845.6043, "z": 28.6819 }
  ],
  "slices": [
    { "sourceId": 8676, "idbutur": 902040037, "veghluti": 5, "name": "Þjórsá-Selfoss", "direction": "reverse", "fromIndex": 2, "toIndex": 1, "lengthM": 30.61215975723227, "evidenceRef": "wfs-vegnr1-all.json#IDFERILL=8676&OBJECTID=873&tier=2" },
    { "sourceId": 3737, "idbutur": 902040037, "veghluti": 1, "name": "Þjórsá-Selfoss", "direction": "reverse", "fromIndex": 2, "toIndex": 0, "lengthM": 1257.989862712669, "evidenceRef": "wfs-vegnr1-all.json#IDFERILL=3737&OBJECTID=985&tier=2" },
    { "sourceId": 3768, "idbutur": 902040037, "veghluti": 1, "name": "Þjórsá-Selfoss", "direction": "reverse", "fromIndex": 1, "toIndex": 0, "lengthM": 255.9374964326389, "evidenceRef": "wfs-vegnr1-all.json#IDFERILL=3768&OBJECTID=1362&tier=2" },
    { "sourceId": 3454, "idbutur": 902040037, "veghluti": 5, "name": "Þjórsá-Selfoss", "direction": "reverse", "fromIndex": 2, "toIndex": 0, "lengthM": 43.83706179018695, "evidenceRef": "wfs-vegnr1-all.json#IDFERILL=3454&OBJECTID=966&tier=2" },
    { "sourceId": 3767, "idbutur": 902040037, "veghluti": 1, "name": "Þjórsá-Selfoss", "direction": "reverse", "fromIndex": 3, "toIndex": 0, "lengthM": 13571.301521314663, "evidenceRef": "wfs-vegnr1-all.json#IDFERILL=3767&OBJECTID=1361&tier=2" },
    { "sourceId": 3781, "idbutur": 902040037, "veghluti": 1, "name": "Þjórsá-Selfoss", "direction": "reverse", "fromIndex": 3, "toIndex": 0, "lengthM": 3109.825924464082, "evidenceRef": "wfs-vegnr1-all.json#IDFERILL=3781&OBJECTID=809&tier=2" },
    { "sourceId": 3613, "idbutur": 901130037, "veghluti": 1, "name": "Hella-Þjórsá", "direction": "reverse", "fromIndex": 4, "toIndex": 0, "lengthM": 10144.61854996041, "evidenceRef": "wfs-vegnr1-all.json#IDFERILL=3613&OBJECTID=1520&tier=2" },
    { "sourceId": 3614, "idbutur": 901130037, "veghluti": 1, "name": "Hella-Þjórsá", "direction": "reverse", "fromIndex": 1, "toIndex": 0, "lengthM": 3393.535222220677, "evidenceRef": "wfs-vegnr1-all.json#IDFERILL=3614&OBJECTID=640&tier=2" },
    { "sourceId": 3615, "idbutur": 901130037, "veghluti": 1, "name": "Hella-Þjórsá", "direction": "reverse", "fromIndex": 2, "toIndex": 0, "lengthM": 3025.2493277167373, "evidenceRef": "wfs-vegnr1-all.json#IDFERILL=3615&OBJECTID=984&tier=2" },
    { "sourceId": 3591, "idbutur": 901130037, "veghluti": 1, "name": "Hella-Þjórsá", "direction": "reverse", "fromIndex": 3, "toIndex": 0, "lengthM": 813.2703231222372, "evidenceRef": "wfs-vegnr1-all.json#IDFERILL=3591&OBJECTID=926&tier=2" }
  ]
}
```

(`GET ...?from=selfoss&to=keflavik` and other contract examples are in
`contract-note.md`.)

## Verification performed

- **Real `npx vitest run`** (focused set, all passed for real — no
  shim, same working environment as the just-completed geometry-
  composition v2 round):
  `api/winter-route-geometry.test.js` (20), `api/_lib/winterRoute/geometryDataset.test.js`
  (11), `api/_lib/winterRoute/geometryComposition.test.js` (50, untouched
  this round), `api/winter-route.test.js` (existing fixed-route suite,
  untouched), `api/_lib/winterRoute/routes.test.js`,
  `api/_lib/winterRoute/segments.test.js`, `api/_lib/winterRoute/cache.test.js`,
  `src/lib/winterRouteRoutes.test.js` — **8 files, 101/101 tests pass.**
- `npx eslint` on every new file (`winter-route-geometry.js`/`.test.js`,
  `geometryDataset.js`/`.test.js`, `build-pilot-dataset.mjs`) — clean.
- No stub/mock bypass on the integration tests (R1→Selfoss, R1→Hella,
  E1→S2, R1→E1, same_place, reverse, stable-identity) — all go through
  the real handler, the real dataset loader, and the real composer.
  Only the disconnected-graph and loader-failure tests use a scoped
  mock, exactly as directed.
- `git status --porcelain` / `git diff --check` — confirmed clean scope
  (see "Git state" above); the carried-over geometry-composition files
  are present but unedited this round.
- No live/production network call made to "test" anything — every test
  runs the handler function directly in-process.

## Limits / not done here (unchanged from contract-note.md)

5/56 places mapped; single fixed tier-2 pilot cut; no UI entry point;
not wired into `#502`/`#503`; `veghluti`-based one-way role is
provenance only, not enforced or flagged as a traversal constraint.
This does not close ticket #501 and does not promise a full ring or
all 56 places.


## Ripley clarification — 2026-11-18

Composition-suite count above labelled50 is a reporting typo: geometryComposition23, geometryDataset11, geometry API20, old winter-route20, cache9, routes12, segments3, frontend-route3 =101 across8 files. Independently rerun by Ripley:101/101 PASS, ESLint clean. No application change or extra hardening round.
