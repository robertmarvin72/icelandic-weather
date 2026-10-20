# #453 — Ripley initial prompt, Round 1

2026-10-20. Discussion for Jonesy only; NOT execution authorization.
Issue: https://github.com/robertmarvin72/icelandic-weather/issues/453
Title: Samræma Open-Meteo-áskriftaraðgang í spáleiðum

## Objective and context

Unify backend Open-Meteo forecast host/authentication selection for campsite and aurora forecasts, preserving all weather inputs, units, normalization, scoring, caches and response contracts. This ticket explicitly authorizes the narrow backend helper/routing work despite the general client-only guideline; no backend redesign. Existing entrypoints are campsite forecasts and homepage/EN Northern Lights. No new UI needed. #450 research and #452 wind-unit fix are retained, not reimplemented. Initial git status was clean; CC must capture its own baseline.

## Independent read-only findings

- api/forecast.js reads process.env.OPEN_METEO_API_KEY on each request; truthy key chooses customer-api.open-meteo.com/v1/forecast and apikey query parameter, otherwise public api.open-meteo.com. On upstream failure it logs raw response text; generic catch logs the error object. Both can disclose a key if upstream/error text echoes its URL. Handler returns a success payload by passthrough; assess key-echo risk without changing valid weather payload semantics.
- api/_lib/auroraDecision/openMeteo.js always builds public /v1/forecast. #452 added canonical wind_speed_unit=ms and metadata guard; both must remain. fetchLocationWeather builds the URL before its try block, so new configuration failures must not accidentally reject fanout or escape the existing structured-failure contract.
- fanout.js runs bounded workers calling fetchLocationWeather and preserves location order. orchestrate.js uses structured per-location failures. Do not put credentials in location/decision objects or response metadata.
- vite.config.js has a dedicated /api/forecast proxy directly to public Open-Meteo, before /api -> localhost:3000. It bypasses backend auth selection in local development. Workbox GET cache is separate and not in scope.
- .env.example has no OPEN_METEO_API_KEY; README is minimal. Existing api/forecast.test.js and aurora openMeteo tests provide starting patterns. Discover other callers/tests using rg --files and repo-wide searches; static descriptions and research samples are not active callers.
- Official pricing documentation checked 2026-10-20: https://open-meteo.com/en/pricing describes dedicated customer-api.open-meteo.com with apikey query parameter and otherwise identical API syntax. This is provider documentation, NOT proof of this owner's tier, rights, environment setup or working credentials. #450 owner confirmation establishes a paid subscription only. No legal/compliance conclusion is made.

## Owner facts and pre-implementation gate

Ripley asked the owner for subscription tier and yes/no/unknown OPEN_METEO_API_KEY presence in Vercel Development, Preview and Production; no secret values. Answers are pending at drafting time. Jonesy may review this draft while facts are pending. Do not infer tier or deployment state from code or a paid-subscription statement.

Before an execution prompt is finalized, record any owner answer here. If missing-key production policy or subscription access remains unresolved, STOP before implementation and request the specific missing decision. Proposed policy for review: configured nonblank key -> dedicated customer endpoint in both backend paths; no key -> public endpoint only for explicitly permitted local evaluation, while deployed commercial Preview/Production must fail closed with a sanitized configuration error. Owner must confirm no-key environment policy before this behavior is authorized. Do not silently impose an outage-inducing policy based on NODE_ENV alone; Vercel environment mapping and local vercel dev must be explicit and tested. Do not introduce an additional environment switch unless demonstrably necessary and reviewed.

Vercel presence verification is metadata-only where access exists; never pull/dump environment values or inspect secret-bearing .env files. If access is unavailable, accept clearly attributed owner confirmation or mark unknown. Production verification can remain pending; do not claim whole issue acceptance while operational criteria are unverified.

## Implementation contract (after gate resolution and approval)

