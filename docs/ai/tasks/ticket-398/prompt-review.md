# Prompt Review — Ticket 398

## Round 1 — Ripley initial prompt

Implement GitHub issue #398, **UX: Gefa norðurljósaspánni sérstakt sjónrænt auðkenni**, as a focused visual and information-hierarchy redesign of the existing `NorthernLightsCard` produced by Tickets 392 and 397.

The card must become a recognizable “evening sky” feature surface in both light and dark mode while remaining visibly secondary to `HomeDecisionCard`. Its canonical Aurora result—not decorative darkness—must determine status text, status color, emphasis, CTA truthfulness, and which details are available.

The mockup discussed with the issue is a directional reference, not a pixel-perfect specification: a dark blue/teal rounded surface, small Aurora icon/title, compact status pill, one large result headline, one supporting sentence, up to two reason tiles, one primary action, and an optional subordinate explanation affordance. The screenshot is not stored as a durable repository artifact; implement from the explicit rules below and the live design system, never from a guessed local clipboard path.

### 1. Mandatory preflight audit

Before editing, read and inspect:

- GitHub issue #398;
- Ticket 397's approved prompt, CC report, result review, and all changed files;
- Ticket 392's approved prompt/result review and the bounded six-ID disclosure exception;
- `NorthernLightsCard.jsx` and its full test suite;
- `auroraDisplaySelection.js`, `auroraBandPresentation.js`, `auroraDecisionClassify.js`, and their tests;
- `NorthernLightsMap.jsx`, Aurora mode in `MapView.jsx`, and relevant tests;
- `HomeDecisionCard`, `RoutePlannerCard`, homepage placement in `App.jsx`, and comparable feature-card styling;
- Northern Lights translations, feature flags/config precedent, analytics, checkout attribution, theme/dark-mode conventions, motion/accessibility conventions, and icon precedent already available in the repository.

In `cc-report.md`, document the audited result-state matrix, current Free/Pro disclosure behavior, available canonical reason codes, chosen existing icon approach, and exact files changed.

### 2. Hard scope and canonical invariants

This ticket changes visual presentation and localized copy only.

- Do not change Ticket 1–3 cache/provider/API/scoring/ranking/bands/reasons/flags.
- Do not change the six-location roster, request body/key/cache, seasonality, result classification, candidate filtering, map-visibility rule, or tier-independent computation established by Tickets 392/397.
- Continue using `selectAuroraDisplay` for qualifying/all-poor/list/map decisions and `auroraBandPresentation` as the shared canonical band presentation source.
- Do not derive a new score, probability, “chance,” verdict, or weather interpretation in React.
- Free/Pro gating remains presentation-only. Free must not receive names, coordinates, numeric scores, reasons, ranking, map content, or hidden accessible content that Ticket 392/397 gate from it.
- Do not create a second stay/move/consider recommendation or visually overpower the canonical `HomeDecisionCard`.
- No backend, new route, new dependency, new design system, or broad homepage redesign.

If the requested hierarchy cannot be built truthfully from canonical `band`, `reasons`, `flags`, freshness, partial/exclusion state, and the existing display model, **STOP before implementation** and identify the missing contract rather than inventing data.

### 3. One dark feature surface in both themes

Render the entire Northern Lights card as a dark evening-sky surface in both light and dark mode, including loading, success/partial, all-poor, unavailable, no-darkness, transport-error, and contract-defect states.

- Use existing Tailwind utilities and repository tokens/patterns. Do not add image assets, canvas effects, custom shader/animation systems, or dependencies.
- Base surface: deep navy/blue-green, high-contrast light text, generous but compact spacing, and the existing rounded-card language.
- A restrained Aurora glow/gradient may appear as a decorative layer. It must be subtle, non-interactive, `aria-hidden`, unable to obscure content, and unnecessary for understanding state.
- Light mode: slightly stronger shadow/separation from the light page background.
- Dark mode: gentler shadow plus a slightly lighter border so the card does not merge into the page.
- The card's internal identity stays substantially consistent across themes; do not create a white “light-mode Aurora card.”
- All decorative layers must remain clipped within the rounded surface and must not cause horizontal overflow on small screens.

The dark shell is feature identity only. It must not imply favorable conditions. Canonical status text, pill, accent, and headline carry the result meaning.

### 4. Explicit canonical visual-state model

Create or extend a small pure presentation helper so JSX does not scatter band-to-tone/headline decisions. It may group existing canonical bands for display only:

- `excellent` and `good` → `good` visual state;
- `fair` → `fair` visual state;
- `poor` and `very-poor` → `poor` visual state.

This grouping must not modify the canonical band, list eligibility, map behavior, analytics band, or scoring semantics. Preserve the precise canonical band label wherever that precision is currently disclosed.

For each visual state derive translation keys and styling tokens for:

- compact status pill;
- primary headline;
- supporting sentence;
- restrained accent/glow treatment;
- truthful primary-action label/visibility.

Required intent:

- Good: green Aurora accent; confident but non-guaranteeing headline such as “Góð skilyrði í kvöld”; Pro CTA such as “Sjá bestu staðina” when qualifying details exist.
- Fair: muted amber/yellow-green accent; hedged headline such as “Gæti sést með smá heppni”; CTA may open useful qualifying details but must remain hedged.
- Poor/all-poor: calm dark surface with muted gray/red or subdued warm accent; headline such as “Lítil von í kvöld”; no ranking/map teaser or CTA implying a worthwhile place was found.

Do not use “líkur/chance” as a numeric or probabilistic claim. Natural phrases such as “lítil von” or “gæti sést” are qualitative display copy grounded in the canonical band, not percentages or guarantees.

