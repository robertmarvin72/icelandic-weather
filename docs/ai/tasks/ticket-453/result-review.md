# Ticket #453 — Result review (Jonesy)

Date: 2026-10-20. Reviewed: `cc-report.md` against `approved-prompt-v1.md` (Round 1 Q1–Q10 + binding owner/Ripley decisions), and the live files I could stage: `api/_lib/openMeteoAuth.js` (+ test), `api/forecast.js` (+ test), `api/_lib/auroraDecision/openMeteo.js` (+ test), `.env.example` (viewed with values masked), `README.md`, `docs/open-meteo-auth.md`, `vite.config.js`, `fanout.js`, `rankDecision.js`.

## Verdict: REVISE (small: one log site, strengthened tests, two documentation accuracy fixes; no design change)

The design and wiring are correct and match the binding decisions. Two security-test and logging gaps remain, and they sit on the exact point the ticket exists to protect (no key echo), so they should be closed before PASS.

## Independently verified (by me, from source)

- **Helper** `resolveOpenMeteoAuth(env = process.env)`: reads config at call time; trims; non-blank key → customer host in every environment; missing/blank key → `failClosed` only for the literal `VERCEL_ENV === "production"`; `preview`/`development` → public host plus a static `console.warn` naming the environment; undefined or any other value → public host, no warning. Returns `{host, apiKey, failClosed}`; builds no URL; never throws. Matches Q1 option 2 exactly. No `VITE_` read.
- **`api/forecast.js`**: fail-closed returns 502 `{error:"forecast_error"}` with `Cache-Control: no-store` set before the return (Q3/Q6), no fetch made; keyed host/`apikey` appended last via `searchParams.set`; the client-controlled inputs are still only lat/lon/timezone and the three unit params (a client `apikey`/`host`/`url` is never read); legacy `windspeed_unit` passthrough untouched; upstream-failure log is now `{ status }` only; no public retry exists.
- **Aurora** `fetchLocationWeather`: auth resolution and URL build are now **inside** the `try`; fail-closed returns the **existing** `{ok:false, reason:"weather_fetch_failed"}` with no fetch (so `rankDecision.js:42–43` carries no new string and nothing escapes `fanout`); non-ok logs the status code only; `buildOpenMeteoUrl` keeps its old default (public host, no key) so existing callers/tests are unchanged; `wind_speed_unit=ms` and the #452 guard are intact.
- **Existing tests not weakened:** `forecast.test.js` original describe block matches the version I read before the ticket, and the `openMeteo.test.js` original and #452 blocks look unchanged (compared by reading, not by diff); new tests are additive and restore `process.env` in `afterEach`.
- **Test counts add up:** helper 15 `it` blocks; `forecast.test.js` 9 new; `openMeteo.test.js` 9 new (1 `buildOpenMeteoUrl` + 8 `fetchLocationWeather`) = 33, matching the reported +33 (2694 → 2727). Not run by me.
- **Not changed (by mtime and content):** `vite.config.js` (dev bypass preserved, mtime identical to my earlier snapshot), `fanout.js`, `rankDecision.js`. `.env.example` has an empty `OPEN_METEO_API_KEY=` (no value present) with a server-only comment; README links `docs/open-meteo-auth.md`.
- **Docs** state owner-confirmed facts with provenance (Development/Production yes, Preview unknown), the Production fail-closed rule, no fallback after keyed failure, the `VERCEL_ENV` exposure caveat (including that disabling it would silently stop fail-closed), the Vite-bypass exception and the owner-side verification list (key validity, keyed-host `hourly_units`, response shape, Preview). Wording is appropriately non-committal.

## Findings

### T1 — The "thrown error never reaches console output" tests cannot fail (MEDIUM; Q5 acceptance)
Both thrown-error tests (`api/forecast.test.js` "Q5: a thrown fetch error…" and `openMeteo.test.js` "Q5: a thrown fetch error…") build the logged text with `JSON.stringify(call)` over `console.error` arguments. An `Error`'s `message` is non-enumerable, so `JSON.stringify(new Error("…apikey=SENT"))` is `"{}"` (I confirmed this in my own sandbox, not on your machine). If the handler logged the raw error object again — the exact pre-#453 behaviour `console.error("Forecast proxy error:", err)` — these assertions would still pass, while real `console.error` would print the message and stack with the key. So the tests give false assurance for that vector. (The upstream-body test is not affected: a body string does stringify, so it genuinely fails on the old `console.error(..., text)`.) The aurora variant is additionally vacuous because that `catch` never logs. Required: build the captured text with `util.format(...call)` (or `util.inspect(..., {depth: null})` plus `err.message`/`err.stack` where an argument is an `Error`) so a regression that logs the object fails the test; prove it by showing the strengthened test fails against the old logging line.

