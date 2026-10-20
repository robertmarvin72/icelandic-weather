# Ticket #452 — CC report (approved-prompt-v1.md)

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/452 — "Laga vindeiningu og vindviðvörun í norðurljósaspá" (fix the wind unit and wind caution in the Northern Lights forecast).

## Baseline / git scope

- HEAD at start and end: `abc61ff04fb8a15a5e2ddada671adfd084062f89` (no commit made by CC; this is the baseline the working tree sits on).
- `git status --porcelain=v1` before this ticket's edits: ` M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-450/`, `?? docs/ai/tasks/ticket-452/` (ticket-450's research history and this ticket's own task directory — both pre-existing, untouched by this execution).
- `git diff --stat` after this ticket's edits (full, exact):
  ```
  api/_lib/auroraDecision/openMeteo.js             |  26 +++-
  api/_lib/auroraDecision/openMeteo.test.js        | 190 +++++++++++++++++++++++
  docs/ai/CURRENT.md                               |  56 ++-----
  src/components/NorthernLightsThreeNight.test.jsx |  89 ++++++++++-
  src/hooks/useAuroraDecision.test.js              |  33 ++++
  src/lib/auroraScoring.test.js                    |  56 +++++++
  6 files changed, 403 insertions(+), 47 deletions(-)
  ```
- **Exactly one application (non-test, non-docs) file changed**: `api/_lib/auroraDecision/openMeteo.js`. Everything else is test files plus the workflow pointer (`docs/ai/CURRENT.md`).
- New untracked paths created by this round: `outputs/ticket-452-browser-evidence/` (8 PNGs, no code).
- A temporary, non-committed capture script (`_tmp-ticket452-capture.mjs`) was created at the repo root solely to drive Playwright against the already-built `dist/` via `vite preview`, and was deleted again before finishing (confirmed via `git status` showing no trace of it) — it is not part of the deliverable and is not retained, consistent with no prior ticket in this repo retaining its own one-off evidence-capture script either.

## Changed files

| File | Change |
|---|---|
| `api/_lib/auroraDecision/openMeteo.js` | Added `wind_speed_unit=ms` to `buildOpenMeteoUrl`; added a `windUnitIsSuspect()` runtime guard, applied inside `normalizeOpenMeteoHourly`, that nulls `windSpeed` for every row if `hourly_units.windspeed_10m` is present and not exactly `"m/s"` |
| `api/_lib/auroraDecision/openMeteo.test.js` | New tests: canonical param assertion, 6 guard-behavior tests, 3 real-pipeline integration tests (fetch→normalize→scorer) |
| `src/lib/auroraScoring.test.js` | New tests: exact 12 m/s boundary (11.9/12/12.1), max-across-window, null-mix-never-flags — scorer itself untouched |
| `src/hooks/useAuroraDecision.test.js` | New test: explicit retry surfaces a corrected (unflagged) decision after a previously-cached over-flagged one |
| `src/components/NorthernLightsThreeNight.test.jsx` | New describe block (4 tests): real EN/IS dictionary wind-note presence/absence for the selected qualifying best, lower-ranked-alternative non-leak, and all-poor-branch non-display |

### Files explicitly NOT changed (per N10)

`src/lib/auroraScoring.js` (zero diff — confirmed by its total absence from `git diff --stat` above), `src/components/AuroraNightOutlook.jsx`, `src/i18n/translations.*.js` (no new/changed copy — reused existing `nlHighWindNote` key), `src/lib/forecastCache.js`, `api/forecast.js`, `vite.config.js` (Workbox/PWA config), any DB/cache schema (`docs/northern-lights/sql/aurora_forecast_cache.sql`), `src/lib/auroraDecisionCache.js`, `src/hooks/useAuroraThreeNight.js`, `api/_lib/auroraDecision/fanout.js`, `api/_lib/auroraDecision/orchestrate.js`, `api/_lib/auroraDecision/rankDecision.js`, `api/_lib/aurora/cache.js`.

## Read-only trace (performed before any edit, per contract §1)

Full chain read, in order, before writing any code:

