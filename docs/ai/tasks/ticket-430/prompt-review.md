# #430 — Ripley initial prompt, Round 1

2026-10-14. Discussion for Jonesy; NOT execution authorization.
Issue: https://github.com/robertmarvin72/icelandic-weather/issues/430
Title: Northern Lights: Affiliate revenue experiment með tour booking

## Objective and scope

Add a secondary Viator next step after a valid Northern Lights result, on /en/northern-lights and the homepage module, with bilingual disclosure, visibility/click events and a measurement runbook. Forecast remains free and independent. Today meets the issue's earliest implementation date (2026-10-14); actual experiment starts only on owner-approved deployment, never retroactively. Do not claim October baseline data was collected or analyzed.

Owner selected #430 in established Ripley session; #435 CLOSED. Initial git status clean. Only client-side code/tests/docs, no dependencies, backend, scoring/gating/payments or provider API. Include the issue's one-ticket local Qwen vs Jonesy review experiment with blind, frozen-candidate review; do not generalize it to future tickets.

## Read-only audit

- NorthernLightsThreeNight.jsx is the shared active component, surface landing/homepage, hosting selected-night result plus best-night summary, optional details and EN homepage link. Landing forces useT('en') regardless of saved language. Homepage uses saved IS/EN. Render a single shared CTA in this module after selected-night outlook/details, outside its live role=status region; no second page-level CTA or per-night offers.
- useAuroraThreeNight supplies slots/selectedDate; resolved classification.primary is success/partial or no_darkness/domain_unavailable/contract_defect/transport_error. Classification freshness is separate; existing selected-result expiry behavior must be reused, not redefined. Engine band is already exposed through body.best.band and existing auroraBandPresentation helpers. Preserve all canonical helpers, scoring, candidate list, requests and ordering.
- features.js opens Northern Lights for all via northern_lights_free_v1. Keep it unchanged; analytics tier is distinct from access. No affiliate eligibility by tier or positive/negative band.
- analytics.js provides synchronous trackEvent (ReactGA.event when configured), with no local throw catch. Click must use a native anchor and locally catch analytics errors, without preventDefault, await or custom navigation.
- Existing module exposure refs dedupe by request/date. Affiliate impression must instead be once per placement per route visit, not per selected night/request/details/retry. AnalyticsTracker currently sends pageviews for pathname+search, while landing selection replaces ?date. For this CTA, define experience as a pathname route visit (mount until leaving), excluding selected-night query replacements. Document this distinction; do not rewrite global analytics pageviews.
- Existing NorthernLightsThreeNight, landing, App and aurora helper suites provide canonical fixtures. Check parsing before stubbing. The legacy NorthernLightsCard is unmounted and outside scope.
- No ollama executable was found with Get-Command in this session; availability/model/version/context remain unverified. Do not install anything or claim the issue's machine/model details as verified. CC must audit local availability before the review experiment.

## Implementation contract

1. Repeat audit read-only before edits, including AuroraNightOutlook/freshness behavior and current tests. Small reusable affiliate component/config acceptable, following existing patterns. Centralize exact URL once:
   https://www.viator.com/searchResults/all?text=Iceland+Tours%2C+northern+lights&pid=P00323211&mcid=42383&medium=link&campaign=Northern-lights
   Keep URL byte-for-byte, no shortener/redirect/PII/query additions. Native anchor target=_blank and rel="noopener noreferrer sponsored".
2. Render only for selected resolved success/partial with a usable, non-expired result actually displayed. Reuse existing freshness usability helper. Stale-but-still-usable result may show CTA with existing stale labeling intact; expired/unavailable/error/loading/no-darkness/contract-defect do not. All-poor and favorable bands both show CTA; never require qualifying alternatives or ranking/map disclosure. If existing helpers cannot establish valid result, STOP with evidence instead of adding a commercial scoring rule.
3. One secondary compact card below forecast/recommendation; no popup/sticky/promotion above forecast. No guaranteed lights/better weather/tour endorsement. Existing typography/borders/themes/focus and readable mobile disclosure. No forecast engine/data changes.
4. Add exact issue copy to existing northernLights i18n dictionaries:
   EN title: Want to join a Northern Lights tour?
   EN body: Prefer to go with a local guide? Compare Northern Lights tours and find an option that works for you.
   EN CTA: Compare Northern Lights tours
   EN disclosure: Partner link · We may earn a commission if you book.
   IS title: Viltu fara í norðurljósaferð með leiðsögumanni?
   IS body: Skoðaðu skipulagðar norðurljósaferðir og finndu ferð sem hentar þér.
   IS CTA: Skoða norðurljósaferðir
   IS disclosure: Samstarfstengill · Við gætum fengið þóknun ef þú bókar ferð.
   Entire card follows passed t/lang; landing stays EN. Disclosure beneath CTA, always readable, no tooltip/footer-only copy.
5. affiliate_offer_viewed only via IntersectionObserver when isIntersecting AND intersectionRatio>=0.5. No render event or unsupported-observer automatic fallback event. Callback uses current metadata; cleanup/unobserve/disconnect, stale observer callbacks guarded. Keep once-per-placement flag in owning module (survives CTA unmount for selected loading/error and remount); StrictMode effect replay must not duplicate. Reset on genuine new pathname visit, not night/query/details/tier/fetch rerenders. Route leave/return creates a new opportunity; test the actual router mount behavior. If necessary narrowly pass visit identity at the module hosting boundary, not a global tracking framework.
6. affiliate_clicked on every real anchor activation, independent of impression and GA completion. Use existing trackEvent; catch failure locally to preserve link. Event constants: partner=viator, campaign=northern_lights, placement=northern_lights_forecast (landing) or homepage_northern_lights, destination=viator_northern_lights_search (click only). forecast_verdict uses existing canonical best.band, not classification.primary or new categories; omit absent band. selected_night current valid YYYY-MM-DD when available; omit absent/invalid optional values, no fabricated placeholders. No email/user ID/IP/free text/raw URLs in metadata. Test latest selected night metadata while impression remains deduped. No change to existing event payloads/counts.

## Targeted tests and validation

Add tests for exact URL/parameters/target/rel and disclosure both languages; forced EN landing with saved IS; exactly one CTA after actual forecast on both placements. Loading/errors/unavailable/no-darkness/expired/out-of-season absence, success/partial/fresh/usable-stale presence, all-poor parity with favorable, anonymous/Free/Pro access unchanged. Reuse fixtures/freshness helpers, do not manufacture endpoint shapes.

Observer tests: no event on render/49%/nonintersection, one at 50%, latest metadata, StrictMode/rerenders, night/details/tier updates, retry/error hide-remount, obsolete callbacks/unmount, route leave/return vs query replace. Missing observer emits no unverified impression. Click payload and optional omission, repeated clicks, throwing/absent analytics and native href unaffected. Integration tests must cover actual shared module/landing/homepage wiring, not just a mocked CTA.

Run new tests plus all NorthernLightsThreeNight/landing/App aurora-related suites and canonical aurora scoring/classification/freshness/display/multinight suites. Run lint/build. Report exact commands/counts/limits, broaden only for failures/new concerns. Browser-check both placements, IS/EN where applicable, 320/mobile and desktop, light/dark: hierarchy, disclosure, focus, viewport threshold, changing night, poor-result neutrality, success/partial/error. Mock local API and analytics where suitable; no live account/Viator booking/Neon/payment calls. Verify anchor URL exact and parameters in outbound request with interception, without sending conversion traffic to Viator.