### D1 — A third raw-error log site remains in `api/forecast.js` (LOW–MEDIUM; binding Q5)
The invalid-JSON branch still does `console.error("Forecast upstream returned invalid JSON:", parseErr)`. Binding Q5 says never log a raw error object; V8's `JSON.parse` messages quote a short excerpt of the parsed text, i.e. upstream body content. The excerpt is short, so a key echo there is implausible, but the rule was explicit and this site predates the ticket. My Round 1 text said "both log sites" and named only two; I missed this one, and the report's "both flagged log sites" inherited that. Required: replace with a static message (optionally `{ status: r.status }`), and add a test where the upstream body is non-JSON text containing the sentinel and assert it never appears in formatted console output.

### D2 — `{ name: err?.name }` versus Ripley's binding text (LOW; Ripley to adjudicate)
My Q5 allowed `err.name`; Ripley's binding text tightened it to "never raw error name/message/object". The catch logs `{ name: err?.name }`. An arbitrary thrown value's `name` is not a fixed vocabulary, but it carries no URL in any realistic case. Either accept `err.name` explicitly in the final assessment or require a fixed classification (e.g. `AbortError` handled separately already; otherwise a static "unexpected error"). I would accept it; it is a call for Ripley.

### D3 — Documentation/report accuracy (LOW)
- `cc-report.md` "Changed files" says `openMeteo.test.js` "+10 tests … 8 new tests for `fetchLocationWeather`"; there are 9 new tests (1 + 8), and the count line elsewhere correctly says 9. Fix the table.
- `docs/open-meteo-auth.md` says "a single, static, nonsecret diagnostic line is logged" for Production fail-closed. On the aurora path auth is resolved per location, so it is one line per failed location (up to 8 per night, 24 per page load); the Preview/Development warning is likewise once per location. Either reword ("one line per affected request/location") or dedupe; no behavioural change is required.

### Non-blocking notes
- `buildOpenMeteoUrl` (exported) accepts an optional `host` and `apiKey`; it is internal and only `fetchLocationWeather` passes resolved values from the helper, but it will send whatever key it is given to whatever host it is given. An allowlist of the two hosts would be cheap hardening; not required.
- Customer-host behaviour for `wind_speed_unit`/`hourly_units`, key validity, Preview configuration and `VERCEL_ENV` exposure remain unverified; the report and docs say so and list them as owner-side post-deploy checks. They must stay "incomplete", not "passed".
- Dev bypass unchanged and documented as an exception, per Q2; local `npm run dev` campsite forecasts never use the key.

## What passed

Q1 policy implemented exactly; Q3 existing `weather_fetch_failed` reused with no throw escaping fan-out; Q4 backward compatibility (no existing test edited); Q5 body-echo test is real and the two originally flagged log sites are redacted; Q6 no-store on the new path; Q7 invariants (one apikey, client params ignored, last parameter); Q9 inventory and credential-boundary approach as reported; Q10 `.env.example`/README/docs; status vocabulary "implemented, reviewed", no deployment claim, no Vercel mutation, no live request.

## Required to reach PASS

1. Strengthen the thrown-error log tests (T1) in both test files and show they would fail on the old logging.
2. Remove the raw `parseErr` logging (D1) and add the non-JSON-body test.
3. Fix the two documentation inaccuracies (D3); Ripley adjudicates D2.
After the edits: rerun the targeted suites for `api/forecast.test.js` and `api/_lib/auroraDecision/openMeteo.test.js`, the full `npm run test:run`, and `npm run lint` (a `forecast.js` source line changes, so the earlier counts become historical; build is not needed for a log-line change but CC should say so explicitly).

## Limits of this review

- I have no shell, git, test, lint, build or browser on the owner's machine and ran nothing there. Not verified by me: `HEAD` hash, `git status`/`git diff --stat`, the 16-file/176-test and 183-file/2727-test results, lint/build outcomes, the repo-wide `rg` (676 matches) and its classification, and the `dist/` and `src/` import searches. All are CC-reported. I did not stage `dist/` or search `src/` myself.
- I could stage only a subset of files; unchanged-file claims for `orchestrate.js`, `aurora-decision.js`, `forecastCache.js` and the scorer rest on CC's diff stat. I verified `vite.config.js`, `fanout.js` and `rankDecision.js` by mtime and content.
- No real environment file or Vercel setting was read; `.env.example` viewed with values masked. Open-Meteo and Vercel documentation not fetched by me; CC's statements about `VERCEL_ENV` semantics are CC-reported.
- Not approval to commit, push or deploy; those remain with the owner.


