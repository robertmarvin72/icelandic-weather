# Ticket 414 — CC report

Executed per `docs/ai/tasks/ticket-414/approved-prompt-v1.md` (Jonesy APPROVED, Initial prompt Round 1). Presentation-only: Aurora category colors and legend labels, no scoring/threshold/ranking/module-redesign change.

## Pre-edit audit (read-only, before any edit)

Read `AGENTS.md`, `CLAUDE.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, `approved-prompt-v1.md`, and `prompt-review.md` first. Then re-verified every "Verified in source" claim directly against live code (not trusting the prompt's or Jonesy's narrative alone):

- `src/lib/auroraBandPresentation.js`: `AURORA_BAND_COLORS` had `excellent: "#16a34a"`, `good: "#22c55e"`, `fair: "#facc15"`, `poor: "#f97316"`, `"very-poor": "#b91c1c"`, default fallback `"fair"` — confirmed exactly.
- `src/lib/auroraVisualState.js`: `BAND_TO_VISUAL_STATE` maps both `excellent` and `good` to `GOOD`; `AURORA_VISUAL_STATE_TOKENS[GOOD]` used emerald `pillClass`/`accentGlowClass`/`accentBarClass` with `pillKey: "nlPillGood"` — confirmed this is the exact bug: an excellent result gets the literal text "Good conditions" in green.
- `src/MapView.jsx`: `auroraBandColor()` is called from exactly three places — individual markers, the cluster `iconCreateFunction`'s best-band selection (`BAND_RANK`, unchanged by this ticket), and the legend — all through the same shared function, confirmed by grep to be the only three call sites in `src/`. The legend iterates exactly `["excellent", "good", "fair"]` and used `auroraBandLabelKey` (the same long/descriptive key as popups). No existing accessible-name mechanism (`alt`/`aria-label`/`title`/`role`) existed anywhere in this file for any marker, in any mode — confirmed by grep returning zero matches.
- `src/components/NorthernLightsCard.jsx`: `resultBand` is `qualifyingLocations[0]?.band` when qualifying, else `bestAvailable?.band`; `auroraVisualStateTokens(resultBand)` feeds the header pill directly — confirmed an excellent result and a good result resolve to byte-identical pill tokens today.
- `src/i18n/translations.northernLights.js`: no short-label keys existed; only the long `nlBandExcellent`/`nlBandGood`/`nlBandFair` (shared with popups/lists).
- Confirmed `NorthernLightsCard.jsx` is the single shared component rendered from both `App.jsx` (homepage) and `src/pages/NorthernLightsLanding.jsx` (landing page) — not two separate files — so one component change covers both surfaces.
- Grepped `HAZARDS_V1`/generic-map `colorForScore`/`auroraScoring.js`/`auroraDisplaySelection.js` to confirm this ticket's edits never touch any of them.

Findings matched the approved prompt's audit exactly — no discrepancy required a STOP.

## Design decision: what "narrow canonical-band presentation override" means here

Requirement 4 asks for excellent to get its own purple pill/glow/bar while `auroraVisualState(excellent) === GOOD` stays unchanged and headline/body/CTA-eligibility behavior is preserved. Read literally: the override touches only the fields that denote result **status** (`pillKey`, `pillClass`, `accentGlowClass`, `accentBarClass`) — `headlineKey`/`bodyKey` (and therefore the actual headline/body copy shown) and every CTA-key-selection branch (which reads `auroraVisualState()`, untouched) stay exactly GOOD's. This was implemented as a single small override object merged into `auroraVisualStateTokens()`'s return value only when `band === "excellent"` — no other function, no new visual state, no change to `BAND_TO_VISUAL_STATE`.

## Exact changes

1. **`src/lib/auroraBandPresentation.js`**
   - `AURORA_BAND_COLORS.excellent` changed `#16a34a` → `#a855f7` (purple). `good`/`fair`/`poor`/`very-poor` unchanged.
   - Added `AURORA_BAND_SHORT_LABEL_KEYS` (`excellent`/`good`/`fair` only — the three bands the legend actually shows) and `auroraBandShortLabelKey(band)`, which falls back to the existing descriptive `auroraBandLabelKey(band)` for any other band (poor/very-poor/unknown) rather than inventing unused copy.

2. **`src/lib/auroraVisualState.js`**
   - Added a narrow `EXCELLENT_PILL_OVERRIDE` constant (`pillKey: "nlPillExcellent"`, purple `pillClass`/`accentGlowClass`/`accentBarClass`) merged into `auroraVisualStateTokens(band)`'s return only when `band === "excellent"`. `auroraVisualState()` itself, `BAND_TO_VISUAL_STATE`, and every other band's tokens are byte-for-byte unchanged.

3. **`src/i18n/translations.northernLights.js`**
   - Added `nlPillExcellent` (EN "Excellent conditions", IS "Frábær skilyrði") next to the existing `nlPillGood`.
   - Added `nlLegendExcellent`/`nlLegendGood`/`nlLegendFair` (EN "Excellent"/"Good"/"Fair", IS "Frábær"/"Góð"/"Sæmileg" — the exact strings the approved prompt requires) in both language blocks. The existing long `nlBand*` descriptive keys are untouched and remain in use for popups/lists.