Unknown/missing bands must use a neutral safe treatment or the existing contract-defect/unavailable semantics; they must never silently default to a favorable state. **STOP** if the current helper's fallback would make an unknown band look fair/good and cannot be corrected locally without changing canonical contracts.

### 5. Information hierarchy and content

For usable `success`/`partial` outcomes, order the collapsed card content as:

1. Header row: existing Aurora icon approach + localized title + temporary “New/Nýtt” badge; canonical status pill aligned opposite when space permits.
2. One large result headline.
3. One concise supporting sentence.
4. Up to two concise Pro-only reason summaries/tiles when canonical reasons are available and disclosure permits them.
5. One primary action for useful details/map, with any explanation affordance visually subordinate.
6. Compact stale/partial/exclusion notices that do not interrupt the headline.

On small screens the header/pill may wrap cleanly and reason tiles stack; on wider screens reason tiles may form two columns. Do not force desktop proportions onto mobile.

#### Reason summaries

- Never fabricate measurements or infer provider fields outside the canonical result.
- Audit the actual canonical reason-code guarantees and map only existing reason codes into at most two user-facing summaries, preferably activity and sky/cloud visibility.
- Preserve a deterministic priority/order in a pure helper and test it.
- If only one supported reason exists, show one; if none exist or the user is Free, omit the tiles without leaving empty boxes.
- Any detailed reasons already available behind Pro disclosure may remain in expanded content, but avoid repeating the same two summaries verbatim without added value.
- Do not expose Pro reason data to Free through DOM, accessibility labels, CSS-hidden markup, attributes, or analytics.

#### Primary and secondary actions

- Retain one visually dominant action only.
- For Pro qualifying results, that action toggles the existing details area containing qualifying locations and, when allowed by Ticket 397, the map. Its label must match good/fair tone and switch accessibly when expanded.
- For Free qualifying results, retain the existing upgrade/login/checkout path and `northern_lights_card` attribution; copy must truthfully offer access to location/reason detail without promising a sighting.
- For all-poor, no action may imply a good/better place exists. Preserve Ticket 397's no-Free-upgrade behavior. Pro may retain a subordinate details disclosure for the single “best of poor” location only if it remains clearly poor and does not become the primary visual CTA.
- Do not add a dead “How is this calculated?” link. Reuse an existing truthful explanation surface if the audit finds one; otherwise omit it. Creating a new route/modal/content system is out of scope.
- Keep existing `aria-expanded`, `aria-controls`, focus visibility, state persistence, and analytics semantics correct after restyling.

### 6. Non-success states and data-age treatment

Every state uses the same dark feature shell but a neutral/non-favorable treatment:

- Loading: stable-height dark skeleton/status, no green success glow, no premature CTA or paywall.
- No darkness: calm natural state, not an error and not poor Aurora scoring.
- Domain unavailable/transport error: neutral copy and existing real retry behavior; no result/status color that implies good/fair/poor and no upgrade remedy.
- Contract defect: preserve safe generic copy, observability, and retry constraints; never expose unknown IDs.
- Partial: compact limitation badge/note that composes with the usable result.
- Stale usable data: move the age into a compact, accessible low-emphasis badge/note near metadata/status. It must remain visible to Free and Pro and must still include the human-readable age; do not hide, suppress, or misrepresent stale data merely to clean up the design.
- Stale + partial must display both truths simultaneously without either taking over the primary headline.

Do not make stale data “inactive” unless that behavior already follows the canonical freshness classifier. Never invent a new client-side expiration threshold.

### 7. Temporary “New” badge

Add a localized `New/Nýtt` badge as a deliberately temporary presentation flag:

- Isolate it behind one named client-side config constant or existing feature-flag mechanism; do not scatter date checks in JSX.
- Default it on for this release and record a clear removal/review date of **2026-09-30** next to the flag.
- Do not use wall-clock logic that causes nondeterministic rendering/tests. The badge is removed by changing the single flag during the review window, not by silently changing UI at runtime.
- The badge is decorative/supporting copy, not an analytics event and not a Pro feature.

If the repository already has a stronger established temporary-badge convention, use it and document the equivalent removal rule.

### 8. Copy and i18n

Add/update real IS and EN translations in the existing Northern Lights translation module. No hardcoded user-facing strings in JSX, helpers, fallbacks, badges, status pills, buttons, notices, or accessible labels.

Copy must be calm, practical, concise, and internally consistent:

- headline, status pill, body, accent, and CTA must all express the same visual state;
- good must not guarantee visibility;
- fair must remain hedged;
- poor must not advertise a recommended location;
- no-darkness/unavailable/error must not be phrased as poor conditions;
- use “Aurora/Northern Lights conditions,” never generic campsite-weather labels;
- retain the national darkness-window caveat and existing truthfulness rules in expanded details.

Use natural English rather than mechanical translation. Remove obsolete copy only after confirming it has no remaining live consumer.

### 9. Analytics and gating preservation

This visual redesign must not change event meaning:

- `northern_lights_card_viewed` remains exact-once per meaningful identity;
- details/ranking/map events fire only when their actual existing surfaces are exposed, per Ticket 397;
- locked Free teaser is never ranking/map viewed;
- upgrade attribution remains `northern_lights_card` and semantically separate from analytics `source`;
- visual-state changes, theme changes, glow layers, badge rendering, language changes, and rerenders must not create duplicate events;
- do not add an event solely for the “New” badge or decorative exposure;
- no PII, names, coordinates, raw provider payloads, or detailed reason content in analytics.

