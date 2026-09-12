# Ticket 412 — Approved prompt v1

Approved by Jonesy in Initial prompt, Round 1. Execute only after the owner's Prompt approved handoff, with CURRENT.md at READY_FOR_CC and referencing this file. Follow docs/ai/README.md: set CC_IN_PROGRESS before implementation, append the report and set CC_COMPLETE. This file remains immutable.

Ripley checked the raw issue and owner comment during preparation: the issue explicitly permits clear fallback/dev handling and forbids silent disappearance. The approved exceptional empty-pool handling below uses development diagnostics and failing completeness validation, with complete EN coverage required for release; it does not authorize a fabricated visible fallback. Jonesy's stated source-access limitation therefore does not require a scope revision.

Sources read:
- https://github.com/robertmarvin72/icelandic-weather/issues/412 (OPEN): EN parity, same engine/condition/mood/assets, missing-translation handling, no redesign or engine changes.
- Owner comment https://github.com/robertmarvin72/icelandic-weather/issues/412#issuecomment-5647400203: audit mobile visibility, responsive/locale guards, clipping and collapsed image size; require IS/EN x desktop/mobile parity.

The comment is incorporated into this task's scope; no GitHub body edit is necessary to resolve a conflict. This prompt combines both sources.

### Read-only audit and known root cause

Read AGENTS.md, CLAUDE.md, docs/ai/README.md, CURRENT.md and docs/weather-voice/character-and-voice-bible.md first. Read the live hook, engine, selector, metadata, language libraries, history, card, App placement, translation wiring and relevant tests. Preserve #408's approved standalone warm card and exposure fixes.

Verified before prompt drafting:
- src/i18n/weatherVoice/en.js exports an empty supported array. IS has 27 registered entries. getWeatherVoiceLibrary(en) returns []; selectWeatherVoiceComment rejects an empty library with show:false. This is the verified EN disappearance mechanism, not evidence of a locale render guard.
- useWeatherVoice calls one language-independent engine on today's provenance-checked normalized row. Language enters the episode key and library lookup, not engine classification. Episode identity is also required for exposure recording.
- WeatherVoiceCard renders an active result with a valid mood asset and string text. Its root is flex, image h-20/w-20 with md:100px and shrink-0; no mobile hidden class exists in the component inspected. App renders a single standalone card. Mobile absence remains a reported symptom, not a proven CSS root cause.

Audit the actual ancestor layout, locale switching, data availability/loading/provenance, enabled prop and route entrypoints. Check hidden/md:block, block/md:hidden, display:none, zero dimensions, overflow/height clipping and desktop-only placement. Distinguish a card below the fold or correctly silent weather from unintended suppression. Do not remove data validity guards or change weather merely to force visibility.

### Required implementation

1. Supply natural EN adaptations for exactly the 27 existing IS comment IDs. No new IDs, joke concepts, 100-comment expansion, IS rewrites, mood/condition/metadata/CTA/cooldown changes. Shared metadata stays the single source of truth. Follow #413's dry, terse, weather-directed character; EN must preserve meaning and caution, not intensify/minimize the source. Include an ID/IS/EN table in the CC report for explicit content review.
2. Preserve engine show/condition/mood/severity for identical valid data across IS/EN and viewport sizes. Show the same asset and localized text in all four combinations when the engine is active and content is valid. No duplicate desktop/mobile components, no locale-only render guard. Legitimate engine silence, loading/error/provenance suppression and unsupported locales remain intentional.
3. IS -> EN -> IS must settle to visible localized content without permanent suppression for unchanged active weather. Preserve locale-aware episode identity, no stale-language flash, StrictMode selection stability and observer cancellation/key validation. Do not remove lang from the episode key as a shortcut. The same comment ID across languages is not required by this issue; existing shared-ID cooldown behavior may select another eligible line, but condition/mood/assets must agree. Do not rewrite selection/history policy to force exact-text continuity.
4. Missing-translation policy: ship complete ID parity and automated validation that fails when an EN ID is missing, blank or duplicated (report the ID and language). At runtime, incomplete EN content must not produce a blank card: ignore invalid translated entries and use another valid EN entry for the same canonical condition/mood/severity through the existing selector. Add bounded development-only diagnostics identifying missing IDs/language, without user data, analytics, network calls or render-loop spam. Keep the engine/selector pure; place diagnostics at an appropriate content/integration boundary.
5. If an entire eligible EN pool is unavailable, there is no authorized English text to show: fail closed with a clear development diagnostic and failing content validation, not an Icelandic fallback, fabricated generic joke, untranslated key or retained stale text. This is the explicit exceptional handling for missing translations, not silent success. Normal shipped EN must cover every currently reachable condition. Jonesy: if the issue's missing-translation acceptance is read as requiring a visible production fallback even for a wholly absent pool, return REVISE for a concrete content-policy decision rather than inventing a new line during implementation.
6. Reproduce the mobile report with the same deterministic weather/site/day and content as desktop. If responsive suppression is confirmed, make only the narrow rendering/layout fix required. If not reproduced, document that finding and retain evidence of IS/EN mobile visibility; do not manufacture a CSS change. Keep mascot/comment legible at 320px and 390px and preserve 80px mobile/100px desktop asset sizing unless a demonstrated defect requires a minimal adjustment. No UI redesign or asset edit.

