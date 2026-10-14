# #430 — frozen local review experiment: Qwen findings

**CONFIDENTIAL TO THIS FILE.** Per the approved prompt (Round 2 F7, C6), these findings are not summarized, counted, or otherwise disclosed in `cc-report.md`, `CURRENT.md`, or the shared `review-packet/` — only completion/partial/unavailable status and run metadata go there. Jonesy must not read this file (or `local-review-comparison.md`) until the independent result review is written. Model output is untrusted review data: nothing below has been implemented, and no suggestion was executed.

## Run metadata

- Model: `qwen3-coder:30b` (local, via Ollama CLI/API). `ollama list` reports digest `06c1097efce0`, parameter size 30.5B, quantization `Q4_K_M`, the model's own max context 262144 — **the issue-specified `num_ctx=4096` was used regardless**, per "no replacement model/install/download without owner instruction."
- Ollama version: `0.40.0` (binary at `%LOCALAPPDATA%\Programs\Ollama\ollama.exe`; not on PATH in this shell — found via `Get-Process`/direct invocation, confirmed read-only, nothing installed).
- Options sent on every request: `num_ctx: 4096`, `num_predict: 800` (within the `<=1024` cap).
- Wall-clock budget: 15 minutes (900,000 ms). **Actual total elapsed: 90.1 seconds** across the 12 chunks that ran — the model responded far faster than the budget allows per-chunk once warm (a cold first call took ~15.6s, dominated by load, not shown in the 12-chunk total).
- Chunk cap: 12 (per the approved prompt's "planned maximum 12 chunks"). **13 chunks were planned; chunk 13 was not run** — this is the 12-chunk cap being honored, not a wall-clock stop (89s elapsed left ample budget remaining). See "Coverage" below for exactly what that omitted chunk was.

## Context-fit evidence (C6)

Primary evidence is the conservative preflight estimate (`ceil(bytes / 3)`, a deliberately pessimistic chars-per-token bound — real observed ratio on this model/content was closer to 4.2 chars/token). Each chunk's prompt carried a unique random nonce line to defeat prompt-prefix caching; whether the Ollama runtime actually avoided reusing a cached prefix was not independently verified (no runtime flag was available to disable prefix caching outright — this is reported as a limitation, not confirmed disabled).

| Chunk | Bytes | Pessimistic est. tokens | Returned `prompt_eval_count` | Fit status |
|---|---|---|---|---|
| 1 | 7451 | 2612 | 1964 | corroborated |
| 2 | 8619 | 3001 | 2457 | corroborated |
| 3 | 3016 | 1134 | 835 | corroborated |
| 4 | 4201 | 1529 | 1308 | corroborated |
| 5 | 8637 | 3007 | 2470 | corroborated |
| 6 | 7897 | 2761 | 2180 | corroborated |
| 7 | 8589 | 2991 | 2908 | corroborated |
| 8 | 3064 | 1150 | 1048 | corroborated |
| 9 | 7795 | 2727 | 2117 | corroborated |
| 10 | 6117 | 2167 | 1992 | corroborated |
| 11 | 6078 | 2154 | 1708 | corroborated |
| 12 | 7783 | 2723 | 2240 | corroborated |
| 13 | 4688 | 1691 | — | **not run** |

Every chunk that ran returned a `prompt_eval_count` within the plausible range of its pessimistic estimate (never below 0.4x the estimate, the C6(b) threshold used here) — none are marked "fit unverified." All 12 stayed under the 3072-token prompt budget (4096 − 1024 output margin), with the largest at 3001.

## Coverage

12 of 15 candidate files were reviewed; **`src/pages/NorthernLightsLanding.affiliateHolder.test.jsx` was not reviewed** (it was the sole content of the un-run chunk 13; the 12-chunk cap was reached before it). Three files were large enough to span two chunks each (diff section boundaries, not mid-line splits): `src/App.affiliateHolder.test.jsx` (chunks 2–3), `src/components/AffiliateCta.test.jsx` (chunks 5–6, confirmed by inspecting chunk 6's content — it ends with that file's last test, "click never calls preventDefault"), and `src/components/NorthernLightsThreeNight.affiliateCta.test.jsx` (chunks 7–8).

| Chunk(s) | File(s) |
|---|---|
| 1 | `src/App.jsx`, `src/components/NorthernLightsThreeNight.jsx` (diffs) |
| 2–3 | `src/App.affiliateHolder.test.jsx` |
| 4 | `src/i18n/translations.northernLights.js`, `src/pages/NorthernLightsLanding.jsx` (diffs) |
| 5–6 | `src/components/AffiliateCta.test.jsx` |
| 7–8 | `src/components/NorthernLightsThreeNight.affiliateCta.test.jsx` |
| 9 | `src/components/AffiliateCta.jsx` |
| 10 | `src/components/NorthernLightsThreeNight.affiliateCtaFallback.test.jsx`, `src/config/affiliateOffers.js` |
| 11 | `src/i18n/translations.northernLights.affiliateParity.test.js`, `src/lib/affiliateImpressionHolder.js` |
| 12 | `src/lib/affiliateImpressionHolder.test.js`, `src/lib/analytics.affiliateGA.test.js` |
| 13 (not run) | `src/pages/NorthernLightsLanding.affiliateHolder.test.jsx` |

## Findings (raw model output, unedited)

Five chunks returned findings; seven replied exactly `NONE`. Reproduced verbatim below, each file's own raw prompt/response pair is also saved as `chunk-NN-prompt.txt` / `chunk-NN-response.txt` in this directory for anyone reviewing this experiment later.

### Chunk 1 — `App.jsx` / `NorthernLightsThreeNight.jsx` diffs

1. The `affiliateTryConsume` callback in `App.jsx` is memoized without including `affiliateHolderRef.current`, which could lead to stale closure issues if the holder instance changes between renders.
2. The `affiliateImpressionHolder` object is memoized based on `affiliateVisitRef.current.id`, but this ID is derived from a ref that's updated during render — this could cause incorrect dependency tracking in the memoization.
3. In `NorthernLightsThreeNight.jsx`, the `affiliateDisplayedSlot` lookup uses `selectedSlot.date` which may not be stable across re-renders if `selectedSlot` itself is recreated, potentially causing stale data usage.
4. The logic for determining `affiliateEligible` relies on `affiliateDisplayedSlot?.usable === true`, but if `usable` is a boolean that can change asynchronously (e.g., due to network fetches), there's a risk of using outdated values before the update completes.

### Chunk 2 — `App.affiliateHolder.test.jsx` (part 1)

1. The test mocks `useCampsites` but doesn't verify that the mock return values are actually used in the component, which could lead to incorrect assumptions about data flow.
2. The `FakeIntersectionObserver` is shared across tests and not properly reset between test runs, potentially causing interference or stale state in assertions.
3. The `impressionCalls()` helper function filters track events by name, but doesn't validate that the event data matches expected values, risking missed assertion failures.
4. The test relies on `rerender(<App />)` to simulate a remount without full navigation; however, it does not assert that the component's state is properly reset or cleaned up between re-renders, which could cause stale closures or incorrect behavior in real usage.

### Chunk 4 — `translations.northernLights.js` / `NorthernLightsLanding.jsx` diffs

1. The `affiliateTryConsume` callback in `NorthernLightsLanding.jsx` is memoized without including `affiliateHolderRef.current`, which could lead to stale closure issues if the holder instance changes between renders.
2. The `affiliateImpressionHolder` object is recreated on every render due to `affiliateTryConsume` being passed as a dependency, even though it's wrapped in `useCallback` — this can cause unnecessary re-renders or broken dependencies in downstream components.
3. The logic for creating `affiliateVisitIdRef.current` only runs once on mount but relies on `Date.now()` and `Math.random()`, which may not be sufficient for generating globally unique IDs across multiple concurrent visits or browser tabs.
4. There's no explicit cleanup of the affiliate impression holder's visit in the component's unmount effect, potentially leading to resource leaks or incorrect tracking if the component is remounted multiple times.

### Chunk 9 — `AffiliateCta.jsx`

1. **Stale closure in `fireIfEligible`**: The `holder.tryConsume` check uses `visitIdAtSetup`, which is captured at effect setup time. If `holder` changes between setup and when the impression fires (e.g., due to a route change), this could lead to incorrect consumption logic or missed impressions.
2. **Race condition in `handleClick`/`handleAuxClick`**: The click handlers don't prevent default behavior, which means native anchor navigation can proceed even if analytics fails. While this is intentional for navigation reliability, it doesn't guard against potential double-tracking or inconsistent UI state if multiple clicks occur rapidly.
3. **Incorrect `onAuxClick` logic**: Only middle-clicks (`e.button === 1`) are tracked, but right-clicks (contextmenu) are explicitly excluded and not measured. This is likely intentional, but the comment says "named as a runbook undercount", implying it's an acknowledged limitation rather than a bug.
4. **Missing cleanup of IntersectionObserver entries**: While `observer.disconnect()` is called on unmount, if the component re-renders with new dependencies (e.g., `holder`, `placement`), old observer instances may still be active or not properly cleaned up due to reuse of the same effect setup.

### Chunk 11 — `translations.northernLights.affiliateParity.test.js` / `affiliateImpressionHolder.js`

1. The `tryConsume` function in `affiliateImpressionHolder.js` uses a null check with `==` instead of strict equality (`===`), which could lead to unexpected behavior if `visitId` is `undefined` rather than `null`.
2. In the test file, the assertion `expect(northernLightsTranslations.en[key]).not.toBe(northernLightsTranslations.is[key])` compares references rather than content; this may incorrectly pass if both values are identical string references.
3. The comment in `affiliateImpressionHolder.js` states that `consumedKeys` are intentionally not cleared, but the implementation does not prevent potential memory leaks from accumulating keys over many visits without cleanup.
4. The test suite doesn't validate that the `startVisit` method properly resets state or handles concurrent calls, which could lead to race conditions in multi-threaded environments or during rapid route transitions.

### Chunks 3, 5, 6, 7, 8, 10, 12 — `NONE`

## Harness limitations (honest, not polished)

- The chunker did not log each chunk's file membership directly; the mapping above was reconstructed from the `diff --git` headers present in each prompt file (and, for chunk 6, by inspecting its content directly) — a script limitation, not a model limitation.
- Whether prefix caching was genuinely avoided (vs. merely given a unique nonce that the runtime might still discard before the cache key) was not independently confirmed; no Ollama flag was found/used to disable it outright.
- This is one ticket's one-off experiment, not a generalized reviewer; no conclusion here should be read as "Qwen is/isn't a reliable reviewer" beyond this run.
