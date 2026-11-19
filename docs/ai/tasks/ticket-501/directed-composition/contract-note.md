# #501 directed-composition — contract note

## What this is

An **opt-in** explicit directed traversal mode added to the existing
pure `composeGeometryPath()` core (`api/_lib/winterRoute/geometryComposition.js`).
No `mode`/`policy` key at all → the function behaves **exactly** as
before (same object shape, same `geometryId`s — verified with a fixed
regression, see below). This is a mechanical core change only: it does
not introduce any inferred driving direction, does not change the
geometry-api endpoint/dataset/UI, and does not promote any result to
`SUPPORTED`/`ROUTABLE`.

## Input contract

```js
composeGeometryPath({
  crs, tier, lines, from, to,     // unchanged
  mode: "directed",               // omit entirely for the old undirected behavior
  policy: {
    policyVersion: <any defined value>,   // becomes part of the directed geometryId
    rules: [
      {
        sourceId: <number>,                 // must match a line's own sourceId to have any effect
        tier: <number>,                     // must equal input.tier, else invalid_policy
        direction: "forward"|"reverse"|"both"|"unknown"|"blocked",
        directionBasis: <non-empty string>, // required for forward/reverse/both only
      }, ...
    ],
  },
})
```

- `forward`/`reverse` are relative to the line's own **original source
  vertex order** (vertex `i -> i+1` is "forward") — never a compass
  direction, never inferred from `VEGHLUTI` or any other field.
- A line with **no rule at all**, or a rule of `unknown`/`blocked`,
  contributes **zero** traversable edges.
- `both` contributes both directions (same as the undirected graph
  would, for that one line only).
- An empty, valid policy (`rules: []`) is valid — it simply means no
  line contributes any edge, so almost everything resolves to
  `no_directed_path`.
- A rule for a `sourceId` that never appears in `lines` is still
  validated like every other rule (malformed → still `invalid_policy`),
  then has **zero effect** on the result or the `geometryId` once valid.
- A conflicting rule for the same `sourceId` (different `direction` or
  `directionBasis`) is always `invalid_policy` — never silently
  last-wins. An exact duplicate resubmission is harmless.

## Mode/policy gating (P2)

| `mode` | `policy` | Result |
|---|---|---|
| absent | absent | classic undirected behavior, unchanged |
| absent | present | `unsupported/invalid_mode` — never a silent undirected fallback |
| present, ≠ `"directed"` | any | `unsupported/invalid_mode` |
| `"directed"` | absent | `unsupported/invalid_policy` |
| `"directed"` | present but malformed | `unsupported/invalid_policy` |
| `"directed"` | present and valid | directed composition runs |

## Status/reason outcomes in directed mode

- `geometry_only` / `same_place` — carry `mode: "directed"`,
  `policyVersion`, `drivingAccess: "UNVERIFIED"`; each slice additionally
  carries `appliedRule` (the direction value that permitted it) and
  `directionBasis`.
- `no_directed_path` — no directed path exists under the given policy.
  **Never** `disconnected_graph` in directed mode (that reason is
  undirected-only).
- `endpoint_not_in_graph` — unaffected by policy: endpoint existence is
  checked against **every** input line's vertices regardless of
  direction permission, so a point with no rule (or `blocked`) is still
  a perfectly valid endpoint if it's a literal vertex of some line.
- `invalid_mode` / `invalid_policy` — rejected before any graph is built.

`reverseGeometryPath()` **rejects** any directed `geometry_only` result
with `unsupported/directed_result_not_reversible` (no `isReverseOf`) —
the permitted directions for the reverse query are not necessarily the
same, so the caller must compose again with `from`/`to` swapped and let
the real policy be re-evaluated in that direction. The undirected
helper is completely unchanged.

## Backwards compatibility (P4) — verified

- `GEOMETRY_COMPOSITION_VERSION` unchanged (still `1`).
- The undirected result object gets **no new keys** — a classic call
  with no `mode`/`policy` produces an object with none of `mode`,
  `policyVersion`, and no slice carries `appliedRule`/`directionBasis`.
- A **fixed real regression** is pinned in the test file: the real
  Selfoss→Hella undirected `geometryId`
  (`1e5ec24e068b90156c1c9b0ec1c00d39`, the same one reported from the
  real geometry-api round) is asserted unchanged.
- The same slices/length under a directed `"both"` policy covering
  every real sourceId used by that same path produce the **same**
  slices/length but a **different** `geometryId` — mode/policy are
  always part of the directed ID, so a directed result can never
  collide with its own undirected ID.

## Real example: the retained B2/36807 ring, forward-only (test-fixture hypothetical)

This uses the SAME retained tier-2 ring (IDFERILL 36807) and the same
two endpoints as the existing undirected B2 test, with a
**TEST_FIXTURE_HYPOTHETICAL**-labeled policy — explicitly NOT a claim
about real traffic law:

```js
composeGeometryPath({
  crs: "EPSG:3057", tier: 2,
  mode: "directed",
  policy: { policyVersion: "v1", rules: [
    { sourceId: 36807, tier: 2, direction: "forward", directionBasis: "TEST_FIXTURE_HYPOTHETICAL" },
  ]},
  lines: [...2117, 2134, 2135, 36807 at tier 2...],
  from: { placeId: "b2-a", x: 392674.357, y: 389846.132 },  // 2117's own end
  to:   { placeId: "b2-b", x: 392703.5,   y: 389865.057 },  // 2135's own end / 36807's own start
})
```

→ `geometry_only`, `lengthM: 72.54928752266883`, one slice
(`sourceId: 36807, fromIndex: 2, toIndex: 5, direction: "forward",
appliedRule: "forward"`) — the longer forward arc, never the shorter
40.406 m arc (which runs against the permitted direction).

Querying the **same two points in reverse** (B→A) under the identical
policy does **not** mirror the forward result — it independently finds
the OTHER forward-permitted arc around the ring (the short one, going
the other way): `geometry_only`, `lengthM: 40.40637511981366`, one
slice (`fromIndex: 0, toIndex: 2, direction: "forward"`). This is the
mechanical proof behind P6's reversal rule: reversing a directed result
is never the same as composing the reverse query for real.

## What this round does NOT do

- No runtime direction policy for any real place/corridor — every
  policy in this round's tests is either purely synthetic or explicitly
  `TEST_FIXTURE_HYPOTHETICAL`.
- No change to `api/winter-route-geometry.js`, `geometryDataset.js`, the
  runtime dataset, or any UI.
- No claim that any direction is legally driveable — `drivingAccess:
  "UNVERIFIED"` is present on every directed outcome too.
- Does not close ticket #501, does not promise a full ring, and is not
  "directed functionality" delivered to any user — it is a mechanical
  core capability only.


## Ripley leiðrétting við lokamat — 2026-11-18

PASS með óhindrandi CF1: fullyrðing um BYTE-IDENTICAL undirected-niðurstöður er of víð. detail-texti disconnected_graph breyttist úr 'given lines' í 'given lines/policy'; status/reason og staðfest eldri geometry-ID eru óbreytt. Sjá result-review.md, Ripley lokamat. Sjálfstætt Windows: focused 8 skrár/132 próf PASS, lint hreint og approachSelections 50/50 PASS (OP5 endurtekur sig ekki hér). Engin runtime-akstursheimild eða directed endpoint/UI afhent.
