# cc-report — ticket #503 source-time: attribution and response-time display

## Scope delivered

Per `approved-prompt-v1.md` P1-P7: `WinterRouteDataView` (the "Velja staði"
data view shared by all 25 connected pairs) now shows the same legal/
attribution text the legacy fixed-route view already shows, plus honest
response-time and cache-age information. UI-only: no new API request, no
backend/cache/geometry change, no new dependency.

## What's shown, and what each timestamp actually means

- **Attribution** (`winterRouteAttributionRoadLine`/`...WeatherLine`) and
  the four existing legal/safety lines (`winterRouteModifiedBy`/
  `NoEndorsement`/`OfficialOverride`/`NotSafetyAdvice`) — reused verbatim
  from the legacy view, no new wording. Always shown when either data part
  is `available: false` too (a `200` with a partially-unavailable part is
  not an error state; these texts describe data provenance, not fetch
  success).
- **"Svar útbúið {time} UTC."** — `generatedAt`, the server timestamp
  taken **before** road/forecast is awaited (confirmed in
  `winter-route-data.js`: `const now = new Date()` precedes the
  `Promise.all` fetch). This is **not** a fetch/acquisition time and can
  lag the real upstream fetch by up to ~15s (the per-fetch timeout) — the
  wording says "response generated", never "sótt"/"nýsótt".
- **"Færð: Vegagerðin keyrði gögnin út {time} UTC."** — the real upstream
  export time, read from the existing payload
  (`roadSections[].export.dagsKeyrtUt`), the **oldest** valid value among
  sections (conservative; in practice all sections share one feed's own
  export time). Shown only when `segmentsAvailable` is true. This is a
  genuine fact already present in the response — no backend change was
  needed, confirmed in the real browser run (14:19 UTC export vs 14:22 UTC
  response-generated, a real few-minute gap).
- **Cache-age lines** (road and forecast, separate) — "under a minute" for
  `< 60000ms`, otherwise `Math.round(cacheAgeMs/60000)` minutes — the
  **same** rounding the existing stale-line text already uses, so two
  minute figures never disagree in the same view (confirmed by a
  dedicated test with distinct 4min/9min values). Gated strictly on that
  part's own `available === true` **and** a finite, non-negative
  `cacheAgeMs` — a real `roadMeta = { available: false, cacheAgeMs: 0 }`
  shape (confirmed to actually occur in `winter-route-data.js` when both
  road feeds fail cold) never shows a false "under a minute".
- **The forecast has no upstream/model time in its payload at all** — only
  cache age is ever shown for it. This is a disclosed, accepted limit, not
  hidden: `closure-assessment.md`'s own criterion-6 row now says so
  explicitly, and `cc-report.md` restates it here per P7.

## Implementation

- Two new pure helpers in `src/lib/winterRoutePresentation.js`:
  `formatValidatedUtcTimestamp` (unlike the existing `formatTimestamp`,
  which slices through any 16+-character string unchecked and is left
  **unchanged** for its own legacy call site, this one validates shape +
  `Date.parse` and returns `null` — never "— UTC" — on anything invalid)
  and `cacheAgeMinutesDisplay` (the under-a-minute/rounded-minutes
  classification above, `null` on invalid input).
- 6 new, narrowly-scoped i18n keys (IS/EN):
  `winterRouteDataGeneratedAtLine`, `winterRouteRoadExportedAtLine`,
  `winterRouteRoadCacheAgeLine`/`...UnderMinuteLine`,
  `winterRouteForecastCacheAgeLine`/`...UnderMinuteLine`. The existing
  T3 banned-word sweep test (departure/arrival/ETA/komu/brottför) already
  covers them automatically (it iterates all `winterRoute*` values).
  `winterRouteAcquiredAt` (legacy) is untouched.
- New block added at the bottom of `WinterRouteDataView`, outside
  `role="status"` (the sr-only status line above it still only announces
  the heading/loading/error text, confirmed by a dedicated test).

## Tests — before/after, commands

