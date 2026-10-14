# #430 — Jonesy result review (independent, blind)

2026-10-14. Reviewer only: nothing implemented, changed, committed, pushed or deployed. Reviewed the frozen candidate (base HEAD `2091263f031b2fa8a6acf5a7ad7bb04281775ded`) against `approved-prompt-v1.md` (incl. Round 2 C1–C8), `cc-report.md`, `experiment-note.md` and the packet. Written before the Qwen comparison: I did not open `local-review/` until the owner released it after this review had been delivered in chat. Section "Post-review addendum" below is the only part written after reading it.

## Verdict: REVISE (narrow)

No defect found in production behavior: eligibility, URL, copy, dedup, click semantics, privacy and scope are correct as far as reading and reasoning can show. REVISE because one approved-prompt requirement is not met in code (F1) and two required evidence items are missing or overclaimed (F2, F3). All fixes are small and need no redesign. Owner must not treat the candidate as release-ready until F1–F3 are resolved and re-reviewed.

## What I verified

- **Integrity.** SHA-256 of all 15 live candidate files and all 15 packet `.txt` copies match `manifest.txt` (staged copies hashed in my container). `candidate.diff` (`dd917c6c…644b`) and `manifest.txt` (`679cc695…fbf1`) match the hashes in `cc-report.md`. The diff lists exactly 15 files: 4 modified (`App.jsx`, `NorthernLightsThreeNight.jsx`, `translations.northernLights.js`, `NorthernLightsLanding.jsx`) and 11 new. No existing test file is modified; `useAuroraThreeNight`, `auroraMultiNightPolicy`, freshness files, `features.js` and `analytics.js` are not in the diff. I did not hash protected files against a baseline.
- **URL and attributes.** `VIATOR_NORTHERN_LIGHTS_URL` is byte-identical to the approved prompt; anchor has `target="_blank"` and `rel="noopener noreferrer sponsored"`; no extra params; metadata has no PII.
- **Copy.** EN/IS title, body, CTA, disclosure and the sr-only suffixes match the approved prompt exactly (compared programmatically).
- **Eligibility.** `multiNight.slots.find(s => s.date === selectedSlot.date)?.usable === true` is keyed on the displayed slot (C1); expiry, identity mismatch, pending and non-result primaries are already excluded upstream; CTA is last in the shell, outside `role="status"`; hooks live in a child component.
- **Dedup and lifecycle.** `tryConsume` is synchronous and keyed by visit id; stale ids always fail; holder lives above `showCampsitesGate` in App and per mount in Landing; StrictMode, hidden-tab and last-entry handling follow the `WeatherVoiceCard` precedent; effect cleanup disconnects the observer and listener.
- **Click.** `onClick` plus `onAuxClick` (button 1 only), local try/catch, no `preventDefault`, no double count of one gesture; context-menu undercount documented.
- **Scope.** No scoring/freshness/gating/payment/backend change, no new dependency.

## Findings