4. **`src/MapView.jsx`**
   - Legend now calls `auroraBandShortLabelKey(band)` instead of `auroraBandLabelKey(band)`; popup (unchanged) still uses the long descriptive key.
   - Marker color/cluster color required no code change — both already route through the shared `auroraBandColor()`, so the new purple propagates automatically and consistently to markers, the cluster best-band color, and the legend swatch.
   - Added a narrow accessible-name affordance to `scorePinIcon()`: a new optional `ariaLabel` parameter renders `role="img" aria-label="…"` on the marker's wrapper `<div>` (the existing `L.divIcon` HTML pattern has no `alt` prop — that's `L.icon`-only — so this is the pattern's own way to expose a text alternative). Only Aurora-mode markers pass a non-empty `ariaLabel` (`"{site name}: {long descriptive band label}"`, mirroring the popup text); ordinary weather-mode markers pass none and are byte-for-byte unchanged.
   - Added `data-testid="aurora-legend"` to the legend's wrapper `<div>` — a pure test-scaffolding addition (no visual/behavioral change) needed to scope legend-vs-popup assertions reliably.

5. **`src/components/NorthernLightsCard.jsx`**
   - Added `data-testid="nl-status-pill"` to the header status-pill `<span>` — again pure test scaffolding, no visual/behavioral change. No other change to this file: the excellent/good/fair distinction is now fully carried by `auroraVisualStateTokens()`'s own return value, so the card's render logic needed nothing else.

No change to `auroraScoring.js`, `auroraDisplaySelection.js`, `auroraDecisionClassify.js`, `auroraSeason.js`, `config/hazards.js`, the generic weather map's `colorForScore`/its legend, `App.jsx`, or `NorthernLightsLanding.jsx`.

## Tests — added/updated