### 10. Accessibility and responsive requirements

- Meet WCAG AA contrast for text, pill labels, buttons, focus rings, warnings, and reason tiles against the dark surface in both themes.
- Do not rely on glow or color alone; status pill and headline must carry explicit text.
- Decorative icon/glow is hidden from assistive technology unless the icon has independent meaning; avoid duplicated spoken labels.
- Preserve semantic heading order, live-region behavior, keyboard operation, visible focus, and reduced-motion behavior.
- Avoid large live-region re-announcements caused by expanding details; audit whether the current broad `role="status"` wrapper should be narrowed without changing outcome semantics.
- At approximately 320px width, content must not overflow, status/title must wrap sensibly, CTA remains reachable, and reason tiles stack in reading order.
- At tablet/desktop widths, retain compact hierarchy; do not turn the card into a dashboard.
- Expanded list/map remain below primary content and the list remains the accessible primary alternative to the map.

### 11. Required tests

Add/update targeted tests using real Ticket 3-shaped fixtures for at least:

1. Pure mapping of all five canonical bands into good/fair/poor visual states, including neutral safe handling of unknown input.
2. Status pill, headline, supporting copy, accent hook/class, and CTA semantics agree for good, fair, and poor states in both IS and EN.
3. The card keeps the dark feature-surface identity for light and dark themes, with theme-specific border/shadow treatment and no white light-mode card.
4. Good/fair Pro qualifying results show one primary details action; expanded content preserves Ticket 397 list/map rules and canonical order.
5. Free qualifying presentation leaks no identity/score/reasons/coordinates/map and retains correct upgrade attribution.
6. All-poor Free has no misleading upgrade CTA; all-poor Pro does not promote the best-of-poor disclosure into a recommendation.
7. Reason-summary selection is deterministic, capped at two, based only on supported canonical reason codes, absent for Free/unsupported input, and not empty-placeholder UI.
8. Loading, no-darkness, unavailable, transport, and contract-defect states use neutral dark-shell treatment and preserve retry/no-retry semantics.
9. Fresh, stale, partial, and stale+partial presentation remains truthful; human-readable stale age stays visible to both tiers without dominating the headline.
10. `New/Nýtt` is controlled by the single isolated flag, complete in IS/EN, and creates no analytics event.
11. Existing details/ranking/map/card analytics remain exact-once and gated on real exposure across rerender, language, theme, and expansion changes.
12. Accessibility assertions cover explicit textual status, DOM order, `aria-expanded`/`aria-controls`, no duplicate icon label, visible focus-class presence, and no Free hidden-data DOM.
13. Responsive structure has no fixed-width dependency or overflow-prone layout; reason tiles and header have tested stacking/wrapping hooks/classes.
14. Existing Ticket 397 selection/map tests, normal `MapView` behavior, seasonality, request/cache, and homepage placement remain green.

Do not weaken tests, lint, coverage, or existing non-disclosure assertions.

### 12. Visual verification and validation

Use the repository's available browser/test tooling to inspect deterministic fixtures for at least:

- good, fair, and all-poor usable results;
- loading and one neutral unavailable/error state;
- Free and Pro;
- Icelandic and English;
- light and dark page themes;
- approximately 320px mobile and a representative desktop width;
- collapsed and expanded Pro qualifying content.

Verify hierarchy, contrast, wrapping, overflow, focus, dark-shell consistency, restrained glow, stale/partial treatment, and that the card remains secondary to `HomeDecisionCard`. Capture screenshots or document exact inspected fixtures/viewports in `cc-report.md`. If deterministic browser injection is not possible without production hooks or broad infrastructure, **STOP before implementation** and report the smallest safe fixture seam needed; component DOM tests alone are not sufficient evidence for this explicitly visual ticket.

Run and record exact results for:

- new visual-state/reason/config helper tests;
- `NorthernLightsCard.test.jsx`, `NorthernLightsMap.test.jsx`, and Aurora/normal `MapView` tests;
- relevant `auroraDisplaySelection`, `auroraBandPresentation`, classifier, seasonality, request/cache, feature-gating, analytics, checkout-attribution, homepage, and i18n tests;
- full Vitest suite;
- `npm run lint`;
- `npm run build`;
- `git diff --check`, accounting explicitly for the repository's existing CRLF behavior in `MapView.jsx` without introducing new semantic trailing whitespace.

### 13. Acceptance criteria

- Northern Lights has a distinctive, polished dark evening-sky surface in both light and dark mode.
- Light/dark surroundings differ appropriately while the card's identity stays consistent.
- Every usable canonical band produces one explicit, coherent good/fair/poor visual state; darkness alone never implies quality.
- One large headline, one supporting sentence, at most two truthful Pro-only reason summaries, and one primary action establish a clear hierarchy.
- Good/fair CTA copy is truthful; poor/all-poor never suggests a worthwhile location was found.
- Loading, no-darkness, unavailable/error, stale, partial, and stale+partial states remain distinct, readable, and truthful within the new surface.
- The temporary localized badge has one removal flag and a documented 2026-09-30 review date.
- Ticket 397 qualifying/all-poor/list/map rules and canonical map consistency remain unchanged.
- Ticket 392 Free non-disclosure, gating, request identity, and checkout attribution remain unchanged.
- The feature remains below and visually secondary to `HomeDecisionCard`.
- IS/EN, Free/Pro, light/dark, mobile/desktop, accessibility, reduced motion, analytics, tests, lint, build, diff check, and deterministic visual verification pass.

### 14. Out of scope and STOP conditions

