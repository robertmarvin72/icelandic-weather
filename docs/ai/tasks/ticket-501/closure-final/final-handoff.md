# #501 final-handoff — step 3 closure/handoff to #502 and #503

Documentation-only round. No code, runtime JSON, prior prompt, or prior
final assessment was changed. Only new files under `closure-final/` plus
the `CURRENT.md` workflow entry. This is a closure/handoff summary, not a
new implementation or a new map-review loop (owner already approved the
combined map in closure-implementation; CURRENT → CLOSED for that step).

## 1. Final acceptance-condition table (#501's eight conditions)

Status values used: **uppfyllt** (met) / **að hluta** (partial) /
**ekki sannreynt** (not verified) / **handoff til 502/503**. No row is
marked PASS on "no diff / was green before" alone — every row cites a
real file/test/response.

| # | Condition | Status | Evidence |
| - | --- | --- | --- |
| 1 | Stable route id/version, start/end, selected option, ordered geometry/road-sections and weather/road-closure attachment points | **að hluta** | `schemaVersion`/`compositionVersion`/`regionVersion` (or `datasetVersion`/`policyVersion` on ring-pilot) are stable and present on every surface; `from`/`to`/`selectedOption`/ordered `slices`/`idButurIds` are met (`api/winter-route-geometry.test.js`, confirmed live below). **Weather attachment points do not exist on geometry routes** — only the separate fixed Vík/Borgarnes surface has `FORECAST_POINTS`. `idButurIds`/`slices[].idbutur` are the intended future road-closure attachment surface for #503, not a weather attachment point. Not a defect — scoped as handoff. |
| 2 | Reykjavík–Selfoss/Hella: correct short route and the other ring-road option where data allows | **uppfyllt** | Live-confirmed this round: `reykjavik-raudavatn→selfoss` default `selectedOption: "south"`, 44984.77037809235 m; `option=north` → `selectedOption: "north"`, 1236038.3222104264 m. Both exact matches to Jonesy's cross-check figures (deviation threshold >0.05 m was not hit). Tests: `geometryComposition.test.js` ("R1->Selfoss", "R1->Hella"), `raudavatnSelfossMvpPolicy.test.js`, `raudavatnSelfossNorthOption.test.js`. |
| 3 | Egilsstaðir–Seyðisfjörður: direct vegur 93, no unnecessary loop | **uppfyllt** | Direct road93 forward/reverse handler cases are in `winter-route-geometry.test.js` lines 177–208 (including the reverse sourceId chain); covered additionally inside `winter-route-geometry.test.js`, `geometryComposition.test.js`, `geometryDataset.test.js` (egilsstadir/seydisfjordur cases). Confirmed in this round's own focused run (see §3). |
| 4 | Reverse direction swaps slice order/roles correctly, driving direction honestly scoped, `same_place` clear | **uppfyllt** | Ring-pilot/core reversal is also covered in `geometryComposition.test.js` line 442 and the road93 handler comparisons at lines 204–208. All 10 new Westfjords pairs: reverse is the exact reverse sourceId chain, same length, different `geometryId` (`api/winter-route-geometry.test.js`). `same_place` exists for 11 ids total (5 ring-pilot + 6 Westfjords) via two different code paths/envelopes (`route-contract.md`, already corrected this round's own predecessor). `drivingAccess: "UNVERIFIED"` on every geometry response — never a driving-condition claim. |
| 5 | Ring closure/sourceId 1436/shared segments never double-counted | **uppfyllt** | Tested in `geometryComposition.test.js`, not in handler-level tests: `"R1->Selfoss: a real, fully-connected geometry_only path exists at tier 2, length independently verified by summing the returned slices' own adjacent vertices, and ends at 2138's own pinned exit_coord (JK1)"` (line 367; the 1436 assertion is inside this test) and `"R1->Hella: a real, fully-connected geometry_only path exists at tier 2; IDFERILL 2138 legitimately occurs in two NON-adjacent slices, is never merged or double-counted, and ends at 3591's own pinned exit_coord (JK1)"` (line 392). Also `geometryDataset.test.js` covers dataset-level edge uniqueness. |
| 6 | Broken graph / unconfirmed connection returns `unsupported`/data-gap, never a fabricated route | **að hluta** | Confirmed at **core/loader level only**, not at the HTTP handler level: `westfjordsCombinedRegionDataset.test.js` lines 286 ("P4 (negative, a): removing -5 makes B/I/H<->P return unsupported disconnected_graph; the other seven pairs are unaffected") and 308 ("P4 (negative, b): removing -4 makes the real core return a WRONG, longer geometry_only path ... not unsupported"). No test calls the actual exported handler with a mocked/stripped combined dataset to prove the same at the handler layer (the handler-level `disconnected_graph` test in `winter-route-geometry.test.js` line 1730 uses a synthetic two-line dataset on the *general* `geometryDataset.js` mock, not the Westfjords combined loader). This is a real, named gap, not fixed here (P9: document, do not implement). |
| 7 | Targeted tests on options/both directions/shared connecting roads/closure/reversal/same-place/data-gap; closure handling as in §4 below | **að hluta** | Options/both-directions/shared-roads/reversal/same_place: uppfyllt, see rows 2/4/5 and §3's 431/431 run. Closure: **no geometry test exercises closure at all** (by design — geometry-only API). Closure classification is tested only on the fixed-route surface (`roadConditionCodes.test.js`, `roadFetch.test.js`, `winter-route.test.js`), confirmed passing in this round's own run, never on a geometry response. |
| 8 | Prior fixed routes still work, or a verified migration; no migration happened here | **uppfyllt** | `winter-route.test.js` + `routes.test.js` pass in this round's own 431/431 run (§3); no fixed-route code was touched this round or in closure-implementation. No migration occurred, so "verified migration" does not apply. |

## 2. Confirmed valid delivery set (not the old closure-scope note)

Derived from the current `api/winter-route-geometry.js` branches and
`server_data/*westfjords*` + the ring/vegur-93 datasets, cross-checked
against Jonesy's own P2 sandbox list (all matched exactly, no deviation):

- **Ring-pilot (10 unordered / 20 directed):** egilsstadir↔hella,
  egilsstadir↔reykjavik-raudavatn, egilsstadir↔selfoss,
  egilsstadir↔seydisfjordur, hella↔reykjavik-raudavatn, hella↔selfoss,
  hella↔seydisfjordur, reykjavik-raudavatn↔selfoss,
  reykjavik-raudavatn↔seydisfjordur, selfoss↔seydisfjordur (including the
  long cross-ring pairs, e.g. reykjavik-raudavatn↔seydisfjordur).
- **Westfjords place pairs (15 unordered / 30 directed):** 5 older (B–F,
  F–I, I–H, F–P, P–T) + 10 new (B–H, B–I, B–P, B–T, F–H, F–T, I–P, I–T,
  H–P, H–T).
- **Junction pairs (3, exact pairs only, no general junction network):**
  budardalur↔junction-1-60-baulan, holmavik↔junction-1-68-stadarskali,
  holmavik↔junction-60-61-throskuldar. Junction ids in any other pair =
  `400 unknown_place_id` (live-confirmed this round for
  junction-1-60-baulan↔isafjordur, junction-1-68-stadarskali↔patreksfjordur,
  junction-60-61-throskuldar↔talknafjordur, and each junction id against
  itself).
- **`same_place` (11):** 5 ring-pilot ids + 6 Westfjords ids. Live-confirmed
  this round:
  - `kopavogur↔kopavogur` → `200 unsupported endpoint_mapping_unavailable`
    (unmapped id, never `same_place`).
  - `flokalundur→selfoss` → `400 unknown_place_id` (flokalundur is still
    outside the general known-place list for any pair except its own
    Westfjords branches/`same_place`).
  - `reykjavik-raudavatn→budardalur` → `200 unsupported
    endpoint_mapping_unavailable` (ring-pilot and Westfjords are never
    composed together — confirmed by direct call, not inferred).
- Totals: **28 unordered / 56 directed `geometry_only` pairs, 11
  `same_place` ids.** Ring-pilot and Westfjords are two separate surfaces
  (tier 2 vs tier 0) and are never composed together; their lengths are not
  comparable and must not be summed.
- The 3600-directed-pair sweep was **not re-run** this round (per the
  approved prompt's own instruction — it is Jonesy's own step-2 sandbox
  result, already cited and independently reproduced in
  closure-implementation's own result-review: 36/5/3107/452 →
  56/11/3086/447, exactly 26 changed cells). This handoff does not restate
  it as a new CC-run number.

## 3. Focused final test run (this round's own, PowerShell)

Command (single run, 18 files, exactly the set the approved prompt names):

```
npx vitest run api/winter-route-geometry.test.js api/_lib/winterRoute/geometryComposition.test.js api/_lib/winterRoute/geometryDataset.test.js api/_lib/winterRoute/westfjordsRegionDataset.test.js api/_lib/winterRoute/westfjordsFlokalundurRegionDataset.test.js api/_lib/winterRoute/westfjordsFlokalundurIsafjordurRegionDataset.test.js api/_lib/winterRoute/westfjordsIsafjordurHolmavikRegionDataset.test.js api/_lib/winterRoute/westfjordsRoad68HolmavikRegionDataset.test.js api/_lib/winterRoute/westfjordsThroskuldarHolmavikRegionDataset.test.js api/_lib/winterRoute/westfjordsFlokalundurPatreksfjordurRegionDataset.test.js api/_lib/winterRoute/westfjordsPatreksfjordurTalknafjordurRegionDataset.test.js api/_lib/winterRoute/westfjordsCombinedRegionDataset.test.js api/_lib/winterRoute/raudavatnSelfossMvpPolicy.test.js api/_lib/winterRoute/raudavatnSelfossNorthOption.test.js api/winter-route.test.js api/_lib/winterRoute/routes.test.js api/_lib/winterRoute/roadConditionCodes.test.js api/_lib/winterRoute/roadFetch.test.js
```

- **Shell: Windows PowerShell** (Git-Bash in this environment gives the
  known spurious vitest "config"/runner error on every file, including
  long-unrelated-green ones — confirmed in closure-implementation's own
  cc-report; not re-confirmed again here, per the approved prompt's own
  instruction not to re-litigate it).
- **Vitest 4.1.10**, Node v24.11.0, 2026-11-20.
- **Result: 18 files passed, 431 tests passed, 0 failed.**
- This number is **this round's own CC run**, distinct from and not summed
  with: Ripley's 359/359 on 14 files (Windows, vitest 4.1.10), Jonesy's
  399/399 on 17 files (sandbox, vitest 3.2.7), or this round's own prior
  874/874 full-suite claim from closure-implementation (58 files, broader
  scope than this focused set). Each stays attributed to its own run.

Condition-to-test mapping used above: conditions 2/3/4/5/8 are proven by
this run; conditions 1 and 6/7 are "að hluta" per the table in §1 — this
run does not change that, since the missing coverage (weather attachment
points; handler-level disconnected-graph proof; closure-on-geometry) does
not exist to run.

## 4. Closure/road-data boundaries (defined handoff, not an implementation)

1. **The geometry API reads no live road-closure/traffic data and computes
   no closure detour.** No closure affects `selectedOption` — the default
   is always the shorter option; `option=north` is only returned when
   explicitly requested. The north ring option (~1236 km) is a **Ring Road
   routing alternative**, not a closure detour.
2. **Each new Westfjords pair has exactly one route.** A closure on any of
   its slices would be a reported fact for a consumer to act on — this API
   never re-routes around it.
3. **#503's own future binding reads `idButurIds` / `slices[].idbutur` in
   travel order and cross-references them against `roadFetch`'s point
   feed.** Per R1a (already an established constraint, not introduced
   here): closure comes from the **point feed**; the segment feed alone
   does not confirm "no closure"; if the point feed is down or stale, that
   is **never** a positive "open" signal.
4. **Open items for #503 (explicitly out of scope for #501):**
   - The live feed may not return rows for all 120 `idbutur` values on
     the 56 directed responses (only CSV membership is confirmed offline).
   - One `idbutur` can span multiple slices and one slice is part of one
     `idbutur` (n:1) — partial closure *within* an `idbutur` is not
     resolvable from geometry alone.
   - Slices with `idbutur: null` occur on 22 of the 56 default directed responses (connectors -1, -4 and -5). Connectors -2/-3 occur only with `option=north`, outside that default-response count. These slices have
     **no** closure coverage at all and must be skipped by any future
     binding, not treated as "always open."

No code change was made for this section — it is a documented handoff
boundary. No disagreement with the approved prompt's own P4 was found in
this round's reading of the code.

## 5. Handoff to #502/#503

See `docs/ai/tasks/ticket-501/closure-implementation/route-contract.md`
(already corrected this round's own predecessor round — not rewritten
here) for the full field-presence table by surface. Summary for a future
consumer:

- **Ring-pilot/vegur-93 surface**: `datasetVersion`/`mode`/`policyVersion`/
  `selectedOption`/`options` at top level; **no** `regionVersion`/`via`/
  `idButurIds` at top level — a consumer reads `slices[].idbutur` instead.
- **Westfjords surfaces** (8 older branches + 10 new combined pairs):
  `regionVersion`/`via`/`idButurIds`/`accessApproach`/
  `estimatedConnectorLengthM` at top level; **no** `datasetVersion`/`mode`.
- **`same_place`**: two different envelopes depending on which id group —
  see route-contract.md's own "same_place -- two surfaces with different
  fields" section; do not assume the newer Westfjords same_place's extra
  fields (`regionVersion`, real `z`, keyed `accessApproach`) exist on the
  5 older ring-pilot same_place ids.
- **Fixed Vík/Borgarnes routes** have their own separate `routeId`/
  `FORECAST_POINTS` surface and are never automatically connected to the
  geometry API's own responses.

Three short, real, live-captured examples (not hand-written; full command
in §3's sibling script, `closure-final/verify-handoff-examples.mjs`, saved
under `closure-final/` per P9, never under `api/`):

**(1) `budardalur→holmavik`** (one of the new combined pairs):
```
status: geometry_only, regionVersion: b93e0334e095cf95
geometryId: b19c8443173f07732be3e79e856ad64c (reverse: 1295e077570d89ec6de491efbcf0f029)
lengthM: 78697.77054505677, slices: 12, estimatedConnectorLengthM: 0
via: ["Gilsfjörður", "Þröskuldar"]
idButurIds: [805030037, 905070037, 905080037, 805090037, 907000037, 707040037, 907040037]
```

**(2) `talknafjordur→talknafjordur`** (`same_place`, Westfjords envelope):
```
status: same_place, regionVersion: b93e0334e095cf95
geometryId: 1780ebae635bfffa41fbc0517bd11116, lengthM: 0
accessApproach.talknafjordur: { ownerCoordinateOffsetM: 995.4294251543986, routeEndsShortOfOwnerCoordinate: true }
lengthNote: "Tier-0 planar geometry (EPSG:3057) -- from and to are the same literal point, so lengthM is 0. This is not a new claim about town access, driving conditions, or current road status."
```

**(3) `reykjavik-raudavatn→selfoss`** (ring-pilot envelope, both options):
```
default: datasetVersion f64c379c…858f92a, policyVersion raudavatn-selfoss-mvp-v1-a73f8191242a0938, mode directed, selectedOption south, lengthM 44984.77037809235
option=north: selectedOption north, lengthM 1236038.3222104264
```

All three were called live against the real handler/real runtime data this
round and matched Jonesy's P5 cross-check values exactly (no deviation in
id or length beyond the stated 0.05 m threshold — none found).
`idButurIds`/`geometryId`/raw `slices` are **not** weather points and are
**not** an official road-closure confirmation — they are an ordered list
of retained road-segment identifiers for #503's own future binding.