| # | Severity | Status | File / line | Finding |
|---|---|---|---|---|
| F1 | Medium | Confirmed deviation | `src/components/AffiliateCta.jsx:170` | Disclosure uses `text-[11px]` (11px). Approved prompt (C-F8 / line 117): "Disclosure below anchor at least text-xs" (12px). No test or browser assertion measures font size; the report does not list it as a deviation. Impact: the affiliate disclosure is the one text that must stay readable on mobile. Fix: `text-xs`. |
| F2 | Medium | Confirmed evidence overclaim | `cc-report.md:53`; `results.json`; `browser-check.mjs` | Report says "geometry/contrast/focus confirmed in the browser". The 50 assertions contain no contrast or font-size measurement (`getComputedStyle` is used only for the focus ring, line 173). The prompt required measured ≥4.5:1 in light/dark contexts and a 320/mobile check; only 375 and 1280 were run. My own estimate from the Tailwind colors is 5.0–5.2:1 (button) and 5.4–7.2:1 (disclosure), but that is a calculation, not the required measurement. |
| F3 | Medium/Low | Confirmed evidence weakness | `browser-check.mjs:145,161,166,242` | The "real scroll" impression check does not demonstrate the below-threshold case: `cta.screenshot` (line 145) scrolls the element into view before the check, there is no assertion before scrolling, the "exactly one" check only tests presence (`!!impressionEntry`), and the changing-night check uses `impressions.length <= 1`, which passes with zero. Round 2/C requirement "no impression at <50%, one at ≥50% in real Chromium" is therefore not proven in the browser (threshold logic is covered by fake-observer unit tests). |
| F4 | Low | Confirmed test gap | `src/App.jsx:84`; `src/App.affiliateHolder.test.jsx:209` | The `pathname !==` visit-reset branch is never executed by any test. The `/ → /about → /` test unmounts and remounts the whole `<App/>` (fresh refs). Deleting the branch would leave all tests green. The branch may also be unreachable in production (About is reached by full page load per the test's own comment). |
| F5 | Low | Confirmed doc inaccuracy | `cc-report.md:53,103`; `implementation-summary.md`; `experiment-note.md:23` | Reports mention an SVG icon and a "new lucide-react import" that do not exist in `AffiliateCta.jsx` or the diff; runbook says "Four events" but lists two. |

## Potential risks (not confirmed defects)

- **R1 (Low).** `App.jsx:81–95` mutates refs and calls `holder.startVisit()` during render. With React Router v7 transitions, StrictMode or a discarded render, the visit could advance without a commit (possible double or lost impression). Very unlikely here.
- **R2 (Low).** `hover:bg-indigo-500` (opaque) gives white text ≈4.47:1, just under 4.5 for 12px text, hover state only.
- **R3 (Low).** Button is about 28px tall: passes WCAG 2.2 AA (24px), below the 44px touch recommendation.
- **R4 (Info).** `AFFILIATE_PLACEMENT_BY_SURFACE[surface] ?? landing` silently labels an unknown surface as landing.
- **R5 (Info).** Landing visit id uses `Date.now()`/`Math.random()` in render (harmless impurity).

## Required before this can be PASS

1. F1: change the disclosure to at least `text-xs`; keep copy unchanged.
2. F2: add a browser measurement of disclosure font size and contrast for text/button (light and dark page contexts, 1280 and a 320 width), record in `results.json`; correct the report claim.
3. F3: rewrite the threshold check so the CTA starts below the fold with `count === 0`, then exactly `=== 1` after scroll; make the changing-night check `=== 1`.
4. F4: add a test that navigates within one mounted `<App/>` (router `navigate`) and shows a new opportunity, or remove the branch if it is proven unreachable and say so.
5. F5: correct the report/runbook statements.
After these, re-run the targeted suite, full suite, lint and build, re-hash the candidate, and send `Review uppfært` for a short re-review. R1–R5 are optional.

## Limits of this review

No shell on the owner's machine: I ran no tests, lint, build or browser; all counts (466, 2560, lint, build, 50 assertions) are CC's, not re-run. I could not read GitHub issue #430; URL, copy and parameters were compared with the approved prompt only. I did not open `node_modules` (the `react-ga4`/`dataLayer` claim is CC's). Contrast figures are my calculations from Tailwind color values. The browser claims were read from `results.json`, the harness script and two screenshots, not reproduced. Nothing was executed against Google or Viator.

## Post-review addendum (written after opening `local-review/`)

Qwen3-Coder 30B (12 of 13 planned chunks, 4096 context, correctness-only prompt, diff slices without requirements) produced 20 findings: none was a real defect, 1 partly matched my R1 (right smell, wrong consequence), 2 were valid but Info, 17 were false or not defects (mostly misread `useCallback`/`useRef`/effect-cleanup semantics). It found none of F1–F5; F1 and F4 were visible in its own input. Every chunk that returned findings returned exactly 4 (the cap). Chunk 13 (one test file) was not reviewed; I found nothing there, so the gap changed no result. Metadata inconsistencies in `local-review/`: "12 of 15 files" should read 14 of 15; `run-meta.json` has `stoppedOnBudget: true` although the run used 90 s of 900 s and was stopped by the 12-chunk cap. My assessment: 3/10 as a first reviewer in this configuration; not recommended as a gate. Full comparison table was delivered in chat; Ripley validates and records the formal comparison in `local-review-comparison.md`. I am both reviewer and judge here, so Ripley should verify the false-positive calls (especially 1.2, 2.3, 11.3).

---

## Ripley final assessment — 2026-10-14

Verdict: **REVISE (narrow)**. Independently read report/review, CTA/holder/App code, pathname test and browser harness. Ran `npx vitest run src/components/AffiliateCta.test.jsx src/lib/affiliateImpressionHolder.test.js src/App.affiliateHolder.test.jsx src/pages/NorthernLightsLanding.affiliateHolder.test.jsx src/lib/analytics.affiliateGA.test.js` outside sandbox using approved escalation for prior esbuild access restriction: **5 files / 52 tests passed**, exit 0. CC's full suite/lint/build/browser figures remain attributed to CC; I did not rerun them.

Confirmed F1–F5 need correction. Additional F6: experiment-note incorrectly declares first post-deployment week the baseline; the issue specifies historical pre-affiliate NL engagement baseline Oct 1–7 and observation Oct 8–12. Missing baseline evidence should be labelled unverified/missing, not shifted or redefined. Deployment starts affiliate period only; evaluate after seven complete live days and again 14–30 days.

Formal Qwen comparison recorded in local-review-comparison.md after blind review completed. No confirmed Qwen-only production defect; mostly unsupported/intentional-behavior findings, partial input coverage. No source edits during comparison. Round 3 correction prompt appended for mandatory Jonesy prompt review before approved v2. v1 and frozen packet remain intact. CURRENT PROMPT_REVIEW, no CC correction authorization yet. No commit/push/deploy/GA setting/production mutation/issue closure.

---

## Jonesy v2 re-review — 2026-10-14

Reviewer only: nothing implemented, changed, committed, pushed or deployed. Scope: narrow re-review of CC's execution of `approved-prompt-v2.md` (F1–F6, conditions D1–D6) against live files and `review-packet-v2/`. Qwen comparison stays about the frozen v1 candidate and is not re-opened.

### Verdict: PASS (non-blocking notes N1–N4)

F1–F6 are resolved. I found no new defect, no unauthorized source change and no weakened assertion. The candidate is acceptable to go to Ripley's reassessment and then to the owner's commit/deploy decision. PASS is a code-and-evidence review verdict; it does not establish live GA4 ingestion, production cookie behaviour, revenue or baseline data.

### Verified

- **Integrity (D6).** SHA-256 of all 16 live candidate files, all 16 packet `.txt` copies and the 6 evidence files match `review-packet-v2/manifest.txt` (staged copies hashed in my container, 0 mismatches). `cc-report.md` (`d11c7067…4fb32`) and `experiment-note.md` (`2072a764…404a7`) match the values in `commands-results-v2.md`. `candidate.diff` has 16 `diff --git` entries and all 12 new files reconstruct byte-for-byte to the live content. 13 of the 15 v1 files are byte-identical (the 2 changed are `AffiliateCta.jsx` and `AffiliateCta.test.jsx`), plus 1 new test file.
- **F1 / D1.** `AffiliateCta.jsx` v1→v2 differs only in the disclosure `<p>`: `text-[11px]` → `text-xs`, copy and `leading-snug` unchanged; title, body and button are already `text-xs` (lines 157, 158, 165). Class guard added (present/absent). Browser computed font-size recorded as a number: `12px` in all 7 cells.
- **F2 / D2.** Matrix is complete: homepage EN 320/1280 × light/dark, homepage IS 320 light, landing EN 320 dark, landing EN 1280 light. Contrast is pixel-sampled (text hidden, element screenshot decoded, whole box sampled, text colour read via computed style). Minimums: title 12.73, body 9.38, disclosure 5.30–5.36, button 5.07 (all ≥4.5, gating). Hover 4.58 recorded as informational (`pass: null`), not changed (R2 stays unauthorized). CTA-container checks (`right ≤ viewport`, `scrollWidth ≤ clientWidth`, e.g. 252 ≤ 252 at 320) are separate from page-level overflow (0 px everywhere). Counts reproduce: 108 rows, 59 gating all true, 49 informational, no false rows.
- **F3 / D3.** Harness installs its own `IntersectionObserver` (threshold list includes 0.5) before positioning and waits for a delivery plus two rAFs before asserting. Measured: below fold ratio 0.037 with count `=== 0`; after real scroll ratio 1 with count `=== 1`. Changing-night: the tab is activated by `dispatchEvent`, `scrollY` stays 0 → 0, ratio still 0.037 and count still 0, then exactly 1 after a real scroll with metadata. Presence-only and `<= 1` checks are gone from the v2 harness.
- **F4 / D4.** New test navigates within one mounted `<App/>` with `history.pushState` + `popstate` in `act`, wraps `createAffiliateImpressionHolder` via `importActual`, and per CC records one holder with ids `/#1`, `/about#2`, `/#3` (reachable branch) and 2 impressions in total. Existing unmount-based test untouched; no production entrypoint added; `App.jsx` unchanged.
- **F5.** False SVG/lucide statements removed from `cc-report.md`; frozen v1 summary left immutable and annotated in `summary-v2.md`; "Four events" → "Two events"; `local-review/metadata-correction-note.md` corrects 12/15 → 14/15 files and clarifies `stoppedOnBudget` (12-chunk cap, 90.1 s of 900 s) without touching raw files.
- **F6 / D5.** `experiment-note.md` withdraws the v1 post-deployment-baseline definition explicitly, treats Oct 1–7 / Oct 8–12 as historical pre-affiliate windows, names existing events (`northern_lights_card_viewed`, `aurora_landing_viewed`, `northern_lights_night_selected`; all present in `src`), quotes the issue wording, states no data was gathered or verified, notes the GA4 Explorations retention limit, keeps the `northern_lights_free_v1` concurrency caveat, and ties the affiliate period to the actual deployment timestamp only.

### Non-blocking notes


- **N1 (Low, evidence).** The changing-night harness proves the dispatched tab click did not scroll and that exactly one event with `selected_night: 2026-10-15` was emitted, but it does not record the pre-change `selected_night` or assert that the selection actually changed. The report's "advanced to the next date" is therefore inferred, not asserted. "Latest metadata" is covered by the v1 fake-observer unit tests; no action needed unless the owner wants it demonstrated.
- **N2 (Low, test design).** The in-place test passes in both branches (`holderRecords.length === 1` or `> 1`), so it would not fail if router behaviour changed; and the stale-callback step is guarded by `cancelled` after unmount, so it shows no consumption by the stale observer rather than isolating who consumed. The branch outcome is credible because it is recorded in CC's output (single holder, three ids), and I accept D4(c) as met, but I did not run it. Optional hardening: assert the reachable branch explicitly.
- **N3 (Info).** Light/dark results are identical because the CTA shell is a fixed dark gradient; the evidence shows the CTA is theme-independent, not that the surrounding page changed. Contrast sampling is a ~60×30 grid and Chromium-only; margins (min 5.07 vs 4.5) make this immaterial.
- **N4 (Info).** CC does not record the v2 `candidate.diff` hash (`9d603806…b855`) or the v2 `manifest.txt` hash (`4ecfc7c2…31af`); I computed them above for the record. CC's statement that it read the issue via `gh issue view 430` is unverifiable by me (the issue returns 403 here); the extra "Mæla: Users, Engagement, Returning users, Forecast interactions" text beyond Ripley's quotation is consistent with a real read.

### Limits of this review

I have no shell on the owner's machine. I did not run tests, lint, build or a browser; counts (targeted 9 files / 73 tests, full 174 files / 2562 tests, lint, build) and the browser/contrast values are CC's, checked by me only for internal consistency (results JSON, harness source, pass/fail counts, delta of +2 tests and +1 file vs v1). I read the PNG decoder and harness helper code but did not execute them or re-derive contrast. I did not read the screenshots pixel by pixel. I cannot read issue #430, so F6 wording is checked against the prompt's quotation and CC's report only. GA evidence remains `dataLayer` command generation, not live ingestion. Optional R1–R5 remain unaddressed and unauthorized. Owner-controlled and outside this review: commit/push, deployment and its timestamp, GA4 custom-dimension registration, retrospective inspection of the Oct 1–12 baseline data, and the live-world checks.

---

## Ripley final assessment after v2 — 2026-10-14

Verdict: **PASS (local technical implementation)**. Read v2 report, Jonesy's PASS and the corrected code/test/evidence against the approved contract. F1-F6 now have adequate local evidence: disclosure text-xs, numerical contrast/font/320px results, observer-delivery/count proof, in-place-navigation instrumentation, accurate report and historical baseline chronology. N1-N4 are non-blocking; do not treat optional test-hardening as an established runtime defect.

Independent run: `npx vitest run src/components/AffiliateCta.test.jsx src/lib/affiliateImpressionHolder.test.js src/App.affiliateHolder.test.jsx src/App.affiliateHolder.inPlaceNavigation.test.jsx src/pages/NorthernLightsLanding.affiliateHolder.test.jsx src/lib/analytics.affiliateGA.test.js src/components/NorthernLightsThreeNight.affiliateCta.test.jsx src/components/NorthernLightsThreeNight.affiliateCtaFallback.test.jsx src/i18n/translations.northernLights.affiliateParity.test.js` — **9 files / 73 tests passed**, exit 0, authorized outside-sandbox run for earlier known esbuild access limitation. The in-place test still has a diagnostic passing alternate branch; I accept the reported reachable outcome with recorded identity evidence, rather than claim this is an unconditional future-regression guard.

Independent integrity check: all **16 live source/test files + 16 packet copies** match manifest hashes. v2 candidate.diff SHA256 `9d603806b4b7deeebb803825fa54e7e2b52948e5dc6a0adcaa4be06ce524b855`; manifest SHA256 `4ecfc7c2a05a93ab4456ffda29894807b5876b876b3f20c73e1697f16b5e31af`. Checked current git status; changes remain uncommitted. No application/test changes during assessment.

Viewed v2-homepage-is-320-light-cta.png and v2-homepage-en-1280-dark-cta.png: readable complete disclosure, neutral secondary card, no visible clipping in these captures. I did not rerun browser/pixel sampling/full suite/lint/build: CC's 174 files / 2562 tests, lint/build and 59 browser assertions remain attributed to CC and Jonesy's evidence cross-check. GA evidence proves command generation through dataLayer only, not live ingestion.

Qwen comparison is already recorded in local-review-comparison.md, based on original frozen v1; metadata-correction-note preserves original raw history. Partial 14/15-file, 12/13-chunk coverage and asymmetrical input mean no full/symmetric model benchmark claim. Experiment was performed and limits documented; no further model run is required to accept this local implementation. No confirmed Qwen-only production defect.

CURRENT set CLOSED for local workflow. Full live experiment/revenue outcomes are not complete: owner decides release, verifies GA dimensions/ingestion, records actual deployment timestamp, inspects historical baseline if available and evaluates after seven complete live days. No commit, push, deploy, GA settings/booking/Neon/live-user mutation or GitHub closure. #434 production-cookie check remains separate and pending.
