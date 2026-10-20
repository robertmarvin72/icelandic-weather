# Ticket #453 — CC report (approved-prompt-v1.md)

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/453 — "Samræma Open-Meteo-áskriftaraðgang í spáleiðum" (unify Open-Meteo subscription access across forecast routes).

## Baseline / git scope

- HEAD at start and end: `14e7b8dd1283f57b1f822084563326ccb49108a4` (no commit made by CC).
- `git status --porcelain=v1` before this ticket's edits: ` M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-453/` — clean of any other pending work (the prior #450/#452 untracked task directories were committed by the owner between rounds; HEAD moved accordingly from the previous ticket's own baseline, as expected of owner-controlled commits, not anything CC did).
- `git diff --stat` after this ticket's edits (full, exact):
  ```
  .env.example                              |  11 +++
  README.md                                 |   4 +
  api/_lib/auroraDecision/openMeteo.js      |  25 ++++-
  api/_lib/auroraDecision/openMeteo.test.js | 147 +++++++++++++++++++++++++++++-
  api/forecast.js                           |  33 +++++--
  api/forecast.test.js                      | 147 +++++++++++++++++++++++++++++-
  docs/ai/CURRENT.md                        |  39 +++-----
  7 files changed, 367 insertions(+), 39 deletions(-)
  ```