1. Repeat read-only caller/data-flow inventory first, including browser direct calls, dev proxy and test paths. Separate active backend requests, dev bypasses, historical samples and unrelated providers. STOP if additional active paths require scope beyond the ticket. No provider/model switch or forecast-field changes.
2. Introduce a small server-only helper under api/_lib for fixed forecast host and apikey selection. No client imports, VITE_ key, arbitrary host input or caller-supplied credential forwarding. Read configuration at request time or inject explicit test configuration; avoid import-time environment capture and test order dependence. Preserve query fields in each caller; do not unify their different hourly lists, date ranges or unit parameter spellings. Preserve #452 wind_speed_unit=ms and runtime guard, >=12 rule and numeric scores.
3. Implement only the owner-confirmed missing-key policy. Whitespace-only input must not be treated as valid credentials; define trimming consistently. Never retry a 401/403 or any other failure on the public host. No new retries. Auth failures stay within existing sanitized forecast 502 / aurora structured weather-failure behavior unless an explicitly approved configuration-error contract is necessary. Preserve per-location isolation, abort handling, concurrency and no-store.
4. Prevent secret disclosure in responses/logs/errors: do not log upstream bodies or raw fetch error objects that may include keyed URLs. Use bounded nonsecret status/reason diagnostics. Test malicious upstream messages/errors echoing the fake key. Audit success/error passthrough for provider key echoes; use a narrow fail-closed response check if necessary, not broad weather-schema filtering, and document chosen approach. Do not print real environment values or request URLs containing real keys in reports/screenshots/console. Only fake sentinel keys in tests.
5. Add empty OPEN_METEO_API_KEY= to .env.example, with server-only guidance. Document Development/Preview/Production setup, missing-key behavior, auth failure/no fallback, restart/redeploy requirements and operational verification ownership. Prefer focused docs linked from README. No Vercel environment mutation, subscription purchase/change, deployments or account changes.
6. Dev behavior: prefer /api/forecast through the existing localhost:3000 /api backend proxy so both paths use the helper; change only the dedicated bypass if this choice is confirmed during review. Document how to run the backend, keeping npm run dev instructions accurate after checking package.json. Never inject a paid key into Vite proxy/browser query or bundle. Workbox runtime cache strategy and all other proxies remain unchanged. If preserving a public development bypass instead, require an explicit reviewed rationale and document it as an exception rather than claiming all traffic uses the backend.

## Tests and validation

Use mocked fetch and fake credentials only. Tests must restore process.env and fetch/log spies. Discover exact suite names; run helper, api/forecast, aurora openMeteo/fanout/orchestrate/rankDecision/endpoint, #452 regression, and relevant client forecast tests.

- Both real request paths with fake key choose exact customer HTTPS origin, /v1/forecast, exactly one apikey; clients cannot override host/key. All pre-existing field lists, dates, units, coordinates and timezone unchanged.
- Missing, empty and whitespace key cases per confirmed environment policy; local/Preview/Production distinctions as applicable. No environment state leaks across tests.
- 401,403,429,5xx, network error and timeout: no public fallback/second request introduced; existing sanitized output semantics and per-location isolation preserved.
- Fake-key sentinel echoed in upstream body, thrown error and possible success payload must not appear in handler responses/log output. Ensure assertions themselves use only a fake key. Helper never enters frontend import graph or built assets.
- #452 m/s request, mismatch metadata guard, score/band parity remain green. Main forecast passthrough contract remains unchanged for ordinary valid weather payloads.
- Proxy configuration evidence confirms browser requests same-origin API, credentials added only server-side. No actual paid request required to prove local code. No cache/scoring/gating changes.

After final edits run targeted suites, full npm run test:run, npm run lint, npm run build. Record fresh exact commands/counts and existing warnings separately. No browser screenshot matrix required for unchanged UI; show bundle/import and proxy evidence relevant to credential boundaries. No live credentials/provider request in test acceptance. Operational verification of both routes requires suitable account/environment access and explicit owner coordination; never represent mocks as production proof.

## Report, STOP and lifecycle

Write docs/ai/tasks/ticket-453/cc-report.md: baseline, route/host/auth inventory, owner facts with provenance (unknowns explicit), policy matrix, changed files, tests and no-fallback/security evidence, untouched weather/scoring/cache fields, setup docs, and operational status per environment. Key presence only, never value. Clearly distinguish implemented, reviewed and deployed. Unavailable production verification remains incomplete, not passed.