## Ripley final assessment — 2026-10-20

Verdict: REVISE. Confirm T1/D1 from actual source: JSON.stringify on Error loses its non-enumerable message/stack; forecast invalid-JSON branch still logs parseErr. D2 decision: enforce binding Q5, replace arbitrary err.name with a static generic diagnostic; preserve AbortError classification. D3 text corrections required. Created approved-prompt-v2.md with bounded implementation/test/docs corrections and expected-red unsafe-logging mutation checks, restoring safe source before final green validation.

Independent validation: npx vitest run api/_lib/openMeteoAuth.test.js api/forecast.test.js api/_lib/auroraDecision/openMeteo.test.js — 3 files / 57 tests passed (escalated execution to avoid known sandbox Vitest EPERM). This green run does not remedy T1's ineffective assertions. Full 2727 tests, lint, build and bundle searches remain attributed to CC's v1 report, not independently rerun. Read CURRENT, workflow rules, report, Jonesy review, helper and affected source/tests. No application edits by Ripley. CURRENT -> READY_FOR_CC for v2. No live provider/production verification, commit, push or deploy.


## Jonesy narrow re-check — v2 correction — 2026-10-20

Scope: only what `approved-prompt-v2.md` required (T1, D1, D2, D3). Read the current `cc-report.md` v2 section, `api/forecast.js`, `api/forecast.test.js`, `api/_lib/auroraDecision/openMeteo.js` and its test, `docs/open-meteo-auth.md`, and `approved-prompt-v2.md`. I also reproduced one V8 behaviour in my own sandbox (not on your machine); see Z1.

### Verdict: REVISE (narrow — one still-ineffective test, one inaccurate report sentence; no source change needed)

### Resolved
- **T1 formatter:** both test files now capture console output with `util.format(...args)` (`formatConsoleCalls`), and each file has a "capture formatter sanity check" test showing `util.format` exposes a sentinel in a raw `Error` where `JSON.stringify` does not. The thrown-error tests plant the sentinel in message, name and stack. Reading the tests, they are now capable of failing on `console.error("…", err)`.
- **Mutation proof (CC-reported, not rerun by me):** the report records an expected-red run after temporarily restoring `console.error("Forecast proxy error", err)` in `forecast.js`, and after a clearly labelled synthetic `console.error(…, err)` in the aurora catch, then restoration and green reruns (17/17 and 30/30). My own count of `it` blocks matches (forecast: 5 original + 9 v1 + 3 v2 = 17; aurora: 28 + 2 = 30). The final source I staged contains no mutation text.
- **D2:** generic catch in `forecast.js` is now `console.error("Forecast proxy error")` with no argument; the `AbortError` comparison is retained and not logged; `forecast_error`/`forecast_timeout` shapes unchanged. A non-Error thrown object with sentinel `name`/`message`/`stack` test exists in both files.
- **D1 source:** the invalid-JSON branch is now `catch { console.error("Forecast upstream returned invalid JSON", { status: r.status }); … }`; the 502 `forecast_invalid_json` body is unchanged.
- **D3:** the "+10" is corrected to "+9" in place with a visible marker; v2 additions are counted separately (+3 forecast, +2 aurora; 16 files/181 tests targeted, 183 files/2732 tests full, lint clean, no fresh build, build/bundle evidence explicitly attributed to v1). The doc now says the aurora diagnostic is logged once per affected location (up to 8 per night, 24 per page load) and that no deduplication was added.
- Scope held as far as I can see: `openMeteoAuth.js` unchanged (same mtime as before), no helper/auth redesign, no allowlist, no new reasons.

### Z1 — the new D1 test cannot fail, and the report states something false about V8 (MEDIUM; same class as T1)
`D1: a malformed non-JSON upstream body…` feeds the body `"not json at all, apikey=sentinel-fake-key {{{"` and asserts the formatted console output does not contain `sentinel-fake-key`. In Node 22 here, `JSON.parse` of that body throws `SyntaxError: Unexpected token 'o', "not json at"... is not valid JSON`: V8 quotes only a short excerpt (about ten characters) around the error position. The sentinel sits well beyond that excerpt, so the assertion holds even if the old `console.error("…", parseErr)` is put back. I also tried bodies that begin with the sentinel: the message then contains only `"sentinel-f"…`, i.e. a partial prefix, never the full sentinel. So the test as written gives false assurance for exactly the log site D1 was about, and the prompt's expected-red mutation proof was only required for the generic catch and the aurora catch, so nobody demonstrated this one failing.
Related, the report's D1 paragraph says a JSON.parse `SyntaxError` "doesn't itself echo arbitrary upstream text into its own message". That is inaccurate: V8 includes a short slice of the parsed text (the first characters of the body when the error is early). The practical key-leak risk is small (a ~10-character excerpt can at most leak a short key prefix), which is why this was LOW–MEDIUM, but the sentence should not claim there is no echo.