Out of scope: Ticket 1–3 changes, new Aurora scoring/ranking/bands/reasons, candidate discovery/roster changes, Ticket 397 filtering/map-rule changes, backend/API/database, new routes/modals/content systems, new libraries, image-generation assets, general MapView redesign, homepage reordering, canonical stay/move card redesign, checkout/payment changes, notifications, future-night planning, light-pollution modeling, TypeScript/`.tsx`, commit, or push.

STOP and report before implementation if:

- truthful design requires data or semantics absent from the canonical response;
- unknown/malformed bands would be presented as favorable without a local safe fix;
- reason tiles require inventing or reinterpreting raw weather/provider data;
- the design would expose gated Pro content to Free;
- a second scoring/ranking/request path or Ticket 397 behavior change is required;
- a new dependency, backend, route/modal, broad shared-component redesign, or checkout change is required;
- deterministic visual verification requires a new production-only hook or disproportionate infrastructure;
- the feature would compete with or duplicate `HomeDecisionCard`'s canonical recommendation.

Default git safety applies: do not commit and do not push.

## Jonesy review — Round 1

**Verdict: REVISE**

Overall this is a strong, well-scoped prompt — the canonical-invariant boundaries (§2), the explicit STOP condition for map/scoring changes, and especially §12's decision to *require* real browser verification for an explicitly visual ticket (closing the "documented limitation" loophole CC used honestly but understandably in ticket-397) are all good, deliberate calls. Two concrete gaps found by checking the prompt's assumptions against the live source, plus one clarifying question, before this goes to CC.

### 1. "Existing Aurora icon approach" does not exist — verified against the repo

§1 (preflight) asks CC to audit and record "chosen existing icon approach," and §5 item 1 says the header row uses the "existing Aurora icon approach." I checked `src/components/icons/weather/` directly: it contains exactly `IconClearDay`, `IconClearNight`, `IconCloudy`, `IconFog`, `IconHail`, `IconHeavyRain`, `IconPartlyCloudyDay/Night`, `IconRain`, `IconSleet`, `IconSnow`, `IconThunderstorm`, `IconWind` — all generic weather icons, no Aurora/night-sky/sparkle icon. `package.json` does list `lucide-react` as a dependency, but I found no evidence it's actually used anywhere in these card components (none of `NorthernLightsCard.jsx`, `HomeDecisionCard.jsx` import it).

So the premise is false: there is no existing Aurora icon to reuse. Right now the prompt gives CC no fallback rule, unlike the parallel case in §5 ("Reuse an existing truthful explanation surface if the audit finds one; otherwise omit it"). Two risks if this isn't fixed: CC either fabricates a cc-report.md claim that an "existing approach" was reused when none exists (exactly the kind of narrative-vs-code mismatch Jonesy caught in ticket-396), or picks an icon library/approach on its own judgment with no guardrail. Please add an explicit fallback, e.g.: "If no Aurora-specific icon precedent exists (confirm by inspecting `src/components/icons/weather/`), either (a) add one simple icon following the existing hand-rolled SVG icon pattern in that folder, or (b) use a single already-installed `lucide-react` icon (e.g. Sparkles/Moon/Stars) — do not add a new icon dependency. State the choice and why in `cc-report.md`."

### 2. The existing band-presentation fallback would recreate the exact bug §4 warns against — confirmed, but fixable without a STOP

§4 says: "Unknown/missing bands must use a neutral safe treatment... **STOP** if the current helper's fallback would make an unknown band look fair/good and cannot be corrected locally." I read `src/lib/auroraBandPresentation.js` directly: it already has `const DEFAULT_BAND = "fair"`, and `auroraBandLabelKey`/`auroraBandColor` both fall back to it for any unrecognized band. Under this ticket's own grouping rules, `fair` maps to the "fair visual state" — a hedged-but-positive headline ("Gæti sést með smá heppni") and its own accent color. So the exact failure mode described is real today, not hypothetical.

This does not need a STOP, though — it's correctable entirely inside the *new* visual-state helper this ticket creates, without touching `auroraBandPresentation.js` (which ticket-397 already tested and which other call sites may depend on for its current fallback behavior). Please add one sentence making this explicit so CC doesn't either (a) silently inherit `auroraBandPresentation`'s "fair" default into the new visual-state mapping, reproducing the bug, or (b) mistakenly conclude a STOP is required: "The new visual-state helper's unknown/missing-band handling must be its own explicit case (e.g. a distinct neutral/unavailable-styled state), independent of `auroraBandPresentation.js`'s existing `DEFAULT_BAND` fallback — do not delegate to or inherit that fallback for this purpose."

### 3. Where does the specific best-location name live in the new collapsed hierarchy? (clarify, don't leave to judgment)

Today, Pro sees the exact best location name (`best.name`) immediately, uncollapsed — it's the single most actionable piece of information ("go here"). The new §5 hierarchy (header / headline / supporting sentence / reason tiles / primary action) doesn't say where — or whether — that name still appears before expanding details. The headline is explicitly generic tone copy ("Góð skilyrði í kvöld"), not location-specific, per §4's required intent examples.

If the supporting sentence is meant to carry the location name (e.g. "Camper Resort Reykjavík has the best conditions tonight"), please say so explicitly — otherwise a literal reading of §5 could ship a redesign where Pro's core "where to go" answer is one extra click behind the details toggle, which reads as a regression in usefulness even though it's a more polished surface. This is a product-intent call for Ripley/Róbert, not something CC should decide unprompted.

Please address 1 and 2 as required changes, and resolve 3 explicitly (either instruction is fine, just state it), then resubmit for Round 2.