- `src/lib/winterRoutePresentation.test.js`: 7 tests before this round →
  **15 after** (8 new: `formatValidatedUtcTimestamp`'s own validation
  cases including a 16+-char garbage string that would slice through the
  old `formatTimestamp`, and `cacheAgeMinutesDisplay`'s own 59999/60000/
  89999/90000ms boundaries Jonesy's own review named).
- `src/pages/WinterRoute.test.jsx`: 118 tests before this round (already
  reflecting the owner's own commits through the `ring-completion` round)
  → **126 after** (8 new, covering P6's own required scenarios: fresh
  0/0, distinct 4min/9min road vs. forecast ages, stale road+forecast
  agreeing with the existing amber text, round unavailable **with**
  `cacheAgeMs: 0` in the payload, forecast unavailable with no
  `cacheAgeMs` key at all, both unavailable, and invalid/missing/
  negative/garbage timestamps/ages all silently omitting their own line
  without a crash). One fixture (`budardalur`↔`holmavik`, the Westfjords
  `regionVersion` identity) is reused across all 8, per the approved
  prompt's own explicit instruction not to duplicate per-pair.
- Both files run via PowerShell (`npx vitest run ... --testTimeout=60000`
  for the full `WinterRoute.test.jsx` run, per Jonesy's own note about a
  known-flaky older #502 timing test unrelated to this round) —
  **141/141 passing** across both files together. ESLint clean on all
  touched files (`WinterRoute.jsx`, `WinterRoute.test.jsx`,
  `winterRoutePresentation.js`, `winterRoutePresentation.test.js`,
  `translations.winterRoute.js`). `git diff --check` clean (only benign
  LF→CRLF normalization warnings).

## Real browser verification

`vercel dev` (3000) and `vite dev` (5173) were already running outside
this session (confirmed via `curl` before use, never started/stopped by
me). A disposable, uncommitted Playwright script (deleted after use) drove
the real, unstubbed backend for `budardalur↔holmavik`:

- **Desktop/IS**: all expected lines present with real data — "Færð:
  Vegagerðin keyrði gögnin út 2026-11-24 14:19 UTC.", "Svar útbúið
  2026-11-24 14:22 UTC." (a genuine few-minute gap between the two,
  confirming they are NOT the same value), both cache-age lines read
  "innan við mínútu" (a cold/fresh real fetch), attribution/legal text and
  both links all present.
- **Mobile 360px/EN**: the same, in English, no horizontal overflow —
  "Road data: Vegagerðin exported this at 2026-11-24 14:19 UTC.",
  "Response generated 2026-11-24 14:22 UTC.".

Both screenshots genuinely reviewed (not just claimed), saved only into
`docs/ai/tasks/ticket-503/source-time/evidence/`:
`budardalur-holmavik-source-time-desktop-is.png`,
`budardalur-holmavik-source-time-mobile-en.png`. No prior round's own
evidence images were touched (this task's own `evidence/` folder was
empty before this round). Not screenshotted: a generic ring-completion
pair, a stale/unavailable case, desktop-EN, mobile-IS — the real-time
fresh state can't be forced to show a stale/unavailable case live, so
those are covered by the component tests above instead, not fabricated as
a visual "PASS".

## `closure-assessment.md` — criterion 6 updated

The "Gagnatími/uppruni/stale/unknown/failure sýnilegt" row is now marked
PASS with the disclosed forecast-cache-age-only limit stated explicitly.
The "Minnsta skrefið sem vantar" section is replaced with a CC-attributed
status note (clearly marked as this round's own addition, not rewritten
in Ripley's own voice). **The GitHub issue is not marked closed** — that
recommendation, and the final #503 closure decision, remain the owner's
and Ripley's own call via the normal `RESULT_REVIEW` step.

No commit/push/deploy/GitHub action was taken.


## Ripley skjalaskýring — 2026-11-24

Legacy winterRouteAcquiredAt („Færðargögn sótt“) merkir generatedAt ónákvæmt sem sóknartíma; serverstimpillinn er tekinn fyrir fetch. Þessu gamla orðalagi var haldið óbreyttu samkvæmt approvedscope. Ný sýn greinir serverstamp/upstreamexport/cacheage rétt. Þetta er ekki heimild til nýrrar sjálfvirkrar lotu. Lokamat í closure-assessment.md uppfært af Ripley, bíður eigandasamþykkis á birtingu.