STOP on unresolved tier/access or no-key policy, need for wider request/data-flow changes, secret exposure that cannot be fixed narrowly, UI/gating/scoring/model/unit/cache changes, new library, live credential/probe/account/deployment requirements. Never mutate Vercel settings, commit, push or close GitHub issue.

Jonesy reviews this discussion and appends APPROVED/REVISE. Ripley resolves conditions/owner facts and creates an approved prompt only once ready; CURRENT then READY_FOR_CC. CC executes only that referenced prompt after owner Prompt approved, sets CC_IN_PROGRESS before work, writes report/populates path and sets CC_COMPLETE. Jonesy result review and Ripley final assessment follow.


## Owner configuration confirmation — 2026-10-20

Owner states: API Standard subscription; OPEN_METEO_API_KEY is configured in Vercel Development and Production. Provenance: direct owner reply in this session, not independent account/environment inspection. Preview key presence remains UNKNOWN (not mentioned, not inferred absent). Key validity and successful live operation of either route remain unverified. No secret value supplied or requested.

This updates the pending facts above; it does not establish Preview configuration or approve the proposed missing-key deployment policy. Jonesy reviews with these facts. No account/settings mutation or execution authorized by this note.


---

# Jonesy Round 1 review — 2026-10-20

Reviewer: Jonesy (technical peer reviewer; no implementation). Reviewed against live source snapshots staged this session and Ripley's Round 1 plus the owner confirmation appended above.

## Verdict: APPROVED with conditions Q1–Q10 (Q1 and Q2 are owner/Ripley decisions that must be resolved before READY_FOR_CC)

Scope and STOP rules are sound and the central design (one small server-only helper, request-time config, no public fallback on auth failure, no new retries) is right. Severity: 0 BLOCKING in the draft itself; 3 MEDIUM (Q1 environment policy, Q3 failure-reason leakage, Q4 existing-test compatibility); the rest LOW/clarity. I made no legal or licensing conclusion.

## Independently confirmed (from source)

- `api/forecast.js`: reads `process.env.OPEN_METEO_API_KEY` per request (line 38); truthy → `customer-api.open-meteo.com` + `apikey` query param (lines 40–44, 93–95), else public host. Client-controlled inputs are only `lat/lon`, `timezone`, and the three unit params; `apikey`/host are never read from the request. Values go through `searchParams.set`, so they are encoded (no parameter injection). A whitespace-only key is truthy today and would select the keyed host.
- Logging: line 110 `console.error("Forecast upstream failed:", r.status, text)` logs the full upstream body; line 140 `console.error("Forecast proxy error:", err)` logs the error object. The client response never echoes either (it returns only `upstreamStatus` / a fixed code). **Whether Open-Meteo error bodies or fetch errors actually echo the keyed URL is UNKNOWN; nothing I read shows it.** Ripley's "can disclose" is a plausible hazard, not an observed leak; the report should grade it INFERRED. The fix (never log body/error object) is cheap either way.
- `Cache-Control: no-store` is set only at line 107, after the upstream fetch resolves. Early returns (400/405) and the catch block (timeout, thrown error) do not set it.
- Aurora: `buildOpenMeteoUrl` is called at `fetchLocationWeather` line ~111, **outside** the `try`; the public origin is hard-coded; `fetchLocationWeather` logs nothing on failure and returns `{ok:false, reason}` with only `weather_fetch_failed` / `weather_timeout` / `insufficient_forecast_coverage`. `fanout.js` has no per-call try/catch, so a throw in a worker rejects `Promise.all` and `runAuroraDecision` throws → `api/aurora-decision.js` returns 500 `internal_error` for every location (it logs only `err?.message`).
- `rankDecision.js:42–43` copies `weatherResult.reason` verbatim into each excluded entry's `status` and `reasons`, which are returned to the browser. **Any new failure reason string becomes part of the public decision response and reaches the classifier/UI.**
- `vite.config.js`: dedicated `/api/forecast` proxy straight to `https://api.open-meteo.com` (rewrite to `/v1/forecast`), placed before the generic `/api` → `http://localhost:3000` proxy. `package.json`: `"dev": "vite"` only; no script starts the backend. The aurora endpoint already needs the backend (`POSTGRES_URL`) locally; the campsite forecast currently does not.
- `.env.example` has no `OPEN_METEO_API_KEY` (I viewed key names only, with values masked; I did not read any real `.env`). README is three badges.
- Of the server files I read, only `api/forecast.js` and `api/_lib/auroraDecision/openMeteo.js` call Open-Meteo; `generate-blog-draft.js`, `admin.js`, `buildBlogPrompt.js` contain no Open-Meteo reference. The client reaches the provider only through `/api/forecast` (`src/lib/forecastCache.js`). I could not search the whole repo; Q9 asks CC to.
- `src/lib/forecastCache.js` sends legacy `windspeed_unit=ms` to `/api/forecast`; aurora sends `wind_speed_unit=ms`. Both pass through unchanged today.

