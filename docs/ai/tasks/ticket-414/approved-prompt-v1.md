# Ticket 414 — Approved prompt v1

Approved by Jonesy in Initial prompt, Round 1. Execute only after the owner's Prompt approved handoff, with CURRENT.md at READY_FOR_CC and referencing this file. Follow docs/ai/README.md: set CC_IN_PROGRESS before implementation, write the report, then set CC_COMPLETE. This approved file remains immutable.

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
