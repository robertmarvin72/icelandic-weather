# Ticket 414 — Distinguish Northern Lights conditions

## Ripley — Initial prompt, Round 1 (2026-09-12)

Review material only. Jonesy: append APPROVED or REVISE. Not an execution prompt until approved and referenced by CURRENT.md.

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/414 — OPEN when read. Owner requests clearer Aurora colors and shorter legend labels, without scoring/threshold/ranking changes or module redesign.

### Audit and current implementation

Read AGENTS.md, CLAUDE.md, docs/ai/README.md and CURRENT.md. Confirm the current data flow before edits. Existing entrypoints are NorthernLightsCard on homepage and its landing-page variant; NorthernLightsMap lazily loads MapView with mode="aurora". Preserve that lazy-loading and existing map eligibility/Pro gating.

Verified in source:
- src/lib/auroraBandPresentation.js owns five canonical band colors and long translation keys. Excellent is #16a34a, good #22c55e, fair #facc15; poor orange and very-poor red. Existing fallback is fair.
- src/MapView.jsx uses auroraBandColor for individual markers, cluster presentation and legend. Legend currently uses the same long labels as popups/list text.
- src/lib/auroraVisualState.js groups excellent and good into the GOOD display state, with emerald pill/glow/bar tokens and shared copy. This grouping also controls other display behavior: do not alter its behavioral mapping merely to recolor a badge.
- NorthernLightsCard derives resultBand from displayed qualifying locations or bestAvailable and passes auroraVisualStateTokens(resultBand) to its header. List labels read canonical bands. Missing/unknown visual state has a deliberate neutral fallback, distinct from the map helper's existing fair fallback.
- src/i18n/translations.northernLights.js contains both IS and EN labels. Generic weather MapView mode has a separate score palette.

### Required change

1. Use excellent -> clearly purple, good -> green, fair -> yellow consistently on Aurora category-bearing surfaces. Keep good #22c55e and fair #facc15; choose a visibly distinct purple (start with #a855f7 and validate on actual map tiles). Keep poor/very-poor and unknown behavior unchanged. Maintain a shared semantic source of truth, not independent hardcoded palettes per consumer.
2. Map markers, Aurora clusters that already represent a selected band, and legend must use the same category color. Preserve cluster band-selection logic, ordering, click behavior and generic map presentation; do not introduce a new cluster ranking algorithm.
3. Under the existing localized legend heading, show IS exactly Frábær / Góð / Sæmileg and EN Excellent / Good / Fair. Add dedicated short-label translation keys/helper if needed; preserve descriptive band labels in popups and lists where their context is useful. Preserve which bands the legend currently shows rather than expanding eligibility or inventing levels.
4. Audit actual Northern Lights category-bearing badges/accents on homepage and landing variant. An excellent result must not retain a green category badge because the display grouping merges it with good. Introduce a narrow canonical-band presentation override for excellent (purple pill/glow/bar where those denote result status), keeping auroraVisualState(excellent) == GOOD and preserving headline/body/CTA eligibility behavior. Give the excellent status pill an accurate localized excellent label rather than purple paired with a merely good label. Keep good green and fair yellow-family status treatments, with readable text/tinted backgrounds; semantic hue consistency does not require identical foreground/background hexes. Do not recolor generic action buttons, NEW badges or unrelated brand accents as if they were condition indicators.
5. Preserve text alternatives: visible legend labels; truthful popup/list/status text; usable accessible names for map markers where supported by the existing Leaflet icon pattern. Do not use color alone to convey excellent/good/fair. Audit keyboard focus/marker labeling and add only the narrow missing category label if required, not a map accessibility redesign. Keep translated user-facing copy in i18n.
6. Validate the colors on real mobile/desktop map tiles and the existing dark-blue card. Check both app themes on supported surfaces. Keep existing layout, decision copy (apart from precise status label), map controls and card hierarchy.

### Scope and safety boundaries

