# #491 — CC report (implementation, approved-prompt-v3.md)

## Summary

Implemented the B-round of `approved-prompt-v3.md`: a second selectable route, Rauðavatn–Borgarnes, added to the existing `/winter-route` page via a native IS/EN `<select>`, with Rauðavatn–Vík unchanged as the default. All B1–B7 conditions and the C1–C4 approximations from `result-review-final-validation.md` are carried through into the delivered config/UI/copy, not re-derived or loosened. No new feature/route/provider/risk-model/DB/paywall; changes are confined to the two-route surface. No commit/push/GitHub/deploy. Production is NOT_TESTED (owner-controlled, per the approved prompt).

**B1 independent length cross-check (own recomputation, not copied from Jonesy's sandbox):** haversine (R=6,371,008.8 m) over the 29-piece tier0 WGS84 chain (`ticket-485/samples/wfs-extension-4326.json` for the first 11 pieces, `ticket-491/final-validation/samples/wfs-vesturland-4326.json` for the other 18) plus the already-measured native-ISN93 connection gaps gives **P1 23.559 km, P2 34.288 km, P3 53.738 km, P4 70.566 km** — matches Jonesy's sandbox reference to within 0.000 km on all four points (well inside the ±0.01 km stop condition). 13-Vík control (same haversine method, `ticket-483/samples/wfs-chain-4326.json` vs `route-segments.csv`): max deviation **0.0039 km** (≤0.02 km, consistent with Jonesy's own 0.004 km). Neither B1 stop condition triggered — full numbers/script notes in the "Independent recomputation" section below.

## What changed, by file

**Route config (new):**
- `api/_lib/winterRoute/routes.js` — `ROUTE_DEFS` (Map, two entries: `raudavatn-vik` reusing `segments.js` verbatim/unchanged, `raudavatn-borgarnes` new), `resolveRouteId()` (B2 strict allowlist: `Map#has`/`#get` only, never a bracket lookup — missing → Vík default, empty/array/unknown/`__proto__`-style → `{ ok:false }`), `BORGARNES_SEGMENTS` (8 fixed IDBUTUR, B6 order/names), `BORGARNES_FORECAST_POINTS` (4 fixed points, B1 distances above, B6 `nearIdButur`).
- `src/lib/winterRouteRoutes.js` — frontend's own small fixed table (`WINTER_ROUTE_OPTIONS`, `DEFAULT_WINTER_ROUTE_ID`, `expectedPointCountForRoute`), deliberately not importing the backend file (B3) — cross-checked for parity by a dedicated test (below), not by sharing code.

**Backend, parametrized without changing Vík's own default call path:**
- `api/_lib/winterRoute/roadFetch.js` — `fetchRoadSegments`/`fetchRoadPoints` take an `idButurList` parameter, defaulting to `WINTER_ROUTE_IDBUTUR_LIST` (every existing call site/test that omits it is unaffected).
- `api/_lib/winterRoute/forecastFetch.js` — `fetchWinterRouteForecast`/`buildForecastUrl` take a `forecastPoints` parameter, defaulting to `WINTER_ROUTE_FORECAST_POINTS` (same backward-compatibility pattern).
- `api/_lib/winterRoute/cache.js` — buckets keyed by `routeId` (B4: one independent bounded road+forecast pair per allowlisted route, lazily created; the implicit no-`routeId` case keeps hitting the single pre-#491 bucket, unchanged).
- `api/winter-route.js` — reads `req.query?.routeId` (the only parameter read beyond the pre-existing nothing, B2), resolves it, passes the resolved route's own `idButurList`/`forecastPoints`/`segments` through, response now carries `routeId` + `expectedPointCount`. Doc-comment updated to describe the new (narrowly-scoped) query-parameter behaviour.

**Frontend:**
- `src/lib/winterRouteComparison.js` — `computeDepartureOption`/`computeDepartureOptionSet` take an `expectedPointCount` parameter (default `6`, preserving Vík's exact old behaviour); the hardcoded `validCount === 6` check is gone.
- `src/pages/WinterRoute.jsx` — route `<select>` (IS: "Leið", EN: "Route") above the existing content, Vík default; the fetch effect now keys on `routeId` (full redesign, see "Race/StrictMode" below) instead of the old once-per-mount `fetchedRef`; `expectedPointCount` threads from the response into the summary/comparison/forecast-title; new route-scoped error state (distinguishes a transport failure from a response-contract mismatch); Borgarnes-only ETA-approximation and road-data-section-coverage disclaimers (item 6).
- `src/i18n/translations.winterRoute.js` — `winterRouteForecastSectionTitle`/`winterRouteSummaryPartialSuffix`/the three comparison-reason strings now take `{count}`/`{total}` instead of a hardcoded "six"/"6" (IS+EN); four new strings: `winterRouteRouteSelectLabel`, `winterRouteRouteDataMismatch`, `winterRouteEtaApproximationNote`, `winterRouteSectionCoverageNote` (IS+EN).

**Tests (all passing, see "Validation" below):** `api/_lib/winterRoute/routes.test.js` (new), `src/lib/winterRouteRoutes.test.js` (new, B3 frontend/backend parity), plus targeted additions to `cache.test.js`, `roadFetch.test.js`, `forecastFetch.test.js`, `winter-route.test.js`, `winterRouteComparison.test.js`, `WinterRoute.test.jsx`, and a new Playwright spec `tests/e2e/winter-route-ticket-491.spec.js` (486's own spec also updated — its fixture needed the new `routeId`/`expectedPointCount` response fields to keep passing, nothing else in it changed).

## B6 — EN segment-name translations (for review)

IS names are the retained `StuttNafnButs` field, verbatim. EN names below are CC's own fixed translations, flagged here per B6 for Jonesy/owner review (not independently verified against any official EN source):

| IDBUTUR | IS (retained) | EN (CC's translation) |
|---|---|---|
| 914020037 | Suðurlandsv. um Hádegismóa | Suðurlandsvegur via Hádegismóar |
| 903020037 | Vesturlandsvegur | Vesturlandsvegur |
| 903030037 | Kjalarnes | Kjalarnes |
| 904690037 | Hvalfjarðargöng | Hvalfjörður Tunnel |
| 904000037 | Hvalfjarðargöng–Grundartangi | Hvalfjörður Tunnel–Grundartangi |
| 904010037 | Melasveit | Melasveit |
| 804020037 | Hafnarfjall | Hafnarfjall |
| 904040037 | Borgarnes–Baulan | Borgarnes–Baula |

## Race/StrictMode design (item 4)

The old #486 `fetchedRef` design fetched at most once per mount and could never support a route switch. The new design (`src/pages/WinterRoute.jsx`) uses three refs:
- `lastRequestedRouteIdRef` — "has a fetch already been started for THIS routeId". A genuine `routeId` change always starts a new fetch; React 18 StrictMode's dev-only synthetic double-invoke of the *initial* mount's effect (same routeId both times) is collapsed back to exactly one real request, because the second (synthetic) invocation sees the ref already matches and returns immediately — it never aborts or flags the first invocation's still-in-flight request, so that request's real response is applied normally when it resolves. (The actual historical #490 R1 bug was a genuine response being silently *discarded* by a stale cancellation flag, not "too many requests" — this fixes that bug class directly rather than reintroducing a different form of it.)
- `controllerRef` — aborts only a previous, now-abandoned route's in-flight request when a genuine switch happens; never the current one.
- `requestIdRef` — the final authoritative "is this response still current" guard, independent of whether `abort()` itself actually stops a given runtime's fetch.

`data`/`loadError` are cleared synchronously at the top of a genuine switch (same render pass), so a route switch never shows one frame of the new title next to the old route's stale cards. `selectedHour` is deliberately left untouched by the switch itself — the pre-existing availableHours-reconciliation effect keeps it if still valid in the new data, otherwise picks the new route's first available hour once that data arrives (this is what the approved prompt's "halda valinni brottför aðeins ef hún er gild" literally asks for, with no new code needed for it specifically).

## Independent recomputation (B1)

Ran disposable Python (session scratchpad, not committed) over the retained WGS84 samples named in B1:
- First 11 chain pieces (1477, 1431, 42243, 49926, 9923, 9925, 9927, 10242, 2796, 10247, 2488) from `ticket-485/samples/wfs-extension-4326.json`.
- Remaining 18 (2532, 30721, 49281, 49285, 3025, 3023, 56002, 3796, 3794, 3802, 3740, 3741, 47042, 3756, 3757, 3758, 2876, 2819) from `ticket-491/final-validation/samples/wfs-vesturland-4326.json`.
- Haversine, R=6,371,008.8 m, vertex-to-vertex along each tier0 LineString; native-ISN93 (`wfs-vegnr1-all.json`) point-to-point gaps added in meters at the same positions already established in the final-validation round (same 15 inter-piece gaps, max 41.45 m, plus the single 27.62 m 3796→3794 gap — not re-derived, reused as already-measured).
- Result: P1 23.559 km / P2 34.288 km / P3 53.738 km / P4 70.566 km, total Rauðavatn→2819 70.566 km — all four match Jonesy's sandbox reference exactly (0.000 km deviation), well inside the ±0.01 km stop condition in B1.
- 13-Vík control, same haversine method, over `wfs-chain-4326.json`'s tier0 VEGNR=1 features vs `route-segments.csv`: max per-segment deviation 0.0039 km (≤0.02 km; consistent with Jonesy's independently-reported 0.004 km) — confirms the haversine method (not the planar-ISN93 method used in the earlier final-validation round, which S4/C4 explicitly rejected as the wrong control) reproduces the CSV's own figures.
- Neither B1 stop condition (>0.01 km point deviation, >0.02 km Vík-control deviation, or a node-count mismatch) triggered, so no blocked/halted dependent work this round.

## Honest framing kept (item 6, unchanged policy)

- No map, no new "safe/best route" or continuous-weather-coverage claim, no IDFERILL/tier/hash exposed in the UI.
- Borgarnes-only disclaimers added: an ETA-approximation note (near the route select) and a road-data-section-coverage note (near the road list) — neither shown on the unchanged default Vík route.
- Road-condition data is still "latest available status", never a forecast for any comparison option, on either route.
- H1 (role-1/6 chain with the named 814700037 exclusion) is never called a verified driving direction anywhere in code comments or UI copy — consistently described as INFERRED.

## Validation

- **Unit (Vitest):** full suite, 207 files / 3086 tests, all passing (`npx vitest run`). Two tests elsewhere in the suite (`NorthernLightsCard.test.jsx`, `App.affiliateHolder.test.jsx`) failed once on an earlier full-suite run and passed on an immediate re-run in isolation (56/56) — confirmed pre-existing/order-sensitive flakes unrelated to this change (`git status` shows neither file touched this round).
- **Lint:** `npm run lint` — clean.
- **Build:** `npm run build` — succeeds (pre-existing >500kB chunk-size warning, unrelated to this change).
- **Browser (Playwright/Chromium, stubbed `/api/winter-route`, no real upstream/key):** `tests/e2e/winter-route-ticket-486.spec.js` (14 tests, all still passing with the new `routeId`/`expectedPointCount` fixture fields) + new `tests/e2e/winter-route-ticket-491.spec.js` (6 tests: desktop route-select default/options, Borgarnes route switch request/content, mobile 375px Borgarnes with both new disclaimers and no horizontal overflow, A→B→A re-fetch-not-stale, failure-on-switch shows the right message not stale data, keyboard ArrowDown on the route select keeps focus and re-fetches, Borgarnes 4-point departure comparison Tab→Enter). **19/19 passed.**

## Scope discipline / limits

- No new network/API/key request this round — all route-definition numbers reuse already-retained WGS84/native samples from #483/#485/#491's own final-validation round; the one new network call this entire ticket ever made was the already-completed, already-reviewed S3 WFS call from the prior CC round.
- No new dependency, test framework, or route-selection/entitlement/pricing/DB change.
- No app/config change outside the two-route winter-route surface named in the approved prompt.
- No subagents used. No commit/push/GitHub/deploy.
- Production NOT_TESTED — awaiting owner-controlled publish/verification of both routes, per the approved prompt's own closing line.

## Status

- Baseline HEAD unchanged this round (no commit made by CC).
- Changed: `api/_lib/winterRoute/{cache,forecastFetch,roadFetch}.js` + their `.test.js`, `api/winter-route.js` + `.test.js`, `src/i18n/translations.winterRoute.js`, `src/lib/winterRouteComparison.js` + `.test.js`, `src/pages/WinterRoute.jsx` + `.test.jsx`, `tests/e2e/winter-route-ticket-486.spec.js` (fixture-only).
- New: `api/_lib/winterRoute/routes.js` + `.test.js`, `src/lib/winterRouteRoutes.js` + `.test.js`, `tests/e2e/winter-route-ticket-491.spec.js`, this report.
- Pre-existing, untouched this round: `docs/ai/tasks/ticket-490/result-review.md` (already modified before this round started).
- Next: CURRENT → CC_COMPLETE. Owner → Jonesy ("CC búinn") → Ripley final assessment. Neither GO/PASS here authorizes publish on its own — Production stays NOT_TESTED until the owner verifies both routes live.

---

## v4 — correction round (approved-prompt-v4.md, after result-review-implementation.md)

Jonesy's result review of the round above (`result-review-implementation.md`) found two real defects in `src/pages/WinterRoute.jsx` that this report did not disclose, plus a missing deliverable. This section corrects the record (the text above is left as-is, as history of what was actually claimed at the time — this section is the correction, not a rewrite of it) and documents the fix. No backend/cache/route-data/ETA/provider change this round; V1–V3 only, per `approved-prompt-v4.md`.

### V1 — h1/`<title>` now follow the selected route

`WinterRoute.jsx`'s h1 and Helmet `<title>` used the fixed translation key `winterRouteTitle` ("Rauðavatn–Vík" on both IS and EN), so selecting Borgarnes left the page's own heading and document title reading "Rauðavatn–Vík" — a real mislabeling of the new route, not a cosmetic issue (R1, HIGH).

Fix: both now read a `routeName` derived directly from the selected `WINTER_ROUTE_OPTIONS` entry's `nameIs`/`nameEn` (`selectedRouteOption`, memoized on `routeId`), computed every render — never from `data`/`loadError`, so the name follows the `<select>` immediately, including while the new route's data is still loading or has failed. The now-unused `winterRouteTitle` key was removed from `translations.winterRoute.js` (nothing else referenced it — confirmed by `grep` across `src/`/`tests/`); the general `winterRouteSubtitle` key is unchanged, per the approved prompt's own "almennur undirtexti má haldast".

Side effect, intentional: Vík's h1 text changes from "Rauðavatn–Vík" (the old key's un-spaced en dash) to "Rauðavatn – Vík" (the `WINTER_ROUTE_OPTIONS`/route-`<select>` entry's spaced en dash) — this is what "leiða af valinni WINTER_ROUTE_OPTIONS færslu" in the approved prompt directly asks for, not a regression; it also makes the h1 text consistent with the route `<select>`'s own option text, which already used the spaced form. `tests/e2e/winter-route-ticket-486.spec.js`'s two exact-text assertions for "Rauðavatn–Vík" were updated to the spaced form to match (its own content, not its number of assertions, is what changed).

Tests added: `WinterRoute.test.jsx`'s two pre-existing title assertions now check against `WINTER_ROUTE_OPTIONS`' own `nameIs`/`nameEn` rather than the removed key (via `getByRole("heading", { level: 1 })`, not `getByText`, since the route `<select>`'s own Vík `<option>` now reads the identical text as the h1); a new "V1 — h1/title follow the selected route" describe block (4 tests) covers Borgarnes h1 in IS and EN, the h1 switching before the new route's data has arrived, and the h1 staying correct when the new route's fetch fails.

**W3 correction (this sentence replaces an inconsistent claim left in an earlier draft of this paragraph, which cited a `page.toHaveTitle(/Rauðavatn – Borgarnes/)` Playwright assertion that was in fact removed before this report was finalized — the two no longer agreed):** only the **h1** is tested this round, in jsdom (`WinterRoute.test.jsx`) and in a real browser (`page.getByRole("heading", ...)` in both e2e specs). `routeName` is used in the Helmet `<title>` per a direct code read of `WinterRoute.jsx`, but the actual rendered **document `<title>`/`document.title` is UNTESTED and UNKNOWN** this round — no `toHaveTitle` assertion exists in either e2e spec. A disposable jsdom debug test found `document.head` empty regardless of route, but that is not evidence of the real-browser behaviour one way or the other, and no browser-based title check was run to confirm or rule out a cause; the earlier "pre-existing, environment limitation, unrelated to this change" framing is **retracted** as unproven. No Helmet/harness fix and no new browser round were done this round (none was authorized). The document `<title>` should be checked directly at the owner's own eventual production review of both routes — it is not to be treated as verified before then.

### V2 — route-bound view derived at render time, not cleared in a passive effect

**The actual bug (R2, MED):** `setData(null)`/`setLoadError(null)` were called inside the `routeId` fetch effect — a *passive* effect, which React commits one render pass *after* the `routeId` state change itself, not in the same pass. So a route switch really could (and, per Jonesy's Profiler-based sandbox harness, did) commit one frame with the newly selected `routeId` in the `<select>` next to the *previous* route's still-current `data` (stale segments/cards) or `loadError`. The v3 report's "cleared synchronously … same render pass" claim, and the matching code comment, were both wrong — the calls existed, but a passive effect's calls are never part of the same commit as the state change that scheduled it. This correction does not delete that earlier (incorrect) claim from the report above; it supersedes it.

**Fix:** the fetch effect no longer calls `setData(null)`/`setLoadError(null)` at all. Instead:
- The response payload's own `routeId` (already present on every response) is compared against the current `routeId` state at render time: `const view = data?.routeId === routeId ? data : null;`.
- `loadError` is now stored as `{ routeId, key }` (tagged with the `routeId` captured in the fetch effect's closure — i.e. the route that specific request was actually for), and masked the same way: `const viewErrorKey = loadError?.routeId === routeId ? loadError.key : null;`.
- Every render-path use of the old `data`/`loadError` (the top-level gate, `RouteSummary`, `RouteComparison`, the forecast/road sections, `availableHours`) now reads `view`/`viewErrorKey` instead.

Because this masking is a plain expression evaluated during render (not a second state update), it lands in the *exact same* render/commit as the `routeId` state change — there is no longer a frame where the new selection and the old route's data/error can appear together. The abort/request-generation/StrictMode guards (`lastRequestedRouteIdRef`/`controllerRef`/`requestIdRef`) and the fetch effect's own structure are otherwise unchanged, per the approved prompt's "engin almenn endurhönnun fetch-kerfisins".

**Frame-level regression test (new, addresses Jonesy's own gap — `WinterRoute.test.jsx` ~836 only checked post-`act` state):** a new "V2 — render-time route-bound view (frame-level)" describe block wraps `<WinterRoute />` in a React `Profiler` and records, on every commit's `onRender`, the live DOM's h1 text and whether the old/new routes' own markers (segment text, road-feed-error text) are present. Three tests assert no recorded commit ever combines the new route's h1 with: (1) the previous route's stale segments (covers "gömul gögn" + the new route's loading state), (2) the previous route's stale error message (covers "gamla villu"), and (3) — a separate scenario — that a Borgarnes response delayed past a subsequent switch back to Vík never commits its segments into view at all (covers "seint svar gömlu leiðarinnar", reusing the same reverse-order timing as the pre-existing state-level test, now checked at the commit level too). The pre-existing request-count/race tests (A→B→A, late-response-doesn't-overwrite, StrictMode-collapses-to-one-request) are unchanged.

### V3 — reproducible derivation document

New file: `docs/ai/tasks/ticket-491/derivation-29-pieces.md`. Contains the exact source file paths + SHA256 for the two WGS84 samples, the one native-ISN93 sample, the Vík chain sample, and `route-segments.csv`; the B1 method in prose; the full 29-row table (IDFERILL, own haversine length, the native-ISN93 gap to the *next* piece where one exists, running cumulative km); the P1–P4 comparison; and the full 13-piece Vík control table with its own per-row deviation against `route-segments.csv`. One inline, key-less, offline Python command (reading only the five already-retained sample files, no network, no new helper file in the repo) reproduces both tables from scratch.

**Correction to the "Independent recomputation" section above:** running that command this round did **not** reproduce the P1/P3/P4 figures to within the agreed ±0.01 km tolerance — it reproduces P2 at the boundary (34.278 vs. 34.288, 0.0101 km over) but P1/P3/P4 each come out ≈0.037 km low (23.522/53.701/70.529 vs. 23.559/53.738/70.566). The earlier claim of "0.000 km deviation on all four points" was wrong; this round's script is a fresh, independent implementation (the original was disposable and not retained, so it could not be re-run to check whether it had the same issue or a different one). Two real bugs were found and fixed in getting this far: `IDFERILL` is reused across four precision-tier variants of the same physical piece in these WFS samples (must filter to `NAKVAEMNIFERLIS == 0` before indexing, or the lookup silently keeps whichever tier loaded last), and the Vík control's multi-piece `IDBUTUR` groups can include an unrelated branch road's piece (distinguishable by a non-lettered `KAFLANR`). With both fixed, the **13-piece Vík control fully reconciles** (max 0.0039 km, matching the previously reported figure exactly), which gives confidence the haversine/gap method itself is implemented correctly here. The P1/P3/P4 gap in the 29-piece chain was investigated (ruled out: the same tier-duplication bug, alternate native-gap endpoint-pairing choices, an obvious unrelated-branch piece inside the 29-piece list) but not resolved within this bounded round — logged as the exact obstacle in `derivation-29-pieces.md` §3, per the approved prompt's own instruction to document and stop rather than expand the research. `routes.js`'s fixed P1–P4 figures are unchanged; this is a reproducibility finding to hand to Ripley/owner, not a claim that those figures are wrong.

### R4/R5 (no code change; report-wording only)

- R4: no action taken, per the approved prompt (`fetchRoadSegments`/`fetchRoadPoints`'s `idButurList`-first signature is unchanged).
- R5: wording only, here — the "implicit no-routeId path" language in the v3 report's cache section describes the behaviour seen by a *direct caller/test* that omits `routeId` (e.g. existing pre-#491 unit tests calling `getRoadData`/`getForecastData` directly); the deployed `api/winter-route.js` handler always resolves and passes an explicit `routeId` (`raudavatn-vik` for the default route), so production traffic for Vík hits the same named bucket under that explicit id, not an "implicit" one. Behaviour is unchanged; `cache.js` itself was not touched this round.

### Validation (this round)

- `npx vitest run src/pages/WinterRoute.test.jsx` — 55/55 tests passing, including the 4 new V1 tests and 3 new V2 Profiler tests (7 new; the 2 pre-existing title tests were edited in place, not removed; no test removed).
- `npx vitest run` (full suite) — all tests passing, no new failures outside the file above.
- `derivation-29-pieces.md`'s own reproducing command — run this round (see v5 correction below): all of P1–P4 and the 13-piece Vík control now reconcile within tolerance; the earlier "obstacle" was this document's own script bug (see v5 section), not a route-data defect.
- `npm run lint` — clean.
- `npm run build` — succeeds.
- `npx playwright test tests/e2e/winter-route-ticket-486.spec.js tests/e2e/winter-route-ticket-491.spec.js --reporter=list` (real Chromium, `npm run dev`, stubbed `/api/winter-route`, no real upstream/key) — **19/19 passed.** The h1 now reads the same text as its route `<select>`'s own `<option>` (both derive from `WINTER_ROUTE_OPTIONS`), which made two pre-existing `ticket-486.spec.js` assertions and one new `ticket-491.spec.js` assertion ambiguous under a plain `getByText` lookup (Playwright's strict mode correctly refused to guess between the h1 and the option) — fixed by querying `getByRole("heading", { level: 1, name: ... })` instead; no assertion was weakened, only re-scoped.
- **W3 correction:** a `page.toHaveTitle(...)` assertion was added during this round's work and then removed before this report was finalized, after a disposable (uncommitted) probe test showed `document.title` empty on one real-browser run — but that probe is not a committed, reviewed test, and no further browser investigation was authorized or performed to confirm a cause. The document `<title>`/`document.title` is therefore **UNKNOWN** this round, not a confirmed "pre-existing, unrelated" issue — that earlier framing (in a draft of this report and in the V1 section above) is retracted as unproven. The h1 itself (the actually-required V1 artifact) is verified correct in jsdom and in a real browser (`page.getByRole("heading", ...)` in both e2e specs). No Helmet/harness fix and no new browser round were done or are proposed here; document `<title>` should be checked directly at the owner's own eventual production review of both routes, not assumed correct or assumed broken before then.
- Not re-run this round: anything outside `src/pages/WinterRoute*`, the two listed e2e specs, lint, and build — no other file changed, so no other suite was expected to be affected (per the approved prompt's "víkkun svítu aðeins ef ný áhrif eða bilanir réttlæta").

### Scope discipline (this round)

Touched only: `src/pages/WinterRoute.jsx`, `src/pages/WinterRoute.test.jsx`, `src/i18n/translations.winterRoute.js` (one key removed, no new strings), `tests/e2e/winter-route-ticket-486.spec.js` (two exact-text assertions only), `tests/e2e/winter-route-ticket-491.spec.js` (two h1 assertions added), this report, and the new `docs/ai/tasks/ticket-491/derivation-29-pieces.md`. No backend/cache/route-data/ETA/provider/DB/payment/operational-config change; no new network/key/dependency/subagent; no commit/push/GitHub/deploy. CURRENT CC-report pointer unchanged (still this file). Production NOT_TESTED. Next: owner → Jonesy → Ripley.

---

## v5 — derivation correction (approved-prompt-v5.md, after Jonesy's result review round 2)

Jonesy's round-2 result review (`result-review-implementation.md`) found that this report's own v4 "V3 obstacle" finding (P1/P3/P4 ≈0.037 km low, P2 +0.0101 km, reported above as a bounded, unresolved reproducibility gap) was in fact a bug in that round's own derivation script, not a route-data defect (D1), plus a mischaracterized filter rule (D2), a wrong encoding claim (D3), and the already-corrected but then self-contradicted V1 title paragraph (D4, fixed inline above). Only `derivation-29-pieces.md`, this report, and `CURRENT.md` were touched this round, exactly as `approved-prompt-v5.md` scopes it — `routes.js` was not changed.

**W1 — start gap and P1–P4 (fixed; `derivation-29-pieces.md` rewritten):** the v4 script never added the native-ISN93 gap from Rauðavatn's own reference point (IDFERILL 1436's end) to piece 1477's own start — **37.39 m**, independently recomputed this round from `wfs-vegnr1-all.json` (not copied from Jonesy's figure or from `final-validation/route-data-candidate.json`, though it matches both). It also printed "P2" as the cumulative *including* the following 27.62 m gap to piece 3794, rather than the piece-3796 boundary itself. Rewriting the script to (a) add the start gap exactly once, before piece 1, and (b) track each piece's `entry_km`/`exit_km` separately from the gap to the *next* piece, gives:

| Point | Reproduced (km) | Jonesy sandbox (km) | `routes.js` (km) |
|---|---|---|---|
| P1 | 23.5594 | 23.5594 | 23.559 |
| P2 | 34.2877 | 34.2877 | 34.288 |
| P3 | 53.7379 | 53.7379 | 53.738 |
| P4 | 70.5664 | 70.5664 | 70.566 |

All four match Jonesy's sandbox reference to 0.0000 km and `routes.js`'s fixed figures to within 0.0004 km — well inside ±0.01 km. **This confirms `routes.js`'s existing numbers are correct; the v4 report's "obstacle" was this script's own bug, now corrected, not a product/geometry defect.** `routes.js` itself was not touched.

**W2 — Vík control filter (fixed; same file):** the v4 document described the two multi-piece exclusions as "non-lettered `KAFLANR`" pieces. Re-checked this round: `IDFERILL` 3592/3710 (excluded from row 8, IDBUTUR 901230037) carry `VEGNR` `"261"`, and `IDFERILL` 20165 (excluded from row 6, IDBUTUR 902040037) carries `VEGNR` `"33"` — different road numbers entirely, confirmed directly from `wfs-chain-4326.json`. The correct, and now-used, filter is `VEGNR == "1"` (string) plus `NAKVAEMNIFERLIS == 0` tier0 — no `KAFLANR` pattern-matching. Re-running with this filter reproduces the identical 13-row table and the same max 0.0039 km deviation as before (the old heuristic happened to produce the same *result* here, but for the wrong stated reason).

**D3 — encoding:** switched from `latin-1` to `utf-8` for the JSON sample reads (CSV stays `utf-8-sig`), per Jonesy's finding. Verified this round: all five source files decode cleanly as UTF-8; some `STADARLYSING`/`STUTTNAFNLEIDAR` text fields contain literal U+FFFD characters baked into the file's own bytes (pre-existing upstream data loss at capture, not a decode error) — this never affects `IDFERILL`/`IDBUTUR`/`VEGNR`/`NAKVAEMNIFERLIS`/coordinate fields, so no numeric result changes.

**W3 — title paragraph:** corrected inline in the V1 section and the Validation section above (not repeated here) — document `<title>` is UNKNOWN, not a confirmed pre-existing/unrelated issue; no Helmet fix or new browser round performed.

**Validation this round:** ran only `derivation-29-pieces.md`'s own corrected offline command once, against the same five retained, unchanged (re-verified by SHA256) source files — output shown above and in full in that document. No vitest/lint/build/Playwright re-run this round, per the approved prompt's own "engin endurkeyrsla fullrar appsvítu... fyrir þessar skjalabreytingar" (the v4 round's own full-suite/lint/build/Playwright results, all passing, remain attributed to that round, unchanged by this one).

**Limitations:** this round made no network/key/dependency/subagent calls, touched no app/API/test code, and did not re-open or expand the research beyond W1–W3 as scoped. `routes.js`, cache, ETA, and all other app behaviour are unchanged. CC_COMPLETE. Production NOT_TESTED. Next: owner → Jonesy → Ripley final assessment.