## 6. Support/limitation and follow-up list (referenced, not re-measured)

- See the already-approved 31-row CSV follow-up table (closure-scope's own
  `result-review.md` and `scope-and-blockers.md`) and the 164-place dataset
  categorization — not re-measured here; the owner has already approved
  separating further place coverage from #501.
- Dýrafjarðargöng CSV coordinate gap (documented, pre-existing, out of
  #501's own scope), new town branches (Bíldudalur, Reykhólar, Þingeyri,
  Flateyri, Suðureyri, Bolungarvík, Drangsnes, Norðurfjörður,
  Látrabjarg/Breiðavík, etc.), and Tálknafjörður's own ~995 m town
  continuation gap remain explicitly out of #501.
- Still visible and unchanged on every response where they apply:
  Tálknafjörður's `routeEndsShortOfOwnerCoordinate: true` + owner offsets
  (planar, never counted in `lengthM`); **all five** estimated connectors
  — Westfjords **-4** (≈5 mm, 0.0050234… m, inherited `z: null`) and **-5**
  (4.39318… m); ring-pilot **-1** (44.2147 m, south→Rauðavatn), **-2**
  (11.025 m) and **-3** (2.344 m) (north→Rauðavatn) — the ring-pilot's own
  `lengthNote` does not mention them; `estimatedConnectorLengthM` and
  `slices[].estimated` are the only markers. The Ísafjörður roundabout
  (3834) direction caveat; `drivingAccess: "UNVERIFIED"`; tier-0/tier-2
  planar lengths (not driving distances).
