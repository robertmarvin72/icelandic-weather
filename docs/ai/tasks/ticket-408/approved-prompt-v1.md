# Ticket 408 — Approved implementation prompt v1

Approved by Jonesy in Round 1.

Execution requires Róbert's `Prompt approved` instruction and CURRENT.md referencing this file at READY_FOR_CC.

Issue #408: Phase 3 — Weather Voice UI integration. Parent #404; builds on completed #405 and #406. #407 was inspected but never activated because its title and copied Phase 2 description conflicted. #408 supplies the actual UI scope. CURRENT was #406 CLOSED and the working tree clean at this audit.

### Audited findings and approved decisions

- `App.jsx` owns the selected `site`, calls `useForecast(site?.lat, site?.lon)`, and passes its normalized rows (with day labels) to the production `HomeDecisionCard`. Do not use leaderboard candidates, comparison aggregates or another campsite's forecast for Tjaldur.
- `HomeDecisionCard.jsx` derives canonical display tone internally; comparison direction can override raw move/consider to stay. It also contains existing rough-weather checks, primary CTA and analytics. Preserve all existing derivation and event semantics. Weather Voice is an appended secondary row, not another verdict.
- The same HomeDecisionCard renders on `DecisionQuizResearch.jsx` with frozen fixtures and analytics disabled. Integration must be opt-in from the homepage, not automatically activated by every instance of the component. Research must perform no Weather Voice selection or history access.
- `useForecast` keeps previous data while fetching another location and currently exposes no identity of the request that produced its rows. `loading` alone is insufficient: the first render after coordinates change can still have previous rows and previous loading=false before effects run. Explicit request provenance is necessary to prevent wrong-site text/exposure. See the narrowly scoped additive metadata allowance below; do not repair existing consumers' loading behavior.
- #405 uses daily `{tmax,windMax,rain,code}` with raw provider code, not presentation `summaryCode`. Normalized wind/rain may be time-weighted. #406 exposes pure selection and a separate guarded history adapter; record only actual displayed content, never preselection. All 27 current entries have CTA=null; EN is empty and must stay silent without IS fallback.
- The owner's actual canonical assets are twelve **PNG** files in `public/tjaldur/`, despite the issue saying SVG. Use those PNGs unchanged, not invented SVG paths or conversions.

### Execution prerequisites and scope

You are Claude Code. Execute only an approved prompt referenced by CURRENT at READY_FOR_CC after Róbert says `Prompt approved`; follow README's required CC_IN_PROGRESS/report/CC_COMPLETE transitions. Read AGENTS.md, CLAUDE.md, docs/ai/README.md, CURRENT, issue #408, #405/#406 contracts and final reviews, all Weather Voice modules/tests, App.jsx, useForecast and scoring-invariance tests, HomeDecisionCard/tests, research call sites/tests, comparison tone rules, current navigation callbacks and hazard presentation. Record the pre-edit flow and input provenance in cc-report.md before writing code. No commit/push.

Use .jsx/.js and JSDoc, existing React/Tailwind/test tooling, extensionless imports, no new libraries. Suggested new files: `src/components/WeatherVoice.jsx`, `src/hooks/useWeatherVoice.js`, and small pure `src/lib/weatherVoicePresentation.js`/CTA helpers if useful. Do not relocate existing Phase 1/2 files.

### 1. One homepage integration with correct daily input

Provide a presentational WeatherVoice component taking a resolved result, `surface="homepage_decision"`, optional resolved action and an exposure callback. It must never interpret weather, select text or touch storage. HomeDecisionCard receives an optional presentation slot/props defaulting absent; only App's homepage call site enables it. The research route and every other surface remain unaffected.

For this MVP explicitly use **today's normalized row at the selected campsite**, matching a YYYY-MM-DD date derived in Atlantic/Reykjavik, not blindly rows[0] and not a multi-day average. Require a matching row; do not silently substitute tomorrow if today's missing. No “right now” or all-week label: this is a daily comment. #405's exact fields and raw `row.code` pass unchanged to evaluateWeatherVoice, then #406's library/selector.