---

## Round 2 — Ripley revised prompt

Implement GitHub issue #398, **UX: Gefa norðurljósaspánni sérstakt sjónrænt auðkenni**, as a focused visual and information-hierarchy redesign of the existing `NorthernLightsCard` produced by Tickets 392 and 397.

The card must become a recognizable “evening sky” feature surface in both light and dark mode while remaining visibly secondary to `HomeDecisionCard`. Its canonical Aurora result—not decorative darkness—must determine status text, status color, emphasis, CTA truthfulness, and which details are available.

The mockup discussed with the issue is a directional reference, not a pixel-perfect specification: a dark blue/teal rounded surface, small Aurora icon/title, compact status pill, one large result headline, one supporting sentence, up to two reason tiles, one primary action, and an optional subordinate explanation affordance. The screenshot is not stored as a durable repository artifact; implement from the explicit rules below and the live design system, never from a guessed local clipboard path.

### 1. Mandatory preflight audit

Before editing, read and inspect:

- GitHub issue #398;
- Ticket 397's approved prompt, CC report, result review, and all changed files;
- Ticket 392's approved prompt/result review and the bounded six-ID disclosure exception;
- `NorthernLightsCard.jsx` and its full test suite;
- `auroraDisplaySelection.js`, `auroraBandPresentation.js`, `auroraDecisionClassify.js`, and their tests;
- `NorthernLightsMap.jsx`, Aurora mode in `MapView.jsx`, and relevant tests;
- `HomeDecisionCard`, `RoutePlannerCard`, homepage placement in `App.jsx`, and comparable feature-card styling;
- Northern Lights translations, feature flags/config precedent, analytics, checkout attribution, theme/dark-mode conventions, motion/accessibility conventions, `src/components/icons/weather/`, and already-installed icon dependencies/usages.

In `cc-report.md`, document the audited result-state matrix, current Free/Pro disclosure behavior, available canonical reason codes, the verified absence/presence of an Aurora-specific icon precedent, the chosen icon approach, and exact files changed.

### 2. Hard scope and canonical invariants

This ticket changes visual presentation and localized copy only.

- Do not change Ticket 1–3 cache/provider/API/scoring/ranking/bands/reasons/flags.
- Do not change the six-location roster, request body/key/cache, seasonality, result classification, candidate filtering, map-visibility rule, or tier-independent computation established by Tickets 392/397.
- Continue using `selectAuroraDisplay` for qualifying/all-poor/list/map decisions and `auroraBandPresentation` as the shared canonical band presentation source.
- Do not derive a new score, probability, “chance,” verdict, or weather interpretation in React.
- Free/Pro gating remains presentation-only. Free must not receive names, coordinates, numeric scores, reasons, ranking, map content, or hidden accessible content that Ticket 392/397 gate from it.
- Do not create a second stay/move/consider recommendation or visually overpower the canonical `HomeDecisionCard`.
- No backend, new route, new dependency, new design system, or broad homepage redesign.

If the requested hierarchy cannot be built truthfully from canonical `band`, `reasons`, `flags`, freshness, partial/exclusion state, and the existing display model, **STOP before implementation** and identify the missing contract rather than inventing data.

### 3. One dark feature surface in both themes

Render the entire Northern Lights card as a dark evening-sky surface in both light and dark mode, including loading, success/partial, all-poor, unavailable, no-darkness, transport-error, and contract-defect states.

- Use existing Tailwind utilities and repository tokens/patterns. Do not add image assets, canvas effects, custom shader/animation systems, or dependencies.
- Base surface: deep navy/blue-green, high-contrast light text, generous but compact spacing, and the existing rounded-card language.
- A restrained Aurora glow/gradient may appear as a decorative layer. It must be subtle, non-interactive, `aria-hidden`, unable to obscure content, and unnecessary for understanding state.
- Light mode: slightly stronger shadow/separation from the light page background.
- Dark mode: gentler shadow plus a slightly lighter border so the card does not merge into the page.
- The card's internal identity stays substantially consistent across themes; do not create a white “light-mode Aurora card.”
- All decorative layers must remain clipped within the rounded surface and must not cause horizontal overflow on small screens.

The dark shell is feature identity only. It must not imply favorable conditions. Canonical status text, pill, accent, and headline carry the result meaning.

### 4. Explicit canonical visual-state model

Create or extend a small pure presentation helper so JSX does not scatter band-to-tone/headline decisions. It may group existing canonical bands for display only:

- `excellent` and `good` → `good` visual state;
- `fair` → `fair` visual state;
- `poor` and `very-poor` → `poor` visual state.

This grouping must not modify the canonical band, list eligibility, map behavior, analytics band, or scoring semantics. Preserve the precise canonical band label wherever that precision is currently disclosed.

For each visual state derive translation keys and styling tokens for:

- compact status pill;
- primary headline;
- supporting sentence;
- restrained accent/glow treatment;
- truthful primary-action label/visibility.

Required intent:

- Good: green Aurora accent; confident but non-guaranteeing headline such as “Góð skilyrði í kvöld”; Pro CTA such as “Sjá bestu staðina” when qualifying details exist.
- Fair: muted amber/yellow-green accent; hedged headline such as “Gæti sést með smá heppni”; CTA may open useful qualifying details but must remain hedged.
- Poor/all-poor: calm dark surface with muted gray/red or subdued warm accent; headline such as “Lítil von í kvöld”; no ranking/map teaser or CTA implying a worthwhile place was found.

Do not use “líkur/chance” as a numeric or probabilistic claim. Natural phrases such as “lítil von” or “gæti sést” are qualitative display copy grounded in the canonical band, not percentages or guarantees.