- **Ring Road risk** (unchanged from earlier rounds): composing junction
  ids into the Westfjords network without the real Ring Road lines would
  give a wrong ~219.5 km J60→J68 detour instead of the correct ~51.6 km —
  this is exactly why junction ids stay excluded from both `same_place` and
  the 10-pair allowlist.
- No claim of nationwide coverage or a complete Westfjords network. The
  GitHub ticket is not described as resolved by this handoff — only that
  the issue's own closure draft (below) is ready for the owner's review.

## 7. Closure draft (DRAFT — not posted, issue stays open)

> **#501 — draft closure note (not posted; issue remains open pending
> owner review/commit/push)**
>
> This ticket's own route-composition MVP is implemented and tested against
> the current retained road geometry: 28 unordered / 56 directed
> `geometry_only` pairs (10 ring-pilot + 5 older Westfjords + 3 exact
> junction pairs + 10 new Westfjords cross-leg pairs) and 11 `same_place`
> ids (5 ring-pilot + 6 Westfjords). Both directions, shared-segment
> dedup, and `same_place` are tested; see
> `docs/ai/tasks/ticket-501/closure-final/final-handoff.md` for the full
> eight-condition table, which marks three conditions **"að hluta"** (1, 6 and 7), not a
> full PASS: (1) there are no weather-attachment points on geometry
> routes (only the separate Vík/Borgarnes fixed surface has
> `FORECAST_POINTS`) — `idButurIds`/`slices[].idbutur` are the intended
> hook for #503's own future road-closure binding, not a weather point;
> and (6) the Westfjords-specific handler-level broken-graph/`unsupported` proof and (7) closure
> classification are proven at core/loader level and on the fixed-route
> surface respectively, not by a dedicated handler-level geometry test.
>
> Out of scope here, tracked separately: live weather/road-closure
> integration (#503), UI (#502), and further named place coverage beyond
> the current 15 Westfjords place pairs (owner-approved separation, see
> `closure-plan.md`).
>
> **This draft is not a statement that #501 is closed.** Closing requires
> the owner to review this handoff, commit, and push per the repo's own
> workflow (`docs/ai/README.md`, "After CLOSED") — no agent does any of
> that automatically.

## 8. Commit-set table (none of this is staged/committed/pushed by CC)

`git status --porcelain`, current, categorized:

| Category | Files |
| --- | --- |
| Production code (modified) | `api/winter-route-geometry.js` (CRLF/LF warning noted below, no real whitespace error) |
| Production tests (modified) | `api/winter-route-geometry.test.js` |
| New production code + tests | `api/_lib/winterRoute/westfjordsCombinedRegionDataset.js` (+ test), `westfjordsFlokalundurPatreksfjordurRegionDataset.js` (+ test), `westfjordsPatreksfjordurTalknafjordurRegionDataset.js` (+ test), `westfjordsThroskuldarHolmavikRegionDataset.js` (+ test) |
| New runtime JSON | `server_data/westfjords-region-combined.json`, `westfjords-region-flokalundur-patreksfjordur.json`, `westfjords-region-patreksfjordur-talknafjordur.json`, `westfjords-region-throskuldar-holmavik.json` |
| Task-local docs/scripts/maps (untracked) | `docs/ai/tasks/ticket-501/closure-plan.md`, `closure-scope/`, `closure-implementation/`, `closure-final/`, `westfjords-patreksfjordur-mvp/`, `westfjords-talknafjordur-mvp/`, `westfjords-throskuldar-mvp/` |
| Workflow pointer | `docs/ai/CURRENT.md` (modified) |
| Incidental growth (prior rounds' own port health-checks, not new work) | `docs/ai/tasks/ticket-501/westfjords-flokalundur-mvp/server.log`, `westfjords-holmavik-mvp/server.log`, `westfjords-isafjordur-mvp/server.log`, `westfjords-road68-mvp/server.log` |

`git diff --check` on the current tree: one warning only — `api/winter-route-geometry.js`
("LF will be replaced by CRLF the next time Git touches it"), no actual
whitespace-conflict error. Nothing here is staged, committed, or pushed by
CC. This table is for the owner's own commit decision per `docs/ai/README.md`'s
"After CLOSED" section.

## 9. Stop and responsibility note

No new demonstrated runtime defect was found this round beyond the two
already-named partial conditions in §1 (rows 1 and 6/7), which are
pre-existing, scoped-as-handoff characteristics, not regressions
introduced by this or any prior round. Per the approved prompt's own P9:
this round does not implement anything, does not revive the optional S1
hardening from closure-implementation (already addressed there), and does
not open or close the GitHub issue. #501 is **not** closed by this round.
The owner's own review, commit, push, and explicit instruction to close
the GitHub issue remain the next and only remaining steps.


## 10 Ripley final disposition 2026-11-20

The three partial conditions remain partial (1,6,7). Weather-point selection and live closure binding are handed to #503; no new behavior is claimed here. The Westfjords-specific handler-level disconnected_graph test is named follow-up validation, not a demonstrated behavior defect: core/loader proof and generic handler proof exist and Jonesy independently verified the failure case. It does not block this scoped MVP closure and is not silently converted to PASS. Further place coverage remains separated by the recorded owner decision.

Ripley independently reran the same18-file focused set on Windows/Vitest4.1.10:431/431 PASS, and ran verify-handoff-examples.mjs against the real handler with matching examples/boundary results. No production code or runtime data changed. Final commit inventory was read with git status at this assessment; the owner must check it again when staging, particularly incidental server.log growth.
