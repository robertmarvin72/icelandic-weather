# #430 — CC execution report

Executed: `docs/ai/tasks/ticket-430/approved-prompt-v1.md` (owner `Prompt approved`; CURRENT.md was READY_FOR_CC). Client-side only: the secondary Viator "book a guided tour" next step after a valid Northern Lights result, on `/en/northern-lights` and the homepage module, with bilingual disclosure, visibility/click events, a measurement runbook, and the issue's one-ticket local Qwen-vs-Jonesy review experiment.

**No deployment, no GA settings change, no commit, no push, no production/Neon/live-user mutation, no GitHub issue closure, no Qwen suggestion implemented.** Today (2026-10-14) meets the issue's earliest implementation date; the actual experiment starts only on owner-approved deployment, and no October baseline data has been collected or analyzed — see `experiment-note.md`.

## 1. Read-only audit (confirmed against live source before editing)

- `NorthernLightsThreeNight.jsx` is the one shared module on both surfaces; landing forces `useT("en")` regardless of saved language. `selectedSlot = slots.find(s => s.date === selectedDate) ?? slots[0]` already existed and is the correct anchor for a displayed-slot predicate.
- `useAuroraThreeNight` + `classifyMultiNightComparison` (`auroraMultiNightPolicy.js`) already compute a per-slot `usable` fact (success/partial, known band, finite score) that is independent of freshness; `applyClientFreshness` (`auroraFreshnessPolicy.js`) already turns an expired success/partial result into `domain_unavailable` with `expired: true` **before** `classifyMultiNightComparison` ever sees it — so `usable` already excludes expired results without any new code, and a stale-but-not-expired result stays `usable: true`. This is why the predicate needed no new helper and no re-scoring.
- `features.js`'s `northern_lights_free_v1` (open access, all tiers) is unchanged and unrelated to affiliate eligibility.
- `analytics.js`'s `trackEvent` is synchronous, reads `VITE_GA_MEASUREMENT_ID` once at module load, and does not catch internally — confirming the CTA's own local try/catch requirement.
- The existing module-exposure dedup (`cardViewedRef` etc.) dedupes by request/date identity, not by route visit — confirmed a new, separate holder was needed, not a reuse of that pattern.
- `WeatherVoiceCard.jsx` is the correct, in-repo precedent for `IntersectionObserver` + `document.visibilityState` + `visibilitychange` re-check + `disconnect()` on cleanup; `WeatherVoiceCard.test.jsx`'s `FakeIntersectionObserver` is the correct test precedent, reused directly.
- `IcelandCampingWeatherApp`'s `showCampsitesGate` conditionally renders (and therefore can unmount/remount) everything below it, including `NorthernLightsThreeNight` — confirming the holder must live above that gate, not inside the shared module.

## 2. Implementation

New files:
- `src/config/affiliateOffers.js` — the exact Viator URL (byte-for-byte) and event constants.
- `src/lib/affiliateImpressionHolder.js` — plain-object "once per placement per route visit" dedup contract: synchronous `tryConsume(visitId, placement)`, a stale captured `visitId` always fails.
- `src/components/AffiliateCta.jsx` — the CTA, a separate child component (own hooks, so the parent never adds a hook after its own `if (!seasonActive) return null`). Impression via `IntersectionObserver` (≥50%) + `visibilityState`, modeled on `WeatherVoiceCard.jsx`. Click/`auxclick` (button 1 only) send `affiliate_clicked` independent of impression/holder state, with a local try/catch, no `preventDefault`.

Changed files:
- `src/components/NorthernLightsThreeNight.jsx` — predicate `multiNight.slots.find(s => s.date === selectedSlot.date)?.usable === true`; renders the CTA last, after the status region and the EN homepage details link, outside the `role="status"` region; new optional `affiliateImpressionHolder` prop (absent in existing standalone tests, which were not modified).
- `src/App.jsx` — the holder is created in `IcelandCampingWeatherApp`, above `showCampsitesGate`; a visit id is derived from `useLocation().pathname` plus a sequence counter, computed synchronously during render (the documented ref-derived-value-during-render pattern, not an effect) so the very first render after a pathname change already carries the new visit id.
- `src/pages/NorthernLightsLanding.jsx` — its own holder, one visit id minted once per mount; the `?date` query replace (`setSearchParams`) does not remount this page, so the same visit survives a night selection.
- `src/i18n/translations.northernLights.js` — five new keys (`nlAffiliateTitle/Body/Cta/Disclosure/NewTabSuffix`) in EN and IS, exact issue copy.