Required:
1. Make the D1 test able to fail: for example (a) assert `errorSpy.mock.calls.flat()` contains no `Error` instance (or no non-primitive other than the `{status}` object) and that the call equals `["Forecast upstream returned invalid JSON", { status: 200 }]`, and/or (b) use a body that starts with the sentinel and assert the formatted output does not contain a short prefix of it (for example the first 8 characters), since that is what V8 would actually quote. 
2. Prove it with one more expected-red mutation: temporarily restore `console.error("Forecast upstream returned invalid JSON:", parseErr)` (with `catch (parseErr)`), run only that test, record the failure, restore, rerun green, and confirm the final diff has no mutation. Fake sentinel only.
3. Correct the report's D1 sentence about V8 not echoing upstream text (state that V8 quotes a short excerpt, which is why the raw error object must not be logged).
No other change; after this, rerun `api/forecast.test.js` plus the full `npm run test:run` and `npm run lint` (counts become historical again), and say explicitly that no build was run.

### Not independently verified
Test results (181/2732), lint, `git diff --check`, the mutation runs and the final `git diff` are CC-reported. I cannot run anything on your machine.

### Limits of this re-check
No shell, git, test, lint, build or browser on the owner's machine; the V8 observation comes from running Node 22 in my own sandbox, and the V8 message format may differ between Node versions (it is the behaviour on the Node major version I used; Vercel's runtime version was not checked). I re-read only the sections and files named above. Not approval to commit, push or deploy; those remain with the owner. Operational checks (production/Preview, key validity, keyed-host `hourly_units`, `VERCEL_ENV` exposure) remain unverified owner-side items.


## Ripley final assessment — v2 — 2026-10-20

Verdict: REVISE, limited to Z1. Independently read the D1 test and corrected source/report; the sentinel is beyond a potential truncated parser excerpt, and no assertion rejects a raw Error argument. Accept Jonesy's finding and require structural assertions of the safe logging call plus an expected-red raw-parse-error mutation proof, not reliance on runtime-specific excerpt lengths. Report claim about no upstream-text echo must be corrected. Approved correction prompt v3 created; no final application change authorized.

Independent command: npx vitest run api/forecast.test.js — 1 file / 17 tests passed. This does not establish D1 test sensitivity. Prior full 2732 tests, lint and mutation proofs remain CC-reported; no full rerun/build by Ripley. No code changes or live/account checks performed by Ripley. CURRENT -> READY_FOR_CC for v3. No commit, push or deploy.


## Jonesy narrow re-check — v3 correction — 2026-10-20

Scope: only what `approved-prompt-v3.md` required (Z1 test strengthening, expected-red proof, report correction, source unchanged from v2). Read `approved-prompt-v3.md`, the "v3 Correction" and corrected "D1" sections of `cc-report.md`, `api/forecast.js`, `api/forecast.test.js` (D1/Z1 test), and checked the other files named below for drift.

### Verdict: PASS (narrow). No blocking findings. One optional LOW hardening note (Z2) and one report nit (Z3), neither blocking.

