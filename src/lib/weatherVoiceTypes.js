// src/lib/weatherVoiceTypes.js
//
// Weather Voice (#405) Phase 1 — shared typed contract for
// weatherVoiceRules.js / weatherVoiceEngine.js. JSDoc typedefs only: this
// project uses .jsx/.js with JSDoc, never TypeScript syntax or .ts/.tsx
// files (see AGENTS.md/CLAUDE.md project rules), so this module has no
// runtime exports of its own.

/**
 * The nine Phase 1 Weather Voice conditions, evaluated in priority order
 * by weatherVoiceEngine.js's evaluateWeatherVoice(). See
 * docs/ai/tasks/ticket-405/approved-prompt-v1.md for the full predicate
 * table, priority order, and policy provenance.
 * @typedef {"extreme_wind"|"heavy_rain"|"strong_wind"|"cold_wet"|"cold"|"rain"|"sun_wind"|"excellent"|"good"} WeatherVoiceCondition
 */

/**
 * The full canonical Tjaldur mood vocabulary — one per SVG asset (issue
 * #404, parent). Declared here in full so a later UI ticket can map
 * mood -> asset without changing this contract. Phase 1's nine conditions
 * can only ever reach eight of these at runtime — `wrecked`, `sad`,
 * `struggling`, `unimpressed`, `freezing`, `suspicious`, `excellent`, and
 * `happy`. `neutral`, `nervous`, `amazed`, and `sleeping` are reserved
 * vocabulary for later Weather Voice phases: they must appear in this
 * typedef (declaration completeness, verified by source review — see
 * weatherVoiceTypes.test.js) but evaluateWeatherVoice() never returns them
 * in Phase 1, and no rule or runtime vocabulary registry was added solely
 * to make them reachable/testable.
 * @typedef {"happy"|"excellent"|"neutral"|"suspicious"|"nervous"|"struggling"|"sad"|"freezing"|"unimpressed"|"wrecked"|"amazed"|"sleeping"} TjaldurMood
 */

/**
 * evaluateWeatherVoice()'s input: the four-field subset of one normalized
 * daily forecast row (src/lib/forecastNormalize.js's
 * normalizeDailyToScoreInput() output shape) that Weather Voice reads.
 * Every other row field (points, season, tier, summaryCode,
 * summaryTextKey, precipStartHour, ...) is ignored, not merely unused —
 * the engine never destructures them. This is a daily-scope interpretation
 * only; it is not suitable for current-hour claims (see forecastNormalize.js
 * time-weighting vs. a live hourly reading), a distinction later surface
 * integration must review explicitly before using this for "right now" UI.
 * @typedef {Object} WeatherVoiceInput
 * @property {number} tmax - Daily max temperature, Celsius. Negative values are valid and meaningful (winter days).
 * @property {number} windMax - Daily max wind speed, m/s. Time-weighted across the day when hourly data is available, else the provider's daily max (see forecastNormalize.js).
 * @property {number} rain - Normalized effective daily precipitation, mm. Time-weighted accumulation when hourly data is available, else the provider's daily sum. This is precipitation, not guaranteed to be liquid rain — see `code` for family evidence.
 * @property {number} code - Raw provider daily WMO weather code (Open-Meteo `daily.weathercode[i]`, the same value as a normalized row's own `code` field). Unrelated to any derived `summaryCode`/`summaryTextKey` (#400/#402) — those are presentation-only and must never be passed here.
 */

/**
 * @typedef {Object} WeatherVoiceSilentResult
 * @property {false} show
 */

/**
 * Tone of the text shown for an episode (#432). Determined only by the
 * condition, through the policy table in weatherVoiceRules.js
 * (`voiceLevelForCondition`). It is separate from severity and mood: neither
 * one, nor the selected text, nor the mascot asset can change it.
 * - "sarcastic": joke library, selected with cooldown and history.
 * - "cautious" / "serious": deterministic safety library, never a joke, never
 *   recorded in joke history, never shareable.
 * @typedef {"sarcastic"|"cautious"|"serious"} WeatherVoiceVoiceLevel
 */

/**
 * @typedef {Object} WeatherVoiceActiveResult
 * @property {true} show
 * @property {WeatherVoiceCondition} condition
 * @property {TjaldurMood} mood
 * @property {WeatherVoiceVoiceLevel} voiceLevel - Derived from `condition` alone (#432). Never inferred from severity or mood.
 * @property {0|1|2|3} severity - Voice intensity only: 0 positive, 1 mild, 2 pronounced, 3 extreme. Never changes points, warnings, recommendations, or entitlement.
 */