Six new test files (unit + integration; see §3 for counts): `src/lib/affiliateImpressionHolder.test.js`, `src/components/AffiliateCta.test.jsx`, `src/components/NorthernLightsThreeNight.affiliateCta.test.jsx`, `src/components/NorthernLightsThreeNight.affiliateCtaFallback.test.jsx`, `src/App.affiliateHolder.test.jsx`, `src/pages/NorthernLightsLanding.affiliateHolder.test.jsx`, plus `src/lib/analytics.affiliateGA.test.js` and `src/i18n/translations.northernLights.affiliateParity.test.js`.

### Deviations / judgment calls

1. **No pre-existing translation-parity test file existed** for `translations.northernLights.js` (C7 asks the new keys to "pass the existing translation parity tests"); none was found by search, so a small targeted one was added (`translations.northernLights.affiliateParity.test.js`) rather than skipping the requirement.
2. **`App.affiliateHolder.test.jsx`'s App-level tests do not use `vi.useFakeTimers()`**: combining fake timers with this real App tree's async passive-effect flushing (React's own scheduler) produced a reliable race where `waitFor` resolved before the `IntersectionObserver` effect had actually run. `isAuroraSeason` is partially mocked instead (`importOriginal` + override) so season is pinned on without needing to control the clock; the aurora fixture's `sourceFetchedAt` is computed relative to `Date.now()` instead of a fixed date so it stays fresh regardless of when the suite runs. Documented at the top of that file.
3. **Browser GA transport**: `window.dataLayer` capture, not a local stub server — see §4.

## 3. Tests and validation (exact commands and results)

- Targeted NL/aurora/affiliate suite (33 files together): `npx vitest run src/App.northernLightsAnchor.test.jsx src/App.northernLightsHomepageCheckout.test.jsx src/components/NorthernLightsCard.landingVariant.test.jsx src/components/NorthernLightsCard.test.jsx src/components/NorthernLightsThreeNight.affiliateCta.test.jsx src/components/NorthernLightsThreeNight.affiliateCtaFallback.test.jsx src/components/NorthernLightsThreeNight.interactionTier.test.jsx src/components/NorthernLightsThreeNight.round5.test.jsx src/components/NorthernLightsThreeNight.test.jsx src/hooks/useAuroraDecision.test.js src/hooks/useAuroraThreeNight.test.js src/lib/auroraBandPresentation.test.js src/lib/auroraCandidateRequest.test.js src/lib/auroraDecisionCache.test.js src/lib/auroraDecisionClassify.test.js src/lib/auroraDisplaySelection.test.js src/lib/auroraFreshnessPolicy.test.js src/lib/auroraMultiNightPolicy.test.js src/lib/auroraNightIndicator.test.js src/lib/auroraNightLabel.test.js src/lib/auroraNightQuery.test.js src/lib/auroraReasonSummaries.test.js src/lib/auroraScoring.test.js src/lib/auroraSeason.test.js src/lib/auroraVisualState.test.js src/pages/NorthernLightsLanding.affiliateHolder.test.jsx src/pages/NorthernLightsLanding.cardWiring.test.jsx src/pages/NorthernLightsLanding.homeHandoff.test.jsx src/pages/NorthernLightsLanding.metadata.test.jsx src/pages/NorthernLightsLanding.test.jsx src/App.affiliateHolder.test.jsx src/lib/affiliateImpressionHolder.test.js src/components/AffiliateCta.test.jsx` → **33 files, 466 tests passed.** (This both proves the new behavior and confirms every existing NL/aurora suite still passes unmodified.)
- `npx vitest run src/lib/analytics.affiliateGA.test.js` → **5 passed** (F3 equivalent GA validation: real `analytics.js`, `react-ga4` mocked at the package boundary, env stubbed before `vi.resetModules()` + dynamic import).
- `npx vitest run src/i18n/translations.northernLights.affiliateParity.test.js` → **4 passed.**
- `npm run test:run` (full suite) → **173 files, 2560 tests passed**, exit 0. No pre-existing failure.
- `npm run lint` → exit 0, run both before and after the review-packet `.txt` copies existed (confirmed empirically that the `.txt` suffix keeps ESLint from scanning them, not just by reading `eslint.config.js`).
- `npm run build` → exit 0. Completed `2026-10-14T09:30:25Z`, after the last production edit (`NorthernLightsLanding.jsx`, mtime `09:14:53Z`). Normal `dist/` contains no GA id (none configured in this environment) and was never touched by the dummy-ID build.

### What was tested (by file, briefly)

- **F1/C1 eligibility**: fresh, usable-stale (notice intact), partial, all-poor/favorable parity, 1440-minute expiry crossing while mounted (CTA removed, holder untouched by the module itself), malformed best/band/score, loading, every non-result primary, `selectedDate` outside the slot window falling back to `slots[0]` (isolated file, hook mocked only there).
- **F2/C2 holder**: one impression surviving a real campsites-gate loading→loaded and error→recovered remount (no navigation); StrictMode double effect does not duplicate; `/ → /about → /` each fresh visit gets its own opportunity; holder absent → CTA/click work, no impression, no local fallback created; landing's own holder surviving the `?date` replace.
- **F3/F9/C4 observer**: no event on render/0.49/non-intersecting, exactly one at 0.50, last-entry-of-several semantics, hidden-tab does not consume, a later `visibilitychange` to visible (element still intersecting) emits once, disconnect + listener removal on unmount, obsolete callback after cleanup never fires, missing `IntersectionObserver` → no fabricated impression, changing night before visibility uses the latest metadata.
- **F4/F5 click**: left/modified click, auxclick button 1 only (button 2 excluded), repeated clicks each fire, throwing analytics caught locally, no `preventDefault`, exact metadata with `destination` only on click, band/night omitted when absent.
- **F8 presentation**: exact URL/target/rel, exact EN/IS copy and disclosure, accessible name starts with the visible label and includes the translated new-tab suffix — covered by component tests; geometry/contrast/focus confirmed in the browser (§4), not claimed from jsdom class assertions alone. (v2 correction: `AffiliateCta.jsx` has no icon; see the v2 section below.)

## 4. Browser evidence

Harness: `outputs/ticket-430-browser-evidence/browser-check.mjs`. Results: `outputs/ticket-430-browser-evidence/results.json` plus screenshots in the same directory.

**8 scenarios, 50/50 assertions passed**, covering both placements, IS/EN, 375/1280 widths, light/dark, poor-result neutrality (very-poor band), the error/unavailable state (CTA absent), and the changing-night case (no duplicate impression):

- `homepage-en-light-1280`, `homepage-is-dark-1280`, `homepage-en-light-375`, `homepage-poor-neutral-1280`, `homepage-error-1280`
- `landing-en-light-1280`, `landing-en-dark-375`
- `changing-night-no-duplicate`

Per scenario (where applicable): hierarchy (CTA is the last element in the module shell), exact title/disclosure text present, exact `href`/`target`/`rel`, no horizontal overflow, a **real Chromium scroll** bringing the card into view producing exactly one `affiliate_offer_viewed` in `window.dataLayer`, a visible keyboard focus ring, and an intercepted (never sent) click to the exact Viator URL producing `affiliate_clicked` with `destination` in `dataLayer`.

### GA transport (C8)

Served a **separate evidence build** with `VITE_GA_MEASUREMENT_ID=G-TEST430` supplied only on the build command line (no `.env*` file read, printed, or copied), built with `VITE_GA_MEASUREMENT_ID=G-TEST430 node ./node_modules/vite/bin/vite.js build --outDir <system temp>/ticket430-ga-evidence-dist` — a task-specific directory under the OS temp directory, **outside the repository working tree** (C3 option (i)), never under `outputs/` or any tracked path. Served with `npx vite preview --outDir <that dir> --port 4530`. All Google/GTM/Viator requests were intercepted and **aborted** (`context.route(/^https?:\/\/(?!localhost:4530)/, route => route.abort())`), so no live GA or Viator traffic was ever sent.

Events were observed via **`window.dataLayer`**, not an intercepted collect request or a local stub server: reading `react-ga4`'s own source (`node_modules/react-ga4/src/ga4.ts`) confirmed `_loadGA` sets `window.dataLayer = window.dataLayer || []` and a `window.gtag` that pushes to it **synchronously, before** the remote `gtag.js` script tag is even appended — so this still works with that remote script's request aborted. This is **command generation only**: it proves the app calls `gtag("event", ...)` with the right name/payload at the right time, through the real `trackEvent` → `ReactGA.event` → `gtag` chain. It is **not** live GA4 ingestion, and nothing here claims that Google's servers ever received or processed these events.

After the run: the preview was stopped, the normal `dist/` was confirmed to still contain no GA id (`grep -c G-TEST430 dist/assets/*.js` → 0), and the evidence build directory was deleted after its path was re-checked against the expected temp-directory prefix. `git status --short` at the end lists no bundle/dist files anywhere in the repository.

### Limitations

- Chromium only (Playwright), no other browser/engine.
- The boot Splash overlay and the unrelated bottom-left toast stack were hidden with injected CSS (same documented workaround as #434/#435) — the mocked campsite forecast is intentionally empty, so Splash never clears on its own.
- Keyboard activation in the browser script used `Enter` after `.focus()`, intercepted via context-level routing (which applies to any resulting popup too); a manual mouse click was not separately exercised in the browser (it is covered at the unit level in `AffiliateCta.test.jsx`).

## 5. Revenue measurement runbook

`docs/ai/tasks/ticket-430/experiment-note.md`. Documents the GA4 metrics/formulas, the NL-user denominator and its scope caveat, zero-ratio handling, Viator-only revenue sourcing (status/currency/settlement/cancellations/report lag), the GA4 custom-dimension pre-deploy checklist (owner-only, no GA settings changed here), concurrency with the existing `northern_lights_free_v1` experiment and #431's unverified live-GA4 limitation, and the MVP scope limits (no `user_tier`/language parameter, context-menu undercount). **Explicitly states that the issue's illustrative Oct 1–7/8–12 dates have already passed before implementation finished and were never applied** — the runbook documents the relative cadence for the owner to apply from the real deployment timestamp, once it exists.

## 6. Frozen local review experiment (status only — see isolation note)

**Candidate freeze**: base HEAD `2091263f031b2fa8a6acf5a7ad7bb04281775ded`. Working tree was clean at task start except workflow docs (confirmed). `docs/ai/tasks/ticket-430/review-packet/`:
- `candidate.diff` — complete diff of all 15 candidate source/test files (4 modified, 11 new as additions via `git diff --no-index`), **sha256 `dd917c6c1092e3491cb69d76cd44032795d3a53bad7598922b5d78be6018644b`**.
- `manifest.txt` — base HEAD, and a lowercase sha256 for every candidate file at both its live path and its packet-copy path (same hash — new source/test files were copied into the packet with an appended `.txt` suffix, confirmed empirically to stay outside ESLint's scan), **sha256 of manifest.txt itself `679cc695f377eebe6e967e4516b5b75b205bae6daf72e149079c493088a5fbf1`** (hashed separately here to avoid the manifest hashing itself).
- `commands-results.md`, `implementation-summary.md`.
- **No `.env*`, no built bundle, no screenshot inside the diff.**

**Re-hash after the Qwen review, before this report**: every one of the 15 candidate files' live and packet-copy hashes were re-verified against `manifest.txt` — **all 15 matched, HEAD unchanged.** The candidate was frozen throughout.

**Ollama/model availability (read-only audit)**: the `ollama` CLI is not on PATH in this shell, but `ollama.exe` is installed (`%LOCALAPPDATA%\Programs\Ollama\ollama.exe`, confirmed via `Test-Path`) and was already running (`Get-Process`), with `qwen3-coder:30b` already pulled (`ollama list` → digest `06c1097efce0`, 30.5B params, `Q4_K_M`, the model's own max context 262144). **No install, download, or replacement model was used**; the issue-specified `num_ctx=4096` was used regardless of the model's own larger native context.

**Experiment status: completed (partial coverage).** Model `qwen3-coder:30b`, Ollama `0.40.0`, `num_ctx=4096`, `num_predict=800` (within the `<=1024` cap) on every request, a unique per-chunk nonce prefix. Wall-clock budget was 15 minutes; **actual elapsed was 90.1 seconds** across the 12 chunks that ran. **12 of a planned 13 chunks ran** (the approved prompt's 12-chunk cap was reached, not the wall-clock budget — ample time remained) — one file, `src/pages/NorthernLightsLanding.affiliateHolder.test.jsx`, was not reviewed by Qwen. Context-fit evidence used the conservative preflight estimate as primary (`ceil(bytes/3)`, deliberately pessimistic vs. the ~4.2 chars/token actually observed); every chunk that ran had its returned `prompt_eval_count` within a plausible range of that estimate (none marked "fit unverified"), and all 12 stayed within the 3072-token prompt budget (4096 − 1024 output margin). Whether the runtime's prompt-prefix cache was genuinely defeated by the per-chunk nonce (vs. a runtime option disabling it outright) was not independently confirmed — reported as a method limitation.

**Qwen's findings, their count, and their severity are deliberately not reproduced, summarized, or counted anywhere in this report, in `CURRENT.md`, or in the shared review packet** — they exist only in `docs/ai/tasks/ticket-430/local-review/qwen-review.md` and its accompanying per-chunk prompt/response files and run metadata, per the approved prompt's isolation requirement. **Jonesy must not open that directory until the independent result review is written.** No Qwen suggestion was implemented or executed; its output is untrusted review data pending Ripley's comparison after both reviews exist.

## 7. STOP boundaries respected

No scoring/ranking/freshness/forecast-data/gating/entitlement/payment change (confirmed: `useAuroraThreeNight`, `auroraMultiNightPolicy.js`, `auroraFreshnessPolicy.js`, `auroraDecisionClassify.js`, `features.js` are all byte-for-byte untouched — not in `candidate.diff`). No backend/API/provider integration, no broad analytics framework change (`analytics.js` itself is untouched), no URL change beyond the one centralized Viator URL, no extra providers, no new dependency, no model installation/replacement, no production mutation. No commit, push, deploy, or issue closure.

## 8. Lifecycle (v1)

Verified `CURRENT.md` was `READY_FOR_CC` referencing `approved-prompt-v1.md` before any edit; set `CC_IN_PROGRESS` before implementation. This report, the review packet, and `local-review/` are all written; `CURRENT.md` is now updated with this report's path and the frozen packet path, and set to `CC_COMPLETE`. Owner next sends `CC búinn` to Jonesy for the independent result review (without `local-review/` access); Ripley performs the comparison and final assessment once both reviews exist. No automatic git or issue action was taken.

---

# v2 correction (approved-prompt-v2.md) — 2026-10-14

Executed after Jonesy's independent result review (REVISE, narrow: F1–F5) and Ripley's final assessment (REVISE, adding F6). Scope: F1–F6 only, one permitted product edit (`AffiliateCta.jsx` disclosure class). Base HEAD unchanged: `2091263f031b2fa8a6acf5a7ad7bb04281775ded`. Pre-edit status/hashes were recorded and the v1 candidate was preserved as historical (`review-packet/` untouched, `local-review/` untouched except a new correction note — see below).

## F1 — disclosure font-size

`src/components/AffiliateCta.jsx`: the disclosure `<p>`'s class changed from `text-[11px]` to `text-xs`; copy unchanged. Added a class guard test (`text-xs` present, `text-[11px]` absent). Real evidence is the browser-measured computed font-size: **12px in every one of the 7 contrast-matrix cells below** (see F2). No other class on the CTA was touched; `leading-snug` unchanged.

## F2 — real pixel-sampled contrast and viewport matrix

New harness: `outputs/ticket-430-browser-evidence/browser-check-v2.mjs`, using a from-scratch minimal PNG decoder (`pngPixels.mjs`, Node's built-in `zlib` only — no new dependency) to read real screenshot pixels, since no image-decoding package exists in this project. Method: hide the measured element's own text (`color: transparent` on that element only), screenshot its actual bounding box, decode the PNG, sample a grid across the **whole** box (not just the centre — the shell is `bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950` plus the CTA's own `bg-white/5` overlay, both of which vary across the box), and compute the WCAG contrast ratio of the real (un-hidden) text color against **every** sampled background pixel, reporting the true minimum (worst case) and maximum. Text color itself is read via `getComputedStyle` and converted through an off-screen `<canvas>` (handles Tailwind v4's `oklch`/`color-mix` values).

**Matrix (7 cells, each measuring title/body/disclosure/button-label — all pass, minimum shown):**

| Cell | Title min | Body min | Disclosure min | Button min |
|---|---|---|---|---|
| homepage EN 320 light | 12.73:1 | 9.38:1 | 5.36:1 | 5.07:1 |
| homepage EN 320 dark | 12.73:1 | 9.38:1 | 5.36:1 | 5.07:1 |
| homepage EN 1280 light | 12.73:1 | 9.38:1 | 5.30:1 | 5.07:1 |
| homepage EN 1280 dark | 12.73:1 | 9.38:1 | 5.30:1 | 5.07:1 |
| homepage IS 320 light | 12.73:1 | 9.38:1 | 5.36:1 | 5.07:1 |
| landing EN 320 dark | 12.73:1 | 9.38:1 | 5.36:1 | 5.07:1 |
| landing EN 1280 light | 12.73:1 | 9.38:1 | 5.30:1 | 5.07:1 |

Every cell's minimum is **≥4.5:1** (the lowest overall is the disclosure at 5.30:1, well above the floor). Hover is reported as **informational only, not gating**, as D2(c) requires: button-label-on-hover minimum was **4.58:1** in every cell (matches Jonesy's own estimate of "about 4.47:1, just under 4.5" — close, the small difference is real-pixel sampling vs. a flat-color calculation; still logged as informational, not changed, per the contract, and not treated as a failure since the default/non-hover state is what the ≥4.5:1 requirement gates). All default-state ratios were ≥4.5:1, so no STOP was triggered.

Font-size: **12px in all 7 cells** for title/body/disclosure/button-label (all share the `text-xs` class).

320px overflow: CTA-container right edge within viewport and `scrollWidth <= clientWidth` in every 320px cell (no internal CTA overflow); page-level `scrollWidth - innerWidth` was 0 in every cell tested — no overflow to attribute.

**59/59 gating assertions passed** across all 9 scenarios (7 contrast cells + 2 threshold scenarios below), plus 49 informational measurements (font-size numbers, informational hover ratio). Full numbers: `outputs/ticket-430-browser-evidence/results-v2.json` (copied into `review-packet-v2/evidence/`). Screenshots viewed: the 320px EN and IS disclosure/button renders and the post-scroll threshold capture — the IS title visibly wraps to two lines at 320px with no overflow or clipping.

**Assumptions/limitations**: the PNG decoder handles only 8-bit, non-interlaced RGBA/RGB PNGs (validated against a known-gradient test image before use, confirmed exact-match colors); sampling uses a grid (~60×30 points per element, not every pixel) for speed — a worst-case pixel between grid points could theoretically differ slightly, though the measured margins (minimum 5.07:1 vs. the 4.5:1 floor) leave ample room. Contrast was measured on the dummy-ID evidence build only (Chromium), not cross-browser.

## F3 — real threshold evidence

Rewrote the browser threshold logic. The harness now installs its **own** real `IntersectionObserver` on the CTA (same threshold list, including 0.5) and waits for that observer's own delivery (plus two animation frames) **before** asserting a count. Every scenario that scrolls now asserts **exactly `0`** before and **exactly `1`** after — the v1 presence-only (`!!impressionEntry`) and `<=1` checks are gone.

- **`threshold-real-below-then-above`**: below the fold, the harness observer delivered (ratio **0.037**) before the `count === 0` assertion (both passed); after a real `scrollIntoViewIfNeeded()`, the harness observer measured ratio **1** and `affiliate_offer_viewed` count became exactly **1**.
- **`changing-night-no-scroll-into-view`**: before the night change, ratio **0.037**, count **0**. The second night tab was activated via a **dispatched DOM `click`** (not Playwright's `locator.click()`, which auto-scrolls its target into view) — confirmed the page's `scrollY` did not change (`0 → 0`). After the change, still not scrolled: ratio **0.037**, count still **0**. Only after a subsequent real scroll did the count become exactly **1**, with the metadata of the **newly selected night** (`selected_night` advanced to the next date), proving "latest metadata" end-to-end in a real browser, not just in the fake-observer unit tests.

Native link behavior and GA independence (click still works, `dataLayer` still records) were unaffected — covered by the same scenarios and by the unchanged unit tests.

## F4 — in-place navigation (whether the pathname-reset branch is reachable)

New test: `src/App.affiliateHolder.inPlaceNavigation.test.jsx`. Navigates **inside one mounted `<App/>`** via `window.history.pushState` + a dispatched `popstate` event (never a second `render(<App/>)` call — that is the existing, unmodified, unmount-based `/ → /about → /` test, which still passes). `createAffiliateImpressionHolder` is wrapped (`vi.mock` + `importActual`) to record every call and every `startVisit` id.

**Finding: the branch is reachable, and correctly handled.** Exactly **one** holder instance was ever created (`holderRecords.length === 1`), and it received three ids in sequence: **`/#1`, `/about#2`, `/#3`** — confirming `IcelandCampingWeatherApp` genuinely stays mounted across this in-place navigation (React Router v6 updates the matched `<Routes>` child in place here, rather than remounting it, since both routes resolve to the same component type at the same tree position). A callback captured from before the navigation away (`staleInst`) was triggered after the navigation back to `/` and did **not** add a third impression: total impressions stayed at exactly **2** (one per visit), proving a stale observer cannot consume a new visit's opportunity even without a full remount. No defect was found, so no STOP was needed and nothing in `App.jsx` was changed for F4.

(Note for completeness: this app's real About→home navigation is still a plain `<a>` full-page link in production today — see `App.northernLightsAnchor.test.jsx`'s own comment — so this exact code path is not exercised by that one specific link. It would be exercised by browser back/forward navigation within the SPA, or by a future client-side `<Link>` between these routes. The branch is not dead code.)

## F5 — report/runbook inaccuracies corrected

- `cc-report.md` (this file, v1 text above): removed the false "SVG decorative icon" claim and the implied `AffiliateCta.jsx`-uses-`lucide-react` claim from §6 (STOP boundaries) and the F8 presentation bullet. `AffiliateCta.jsx` has no icon.
- `docs/ai/tasks/ticket-430/review-packet/implementation-summary.md` (v1, frozen) is **not** edited, per D6. Its inaccurate "New files" bullet is annotated in `review-packet-v2/summary-v2.md`.
- `experiment-note.md`: "Four events" corrected to "Two events" (see F6 below for the larger correction to the same file).
- `docs/ai/tasks/ticket-430/local-review/qwen-review.md`'s own "12 of 15 candidate files" headline was an arithmetic error (its own coverage table was always correct and sums to 14); corrected via `local-review/metadata-correction-note.md`, without editing the original file. `run-meta.json`'s `stoppedOnBudget: true` field is clarified there too (it means the 12-chunk cap was reached, not that the 900-second wall-clock budget was exceeded — only 90.1s was used).

## F6 — runbook baseline/observation chronology

`experiment-note.md` is corrected in place (with a dated v2 section, since it is CC's own living report document, not a frozen packet file). v1 incorrectly treated "baseline" as a window that had to start after deployment (reasoning that the CTA's events can't exist before the CTA does). That was wrong. I independently retrieved issue #430 via `gh issue view 430` (not just relying on Ripley's chat quotation, though it matches exactly) and confirmed section 7 defines **Baseline (1.–7. október 2026)** and **Observation (8.–12. október 2026)** as historical **pre-affiliate** Northern Lights engagement windows — measuring existing, organic usage with events that already existed before this ticket (`northern_lights_card_viewed`, `aurora_landing_viewed`, night-selection interactions), explicitly *"Free Northern Lights án affiliate CTA"* and *"Engar affiliate breytingar."* `experiment-note.md` now states this correctly, quotes the issue's own wording, and is explicit that **no baseline or observation data has been gathered or verified by CC** — it notes GA4 Explorations' limited event-level retention so the owner can check that period soon if they want to, without claiming the data exists or was already pulled. The `northern_lights_free_v1` concurrency caveat is kept. No date was invented or shifted; the affiliate period still starts only at actual owner-approved deployment.

## v2 tests and validation (exact commands and results)

- `npx vitest run src/components/AffiliateCta.test.jsx src/lib/affiliateImpressionHolder.test.js src/App.affiliateHolder.test.jsx src/App.affiliateHolder.inPlaceNavigation.test.jsx src/pages/NorthernLightsLanding.affiliateHolder.test.jsx src/lib/analytics.affiliateGA.test.js src/components/NorthernLightsThreeNight.affiliateCta.test.jsx src/components/NorthernLightsThreeNight.affiliateCtaFallback.test.jsx src/i18n/translations.northernLights.affiliateParity.test.js` → **9 files, 73 tests passed.**
- `npm run test:run` (full suite) → **174 files, 2562 tests passed**, exit 0. No pre-existing failure. (Delta from v1's 173/2560 is exactly the 1 new test file and 1 new assertion above — not copied forward, a fresh run.)
- `npm run lint` → exit 0, including with `review-packet-v2/`'s `.txt` copies present (verified empirically).
- `npm run build` → exit 0. Completed `2026-10-14T10:17:11Z`, after the F1 edit (`AffiliateCta.jsx` mtime `10:09:53Z`).
- v2 dummy-ID evidence build: `VITE_GA_MEASUREMENT_ID=G-TEST430 node ./node_modules/vite/bin/vite.js build --outDir <system temp>/ticket430-v2-ga-evidence-dist`, built `2026-10-14T10:15:10Z` (after the F1 edit), served on port 4531, same aborted-Google/Viator-traffic and `window.dataLayer` transport method as v1 (command generation only, not live ingestion — nothing here claims otherwise). Directory deleted after capture, its path re-verified against the expected system-temp prefix first. Normal `dist/` confirmed to contain no `G-TEST430` (0 occurrences). `git status --short` lists no bundle/dist files.

Full command list: `review-packet-v2/commands-results-v2.md`.

## Candidate drift check

HEAD at the start of this v2 correction was re-verified as `2091263f031b2fa8a6acf5a7ad7bb04281775ded` — unchanged from the v1 freeze. No unrelated drift to report.

## Review-packet-v2 and re-hash before CC_COMPLETE

`docs/ai/tasks/ticket-430/review-packet-v2/`: `candidate.diff` (complete cumulative diff vs. the same base HEAD, 16 files), `manifest.txt` (SHA-256 for all 16 live files + `.txt` copies + the 6 evidence files), `change-list-v1-to-v2.md`, `summary-v2.md`, `commands-results-v2.md`, and `evidence/` (the v2 harness script, the PNG decoder, `results-v2.json`, and 3 representative screenshots). `review-packet/` (v1) and `local-review/`'s original files are **not** modified. After writing this report, every one of the 16 v2 candidate files was re-hashed against `review-packet-v2/manifest.txt`: **all 16 matched.**

`cc-report.md` (this file) and `experiment-note.md` are hashed after their v2 corrections, per D6. To avoid the same self-hash recursion the manifest already avoids, neither file records its own hash inline — both values are recorded in `review-packet-v2/commands-results-v2.md`, computed after this file and `experiment-note.md` were each finalized.

## Lifecycle (v2)

Verified `CURRENT.md` was `READY_FOR_CC` referencing `approved-prompt-v2.md`; set `CC_IN_PROGRESS` before any v2 edit. Executed only the F1–F6 corrections above — no optional risk fixes (R1–R5 from the result review remain unaddressed, as scoped), no new dependency, no icon, no source removal, no new Qwen run. `CURRENT.md`'s frozen-packet pointer now advances to `review-packet-v2/`, preserving the v1 path as history; CC report path stays `docs/ai/tasks/ticket-430/cc-report.md`. Set `CC_COMPLETE` after this section was written. Owner next sends `CC búinn` to Jonesy for a short independent v2 re-review; Ripley reassesses afterward. No commit, push, deployment, booking/live-account/Neon/GA-settings mutation, or GitHub closure. Deployment and its timestamp remain entirely owner-controlled.