1. **`api/_lib/auroraDecision/openMeteo.js`** — `buildOpenMeteoUrl` built the request with no unit parameter at all (confirmed by reading the file directly); `normalizeOpenMeteoHourly` mapped `windspeed_10m` straight through via `numOrNull`, no unit awareness.
2. **`src/lib/auroraScoring.js`** — confirmed `HIGH_WIND_MS_THRESHOLD = 12` (m/s, line 70) and the exact comparator `maxWind != null && maxWind >= HIGH_WIND_MS_THRESHOLD` (line 335) pushes only the `high_wind` flag, never touches `score` (the scoring lines above and below it are untouched by wind in every code path read).
3. **`api/_lib/auroraDecision/fanout.js`** — purely in-memory bounded-concurrency fan-out, writes results into a pre-sized array, no persistence of any kind.
4. **`api/_lib/auroraDecision/rankDecision.js`** — calls the scorer unchanged, ranks by `score` (never wind), carries `flags` through to each ranked entry unmodified.
5. **`api/_lib/auroraDecision/orchestrate.js`** — reads only the Aurora astronomical snapshot via `readAuroraSnapshot(sql)` (sun/moon/activity — see next point); weather is fetched fresh per-request via `fetchWeatherForLocations`, never read from or written to any DB table.
6. **`api/_lib/aurora/cache.js`** — read in full: `persistAuroraSnapshot(sql, { nights, sourceFetchedAt })` is the only writer of `aurora_forecast_cache`, and it is only ever called from `api/cron/refresh-aurora.js` with `nights` parsed from the Vedur.is feed (astronomical data) — confirmed by reading `api/cron/refresh-aurora.js`'s own call site. `readAuroraSnapshot` selects only `snapshot, source_fetched_at, updated_at`. **No weather/wind field exists in this table's write or read path.**
7. **Repo-wide grep** (not limited to files named above, per N5): `rg -ni "INSERT INTO|UPDATE " api/ -t web` found every SQL writer in the codebase (`app_user`, `user_session`, `blog_post`, `blog_media`, `user_subscription`, `paddle_transaction`, `user_pass`, `aurora_forecast_cache`) — none besides `aurora_forecast_cache` touches anything Aurora-related, and that one (confirmed above) never touches weather. `rg -ni "windspeed|wind_speed" -t web -g '!*.test.*' -g '!docs/**'` repo-wide found every non-test wind reference in the codebase; outside the aurora path, all of them belong to the unrelated campsite-forecast feature (`api/forecast.js`, `src/lib/forecastCache.js`, `src/lib/forecastNormalize.js`, `src/components/CampsiteComparisonSection.jsx`, `src/lib/routeRisk.js`, `src/lib/shelterUtils.js`, `src/hooks/useLeaderboardScores.js`, `src/lib/windUtils.js`, `src/lib/hazardWindow.js`) — confirmed these are a disjoint set of files from the aurora path's own imports, and none of them were touched. **Conclusion "no wind-bearing persisted store needs invalidation" is grep-supported, not assumed — no STOP trigger fired.**
8. **`src/lib/auroraDecisionCache.js`** (read in full) — a module-level `Map<key, {promise, createdAt}>` with a 5-minute `TTL_MS`. `getOrCreateAuroraDecision` reuses an existing entry's promise only if `Date.now() - createdAt < TTL_MS`; `invalidateAuroraDecision` deletes the entry outright (used by retry, bypassing TTL entirely).
9. **`src/hooks/useAuroraDecision.js`** (read in full) — its `useEffect` calls `load(key, ...)` only when `key` (which encodes `evening`+`locationIds`) changes or on mount; there is no interval/polling anywhere in the hook. `retry()` calls `load(..., { forceFresh: true })`, which calls `invalidateAuroraDecision(requestKey)` **before** `getOrCreateAuroraDecision`, so retry always issues a genuinely fresh fetch regardless of TTL.
10. **`src/hooks/useAuroraThreeNight.js`** (read in full, per N6 — not previously read by Jonesy) — confirmed it adds **no** persistence beyond `useAuroraDecision`. Its only timers (`ageTick`, next-UTC-midnight, visibility-return) force a re-render to recompute displayed *age/freshness text*; none of them ever calls `retry()` or otherwise triggers a new fetch. The underlying in-memory cache (`entries` Map in `auroraDecisionCache.js`) does not survive a hard page reload (fresh JS execution context), so a reload always issues a genuinely fresh request regardless of the 5-minute TTL — the TTL only governs whether a **new mount within the same page session**, under 5 minutes old, reuses an already-resolved promise.
11. **`src/components/AuroraNightOutlook.jsx`** (read in full) — confirmed `const best = display.qualifyingLocations[0]` (the single selected/displayed qualifying best) is the only entry whose `flags` are read for `hasHighWind`/`nlHighWindNote` (line ~238/248); the "all-poor" branch (lines ~193-233) never reads or displays any flag from `bestAvailable`, confirmed by reading that entire branch — no wind text appears there in any sub-case, including the Pro-only expanded-details panel.
12. **`vite.config.js`** (read in full) — the only `runtimeCaching` rule matching Open-Meteo (`api-open-meteo`, StaleWhileRevalidate) matches browser-side GET requests to `https://api.open-meteo.com/v1/forecast`; the aurora path's weather fetch happens **server-side** (inside `api/_lib/auroraDecision/openMeteo.js`, running on Vercel, never in the browser), so this rule can never intercept it — confirmed this is unaffected by adding `wind_speed_unit=ms` to the URL, since the Service Worker never sees that server-to-server request at all. The POST to `/api/aurora-decision` is covered by no `runtimeCaching` rule (POST requests are also not cacheable by Workbox's default strategies regardless).

