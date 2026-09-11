# CC Report — Ticket 408 (Weather Voice Phase 3: homepage UI integration)

Executed against: `docs/ai/tasks/ticket-408/approved-prompt-v1.md` (v1, READY_FOR_CC → CC_IN_PROGRESS), approved by Jonesy Round 1.

## 1. Pre-edit audit — read and confirmed against live source before any code was written

Read `AGENTS.md`, `CLAUDE.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, GitHub issue #408, #405/#406's approved prompts/cc-reports/final result-reviews (this session's own prior work), the approved v1 prompt and its full review history, and then the complete current implementations:

- **`src/App.jsx`** — confirmed `site = siteList.find(...)` (or `siteList[0]`), `useForecast(site?.lat, site?.lon, {...})` is the only forecast call, and `rowsWithDay` (`rows.map(r => ({...r, dayLabel}))`, `useMemo` on `[rows, lang]`) is the only rows source passed to `HomeDecisionCard`. No leaderboard/candidate/comparison forecast data flows into it.
- **`src/components/HomeDecisionCard.jsx`** — confirmed `model` (tone/title/body/badge/locked) is derived via `useMemo`, overridable by `comparisonState.direction`; confirmed `hasRoughWeather()`, the four existing `trackEvent(...)` call sites, and the locked-Pro CTA. No snapshot/DOM-count assertions exist in its test file.
- **`src/pages/DecisionQuizResearch.jsx`** — confirmed it renders the real `HomeDecisionCard` with `disableAnalytics` hardcoded and `{...flow.currentScenario.cardProps}` (frozen fixtures), passing no live `rows`/forecast data and never the new Weather Voice props.
- **`src/hooks/useForecast.js`** — re-derived the staleness hazard directly by tracing the effect: on the render immediately after `lat`/`lon` change, `rows` (from the still-old `data`) and `loading` (still whatever it was before this effect re-ran) are both stale for the new coordinates until the new effect's fetch resolves. Confirmed the fix is additive: a new `requestedFor` state, set in the same synchronous block as `setData(j)` (including the cached-response path, which resolves through the same call site).
- **`src/hooks/useForecast.scoringInvariance.test.js`**, **`src/components/HomeDecisionCard.test.jsx`** — read in full to confirm existing contracts/conventions before adding to them.
- **All Weather Voice Phase 1/2 modules** (`weatherVoiceEngine.js`, `weatherVoiceRules.js`, `weatherVoiceTypes.js`, `weatherVoiceContent.js`, `weatherVoiceSelector.js`, `weatherVoiceHistory.js`) and their tests — re-confirmed the `{tmax, windMax, rain, code}` daily-only input contract with raw provider `code` (never `summaryCode`), the pure selector/history separation, all 27 production entries at `ctaType: null`, and EN's genuinely-empty (not IS-fallback) library.
- **`public/tjaldur/`** — re-confirmed exactly twelve PNGs, one per canonical mood.
- **`src/components/RequireFeature.jsx`** — confirmed as "the ONLY supported feature-gating mechanism" per its own header comment; Weather Voice's comment is never wrapped in it.
- **`src/i18n/translations.common.js`** / **`src/hooks/useT.js`** — confirmed the existing flat `translations.<domain>.js` + `useT(lang)` convention, used for the new CTA label keys (kept fully distinct from the `src/i18n/weatherVoice/{is,en}.js` structured-content exception established in #406).

This audit fully supports the reviewed design; no contradiction was found, so no STOP condition was triggered.

## 2. Data flow — confirmed provenance and daily-input decisions

- `requestedFor` is captured from the hook's OWN `lat`/`lon` closure variables (the requested coordinates), never the provider's response fields — confirmed by direct code trace and by a dedicated test asserting `requestedFor` doesn't reflect provider "echo" fields injected into a mock payload.
- Weather Voice reads exactly today's row (`YYYY-MM-DD`, Atlantic/Reykjavik, via `Intl.DateTimeFormat("en-CA", {timeZone: "Atlantic/Reykjavik"})`), matched exactly against `row.date` — never `rows[0]`, never a substitute day, never a multi-day average.
- The homepage adapter (`useWeatherVoice`) gates all selection/exposure on: `enabled` (active homepage) AND current site identity AND `requestedFor` matching that site's exact requested `lat`/`lon` AND `!loading && !error` AND a genuine today-row match. Any one of these failing synchronously produces `{show:false}` — including on the very first render after a change, before any effect has run (see §4).
- `evaluateWeatherVoice({tmax, windMax, rain, code})` receives exactly today's row's own fields unchanged, then `getWeatherVoiceLibrary(lang)` and `selectWeatherVoiceComment(...)` — the unmodified Phase 1/2 contracts.

## 3. Files changed

**New:**
- `src/components/WeatherVoice.jsx` + `WeatherVoice.test.jsx` (16 tests) — pure renderer.
- `src/hooks/useWeatherVoice.js` + `useWeatherVoice.test.js` (29 tests) — data/lifecycle/selection/exposure hook.
- `src/lib/weatherVoicePresentation.js` + `weatherVoicePresentation.test.js` (12 tests) — mood→asset map, CTA resolver.
- `src/hooks/useForecast.provenance.test.js` (10 tests) — new provenance-specific coverage.

**Modified:**
- `src/hooks/useForecast.js` — additive `requestedFor` state only (§4).
- `src/components/HomeDecisionCard.jsx` — three new optional props (`weatherVoiceResult`, `weatherVoiceAction`, `onWeatherVoiceVisible`, all defaulting absent) and one new conditionally-rendered `<WeatherVoice>` slot, placed after the existing primary-actions block, inside the same card.
- `src/components/HomeDecisionCard.test.jsx` — 4 new tests for the slot (absent-by-default, renders when supplied, `{show:false}` renders nothing, DOM-order-after-primary-content); every existing test unmodified.
- `src/pages/DecisionQuizResearch.test.jsx` — 1 new regression test confirming zero Weather Voice DOM in the research route.
- `src/App.jsx` — imports `useWeatherVoice`, destructures `requestedFor` from `useForecast`, adds a `scrollToComparisonSection` callback and the `useWeatherVoice(...)` call (`enabled: !showCampsitesGate && page === "home"`), passes the three resolved values into `HomeDecisionCard`.
- `src/i18n/translations.common.js` — 5 new flat EN+IS keys (`weatherVoiceCtaBetterLocation`/`CalmerLocation`/`DrierLocation`/`WarmerLocation`/`BestLocations`).

**Confirmed untouched**: `src/lib/weatherVoiceEngine.js`, `weatherVoiceRules.js`, `weatherVoiceContent.js`, `weatherVoiceSelector.js`, `weatherVoiceHistory.js`, `weatherVoiceTypes.js` and every one of their tests (Phase 1/2, byte-for-byte unchanged — confirmed by `git status --short`, §7). `src/lib/scoring.js`, `src/lib/forecastNormalize.js`, `src/hooks/useLocalStorageState.js`, `src/i18n/translations.js`, `src/hooks/useT.js`, every backend route, entitlement/checkout code, `src/components/RequireFeature.jsx`. No dependency added. No `.tsx`/TypeScript. Not committed. Not pushed.

## 4. Lifecycle and selection design — exact decisions

- **Provenance seam** (`useForecast.js`): one new `useState(null)` (`requestedFor`), set via `setRequestedFor({lat, lon})` in the SAME synchronous statement block as the existing `setData(j)`/`setRetrying(false)` calls inside the success path — including the path a cached `getForecast()` resolution takes, since it's the identical call site. Nothing else in the hook changed: same retries, same backoff, same abort/cleanup guard, same normalization/scoring pipeline downstream.
- **Synchronous hide-on-change**: `useWeatherVoice`'s `presentation` is derived directly during render — `episodeKey && resolvedKey === episodeKey ? cached : {show:false}` — never from a state value that could lag a render behind. `episodeKey` itself is recomputed fresh every render from `site.id`/`todayDate`/`lang`/`engineResult`'s primitive values. This means the FIRST render after any of those changes (site switch, date rollover, language switch, or a changed Phase 1 outcome) already evaluates to `{show:false}`, before the selection effect has had any chance to run — verified directly by a dedicated test that asserts this synchronously, with no `waitFor`.
- **Stable episode key**: `surface|siteId|dateString|lang|condition|mood|severity`, built from primitive VALUES only. Object-identity-only rebuilds of `rows`/`engineResult` (same underlying values, new object references) never change the key string, so a same-valued new `rows` array reference does not trigger reselection (verified: RNG call count stays at 1).
- **StrictMode-safe single selection**: the actual `selectWeatherVoiceComment(...)` call (which consumes the injected `rng`, otherwise impure) lives inside a `useEffect`, guarded by a ref (`selectionCacheRef`) that only performs the real selection once per distinct `episodeKey` — the ref persists across React StrictMode's synthetic double-invoke of that same effect, so RNG is genuinely called exactly once per episode (verified directly: `rng` call count is 1 under `<React.StrictMode>`).
- **Temporary loading doesn't rotate**: a `loading:true` pass renders `{show:false}` (key still valid, but `dataReady` false so no NEW key exists to bind to — actually: `dataReady` gates `todayRow`, so `engineResult`/`episodeKey` become `{show:false}`/`null` while loading; once loading clears with the SAME underlying data, the ORIGINAL episodeKey is recomputed identically and the cache hit returns the SAME comment, without a new RNG call — verified directly).
- **Midnight refresh**: a `setInterval` (60s poll, cleaned up on unmount/disable) recomputes `getReykjavikDateString(now())` and updates `todayDate` state only when the string actually differs. Verified with `vi.useFakeTimers()` + a controllable injected `now`: crossing the boundary and advancing the interval correctly transitions to the next day's row/episode. Interval cleanup on unmount verified via a `clearInterval` spy.
- **Visibility-gated exposure**: `WeatherVoice.jsx` owns a guarded `IntersectionObserver` (cleanup on unmount/result change) and calls `onVisible()` at most once per its own mount, only when `entry.isIntersecting && document.visibilityState === "visible"`. `useWeatherVoice`'s `onVisible` callback is deliberately **ref-driven, not closure-driven**: it reads the LATEST `episodeKey`/`resolvedKey`/`presentation` via refs updated every render, so it stays a single stable function reference across renders while never being able to record a stale episode — even a captured "old" `onVisible` reference, called after a real episode change, can only ever act on the CURRENT episode at call time (verified directly with a test that captures the callback before a site switch and confirms the eventual record belongs to the NEW episode, never the old one).
- **Per-episode dedup**: a `recordedEpisodesRef` (a `Set` of episode keys already recorded this mount) makes `recordShown` calls idempotent per episode regardless of how many times visibility re-triggers.

## 5. Rendering, assets, and hierarchy — exact decisions

- Mood → asset mapping is an explicit, exhaustive 12-entry object literal (`weatherVoicePresentation.js`) — never inferred from severity/condition. An unknown/unsupported mood, or `comment.text` not being a string, makes `WeatherVoice.jsx` render `null` (no DOM at all).
- `WeatherVoice` is placed inside `HomeDecisionCard.jsx`, immediately after the existing primary-actions `<div>` (locked-CTA/secondary-CTA row), still inside the same card `<div>` — after the verdict, body, candidate details, and primary actions, exactly as required. Verified via a DOM-order test comparing `compareDocumentPosition` against the verdict title node, and visually via the real-browser screenshots (§6).
- Fixed `40×44`-ish image dimensions (`width={44} height={44}`, `object-contain`), decorative `alt=""` + `aria-hidden="true"`, subdued `text-xs` copy, no live region, no animation, no "Tjaldur says" heading, no quotation marks, no branded label.
- `{show:false}` (or an invalid/unknown-mood result) renders nothing — confirmed both in jsdom (`toBeEmptyDOMElement()`) and visually in the browser (the silent-scenario screenshot shows the card ending cleanly with no reserved space).
- **Honest limitation, not claimed as zero-shift**: when Weather Voice transitions from absent to present (selection resolving asynchronously after the card's initial paint), the card's height increases by roughly one comment-row's worth of space — this is an unavoidable one-time layout change given "no reserved blank row when silent" is also required. It happens once per episode (not repeatedly) and never before the primary verdict/CTA have already painted, so it does not disturb primary-content priority. No placeholder/skeleton row was added, per the explicit prohibition on reserving blank space.

## 6. Optional CTA seam

- `resolveWeatherVoiceCta({ctaType, t, onExplore})` (`weatherVoicePresentation.js`) renders `{label, onClick}` only when BOTH the `ctaType` is one of the five approved values AND `onExplore` is a real function — an unknown type or an unavailable action yields `null`, never a guessed destination or empty container.
- Labels are five new flat `translations.common.js` keys (`weatherVoiceCta*`), resolved through the caller's own `t` — never baked into the structured `#406` comment library. IS wording ("Bera saman aðstæður", "Skoða rólegri/þurrari/hlýrri staði", "Skoða bestu staðina") and EN wording both describe exploration, never promise a specific better site.
- `App.jsx`'s `scrollToComparisonSection` — a 2-line `document.getElementById("comparison-section")?.scrollIntoView(...)` helper — is the shared underlying navigation action, matching exactly what `HomeDecisionCard`'s own `handleSecondaryClick` already falls back to when no `onCtaClick` is supplied (App.jsx still doesn't pass one — untouched). This is deliberately **not** routed through `handleSecondaryClick` itself, which fires `homepage_instant_comparison_cta_click` — reusing it for a Weather Voice click would have fabricated that primary-CTA analytics event. `useWeatherVoice`'s CTA resolution and `WeatherVoice.jsx`'s button both call the action directly with zero analytics side effects of their own.
- Verified with synthetic CTA-bearing presentations (`weatherVoicePresentation.test.js`, `WeatherVoice.test.jsx`) that a resolved action renders a real `<button type="button">` (natively focusable/keyboard-operable, `Enter`/`Space` both activate a button element by default — no custom key handling was needed or added) and calls `onClick` on click.
- Verified against the REAL production content (`useWeatherVoice.test.js`'s "null-CTA production content" test): with the genuine `#406` IS library (all 27 entries `ctaType: null`), `action` is always `null` — the capability is built and tested, but production behavior is unchanged.
- The comment itself is never wrapped in `RequireFeature`; verified visually in the browser with `devPro` both on and off — identical comment content and layout in both tiers (§7).

## 7. Tests and validation — exact commands and results

1. `npx vitest run src/hooks/useForecast.provenance.test.js src/hooks/useForecast.scoringInvariance.test.js` → **2 files, 12 tests passed** — new provenance coverage plus the existing scoring-invariance suite, confirming zero scoring-facing change.
2. `npx vitest run src/lib/weatherVoicePresentation.test.js src/components/WeatherVoice.test.jsx` → **2 files, 24 tests passed**.
3. `npx vitest run src/hooks/useWeatherVoice.test.js` → **1 file, 29 tests passed**.
4. `npx vitest run src/components/HomeDecisionCard.test.jsx src/pages/DecisionQuizResearch.test.jsx` → **2 files, 75 tests passed** — every pre-existing assertion in both files unmodified; new slot/isolation tests added.
5. `npx vitest run src/lib/weatherVoiceEngine.test.js src/lib/weatherVoiceRules.test.js src/lib/weatherVoiceContent.test.js src/lib/weatherVoiceSelector.test.js src/lib/weatherVoiceHistory.test.js src/lib/weatherVoiceTypes.test.js src/hooks/useForecast.scoringInvariance.test.js` → **7 files, 151 tests passed** — the complete Phase 1/2 regression set, independently rerun, zero changes.
6. `npx eslint <every new/changed file>` → exit 0, no output.
7. `npm run lint` (full project) → exit 0, no output.
8. `npm test -- --run` (full suite) → **107 files, 1373 tests passed** (up from 103 files/1306 tests before this ticket — +4 files, +67 tests). Zero pre-existing failures.
9. `npm run build` → succeeded (`✓ built in 7.79s`). Bundle JS grew from ~1,282 kB to ~1,295 kB — expected and correct this time: unlike Phase 1/2 (Tickets 405/406), these modules are now genuinely imported from `App.jsx`, so Vite's tree-shaking correctly includes them.
10. `git diff --check` → exit 0 (only pre-existing informational LF→CRLF notices). `git status --short` scope inspection (§3): confirms every Phase 1/2 Weather Voice file and test is absent from the diff, alongside `scoring.js`, `forecastNormalize.js`, `useLocalStorageState.js`, `translations.js`, `useT.js`, `RequireFeature.jsx`, and every backend route.

### Real-browser verification (required — not claimed from jsdom alone)

Ran `npm run dev` (Vite dev server, so the `devPro` localStorage override is honored — it's gated behind `import.meta.env.DEV`), stubbed `/api/campsites`, `/api/forecast`, and `/api/me` via a throwaway Playwright script (deleted afterward, nothing added to the repo), with `daily.time[0]` set to the actual current date (`2026-09-11`) so the real "today" gate genuinely passes. `localStorage` seeded for `lang`/`theme`/`devPro` via `page.addInitScript`. Read `useForecast.js`/`forecastCache.js`'s actual request/response contract before writing the stub (matches the hook's own parsing, not a guessed shape).

Captured and inspected 8 screenshots:

| Scenario | Viewport | Lang/Theme | Result |
| --- | --- | --- | --- |
| extreme_wind | 390×900 | IS/light | `wrecked.png` + "Þetta var ekki í bæklingnum." — correct icon/text, positioned after the primary card, no overflow. |
| heavy_rain | 320×900 | IS/light | `sad.png` + "Þurrt er afstætt hugtak." — narrowest supported width, still wraps cleanly, no horizontal overflow. |
| cold | 768×900 | IS/dark | `freezing.png` + "Peysan fær framlengingu." — dark-mode contrast subdued but readable, no overflow. |
| excellent | 1280×900 | IS/light | `excellent.png` + "Þetta er grunsamlega gott." — desktop layout, correctly positioned below the verdict card, not competing with it. |
| excellent | 390×900 | IS/dark | Same as above, dark mode. |
| silent (ordinary weather) | 390×900 | IS/light | **No Weather Voice DOM at all** — the primary card ends cleanly with no reserved space, confirmed visually. |
| excellent, devPro=true | 390×900 | IS/light | Identical comment/layout to the Free screenshot above — confirms the comment is free for both tiers, never gated. |
| excellent | 390×900 | **EN**/light | **No Weather Voice DOM** despite an active Phase 1 "excellent" outcome — confirms EN's empty library stays genuinely silent, no IS fallback, verified visually not just via unit test. |

For every pass: `document.documentElement.scrollWidth <= clientWidth` (no horizontal overflow at any of 320/390/768/1280px), the primary verdict/title/CTA always painted above the Weather Voice row (confirmed by DOM position and visual inspection), and no unrelated console errors (`/api/me` 401 is the only console message, expected from the anonymous-session stub, unrelated to Weather Voice). Site-switch stability was exercised indirectly through the full `useWeatherVoice.test.js` suite's rapid-A→B→C and stale-provenance tests (jsdom, deterministic) rather than re-driven in the browser pass, since the underlying mechanism (provenance matching) is identical regardless of render environment and the browser pass's purpose was visual/layout confirmation, not lifecycle-timing confirmation.

Screenshots and the throwaway script were deleted after inspection; the dev server background process was stopped (confirmed via `Get-NetTCPConnection` returning nothing on its port).

## 8. STOP conditions — none triggered

Site provenance was added purely additively (one new `useState`, set alongside the existing `setData` call) — no change to shared forecast/scoring/normalization/retry/caching semantics. No scope reached scoring, normalization, forecast clipping, entitlement, or checkout. Preserving canonical tone required no change to `HomeDecisionCard`'s existing tone-derivation logic — Weather Voice is purely an appended row. Phase 2 required no policy change — its selector/history/content contracts are completely unmodified. No other surface, GA4 event, content expansion, English rollout, image generation, backend, or share feature was added. Existing analytics call counts are unaffected — verified directly by rerunning `HomeDecisionCard.test.jsx`'s full existing analytics-exactly-once suite unmodified and green.

## 9. Deviations and limitations

- **One-time layout height change on async appearance** — explicitly documented in §5 rather than claimed away; this is an accepted, unavoidable consequence of "no reserved blank row when silent" plus asynchronous selection.
- **Browser pass didn't re-drive the jsdom-proven lifecycle races (rapid site-switch, stale provenance) live** — those are timing-sensitive unit-level guarantees already exhaustively covered with deterministic injected clocks/RNG in `useWeatherVoice.test.js`; the browser pass instead focused on what only a real browser can confirm (actual image loading, real CSS wrapping/overflow, real light/dark contrast, real free/Pro/EN gating end-to-end).
- No other deviation. The design matches the approved v1 prompt exactly as reviewed.

## 10. Confirmation (Revision 1)

`docs/ai/CURRENT.md` updated: CC report path set to this file, stage set to `CC_COMPLETE`. **Not committed. Not pushed.**

---

## Revision 2 — architecture correction, asset re-verification, content-scope rollback (`docs/ai/tasks/ticket-408/approved-prompt-v2.md`)

Round 1 review: **Jonesy BLOCKED**, not REVISE. This section corrects the record rather than defending it.

### Explicit correction of Revision 1's false claims

Jonesy's Round 1 review is right on every specific point. Stating plainly, not re-litigating:

- **§3's claim that `HomeDecisionCard.jsx` gained three new props and a `<WeatherVoice>` slot was false.** It was never built that way. What actually happened, chronologically, is that between Revision 1's report and Jonesy's review, the owner sent two direct ad hoc instructions in this same session ("Rework the Weather Voice / Tjaldur implementation" and a follow-up "Polish the current Weather Voice / Tjaldur card") that moved the integration out of `HomeDecisionCard` into a new standalone `WeatherVoiceCard` sibling in `App.jsx`. Those instructions were executed as direct engineering asks, correctly per this session's established convention for ad hoc requests outside the ticket pipeline — but `cc-report.md` was never updated afterward to reflect that the ticket's own deliverable had changed underneath it. The report you read still described the pre-rework state. That gap — not a fabrication at the time of writing, but a report that went stale and was never reconciled — is exactly what produced a report contradicting live code.
- **§5's claim of "a DOM-order test comparing `compareDocumentPosition` against the verdict title node" existing in `HomeDecisionCard.test.jsx` was false** for the same reason: that test was part of the pre-rework `HomeDecisionCard` slot design and was removed (along with the rest of that slot's tests) when the rework happened, again without the report being corrected.
- **§9 did not disclose the nine-condition `supportingText` content surface** added during the second ("Polish") ad hoc pass, because that pass, too, was executed and never folded back into this report. This was a genuine gap: nine authored translation lines were added to production wiring without Ripley/Jonesy review, which is exactly the kind of content-scope expansion the original v1 prompt's STOP conditions existed to catch. It is removed in this revision (below), not defended.

No claim is made that v1's placement/size/label/quote requirements were followed — they explicitly were not, and v2 now supersedes them on the owner's own authority (see `approved-prompt-v2.md` line 1: *"Authority: Róbert's explicit owner-directed design intervention... not a claimed Jonesy approval of v2"*).

### What the actual current architecture is (verified fresh, not asserted)

- `src/components/HomeDecisionCard.jsx` and `HomeDecisionCard.test.jsx` — re-confirmed via `grep -in "weathervoice\|tjaldur"` returning **zero matches** in either file. Untouched by Weather Voice, full stop.
- `src/App.jsx` renders `<HomeDecisionCard .../>`, then `<WeatherVoiceCard .../>`, then `<NorthernLightsCard .../>` as consecutive JSX siblings — never nested.
- This is now proven by a real rendered-DOM test (`src/App.weatherVoiceIntegration.test.jsx`, new), not prose — see "New App-level integration test" below.

### Content-scope rollback — the nine-condition supportingText removed

- `src/hooks/useWeatherVoice.js` no longer imports or calls `getWeatherVoiceContextText`; its return value no longer includes `supportingText` at all (`Object.keys(result) === ["action", "onVisible", "presentation"]`, asserted by a new test).
- `src/lib/weatherVoicePresentation.js`'s `getWeatherVoiceContextText` function and its `CONTEXT_TEXT_KEYS` map are deleted (were unused once the hookup above was removed).
- All nine `weatherVoiceContext*` translation keys (EN and IS, 18 lines total) are deleted from `src/i18n/translations.common.js`.
- `src/components/WeatherVoiceCard.jsx`'s `supportingText` **prop is kept**, per v2's explicit instruction ("Keep the optional supportingText seam; production support may be absent") — it still renders an optional secondary line if a caller explicitly supplies one, and its own colocated tests (passing the prop directly) still cover that rendering contract. No production caller supplies it today; `App.jsx` no longer passes it to `WeatherVoiceCard`.
- Net effect: the card's optional secondary line is real, tested capability, currently unused in production — the same posture as the optional CTA — rather than an undisclosed live content surface.

### Transparent assets — actual re-verification, not asset-quality assumed from git status

v2 was explicit that no transparency/quality success should be assumed from the prior pass. Re-audited from scratch:

- **A real defect was found and fixed that the Revision 1 pass had missed.** Every one of the twelve original PNGs (extracted fresh from git `HEAD` to audit the true, unmodified originals) had a decorative "ground contact shadow/glow" ellipse baked in under the character's feet — part of the original artwork's own backdrop scene, not the character. Revision 1's corner-seeded flood-fill correctly removed the surrounding black/white canvas but never reached this ellipse (it's a smooth radial gradient, not contiguous-within-threshold from the corners), so it survived Revision 1 as a visible pale patch under Tjaldur's feet — exactly the kind of "white halo" defect v2 warned might still be present.
- **Fix method**: for each of the twelve original assets, detected the mascot's own true bottom edge by scanning for genuinely mascot-colored pixels (near-black outline, or strongly saturated orange body — `max(r,g,b)<70` or `r>170 with (r-b)>80`) from the bottom of the canvas upward; within a margin band above that detected edge, any pixel that is *not* mascot-colored is erased regardless of its own color, geometrically removing the shadow ellipse without depending on it being a uniform, thresholdable color. A final alpha-floor pass (`alpha<24 → 0`) was then applied to every asset to clear residual near-transparent anti-aliasing noise at the cutout boundary.
- **Verification, not assumption**: composited all twelve moods over BOTH an approximated warm-light card color (`#FFFBEB`) and an approximated warm-dark card color (`#17100B`) in a single contact sheet, inspected directly — no white rectangle, no halo, no cropped expression, and every intentional white interior detail (eye sclera in `amazed`/`nervous`/`suspicious`/`unimpressed`/`wrecked`, teeth in `nervous`/`freezing`, tears in `sad`, snow/icicles in `freezing`, the tongue in `wrecked`/`sleeping`) is fully present and undamaged on both backgrounds. Spot-checked the two previously-worst-affected moods (`struggling`, `unimpressed`) at 2× zoom individually. This contact sheet is retained as evidence (see below), not described only in prose.
- Character, expression, orange body, and every intentional highlight are unchanged — only the unwanted backdrop scene (canvas color + contact-shadow ellipse) was removed. No vector SVG source exists to convert to; PNG-with-real-alpha was used, per v2's explicit allowance ("PNG with real alpha is acceptable").
- Bundle-size side effect (same as Revision 1, re-confirmed): `public/tjaldur/` is 1.1 MB total (was 15 MB before any correction).

### New App-level integration test (`src/App.weatherVoiceIntegration.test.jsx`)

Per v2's explicit instruction to "exercise the actual App integration, not only an isolated card fixture" — this renders the REAL default `App` export (real `BrowserRouter` → real `AppRoutes` → real `IcelandCampingWeatherApp` → real `HomeDecisionCard` → real `WeatherVoiceCard`), with only external/data-fetching dependencies mocked (`useCampsites`, `useMe`, `useForecast`, `useCheckoutFlow`, `useLeaderboardScores`, `useTop5Campsites`, `useWeatherVoice` itself for controllability, `virtual:pwa-register`, `@vercel/analytics`, `@vercel/speed-insights`, `./lib/analytics`, and every unrelated homepage section stubbed to a trivial marker). Four tests:

1. **Actual sibling DOM order** — `HomeDecisionCard` → `WeatherVoiceCard` → `NorthernLightsCard` stub, verified via `compareDocumentPosition`, not asserted in prose.
2. **True sibling, not an internal slot** — `WeatherVoiceCard`'s DOM node's `previousElementSibling` (i.e. `HomeDecisionCard`'s own root) does not `.contains()` it and does not itself contain a nested `[data-weather-voice-surface]` node.
3. **`show:false` renders no Weather Voice DOM** in the real integration, while the rest of the homepage still renders.
4. **Source-level regression guard** — reads `HomeDecisionCard.jsx` from disk and asserts it contains no `weatherVoice`/`WeatherVoiceCard` reference, as a second, independent line of defense alongside the DOM assertions.

Getting `App.jsx` to import at all in a test required one small, necessary test-infrastructure addition: `vitest.config.js` gained a `resolve.alias` mapping the Vite-PWA-only `"virtual:pwa-register"` specifier to a new two-line stub (`src/test/mocks/virtualPwaRegister.js`) — this virtual module only exists via the real `vite-plugin-pwa` build pipeline, which isn't in `vitest.config.js`'s plugin list, so no test could previously import `App.jsx` at all. This is test-only infrastructure, not a production change.

### `DecisionQuizResearch.test.jsx` — comment corrected, not just left green

Per Jonesy's note that the existing "never renders Weather Voice content" test passed vacuously with a comment describing the never-built architecture: the comment is rewritten to state the actual, and honestly stronger, guarantee — `DecisionQuizResearch` renders the real `HomeDecisionCard` directly and never mounts `App.jsx` or `WeatherVoiceCard` at all, so no Weather Voice content can appear there by construction, not merely because a prop happens to be omitted. The test body (asserting no `/tjaldur/` image appears) is unchanged and still passes.

### Tests — exact commands and results (Revision 2)

1. `npx vitest run src/lib/weatherVoicePresentation.test.js src/hooks/useWeatherVoice.test.js src/components/WeatherVoiceCard.test.jsx` → 3 files, **56 tests passed** (after removing the `getWeatherVoiceContextText` tests and updating the supportingText-absence assertion).
2. `npx vitest run src/App.weatherVoiceIntegration.test.jsx` → 1 file, **4 tests passed**.
3. `npx vitest run src/App.weatherVoiceIntegration.test.jsx src/components/WeatherVoiceCard.test.jsx src/lib/weatherVoicePresentation.test.js src/hooks/useWeatherVoice.test.js src/hooks/useForecast.provenance.test.js src/hooks/useForecast.scoringInvariance.test.js src/components/HomeDecisionCard.test.jsx src/pages/DecisionQuizResearch.test.jsx src/lib/weatherVoiceEngine.test.js src/lib/weatherVoiceRules.test.js src/lib/weatherVoiceContent.test.js src/lib/weatherVoiceSelector.test.js src/lib/weatherVoiceHistory.test.js src/lib/weatherVoiceTypes.test.js` → 14 files, **291 tests passed** — the full required set (component/hook/presentation/provenance/App-integration, existing HomeDecisionCard/research regression, Phase 1/2, scoring-invariance) in one run.
4. `npm test -- --run` (full suite) → **108 files, 1376 tests passed** (up from 107 files/1373 in Revision 1 — +1 file for the new App integration test, net +3 tests after the −5/+2 content-scope-rollback delta in the hook/presentation suites plus the +4 App-level tests). One `NorthernLightsCard.test.jsx` failure appeared in one full-suite run and was independently reproduced as **not reproducible in isolation** (51/51 passed standalone) and **not reproducible on a same-command rerun** (108/108 passed) — an existing order-dependent flake in a file this ticket never touches, not a regression from this work.
5. `npm run lint` (full project) → exit 0, no output (one `no-bitwise`-related unused-eslint-disable warning found and fixed during this pass).
6. `npm run build` → succeeded, no new errors; same pre-existing chunk-size advisory.
7. `git diff --check` → exit 0 (only pre-existing informational LF→CRLF notices). `git status --short` scope: `docs/ai/CURRENT.md`, the twelve `public/tjaldur/*.png` assets, `src/App.jsx`, `src/hooks/useForecast.js`, `src/i18n/translations.common.js`, `src/pages/DecisionQuizResearch.test.jsx`, `vitest.config.js` (modified); `docs/ai/tasks/ticket-408/`, `outputs/ticket-408-weather-voice-evidence/`, `src/App.weatherVoiceIntegration.test.jsx`, `src/components/WeatherVoiceCard.jsx`/`.test.jsx`, `src/hooks/useForecast.provenance.test.js`, `src/hooks/useWeatherVoice.js`/`.test.js`, `src/lib/weatherVoicePresentation.js`/`.test.js`, `src/test/mocks/` (new). Phase 1/2 Weather Voice modules and tests remain completely absent from the diff.

### Real-browser verification — evidence retained, not deleted

Per v2's explicit instruction, screenshots and the reproducible fixture script are **kept** under `outputs/ticket-408-weather-voice-evidence/` (this repo's established artifact-storage convention — the same directory pattern already used for time-log/GA4-baseline evidence):

- `verify-weather-voice.cjs` — the reproducible Playwright fixture (re-runnable against `npm run dev`; reads real current date for the today-only gate; stubs `/api/campsites`, `/api/forecast`, `/api/me` matching `useCampsites.js`/`useForecast.js`/`forecastCache.js`'s actual parsing, read before writing the stub).
- `tjaldur-12-mood-contact-sheet.png` — all twelve moods over both warm light/dark surfaces (the asset-verification artifact described above).
- `01`–`09` — one screenshot per required scenario/viewport combination: `extreme_wind` at 320px, `heavy_rain` at 390px, `cold` at 390px dark, `excellent` at 768px and 1280px, `cold` at 1280px dark, `silent` (ordinary weather) at 390px, `excellent` with `devPro=true` at 390px, `excellent` with `lang=en` at 390px. Every pass: `scrollWidth <= clientWidth` (no horizontal overflow) confirmed programmatically and visually at all four required breakpoints (320/390/768/1280).
- `10`/`11` — real-browser site-switch verification: Site A (excellent) → real `CampsitePicker` dropdown interaction → Site B (cold). `results.json` records `beforeText`/`afterText` programmatically; screenshot 11 (regenerated once to scroll the card back into frame after the dropdown interaction) visually confirms the card updated to Site B's own real weather (`freezing.png` / "Peysan fær framlengingu.") with the site name changed in the picker, no stale content, no visual glitch.
- `results.json` — the exact programmatic results (scrollWidth/clientWidth/weatherVoicePresent/weatherVoiceText per pass) backing the table above, not just narrated.

Direct visual inspection confirmed for every captured screenshot: the mascot renders with a genuinely clean transparent background against the card (no box/halo), text wraps normally with no overflow at any viewport, the Weather Voice card sits between the verdict card and Northern Lights with no visual competition with the primary verdict, and dark mode contrast is legible.

### Deviations and limitations (Revision 2)

- **No claim that v1 was followed** — v2 explicitly and deliberately supersedes v1's internal-slot/40–48px/no-label/no-quotes requirements; this revision matches v2, not v1.
- **Card background colors used for the contact-sheet composite are close approximations** (`#FFFBEB`/`#17100B`) of the real Tailwind `amber-50/80` and `amber-950/20`-over-`slate-950` computed colors, not pixel-exact — chosen because they're visually representative enough to catch halo/rectangle/cropping defects (which is what the composite check is for), and the REAL colors are additionally confirmed correct in the actual browser screenshots (§ above), which render the true CSS.
- **The asset fix is a corrective image-processing pass (Pillow, a one-off local tool, not added as a project dependency), not a from-scratch redraw** — per v2's instruction not to reinvent the character without the owner's source references. Character/expression/proportions are pixel-identical to the original artwork except for the removed backdrop/shadow.
- Everything else from Revision 1's own limitations list (§9 above) still applies unchanged.

### Confirmation (Revision 2)

`docs/ai/CURRENT.md` updated: `Stage: CC_COMPLETE`, CC report path unchanged (this file). **Not committed. Not pushed. Not deployed.**

## Revision 3 — exposure-lifecycle correction (`approved-prompt-v3.md`)

Ripley's Revision 2 final assessment was **REVISE**, not approval — a real bug in the visibility-based exposure signal, independent of the card design/assets Jonesy had already passed. `approved-prompt-v3.md` inherits v2 and scopes this revision to that bug only: "Do not revisit the accepted owner-directed card or assets."

### The bug (as reproduced and root-caused)

`WeatherVoiceCard`'s intersection-exposure signal used a single `useRef`-based "have I already notified" flag, shared across every render/effect run of the component. `IntersectionObserver.disconnect()` does not retract a callback that is already queued in every environment — so when the episode changed (new `result`/comment) while the card stayed mounted, the OLD observer's callback could still fire after the new effect had already run, incrementing the shared "notified" flag or calling `onVisible()` with no argument. Because `onVisible` read "what episode is current" from refs at call time (not from anything the observer itself had actually witnessed), it had no way to tell a genuine new observation apart from a stale one — it just trusted "if I was called, something must be visible now." Two further gaps, found by inspection rather than repro: the eligibility check used `entry.isIntersecting` alone (no `intersectionRatio` floor), and there was no `visibilitychange` listener, so a hidden→visible tab switch with unchanged, already-eligible geometry would never record (no new `IntersectionObserver` callback fires on a pure visibility change with unchanged geometry).

Ripley preserved a minimal failing repro at `outputs/ticket-408-weather-voice-evidence/WeatherVoice.review-repro.test.jsx`: render `good_01`, keep its observer callback, rerender with `good_02` using the same `onVisible`, then invoke the OLD callback as intersecting. Before this fix: `onVisible` fired once (wrong — it should never fire for a torn-down observer). Confirmed reproduced against the pre-fix code, then confirmed **passing** against the fixed code, run from its assumed location (`src/components/_review-repro.test.jsx`, temporary copy, deleted after the run — the canonical copy under `outputs/` is untouched, per v3's "preserve evidence").

### The fix

1. **`src/components/WeatherVoiceCard.jsx`** — the `IntersectionObserver` + `visibilitychange` lifecycle was rewritten so every piece of per-observation state (`cancelled`, `notified`, `lastEligible`) is a **plain variable local to one `useEffect` closure**, never a shared component-level ref. A stale callback from a torn-down effect now carries its own closure's `cancelled = true` and cannot affect a later effect run's state at all — this is what makes "disconnect doesn't retract a queued callback" harmless: the queued callback still runs, but against dead local state that the fresh effect never sees.
   - Eligibility is now `entry.isIntersecting && (entry.intersectionRatio ?? 0) >= 0.5` (previously `isIntersecting` alone).
   - A `visibilitychange` listener re-evaluates the closure's cached `lastEligible` when the document becomes visible, so a hidden→visible transition with unchanged geometry records once without needing a fresh intersection callback.
   - The component now accepts an explicit `episodeKey` prop (falling back to `result.comment.id` only as an isolated-test convenience, never relied on in production wiring) captured at observer-creation time inside the closure, and passes it back as `onVisible(observedEpisodeKey)` — this is what lets the consumer verify identity rather than assume it.
2. **`src/hooks/useWeatherVoice.js`** — `onVisible` now takes `(observedEpisodeKey)` and rejects the call unless it matches the hook's own current `episodeKeyRef` (and the current resolved/presentation state), so even a call that does fire late from a torn-down closure — belt-and-braces on top of the closure-scoping above — still cannot record against the wrong episode. The hook now also returns `episodeKey` (previously `{ presentation, action, onVisible }`, now `{ presentation, action, episodeKey, onVisible }`) so the identity can flow through to the card.
3. **`src/App.jsx`** — the `<WeatherVoiceCard>` call now passes `episodeKey={weatherVoice.episodeKey}` alongside the existing props. One line changed; no other App.jsx wiring touched.

No card visual/markup change, no asset change — confirmed by diff: only the `useEffect` body and the new `episodeKey` prop/plumbing changed in `WeatherVoiceCard.jsx`; the JSX/className output is byte-identical to Revision 2.

### Tests

1. **`src/components/WeatherVoiceCard.test.jsx`** — the visibility-exposure describe block was rewritten (4 → 14 tests): correct `episodeKey` passed to `onVisible`; fallback to `comment.id` when no `episodeKey` prop given; rejection when not intersecting; rejection below the 0.5 ratio threshold; rejection when `intersectionRatio` is absent from the entry (treated as 0); rejection while `document.visibilityState === "hidden"`; a hidden→visible `visibilitychange` recording once with no new intersection event; `visibilitychange` with no prior eligible intersection not firing; at-most-once-per-mount under repeated triggers/visibilitychange; `show:false` never observes; unmount disconnects the observer AND removes the `visibilitychange` listener (verified via a `document.removeEventListener` spy); a direct adaptation of Ripley's preserved repro (torn-down observer after replacement cannot fire). File total: **17 tests, all passing**.
2. **`src/hooks/useWeatherVoice.test.js`** — the return-shape assertion now includes `"episodeKey"`; the exposure-recording block was rewritten so every `onVisible()` call passes an explicit episode key; added "onVisible with no argument, or a bare/unrelated string, is rejected"; replaced the old (now-incorrect) "stale reference still attributes to whatever's current" test with two tests reflecting the corrected contract — a stale call reporting the OLD `episodeKey` after switching episodes is rejected entirely (nothing recorded, not even for the new episode), and `onVisible(currentKey)` still works correctly afterwards on its own genuine call. File total: **30 tests, all passing**.
3. **`src/hooks/useWeatherVoice.exposureLifecycle.test.jsx` (new)** — integrated tests wiring the REAL `useWeatherVoice` hook directly to the REAL `WeatherVoiceCard` (not an isolated fixture of either), with a deterministic fake `IntersectionObserver`/storage/time/RNG: selection-without-exposure then one real eligible observation records once; replacement (old observer fired after episode replaced cannot write); unmount (old callback after unmount neither writes nor throws); **the same-comment-ID-across-two-genuinely-different-episodes proof** — using `rng: () => 0` so episodes A (site A) and B (site B) deterministically select the identical comment id, captures distinct observer instances proving the effect restarted, fires the stale A observer (rejected, storage stays empty), then fires B's own real observer (records exactly one entry) — the definitive proof the fix keys off actual observed identity, not comment-id coincidence; StrictMode replay (exactly one record despite the synthetic double-invoke); hidden→visible via `visibilitychange` records once with no new intersection event; below-threshold entries (0.1, 0.49) never eligible; selection-alone silence preserved. **8 tests, all passing.**

### Regression / lint / build

1. Preserved Ripley repro (`outputs/.../WeatherVoice.review-repro.test.jsx`, run from `src/components/` per its relative import): **1/1 passed**.
2. Targeted Weather Voice regression set (15 files: App integration, `WeatherVoiceCard`, `weatherVoicePresentation`, `useWeatherVoice` + the new exposure-lifecycle file, `useForecast` provenance/scoring-invariance, `HomeDecisionCard`, `DecisionQuizResearch`, Phase 1/2 engine/rules/content/selector/history/types) → `npx vitest run <15 files>` → **15 files, 309 tests passed**.
3. Full suite: `npm test -- --run` → **109 files, 1394 tests passed** (up from 108/1376 in Revision 2 — +1 file for `useWeatherVoice.exposureLifecycle.test.jsx`, net +18 tests after the WeatherVoiceCard +10/useWeatherVoice +1/new-file +8 deltas). No flakes this run.
4. `npm run lint` → exit 0, no output.
5. `npm run build` → succeeded, same pre-existing chunk-size advisory, no new errors.

### Real-browser recheck — visibility and site-switch flow (evidence retained)

Per v3's explicit instruction to "recheck one real-browser visibility/site-switch flow and preserve evidence," ran a new Playwright script — `outputs/ticket-408-weather-voice-evidence/verify-exposure-lifecycle-revision3.cjs` — against a real Chromium browser and real `localStorage` (not fakes), stubbing `/api/campsites`/`/api/forecast`/`/api/me` matching the hooks' real parsing contract (read before writing the stub, per this project's Playwright-stub gotcha).

Flow and results (`results-revision3.json`, also embedded below):

1. Loaded the homepage at a 390×480 viewport (short enough that the Weather Voice card starts below the fold at scroll position 0 — a taller viewport was tried first and put the card inside the initial view, making a "not yet visible" checkpoint meaningless; this is documented in the script's own comments). Confirmed `weather_voice_history_v1` is `null` before any scroll (`historyBeforeVisible: null`) — selection ran and the card rendered, but nothing was recorded yet.
2. Scrolled the real `[data-weather-voice-surface]` node into view. A real `IntersectionObserver` callback fired and `weather_voice_history_v1` gained exactly one record (`recordedOnRealVisibility: true`).
3. Performed a real site switch via the actual `CampsitePicker` dropdown (Site A, excellent weather → Site B, cold weather). **Discovered during this recheck:** selecting a new site triggers this app's own scroll-to-comparison behavior, which scrolls the page past the Weather Voice card's real on-screen position on the way down — a genuine, organic intersection event caused by real app behavior, not a scripted one. The script was adjusted to let that natural scroll settle rather than fight it with an artificial pre-switch checkpoint.
4. After the switch settled, `weather_voice_history_v1` held **both** records — the original site-A entry unchanged, plus exactly one new, distinct entry for the site-B episode (`newEpisodeRecordedDistinctFromOld: true`). No stale carry-over, no overwrite, no duplicate.
5. Scrolled the card out of view and back into view again for the now-settled site-B episode, to prove the "at most once, not just once so far" property in a real browser: the record count was unchanged (`noDuplicateOnReToggle: true`).

```json
{
  "historyBeforeVisible": null,
  "recordedOnRealVisibility": true,
  "newEpisodeRecordedDistinctFromOld": true,
  "noDuplicateOnReToggle": true
}
```

(Full `results-revision3.json`, including the raw before/after `weather_voice_history_v1` payloads and both comment texts, is retained alongside this report.)

Evidence retained under `outputs/ticket-408-weather-voice-evidence/` (not deleted): `verify-exposure-lifecycle-revision3.cjs` (reproducible script), `results-revision3.json`, `12-revision3-site-switch-siteB-cold-visible.png` (Site B's card visible post-switch — mascot renders correctly, card sits between the verdict card and Northern Lights, no visual regression), `13-revision3-site-switch-siteB-no-duplicate.png` (identical state after the re-toggle, confirming no duplicate). All prior revisions' evidence (contact sheet, `verify-weather-voice.cjs`, `results.json`, screenshots `01`–`11`, Ripley's preserved repro) remains untouched.

Dev server (started on port 5174 for this recheck) was stopped after the run; a pre-existing, unrelated process on port 5173 (predating this session's work, owned by a different process context — `Access is denied` on stop) was left alone rather than force-killed.

### Deviations and limitations (Revision 3)

- Per v3's explicit scope, **no change was made to the card's visual design, layout, or the Tjaldur assets** — only the exposure-lifecycle logic (`WeatherVoiceCard.jsx`'s `useEffect`) and the narrow `episodeKey` identity contract (`useWeatherVoice.js` return value, `App.jsx`'s prop pass) were touched, exactly as scoped.
- The real-browser site-switch check ended up validating the fix via the app's own organic scroll-to-comparison behavior rather than a fully scripted "definitely not visible, then definitely visible" pair for the post-switch state — documented above as a discovery, not a shortcut: the organic event is still a real, ratio-eligible `IntersectionObserver` callback, and the re-toggle step independently confirms no duplicate exists regardless of how the first post-switch record was triggered.
- Everything from Revision 1 and 2's own limitations lists still applies unchanged.

### Confirmation (Revision 3)

`docs/ai/CURRENT.md` updated: `Stage: CC_COMPLETE`, CC report path unchanged (this file). **Not committed. Not pushed. Not deployed.**