Unknown/missing bands must use a distinct neutral, unavailable-styled treatment; they must never silently default to a favorable state. The new visual-state helper must handle unknown/missing bands as its own explicit case, independent of `auroraBandPresentation.js`'s existing `DEFAULT_BAND = "fair"` fallback. Do not delegate to or inherit that fallback for visual-state selection, and do not change the Ticket 397 helper merely to solve this new presentation concern. This local neutral case is expected and does **not** trigger a STOP. **STOP** only if a neutral visual-state case cannot be implemented locally without changing canonical contracts.

### 5. Information hierarchy and content

For usable `success`/`partial` outcomes, order the collapsed card content as:

1. Header row: one audited Aurora-appropriate icon + localized title + temporary “New/Nýtt” badge; canonical status pill aligned opposite when space permits.
2. One large result headline.
3. One concise supporting sentence. For Pro qualifying results, this line must keep the exact canonical best-location name visible in the collapsed card (for example, “Best conditions tonight: {name}”), so the redesign does not hide the core “where” answer behind another click. Free and all-poor disclosure rules remain unchanged.
4. Up to two concise Pro-only reason summaries/tiles when canonical reasons are available and disclosure permits them.
5. One primary action for useful details/map, with any explanation affordance visually subordinate.
6. Compact stale/partial/exclusion notices that do not interrupt the headline.

On small screens the header/pill may wrap cleanly and reason tiles stack; on wider screens reason tiles may form two columns. Do not force desktop proportions onto mobile.

#### Icon choice

The live repository currently has generic hand-rolled weather SVG icons but no verified Aurora-specific icon. Confirm this during preflight. If no Aurora-specific precedent exists, choose exactly one bounded approach:

- add one simple decorative Aurora/night-sky icon following the existing hand-rolled SVG component pattern; or
- use one suitable icon from the already-installed `lucide-react` package (for example Sparkles, Moon, or Stars) without adding a dependency or introducing a new icon system elsewhere.

Prefer the smallest consistent option, keep it decorative/`aria-hidden` when the adjacent title already names the feature, and document the choice in `cc-report.md`. Do not claim an existing Aurora icon was reused when none exists.

#### Best-location disclosure

For Pro qualifying results, preserve today’s immediate usefulness: the exact canonical best-location name remains visible while the card is collapsed, in the supporting sentence or an equally prominent line directly under the result headline. It must come from `display.qualifyingLocations[0]`/the existing canonical best result, never a new selection. The primary action then reveals reasons, the qualifying list, and map where Ticket 397 permits them.

Free must not receive that name in rendered or accessible output. In all-poor Pro, keep Ticket 397’s optional best-of-poor identity behind the subordinate details disclosure; do not promote it into the collapsed headline/supporting sentence.

#### Reason summaries

- Never fabricate measurements or infer provider fields outside the canonical result.
- Audit the actual canonical reason-code guarantees and map only existing reason codes into at most two user-facing summaries, preferably activity and sky/cloud visibility.
- Preserve a deterministic priority/order in a pure helper and test it.
- If only one supported reason exists, show one; if none exist or the user is Free, omit the tiles without leaving empty boxes.
- Any detailed reasons already available behind Pro disclosure may remain in expanded content, but avoid repeating the same two summaries verbatim without added value.
- Do not expose Pro reason data to Free through DOM, accessibility labels, CSS-hidden markup, attributes, or analytics.

#### Primary and secondary actions

- Retain one visually dominant action only.
- For Pro qualifying results, that action toggles the existing details area containing qualifying locations and, when allowed by Ticket 397, the map. Its label must match good/fair tone and switch accessibly when expanded.
- For Free qualifying results, retain the existing upgrade/login/checkout path and `northern_lights_card` attribution; copy must truthfully offer access to location/reason detail without promising a sighting.
- For all-poor, no action may imply a good/better place exists. Preserve Ticket 397's no-Free-upgrade behavior. Pro may retain a subordinate details disclosure for the single “best of poor” location only if it remains clearly poor and does not become the primary visual CTA.
- Do not add a dead “How is this calculated?” link. Reuse an existing truthful explanation surface if the audit finds one; otherwise omit it. Creating a new route/modal/content system is out of scope.
- Keep existing `aria-expanded`, `aria-controls`, focus visibility, state persistence, and analytics semantics correct after restyling.

### 6. Non-success states and data-age treatment

Every state uses the same dark feature shell but a neutral/non-favorable treatment:

- Loading: stable-height dark skeleton/status, no green success glow, no premature CTA or paywall.
- No darkness: calm natural state, not an error and not poor Aurora scoring.
- Domain unavailable/transport error: neutral copy and existing real retry behavior; no result/status color that implies good/fair/poor and no upgrade remedy.
- Contract defect: preserve safe generic copy, observability, and retry constraints; never expose unknown IDs.
- Partial: compact limitation badge/note that composes with the usable result.
- Stale usable data: move the age into a compact, accessible low-emphasis badge/note near metadata/status. It must remain visible to Free and Pro and must still include the human-readable age; do not hide, suppress, or misrepresent stale data merely to clean up the design.
- Stale + partial must display both truths simultaneously without either taking over the primary headline.

Do not make stale data “inactive” unless that behavior already follows the canonical freshness classifier. Never invent a new client-side expiration threshold.

### 7. Temporary “New” badge

Add a localized `New/Nýtt` badge as a deliberately temporary presentation flag:

- Isolate it behind one named client-side config constant or existing feature-flag mechanism; do not scatter date checks in JSX.
- Default it on for this release and record a clear removal/review date of **2026-09-30** next to the flag.
- Do not use wall-clock logic that causes nondeterministic rendering/tests. The badge is removed by changing the single flag during the review window, not by silently changing UI at runtime.
- The badge is decorative/supporting copy, not an analytics event and not a Pro feature.

If the repository already has a stronger established temporary-badge convention, use it and document the equivalent removal rule.

### 8. Copy and i18n

Add/update real IS and EN translations in the existing Northern Lights translation module. No hardcoded user-facing strings in JSX, helpers, fallbacks, badges, status pills, buttons, notices, or accessible labels.

Copy must be calm, practical, concise, and internally consistent:

- headline, status pill, body, accent, and CTA must all express the same visual state;
- good must not guarantee visibility;
- fair must remain hedged;
- poor must not advertise a recommended location;
- no-darkness/unavailable/error must not be phrased as poor conditions;
- use “Aurora/Northern Lights conditions,” never generic campsite-weather labels;
- retain the national darkness-window caveat and existing truthfulness rules in expanded details.

Use natural English rather than mechanical translation. Remove obsolete copy only after confirming it has no remaining live consumer.

### 9. Analytics and gating preservation

This visual redesign must not change event meaning:

- `northern_lights_card_viewed` remains exact-once per meaningful identity;
- details/ranking/map events fire only when their actual existing surfaces are exposed, per Ticket 397;
- locked Free teaser is never ranking/map viewed;
- upgrade attribution remains `northern_lights_card` and semantically separate from analytics `source`;
- visual-state changes, theme changes, glow layers, badge rendering, language changes, and rerenders must not create duplicate events;
- do not add an event solely for the “New” badge or decorative exposure;
- no PII, names, coordinates, raw provider payloads, or detailed reason content in analytics.

### 10. Accessibility and responsive requirements

- Meet WCAG AA contrast for text, pill labels, buttons, focus rings, warnings, and reason tiles against the dark surface in both themes.
- Do not rely on glow or color alone; status pill and headline must carry explicit text.
- Decorative icon/glow is hidden from assistive technology unless the icon has independent meaning; avoid duplicated spoken labels.
- Preserve semantic heading order, live-region behavior, keyboard operation, visible focus, and reduced-motion behavior.
- Avoid large live-region re-announcements caused by expanding details; audit whether the current broad `role="status"` wrapper should be narrowed without changing outcome semantics.
- At approximately 320px width, content must not overflow, status/title must wrap sensibly, CTA remains reachable, and reason tiles stack in reading order.
- At tablet/desktop widths, retain compact hierarchy; do not turn the card into a dashboard.
- Expanded list/map remain below primary content and the list remains the accessible primary alternative to the map.

### 11. Required tests

Add/update targeted tests using real Ticket 3-shaped fixtures for at least:

1. Pure mapping of all five canonical bands into good/fair/poor visual states, plus an explicit neutral case for unknown/missing input that proves it does not inherit `auroraBandPresentation`'s `fair` fallback.
2. Status pill, headline, supporting copy, accent hook/class, and CTA semantics agree for good, fair, and poor states in both IS and EN.
3. The card keeps the dark feature-surface identity for light and dark themes, with theme-specific border/shadow treatment and no white light-mode card.
4. Good/fair Pro qualifying results keep the exact canonical best-location name visible while collapsed and show one primary details action; expanded content preserves Ticket 397 list/map rules and canonical order. Free and all-poor collapsed states must not reveal that identity.
5. Free qualifying presentation leaks no identity/score/reasons/coordinates/map and retains correct upgrade attribution.
6. All-poor Free has no misleading upgrade CTA; all-poor Pro does not promote the best-of-poor disclosure into a recommendation.
7. Reason-summary selection is deterministic, capped at two, based only on supported canonical reason codes, absent for Free/unsupported input, and not empty-placeholder UI.
8. Loading, no-darkness, unavailable, transport, and contract-defect states use neutral dark-shell treatment and preserve retry/no-retry semantics.
9. Fresh, stale, partial, and stale+partial presentation remains truthful; human-readable stale age stays visible to both tiers without dominating the headline.
10. `New/Nýtt` is controlled by the single isolated flag, complete in IS/EN, and creates no analytics event.
11. Existing details/ranking/map/card analytics remain exact-once and gated on real exposure across rerender, language, theme, and expansion changes.
12. Accessibility assertions cover explicit textual status, DOM order, `aria-expanded`/`aria-controls`, a decorative icon that does not duplicate the adjacent spoken title, visible focus-class presence, and no Free hidden-data DOM.
13. Responsive structure has no fixed-width dependency or overflow-prone layout; reason tiles and header have tested stacking/wrapping hooks/classes.
14. Existing Ticket 397 selection/map tests, normal `MapView` behavior, seasonality, request/cache, and homepage placement remain green.

Do not weaken tests, lint, coverage, or existing non-disclosure assertions.

### 12. Visual verification and validation

Use the repository's available browser/test tooling to inspect deterministic fixtures for at least:

- good, fair, and all-poor usable results;
- loading and one neutral unavailable/error state;
- Free and Pro;
- Icelandic and English;
- light and dark page themes;
- approximately 320px mobile and a representative desktop width;
- collapsed and expanded Pro qualifying content.

Verify hierarchy, contrast, wrapping, overflow, focus, dark-shell consistency, restrained glow, stale/partial treatment, and that the card remains secondary to `HomeDecisionCard`. Capture screenshots or document exact inspected fixtures/viewports in `cc-report.md`. If deterministic browser injection is not possible without production hooks or broad infrastructure, **STOP before implementation** and report the smallest safe fixture seam needed; component DOM tests alone are not sufficient evidence for this explicitly visual ticket.