/**
 * The complete discriminated result of evaluateWeatherVoice().
 * @typedef {WeatherVoiceSilentResult|WeatherVoiceActiveResult} WeatherVoiceResult
 */

// ── Weather Voice (#406) Phase 2 — content, selection, and history ────────

/**
 * The five MVP-declared CTA destination types a comment entry may
 * reference. All MVP entries (issue #406) use `null` — no destination
 * promise or navigation is implemented in Phase 2.
 * @typedef {"better_location"|"calmer_location"|"drier_location"|"warmer_location"|"best_locations"} WeatherVoiceCtaType
 */

/**
 * Authored, per-ID metadata (src/lib/weatherVoiceContent.js's shared
 * registry) — everything about a comment except its language-specific
 * text. `severityMin`/`severityMax` default to 0/3 when omitted;
 * `repeatCooldownDays` defaults to 7; `ctaType` defaults to `null`.
 * @typedef {Object} WeatherVoiceCommentMetadata
 * @property {WeatherVoiceCondition} condition
 * @property {TjaldurMood} mood
 * @property {"sarcastic"} voiceLevel - Required and explicit (#432). The joke registry lists sarcastic entries only; cautious and serious text lives in the safety library.
 * @property {number} [severityMin] - Inclusive integer 0-3.
 * @property {number} [severityMax] - Inclusive integer 0-3.
 * @property {number} [repeatCooldownDays] - Finite, nonnegative.
 * @property {WeatherVoiceCtaType|null} [ctaType]
 */

/**
 * One fully-resolved library entry — a language's `{id, text}` merged
 * with its WeatherVoiceCommentMetadata, defaults applied
 * (src/lib/weatherVoiceContent.js's getWeatherVoiceLibrary() output shape).
 * @typedef {Object} WeatherVoiceCommentEntry
 * @property {string} id - Stable ASCII id, language-independent and stable across deploys.
 * @property {string} text - Nonempty comment text in the resolved language.
 * @property {WeatherVoiceCondition} condition
 * @property {TjaldurMood} mood
 * @property {"sarcastic"} voiceLevel - Always sarcastic: the joke library never contains cautious or serious entries (#432).
 * @property {number} severityMin
 * @property {number} severityMax
 * @property {number} repeatCooldownDays
 * @property {WeatherVoiceCtaType|null} ctaType
 */

/**
 * @typedef {Object} WeatherVoiceCommentRef
 * @property {string} id
 * @property {string} text
 */

/**
 * @typedef {Object} WeatherVoiceActivePresentation
 * @property {true} show
 * @property {WeatherVoiceCondition} condition - Copied verbatim from the Phase 1 engine result, never from content.
 * @property {TjaldurMood} mood - Copied verbatim from the Phase 1 engine result.
 * @property {WeatherVoiceVoiceLevel} voiceLevel - Copied verbatim from the engine result (#432). A sarcastic presentation comes from the joke pool, and a cautious or serious one from the safety library. Only sarcastic presentations are recorded in joke history or shareable.
 * @property {0|1|2|3} severity - Copied verbatim from the Phase 1 engine result.
 * @property {WeatherVoiceCommentRef} comment - The selected entry's id/text only (no other metadata leaks into presentation). For a cautious or serious presentation the id is a safety `message_id`, not a joke id.
 * @property {WeatherVoiceCtaType|null} ctaType
 */

/**
 * The result of presentation selection (#432). `{ show: false }` for silence,
 * or a WeatherVoiceActivePresentation. Two paths produce it:
 * - weatherVoiceSelector.js's selectWeatherVoiceComment(): the sarcastic joke
 *   pool, with cooldown and joke history.
 * - weatherVoiceSelector.js's selectWeatherVoicePresentation() (the dispatcher):
 *   routes sarcastic results to the joke path and cautious or serious results
 *   to weatherVoiceSafety.js's selectWeatherSafetyPresentation(), which uses no
 *   RNG, cooldown, or history.
 * @typedef {WeatherVoiceSilentResult|WeatherVoiceActivePresentation} WeatherVoicePresentation
 */

/**
 * weatherVoiceHistory.js's in-memory/persisted shape: stable comment `id`
 * -> the single latest epoch-ms timestamp it was actually shown at (not a
 * list of every exposure). No coordinates, identity, weather data, or
 * comment text is ever stored — see weatherVoiceHistory.js for the
 * persisted-JSON shape (`{ version, records: { [id]: epochMs } }`).
 * @typedef {Map<string, number>} WeatherVoiceHistory
 */

export {};
