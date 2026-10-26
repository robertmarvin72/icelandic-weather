# Result review — ticket #460

Reviewer: Jonesy (Claude, technical peer reviewer). Date: 2026-10-26.
Reviewed: `approved-prompt-v1.md` vs `cc-report.md`, live source (staged snapshots of the files listed below), the saved browser evidence in `outputs/ticket-460-browser-evidence/`.

## Verdict: REVISE (narrow, LOW)

The core of the change is correct and matches Ripley's binding J1 contract. Two narrow items remain before I would call it PASS. Neither is a regression of the main fix; one is a fail-direction inconsistency in a helper, the other is an evidence gap against J6 that Ripley may either have fixed or waive explicitly.

## Verification basis

- `src/lib/routeRisk.js`: `classifyRouteRisk` is monotone as specified: HIGH if any valid wind/gust reaches 18/24; else MED if any reaches 14/20; LOW only when all 7 points have valid wind AND gust (`windComplete`/`gustComplete`) and every value is below MED; otherwise UNKNOWN. Independent validity re-check; safe default is UNKNOWN, not LOW. No new thresholds, no coverage percentage. VERIFIED SOURCE.
- `estimateRouteRisk`: per-point `try/catch` around `getForecast` (J2); maxima are `null` until a valid value exists (no fabricated 0); `coverage = {status, wind/gust/rain: {requested, returned, valid}}`; rain is independent; date taken from `daily.time[1]` (J9). VERIFIED SOURCE.
- `useRoutePlanner.js`: optional `routeRiskStatus` (absent = not requested, J5); effect resets it; catch path now sets a visible UNKNOWN object instead of silent `null`. VERIFIED SOURCE.
- `RoutePlannerCard.jsx`: `routeRiskBadgeLabel` explicit LOW and Unknown; `verdictBlockHasIndicator = HIGH || (!isPreview && MED)`; UNKNOWN is a neutral slate line with no amber Car icon and no HazardSourceNote; partial HIGH/MED keep caution plus qualifier. VERIFIED SOURCE.
- `RoutePlannerDetailsModal.jsx`: separate neutral box for `routeRiskSummary.unknown`; `routeRiskTomorrow` only when `dateVerifiedTomorrow`. VERIFIED SOURCE.
- `routePlannerSummary.js` unchanged; strict `=== "HIGH"` move→consider override preserved. VERIFIED SOURCE (and visible in the partial-high screenshot: "Consider moving").
- Browser evidence, viewed by me: severe-partial-unknown EN desktop (neutral line "Route-weather data was insufficient to evaluate driving conditions on this route.", no amber icon, no "Low"); EN 320 px (line wraps, no overflow visible); details modal ("Route risk: Unknown" in a neutral box); partial-high EN ("Route risk: High (based on partial route data)", "Driving conditions may affect this recommendation", Consider moving); complete-calm EN (no route-risk block). VERIFIED SAMPLE (screenshots only). `results.txt` lists 7/7 passed (CC-attributed, not re-run by me).

## Required fixes

**R1 (LOW) — `getRouteRiskSummary` fails open into MED, contradicting its own comment.**
`src/components/routePlannerDetailsHelpers.js`, `getRouteRiskSummary`: after the explicit `LOW`, `UNKNOWN` and `HIGH` branches, *everything else* — including `routeRisk` undefined, `null`, or any unexpected string, on a non-null `routeRiskData` — falls into the final "MED" return (amber, "Miðlungs"/"Medium" tooltip). The block comment says "Every branch of the closed {LOW, MED, HIGH, UNKNOWN} set is now explicit; none falls back to another level's wording." That is not true for malformed input. In the real app the hook only produces the four values, so this is not reachable today (LOW severity), but it is the same class of bug #460 fixes (an unrecognised value silently rendered as a specific level), and J1's safe default is UNKNOWN.
Fix: make MED an explicit `risk === "MED"` branch and let anything unrecognised return the neutral unknown summary (same shape as the UNKNOWN branch). Add tests in `routePlannerDetailsHelpers.test.js` for `routeRisk: undefined`, `null`, `"FOO"` (expect `unknown: true`, never the MED wording) and for non-mutation of the input object. Correct the comment if it stays inaccurate.