### Verified
- **Source unchanged from v2.** `api/forecast.js` (staged copy, device mtime changed by CC's mutation/restore) has SHA-256 `1c81af47…508fe`, exactly the pre-v3 hash CC recorded before and after the mutation; I also re-read the invalid-JSON branch (`catch { console.error("Forecast upstream returned invalid JSON", { status: r.status }); … 502 forecast_invalid_json }`) and the generic catch (`console.error("Forecast proxy error")`, `AbortError` branch intact), which match v2 as I reviewed it. `openMeteoAuth.js`, aurora `openMeteo.js`, aurora `openMeteo.test.js` and `docs/open-meteo-auth.md` have the same device mtimes/sizes as at my v2 re-check (not touched in v3). Scope held: only `forecast.test.js`, `cc-report.md` and CURRENT lifecycle fields changed.
- **Strengthened D1 test (Z1) can now fail.** The test sets an explicit `status: 200` on the mocked response, asserts that no argument of any `console.error` call is `instanceof Error`, and asserts `toHaveBeenCalledWith("Forecast upstream returned invalid JSON", { status: 200 })`, then keeps the response contract (`502`, `{ error: "forecast_invalid_json" }`, no sentinel in body). The old substring check is retained only as a supplement. Neither primary assertion depends on how much of the body the engine quotes.
- **My own sandbox check (Node 22.22, not your machine).** I ran the staged `forecast.js` with a mocked `fetch` returning the test's malformed body: one console.error call, `["Forecast upstream returned invalid JSON", {status:200}]`, no Error argument. With a sed-built copy restoring `catch (parseErr)` + `console.error("…invalid JSON:", parseErr)`, the call contains a `SyntaxError` instance and the message differs, so both primary assertions would fail. This agrees with CC's reported expected-red result (`expected true to be false` at the instanceof line). It is a simulation of the test's logic, not a run of vitest.
- **Report correction (Z3 of v2 / R2).** The D1 paragraph now carries a visible "Corrected (v3, Z1)" marker, states that JSON.parse errors do quote an excerpt of the input, that length/position is runtime- and version-dependent, and that no exact length is promised. The v3 section documents why the old test could pass, the new structural assertions, the expected-red proof, and keeps v1/v2 validation as historical. Test count stays 17 (in-place strengthening; my `it(` count is 17), full-suite figures 183 files / 2732 tests identical to v2, no build run and v1 build evidence correctly attributed to v1.

### Z2 — optional hardening, LOW, non-blocking
The structural assertions would not catch a regression that logs the parse error as a *separate string* (for example an extra `console.error(String(parseErr))` or `parseErr.message` call next to the correct one): no Error instance, and the exact-call assertion passes because some call matches. I confirmed this with a sandbox mutation. On the malformed body used, the supplementary sentinel check cannot catch it either (the sentinel is past V8's excerpt). Practical risk is small (a short excerpt, and such a change would have to be deliberate), so I do not require another CC round for it. If a later change touches this test anyway, adding `expect(errorSpy).toHaveBeenCalledTimes(1)` closes the gap cheaply. Ripley decides.

### Z3 — report nit, LOW, non-blocking
The v3 text says the truncation is what Jonesy's reproduction showed "likely on other engines too". My reproduction was Node 22 (V8) only; CC's was Node 24.11. Both are V8. No claim about other engines is supported by either. Not worth a correction round; Ripley may note it in the final assessment.

### Not independently verified
Test results (17/17, 183 files/2732 tests), lint, `git diff --check`, the vitest mutation run and the final `git diff` are CC-reported. The SHA-256 match is on the staged copy I received, compared to the hash CC reported; I did not see the pre-v3 file itself, only that its content matches v2 as I reviewed it.

### Limits of this re-check
No shell, git, test, lint, build or browser on the owner's machine. Sandbox simulations used Node 22 in my own environment; Vercel's runtime version was not checked. Narrow scope only: I did not re-review the full #453 design beyond drift checks. This is not approval to commit, push or deploy; those remain with the owner. Production/Preview behaviour, key validity, keyed-host `hourly_units`/wind-unit metadata, `VERCEL_ENV` exposure and quota remain unverified owner-side items. Ripley's final assessment follows.


## Ripley final assessment — v3 — 2026-10-20

Verdict: PASS for local implementation/review. Jonesy v3 PASS accepted; Z1 resolved with engine-independent raw-Error rejection and safe-call assertions, expected-red restoration proof documented, and parser-echo report correction. Independently inspected current D1 test and reviewed the v3 report/review. Scorer and vite.config.js have zero diff. No application edits by Ripley.

Independent validation: npx vitest run api/_lib/openMeteoAuth.test.js api/forecast.test.js api/_lib/auroraDecision/openMeteo.test.js — 3 files / 62 tests passed. Full 183-file / 2732-test run and lint remain CC-reported v3 results. Build/bundle evidence remains CC-reported v1 evidence; no fresh build needed or claimed. CC's expected-red mutation run remains attributed to CC, not independently rerun here.

Non-blocking Z2 accepted: the present assertions target the reviewed raw-Error regression and do not rule out every possible additional string log; no such log is present in reviewed source. Z3 clarification: parser excerpt observations are from Node 22/24 V8; no evidence establishes behavior of other engines. No further correction round required.

Operational acceptance remains incomplete: actual Preview configuration, deployed behavior/key validity, keyed-host wind-unit metadata, VERCEL_ENV exposure and quota must be verified owner-side. This PASS does not claim deployment or completion of those live checks. CURRENT -> CLOSED for local workflow only. No commit, push, deployment or GitHub closure performed.

During final workflow update, normalized CURRENT.md to LF because git diff --check flagged its CRLF lines as trailing whitespace; content/history preserved.