Run and record exact results for:

- new visual-state/reason/config helper tests;
- `NorthernLightsCard.test.jsx`, `NorthernLightsMap.test.jsx`, and Aurora/normal `MapView` tests;
- relevant `auroraDisplaySelection`, `auroraBandPresentation`, classifier, seasonality, request/cache, feature-gating, analytics, checkout-attribution, homepage, and i18n tests;
- full Vitest suite;
- `npm run lint`;
- `npm run build`;
- `git diff --check`, accounting explicitly for the repository's existing CRLF behavior in `MapView.jsx` without introducing new semantic trailing whitespace.

### 13. Acceptance criteria

- Northern Lights has a distinctive, polished dark evening-sky surface in both light and dark mode.
- Light/dark surroundings differ appropriately while the card's identity stays consistent.
- Every usable canonical band produces one explicit, coherent good/fair/poor visual state; darkness alone never implies quality.
- One large headline, one supporting sentence, at most two truthful Pro-only reason summaries, and one primary action establish a clear hierarchy; Pro qualifying results keep the canonical best-location name visible while collapsed.
- Good/fair CTA copy is truthful; poor/all-poor never suggests a worthwhile location was found.
- Loading, no-darkness, unavailable/error, stale, partial, and stale+partial states remain distinct, readable, and truthful within the new surface.
- The temporary localized badge has one removal flag and a documented 2026-09-30 review date.
- Ticket 397 qualifying/all-poor/list/map rules and canonical map consistency remain unchanged.
- Ticket 392 Free non-disclosure, gating, request identity, and checkout attribution remain unchanged.
- The feature remains below and visually secondary to `HomeDecisionCard`.
- IS/EN, Free/Pro, light/dark, mobile/desktop, accessibility, reduced motion, analytics, tests, lint, build, diff check, and deterministic visual verification pass.

### 14. Out of scope and STOP conditions

Out of scope: Ticket 1–3 changes, new Aurora scoring/ranking/bands/reasons, candidate discovery/roster changes, Ticket 397 filtering/map-rule changes, backend/API/database, new routes/modals/content systems, new libraries, image-generation assets, general MapView redesign, homepage reordering, canonical stay/move card redesign, checkout/payment changes, notifications, future-night planning, light-pollution modeling, TypeScript/`.tsx`, commit, or push.

STOP and report before implementation if:

- truthful design requires data or semantics absent from the canonical response;
- unknown/malformed bands cannot receive the required local neutral visual state without canonical-contract changes;
- reason tiles require inventing or reinterpreting raw weather/provider data;
- the design would expose gated Pro content to Free;
- a second scoring/ranking/request path or Ticket 397 behavior change is required;
- a new dependency, backend, route/modal, broad shared-component redesign, or checkout change is required;
- deterministic visual verification requires a new production-only hook or disproportionate infrastructure;
- the feature would compete with or duplicate `HomeDecisionCard`'s canonical recommendation.

Default git safety applies: do not commit and do not push.


### Ripley revision note — Round 2

Jonesy's three Round 1 findings are incorporated without changing the ticket's functional scope:

1. The prompt no longer assumes an existing Aurora icon. It requires an explicit audit and permits only a small hand-rolled SVG following repository precedent or one icon from already-installed `lucide-react`, with no new dependency.
2. Unknown/missing bands now have an explicit local neutral visual-state path that must not inherit `auroraBandPresentation.js`'s existing `fair` fallback; this is expected local work, not an automatic STOP.
3. For Pro qualifying outcomes, the exact canonical best-location name must remain visible in the collapsed card. Free identity non-disclosure and Ticket 397's all-poor best-location disclosure remain unchanged.

## Jonesy review — Round 2

**Verdict: APPROVED**

All three Round 1 findings are resolved precisely, with no new gaps introduced and no scope creep into the rest of the prompt (§2, §3, §6–10 are unchanged byte-for-byte from Round 1).

1. **Icon precedent** — the new §5 "Icon choice" subsection states plainly that no Aurora-specific icon exists today, requires confirming that in preflight, and gives CC exactly two bounded options (a new hand-rolled SVG following the existing `icons/weather/` pattern, or one already-installed `lucide-react` icon) with an explicit "do not claim an existing Aurora icon was reused when none exists" guard against the narrative-mismatch risk I flagged. Resolved.

2. **Band-fallback trap** — §4's revised unknown-band paragraph is worded almost exactly as I suggested: the new visual-state helper must treat unknown/missing bands as its own explicit case, must not inherit `auroraBandPresentation.js`'s `DEFAULT_BAND = "fair"`, and this is explicitly *not* a STOP trigger (STOP is now correctly narrowed to "cannot be implemented locally without changing canonical contracts" in both §4 and §14). Test item 11.1 now requires proving the new helper doesn't inherit that fallback — good, this makes the fix independently verifiable rather than just asserted. Resolved.

3. **Best-location visibility** — the new "Best-location disclosure" subsection makes the product call explicit rather than leaving it to CC's judgment: the exact canonical best-location name stays visible in the collapsed card for Pro qualifying results, sourced only from the existing canonical best entry (`display.qualifyingLocations[0]`, matching the real variable name already used in `NorthernLightsCard.jsx`), with Free non-disclosure and the all-poor best-of-poor subordination both restated unchanged. Test item 11.4 and the acceptance criteria were updated to match. Resolved.

No further gaps found. Ready for CC.