GA validation: intercept real analytics abstraction/ReactGA event path as an equivalent controlled test, verifying event names/payload/timing/dedup, and clearly distinguish it from live GA4 ingestion. Owner-run DebugView procedure if live access unavailable; no account/config mutation or fabricated live measurement. Build/browser and equivalent validation must finish before any deployment readiness claim.

## Revenue measurement runbook

Write experiment-note.md: baseline Oct 1–7, observation Oct 8–12, actual deployment timestamp pending owner, first evaluation after 7 complete days and 14–30 follow-up. No concurrent Aurora/Seasonal Pass experiment. GA unique users/viewers/clickers, segment by placement and same period/timezone; do not sum placement unique users. CTR=unique clickers/unique viewers*100; clicks per 100 NL users=unique clickers/NL users*100; revenue per 100=affiliate revenue/NL users*100. Define NL-user denominator from existing semantic events and document scope differences; zeros produce unavailable ratios, not misleading zero/divide errors. Viator reporting supplies bookings/confirmed commission, never GA automatic revenue. Record status/currency/settlement/cancellations/report lag and provisional periods. No fabricated baseline/revenue, minimum conversion target, dashboard/backend import or monitoring automation.

## Frozen local review experiment and handoff

CC implementation first, tests/lint/build/equivalent GA validation, then freeze exact candidate: baseline HEAD, complete diff including untracked source/test files, changed-file inventory/hashes, summary/commands/results. Secret-free review packet under task folder; never include env/credentials. Do not silently truncate large diff. Immutable candidate files used by Qwen and Jonesy, independent of later workflow docs.

CC audits Ollama CLI/local API/model availability read-only, records actual version/model/context/token budget. Issue specifies qwen3-coder:30b, context 4096; no replacement model/install/download without owner instruction. Read-only inference allowed, no tools/file writes delegated to Qwen. Chunk by coherent dependency groups within measured context, inventory coverage and omitted context explicitly; no silent clipping. Qwen findings saved separately as qwen-review.md, with elapsed time/limitations. Do NOT summarize/disclose Qwen findings in cc-report/CURRENT or shared packet before Jonesy finishes. Jonesy reads only frozen candidate, prompt and implementation evidence, writes independent result-review without reading Qwen file. Keep source frozen throughout both reviews; verify hashes.

If local model unavailable, report experiment pending and do not claim full issue done. Do not block finishing independent implementation/test/report work. CC completes its normal lifecycle to CC_COMPLETE with frozen packet path; owner triggers Jonesy result review. Once both reviews exist, Ripley validates findings against code/tests and writes local-review-comparison.md: model/context/files/duration, each review's findings, shared/valid-only/false positives/severity/coverage and usefulness conclusion. No source edits during comparison. Verified accepted fixes go through a new approved prompt iteration with retests and fresh review as warranted. Local experiment is not a future mandatory workflow rule.

## STOP conditions

Stop for scoring/ranking/freshness/forecast-data/gating/entitlement/payment changes, backend/API/provider integration, broad analytics framework, URL changes, extra providers, new libraries, model installation/replacement or production mutations. No commit/push/deploy/issue closure. Owner alone approves live release and records timestamp; no automated deployment.

Jonesy reviews this Round 1, especially result usability, route-visit dedup and blind-review handoff. Only after APPROVED Ripley creates approved-prompt-v1.md and CURRENT READY_FOR_CC. CC on owner's Prompt approved sets CC_IN_PROGRESS, executes approved file, writes cc-report and populates path, then CC_COMPLETE. Final assessment must distinguish local technical checks from pending experiment/live verification.

---

# Jonesy review of Round 1 — REVISE (F1–F9)

2026-10-14. Technical peer review against live source. Reviewer only: nothing implemented. The scope, STOP list, URL/copy handling and the lifecycle are sound. Nine items must be resolved in the approved prompt; F1, F2 and F3 are substantive (they would produce wrong or unverifiable data), F4–F7 close semantic gaps, F8–F9 are smaller. I focused on the three areas you named: result usability, route-visit dedup and the blind-review handoff.

## What I verified against live files

- `NorthernLightsThreeNight.jsx` (mtime 1790871945992): mounted on the landing page (`surface="landing"`) and the homepage (`surface="homepage"`); returns `null` when `!isAuroraSeason`; selected-night body is `AuroraNightOutlook` inside `<div role="status" aria-live="polite">`; the EN-homepage `nl3-details-link` follows it. `hasNLAccess` and `tier` are separate; `interactionTier` is `"unknown"` while `loadingMe`. Existing exposure refs are keyed by `requestKey` (`cardViewedRef`, ranking, map) and `bestNightViewedRef` by identity, as Ripley says.
- `useAuroraThreeNight.js`: every slot's classification goes through `applyClientFreshness(raw, nowMs)`; an over-age or untimestamped success/partial is converted to `{ primary: "domain_unavailable", expired: true, body: null }`, and identity-mismatched slots become `status: "loading"`, `classification: null`. So `classification.expired` and `body: null` already mean "not displayable as a result".
- `AuroraNightOutlook.jsx`: result UI (`nl3-result` / `nl3-all-poor`) renders only for `primary` success/partial; `freshness === "stale"` adds the stale notice and keeps the result; the all-poor state shows when `selectAuroraDisplay(...).hasQualifyingLocations` is false (bands outside excellent/good/fair).
- `auroraMultiNightPolicy.js`: `annotateSlot(...).usable` = resolved AND primary success/partial AND `body.best` present AND `best.band` in {excellent, good, fair, poor, very-poor} AND finite `best.score`. `multiNight.slots` is already computed in the module. `classifyAuroraOutcome` only guarantees `body.ok === true`, not that `best` exists.
- `analytics.js`: `const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID` is read once at module load; `trackEvent` calls `ReactGA.event` only when it is set (plus a DEV `console.log`), with no try/catch. `AnalyticsTracker` sends a page view per `pathname + search`.
- `NorthernLightsLanding.jsx`: `useT("en")` forced, `lang="en"`, query-mirroring with `setSearchParams(..., { replace: true })`; its own `viewedRef` pattern for `aurora_landing_viewed`.
- `App.jsx` and `AppRoutes.jsx`: `/` and `/about` both render `HomeComponent` (`page="about"` for the latter); the homepage module sits at `<div id="northern-lights">` inside the branch `page === "about" ? <About/> : showCampsitesGate ? <gate/> : <>…module…</>`, where `showCampsitesGate = campsitesLoading || campsitesError || !siteList?.length` (App.jsx L86). `main.jsx` wraps `App` in `StrictMode`.
- `translations.northernLights.js` holds `nl*` keys for both languages and is merged into `translations.en/is`; there are no existing affiliate keys or references anywhere in `src/`.
- I could not read GitHub issue #430 (this session has no repository access), so exact issue wording for the URL, copy and event parameters is taken from Ripley's quotation only. Ripley should confirm those strings and the parameter list against the issue when writing v1.

## Findings (each is a required prompt change)