**R2 (LOW–MEDIUM) — J6 browser-evidence items missing; decision belongs to Ripley.**
The approved prompt (J6) asks for network-hit assertions that separate route-point calls from base/candidate fetches, and CC's own report lists the total-failure and stale-candidate browser scenarios as not run. Without request assertions, "5 of 7 points failed" in the spec is only inferred from the resulting UI, not proven to have hit the mocked 500s. Minimum I would accept: add assertions in `tests/e2e/route-risk-ticket-460.spec.js` counting the route-point requests that were answered 500 (expected number, and that base/candidate requests succeeded) for the two partial scenarios, and re-save the evidence. The total-failure and stale-candidate browser scenarios: Ripley may accept the unit-level coverage (hook tests with mocked `estimateRouteRisk`/`getForecast`) as a recorded waiver, since CC's finding is that 7-of-7 rejection is unreachable in the real app. If waived, say so explicitly in CURRENT/cc-report so it is a decision rather than an omission.

## Notes (non-blocking, no action required unless Ripley wants it)

- N1: CC's "7-of-7 unreachable" claim covers network rejection only. A payload that resolves but has all-null/short wind/gust arrays is not tested at the `estimateRouteRisk` level in a way I could confirm; how Open-Meteo represents missing values (null entries vs short arrays) is UNKNOWN to me. The code treats both as not valid, which is the safe direction.
- N2: `dateVerified` is `anyDateSeen && !dateMismatch`: a route where some points lack `daily.time` still verifies if at least one point has it and none disagree. Acceptable under J9 as written; mention only so it is a known property.
- N3: The partial qualifier reads "based on partial route data". It does not say the value is a lower bound ("at least"). Copy decision for Ripley; the logic is correct (a partial HIGH can only get worse).
- N4: UNKNOWN with a Move recommendation shows the green Move card plus a neutral line. This follows J1/J5 as decided; stating it so the product consequence is visible.
- N5: In the saved screenshots the "cached and can work offline" toast overlaps part of the card in several images (it hides a few lines in partial-high). Evidence still shows the key lines; a re-shoot with the toast dismissed would be cleaner.
- N6: Evidence matrix is a representative subset (EN desktop, IS desktop, EN 320, modal), not every locale × viewport × scenario. Reasonable; recorded.

## Checked and fine

Contract and thresholds unchanged; rain independent of wind/gust classification; nullable maxima never printed as 0; no UNKNOWN amber Car icon or HazardSourceNote; strict HIGH-only move→consider override preserved; hook absent-safe for old mocks; new translation keys present in EN and IS; J8 audit result (7 frontend files, none in api/scripts/analytics) consistent with my greps over the staged subset; scope contained to route-risk files, no unrelated changes seen; baseline HEAD stated unchanged by CC.

## Limits of this review