## Implementation

1. **`buildOpenMeteoUrl`**: added `url.searchParams.set("wind_speed_unit", "ms")`. No other parameter touched; no second/legacy `windspeed_unit` parameter is ever sent (verified by an explicit test asserting `searchParams.get("windspeed_unit")` is `null`).
2. **`normalizeOpenMeteoHourly`**: added `windUnitIsSuspect(payload)`, which returns true only if `hourly_units.windspeed_10m` is present (`!== undefined`) **and** not exactly the string `"m/s"`. When true, every row's `windSpeed` is set to `null` (no conversion, no exception, no 500). When `hourly_units` is absent entirely, or present without a `windspeed_10m` key, the check is false and `windSpeed` passes through exactly as before — this is why `api/aurora-decision.test.js`'s existing fixture (no `hourly_units`, `windspeed_10m: [1]`) needed no change and was re-confirmed green.

### Supported-unit source and evidence grade

- **`wind_speed_unit=ms`** — VERIFIED DOCUMENTATION (Ripley, read 2026-10-20, https://open-meteo.com/en/docs?latitude=47.8&longitude=-101.5; CC did not independently re-fetch this page — per N1's explicit instruction not to re-probe). This is the canonical spelling Ripley selected in `approved-prompt-v1.md`'s binding decision N1, in preference to the legacy `windspeed_unit` spelling (which had weaker, sample-only evidence from #450).
- Tests with mocked `fetch` (all of them, in this ticket) prove our **request-construction and normalization code**, not live provider behavior. No live Open-Meteo request was made at any point in this round — per N1 and the Additional STOP triggers, a live provider probe would itself have required a STOP.
- Both spellings are never sent together; verified directly by a test asserting the legacy name is absent from the constructed URL.

## Before/after example with identical scores (N4)

Using the real pipeline (`fetchLocationWeather` → `normalizeOpenMeteoHourly` → `scoreAuroraVisibility`, all actual functions, mocked `fetch` only — see `api/_lib/auroraDecision/openMeteo.test.js`'s "real-pipeline wind-unit equivalence" describe block):

| | "Before" (no `wind_speed_unit` param, provider defaults to km/h, no `hourly_units` metadata) | "After" (actual current code: `wind_speed_unit=ms` requested, provider echoes `hourly_units.windspeed_10m: "m/s"`) |
|---|---|---|
| Reported wind value | `18` (raw km/h magnitude, physically ≈5 m/s) | `5` (m/s, same physical wind) |
| `high_wind` flag | **present** (18 ≥ 12) | **absent** (5 < 12) |
| `score` | identical (cloud/activity-driven only) | identical |
| `band` | identical | identical |
| `reasons` | identical | identical |

Boundary test (same describe block, second test): `11.9` → no flag; `12` → flagged; `12.1` → flagged; `score`/`band` identical across all three (non-wind inputs unchanged). A third test confirms `null`/missing wind values stay `null` through the real pipeline and never trigger the flag — the "zero/logn" wording in the approved prompt's contract item 3 is read as the stated typo for "never coerce to zero," consistent with the existing `numOrNull` helper's own behavior, which this change does not alter.

## UI trace and claims (N7)

- The wind note (`nlHighWindNote`) attaches **only** to `display.qualifyingLocations[0]` — the single selected/displayed qualifying best for the currently-selected night. Confirmed by source read and by a new test: a lower-ranked flagged alternative never leaks the note onto an unflagged displayed best.
- The "all-poor" branch **never** shows the note, confirmed by source read and by a new test using the real EN dictionary, including with Pro's details panel expanded.
- Selecting a different night displays that night's own, already-loaded best (all three nights are fetched at mount, per the corrected Old-tab limit section below — switching tabs is a display change, not a new fetch) — confirmed by a new test (tonight calm/no-note → switch tab → tomorrow windy/note-present, both fixtures supplied up front) and by the existing (untouched) `NorthernLightsThreeNight` suite's own "atomic update" tests.
- **Expected and intended visible effect, stated so the owner is not surprised (per N7):** the wind note will now appear far less often than before. **⚠ Arithmetic corrected (v2, Y1/Ripley):** old (unfixed) behavior effectively flagged any wind ≥ 12 km/h because the raw km/h magnitude was compared directly against the "12" threshold meant for m/s; corrected behavior flags only ≥ 12 m/s (43.2 km/h) — comparing like units throughout, that is a factor of **3.6×** in physical wind speed (43.2 km/h ÷ 12 km/h, equivalently 12 m/s ÷ 3.33 m/s), not the "roughly 13×" this report previously stated. The wrong 13× figure came from dividing the new threshold expressed in one unit (43.2 km/h) by the old threshold expressed in the other (≈3.33 m/s) without converting both to the same unit first — the same category of unit-mismatch error this ticket's own fix addresses in the code, caught here in the report's own prose instead. Whether 12 m/s is the *right* caution level is explicitly out of scope here (tracked separately as #437).
- No UI source, translation, or wording file was edited. No STOP was triggered on this axis — nothing in the trace required a UI change.

## Cache/store matrix (N5)

| Store | Write path (file:line) | Read path (file:line) | Wind-bearing? | Disposition |
|---|---|---|---|---|
| `aurora_forecast_cache` (Neon, nights only) | `api/_lib/aurora/cache.js:57` `persistAuroraSnapshot`, called only from `api/cron/refresh-aurora.js:48` with `nights` parsed from the Vedur.is feed | `api/_lib/aurora/cache.js:74` `readAuroraSnapshot`, called from `api/_lib/auroraDecision/orchestrate.js:66` | **No** — confirmed by reading both the write payload shape (`{nights}`) and the SQL `SELECT snapshot, source_fetched_at, updated_at`; neither ever carries weather/wind | No invalidation needed; snapshot/`source_fetched_at` not mutated (confirmed unedited) |
| Cron lease (`refreshing_until` column, same table) | `api/_lib/aurora/cache.js:27-36,43-49` | same table | No | Unaffected |
| Per-request weather fetch (`fetchLocationWeather`) | n/a — never written anywhere | `api/_lib/auroraDecision/openMeteo.js:fetchLocationWeather`, called per-request from `fanout.js:27` | N/A (not persisted at all) | The URL now always includes `wind_speed_unit=ms`; this is simply a different outbound request every time, nothing to invalidate |
| `auroraDecisionCache` (client, in-memory `Map`) | `src/lib/auroraDecisionCache.js:19-31` `getOrCreateAuroraDecision`, called from `useAuroraDecision.js:37` | same module, same call | **Yes, indirectly** (caches the whole resolved decision body, which includes `flags`) | 5-minute TTL for *new-mount* reuse; `retry()` always bypasses via `invalidateAuroraDecision` regardless of TTL (confirmed by source read, re-confirmed by the new corrected-after-retry test). No code change here — new requests after deploy simply carry the new, corrected URL already |
| POST `/api/aurora-decision` | n/a | `api/aurora-decision.js` | N/A | `Cache-Control: no-store` confirmed unchanged (not edited) |
| Service Worker / Workbox | n/a | `vite.config.js:47-58` | N/A | `api-open-meteo` runtime-caching rule matches only browser-side GET to `api.open-meteo.com`; the aurora path's fetch is server-side and never touches this rule (confirmed by source read) — not in scope, not touched |

**No reused wind-bearing persisted store was found. No STOP was triggered on this axis.**

## Old-tab limit (N6)

**⚠ Corrected (v2, Y1) — the paragraph below replaces an earlier, wrong claim that switching the selected night triggers a fresh fetch. It does not; see the correction note at the end of this report for what was wrong and why.**

`useAuroraThreeNight.js` calls `useAuroraDecision` exactly three times, unconditionally on every render, for the three **fixed** slot dates (`slotDates[0].date`, `[1].date`, `[2].date` — today + 0/1/2 calendar days) — confirmed by reading the three call sites directly (`src/hooks/useAuroraThreeNight.js:91-93`). All three nights are therefore requested **at mount**, before the user ever picks a tab. `selectedDate` (the tab the user is currently looking at) only selects which of the three *already-loaded* slots is displayed — it is not one of the three hooks' own keys, so switching tabs changes no `key` and triggers no refetch.

Given that, an already-rendered tab's decision for a given night only gets refreshed by one of:
- **a page reload** — the client-side cache (`auroraDecisionCache.js`'s module-level `Map`) is in-memory state that does not survive a new page load, so a reload always issues three genuinely fresh requests regardless of the 5-minute TTL;
- **a calendar rollover** that changes `slotDates` (confirmed via `useAuroraThreeNight.js`'s `msUntilNextUtcMidnight`/visibility-return timers) — but only for whichever of the three dates actually changed identity; a date that is still one of the new window's three slots is **not** guaranteed a fresh fetch, since `getOrCreateAuroraDecision` may still find and reuse an existing, not-yet-expired cache entry under that same `(evening, locationIds)` key (this report does not claim every overlapping date is forced fresh on rollover);
- **a remount** (e.g. navigating away and back to the page) **after** the 5-minute TTL has elapsed for that key — a remount strictly *within* the TTL window can still reuse an old, already-resolved decision.

**Retry is not a live lever for an already-successful (or all-poor) displayed result.** Re-confirmed by reading every `onRetry` call site in `AuroraNightOutlook.jsx` (`src/components/AuroraNightOutlook.jsx:132,143,154,176`): the "Try again" button exists only in the `expired`/`transport_error`/`contract_defect`/`domain_unavailable` branches — never in the `nl3-result` (success) or `nl3-all-poor` branches. The hook-level test added for this ticket (`useAuroraDecision.test.js`, "surfaces a corrected decision after explicit retry") demonstrates that the underlying `retry()` **mechanism** genuinely bypasses the cache and gets a corrected response when called — it does not demonstrate, and this report does not claim, that a user looking at an already-successful flagged result has a retry button available to invoke it.

TTL expiration by itself never refreshes already-rendered state — there is no polling or auto-refresh timer anywhere in either hook (confirmed by the same full source read as before); the TTL only ever matters at the moment a **new** `load()` call actually happens (mount, rollover-changed key, or explicit retry from an error state), by deciding whether that new call reuses an existing promise or issues a fresh one. No polling/TTL/purge change was made, per N6/contract item 6.

## Exact test commands and counts

**(v1-round results, attributed historically — not re-run in the v2 documentation-only correction below; see "v2 Correction" at the end of this report.)**

Targeted suites (run together, one command):
```
npx vitest run \
  api/_lib/auroraDecision/openMeteo.test.js api/_lib/auroraDecision/fanout.test.js \
  api/_lib/auroraDecision/orchestrate.test.js api/_lib/auroraDecision/rankDecision.test.js \
  api/_lib/auroraDecision/freshness.test.js api/_lib/auroraDecision/darknessWindow.test.js \
  api/_lib/auroraDecision/constants.test.js api/_lib/auroraDecision/resolveLocations.test.js \
  api/_lib/auroraDecision/validateRequest.test.js api/aurora-decision.test.js \
  src/lib/auroraScoring.test.js src/lib/auroraDecisionClassify.test.js src/lib/auroraDecisionCache.test.js \
  src/hooks/useAuroraDecision.test.js src/hooks/useAuroraThreeNight.test.js \
  src/components/NorthernLightsThreeNight.test.jsx src/components/NorthernLightsThreeNight.round5.test.jsx \
  src/components/NorthernLightsThreeNight.interactionTier.test.jsx \
  src/components/NorthernLightsThreeNight.affiliateCtaFallback.test.jsx \
  src/components/NorthernLightsThreeNight.affiliateCta.test.jsx \
  src/components/NorthernLightsMap.test.jsx src/components/NorthernLightsCard.test.jsx \
  src/components/NorthernLightsCard.landingVariant.test.jsx \
  src/pages/NorthernLightsLanding.test.jsx src/pages/NorthernLightsLanding.metadata.test.jsx \
  src/pages/NorthernLightsLanding.homeHandoff.test.jsx src/pages/NorthernLightsLanding.cardWiring.test.jsx \
  src/pages/NorthernLightsLanding.affiliateHolder.test.jsx \
  src/App.northernLightsHomepageCheckout.test.jsx src/App.northernLightsAnchor.test.jsx
```
Result: **30 test files, 383 tests, all passing.**

**N9 — test discovery via `rg --files`:** of the files Ripley's prompt named, all of `openMeteo.test.js`, `fanout.test.js`, `orchestrate.test.js`, `rankDecision.test.js` (resolved alongside the unnamed-but-existing `freshness.test.js`, `darknessWindow.test.js`, `constants.test.js`, `resolveLocations.test.js`, `validateRequest.test.js` in the same directory), `api/aurora-decision.test.js`, `auroraScoring.test.js`, `auroraDecisionCache.test.js`, `useAuroraDecision.test.js`, `useAuroraThreeNight.test.js`, and every `NorthernLightsThreeNight*`/`NorthernLightsLanding*` test file **already existed**. `AuroraNightOutlook.jsx` has **no dedicated test file** (confirmed absent via `rg --files -g '*AuroraNightOutlook*'`, which returned only the component itself) — its one relevant behavior (note attached to selected qualifying best only) is covered indirectly through the real `NorthernLightsThreeNight` integration tests instead, since the approved prompt's own UI-verification instructions (contract §7) point at that same observable behavior without requiring a new dedicated file for a component this ticket does not edit.

Final full validation (run after all edits):
```
npm run test:run   # 182 files, 2694 tests, all passing (was 182/2676 at the last known baseline in docs/ai/CURRENT.md's handoff history — +18 tests, 0 files added, 0 deleted)
npm run lint       # clean, no errors or warnings
npm run build      # succeeded in 8.94s (pre-existing >500kB chunk-size advisory warning on index-*.js, unrelated to this ticket, not newly introduced)
```

## Browser evidence

Fresh production build (`npm run build`, confirmed succeeded above) served via `vite preview` on a dedicated port, driven by a one-off Playwright script (not retained — deleted after the run, consistent with prior tickets in this repo not retaining their own capture scripts). All API calls are **mocked** (`page.route()`, same established pattern as `tests/e2e/northern-lights-card-visual.spec.js`) — labeled as such per N10; native request/unit behavior is established only by the server-side tests above and the cited documentation, never by this browser evidence.

Captured to `outputs/ticket-452-browser-evidence/` (8 screenshots, all inspected visually and via accessible-text assertions in the capture script itself, 10/10 checks passed):

| # | File | Scenario | Checked |
|---|---|---|---|
| 1 | `01-homepage-is-desktop-windy.png` | Homepage, IS, desktop, flagged fixture | Real IS wind-note text visible, visually confirmed |
| 2 | `02-homepage-is-desktop-calm.png` | Homepage, IS, desktop, corrected (unflagged) fixture | Note correctly absent, visually confirmed |
| 3 | `03-homepage-en-mobile320-windy.png` | Homepage, EN, mobile 320px, flagged fixture | Real EN wind-note text visible; no horizontal overflow (`scrollWidth=320`) |
| 4 | `04-landing-forced-en-despite-saved-is.png` | `/en/northern-lights`, `localStorage.lang="is"`, corrected fixture | Page renders forced English title (not the Icelandic one) despite saved IS; note correctly absent |
| 5 | `05-landing-forced-en-windy.png` | Same forced-EN route, flagged fixture | English note text visible |
| 6 | `06-selected-night-tonight-calm.png` | Tonight tab, corrected fixture | Note absent for the currently-selected night |
| 7 | `07-selected-night-tomorrow-windy.png` | Same session, switched to Tomorrow tab, flagged fixture for that night | Note appears for the newly-selected night only |
| 8 | `08-all-poor-flagged-no-note.png` | All-poor branch, sole location flagged | `nl3-all-poor` branch renders; note correctly never shown, confirming existing all-poor behavior was not redesigned |

Status: **implemented, reviewed** — never described as "fixed in production." No live account/Neon/payment/GA/provider probe was performed or needed.

## Unresolved assumptions / remaining limitations

- Production unit correctness is docs/sample-backed only; it is **unverified until the first real post-deploy Open-Meteo response** is observed (an owner-side, separately approved check — not performed by CC, per N2's explicit instruction and the standing no-live-probe boundary).
- Whether Open-Meteo's `customer-api` host (used when `OPEN_METEO_API_KEY` is set) honors `wind_speed_unit` identically to the public host was not independently re-checked — the aurora path always uses the public host regardless of any key (confirmed unchanged, per the existing #450 research finding reused here, not re-verified).
- Whether 12 m/s is the appropriate caution threshold is out of scope (#437).
- No DB migration, cache-version bump, or purge was needed or performed (cache/store matrix above is the full, grep-supported evidence for that conclusion).

## STOP triggers — none fired

Checked against every STOP condition in the approved prompt: no wind-bearing persisted store found (N5); no change needed outside `openMeteo.js` and its own test file for the guard (N2); no other `windspeed_unit` call site touched; no UI or scorer edit was needed; no live provider probe was performed or considered necessary. Scope stayed exactly within the approved prompt's authorized boundary throughout.

## v2 Correction (2026-10-20, documentation-only, per `approved-prompt-v2.md`)

Jonesy's result review (`result-review.md`) identified one MEDIUM finding, **Y1**: the "Old-tab limit (N6)" section above wrongly stated that switching the selected night triggers a fresh `load()` call. It does not — `useAuroraThreeNight.js` fetches all three nights at mount (three unconditional, fixed-key `useAuroraDecision` calls), and `selectedDate` only chooses which already-loaded slot is displayed; the original wording also implied a "Try again" retry control was reachable from an already-successful/all-poor result, when `onRetry` is in fact wired only in the `expired`/`transport_error`/`contract_defect`/`domain_unavailable` branches. Ripley independently confirmed Y1 and additionally caught a second error in the same report: the "Expected and intended visible effect" paragraph's "roughly 13×" wind-ratio claim was wrong (a unit-mismatch arithmetic error — dividing values expressed in two different units without converting first); the correct factor, comparing like units throughout, is **3.6×**.

Both corrections were made directly in place above (the "Old-tab limit (N6)" section was rewritten in full, with a visible correction marker rather than a silent rewrite; the wind-ratio sentence in the N7 UI-trace bullet list was corrected the same way) — re-read both sections above for the current, accurate text; this note does not duplicate them. A third, related wording tightening was made to the UI-trace bullet about night-switching to remove the same implied-refetch framing. No other contradictory refresh/factor claim was found elsewhere in this report (checked via full read plus a targeted grep for "switch"/"refetch"/"fresh `load`"/"12 km/h"/"43"-style figures).

**No application, test, scoring, threshold, UI, provider, cache, or dependency change was made in this correction round** — per `approved-prompt-v2.md`'s explicit scope, only this file and the required `CURRENT.md` lifecycle fields were touched. The v1 implementation, all v1 tests, the v1 test run/lint/build results, and the v1 browser-evidence screenshots are **unchanged and not re-run**; every count and result cited in this report above this section remains an accurate, historical record of the v1 round specifically, not a fresh v2 result. `git diff --check` on this file: clean (exit 0, no whitespace errors). No live request, commit, push, deployment, or GitHub change was made.

## Lifecycle

No commit, push, deployment, production mutation, or GitHub issue/comment/closure/Project change was performed in either round. `docs/ai/CURRENT.md` updated: handoff-log entry appended, `Stage` set to `CC_COMPLETE`. Per the workflow, the owner sends "CC búinn" to Jonesy next for the v2 narrow result re-check, then Ripley final assessment.