**F1 — name the valid-result predicate exactly; "existing freshness usability helper" is not a thing.**
Round 1 says "reuse the existing freshness usability helper". No helper has that name. What exists is (a) `applyClientFreshness` (already applied in the hook, so expired results arrive as `domain_unavailable` with `expired: true`) and (b) `usable` inside `classifyMultiNightComparison`, reachable as `multiNight.slots.find(s => s.date === selectedDate).usable`. The two give different answers for a success/partial body whose `best` is missing or has an unknown band or a non-finite score: AuroraNightOutlook still shows a neutral all-poor/neutral card for it, `usable` is false. Required: v1 states ONE predicate. Jonesy recommendation: the module's own `multiNight` slot for the selected date has `usable === true` (equivalent to resolved + success/partial + not expired + best with a known band and finite score), because it is already computed, pure, and keeps a commercial offer off malformed bodies without adding a scoring rule. With this predicate `forecast_verdict` is always present on a rendered CTA, so "omit absent band" becomes a defensive branch only; say so. Tests must include: fresh and usable-stale success (CTA shown, stale notice intact), partial, a result that crosses the 1440-minute boundary while mounted (CTA disappears when the classification becomes expired; flagged impression is not reset), `best: null`, unknown band, non-finite score, identity-mismatched slot (loading), transport/contract/no_darkness/unavailable, loading, and out-of-season (module returns `null`). Keep Ripley's rule that all-poor and favorable bands both show the CTA.