- Reviewed staged snapshots only. I did not run tests, lint, build, git or a browser on the owner's machine. Test counts (149 targeted, 2807/2807 full), lint, build and the Playwright run are CC-attributed.
- My consumer greps cover only the staged part of `src`; a consumer outside that subset would not be seen (CC's J8 audit is the authority for the full repo).
- Browser evidence was judged from the screenshots listed above (EN set); I did not view the IS screenshots and do not assess Icelandic wording quality.
- Open-Meteo missing-value behaviour, Vercel/Neon platform details and Windows autocrlf behaviour are UNKNOWN to me.
- No commit, push, deploy, DB mutation or GitHub closure is implied by this review.

## Next

Ripley: decide R2 (fix vs waiver). CC: R1 and, if chosen, R2 in a narrow correction round; then Jonesy re-check. Closure remains with Ripley/Róbert.


## Ripley final assessment — v1 — 2026-10-26

Verdict: REVISE. R1 explicit MED/neutral malformed fallback required. R2 choose network-hit assertions (no waiver of that requirement). Waive only unreachable successful-recommendation7/7 network rejection browser case and stale-candidate browser race when exact deterministic hook proof established; null/short-array estimator coverage still required. No provider missing-data representation inferred from fixtures. Existing partial qualifier and UNKNOWN+Move behavior accepted within v1 contract, no copy redesign.

Independent command npx vitest run src/lib/routeRisk.test.js src/hooks/useRoutePlanner.test.js src/components/routePlannerDetailsHelpers.test.js src/lib/routePlannerSummary.test.js: 4 files / 55 tests passed. Full2807/lint/build/Playwright remain CC-attributed; no independent browser rerun. Read CURRENT/review/report and diff summary. Created approved-prompt-v2.md; CURRENT READY_FOR_CC. No app changes by Ripley, commit/push/deploy/GitHub action.

---

# Re-check of correction v2 (R1/R2) — 2026-10-26

Reviewed: `approved-prompt-v2.md` vs the new "v2 Correction" section of `cc-report.md`, live source (`routePlannerDetailsHelpers.js` and its test, `routeRisk.test.js`, `useRoutePlanner.test.js`, `tests/e2e/route-risk-ticket-460.spec.js`), and the refreshed screenshots (EN and IS) in `outputs/ticket-460-browser-evidence/`.

## Verdict: PASS for R1 and R2 (code and evidence), with one documentation-only condition (C1)

### R1 — resolved (VERIFIED SOURCE)

`getRouteRiskSummary` now has real `=== "HIGH"` and `=== "MED"` checks; the single remaining fallback returns the neutral unknown shape (`unknown: true`, no tooltip, Unknown word) for `"UNKNOWN"` and for any undefined/null/unrecognised value on a non-null object. `null`/`undefined` data and `"LOW"` still return `null`. The closed-set comment is now accurate. New tests cover `{}` (undefined), `routeRisk: null`, `"FOO"` and non-mutation; existing HIGH/MED/LOW/UNKNOWN/partial tests remain. CC's report openly supersedes its own earlier "every branch is explicit" claim.

### R2 — resolved (VERIFIED SOURCE for the spec, VERIFIED SAMPLE for screenshots)

- The spec records every `/api/forecast` request with coordinate kind and the status the mock returned, and `assertForecastRequestShape` asserts 1 base + 1 candidate (200) + 5 interior (status per scenario) = 7 network requests in all 7 tests, explicitly separated in the comments from the estimator's 7 logical attempts. This is what J6 asked for.
- Waivers are narrow and named: 7-of-7 network rejection rests on `routeRisk.test.js` "RC-17 reproduced with 7 points…" and "real getForecast rejection path…" plus `useRoutePlanner.test.js` "thrown estimator (failed path)…"; stale-candidate race rests on `useRoutePlanner.test.js` "cancellation/new-candidate race…". I read the race test: it resolves the stale HIGH after the new request is in flight and asserts the current LOW wins. No browser coverage is claimed for either. Accepted as Ripley's waiver.
- The null/short-array gap I raised in N1 is closed at estimator level: new tests for a length-1 array (index 1 absent) and explicit `null` at index 1 both give UNKNOWN, null maxima, coverage `unavailable`, and the null case checks `returned 7 / valid 0`.
- Screenshots viewed (IS this round): severe-partial-unknown IS shows the neutral line "Veðurgögn á leiðinni voru ófullnægjandi til að meta akstursaðstæður." with no amber icon and no "Lág"; partial-high IS shows "Áhætta á leið: Há (byggt á ófullkomnum gögnum af leiðinni)" with "Íhuga að færa sig". Consistent with the EN set I viewed earlier.

### Condition C1 (documentation only, no code change) — report states something the evidence contradicts

`cc-report.md` says the PWA toast dismiss step is untested because "no toast actually appeared in any of these runs". The saved screenshots show a toast in the EN and IS runs ("Chase the Weather is cached and can work offline." / "Eltum Veðrið er vistað og getur virkað án nettenginga."). It has an X button, not "Later"/"Síðar", so the added `dismissPwaToastIfPresent` targets a different (update) toast and does nothing here. Effect: the toast still overlaps part of the card in several screenshots (e.g. it hides a line in partial-high IS; the asserted lines stay visible). Please correct that sentence in the report (a toast did appear; the dismiss step did not match it; screenshots show it). Re-shooting with the actual toast closed is optional and not required for PASS.

## Notes (non-blocking)

- N7: In `complete-calm` the "no Route risk" absence check runs right after "Move" is visible and before `assertForecastRequestShape`. Absence assertions pass immediately, so it could be vacuous if the route-risk result had not landed yet; and `assertForecastRequestShape` uses a non-polled `toBe(7)`, which is timing-sensitive. It passed in CC's runs. Cleaner: `expect.poll(() => requestLog.length).toBe(7)` first, then the absence check.
- N8: The logged status is the one the mock itself chose, so the status assertions guard the fixture, while the real evidence is the request count plus the UI outcome. CC's reported red/green mutation check (disabling the interior-failure branch makes `severe-partial-unknown` fail) is the meaningful proof; I did not re-run it.
- N9: The exact count of 7 network requests assumes nothing else on the page fetches forecasts for other coordinates. Fine for this fixture, but brittle if the page gains another forecast consumer.
- N2/N3/N5/N6 from the first review stand unchanged (date caveat, qualifier wording accepted by Ripley for this correction, evidence matrix is a subset).

## Limits of this re-check

- Staged snapshots only. I did not run tests, lint, build, git, Playwright or a browser on the owner's machine. Counts (155 targeted, 2813/2813 full), lint, build hashes, the Playwright run and the mutation check are CC-attributed.
- `getRouteRiskSummary` consumers were not re-grepped beyond the files I staged; CC says four dependent test files (83 tests) pass unchanged.
- Screenshots: I viewed EN severe/partial-high/320/modal/complete-calm in the first review and the IS pair plus the refreshed EN partial-high in this one; I did not view the refreshed copies of the other EN images (identical file sizes to the first set) and do not assess Icelandic wording quality.
- Open-Meteo missing-value behaviour remains UNKNOWN (all fixtures synthetic).
- No commit, push, deploy, DB mutation or GitHub closure is implied.

## Next

Ripley: final whole-ticket assessment; decide how C1 is recorded (one-line correction in cc-report or in the final assessment). Closure remains with Ripley/Róbert.


## Ripley final whole-ticket assessment — v2 — 2026-10-26

Verdict: PASS. R1/R2 accepted from Jonesy's re-check; C1 corrected directly in cc-report as a visible dated documentation amendment (offline-ready toast appeared, update-toast helper did not match it). No application change or extra correction cycle needed. Screenshots remain partially overlapped as disclosed; no re-capture claimed.

Independent command: npx vitest run src/lib/routeRisk.test.js src/hooks/useRoutePlanner.test.js src/components/routePlannerDetailsHelpers.test.js src/lib/routePlannerSummary.test.js src/components/RoutePlannerCard.caution.test.jsx src/components/RoutePlannerDetailsModal.test.jsx — 6 files / 94 tests passed. Read CURRENT/review/report and scoped status; git diff --check clean with informational LF/CRLF notices. Full187files/2813tests, lint/build,7browser scenarios and mutation proof remain CC-attributed, not independently rerun here.

Monotone coverage contract and neutralUNKNOWN maintained; malformed helper categories neutral, observed partialHIGH retains caution/override. Browser request accounting reviewed by Jonesy, two browser waivers retained with named estimator/hook proof. Non-blocking timing/fixture brittleness in complete-calm browser check accepted; deterministic estimator/helper/UI tests are independent support, not proof of unseen production behavior. Missing-provider-value representation, date partial-verification and no-timeout limitations remain explicit. No real device/production verification claimed.

CURRENT -> CLOSED locally. No instruction/provider/scoring/gating/payment changes by Ripley; only C1 report and workflow assessment updated. No commit/push/deploy/GitHub closure performed; owner controls those steps.