1. **`src/lib/auroraBandPresentation.test.js`**: added "excellent is purple, visibly distinct from good's green," "good and fair keep their pre-existing colors unchanged," and a new `auroraBandShortLabelKey` describe block (dedicated short keys for excellent/good/fair, distinct from the long key; falls back to the long key for poor/very-poor/unknown without inventing copy).
2. **`src/lib/auroraVisualState.test.js`**: added an "excellent pill override" describe block — excellent gets its own `pillKey`/`pillClass`/`accentGlowClass`/`accentBarClass` (each asserted to contain `"purple"` and differ from good's); headline/body stay identical to good's; `auroraVisualState("excellent")` is still `GOOD`; every other band's tokens are unaffected by the override.
3. **`src/MapView.test.jsx`**: fixed the pre-existing hardcoded `"#16a34a"` marker-color assertion to `"#a855f7"`; added a legend test (scoped to the new `aurora-legend` testid via `within()`) proving the legend shows the short labels and never the long descriptive ones, while the long ones legitimately still appear in popups; added an accessible-name test proving Aurora markers carry `role="img"`/`aria-label="{name}: {band label}"` while ordinary weather-mode markers carry neither.
4. **`src/components/NorthernLightsCard.test.jsx`**: split the old single "excellent/good band -> GOOD visual state copy" test (which asserted the literal bug — `nlPillGood` for an excellent band) into two: one for `excellent` (asserts `nlPillExcellent`, asserts `nlPillGood` is absent, headline/body still `nlHeadlineGood`/`nlBodyGood`) and one for `good` (asserts `nlPillGood` unchanged). Fixed the default-fixture Free-guidance test (whose `BEST.band` is `"excellent"`) to expect `nlPillExcellent` instead of the now-incorrect `nlPillGood`. Added `nlPillExcellent`/`nlLegendExcellent`/`nlLegendGood`/`nlLegendFair` to the existing "real i18n copy exists, not just keys" key list.

No snapshot tests exist for these surfaces; no snapshot churn was introduced. No test was added that merely restates the literal color/key table without proving new behavior (e.g., the override tests specifically assert the *distinction* from good, not just "excellent has some pillKey").

## Regression / lint / build / diff-check

1. Targeted set: `npx vitest run src/lib/auroraBandPresentation.test.js src/lib/auroraVisualState.test.js src/MapView.test.jsx src/components/NorthernLightsCard.test.jsx src/components/NorthernLightsMap.test.jsx src/pages/NorthernLightsLanding.test.jsx src/lib/auroraScoring.test.js src/lib/auroraDisplaySelection.test.js` → **8 files, 145 tests passed**. `auroraScoring.test.js`/`auroraDisplaySelection.test.js` (the explicit no-behavioral-drift regressions the approved prompt names) passed unmodified — their expectations were not touched.
2. Full suite: `npm test -- --run` → **109 files, 1406 tests passed** (up from 1394 before this ticket — +12 net new tests across the four updated/added test blocks above). No flakes.
3. `npm run lint` → exit 0, no output.
4. `npm run build` → succeeded, same pre-existing chunk-size advisory, no new errors.
5. `git diff --check` → **flags trailing-whitespace-shaped warnings on every added/modified line inside `src/MapView.jsx` specifically** — this is a pre-existing, file-level condition, not a real whitespace defect introduced here: `src/MapView.jsx` is already stored in git at `HEAD` with **literal CRLF line endings** (verified byte-for-byte: `git show HEAD:src/MapView.jsx` is 100% `\r\n`, 0 lone `\n`), unlike most of this repo's other files (which are LF-stored, with autocrlf converting on checkout — visible as the separate, purely informational "LF will be replaced by CRLF" notices for every *other* file this ticket touched). Because this file has no `.gitattributes` entry declaring its line-ending policy, git's default whitespace rules treat the file's own literal `\r` bytes as trailing whitespace on any line git has to re-render as "added." This exact risk was already flagged in Ticket 398's own `cc-report.md` ("MapView.jsx was not touched by this ticket... its own pre-existing CRLF behavior, noted as a risk in the approved prompt, was never a factor") — 414 is the first ticket in this session to actually edit `MapView.jsx`, so the risk is realized here. Verified there is no *genuine* trailing space/tab in any added line by stripping the file's own `\r` first and re-checking: `git diff -- src/MapView.jsx | grep '^+' | grep -v '^+++' | sed 's/\r$//' | grep -nE '[ \t]+$'` → zero matches. All other touched files show only the pre-existing informational LF→CRLF autocrlf notice, zero real errors.

## Real-browser verification (evidence retained)

Read `useAuroraDecision.js`/`auroraDecisionClassify.js` before writing the stub — `POST /api/aurora-decision` with `{evening, locationIds}`, response body shape `{ok, status, best, alternatives, excluded, warnings, auroraCache, viewingWindow}` (matching `NorthernLightsCard.test.jsx`'s own `successBody()` fixture, not a hand-built shape).

Script: `outputs/ticket-414-aurora-colors-evidence/verify-aurora-colors.cjs`. Fixture: one deterministic response with `best` = excellent, `alternatives` = [good, fair] (so all three qualifying bands are present simultaneously — status pill, qualifying list, map markers, and legend all exercised in one fixture). `devPro=true` (localStorage) to reach the Pro map/legend/details view; real Chromium, real route stubs (not a hand-built mock component). Ran at 390×844 (mobile) and 1280×900 (desktop), IS+light and EN+dark, per the approved prompt's exact matrix.

Results (`results.json`, all 4 fixtures identical in shape):
- `pillText`: `"Frábær skilyrði"` (IS) / `"Excellent conditions"` (EN) — never `"Góð skilyrði"`/`"Good conditions"`.
- `pillClass` contains `bg-purple-400/15 text-purple-200 ring-1 ring-inset ring-purple-400/40` — purple, not emerald.
- `legendText`: `"…FrábærGóðSæmileg"` (IS) / `"…ExcellentGoodFair"` (EN) — the short labels, and (confirmed separately, see MapView.test.jsx above) never the long ones.
- `noHorizontalOverflow: true` and `pillNoOverflow: true` on all four fixtures — no overflow at either viewport.
- Screenshots additionally confirm visually: the map marker for the excellent location renders purple with a white/dark ring (matching the existing selected-marker treatment, unchanged), the legend swatch order/colors match (purple/green/yellow), the qualifying list still shows the long descriptive labels ("Frábærar aðstæður til að sjá norðurljós" / "Excellent viewing conditions"), and the generic weather map's own separate legend/palette ("Good/Fair/Rough", green/yellow/red) two sections below is completely unaffected — confirming isolation from `colorForScore`.

Evidence retained under `outputs/ticket-414-aurora-colors-evidence/`: `verify-aurora-colors.cjs` (reproducible script), `results.json`, and 8 screenshots (`01`–`04` × collapsed/expanded).

Dev server (port 5174, started for this recheck) stopped after the run. A pre-existing, unrelated process on port 5173 (predates this session, `Access is denied` on stop, as noted in prior tickets) was left alone.

## Scope confirmation

`git status --short` after all edits: `docs/ai/CURRENT.md` (workflow), `src/MapView.jsx`, `src/MapView.test.jsx`, `src/components/NorthernLightsCard.jsx`, `src/components/NorthernLightsCard.test.jsx`, `src/i18n/translations.northernLights.js`, `src/lib/auroraBandPresentation.js`, `src/lib/auroraBandPresentation.test.js`, `src/lib/auroraVisualState.js`, `src/lib/auroraVisualState.test.js` (modified); `docs/ai/tasks/ticket-414/`, `outputs/ticket-414-aurora-colors-evidence/` (new). Exactly the file set the approved prompt scoped — no `auroraScoring`, threshold, ranking, candidate-selection, season, decision-classification, forecast, entitlement, checkout, analytics, Weather Voice/Tjaldur, or generic-map-color file was touched.

## Confirmation

`docs/ai/CURRENT.md` updated: `Stage: CC_COMPLETE`, CC report path now populated (this file). **Not committed. Not pushed. Not deployed. No GitHub issue closed.**