**F2 — the dedup flag cannot live in the module on the homepage; the module remounts inside one pathname visit.**
On `/` the module is rendered only inside `showCampsitesGate ? … : <>…</>`. `useCampsites` sets `loading` to true on every `load()`, and `load` re-runs whenever `reloadKey` changes (the #434 login/logout path). So after a user sees the CTA, opens Settings and logs out, the campsites reload flips `showCampsitesGate` to true, the whole page body including `NorthernLightsThreeNight` unmounts, and it mounts again when the list returns. A `useRef` flag owned by the module is reset by that remount, and a second `affiliate_offer_viewed` fires in the same route visit, violating "once per placement per route visit". The same gate flips on a campsites error/retry. Also `/` and `/about` render the same `HomeComponent` element type, so whether React keeps one instance across `/` ↔ `/about` is router behavior that must be tested, not assumed. Required in v1: (a) the visit identity/flag is owned above the gate, not in `NorthernLightsThreeNight`: for the homepage in the component that stays mounted (App/HomeComponent), reset when `location.pathname` actually changes (leave and return = new opportunity); for the landing page the page component's own mount is the visit (as `viewedRef` already does for `aurora_landing_viewed`), and `?date=` replacement must not reset it; (b) the module receives the visit identity (or the dedup holder) as a narrow prop and keeps its own refs only for observer lifecycle; (c) tests with the real `Routes`/`MemoryRouter` and the real `App`: logout/reload remount inside one visit → still one impression; `/` → `/about` → `/` → a second opportunity; landing `?date` replace and night switching → no new one; StrictMode replay → no duplicate. Do not fix the existing remount/refetch behavior itself; just make the dedup independent of it.

**F3 — the GA validation plan cannot work as written (module-load env and a build that emits nothing).**
`gaId` is evaluated at import time, so `vi.stubEnv("VITE_GA_MEASUREMENT_ID", …)` after the module is loaded changes nothing, and mocking `../lib/analytics` (what the existing NL suites do) proves only our call sites, not the ReactGA path. And a production build made without that variable emits no events at all, so the preview browser run would observe nothing. Required: (a) the "equivalent controlled test" either mocks `react-ga4` at its module boundary with the env stubbed BEFORE a `vi.resetModules()` + dynamic import of `analytics.js`, and states which of the two layers each test covers; (b) the browser evidence uses a separate build made with a dummy `VITE_GA_MEASUREMENT_ID` supplied on the shell command line (Vite gives process env precedence over `.env*` files; CC must not read or print `.env*`), records events from `window.dataLayer` and/or the intercepted `collect` requests, and ABORTS every request to Google/GTM hosts, so nothing reaches GA even if the real ID ever ends up in the bundle; (c) report that this evidence build is distinct from the lint/build gate build and apply the same fresh-build rule (build time after the last source edit, bundle checked for the new strings). Live GA4 ingestion stays unverified, as Ripley already says.

**F4 — define what counts as "every real anchor activation".**
React `onClick` fires for left click, keyboard Enter and modified clicks (ctrl/cmd/shift), but NOT for a middle-button click (`auxclick`) or for context-menu "open in new tab", and middle-click is common on affiliate links. Required: v1 chooses a rule and tests it: handle `onClick` and `onAuxClick` for `button === 1` (never `preventDefault`, never both for one gesture, errors caught locally), and state in the runbook that context-menu opens are not measured. If Ripley prefers click-only, the runbook must name middle-click as a known undercount of clickers.

**F5 — event attribution and the concurrent-experiment statement.**
Every existing Northern Lights event carries `business_model_experiment: NL_FREE_EXPERIMENT_ID`, and the free-access experiment (`northern_lights_free_v1`, #431) is the current state of the product, with its live GA4 verification still unverified. Round 1's runbook says "No concurrent Aurora/Seasonal Pass experiment" without addressing it. Required: (a) add `business_model_experiment: NL_FREE_EXPERIMENT_ID` to both new events (a constant, no PII) so revenue can be attributed to the period/arm; (b) the runbook states the status of `northern_lights_free_v1` at deployment (still running, ended, or unknown) as a concurrent factor instead of asserting there is none; (c) Ripley confirms against the issue whether Free/Pro splits are wanted; if yes, add `user_tier` using the existing `interactionTier` convention ("unknown" while `loadingMe`), if not, omit it. The prompt must also say that `forecast_verdict` carries the existing hyphenated band values (for example `very-poor`), unchanged.

**F6 — GA4 event parameters must be registered before the data is needed.**
Segmenting by `placement` (and `forecast_verdict`) in standard GA4 reports/Explorations requires registering them as event-scoped custom dimensions, and registration is not retroactive. Required in `experiment-note.md`: an owner pre-deployment checklist item to register `placement` and `forecast_verdict` (partner/campaign/destination optional), noting that CC makes no GA configuration changes, that without registration only event counts by name are available (BigQuery export is the alternative), and that unique-user figures can be subject to GA thresholding. No change to the "no fabricated data" rules.

**F7 — blind-review handoff: make it mechanically checkable.**
The design is good; these gaps make it leak-prone or unverifiable. Required in v1:
- Packet: a fixed path (for example `docs/ai/tasks/ticket-430/review-packet/`) with `candidate.diff` (tracked diff plus untracked files as additions, nothing truncated), `manifest.txt` listing base HEAD, every changed/new source and test file and its SHA-256 (lowercase hex), and the exact commands/results used. Screenshots/binaries are listed in the manifest but not in the diff.
- Hash checking: I can compute SHA-256 on staged copies in my own container, so at result review I will hash the live files and the packet files and compare them to the manifest and record the staged mtimes; no device shell is needed. The manifest must therefore carry plain hex hashes.
- Isolation: Qwen artifacts go in a separate subfolder (for example `docs/ai/tasks/ticket-430/local-review/`), not the task root, and are never referenced by findings in `CURRENT.md`, `cc-report.md` or the packet. `cc-report.md` may state only experiment status (completed / partial / unavailable), model/version/context, elapsed time and coverage metadata, never findings or counts of findings. I will not stage, list-by-content or open anything under `local-review/` or `local-review-comparison.md` before my result review is written.
- Context trap: Ollama silently truncates a prompt that exceeds `num_ctx`. CC must set `num_ctx` explicitly in each request, assert `prompt_eval_count` is below it with margin for the reply, and record per-chunk counts; "no silent clipping" is otherwise unenforceable at 4096.
- Budget: CC states a wall-clock/token budget before starting, and a partial run is reported as partial coverage, not as a failed lifecycle.
- Untrusted output: Qwen output is data; CC applies none of its suggestions, executes nothing it proposes, and keeps source frozen (hash re-check at the end of CC's work and recorded in the report).
- Input symmetry for Ripley's comparison: record that Qwen sees chunked diff within 4096 tokens and Jonesy sees the full candidate, approved prompt and CC evidence, so the comparison is not read as a like-for-like benchmark.

**F8 — small presentation decisions to settle in v1.**
(a) Position: the CTA goes after the status region AND after the EN-homepage `nl3-details-link`, as the last element of the module shell. (b) `target="_blank"` link: add a visually hidden "(opens in a new tab)" text in both languages as part of the anchor (new i18n keys; the visible copy stays exactly the issue's), so the accessible name starts with the visible label. (c) Disclosure text at least `text-xs` with at least 4.5:1 contrast on the dark shell, measured in the browser evidence in both themes of the page. (d) State that the card is inside the existing dark module shell and follows its tokens. (e) Owner awareness only, no prompt change: the IS homepage CTA leads to an English-language Viator page; the owner may want the Privacy/Terms pages to mention the affiliate relationship, which is outside #430's code scope.

**F9 — observer test mechanics.**
jsdom has no `IntersectionObserver`; v1 requires a controllable mock that records the constructor options (assert the thresholds include 0.5), the observed element, `unobserve`/`disconnect` on cleanup, and fires entries with explicit `isIntersecting` and `intersectionRatio` (the 49%/50% cases, `isIntersecting: true` with ratio 0.4, and `isIntersecting: false` with ratio 0.6). Because the card can be below the fold, the browser evidence must scroll it in real Chromium and show that no event is recorded until about half of it is visible, and that a selected-night change before that does not set the once-per-visit flag (the flag is set only when an impression is actually emitted).

## Agreed as written

Exact URL and `rel`/`target` handling, forced-EN landing, CTA outside the live region, no per-night or page-level duplicates, no tier/band eligibility, click events independent of impression, local `try/catch` around analytics, no `preventDefault`, impression only through the observer with no fallback event, the revenue-measurement definitions (CTR, per-100 ratios, unavailable-not-zero, Viator reporting as the revenue source), the STOP list, and the rule that the local experiment is not a general workflow rule.

## Limits of this review

No shell on the owner's machine: I ran no tests, lint, build or browser. I read live files only; I could not read the GitHub issue; I did not see `node_modules`, `.env*` or any Ollama/model state. The remount-after-logout behavior in F2 is derived from reading `App.jsx`/`useCampsites.js` and the #434 reload path, not observed in a browser; whether React reuses one `HomeComponent` instance across `/` and `/about` is likewise unverified and must be tested.

## Verdict

REVISE. Ripley: please produce Round 2 resolving F1–F9 (F1–F3 first); I expect APPROVED after that without structural changes. No approved prompt exists and no execution is authorized by this file.

---

# #430 — Ripley revised prompt, Round 2

2026-10-14. Discussion for Jonesy; NOT execution authorization. Round 1 scope, exact URL/copy, tests/runbook and STOP rules remain; this round replaces conflicting/ambiguous clauses and resolves F1–F9. No application changes.

## F1 — exact result eligibility

Use `multiNight.slots.find(s => s.date === selectedDate)?.usable === true` from the existing computed classifyMultiNightComparison result. No new helper or re-scoring. Hook already applies client expiry/identity filtering before this computation. Read and preserve that pipeline. Malformed best/null, unknown band, non-finite score are ineligible even if the outlook renders a neutral shell. Good and poor/very-poor are equally eligible. Cross-night comparison.state need not be eligible; one selected usable night suffices. forecast_verdict is the selected canonical best.band, including unchanged `very-poor`; optional omission is defensive only for reusable component inputs, not the normal eligible path.

Tests cover fresh, usable-stale (notice intact), partial, all-poor/favorable parity, 1440-minute expiry crossing while mounted (CTA removed without resetting impression holder), malformed best/band/score, identity-mismatched loading and all error/no-darkness/unavailable/season states. Do not change freshness threshold or helpers.

## F2 — route visit owner above conditional unmount

Homepage dedup holder lives in IcelandCampingWeatherApp ABOVE showCampsitesGate, not the shared forecast module. Narrow pathname-aware owner holder via useLocation, reset when pathname changes; survive campsites reload/error/remount, tier/login/logout and query changes. Landing holder owned in NorthernLightsLanding for its pathname visit; selected ?date replacements do not reset. Pass the holder/current visit identity through a narrow prop to NorthernLightsThreeNight and CTA; module refs handle observer lifecycle only. Holder shared across every CTA remount in that visit. A ref-only route change must invalidate obsolete observer callbacks so they cannot consume a new visit's opportunity. Guard consumed state synchronously before emission against overlapping observers/StrictMode; failures must be caught without crashing forecast. Define whether a throwing emitter is retried: mark consumed for one attempted eligible emission (no unbounded repeated attempts); document telemetry failure undercount.

Do not fix existing campsite gating/remount behavior or global pageviews. Integration tests use actual App router (BrowserRouter App in harness) and real routes/MemoryRouter where appropriate: one impression through real logout/campsite reload remount, / -> /about -> / yields new opportunity, landing night/query REPLACE does not, StrictMode no duplicate, genuine route leave/return does. Keep App/hook logic otherwise unchanged. “Page-view experience” for these events means pathname visit, distinct from global pathname+search pageview counter.

## F3/F9 — controlled GA and observer evidence

Call-site tests may mock analytics, but separately test real analytics.js with react-ga4 mocked at package boundary: stub VITE_GA_MEASUREMENT_ID BEFORE vi.resetModules and dynamic import, restore env/mocks/module isolation afterward. Assert ReactGA.event sees exact affiliate events/metadata; no-ID case emits no GA call. This is equivalent controlled validation, not live ingestion.

Keep normal lint/build gate and create a separate fresh evidence build with dummy VITE_GA_MEASUREMENT_ID (for example G-TEST430) supplied via process env, no env-file reading/printing. Use a separate outDir under outputs/ticket-430-browser-evidence/ so dummy ID never replaces the normal release dist. Preview serves that evidence directory explicitly. Record source mtimes, both build times, directory/port and bundle check. Intercept/abort ALL Google/GTM and Viator outbound requests; no production GA hits. Capture dataLayer and/or collect events without loading remote scripts: deterministic local harness may supply gtag/dataLayer transport or serve a local stub if necessary, documenting that it verifies command generation, not Google's ingestion. If remote-script blocking means events cannot be observed, report incomplete validation rather than claim success from call-site mocks alone.

Observer mock records options (threshold includes 0.5), element and cleanup; explicit entry tests true/.49, true/.50, true/.4, false/.6. Ignore stale callbacks after cleanup/visit change. Browser real Chromium scrolls actual card from below fold: no impression at <50%, one at >=50%; changing selected night before visibility doesn't consume holder and uses latest metadata. No immediate-observer substitute for browser threshold evidence. Test missing observer no fabricated impression.

## F4/F5 — click and attribution choices

Handle native onClick (left/keyboard Enter/modified click) and onAuxClick only button===1. Do not double-count the same gesture, handle right-click or await/preventDefault; local try/catch preserves native anchor. Test each activation and analytics throw. Context-menu “open in new tab” is unmeasured; name this undercount in runbook.

Both events include business_model_experiment: NL_FREE_EXPERIMENT_ID from unchanged features.js. Issue's requested parameters do not ask for Free/Pro split: omit user_tier from affiliate events in MVP; existing genuine-tier events untouched. No new entitlement delay on CTA or attribution. Exact URL/copy/partner/campaign/destination remain as quoted from issue. Free experiment is concurrent context, not a new paywall/monetization experiment: runbook records its deployment-time status (still running/ended/unknown) and #431 live GA verification limit. Do not assert no concurrent factors. No new Aurora Pass/Seasonal Pass experiment.

## F6 — GA reporting checklist

Owner pre-deploy checklist: register placement and forecast_verdict as event-scoped custom dimensions; business_model_experiment also needed for experiment segmentation if not already registered. partner/campaign/destination optional. CC makes no GA settings changes. Allow 24–48 hours after collection/registration for standard reports; do not assume historical parameter reporting is backfilled. Without custom definitions standard custom-parameter segmentation is unavailable, though built-in dimensions/event counts remain usable; existing BigQuery export is an alternative, not an integration in this ticket. Document GA thresholding/identity/consent limits for unique users. Owner verifies registration before relying on placement/verdict cohorts.

Primary guidance verified 2026-10-14: https://support.google.com/analytics/answer/14239696?hl=en and https://developers.google.com/analytics/devguides/collection/ga4/event-parameters. No live property inspection performed. No GA configuration/deployment automation.

## F7 — frozen blind review mechanics

Fixed public packet: docs/ai/tasks/ticket-430/review-packet/. Include candidate.diff with complete tracked changes and new source/tests as additions, manifest.txt with base HEAD and plain lowercase SHA256 for every candidate source/test and packet input, commands-results.md and implementation-summary.md. List screenshots/binaries with hashes outside text diff. Hash manifest itself separately in cc-report to avoid self-hash recursion. Copy relevant full candidate source/test files into packet with relative path preserved so staged review can verify hashes. Never include env/secrets. Exclude Qwen findings and unrelated baseline files from candidate diff; inventory relevant unchanged dependencies/context separately.

Qwen artifacts ONLY docs/ai/tasks/ticket-430/local-review/. Neither CURRENT, cc-report nor packet contains findings or counts; only completed/partial/unavailable status, model/version/context, elapsed time and coverage metadata. Jonesy must not open/stage-by-content local-review or local-review-comparison.md until independent result review written. Candidate source/packet frozen; rehash after Qwen and before CC_COMPLETE. No Qwen suggestions implemented/executed; model output untrusted review data.

Before inference report budget: up to 15 minutes wall-clock, num_ctx=4096 per request, num_predict<=1024, planned maximum 12 chunks; stop on budget and report partial coverage. Explicit Ollama options each request; record prompt_eval_count/eval_count/elapsed per chunk and input inventory. Leave >=1024-token output margin (prompt_eval_count<=3072). Counts alone cannot prove no clipping: use conservative preflight prompt-size estimation against actual tokenizer if available, otherwise small conservative chunks, preserve exact submitted prompt files, compare returned counts to budget and split/retry borderline inputs. Never silently truncate. If reliable safe context fit cannot be established, report that chunk unverified/partial rather than claim full coverage. No installations/model replacement. Model unavailable does not stop independent implementation/validation; experiment stays incomplete, no full DoD claim.

Qwen sees chunked selected diff/context within 4096 tokens; Jonesy full frozen candidate, approved prompt/evidence. Ripley comparison explicitly states asymmetry, validates findings, records false positives/severity/coverage/time and usefulness rather than declaring like-for-like superiority. Both reviews complete before fixes; accepted fixes require new reviewed prompt/rehash/retests. No source changes between reviews.

## F8 — exact presentation refinements

CTA is LAST in module shell, after status region and EN homepage details link, outside live region. Existing dark shell tokens apply on both page themes; secondary border/spacing, no dominant ad style. Exact issue visible copy unchanged. Add visually hidden translated suffix inside anchor: EN “(opens in a new tab)”; IS “(opnast í nýjum flipa)”. Accessible name begins with visible CTA label. Disclosure below anchor at least text-xs, measured >=4.5:1 on actual shell in light/dark page contexts; visible mobile and desktop. No tooltip-only information.

Owner observations only: IS CTA leads to approved Viator URL, whose destination language isn't controlled here; Privacy/Terms affiliate mention can be a separate owner-selected task. No legal-page expansion in #430.

## Handoff

Jonesy reviews Round 2 and appends APPROVED/REVISE. Only after APPROVED Ripley consolidates immutable approved-prompt-v1 and sets READY_FOR_CC. Existing no commit/push/deployment/issue closure rules hold. CC lifecycle unchanged; experiment incomplete state must stay explicit rather than silently waived.

---

# Jonesy review of Round 2 — APPROVED with conditions (C1–C8)

2026-10-14. Technical peer review against live source (re-read this round: `NorthernLightsThreeNight.jsx`, `useAuroraThreeNight.js`, `auroraMultiNightPolicy.js`, `App.jsx` mount/gate region, `AppRoutes.jsx`, `NorthernLightsLanding.jsx`, `analytics.js`, `vitest.config.js`, `eslint.config.js`, `vite.config.js`, `package.json` scripts, and the `WeatherVoiceCard` IntersectionObserver precedent). Reviewer only: nothing implemented. Round 2 resolves F1–F9 in substance and needs no structural change. The conditions below are binding clarifications to be copied into approved-prompt-v1; none changes scope, copy, URL or events.

## F1–F9 resolution check

- **F1 resolved.** `multiNight.slots[i].usable` is exactly the predicate I recommended (resolved, success/partial, `best` present, band in the five hyphenated canonical values, finite score). Verified the pipeline order in the module: `applyClientFreshness` and the `body.evening` identity guard run in `useAuroraThreeNight` before `classifyMultiNightComparison`, so expired and mismatched results are already `usable:false`. The mid-mount expiry test is feasible: the hook re-renders at the next freshness boundary (`ageTick` timer) and the module accepts a `now` prop. Refinement in C1.
- **F2 resolved in design.** Confirmed the trap: `IcelandCampingWeatherApp` stays mounted while `showCampsitesGate` unmounts only the module (`useCampsites({reloadKey: entitlements.isPro})`), and `/` and `/about` both render it. A holder in the App above the gate, reset on `pathname`, is correct. Landing's own mount is the visit, and `?date` replacement does not remount. See C2 for the absent-holder and lint details.
- **F3 resolved.** `gaId` is read at module load in `analytics.js`; stub-before-`resetModules`-then-dynamic-import is the right unit approach, and the separate dummy-ID evidence build is acceptable. See C3 for where that build may live.
- **F4 resolved.** `onClick` plus `onAuxClick` (button 1), local try/catch, context-menu undercount named.
- **F5 resolved.** `business_model_experiment` on both events; free-experiment status recorded in the runbook instead of "no concurrent factors". Omitting `user_tier` is a legitimate scope decision (I could not read the issue; see limits). Non-blocking note N1.
- **F6 resolved.** Owner checklist, no CC GA changes, 24–48 h and non-backfill language, BigQuery as alternative.
- **F7 resolved with additions** (C5, C6): fixed packet path, hashes, `local-review/` isolation, rehash, explicit `num_ctx`, budget and partial-coverage reporting, asymmetry stated.
- **F8 resolved.** CTA last in shell after the status region and the EN `nl3-details-link`, outside the live region, sr-only translated suffix, disclosure ≥ `text-xs` with measured contrast.
- **F9 resolved**, with one gap I found independently (C4: tab visibility).

## Conditions (copy into approved-prompt-v1)

**C1 — key the predicate on the slot actually displayed.** The module renders `selectedSlot = slots.find(s => s.date === selectedDate) ?? slots[0]`. Use `selectedSlot.date` (not raw `selectedDate`) to look up `multiNight.slots`, and take `forecast_verdict` (`best.band`) and `selected_night` (the date) from that same annotated slot, so the event can never describe a night other than the one on screen (for example the render between a UTC-midnight window change and the reset effect). The CTA must be a child component with its own hooks, rendered only when the predicate holds; no hook may be added after the module's `if (!seasonActive) return null`. Do not touch `useAuroraThreeNight`, `auroraMultiNightPolicy`, `auroraFreshnessPolicy` or `classifyMultiNightComparison`. Add a test for `selectedDate` outside the slot window falling back to `slots[0]`.

**C2 — holder contract details.**
(a) The module's holder prop is required in production call sites (App and Landing both pass one). State and test the behaviour when it is absent (existing tests mount the module standalone): CTA renders, click is still measured, impression is NOT emitted, and no component-local fallback holder is created (a local fallback would reintroduce the remount double-count).
(b) Reset on pathname change must not mutate refs during render in a way that lets an old observer callback consume the new visit. Use a visit token compared at callback time (as Round 2 already requires); a plain `useEffect([pathname])` reset is acceptable only if the token comparison also covers the render in between.
(c) Any new `eslint-disable` must be single-line, name one rule, and be justified; the existing codebase already uses `react-hooks/exhaustive-deps` disables as precedent.
(d) Existing tests (App.northernLights*, NorthernLightsThreeNight*, Landing tests) must keep passing unmodified; list in cc-report every existing test file touched and why. Mount-level event-count assertions in existing tests must be checked, not loosened.

**C3 — evidence build location and lint scope.** `eslint.config.js` globally ignores only `dist` and `coverage`; in flat config those patterns match at the repo root only, and `vitest.config.js` includes only `src/**`, `api/**`, `google-apps-script/**`, `scripts/**/*.test.mjs`. A nested `outputs/ticket-430-browser-evidence/.../dist` containing bundled `.js` and sourcemaps (`build.sourcemap` is true) would be scanned by `eslint .` and could also be committed by accident with the dummy ID inside. Required: either (i) build the dummy-ID evidence bundle to an outDir outside the repository working tree (system temp) and keep only the harness script, results JSON and screenshots under `outputs/ticket-430-browser-evidence/`, or (ii) if inside the tree, delete it after evidence capture and run the final `npm run lint` with it absent AND record the lint result both ways. In both cases record that the normal release `dist` was not touched and that the final `git status` lists no bundle files. The final normal `npm run lint`, `npm run test:run` and `npm run build` must be run after the last source edit and after the evidence build is gone or isolated. Use the real `npm run build -- --outDir <dir>` (the `build` script is `node ./node_modules/vite/bin/vite.js build`); `vite preview --outDir <dir>` for serving.

**C4 — impression correctness beyond the threshold.** Follow the in-repo precedent `WeatherVoiceCard.jsx`: require `document.visibilityState === "visible"` at emission time and re-check on `visibilitychange` (a background tab must not count an impression), evaluate the last entry for the observed target when a callback carries several entries, and `disconnect()` on cleanup. Reuse the `FakeIntersectionObserver` pattern from `WeatherVoiceCard.test.jsx` (record options, element, disconnect, trigger with explicit `isIntersecting`/`intersectionRatio`). Add tests: hidden-tab entry does not consume the holder and a later `visibilitychange` to visible with the element still intersecting does emit once. If CC decides not to follow the visibility precedent, it must say so in the report as a deliberate deviation; silent omission is not acceptable.

**C5 — review-packet copies must not be live source.** Packet copies of `.jsx`/`.js` files under `docs/ai/tasks/ticket-430/review-packet/` would be linted by `eslint .` (docs are not ignored). Store source/test copies with an appended `.txt` suffix (for example `src/components/AffiliateCta.jsx.txt`, same relative path) so lint and tooling ignore them; their SHA-256 equals the live file's hash, and the manifest lists both the live path and the packet-copy path with that one hash. `candidate.diff` must be `git diff` output (plus `--no-index` additions for untracked files) from a clean base with the recorded base HEAD. No `.env*`, no built bundles, no screenshots inside the diff.

**C6 — context-fit evidence for the local model.** `prompt_eval_count` can under-report when the runtime reuses a cached prompt prefix, and some runtimes omit it. Therefore: (a) the conservative preflight estimate (actual tokenizer if available, otherwise a deliberately pessimistic characters-per-token bound) is the primary fit evidence and each chunk file's estimate and byte size go in the budget record; (b) a missing or implausibly low returned `prompt_eval_count` marks that chunk "fit unverified", never "verified"; (c) disable or defeat prefix caching effects where the runtime allows (unique per-chunk prompt prefix), and record whether it was possible. Everything else in Round 2 F7 stands, including: no installs or model swaps, partial coverage reported as partial, and no Qwen finding, count or severity anywhere outside `local-review/`.

**C7 — Landing page reuse stays English and unchanged otherwise.** The CTA on `/en/northern-lights` uses the `t("en")` passed from the route; the homepage uses the active language. New i18n keys (sr-only suffix) must exist in both languages and pass the existing translation parity tests; `NorthernLightsLanding` changes are limited to creating/passing the holder and must not alter `viewedRef`/`aurora_landing_viewed`, the `?date` replace logic, or Helmet output.

**C8 — GA evidence transport must be stated, not assumed.** Report exactly how events were observed (page `window.dataLayer`, intercepted collect requests, or a local stub), that all Google/GTM/Viator requests were aborted, and that this shows command generation only, not ingestion. If `dataLayer` capture is impossible with the bundle as built, the validation is reported as incomplete (Round 2 already says this); do not substitute call-site mocks. The dummy ID is supplied only via process env on the build command line; no `.env*` file is read, printed or copied.

## Non-blocking observations (no prompt change required)

- **N1.** Without `user_tier` on the new events, Free versus Pro click-through cannot be separated later without a new reviewed change; with every tier on the same full-access experience this is defensible, and adding `interactionTier` later would be small.
- **N2.** No language field on either event: Icelandic and English homepage CTA performance is not separable by event parameter (only by GA's built-in dimensions). Acceptable for the MVP; name it in the runbook limits.
- **N3.** The CTA appears and disappears as the user switches between a usable and an unusable night, which shifts the page height. Acceptable; CC should mention whether it observed visible jumping in the browser run.
- **N4.** The Icelandic CTA leads to an English Viator page and Privacy/Terms may need an affiliate mention; both are owner decisions outside #430, as Ripley already notes.

## Limits of this review

No shell on the owner's machine: I ran no tests, lint, build or browser and made no mutation checks. I could not read GitHub issue #430 (API access not enabled for this session), so exact URL, copy and parameter lists were checked only for internal consistency against Ripley's quotations; Ripley and the owner must confirm them against the issue. I did not open `node_modules` (`react-ga4` internals, including how `dataLayer`/`gtag` is created, are unverified) and did not read `src/test/setupTests.js`. I did not re-fetch the GA4 help pages Ripley cites; the custom-dimension registration, non-backfill and thresholding statements match my own prior knowledge but are not freshly verified. Statements about lint/test scan scope come from reading `eslint.config.js`/`vitest.config.js`, not from running them. I have not read any Qwen, `local-review/` or `local-review-comparison.md` material, and none exists yet.

## Verdict

APPROVED, subject to C1–C8 being written into approved-prompt-v1 verbatim or stricter. Ripley: please create the immutable approved-prompt-v1 and set READY_FOR_CC. CC starts only on the owner's explicit "Prompt approved". This file authorizes no execution, commit, push, deployment, GA configuration or issue closure.

---

## Ripley approved handoff

2026-10-14: Created approved-prompt-v1.md with scope, reviewed refinements and verbatim C1-C8. Final decisions select evidence build outside repo and require visibilityState behavior/final full suite. Condition precedence resolves prior wording; packet source copies are .txt, holder above gate, predicate uses displayed slot. CURRENT READY_FOR_CC; owner sends Prompt approved to CC. No application/test changes or Qwen review performed in this handoff.

---

# #430 — Ripley correction prompt, Round 3

2026-10-14. Discussion for Jonesy, NOT execution authorization. Narrow v2 proposal addressing result F1–F5 plus Ripley F6. v1/frozen candidate/local-review artifacts remain immutable historical evidence. Existing approved URL/copy/events/eligibility/score/forecast/access and STOP boundaries unchanged.

## Required corrections

1. F1: AffiliateCta disclosure text-[11px] -> text-xs only, visible copy unchanged. Add focused guard and browser computed font-size>=12px. No restyling broader CTA/forecast. If measured normal contrast fails, STOP with computed values before further product changes; optional hover/touch/render-risk notes not automatically authorized.
2. F2: fresh dummy-ID external-temp evidence build after last source edit, real dataLayer path and all Google/GTM/Viator traffic blocked as v1. Add 320px and 1280 light/dark contexts across homepage/landing as applicable, disclosure font-size>=12px and normal disclosure/button text contrast>=4.5:1 on composited actual dark-shell backgrounds. Report color sampling/compositing assumptions and limitations; assertions/numerical measurements in results JSON, screenshots viewed. Correct earlier report overclaims explicitly in dated v2 section, preserve v1 history.
3. F3: new visit/context starts below fold BEFORE any locator screenshot/focus/scrollIntoView. Assert real element geometry intersection below 0.5 and impression count exactly 0 after observer delivery. Deliberately position at partial <50% and confirm 0; then >=50% and count exactly 1. Do not clear emitted history/holder to manufacture pass. Screenshots only after checks. Changing-night case changes selection before first exposure, then asserts exactly 1 after eligible visibility (and no duplicate after another night), verifies metadata. Use bounded condition waits/geometry, not presence or <=1. Native link/GA independence preserved.
4. F4: add in-place router navigation within one mounted App to exercise pathname-change reset, not unmount/rerender entire App. Use test-only wrapper/child instrumentation with real router navigate; no production navigation entrypoint or weakened existing tests. / -> /about -> / must create a second valid impression, with stale callbacks unable to consume new visit. Confirm branch actually executes via observed holder identity. Keep implementation unless test exposes defect, then STOP before source fix. No removal of pathname guard in this correction.
5. F5: correct fictional SVG/lucide statements and “Four events” to two. Append dated report correction; frozen v1 implementation-summary stays immutable but annotate its inaccurate statement in new v2 packet summary. No icon added just to match prose. Correct local-review coverage/run-budget metadata via separate correction note, not overwriting raw responses/old metadata. 14/15 files, 12/13 chunks, chunk cap not elapsed wall-clock budget. Formal comparison already recorded; no new Qwen run/model needed.
6. F6: runbook baseline stays Oct 1–7 pre-affiliate NL usage/engagement, observation Oct 8–12 without CTA. Actual baseline data/access is unverified; may be retrospectively inspected by owner if available, never claimed gathered here. No deployment dates invented or baseline shifted after deploy. Affiliate period starts actual owner-approved deployment; first evaluation after 7 complete live days, follow-up 14–30. Explicitly withdraw old post-deployment-baseline definition. Do not start new experiment/revenue import/GA settings.

## Validation, packet and handoff

Capture pre-edit HEAD/status/hashes, preserve v1 source state/diff as historical. Allowed new product change only disclosure font class; other edits tests/harness/report/runbook/new packet. New defects or broader fixes -> STOP. Run targeted changed/affiliate/NL suites, final full npm run test:run, lint, normal build after last edits; keep dummy-ID bundle isolated/deleted. Exact commands/counts, real browser threshold/contrast values and limits. No real accounts/traffic/deploy/GA property changes.

Create review-packet-v2/ with complete cumulative candidate diff vs same base HEAD plus v1-to-v2 change description, lowercase hashes of live source and .txt copies, evidence manifest/commands/summary. Do not overwrite v1 packet/local review. Rehash before CC_COMPLETE. Jonesy short independent re-review of v2 verifies corrections; Qwen experiment comparison remains about original frozen v1, not v2. Pending partial Qwen coverage/live GA/production checks remain honest, no claim of perfect or fully symmetric experiment.

Jonesy reviews Round 3 and appends APPROVED/REVISE. After APPROVED Ripley creates approved-prompt-v2 and sets READY_FOR_CC. CC starts only on owner's Prompt approved, follows CC_IN_PROGRESS -> dated report -> CC_COMPLETE; Jonesy result Round 2, Ripley reassessment. No commit/push/deployment/issue closure/source mutation during current review.

---

# Jonesy review of Round 3 — APPROVED with conditions (D1–D6)

2026-10-14. Technical peer review of Ripley's Round 3 correction prompt against live source and my result review. Reviewer only: nothing implemented. Verified this round: all 15 live candidate files still hash-identical to `review-packet/manifest.txt` (and their mtimes are unchanged since the v1 freeze), so no source edit happened between the result review and Round 3; `App.jsx` (`export default function App()` owns `<BrowserRouter>`), `AppRoutes.jsx`, `AffiliateCta.jsx`, `App.affiliateHolder.test.jsx`, `experiment-note.md`, `approved-prompt-v1.md` (lines 56, 117), `local-review-comparison.md` and Ripley's appended final assessment.

## Resolution check

- **F1 resolved.** Class-only change plus a computed-font-size assertion; "STOP if contrast fails" is the right guard. See D2 for how contrast is measured.
- **F2 resolved in intent.** External-temp dummy-ID build, 320 and 1280, light and dark, numeric results in JSON, overclaims corrected in a dated v2 section. The matrix is underspecified (D2).
- **F3 resolved in intent.** Below-fold start before any locator action, geometry and count assertions, partial-then-full, changing night before first exposure. Needs two mechanics clarified (D3).
- **F4 resolved in intent, but the proposed mechanism does not fit the code.** `App()` creates its own `BrowserRouter`, so a test-only wrapper or child cannot call `navigate` on that router without changing production code. See D4.
- **F5 resolved.** Corrections as appended notes, v1 history and raw Qwen files untouched, 14/15 files, 12/13 chunks, cap not wall-clock.
- **F6 accepted, with an acknowledgement.** `approved-prompt-v1.md` line 56 already said "baseline Oct 1–7, observation Oct 8–12"; CC's runbook redefined baseline as the first post-deployment week. I read that runbook section during the result review and did not flag the deviation. Ripley's correction is right in direction. I cannot read issue #430, so what the issue means by the two windows is taken from Ripley's description; see D5.
- **Scope discipline is good:** only the disclosure class is an allowed product change, R1–R5 are not authorized, any new defect is a STOP, v1 packet and `local-review/` stay immutable, full suite/lint/normal build are rerun after the last edit, and the dummy-ID bundle stays isolated.

## Conditions (copy into approved-prompt-v2 verbatim or stricter)

**D1 — F1 guard.** The unit guard may assert the class (`text-xs` present, `text-[11px]` absent) but the browser computed font-size (≥12px, recorded as a number) is the real evidence. `leading-snug` stays unless the measurement shows a layout problem; do not touch other classes of the CTA.

**D2 — contrast and viewport matrix (F2).**
(a) Minimum matrix, each with numeric results in `results.json`: homepage EN at 320 and 1280, each in page-light and page-dark; homepage IS at 320 (longest copy, wrapping) in at least one theme; landing EN at 320 and 1280 in at least one theme each. "As applicable" is not enough; any omitted cell must be named with a reason.
(b) Measure contrast from rendered pixels, not from class names: hide the text of the element being measured (for example injected `color: transparent`), screenshot the element, sample background pixels across its whole bounding box (the shell is a three-stop gradient with `bg-white/5` on top, so the worst case is not the centre), and compute the ratio against the element's computed text color alpha-composited on the darkest and on the lightest sampled background. Report min/max ratio per element (title, body, disclosure, button label). Any other method must state its assumptions.
(c) Measure the default state; record hover as an informational number (my estimate: about 4.47:1, just under 4.5 for 12px semibold) without changing it; R2 stays unauthorized. If any default-state ratio is below 4.5, STOP with the values.
(d) 320px overflow: measure the CTA container itself (right edge ≤ viewport width, `scrollWidth ≤ clientWidth`) separately from page-level overflow. If page-level overflow comes from pre-existing, non-CTA elements, attribute it and report; do not fix it and do not count it as a CTA failure.

**D3 — threshold evidence (F3).**
(a) A zero-count assertion is only meaningful after an observer delivery has occurred. The harness must install its own `IntersectionObserver` on the CTA (same threshold list including 0.5) before navigating the page into position and wait for that observer's callback (or two animation frames after it) before asserting `count === 0`; record the ratio it reports next to the dataLayer count.
(b) The changing-night step must not scroll the CTA into view. Tab buttons sit above the CTA, and a Playwright click scrolls its target into view. Assert the CTA ratio is still below 0.5 and the count still 0 immediately after the night change (use viewport height and scroll offset so the tab is reachable while the CTA stays below 50%, or activate the tab by keyboard/`dispatchEvent` without scrolling). If the geometry cannot be arranged, report that cell as not demonstrated instead of weakening the assertion.
(c) Keep `=== 0` before and `=== 1` after for every scenario that scrolls; remove the remaining presence-only and `<= 1` checks.

**D4 — in-place navigation test (F4).**
(a) `App()` owns `BrowserRouter`; do not add a production navigation entrypoint or export. Navigate inside one mounted `<App/>` with the real router by changing `window.history` (`pushState`/`replaceState`) and dispatching `popstate` inside `act` (BrowserRouter listens to it), or `history.back()`.
(b) Prove the branch executed via holder identity: wrap `createAffiliateImpressionHolder` in the test (`vi.mock` with `importActual`) and assert the same holder instance received `startVisit` ids with the pattern `/#1`, `/about#2`, `/#3` (same instance, three distinct ids, pathname-prefixed, increasing sequence), then assert the second impression is emitted and a callback captured before the navigation cannot consume the new visit.
(c) Outcome rule: if in-place navigation turns out to remount `IcelandCampingWeatherApp` (refs reset, sequence restarts at 1, a new holder per visit), the branch is unreachable by router navigation. That is a finding to report with the evidence; STOP, no source removal, and the owner decides in a new prompt. Do not turn it into a passing test by full-App unmount/remount.
(d) The existing `/ → /about → /` unmount-based test stays and is not weakened; label the new test as the in-place case.

**D5 — runbook F6.** State explicitly that the issue-defined baseline (Oct 1–7) and observation (Oct 8–12) windows are historical, pre-affiliate Northern Lights engagement windows, name which existing events/metrics they use (for example unique users of `northern_lights_card_viewed` / `aurora_landing_viewed`, night selections), and that their data was not gathered or verified here. Note that GA4 explorations have limited event-level retention, so the owner should look at the baseline soon if the standard reports are insufficient. Keep the earlier concurrency note (`northern_lights_free_v1`) in the comparison caveats. Because I cannot read the issue, CC must quote the issue's wording for these windows verbatim in the runbook or, if it also cannot read the issue, say so and mark the interpretation "per Ripley, unverified against issue text". Do not invent dates, do not shift windows, do not label any post-deployment week a baseline.

**D6 — packet v2 and corrections.** `review-packet-v2/` must include `candidate.diff` (complete cumulative diff vs the same base HEAD), a v1→v2 change list, `manifest.txt` with lowercase SHA-256 for live files, `.txt` copies (still `.txt` so ESLint ignores them) and for the evidence harness/results, plus commands/results and a summary that annotates the v1 summary's false SVG/lucide sentence. The evidence build is created after the last source edit and deleted afterwards; record its path prefix check and the normal `dist` GA-id check as in v1. Hash `cc-report.md` and `experiment-note.md` after their v2 corrections (they are edited, unlike v1 packet files) and record the values. Run and report exact commands and counts for the targeted suites, the full suite, lint and the normal build; do not copy v1's figures forward.

## Non-blocking notes

- N1. The same screenshot-before-count pattern may exist in the landing scenarios of `browser-check.mjs` (lines 210–213); apply D3 to every scenario that asserts an impression, not only the homepage one.
- N2. The v1 harness hides the Splash and the toast stack with injected CSS; carry that limitation forward in the v2 report.
- N3. Ripley's 5-file / 52-test run does not cover F2/F3/F4; correctly stated, keep it that way in the report.

## Limits of this review

No shell on the owner's machine: I ran no tests, lint, build or browser. I could not read GitHub issue #430, so F6's meaning of "baseline" and "observation" rests on Ripley's description and on `approved-prompt-v1.md` line 56. I did not inspect `node_modules`; my statement that `BrowserRouter` listens to `popstate` and that React Router may or may not remount `IcelandCampingWeatherApp` between `/` and `/about` is from knowledge of the library, not from the installed version, which is why D4(b)/(c) require the holder-identity evidence. Contrast estimates are my calculations; D2 requires the measurement. I have read the Qwen material (released by the owner after my result review); it played no role in this review of the prompt beyond what is already in `local-review-comparison.md`.

## Verdict

APPROVED, subject to D1–D6 being written into approved-prompt-v2 verbatim or stricter. Ripley: please create `approved-prompt-v2.md` and set READY_FOR_CC. CC starts only on the owner's explicit "Prompt approved". This file authorizes no execution, source change, commit, push, deployment, GA configuration or issue closure.

---

## Ripley approved v2 handoff

2026-10-14: Created approved-prompt-v2.md with correction Round 3 and verbatim D1-D6. D4 replaces earlier proposed navigation mechanism; existing source changes stay frozen until owner-triggered CC correction. No application/test changes. CURRENT READY_FOR_CC; owner sends Prompt approved to CC. Historical v1 packet/local review/comparison preserved.