Presentation only: expected files are auroraBandPresentation.js, auroraVisualState.js, MapView.jsx, translations.northernLights.js, narrowly necessary NorthernLightsCard code, and relevant tests/workflow records. Follow existing JS/JSX patterns; no dependencies, backend, TypeScript or direct Leaflet import into lazy wrappers.

No auroraScoring, thresholds, canonical bands, ranking, candidate selection, season logic, decision classification, forecast data, entitlement/Free-Pro gating, checkout, analytics, Weather Voice or Tjaldur changes. No new severity level. No changes to ordinary weather map colorForScore or its legend. Differentiate canonical-band presentation from grouped visual-state behavior explicitly in the pre-edit audit/report.

STOP and report if a requirement would require changing ranking/scoring/selection, entitlement or the underlying band contract, or broad module redesign. Routine presentation token/translation adjustments within this scope do not need another permission request. No commit, push, deploy or GitHub issue closure.

### Validation and acceptance

- Add focused assertions to existing presentation/map/card tests where they prove the requested new behavior: excellent purple vs good green, marker/legend shared mapping, short IS/EN legend labels without losing descriptive popup labels, excellent badge override with unchanged GOOD behavioral grouping, fair/poor/unknown fallbacks and generic-map isolation. Avoid snapshot churn or tests that only duplicate a literal table.
- Run affected auroraBandPresentation, auroraVisualState, MapView, NorthernLightsMap/Card and landing-variant/wiring tests as applicable. Run existing auroraScoring and auroraDisplaySelection regressions to confirm no unintended behavioral change; do not rewrite their expectations to accommodate presentation work. Run lint/build and git diff --check.
- Browser-check a deterministic fixture containing excellent, good and fair at mobile (~390px) and desktop (~1280px), including legend and status badge, IS/EN and supported light/dark themes. Read useAuroraDecision response parsing before stubbing; use actual components and route shapes, not a hand-built mockup. Retain screenshots and a short reproducible procedure/script under outputs/ticket-414-aurora-colors-evidence/. Confirm colors and short labels are readable and no overflow appears. If browser execution is unavailable, explicitly report that limitation instead of claiming visual QA.
- Report exact changed files, semantic palette, category-bearing surfaces audited, tests/commands/results and retained evidence in docs/ai/tasks/ticket-414/cc-report.md. Separate checks actually run from inferred results.

After Jonesy approval and the owner's execution handoff, CC must follow READY_FOR_CC -> CC_IN_PROGRESS -> CC_COMPLETE and populate the report pointer. Preserve workflow history. Jonesy reviews the result and Ripley performs final assessment.

## Jonesy review — Initial prompt, Round 1 (Initial prompt tilbúið)

**Verdict: APPROVED**

### Verification against live source

Read `auroraBandPresentation.js`, `auroraVisualState.js`, `MapView.jsx`, `NorthernLightsCard.jsx`, `NorthernLightsMap.jsx`, and `translations.northernLights.js` directly. Every "Verified in source" claim in the prompt checks out exactly:

- `auroraBandPresentation.js`'s `AURORA_BAND_COLORS`: `excellent: #16a34a`, `good: #22c55e`, `fair: #facc15`, `poor: #f97316` (orange), `very-poor: #b91c1c` (red), default fallback `"fair"` — matches the prompt's description precisely.
- `auroraVisualState.js`'s `BAND_TO_VISUAL_STATE` maps both `excellent` and `good` to `AURORA_VISUAL_STATES.GOOD`, whose token set uses emerald `pillClass`/`accentGlowClass`/`accentBarClass` — confirms the grouping and shared emerald styling. Unknown/missing bands fall through the `??` to `NEUTRAL`, genuinely distinct from `auroraBandPresentation.js`'s own `"fair"` default — two independent, deliberately different fallbacks, exactly as claimed.
- `MapView.jsx` calls `auroraBandColor()` at three points — individual markers (line 369), cluster `iconCreateFunction`'s best-band selection (line 258, via a `BAND_RANK` comparison, unchanged by this ticket), and the legend (line 511) — all through the same shared function, so a single palette change propagates consistently everywhere. The legend (lines 504-516) currently iterates exactly `["excellent", "good", "fair"]` and renders `t(auroraBandLabelKey(band))` — the identical long label used in popups (line 407) and the all-poor list (line 537). No other file in `src/` references `auroraBandColor`/`AURORA_BAND_COLORS`/`auroraVisualStateTokens` outside the five files (plus their own tests) the prompt already scopes.
- `NorthernLightsCard.jsx`: `resultBand` is `qualifyingLocations[0]?.band` when qualifying, else `bestAvailable?.band` (lines 239-243), and `auroraVisualStateTokens(resultBand)` feeds the header pill (line 244). Confirmed the concrete consequence this ticket exists to fix: today, an `excellent` result and a `good` result resolve to the exact same token object — same emerald color AND the literal text "Good conditions" / "Góð skilyrði" (`nlPillGood`, confirmed in `translations.northernLights.js`) — an excellent night is currently mislabeled as merely good, not only miscolored.
- `translations.northernLights.js` has no existing short-label keys for the legend — only the long `nlBandExcellent`/`nlBandGood`/`nlBandFair` (`"Excellent viewing conditions"` / `"Frábærar aðstæður til að sjá norðurljós"`, etc.) which are shared with popups/lists — so requirement 3's ask for new dedicated short-label keys is additive, not a rename of anything already in use elsewhere.

### Scope discipline

The expected-file list (`auroraBandPresentation.js`, `auroraVisualState.js`, `MapView.jsx`, `translations.northernLights.js`, narrowly necessary `NorthernLightsCard.jsx` code, tests) is confirmed complete by the grep above — nothing else in the codebase touches these shared helpers, so there's no unaccounted-for consumer this scope would miss or that would need touching later. The STOP list correctly excludes `auroraScoring`/thresholds/ranking/candidate-selection/season logic/decision classification/entitlement/checkout/analytics/Weather Voice — none of which this ticket's actual verified claims touch. Requirement 4's design is architecturally sound: it keeps `auroraVisualState(excellent) === GOOD` (so CTA/eligibility/details-toggle behavior, which reads that grouping, is untouched) while asking for a narrow presentation-only override at the render/token-selection point so the pill's color and label can differ for `excellent` specifically — correctly separating "what state governs behavior" from "what the badge displays," which is exactly the kind of boundary this session has flagged as a risk in other tickets when it wasn't kept explicit.

### Coverage

The six required-change items map cleanly onto the issue's stated ask (excellent→purple/good→green/fair→yellow consistency, shared marker/cluster/legend color, short legend labels without losing descriptive text elsewhere, the excellent-badge color-and-label fix, text-alternative/accessibility preservation, and real-device/theme validation), and the validation section requires exactly the kind of independent evidence (real browser check across viewports/languages/themes, retained screenshots and a reproducible script under `outputs/ticket-414-aurora-colors-evidence/`, explicit regression runs of `auroraScoring`/`auroraDisplaySelection` to prove no behavioral drift, and "report actually-run checks separately from inferred results") that this session's history shows actually catches false completion claims. Nothing here would need a runtime/data-layer change to satisfy — a good sign for a presentation-only ticket staying presentation-only.

### Conclusion

**APPROVED.** Every source claim is accurate, the shared-color-source-of-truth architecture makes the requested consistency easy to deliver correctly, and the excellent/GOOD distinction between visual-state grouping (must stay unchanged) and rendered badge (must be overridden) is drawn precisely enough that CC has no room to quietly touch the eligibility logic while "just" recoloring a pill. Proceed as normal: Róbert's "Prompt approved" moves `CURRENT.md` to `READY_FOR_CC`.