Allow a narrow additive `useForecast` response-provenance field that identifies the requested coordinates associated with the returned data/rows. Capture that identity in the same state update as the successful payload, including cached responses. Compare request coordinates, not the provider's rounded grid coordinates. Preserve existing returned fields, payload, normalization, scoring, retries and caching behavior byte-for-byte in meaning. Do not clear or tier-clip existing data or alter existing consumers. Tests must prove the metadata matches its payload under rapid A->B->C switching, stale responses and retry/failure. If provenance cannot be added without changing shared forecast/scoring semantics, STOP before expanding scope.

The homepage adapter requires current site identity AND matching forecast provenance, successful nonloading/nonerror state, today's valid row and an active homepage before selection/exposure. On site/date/language change or invalid/loading data, synchronously hide an old keyed result so even the first render cannot show/record yesterday's or another site's comment. Do not fetch separately or create another normalizer for Weather Voice. Refresh midnight eligibility with a cleaned-up timer or equivalent lifecycle boundary; tests use an injected/fake clock. App's other routes must not continue selecting/recording hidden content.

### 2. Stable client selection and real exposure

Keep a stable history-adapter instance for the mounted homepage session. Selection is client-side after valid data/provenance is ready. No Math.random, Date.now or storage effects during render, SSR rendering or useMemo; no browser reads at module import. Initial server/client output is consistently silent. Inject RNG/time/storage seams for deterministic tests.

Define a stable episode key from surface, site identity, date, language and Phase 1 condition/mood/severity. Preserve the selected comment for that episode across object-identity-only row updates, unrelated rerenders, theme/tier changes, polling with the same engine outcome and React StrictMode effect replay. Do not use cooldown-history changes as a reselection dependency. A new episode may select again. A temporary loading state may hide the row but must not rotate the same episode when it returns. Keep any episode cache bounded to the mounted lifecycle/current episode; no new persisted content cache.

Record through #406's `recordShown` only after a valid row is committed and actually visible in the viewport on an active document. Use a guarded IntersectionObserver/visibility approach with cleanup (or equally testable visibility signal); no write when merely calculated, hidden, offscreen, suppressed, stale, on another route, or show:false. Deduplicate per episode within this mount, including StrictMode replay and hide/reveal of the same episode. Avoid a write for a stale callback after site/language/result change. Returning after a true unmount is a new session and may use cooldown to select anew. Do not change selector/cooldown policy to solve lifecycle problems; if a real Phase 2 bug is found, document it and STOP for scoped review.

### 3. Rendering, assets and hierarchy

Map all twelve mood strings explicitly to `/tjaldur/<mood>.png` using the actual files. Never infer mood from severity/condition in UI. Unknown/unsupported mood or invalid result must render nothing rather than a guessed mascot. `show:false` returns null with no margin, wrapper or empty CTA slot.

Place the compact row **after the existing verdict, body, candidate details and primary actions**, inside the homepage card. Keep existing warnings/rough-weather language above it and unchanged; do not introduce a new warning system or use mascot color as an official hazard scale. Use small fixed image dimensions (roughly 40–48 CSS px), object-contain, min-width-safe wrapping and subdued text suitable for light/dark mode. No animation, mascot banner, added quotation marks, “Tjaldur says” heading or branded label. Use decorative `alt=""` and aria-hidden image; keep comment text readable in normal document flow, no unnecessary live region.

Fixed image dimensions must prevent asset-load shift. Do not insert Weather Voice above the primary verdict/CTA. No reserved blank row when silent; asynchronous appearance below primary content may increase card height, but must not cause repeated selection/layout flicker. Be explicit in the report about that unavoidable one-time height change rather than claiming zero layout movement while also requiring no placeholder.

### 4. Optional CTA seam without new business rules

Production MVP comments remain CTA=null: do not edit #406 metadata to manufacture live CTAs. Still implement and test the optional CTA capability required by #408. The pure renderer accepts an already-resolved accessible button/action (label + callback); a separate mapping helper takes result.ctaType plus caller-supplied canonical action availability. Render a CTA only when both metadata and a usable context action exist, never an empty container or generic Pro upsell.