- New untracked files: `api/_lib/openMeteoAuth.js` (the new shared helper), `api/_lib/openMeteoAuth.test.js` (its unit tests), `docs/open-meteo-auth.md` (setup docs), `docs/ai/tasks/ticket-453/` (this task's own directory).

## Route / host / auth inventory (read-only trace, performed before any edit, per contract §1)

| Route | Host selection (before) | Client-reachable? | Dev bypass? |
|---|---|---|---|
| `api/forecast.js` (campsite forecast proxy) | `process.env.OPEN_METEO_API_KEY` read inline; truthy → `customer-api.open-meteo.com` + `apikey`; else → public `api.open-meteo.com` | Yes — called by `src/lib/forecastCache.js` via `/api/forecast?...` | **Yes** — `vite.config.js`'s dev server proxies `/api/forecast` straight to public `api.open-meteo.com`, bypassing this handler entirely under plain `npm run dev` |
| `api/_lib/auroraDecision/openMeteo.js` (`buildOpenMeteoUrl`/`fetchLocationWeather`) | Always public `api.open-meteo.com`, no key, no `apikey` param — confirmed by reading the file directly before any edit | No — server-only, invoked from `api/_lib/auroraDecision/fanout.js`, which is invoked from `api/_lib/auroraDecision/orchestrate.js`, which is invoked from `api/aurora-decision.js` (the Vercel handler) | No — this path has no client-side route or dev-proxy equivalent; it only runs when the actual backend (`vercel dev` or deployed) is running |

Other active callers/consumers confirmed by reading source, not assumed:
- `src/lib/forecastCache.js` — client-side cache that calls `/api/forecast` (never Open-Meteo directly); throws a generic `Error` on any non-OK response, reading only the HTTP status, never a JSON `error` code — confirmed by reading its exact throw sites, which is why reusing the existing `forecast_error`/`forecast_failed` 502 shapes for the new config-failure path needed no client-side change.
- `api/_lib/auroraDecision/fanout.js` — bounded-concurrency fan-out calling `fetchLocationWeather` per location, writing results into a pre-sized array by index; no persistence, confirmed unchanged by this ticket (zero diff).
- `api/_lib/auroraDecision/rankDecision.js` — consumes each location's `{ok, reason}`/`{ok, hourlyRows}` result; `weather_fetch_failed` already an accepted `reason` string (confirmed at `rankDecision.js:42-43`, which copies `weatherResult.reason` straight into the `excluded` entry's `status`/`reasons` — this is why Q3 requires reusing that exact string rather than inventing a new one).
- Every other `windspeed`/`OPEN_METEO`/`customer-api` hit found by the repo-wide search below is either this ticket's own new file, an unrelated campsite-forecast-feature file (`CampsiteComparisonSection.jsx`, `compareCampsiteForecasts.js`, `routeRisk.js`, `shelterUtils.js`, `useLeaderboardScores.js`, `windUtils.js`, `hazardWindow.js` — confirmed untouched, out of scope per the prompt), a code comment/JSDoc referencing Open-Meteo's field names (no request constructed there), a static attribution string (`Footer.jsx`, `translations.common.js`'s `footerDataBy` key — "Data by Open-Meteo"), or historical research/docs in `docs/ai/tasks/ticket-450/` and similar (samples/archives, not active code).

No additional active backend request path requiring broader scope was found — no STOP triggered on this axis.

## Owner-confirmed facts, with provenance (unknowns stated explicitly)

| Fact | Status | Provenance |
|---|---|---|
| `OPEN_METEO_API_KEY` configured in Vercel **Development** | Owner-reported | `docs/ai/CURRENT.md` 2026-10-20 handoff entry; `prompt-review.md` |
| `OPEN_METEO_API_KEY` configured in Vercel **Production** | Owner-reported | same |
| `OPEN_METEO_API_KEY` configured in Vercel **Preview** | **UNKNOWN** — not confirmed either way | explicit in the approved prompt's binding decisions |
| Key **validity** (not expired/revoked, actually works against the customer host) | **Unverified** | no live request made or authorized |
| Whether this Vercel project has "Enable access to System Environment Variables" turned on (required for `VERCEL_ENV` to actually populate at runtime) | **Unverified** | owner-side metadata check, explicitly out of CC's reach; confirmed from Vercel's own docs (fetched 2026-10-20, https://vercel.com/docs/environment-variables/system-environment-variables) that `VERCEL_ENV` is a system environment variable with values `production`/`preview`/`development`, and that the project setting gating system-variable exposure is a real, separate toggle — consistent with Jonesy's caveat |
| Open-Meteo pricing/customer-host documentation | VERIFIED DOCUMENTATION, checked 2026-10-20, https://open-meteo.com/en/pricing — describes the dedicated `customer-api.open-meteo.com` host with an `apikey` query parameter and otherwise identical syntax. This is provider documentation only — **not** proof of this owner's specific tier, rights, or working credentials; no legal/compliance conclusion is drawn |

## Missing-key policy matrix (Q1, implemented exactly as owner-decided)

| Key state | `VERCEL_ENV` | Result |
|---|---|---|
| Present (trimmed, non-blank) | any (including undefined) | Customer host + `apikey` |
| Missing/blank | `"production"` | **Fail closed** — no fetch attempted, structured failure returned, nonsecret diagnostic logged |
| Missing/blank | `"preview"` | Public host, nonsecret warning logged |
| Missing/blank | `"development"` | Public host, nonsecret warning logged |
| Missing/blank | undefined (plain local/`vitest`/`node`) | Public host, **no** warning (expected, ordinary local case) |
| Missing/blank | any other string (e.g. a future/unknown value) | Public host — only the literal string `"production"` ever fails closed |

A whitespace-only key (e.g. `"   "`) is treated identically to a missing key throughout — confirmed by an explicit test.

## Implementation

### New shared helper: `api/_lib/openMeteoAuth.js`

`resolveOpenMeteoAuth(env = process.env)` returns `{ host, apiKey, failClosed }` and does nothing else — it builds no URL itself, so each caller keeps its own field list, date range, and unit-parameter spelling completely unchanged (Q2/contract §2). Configuration is read **at call time** (the `env` parameter defaults to `process.env` evaluated when the function runs, never captured at module import time), so tests can inject an explicit `env` object and nothing leaks between tests. It never reads a `VITE_`-prefixed variable and is never imported from `src/` (confirmed — see "Credential boundary" below).

### `api/_lib/auroraDecision/openMeteo.js`

- `buildOpenMeteoUrl` gained two **optional** parameters, `host` and `apiKey`, both defaulting to the previous hardcoded public/keyless behavior — every existing call site and test that omits them produces the byte-identical URL as before this ticket (confirmed: the pre-existing `buildOpenMeteoUrl` test and all #452 tests pass unmodified). `wind_speed_unit=ms` (#452) and the metadata guard in `normalizeOpenMeteoHourly` are both untouched.
- `fetchLocationWeather`: the URL build (now config-dependent) moved **inside** the `try` block — it was outside it before this ticket, per the prompt's own finding — and resolves auth as the very first step inside that block. If `resolveOpenMeteoAuth()` reports `failClosed`, the function returns the **existing** `{ ok: false, reason: "weather_fetch_failed" }` shape immediately, with **no fetch call at all**, after logging one static, nonsecret diagnostic line naming the environment (never the key or a URL). `resolveOpenMeteoAuth` itself never throws, so this can never escape as an exception into `Promise.all` in `fanout.js` — confirmed by an explicit test awaiting the call directly.
- A non-ok upstream response now logs the HTTP status code only (e.g. to distinguish a keyed-host 401/403/429 from any other failure) — the aurora path previously logged nothing at all on this path; this is a new, narrow addition, never the response body or the request URL.

### `api/forecast.js`

- Host/key selection now goes through `resolveOpenMeteoAuth()` instead of reading `process.env.OPEN_METEO_API_KEY` inline. A fail-closed result returns the **existing** `502 { error: "forecast_error" }` shape (the same code already used by the route's generic catch-all), with `Cache-Control: no-store` explicitly set before that early return (the route's existing no-store header is set later, after a real upstream round-trip, so this new early-return path needed its own explicit header per Q6).
- The two log sites the prompt flagged were both fixed: the upstream-failure log (`!r.ok`) now logs `{ status: r.status }` only, never the raw upstream text; the generic `catch` block's log now logs `{ name: err?.name }` only, never the raw error object. Both changes verified by tests that make the upstream body and a thrown error's message literally contain the fake sentinel key and a keyed URL, then assert neither string ever reaches `console.error`'s captured output.
- The client-facing `windspeed_unit` query-parameter passthrough (a *different*, legacy-spelled parameter name than the aurora path's own canonical `wind_speed_unit=ms`) is **untouched** — it is a distinct, pre-existing, client-controlled unit-preference mechanism for this route specifically, explicitly preserved per the approved prompt ("legacy `windspeed_unit` passthrough... unchanged").

### Request-construction invariants (Q7)

- Exactly one `apikey` parameter is ever present on a keyed request (confirmed via `searchParams.getAll("apikey")` returning a single-element array in both routes' tests).
- Client-supplied `apikey`/`host`/`url`-style query parameters are structurally ignored: both routes build their upstream URL fresh via `new URL(...)`, copying only a fixed, known set of parameters — neither route has ever done a generic pass-through of arbitrary client query parameters. This was already true before this ticket; a new test proves it explicitly for `api/forecast.js` (the aurora path takes no client input of any kind, so there is nothing for a client to override there).
- No `VITE_OPEN_METEO*` variable was introduced or read anywhere.
- `apikey` is appended last, after every other parameter, in both routes — no reordering of existing parameters.

## No-fallback / security evidence

- **No public fallback after a keyed-request failure**, in either route: a 401 from the keyed host is reported as the existing failure shape with **exactly one** fetch attempt made — confirmed by tests in both `api/forecast.test.js` and `api/_lib/auroraDecision/openMeteo.test.js` asserting `fetchImpl`/`fetch` was called exactly once.
- **No success-payload key scanner was added** (binding Q5) — ordinary valid success passthrough is unchanged in both routes; no evidence was found during this ticket that a successful Open-Meteo weather payload could itself contain a credential, so broadening the passthrough contract with a new scan (and a new 502 path) was not implemented, per the explicit binding decision. The leak hazard from upstream-echoed error text/objects is graded **INFERRED/UNKNOWN**, never VERIFIED, in this report, matching Q5's instruction.
- Four new tests (two per route) construct a fake sentinel key and a keyed-URL-bearing upstream body/thrown error, then assert the sentinel string never appears anywhere in captured `console.*` output.

## Credential boundary (Q9)

Repo-wide search for `open-meteo`, `OPEN_METEO`, `customer-api` (case-insensitive) across `src`, `api`, `scripts`, `tests`, `vite.config.js`, `README.md`, `docs`:
```
rg -ni "open-meteo|OPEN_METEO|customer-api" src api scripts tests vite.config.js README.md docs
```
676 total lines matched. Classified by file: every `src/`/`api/` hit outside this ticket's own new files is either (a) the dev-bypass in `vite.config.js` (documented, unchanged), (b) a static attribution string/link (`Footer.jsx`, `translations.common.js`), (c) a code comment or JSDoc referencing Open-Meteo's field-name provenance with no request construction (`CampsiteComparisonSection.jsx`, `compareCampsiteForecasts.js`, `useForecast.js`, `auroraDecisionCache` constants file, `api/aurora-decision.js`'s own header comment, `auroraScoring.js`, `weatherVoiceTypes.js`, `dailyWeatherSummary.js`, `weatherPresentation.js`), or (d) this ticket's own touched/new files (`api/forecast.js`, `api/forecast.test.js`, `api/_lib/auroraDecision/openMeteo.js`, `api/_lib/auroraDecision/openMeteo.test.js`, `api/_lib/openMeteoAuth.js`, `api/_lib/openMeteoAuth.test.js`). `scripts/` and `tests/` (the Playwright e2e directory) returned **zero** hits for these three literal strings. Every `docs/` hit is historical research/task-history content (ticket #450's own archives and prior tickets' reports), not active code.

Credential-boundary checks, run against the actual files/fresh build:
```
rg -n "openMeteoAuth" src/                 # 0 matches — the helper is never imported from src/
npm run build                              # fresh production build
rg -n "customer-api" dist/                 # 0 matches
rg -ni "apikey" dist/                      # 0 matches
rg -n "OPEN_METEO_API_KEY" dist/           # 0 matches
```
All four searches returned zero matches, confirmed twice (once mid-implementation, once again against the final build used for the full validation below) — the helper, the customer host string, and any `apikey` handling never reach the client bundle.

## Changed files

| File | Change |
|---|---|
| `api/_lib/openMeteoAuth.js` | **New.** Shared host/apiKey/failClosed resolution, read at call time |
| `api/_lib/openMeteoAuth.test.js` | **New.** 15 unit tests for the helper |
| `api/_lib/auroraDecision/openMeteo.js` | `buildOpenMeteoUrl` gained optional `host`/`apiKey` (backward-compatible defaults); `fetchLocationWeather` resolves auth inside its `try` block, fails closed without fetching, logs status code on non-ok and a diagnostic on fail-closed |
| `api/_lib/auroraDecision/openMeteo.test.js` | **⚠ corrected v2, D3: v1's own text here said "+10", which didn't even match its own itemization (1+8=9) — the correct v1 count is +9.** v1: +9 tests (1 for optional host/apiKey on `buildOpenMeteoUrl`; 8 for `fetchLocationWeather`'s auth/no-fallback/logging behavior). v2 adds +2 more (see "v2 Correction" section below) |
| `api/forecast.js` | Host/key selection now goes through the shared helper; fail-closed path reuses the existing `forecast_error` 502 shape with explicit `no-store`; both flagged log sites redacted to status-code/`err.name` only |
| `api/forecast.test.js` | +9 tests: customer-host selection, public-host fallback (undefined/preview), fail-closed in production, whitespace-key handling, client-param-ignored, no-fallback-after-401, two log-redaction tests |
| `.env.example` | Added empty `OPEN_METEO_API_KEY=` with a server-only comment pointing to the new doc |
| `README.md` | New "Documentation" section linking `docs/open-meteo-auth.md` |
| `docs/open-meteo-auth.md` | **New.** Full setup/behavior doc per contract §5/Q10 |

### Files explicitly NOT changed

`src/lib/auroraScoring.js` (zero diff), `vite.config.js` (dev bypass preserved exactly, per Q2 — no key/host logic added there, no key ever enters Vite config or the browser), `src/components/AuroraNightOutlook.jsx`, `src/i18n/translations.*.js`, `api/_lib/auroraDecision/fanout.js`, `api/_lib/auroraDecision/orchestrate.js`, `api/_lib/auroraDecision/rankDecision.js`, `src/lib/forecastCache.js`, `src/lib/forecastNormalize.js`, any DB/cache schema, `src/lib/auroraDecisionCache.js`, `src/hooks/useAuroraDecision.js`/`useAuroraThreeNight.js`.

## Exact test commands and counts

**(v1-round results, attributed historically — api/forecast.test.js and api/_lib/auroraDecision/openMeteo.test.js were further extended in the v2 correction round below; see "v2 Correction" for the current, final counts and commands for those two files.)**

Targeted suites:
```
npx vitest run \
  api/_lib/openMeteoAuth.test.js api/forecast.test.js api/admin.forecast-normalize.test.js \
  api/_lib/auroraDecision/openMeteo.test.js api/_lib/auroraDecision/fanout.test.js \
  api/_lib/auroraDecision/orchestrate.test.js api/_lib/auroraDecision/rankDecision.test.js \
  api/aurora-decision.test.js src/lib/auroraScoring.test.js \
  src/lib/forecastNormalize.windRainIndependence.test.js src/MapView.test.jsx \
  src/hooks/useForecast.scoringInvariance.test.js src/hooks/useForecast.provenance.test.js \
  src/hooks/useLeaderboardScores.windRainIndependence.test.js \
  src/components/CampsiteComparisonSection.test.jsx src/components/HourlyForecastModal.test.jsx
```
Result: **16 test files, 176 tests, all passing.**

Final full validation (run after all edits):
```
npm run test:run   # 183 files, 2727 tests, all passing (was 182/2694 at the last recorded baseline -- +1 file, +33 tests: 15 helper + 9 forecast.test + 9 openMeteo.test)
npm run lint       # clean, no errors or warnings
npm run build      # succeeded in 4.74s (pre-existing >500kB chunk-size advisory warning only, unrelated to this ticket)
```

No browser screenshot matrix was produced — no UI changed (per contract §"no browser screenshot matrix required for unchanged UI"). The bundle/import and `dist/` evidence above is the credential-boundary evidence in its place.

## STOP triggers — none fired

Checked against every STOP condition in the approved prompt: no additional active request path requiring wider scope was found; the Q1 missing-key policy was resolved by the owner before execution; the guard/helper changes stayed entirely within `api/_lib/openMeteoAuth.js`, `api/_lib/auroraDecision/openMeteo.js`, `api/forecast.js`, and their own test files; no global test-setup file was touched; no evidence was found that a successful Open-Meteo payload itself could carry a credential (so the Q5 scanner exception was not needed); no UI/gating/scoring/model/unit/cache change was made; no new library was added; no live credential/provider/account request was made or considered necessary; `rankDecision`/the classifier never needed a new failure-reason string (the existing `weather_fetch_failed` was reused, per Q3).

## Status vocabulary and unresolved items

**Implemented, reviewed** — not deployed by CC, and never described as "fixed in production." Production verification of the fail-closed path, the Preview key's actual presence, key validity, and the keyed host's real `wind_speed_unit`/`hourly_units` behavior (Q8) all remain **incomplete**, not passed, and are explicitly owner-side post-deployment checks per `docs/open-meteo-auth.md`'s own "Operational verification" section — nothing in this ticket's mocked tests is represented as proof of any of those.

## v2 Correction (2026-10-20, per `approved-prompt-v2.md`)

Jonesy's result review found one MEDIUM (**T1**) and two LOW/LOW-MEDIUM findings (**D1**, **D2**), plus a documentation accuracy note (**D3**). v1's design, host/key policy, no-fallback behavior, and #452 unit guard were all independently re-verified from source by Jonesy and are unchanged here.

### T1 (MEDIUM) — the thrown-error redaction tests were not provably effective

**Finding:** the v1 tests for "a thrown fetch error ... never reaches console output" captured `console.error`'s arguments with `JSON.stringify(call)`. `JSON.stringify` on an `Error` object renders as `{}` (Error doesn't expose its own `message`/`stack` as enumerable own properties), so these tests would have passed even if the real implementation had logged the raw `Error` object directly — they were not actually proving redaction, only that `JSON.stringify` can't see inside an `Error`.

**Fix:** both test files now capture console arguments with `util.format(...args)` instead (a `formatConsoleCalls(spy)` helper added to each file — `node:util`'s `format`, which inspects a non-string argument, including an `Error`'s message/stack, essentially the same way `console.error` itself would print it). Both strengthened tests were extended to also plant the sentinel in `err.name` and `err.stack`, not just `err.message`, since any of those three fields could carry it. A new **"capture formatter sanity check"** test was added to each file, demonstrating directly (not by inference) that `util.format` exposes a sentinel embedded in a raw `Error` where `JSON.stringify` hides it — this is the proof that the strengthened capture method itself is sound, addressing T1's explicit "otherwise a negative assertion against empty output is insufficient" instruction.

**Regression-test-effectiveness proof (required by the prompt, performed and then fully reverted):**

- `api/forecast.js`: temporarily changed `console.error("Forecast proxy error")` to `console.error("Forecast proxy error", err)` (reintroducing the exact unsafe v1-era-equivalent behavior). Ran only the strengthened test:
  ```
  npx vitest run api/forecast.test.js -t "Q5/T1: a thrown fetch error whose message, name, AND stack"
  ```
  Result: **failed as expected** — `AssertionError: expected 'Forecast proxy error sentinel-fake-ke…' not to contain 'sentinel-fake-key'`, with the full sentinel-bearing message/name/stack visible in the assertion's "Received" value. Reverted the line back to `console.error("Forecast proxy error")` immediately afterward; re-ran the full file — **17/17 green** again.
- `api/_lib/auroraDecision/openMeteo.js`: the aurora catch block logs nothing in the real implementation (confirmed by reading it — there was never a historical unsafe version to "restore"), so a **synthetic** unsafe line was temporarily inserted instead (`console.error("SYNTHETIC UNSAFE MUTATION FOR TEST PROOF ONLY", err);`, clearly labeled as a test-proof artifact, not a disguised restoration of real behavior). Ran only the strengthened test:
  ```
  npx vitest run api/_lib/auroraDecision/openMeteo.test.js -t "Q5/T1: a thrown fetch error whose message, name, AND stack"
  ```
  Result: **failed as expected**, same pattern — the sentinel-bearing message/name/stack visible in the failure output, prefixed by the synthetic marker text. Removed the injected line immediately afterward; re-ran the full file — **30/30 green** again.
- Both mutations were confirmed fully absent from the final diff: `git diff api/forecast.js api/_lib/auroraDecision/openMeteo.js` (reproduced in full above, under "Request-construction invariants"/earlier sections of this report — identical to the v1 diff, no `console.error(..., err)` or `SYNTHETIC` text present anywhere). No real key, network request, or committed mutation was involved in either proof.

### D1 (LOW-MEDIUM) — `api/forecast.js` still logged the raw JSON-parse error

**Finding:** the invalid-JSON branch (`catch (parseErr) { console.error("Forecast upstream returned invalid JSON:", parseErr); ... }`) was missed in the v1 round's Q5 pass — it logged the raw `parseErr` object, which is exactly the class of raw-error-object logging Q5 prohibits. **⚠ Corrected (v3, Z1): this section previously claimed a `JSON.parse` `SyntaxError` "doesn't itself echo arbitrary upstream text into its own message in a way tied to a URL" — that claim was wrong and is withdrawn.** `JSON.parse`'s own error message DOES quote an excerpt of the parsed input (confirmed directly in this Node sandbox: parsing a malformed body throws `Unexpected token 'o', "not json at"... is not valid JSON` — the engine echoes a prefix of the actual text it was given). How much of the input is echoed, and from which position, is **runtime/engine-version dependent** and not something this report promises an exact length for; the important, engine-independent fact is only that an echoed excerpt is possible at all, which is reason enough on its own that logging the raw error object was unsafe — not that it was provably exploitable with a specific body shape.

**Fix:** `api/forecast.js`'s invalid-JSON branch now logs `console.error("Forecast upstream returned invalid JSON", { status: r.status })` — a static message plus the numeric upstream status only, never the parse error or the unparsed upstream text. The existing `forecast_invalid_json` status code and response body shape are unchanged. A new test feeds an upstream body containing the fake sentinel key and asserts the response contract (`502`, `{ error: "forecast_invalid_json" }`) is unchanged. **⚠ The v2 version of this test's own safety guarantee was itself found insufficient by Jonesy's narrow re-check (Z1) and was strengthened again in v3 — see "v3 Correction" below for the corrected test and its own mutation-proof.**

### D2 (LOW) — Ripley's decision: drop `err.name` from the generic catch, not just the rest of the error

**Finding:** v1's Q5 fix logged `console.error("Forecast proxy error", { name: err?.name })`. Jonesy flagged this against Ripley's own tightened wording of Q5 in the v2 prompt text and asked Ripley to adjudicate.

**Ripley's binding decision (D2, verbatim from `approved-prompt-v2.md`):** retain the **stricter** rule — remove `err.name` entirely from the generic catch's logging; log a fixed, fully static diagnostic instead (`console.error("Forecast proxy error")`, no second argument at all). Rationale stated in the prompt: a thrown value is caller-controlled, so `err.name` is not a trustworthy fixed classification — it could be set to anything, including a sentinel/credential-bearing string, by whatever threw it. The existing `AbortError` **comparison** (`err?.name === "AbortError"`, used only to pick which of two static branches to take, never logged) is unchanged — this is a controlled equality check against a known literal, not logging attacker-influenced data, so it was not in scope for this fix.

Implemented exactly as decided (see the full diff earlier in this report). A new test (`Q5/D2: a thrown plain object (not an Error) with an attacker-controlled name/message is never logged`) throws a **non-Error plain object** with sentinel-bearing `name`/`message`/`stack` properties and confirms none of them reach console output, in both `api/forecast.test.js` and `api/_lib/auroraDecision/openMeteo.test.js` (the aurora path never logged `err.name` to begin with — this test establishes the same guarantee there going forward, since nothing in the aurora catch block logs any thrown-value property).

### D3 — report/docs accuracy corrections

1. **cc-report.md's "+10" test-count claim.** v1's "Changed files" table said `api/_lib/auroraDecision/openMeteo.test.js` gained "+10 tests", which didn't even match its own itemization in the same sentence (1 `buildOpenMeteoUrl` test + 8 `fetchLocationWeather` tests = 9). Corrected in place above with a visible marker (not silently rewritten) to the accurate **+9** for the v1 round. This report's "Exact test commands and counts" section is marked historical/v1 above, pointing here for the v2 round's own, separately-tracked counts (below).
2. **`docs/open-meteo-auth.md`'s "single... diagnostic line" wording.** Corrected to state explicitly that the Aurora-path diagnostic is logged **once per affected location** inside the existing bounded fan-out (up to 8 locations × up to 3 nights per page load), not a single global line — with an explicit note that no deduplication was added and fan-out behavior/volume is unchanged. The campsite-forecast-route diagnostic genuinely is a single line per request (that route has only one location per request), so that half of the original wording was accurate and is unchanged.

### v2's own test additions, with fresh counts (not duplicating the v1 figures above)

| File | v2 additions |
|---|---|
| `api/forecast.test.js` | +3 tests (D1 malformed-JSON test; D2 non-Error-thrown-object test; capture-formatter sanity check). The pre-existing T1-flagged thrown-error test was strengthened **in place** (not counted as a new test) |
| `api/_lib/auroraDecision/openMeteo.test.js` | +2 tests (D2-equivalent non-Error-thrown-object test; capture-formatter sanity check). The pre-existing T1-flagged thrown-error test was strengthened **in place** (not counted as a new test) |

### v2 exact commands and fresh counts

Strengthened targeted suites (same 16-file list as v1's own targeted run, now exercising the strengthened/extended tests):
```
npx vitest run \
  api/_lib/openMeteoAuth.test.js api/forecast.test.js api/admin.forecast-normalize.test.js \
  api/_lib/auroraDecision/openMeteo.test.js api/_lib/auroraDecision/fanout.test.js \
  api/_lib/auroraDecision/orchestrate.test.js api/_lib/auroraDecision/rankDecision.test.js \
  api/aurora-decision.test.js src/lib/auroraScoring.test.js \
  src/lib/forecastNormalize.windRainIndependence.test.js src/MapView.test.jsx \
  src/hooks/useForecast.scoringInvariance.test.js src/hooks/useForecast.provenance.test.js \
  src/hooks/useLeaderboardScores.windRainIndependence.test.js \
  src/components/CampsiteComparisonSection.test.jsx src/components/HourlyForecastModal.test.jsx
```
Result: **16 test files, 181 tests, all passing** (v1's own count for this same list was 176; +5 matches the two files' own net additions above: 3 + 2).

Full validation, run after all v2 edits:
```
npm run test:run   # 183 files, 2732 tests, all passing (v1 baseline for this round: 183/2727; +5, 0 files added/removed)
npm run lint       # clean, no errors or warnings
```
**No fresh `npm run build` was run in this v2 round** — per the approved prompt's own instruction ("a new build is not required for these server-log/test/docs changes"). The build/bundle/`dist/` credential-boundary evidence earlier in this report is explicitly attributed to the v1 round only, not re-run or re-claimed here.

`git diff --check`: clean (exit 0) across every file touched in this round.

### Scope and invariants held

Only `api/forecast.js`'s logging, the two affected test files, `docs/open-meteo-auth.md`, this report, and the required `CURRENT.md` lifecycle fields were touched in this round — confirmed by `git status`/`git diff --stat` showing no other file changed beyond what v1 had already touched. No auth-policy/helper redesign, no host allowlist work, no new failure-reason string, no UI/scoring/provider/unit/date/field/cache change, no new dependency, no Vite change, and no success-payload scanner was added. The existing customer-host selection, Production-only missing-key fail-closed rule, no-public-retry behavior, and the #452 wind-unit guard are all unchanged and re-confirmed green by the test runs above. No `.env` file was read, no Vercel/account operation was performed, no live provider probe was made, and no commit, push, or deploy occurred.

### Status vocabulary (unchanged)

Still **implemented, reviewed** — not deployed. Production/Preview/key-validity/keyed-host-unit-metadata verification remain genuinely **incomplete**, owner-side, not passed by any mock in either round.

## v3 Correction (2026-10-20, per `approved-prompt-v3.md`)

Jonesy's narrow re-check of v2 accepted every v2 fix (T1/D2/D3 all confirmed resolved) except one remaining MEDIUM finding, **Z1**, against the v2 D1 test specifically.

### Z1 (MEDIUM) — the v2 D1 test could not actually fail

**Finding:** the v2 malformed-JSON test asserted only that the formatted console output didn't contain the fake sentinel string. V8 (and, per Jonesy's own reproduction, likely other engines too) truncates a `JSON.parse` `SyntaxError`'s own message to a short excerpt of the parsed input near the failure position — the test's chosen body put the sentinel later in the string than that excerpt reaches, so the sentinel was never actually present in `parseErr.message` at all, regardless of whether the implementation logged the raw error or the safe static message. The test therefore could not distinguish safe from unsafe code; it was not a false positive from a weak formatter (that was already T1, fixed in v2) but a different problem — the assertion's premise (the sentinel would be IN the logged text if unsafe) was never true for this body.

**Independently reproduced** before making any change:
```
node -e "try { JSON.parse('not json at all, apikey=sentinel-fake-key {{{'); } catch (e) { console.log(e.message); console.log(e.message.includes('sentinel-fake-key')); }"
```
Output: `Unexpected token 'o', "not json at"... is not valid JSON` / `false` — confirmed exactly as Jonesy found, on Node v24.11.0 in this environment.

**Fix:** the test (`D1/Z1: the invalid-JSON branch never logs a raw Error instance, and logs the exact safe structural call...`) now asserts two **structural**, engine-independent guarantees instead of substring-matching a possibly-absent sentinel: (1) no argument logged to `console.error` in this request is ever an `instanceof Error` — an unsafe `console.error(..., parseErr)` fails this immediately regardless of what `parseErr.message` happens to contain on whatever engine runs it; (2) the exact safe call shape was made, via `expect(errorSpy).toHaveBeenCalledWith("Forecast upstream returned invalid JSON", { status: 200 })` — this fails on any additional, missing, or different argument, including a raw error object appended alongside the safe message. The mock response was given an explicit `status: 200` so that expected status object is a meaningful, intentional value rather than an accidental `undefined` match. The original substring-against-sentinel check is retained only as a non-load-bearing supplement, exactly as the approved prompt allows ("may supplement this, but must not be the sole... guarantee") — not as the primary proof.

**Regression-test-effectiveness proof (required by the prompt, performed and then fully reverted):**
```
# 1. Baseline hash of api/forecast.js before any v3 edit:
sha256sum api/forecast.js
# 1c81af478fec1b34a2e97b26fc3cec1e1d1911d699c30a23a720a9e439b508fe

# 2. Temporarily restored the v1-era unsafe line:
#    catch (parseErr) { console.error("Forecast upstream returned invalid JSON:", parseErr); ... }

# 3. Ran only the strengthened test:
npx vitest run api/forecast.test.js -t "D1/Z1: the invalid-JSON branch never logs a raw Error instance"
```
Result: **failed as expected** — `AssertionError: expected true to be false` at the `expect(arg instanceof Error).toBe(false)` line, i.e. the structural check caught the restored raw-error logging immediately, with no dependence on the error message's content. This directly demonstrates the v2 test's blind spot is closed: the new test fails on the exact unsafe code the old one couldn't catch.
```
# 4. Restored the v2 safe implementation (static message + status) immediately.
# 5. Re-ran the full file:
npx vitest run api/forecast.test.js
# 17/17 passing — unchanged count from v2 (the D1 test was strengthened in place, not added as a new one).

# 6. Verified final api/forecast.js is byte-identical to its pre-v3 state:
sha256sum api/forecast.js
# 1c81af478fec1b34a2e97b26fc3cec1e1d1911d699c30a23a720a9e439b508fe  -- matches step 1 exactly
```
The generic and aurora catch blocks were **not** touched or re-mutated in this round (their own T1 mutation proofs were already completed in v2 and are not repeated here, per the approved prompt's explicit instruction).

### Report correction (Z1)

The "D1" finding's own writeup in this report previously claimed a `JSON.parse` `SyntaxError` "doesn't itself echo arbitrary upstream text into its own message in a way tied to a URL" — **this was wrong and is withdrawn above, in place, with a visible marker** (see the corrected "D1 (LOW-MEDIUM)" section earlier in this report). The accurate statement: `JSON.parse` error messages DO echo an excerpt of the parsed input (confirmed above), with the excerpt's length/position being runtime/engine-version dependent — this report does not promise an exact excerpt length for any specific engine, and does not claim this makes real secret disclosure "exploitable" with any particular body shape; it only establishes that logging the raw error was unsafe in principle, independent of whether any one test body happens to trigger visible leakage.

### v3 exact commands and fresh counts

```
npx vitest run api/forecast.test.js
```
Result: **1 test file, 17 tests, all passing** (unchanged count from v2 — the Z1 fix strengthened the existing D1 test in place; no test was added or removed).

Full validation, run after the final edit:
```
npm run test:run   # 183 files, 2732 tests, all passing (identical to v2's own final count -- no net test change in v3)
npm run lint       # clean, no errors or warnings
```
**No fresh `npm run build` was run in this v3 round either** — per the approved prompt's own instruction ("No build needed"). The build/bundle/`dist/` credential-boundary evidence remains attributed to the v1 round only.

`git diff --check`: clean (exit 0) across every file touched in this round.

### Scope and invariants held (v3)

Only `api/forecast.test.js`, this report, and the required `CURRENT.md` lifecycle fields were touched in this round. **`api/forecast.js` itself is confirmed byte-identical to its pre-v3 (post-v2) content** (SHA256 matched before and after the mutation-and-revert, recorded above) — the approved prompt's "final application source must remain unchanged from v2" requirement is met, not just intended. No auth-policy/helper redesign, no new failure-reason string, no UI/scoring/provider/unit/cache change, no new dependency, no Vite/proxy change. No `.env` file was read, no Vercel/account operation was performed, no live provider probe was made, and no commit, push, or deploy occurred.

### Status vocabulary (unchanged)

Still **implemented, reviewed** — not deployed. Production/Preview/key-validity/keyed-host-unit-metadata verification remain genuinely **incomplete**, owner-side, not passed by any mock in any round.

## Lifecycle

No commit, push, deployment, production mutation, or GitHub issue/comment/closure/Project change was performed in any round. No Vercel environment variable was read, mutated, or pulled. `docs/ai/CURRENT.md` updated: handoff-log entry appended, `Stage` set to `CC_COMPLETE`. Per the workflow, the owner sends "CC búinn" to Jonesy next for the v3 narrow result re-check, then Ripley final assessment.
