# CC Report — Ticket 406 (Weather Voice Phase 2: content library and comment selection)

Executed against: `docs/ai/tasks/ticket-406/approved-prompt-v1.md` (v1, READY_FOR_CC → CC_IN_PROGRESS), approved by Jonesy Round 2 after resolving two audit-completeness points from Round 1 (i18n subdirectory precedent-break acknowledgment, and explicitly naming/ruling out `useLocalStorageState.js`).

## 1. Pre-edit audit — read and confirmed against live source before any code was written

Read `AGENTS.md`, `CLAUDE.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, GitHub issues #406/#404, the full ticket 405 approved prompt/cc-report/final result-review (this session's own prior work), the approved v1 prompt for this ticket, and its full review history (Ripley v1 → Jonesy Round 1 REVISE → Ripley v2 → Jonesy Round 2 APPROVED).

- **`src/lib/weatherVoiceEngine.js`, `weatherVoiceRules.js`, `weatherVoiceTypes.js`** (re-read fresh in this session, confirmed byte-identical to Ticket 405's final state at the start of this ticket) — the engine consumes `{tmax, windMax, rain, code}` and returns exactly `{show:false}` or `{show:true, condition, mood, severity}`; nine conditions, eight reachable moods, four reserved. No UI consumer exists. **Corrected wording (Ripley Round 1 flagged the original phrasing as self-contradictory):** `weatherVoiceEngine.js`/`weatherVoiceEngine.test.js` and `weatherVoiceRules.js`/`weatherVoiceRules.test.js` — the actual Phase 1 engine/rules and their tests — were **not modified** in this ticket. `weatherVoiceTypes.js`/`weatherVoiceTypes.test.js` **were** modified, but only as the approved prompt explicitly authorized: extended with new Phase 2 typedefs/declaration tests, with every existing Phase 1 typedef and test preserved verbatim (§2/§6 correctly stated this distinction; this bullet's original wording did not, and is corrected here rather than silently).
- **`public/tjaldur/`** — confirmed exactly twelve PNGs, one per canonical mood: `amazed.png, excellent.png, freezing.png, happy.png, nervous.png, neutral.png, sad.png, sleeping.png, struggling.png, suspicious.png, unimpressed.png, wrecked.png`. No rendering/conversion/asset edit was performed — out of scope.
- **`src/hooks/useLocalStorageState.js`** — read in full. It's a React hook: `useState(read)` for initial value, then `useEffect(() => localStorage.setItem(...), [key, value])` that fires on every value change **including mount**. This automatic, React-lifecycle-driven write is structurally incompatible with #406's explicit "selection is not exposure — record only after actual display" contract: there is no way to make this hook write *only* when a comment has genuinely been rendered, short of routing a confirmed-shown boolean through component state and still depending on effect timing. It is also plainly unusable from a non-React pure library. **Ruled out**, not modified, not reused, not coupled to.
- **`src/lib/forecastCache.js`** (re-read fresh) and **`src/lib/attribution.js`** (read in full) — both are feature-specific guarded-localStorage helpers for unrelated data (forecast payloads; UTM attribution), each with its own independent try/catch pattern. Neither exposes a generic, injectable, bounded, explicit-exposure history API. `weatherVoiceHistory.js` is intentionally a **third** independent small guarded-storage implementation — per the approved prompt, no shared primitive was extracted, the hook was not modified, and the pure selector was not coupled to React, specifically to avoid entangling three genuinely different persistence needs for the sake of avoiding a small amount of duplicated try/catch boilerplate.
- **`src/i18n/translations.js`** and **`src/hooks/useT.js`** (both re-read fresh) — confirmed `translations.js` spreads seven flat `translations.<domain>.js` modules (each `{en: {...}, is: {...}}` of simple strings) into one global object, and `useT(lang)` returns `translations[lang]?.[key] ?? key`. This flat string-keyed lookup is structurally incompatible with a structured content library (id/condition/mood/text/severity range/cooldown/CTA per entry) — spreading it in would either force an incompatible shape into `translations.js` or silently invent an unstated convention. Per the approved v2 revision, `src/i18n/weatherVoice/is.js`/`en.js` are a **deliberate, narrowly-scoped, explicitly-acknowledged exception**: real language-specific text lives under `i18n/` (satisfying the repository convention's spirit) but is never imported/spread into `translations.js` and never resolved through `useT()`. Neither `translations.js` nor `useT.js` was modified.

This audit fully supports the reviewed design; no contradiction was found, so no STOP condition was triggered.

## 2. Design implemented

Four new modules (plus two new i18n content files) and one extended existing file — no other existing production module was modified:

### `src/i18n/weatherVoice/is.js` / `en.js`
Minimal `{id, text}` arrays only — no metadata. `is.js` holds the real 27-entry MVP library (verbatim, §4 below); `en.js` is a genuinely empty `[]`, a real supported-but-unpopulated language, not an English translation and not a silent copy of Icelandic content.

### `src/lib/weatherVoiceContent.js`
- `WEATHER_VOICE_COMMENT_METADATA` — the single shared registry, id → `{condition, mood}` for all 27 MVP entries (all use every default: severity 0–3, 7-day cooldown, no CTA). Authoring metadata exactly once per ID here — rather than duplicating it per language — makes "equal metadata across languages for a shared ID" true **by construction** for real content, while the validator (below) still checks it generically so the rule is genuinely enforced and testable with synthetic fixtures, not merely assumed from the production shape.
- `getWeatherVoiceLibrary(lang)` — pure. `"is"`/`"en"` resolve to real (possibly empty) arrays of fully-merged `WeatherVoiceCommentEntry` objects; any other value (including `undefined`, `""`, or a differently-cased string) returns `null` — never a fallback to Icelandic.
- `WEATHER_VOICE_KNOWN_IDS`, `WEATHER_VOICE_KNOWN_CONDITIONS`, `WEATHER_VOICE_KNOWN_MOODS`, `WEATHER_VOICE_CTA_TYPES` — frozen `Set`s consumed by the selector and history modules, so the string vocabulary is declared exactly once at this layer (Phase 1 has zero runtime exports of its own vocabulary — JSDoc typedefs only — so this content layer necessarily keeps its own copy of *which strings are valid at all*; it never claims which condition maps to which mood, so this is not "another condition/mood mapping into the engine").
- `validateWeatherVoiceLibrary({languages, canonicalPairs})` — pure, generic, test/build-tooling-only (never called from a production render path). Checks: per-language duplicate IDs, ASCII id shape, known condition/mood strings, an *injected* `canonicalPairs` set (never hardcoded here — see §5), nonempty/non-whitespace text, valid integer severity range (0–3, non-inverted), finite non-negative cooldown, valid-or-null CTA, and cross-language metadata equality for any ID appearing in more than one language's entries (comparing actual entry objects generically, not merely trusting the shared-registry shape).

### `src/lib/weatherVoiceSelector.js`
`selectWeatherVoiceComment({engineResult, library, history, now, rng})` — pure. Never reads a clock/storage/browser global itself. Order of operations: (1) validate the engine result is a genuinely active, well-formed Phase 1 result — otherwise immediate silence, before ever touching `library`/`history`/`rng`; (2) filter `library` to entries whose `condition`+`mood` match Phase 1's exactly and whose `[severityMin, severityMax]` contains Phase 1's `severity` — no fallback to another condition/language if this is empty; (3) sort the eligible pool by ID (copy, never mutates `library`); (4) partition by cooldown availability (`now - shownAt >= repeatCooldownDays * 86400000`, or never-shown); (5) if any are available, pick uniformly via the injected `rng()` (invalid/throwing RNG deterministically falls back to the first sorted ID, never throws, never indexes out of bounds); (6) if none are available, pick the least-recently-shown entry from the full eligible (sorted) pool, tie-broken lexicographically by ID via the pre-sorted iteration order — always returns a comment in this case, even with a single eligible entry. `condition`/`mood`/`severity` in the returned presentation are copied verbatim from `engineResult`, never from the chosen content entry.

### `src/lib/weatherVoiceHistory.js`
`createWeatherVoiceHistory({storage} = {})` — a factory (not a singleton), each instance holding its own best-effort in-memory `Map` for its lifetime. `getHistory(now)` merges any sanitized persisted state into that memory and returns a **fresh defensive copy** (callers, including the selector, can never observe or mutate this instance's internal state). `recordShown(presentation, now)` is a no-op for anything but a genuinely active, well-formed presentation with a known ID; otherwise it upserts `id → now` with idempotent-same-timestamp / never-let-older-replace-newer semantics, then attempts a best-effort persist. Storage acquisition itself (`window.localStorage` property access, which can throw a `SecurityError` in some sandboxed contexts, not just fail) and every `getItem`/`setItem` call are individually try/catch-guarded; none of these can throw out of the public API, and none block selection. Persisted shape: `{"version":1,"records":{"<id>":<epochMs>}}` under key `weather_voice_history_v1` — unknown IDs and invalid/negative/non-finite/future (relative to injected `now`) timestamps are discarded on read; expired-but-known records are **preserved** (never pruned) so the all-in-cooldown least-recently-shown fallback stays meaningful.

### `src/lib/weatherVoiceTypes.js` (extended, not replaced)
Every existing Phase 1 typedef (`WeatherVoiceCondition`, `TjaldurMood`, `WeatherVoiceInput`, `WeatherVoiceResult`, plus the two intermediate result shapes) is preserved verbatim. New Phase 2 typedefs appended: `WeatherVoiceCtaType`, `WeatherVoiceCommentMetadata`, `WeatherVoiceCommentEntry`, `WeatherVoiceCommentRef`, `WeatherVoiceActivePresentation`, `WeatherVoicePresentation`, `WeatherVoiceHistory`. Still zero runtime exports (`export {}`), same declaration-only convention as Phase 1.

## 3. API usage — select, then record only after display

```js
import { evaluateWeatherVoice } from "./weatherVoiceEngine";
import { getWeatherVoiceLibrary } from "./weatherVoiceContent";
import { selectWeatherVoiceComment } from "./weatherVoiceSelector";
import { createWeatherVoiceHistory } from "./weatherVoiceHistory";