Mapping labels must be new/existing flat EN/IS translation keys through useT, not in structured comment libraries. Wording describes exploration (“Bera saman aðstæður” or the relevant calm/dry/warm search), not a promise a better site exists. An unavailable action or unknown CTA type yields no button, not a guessed destination. Reuse the existing comparison/navigation callback where legitimately available; no route strings in content, no new entitlement checks. Test with synthetic CTA-bearing presentations/context. Do not route a Weather Voice click through an existing analytics-tracking handler if that would fabricate a primary-CTA analytics event; share the underlying navigation action without changing existing handler behavior. All null-CTA production behavior remains unchanged.

The comment itself is free for Free and Pro with equal input data, never wrapped in RequireFeature. Existing downstream feature entitlement remains the owner of any action destination. Canonical stay/consider/move tone and all original primary CTA copy/actions/events must remain unchanged. If existing navigation cannot support a particular semantic CTA, leave that action unavailable; do not invent search filters.

### Tests and visual verification

- Component: exact selected comment, all twelve asset paths exist, wrecked path correct, decorative image semantics, show:false/unknown mood no DOM/space, null CTA no container, valid metadata+resolved callback keyboard-operable, unavailable/unknown action absent. No weather logic in renderer.
- Hook/integration: real Phase 1/2 outputs, ordinary silence, empty EN without IS fallback, missing today's row, loading/error and stale provenance; rapid A->B->C, older response arriving last, cached response and first-render-after-site-change all exclude wrong-site content/exposure. No new forecast request or scoring input change.
- Stability: StrictMode, same-valued new row objects, unrelated rerender/theme/tier update, unchanged outcome refresh and temporary loading do not rotate or duplicate exposure. Site/date/language/outcome changes start a new keyed episode. Midnight refresh behaves correctly with fake time.
- Exposure: selection without display never writes; offscreen/hidden document/suppressed/research/other route never writes; visible current committed episode writes once; stale observer callback cannot record an old episode; storage getter/read/write failure remains nonfatal. Use deterministic RNG, mocked observers and injected fake storage.
- Regression: existing HomeDecisionCard canonical tone/CTA/analytics tests and DecisionQuizResearch/scenario tests, Phase 1/2 suites, useForecast scoring invariance. Add targeted provenance tests without weakening current contracts. Run targeted lint and production build; report exact results.
- Browser verification on the actual homepage with deterministic intercepted API fixtures at 320, 390, 768 and 1280px, light/dark: extreme_wind, heavy_rain, cold, excellent and show:false; Free/Pro and EN silence. Verify image loading, wrapping, no horizontal overflow, primary content priority and stability during site switch. Read useForecast/endpoint parsing before creating stubs. Use current Playwright tooling; test fixtures are sufficient debug support, no production debug UI or new route. Capture and inspect screenshots, record artifact paths and measured limitations. Do not claim visual QA from jsdom alone.

### STOP and handoff

STOP if correct site provenance requires changes beyond additive request metadata, if scope reaches scoring/normalization/forecast clipping/entitlement/checkout, if preserving canonical tone requires a competing verdict, or if Phase 2 requires policy changes. Do not add other surfaces, GA4 events, content expansion/English rollout, image generation, backend or share features. Existing analytics must not fire extra events due to new callbacks/effects.

Acceptance requires one opt-in homepage surface, truthful same-site daily input, reusable pure renderer, stable selection/visibility-based exposure, correct PNG mapping, optional resolved CTA support, free comment access, preserved primary/warning hierarchy, passing targeted/regression tests and inspected responsive screenshots. Append audit, changed files, exact data/lifecycle/CTA decisions, commands/results, screenshot evidence and limitations to `docs/ai/tasks/ticket-408/cc-report.md`. Populate CURRENT's report field and set CC_COMPLETE only after implementation and validation. No commit or push.