## Conditions

**Q1 (MEDIUM, owner decision before READY_FOR_CC) — missing-key policy per environment.** Facts: Development and Production keyed (owner-reported); **Preview unknown**; validity unverified. The proposed "deployed Preview/Production fail closed" has a real consequence: if Preview has no key when this ships, every Preview forecast (campsite 502, aurora "unavailable") breaks, whereas today it silently falls back to the public endpoint. Owner decides one of: (a) add the key to Preview first (owner action in Vercel; CC does not touch it), then fail closed in Preview and Production; (b) fail closed in Production only and let Preview/Development fall back to the public host with a nonsecret warning log, which is a terms question for the owner and not something I assess. Recommended environment signal: Vercel's platform-provided `VERCEL_ENV` (`production` / `preview` / `development`); `NODE_ENV` is `production` on Preview too, so it cannot separate them (Ripley's warning is right). Two caveats the prompt must state: `VERCEL_ENV` exists only if the project exposes system environment variables (default on; **UNVERIFIED for this project**, an owner metadata check), and plain vitest/node has no `VERCEL_ENV`. Recommended rule: key present (after trim) → customer host in every environment; key missing/blank → fail closed when `VERCEL_ENV` is `production` (and `preview` per the owner's choice); otherwise (`development` or undefined = local/test) public host allowed. That keeps current tests and local runs working, at the cost that a deployment with system variables disabled would not be detected. This is not an extra switch of our own. Production already has the key (owner-reported), so the fail-closed path is defence in depth there, not the primary mechanism. The owner must also confirm that fail-closed is acceptable if the key is later removed or rotated badly.

**Q2 (decision, Ripley/owner) — Vite dev bypass.** I recommend **not** changing it in #453 and documenting it as an explicit dev-only exception. Reasons: `npm run dev` is `vite` alone; routing `/api/forecast` through `localhost:3000` makes campsite forecasts fail unless the owner also runs `vercel dev` (and a Postgres URL for the rest of the backend); the bypass never touches deployed traffic; the contract's own alternative ("exception documented rationale") is acceptable. If Ripley prefers removal, the prompt must require README steps for starting the backend on port 3000, and the owner must accept the slower local loop. Either way no key may enter Vite config or the browser.

**Q3 (MEDIUM) — keep failure reasons inside the existing set.** The config failure on the aurora path must be returned as a structured per-location result with the **existing** reason `weather_fetch_failed` (not a new string, because of `rankDecision.js:42–43` and the classifier), and must not throw out of `fetchLocationWeather`/`fanout` (resolve config inside the `try` or catch it; `buildOpenMeteoUrl` is currently outside it). Consequence to document: with no key under fail-closed, all locations are excluded and the user sees the normal "unavailable / no_locations_scored" outcome, so the misconfiguration looks like an ordinary outage. Therefore a nonsecret server-side diagnostic is required (a single static line such as "open-meteo api key missing; failing closed" plus the environment name, never the key, URL or error object). On the campsite route, a config failure may use the existing `forecast_error`/`forecast_failed` 502 shapes or a new code only if Ripley approves it explicitly (no client consumer reads the code; `forecastCache.js` throws on any non-OK).

**Q4 (MEDIUM) — do not break existing tests; no mass edits.** Existing aurora/forecast tests call `buildOpenMeteoUrl`, `fetchLocationWeather`, the fan-out, `orchestrate` and the handler with injected `fetchImpl` and **no environment configuration**. The helper must therefore (a) keep `buildOpenMeteoUrl`'s current signature/return working for existing callers (extra optional config argument or a separate helper), (b) read configuration at call time with an injectable `env` defaulting to `process.env`, and (c) under the Q1 rule, behave as "local, public host" when `VERCEL_ENV` is undefined. Existing assertions must not be weakened or rewritten; additions only. A global vitest setup file or a change to test config counts as a STOP (global change). If CC cannot meet this without touching many existing tests, stop and report.

**Q5 — secret-disclosure fixes, graded honestly.** Change both log sites in `forecast.js` to log only the status code and a static message (no upstream body, no error object; `err.name` is fine). Label the leak hazard INFERRED/UNKNOWN in the report, not VERIFIED. Tests: fake sentinel key; upstream body and thrown error that contain the sentinel and the keyed URL must not appear in any captured `console.*` output or response. **Do not add scanning of successful responses for the key** unless CC finds evidence a success payload can contain it: Open-Meteo's success body is weather JSON, the scan would add a new 502 path outside the "passthrough unchanged" contract, and nothing indicates a need. If Ripley still wants it, require it as a documented, tested exception. The aurora path already logs nothing; add only the Q3 diagnostic plus status code (so 401/403/429 from the keyed host are distinguishable by the operator without the URL).

**Q6 — no-store on new failure paths.** Set `Cache-Control: no-store` before returning the new config-failure response (and keep it on existing paths); today the early/catch returns do not set it, so a misconfiguration 502 could be cached by an intermediary. Do not otherwise alter existing header behaviour.

**Q7 — request-construction invariants.** Exactly one `apikey` in the keyed URL; client-supplied `apikey`, `host`, `url` or similar query parameters ignored and never forwarded (add a test); origin is the fixed constant; key trimmed and blank → treated as missing (also for the `VITE_`-style mistake: no `VITE_OPEN_METEO*` variable may be introduced or read). Existing field lists, dates, `timezone=UTC`, `wind_speed_unit=ms`, legacy `windspeed_unit` passthrough and the #452 metadata guard unchanged. `apikey` is appended without reordering other parameters.

**Q8 — customer-host behaviour is unverified and affects #452.** The #452 report records that whether `customer-api.open-meteo.com` honours `wind_speed_unit` and returns `hourly_units.windspeed_10m: "m/s"` identically was never checked. With this ticket the aurora path moves to that host for the first time. If the keyed host answered with different unit metadata, the #452 guard would null wind (flag silently lost, no wrong flag). No live probe is authorized, so the report must list as **owner-side post-deploy verification, per route and environment**: aurora wind unit/metadata on the keyed host, campsite response shape unchanged, and key validity. These stay "unverified", never "passed by mocks". Also note that the aurora fan-out (up to 8 locations per request, three nights per page load) will consume paid-plan quota; no code or caching change is in scope.

**Q9 — inventory and boundary evidence.** CC runs a repo-wide search (excluding `.env*`, never opening secret-bearing files, never `vercel env pull`) for `open-meteo`, `OPEN_METEO` and `customer-api` across `src`, `api`, `scripts`, `tests`, config and docs, and classifies each hit (active backend request / dev bypass / client call via `/api/forecast` / test / sample / doc). Credential-boundary evidence: no `src/` import of the helper; `dist/` contains neither the customer host string from the helper nor `apikey` handling, with the exact search commands and results reported; no key value in any report, screenshot, console output or test (sentinel only).

**Q10 — report, docs and status vocabulary.** `.env.example` gets an empty `OPEN_METEO_API_KEY=` with a server-only (not `VITE_`) comment; setup docs state, per environment, only what is owner-confirmed (Development/Production configured; Preview as decided in Q1), the missing-key behaviour, "auth failure never falls back", and that Vercel env changes need a redeploy. No Vercel mutation. Report separates implemented / reviewed / deployed, key **presence** only, and marks production verification incomplete (not passed). Exact commands with fresh counts for the targeted suites (helper, `api/forecast.test.js`, aurora `openMeteo`/`fanout`/`orchestrate`/`rankDecision`/`aurora-decision`, #452 regressions, `forecastCache`-related client tests), full `npm run test:run`, `npm run lint`, `npm run build`, and an explicit "files not changed" list including `auroraScoring.js` and `vite.config.js` (unless Q2 chooses removal).

**Additional STOP triggers:** any change needed in `rankDecision`/classifier/UI to carry a new failure reason; a global test-setup change; need to read or print an environment value; a live provider or account request; Preview/Production policy unresolved at execution time.

## Non-blocking notes

- Ripley's wording "both can disclose a key" should become "could disclose if the provider echoes it (unverified)".
- Ripley's item 6 says "prefer /api/forecast through localhost:3000"; per Q2 I recommend the opposite default; this is a judgement call, not a defect.
- The helper name/location is CC's choice under `api/_lib/`; it must not be importable from `src/` (a `src/` file importing `api/_lib` is already an anti-pattern here, although the reverse direction exists for the aurora scorer).

## Limits of this review

- No shell, git, test, lint, build or browser on the owner's machine; nothing run. Source reviewed from staged snapshots (line numbers approximate).
- I could not search the whole repo; the client-call and test-caller inventory beyond the staged files is unverified (Q9).
- Open-Meteo, Vercel (system-variable exposure, `VERCEL_ENV` semantics) and customer-host behaviour were not fetched or probed; statements about them are from general knowledge and Ripley's notes (INFERRED) and must be confirmed from documentation by CC or the owner.
- `.env.example` viewed with values masked; no real environment files or Vercel settings inspected. Tier, key presence and validity rest on the owner's statement only.
- Not read in detail: `fanout.test.js`/`orchestrate.test.js` bodies beyond the failure-reason assertions, the classifier, `cron/*`, client forecast consumers.
- This review is not execution authorization. Ripley resolves Q1/Q2 with the owner and creates the approved prompt; execution starts only on the owner's "Prompt approved".


## Ripley disposition of Round 1 — 2026-10-20

Jonesy APPROVED with Q1–Q10, but Q1 explicitly requires an owner decision before READY_FOR_CC. Asked owner to choose Preview+Production fail-closed (owner adds Preview key before deployment there) versus Production-only fail-closed with public Preview/Development access when key is missing. Neither selected yet. No approved execution file created; PROMPT_REVIEW retained.

Q2 decision: retain Vite's existing dev-only public /api/forecast bypass and document the exception, preserving the vite-only local development loop. No key in Vite/browser; backend requests still share auth selection. Accept Q3–Q10 for the eventual approved prompt: existing failure reasons, safe diagnostic/status logging, existing-call/test compatibility, no successful-payload key scanner absent evidence, no-store on new config failures, fixed-origin request invariants, explicit owner-side customer-host/unit verification and paid quota awareness, inventory/bundle evidence, accurate report/setup documentation. Unknown leak risk is inferred, not observed. Platform environment detection/exposure must be documentation-checked and unknown project exposure remains explicit. No code changes.


## Ripley approval handoff — 2026-10-20

Owner selected option 2: Production fails closed without key; Preview/Development may use public access without key. Configured key always selects customer host; no public fallback on keyed failures. Q1 resolved; Preview key presence remains unknown. Q2 preserve/document Vite dev bypass. Q3–Q10 incorporated, existing aurora failure reasons and no success-payload scanner retained. Created approved-prompt-v1.md with binding decisions and verbatim Jonesy conditions. CURRENT -> READY_FOR_CC. No application edits or execution. Owner handoff to CC: Prompt approved.