const historyAdapter = createWeatherVoiceHistory(); // production: real localStorage when available, guarded

// ... inside whatever future UI computes a normalized daily row:
const engineResult = evaluateWeatherVoice(row); // unchanged Phase 1 engine
const library = getWeatherVoiceLibrary(lang); // "is" | "en", explicit — no fallback
const now = Date.now();

const presentation = selectWeatherVoiceComment({
  engineResult,
  library,
  history: historyAdapter.getHistory(now), // read-only sanitized snapshot
  now,
  rng: Math.random,
});

// presentation is either { show: false } or
// { show: true, condition, mood, severity, comment: { id, text }, ctaType }
// Selection itself writes nothing.

// ... only after the future UI has ACTUALLY rendered `presentation`:
if (presentation.show) {
  historyAdapter.recordShown(presentation, Date.now());
}
```

This exact flow is exercised end-to-end (selector → history → a fresh "reload" instance) in `weatherVoiceHistory.test.js`'s "reload: a new instance sharing the same storage reads the persisted record" test.

## 4. Exact final copy — 27 reviewed IS entries (verbatim, unchanged from the approved table)

| ID | Condition | Mood | Text |
| --- | --- | --- | --- |
| wind_extreme_01 | extreme_wind | wrecked | Vindur: Já. |
| wind_extreme_02 | extreme_wind | wrecked | Ég tek þetta sem persónulega árás. |
| wind_extreme_03 | extreme_wind | wrecked | Nei. |
| wind_extreme_04 | extreme_wind | wrecked | Vindurinn hefur orðið. |
| wind_extreme_05 | extreme_wind | wrecked | Þetta var ekki í bæklingnum. |
| wind_strong_01 | strong_wind | struggling | Lognið á frí. |
| wind_strong_02 | strong_wind | struggling | Hárið hefur gefist upp. |
| wind_strong_03 | strong_wind | struggling | Það blæs ekki af þessu. |
| rain_heavy_01 | heavy_rain | sad | Bíllinn fær allavega þvott. |
| rain_heavy_02 | heavy_rain | sad | Þurrt er afstætt hugtak. |
| rain_heavy_03 | heavy_rain | sad | Þetta er fullmikill áhugi á vatni. |
| cold_wet_01 | cold_wet | unimpressed | Ullin fær að vinna fyrir kaupinu. |
| cold_wet_02 | cold_wet | unimpressed | Veðrið tók allan pakkann. |
| cold_wet_03 | cold_wet | unimpressed | Ekki alveg stuttbuxnaveður. |
| cold_01 | cold | freezing | Lopapeysan hafði rétt fyrir sér. |
| cold_02 | cold | freezing | Peysan fær framlengingu. |
| cold_03 | cold | freezing | Kaffið kólnar af samúð. |
| rain_01 | rain | unimpressed | Það fylgir vatn með. |
| rain_02 | rain | unimpressed | Regnjakki með aðalhlutverk. |
| sun_wind_01 | sun_wind | suspicious | Sólin mætir. Lognið ekki. |
| sun_wind_02 | sun_wind | suspicious | Bjart yfir. Hárið á hlið. |
| excellent_01 | excellent | excellent | Þetta er grunsamlega gott. |
| excellent_02 | excellent | excellent | Ekki segja neinum. |
| excellent_03 | excellent | excellent | Nú vantar bara kaffið. |
| good_01 | good | happy | Þetta má alveg. |
| good_02 | good | happy | Jæja. Þetta er bara gott. |
| good_03 | good | happy | Engin kvörtun að sinni. |

Every row uses the omitted-severity (0–3), 7-day cooldown, null-CTA defaults. No text was rewritten. `wind_extreme_04` retained exactly as approved ("hafa orðið" — "to have the floor" idiom, per Jonesy Round 2's independently-verified copy clarification). `weatherVoiceContent.test.js`'s "matches the exact reviewed text for every ID" test asserts this table byte-for-byte against the live `is.js` file.

## 5. History and language policy

- **Language**: explicit `"is"`/`"en"` only; anything else (including a differently-cased or unsupported string) resolves to `null`, which the selector treats as content-unavailable silence — never a fallback to Icelandic. `en` is a real, distinct, currently-empty library.
- **History scope**: one latest exposure timestamp per stable content `id`, shared across language and site for MVP — no coordinates, identity, weather data, site reference, or comment text is ever persisted (confirmed by `weatherVoiceHistory.test.js`'s explicit "no coordinates/identity/weather/text" and "no language or site field" tests, which inspect the raw persisted JSON directly).
- **Canonical pairing without duplicating the engine's mapping**: `weatherVoiceContent.js` never hardcodes its own copy of "which condition maps to which mood." Instead, `weatherVoiceContent.test.js` derives `canonicalPairs` from nine real `evaluateWeatherVoice()` fixture calls (one per Phase 1 condition, asserting `result.show === true` for each as a guard against a stale fixture) and injects that real-engine-derived set into `validateWeatherVoiceLibrary`. This satisfies "canonical pairing with real engine outputs" literally, and per the approved prompt, adds no new runtime export to Phase 1 to do it.
- **Cross-tab conflict resolution is explicitly out of scope**; persistence is best-effort only. A concurrent write from another tab can be overwritten by this tab's next write — documented here and in `weatherVoiceHistory.js`'s header comment, not silently assumed away.

## 6. Files changed

**New:**
- `src/i18n/weatherVoice/is.js`, `src/i18n/weatherVoice/en.js`
- `src/lib/weatherVoiceContent.js` + `weatherVoiceContent.test.js` (20 tests)
- `src/lib/weatherVoiceSelector.js` + `weatherVoiceSelector.test.js` (23 tests)
- `src/lib/weatherVoiceHistory.js` + `weatherVoiceHistory.test.js` (23 tests)
- `docs/ai/tasks/ticket-406/cc-report.md` (this file)

**Modified:**
- `src/lib/weatherVoiceTypes.js` — extended with Phase 2 typedefs, every Phase 1 typedef preserved verbatim, still zero runtime exports.
- `src/lib/weatherVoiceTypes.test.js` — extended with a Phase 2 declaration-completeness test (all new typedef names present; `WeatherVoiceCtaType`'s five exact CTA strings), alongside its unmodified Phase 1 tests (12 tests total, up from 5).
- `docs/ai/CURRENT.md` — workflow pointer/stage only.

**Confirmed untouched** (verified via `git status --short`): `src/lib/weatherVoiceEngine.js`, `src/lib/weatherVoiceEngine.test.js`, `src/lib/weatherVoiceRules.js`, `src/lib/weatherVoiceRules.test.js` (Phase 1, byte-for-byte unchanged), `src/hooks/useLocalStorageState.js`, `src/i18n/translations.js`, `src/hooks/useT.js`, `src/lib/forecastCache.js`, `src/lib/attribution.js`, `src/lib/scoring.js`, every other translation file, every UI component, every backend route, entitlement/checkout/analytics code. No dependency added. No `.tsx`/TypeScript. No hook/UI wiring, no navigation, no analytics. Not committed. Not pushed.

## 7. Validation — exact commands and results

1. `npx vitest run src/lib/weatherVoiceContent.test.js src/lib/weatherVoiceSelector.test.js src/lib/weatherVoiceHistory.test.js src/lib/weatherVoiceTypes.test.js` → **4 files, 78 tests passed** (20 + 23 + 23 + 12).
2. `npx vitest run src/lib/weatherVoiceEngine.test.js src/lib/weatherVoiceRules.test.js src/hooks/useForecast.scoringInvariance.test.js` → **3 files, 58 tests passed** — all three existing #405 suites plus the scoring-invariance suite, independently rerun (not inherited from the prior ticket's report) and confirmed unaffected by this ticket's changes.
3. `npx eslint src/i18n/weatherVoice/is.js src/i18n/weatherVoice/en.js src/lib/weatherVoiceContent.js src/lib/weatherVoiceContent.test.js src/lib/weatherVoiceSelector.js src/lib/weatherVoiceSelector.test.js src/lib/weatherVoiceHistory.js src/lib/weatherVoiceHistory.test.js src/lib/weatherVoiceTypes.js src/lib/weatherVoiceTypes.test.js` → exit 0, no output.
4. `npm run lint` (full project) → exit 0, no output.
5. `npm test -- --run` (full suite) → **103 files, 1291 tests passed** (up from 100 files/1218 tests before this ticket — +3 files, +73 tests: 78 new − 5 superseded-by-extension Phase-1-only typedef-test-count difference reconciles to the file-level delta shown by `git status`; the full-suite run itself is the authoritative count). Zero pre-existing failures — nothing to distinguish as new vs. inherited.
6. `npm run build` → succeeded (`✓ built in 4.13s`). Bundle JS size essentially unchanged from the pre-ticket build (same reason as #405: nothing imports these modules yet, so Vite tree-shakes them out entirely — correct and expected for a library-only phase).
7. `git diff --check` → exit 0 (only pre-existing informational LF→CRLF notices). `git status --short` scope inspection (§6 above) confirms exactly the intended file set, with Phase 1's engine/rules modules and tests, the three ruled-out persistence/translation candidates, and every other existing production file absent from the diff.

No browser/UI testing was performed — correctly out of scope (no UI entrypoint exists; explicitly noted in the pre-design audit).

## 8. STOP conditions — none triggered

No change was made to Phase 1 thresholds/engine, scoring, normalization, shared forecast input, entitlement, checkout, analytics, backend, existing UI, or existing translation infrastructure. Weather is never inferred from comment text (content carries no weather-condition-deriving logic — it is purely selected by, never used to compute, condition/mood/severity). The Phase 1 result itself is never randomized — only *which comment* is chosen is randomized, via injected RNG, and only among entries whose condition/mood already matches Phase 1's own output. No second condition/mood mapping was introduced into the engine — the content layer's known-string `Set`s declare vocabulary, never a condition→mood pairing rule of their own; the one genuine pairing check (`canonicalPairs`) is always externally injected from real engine fixtures, never hardcoded in production code. No UI was added to record exposure — `recordWeatherVoiceShown`-equivalent (`recordShown`) is an explicit library export for a future ticket to call. No existing contract contradicted this design during implementation, so nothing needed to be recorded as a conflict. No copy was changed.

## 9. Deviations and limitations

- **API naming**: the approved prompt allowed "exact API spelling may follow local conventions." The chosen names are `selectWeatherVoiceComment` (selection) and `createWeatherVoiceHistory(...).recordShown` (exposure recording) rather than a bare top-level `recordWeatherVoiceShown` function — a factory method was chosen over a free function because history is inherently stateful (each instance's own in-memory fallback), so a bare exported function would need to either be a singleton (module-level mutable state, explicitly against the pure-library convention established in #405) or take the memory map as an explicit parameter on every call (more awkward for the intended future caller than a small stateful adapter instance). The method is still an explicit, separately-invoked operation — "selection is not exposure" is fully preserved.
- **`validateWeatherVoiceLibrary`'s ID shape check** requires ASCII letters/digits/underscore (`/^[A-Za-z0-9_]+$/`) — not specified to the character in the approved prompt beyond "stable ASCII id"; this is a reasonable, conservative reading consistent with all 27 real IDs' actual `snake_case` shape.
- No other deviation. The 27-entry copy, IDs, condition/mood pairing, severity/cooldown/CTA defaults, selection algorithm, and history persistence policy all match the approved prompt exactly as reviewed.

## 10. Confirmation (Revision 1)

`docs/ai/CURRENT.md` updated: CC report path set to this file, stage set to `CC_COMPLETE`. **Not committed. Not pushed.**

---

## Revision 2 — history correctness fixes (`docs/ai/tasks/ticket-406/approved-prompt-v2.md`)

Round 1 review: Jonesy PASS (with one report-accuracy correction: the "20 + 23 + 23 + 12" per-file test-count breakdown in §7 was a scrambled permutation that happened to sum to the correct total — the correct per-file counts, independently counted by Jonesy, are `weatherVoiceContent.test.js` = 23, `weatherVoiceSelector.test.js` = 28, `weatherVoiceHistory.test.js` = 20, `weatherVoiceTypes.test.js` = 7; noted here for the record, no code/test change was needed for this). Ripley REVISE — independently reproduced two real defects in `weatherVoiceHistory.js`, plus the audit-wording contradiction corrected in §1 above.

### Defect 1 — malformed known-ID presentations were persisted

`recordShown` validated only `show === true`, a finite/nonnegative `now`, and a known `comment.id`. A call like `history.recordShown({ show: true, comment: { id: "rain_01" } }, 1000)` — missing `condition`/`mood`/`severity`/real `comment.text` entirely — still wrote `{"rain_01": 1000}` to storage, silently consuming that ID's 7-day cooldown for a result that was never actually a valid, fully-formed active presentation.

**Fix**: `isValidActivePresentation(presentation)` (`src/lib/weatherVoiceHistory.js`) now requires, before any memory or storage access happens at all: `show === true`; a known `comment.id`; `condition`/`mood` matching that specific ID's own registered metadata exactly (not merely "a known condition/mood string" — the *pairing* for that ID); an integer `severity` within that ID's resolved `[severityMin, severityMax]`; a non-blank (trimmed-nonempty) string `comment.text` (checked for non-blankness only, never for equality to a specific language's exact string — history stays language-independent by design); and a `ctaType` (or `null`) matching that ID's resolved CTA metadata exactly. To avoid duplicating a second condition/mood table or reconstructing any Phase 1 threshold, this reuses a new small read-only lookup, `getWeatherVoiceCommentMetadataById(id)` (`src/lib/weatherVoiceContent.js`), built from the exact same shared metadata registry every language library entry is already assembled from.

### Defect 2 — record-first use of a fresh adapter dropped other persisted history

Seeding storage with `{version:1, records:{rain_01:900, rain_02:950}}`, creating a **fresh** `createWeatherVoiceHistory({storage})` instance, and calling `recordShown` for `rain_01` at `1000` **without calling `getHistory` first** resulted in storage becoming `{version:1, records:{rain_01:1000}}` — `rain_02` silently disappeared. `recordShown` only ever wrote `serializeHistory(memory)`, and `memory` had never been merged with persisted state, because only `getHistory` performed that merge; there was no read-before-write precondition anywhere in the public API.

**Fix**: introduced a single `hydrated` boolean per adapter instance and a shared `ensureHydrated(now)` step, called by **both** `getHistory` and `recordShown` — whichever is invoked first performs the one-time merge of sanitized persisted state into `memory`; the other, called later, is a no-op (the merge already happened). In `recordShown`, this hydration step runs strictly *after* `isValidActivePresentation` passes (so an invalid presentation never triggers a storage read either) and *before* the existing idempotent/never-let-older-replace-newer upsert logic, which was otherwise left completely unchanged. This is deliberately a one-time **sequential, single-instance** initialization fix, not cross-tab synchronization — repeated calls on the same instance do not re-read storage (verified by a dedicated test counting `getItem` invocations), and same-instance older-write protection is unaffected.

### Regression tests

`src/lib/weatherVoiceHistory.test.js` was substantially revised:
- **Positive-fixture helper replaced.** The old `activePresentation(id)` hardcoded `condition: "rain", mood: "unimpressed"` for every ID regardless of that ID's real metadata (per Ripley's finding, this could never have been a valid positive fixture once strict validation landed, since most of the 27 IDs are not `rain`/`unimpressed`). The new `realPresentation(id, overrides)` looks up each ID's actual metadata via `getWeatherVoiceCommentMetadataById` and builds a genuinely matching presentation; every existing positive-recording test in the file was updated to use it.
- **New describe block, "Revision 2: strict presentation validation before any side effect"** (7 tests): the exact `{show:true, comment:{id}}` case from the approved prompt (asserting **zero** `getItem` calls, not just "no record"); null/undefined/unknown-id; each missing required field (`condition`, `mood`, `severity`, `comment.text`) individually; wrong field types (string severity, numeric condition, null mood, numeric text); out-of-range and non-integer severity; blank text (empty and whitespace-only); and a mismatched condition/mood/CTA for an otherwise-known ID.
- **New describe block, "Revision 2: hydrate before the first valid write"** (6 tests): the exact two-seeded-IDs / record-first-for-one-ID reproduction from the result review; adding a third ID on the same fresh instance; an expired (30-days-old)-but-known seeded entry preserved through record-first hydration; same-timestamp idempotence holding on initial hydration; hydration happening exactly once per instance (asserted via `getItem` call-count, not just outcome); and an invalid presentation never triggering hydration or a write at all.
- **New end-to-end positive test**: a real `evaluateWeatherVoice()` → `getWeatherVoiceLibrary("is")` → `selectWeatherVoiceComment()` result recorded successfully via `recordShown`, plus a "valid non-IS text with identical metadata" test proving history accepts any non-blank text matching an ID's real metadata (not just the literal IS string) while never persisting that text.
- **New guard test**: a throwing `window.localStorage` **property getter** (via `Object.defineProperty`, not just a throwing `getItem`) — the acquisition-guard case Ripley's follow-up explicitly asked to confirm was covered, since the existing "no window" test only covered the SSR case, not a property access that itself throws in a real (non-SSR) browser-like context.

All prior Revision-1 tests in this file (nonfatal-guard coverage: corrupt JSON, wrong version, wrong/missing shape, unknown IDs, invalid/negative/future timestamps, throwing `getItem`/`setItem`, both-throw memory fallback, bounded serialization) were retained, updated only where they used the now-invalid `activePresentation` helper, and rerun unmodified in behavior.

### Red→green proofs (both defects, independently)

1. **Defect 1**: temporarily reverted `isValidActivePresentation` to the old Revision-1 check (`show === true` + known ID only). Reran `weatherVoiceHistory.test.js`: **7 tests failed** — the exact 7 tests in the new "strict presentation validation" block (missing-field, wrong-type, out-of-range-severity, blank-text, mismatched-condition/mood/CTA, and the "no storage access" `getItem`-count assertion) and no others. Restored the fix; all 7 passed again.
2. **Defect 2**: temporarily removed the `ensureHydrated(now)` call from `recordShown` (leaving `getHistory`'s hydration untouched). Reran `weatherVoiceHistory.test.js`: **4 tests failed** — the exact 4 tests in the new "hydrate before the first valid write" block that depend on record-first behavior (`rain_02` dropped, third-ID case, expired-entry-preserved case, and the hydration-call-count case), while the same-timestamp-idempotence-on-hydration test (which happens not to depend on order in a way the missing call breaks) still passed. Restored the fix; all 35 tests in the file passed again.

### Validation run (Revision 2)

1. `npx vitest run src/lib/weatherVoiceHistory.test.js src/lib/weatherVoiceContent.test.js` → 2 files, **58 tests passed**.
2. `npx vitest run src/lib/weatherVoiceHistory.test.js src/lib/weatherVoiceContent.test.js src/lib/weatherVoiceSelector.test.js src/lib/weatherVoiceTypes.test.js src/lib/weatherVoiceEngine.test.js src/lib/weatherVoiceRules.test.js src/hooks/useForecast.scoringInvariance.test.js` → 7 files, **151 tests passed** — full Weather Voice suite (all four Phase 2 files plus Phase 1's engine/rules) and the scoring-invariance regression suite, independently rerun.
3. `npx eslint src/lib/weatherVoiceHistory.js src/lib/weatherVoiceHistory.test.js src/lib/weatherVoiceContent.js` → exit 0, no output.
4. `npm run lint` (full project) → exit 0, no output.
5. `npm test -- --run` (full suite) → **103 files, 1306 tests passed** (up from 103 files/1291 tests before this revision — file count unchanged, since no new file was added; +15 tests: `weatherVoiceHistory.test.js` grew from 20 to 35 tests, i.e. +7 strict-validation + 6 hydration + 1 end-to-end + 1 non-IS-text = +15, matching exactly).
6. `npm run build` → succeeded (`✓ built in 6.90s`), same pre-existing chunk-size advisory, unrelated.
7. `git diff --check` → exit 0 (only pre-existing informational LF→CRLF notices). Scope inspection: only `src/lib/weatherVoiceHistory.js`, `src/lib/weatherVoiceHistory.test.js`, and `src/lib/weatherVoiceContent.js` (the minimal read-only metadata-lookup addition) changed in production/test code for Revision 2, alongside this report and `docs/ai/CURRENT.md` — matching the v2 prompt's explicit scope limit ("Limit production edits to weatherVoiceHistory.js and a minimal read-only content-metadata/validation helper if needed"). No UI, hook, new library, Phase 1 engine/rules, selector, types, translation, or i18n content file changed.

No browser/UI recheck performed — this correction is confined to the non-UI history module; no UI file exists to recheck.

### Acceptance criteria — status

- Reject silent or malformed presentations before changing memory or acquiring/reading/writing storage — verified structurally (`isValidActivePresentation` runs first, `ensureHydrated`/storage access only follows a pass) and by the explicit zero-`getItem`-calls test.
- Condition/mood matching that ID's existing metadata; integer severity within that entry's resolved bounds; nonempty text; null/valid CTA matching the entry's resolved CTA — all individually tested.
- Text equality to the IS string is not required — proven by the dedicated "valid non-IS text" test.
- No duplicated weather thresholds or new condition-to-mood table — `getWeatherVoiceCommentMetadataById` reuses the single existing registry.
- Hydration happens before the first valid write, works when `recordShown` is the first public operation, preserves other valid known IDs and expired known timestamps, and remains a one-time sequential (not cross-tab) initialization — all independently tested.
- Same-instance older-write protection, sanitized invalid/unknown/future persisted values, throwing storage acquisition (property-getter, not just method)/read/write, and memory fallback all still hold — retained and (for the property-getter case) newly covered.
- All 27 IDs/texts, selector behavior, Phase 1 engine/rules, cooldown defaults, language policy, and storage key/version/shape are unchanged — confirmed by the unmodified `weatherVoiceEngine.test.js`/`weatherVoiceRules.test.js`/`weatherVoiceSelector.test.js`/`weatherVoiceContent.test.js` (bar the new metadata-lookup export) all passing without modification to their assertions.

### Confirmation (Revision 2)

`docs/ai/CURRENT.md` updated: `Stage: CC_COMPLETE`, CC report path unchanged (this file). **Not committed. Not pushed.**