### #413 safety boundary

This ticket translates existing content and fixes locale/viewport parity; it does not choose an authoritative danger classifier, map severity=3 to DANGEROUS, implement weatherSafetyMessages or claim production safety enforcement. Existing safety-routing/compliance gaps from #413 remain explicitly recorded. Adaptations must not add safety guarantees or new operational advice. Review all 27 pairs contextually, especially extreme_wind/heavy_rain. If a faithful adaptation cannot satisfy the Bible without changing existing IS policy, classification or safety routing, STOP and identify the exact IDs/conflict; do not silently expand scope. Jonesy's prompt approval must explicitly assess whether this translation-only boundary is consistent with #413 before execution.

### Constraints

Expected changes: EN library, narrow content validation/diagnostic handling, relevant tests, and only demonstrated hook/card/App visibility fixes. Update stale source comments claiming EN is intentionally empty. Preserve historical approved prompts/reviews; #413's dated audit remains historical rather than being rewritten as if EN existed then. No scoring, thresholds, weather rules, forecast normalization/provenance, entitlement/Free-Pro, checkout, analytics, Northern Lights, assets or dependencies. No new backend, TypeScript, routes or libraries. No commit/push/deploy/issue closure.

STOP for work beyond these boundaries, missing authoritative data-flow understanding, or a fix requiring removed provenance/exposure safeguards. Reversible implementation choices within the agreed scope need no extra permission.

### Verification and handoff

- Add targeted tests for 27-ID IS/EN parity and valid text; same metadata; missing/blank/duplicate EN diagnostics; partial-pool English recovery; wholly absent eligible pool's explicit failure handling; unsupported locale unchanged.
- Real hook/card integration: IS -> EN -> IS for identical weather, stable condition/mood/asset, localized text and legitimate silence. Exercise stale callbacks across language changes so new content is never credited by an old observer; selection alone never writes history. Preserve #408's exposure-lifecycle tests.
- Run Weather Voice engine/rules/content/selector/history/types/presentation/hook/card/App integration and provenance/scoring-invariance regressions. Update obsolete empty-EN expectations only to test the new intended behavior; keep missing-content/unsupported-language tests using fixtures. Run lint/build and diff whitespace checks with documented handling of pre-existing line endings.
- Browser proof with real App/hook/card at desktop ~1280px and mobile 320px/390px in IS and EN, plus IS -> EN -> IS in one session; include supported light/dark themes and at least one intentionally silent weather case. Read useForecast parsing contract before stubbing and use today's Reykjavik date. Confirm actual DOM visibility, nonzero image dimensions, no clipping/overflow, correct same mood asset and real English text. Scroll to the card when needed; below-fold is not absence. Retain reproducible script/procedure and screenshots under outputs/ticket-412-weather-voice-locale-evidence/. Do not merely mock the presentation prop and call it EN end-to-end coverage.
- Report verified root causes separately for EN and mobile, exact changed files, 27 bilingual pairs, missing-content policy, actual test commands/results, browser evidence and unresolved safety limitations in docs/ai/tasks/ticket-412/cc-report.md.

After approval and owner handoff, follow CURRENT READY_FOR_CC -> CC_IN_PROGRESS -> CC_COMPLETE and populate report path. Jonesy reviews result; Ripley performs final assessment.
