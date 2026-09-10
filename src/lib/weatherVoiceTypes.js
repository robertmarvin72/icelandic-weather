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
 * @typedef {Object} WeatherVoiceActiveResult
 * @property {true} show
 * @property {WeatherVoiceCondition} condition
 * @property {TjaldurMood} mood
 * @property {0|1|2|3} severity - Voice intensity only: 0 positive, 1 mild, 2 pronounced, 3 extreme. Never changes points, warnings, recommendations, or entitlement.
 */

/**
 * The complete discriminated result of evaluateWeatherVoice().
 * @typedef {WeatherVoiceSilentResult|WeatherVoiceActiveResult} WeatherVoiceResult
 */

export {};
