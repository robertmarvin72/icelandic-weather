# Ticket 408 — Approved correction prompt v2

Authority: Róbert's explicit owner-directed design intervention and request for a new approved version in this session (2026-09-11). This is owner approval of the revised specification, not a claimed Jonesy approval of v2. Jonesy's Round 1 BLOCKED review remains historical evidence against v1; the owner has now selected the standalone-card design. Preserve approved-prompt-v1.md unchanged. Execute this correction only when Róbert sends `Prompt approved` to CC, with CURRENT referencing this file at READY_FOR_CC.

## Objective and current state

Give Tjaldur enough visual presence to read as a character. Replace v1's tiny in-verdict-row design with one conditional, warm, standalone Weather Voice card immediately BELOW HomeDecisionCard and ABOVE NorthernLightsCard. This remains one Weather Voice production surface, not another stay/move verdict.

The current working tree already contains WeatherVoiceCard.jsx, a sibling integration in App.jsx, larger images, label/quotes, nine added context translations, and modified PNG assets. Audit these existing owner/intervention changes; preserve useful work rather than rebuilding from stale report claims. No asset transparency or visual-quality success is assumed from git status or the supplied screenshot.

Read AGENTS.md, CLAUDE.md, README/CURRENT, approved v1, CC report, result-review (including Jonesy BLOCKED), current implementation/tests and the owner's design intervention recorded in prompt-review.md. Set CC_IN_PROGRESS before implementation. No commit/push.

## Explicit supersession of v1

This version replaces v1's requirements for an internal HomeDecisionCard slot, 40–48px imagery, subdued comment text, prohibition on labels/quotation marks, and prohibition on asset edits. It authorizes the standalone card, readable mascot, label and quotes, and real asset transparency correction. All v1 data provenance, today-only raw-code input, stable selection, visibility-based exposure, research isolation, free access, optional CTA safeguards, accessibility and regression obligations remain in force unless explicitly superseded here.

HomeDecisionCard itself must retain its original verdict, copy, styles, actions and analytics. Remove any Weather Voice integration inside it if present; otherwise leave it unchanged. Do not change NorthernLightsCard or other homepage cards. Do not use the screenshot's stay verdict as a reason to suppress a valid rain condition: recommendation tone and Weather Voice show-worthiness are different contracts.

## Required card

- Render only when the existing resolved presentation has `show === true` and is valid/current. The owner's `show_weather_voice` wording refers to this existing contract; do not introduce a competing boolean or change Phase 1/2 rules. Ordinary show:false renders no card, placeholder, margin or fallback mascot. Never add neutral/indifferent filler; do not remove reserved mood mappings from the contract.
- Place one standalone card between the verdict card and Northern Lights. Mascot on the left, content on the right. Desktop mascot 80–100 CSS px; mobile approximately 64–80px, adjusted for a clearly readable expression at 320px viewport. Visible artwork, not merely transparent canvas dimensions, must occupy the intended size.
- Label `TJALDUR SEGIR`, through the flat i18n system (EN label `TJALDUR SAYS` may exist but empty EN comment library remains silent). Prominent comment beneath it, approximately 18–22px with restrained emphasis. Icelandic quotation marks around the selected text are permitted and requested by the revised concept; do not modify stored comment text to add them.
- Optional supporting sentence, optional relevant secondary CTA. Both must leave no empty container when absent. Existing 27 comments and CTA=null metadata remain unchanged. Do not invent live CTAs or claims that better/calmer/drier/warmer sites exist from weather condition alone. The existing nine condition-only context lines are not automatically approved by the owner's optional-support example: remove their automatic production hookup and unused keys/helper if newly introduced only for #408. Keep the optional supportingText seam; production support may be absent. Any future candidate claim requires canonical comparison evidence and reviewed tone-aware copy.
- Warm off-white/light amber background in light mode; restrained warm dark surface in dark mode, rounded corners and subtle border/shadow. No loud banner, animation or competing recommendation. Primary verdict and warnings stay above and visually authoritative. No horizontal overflow, clipped text or stretched image.

## Transparent assets — actual pixels, not CSS camouflage

All twelve canonical Tjaldur assets must have genuine transparent backgrounds. PNG with real alpha is acceptable; genuine vector SVG is preferred only if an actual faithful vector source is available. Do not wrap raster in SVG, invent SVG paths, use blend modes, white card backgrounds or CSS filters to hide an opaque canvas.

Inspect current modified assets before editing: preserve character, expression, orange body and intentional white eyes/highlights. Check alpha values and composite every mood over both warm light and dark surfaces; an alpha channel alone does not prove background removal. No white rectangle, white halo, cropped expression or removed interior white details. Normalize excessive transparent padding if necessary so facial features are legible at target display size. Follow available image-editing tool/skill requirements if asset correction is needed. Do not regenerate/reinvent the character without the owner's supplied references. If faithful correction is blocked by tooling/source quality, document that blocker rather than marking assets complete.

## Verification and truthful reporting

Preserve provenance, stale-site/date/language rejection, episode stability, StrictMode deduplication and record-after-visible semantics from v1. Do not rework the sound data layer to solve styling. Keep scoring, normalization, entitlements, Phase 1/2 thresholds/content/cooldown and existing analytics unchanged.

Add/update tests for actual sibling order (verdict -> WeatherVoiceCard -> NorthernLightsCard), absence of any internal verdict slot, show:false no card, correct selected text/label/mood asset, optional support/action absent/present, and research isolation. Replace stale comments/tests claiming the internal-slot architecture. Exercise the actual App integration, not only an isolated card fixture.

Run component/hook/presentation/provenance tests, existing HomeDecisionCard and research regression suites, Phase 1/2 and scoring-invariance tests, targeted lint and build. Report actual command outputs and counts.

Capture and KEEP screenshots of the real homepage with deterministic API fixtures at 320, 390, 768 and 1280px, light/dark, covering extreme_wind, heavy_rain, cold, excellent and show:false; Free/Pro and EN silence. Include actual browser site-switch verification (not a substitute jsdom claim). Inspect screenshots for expression legibility, genuine transparency on both backgrounds, spacing, wrapping, placement and primary/warning hierarchy. Keep an all-twelve-mood compositing/contact-sheet artifact showing alpha quality. Store evidence under a documented workspace output directory; do not delete screenshots or the reproducible fixture script before review. Fixed image dimensions must prevent image-load shift; acknowledge the one-time card-height addition when a conditional result appears.

Append a revision section to cc-report.md with the actual changed files, owner-directed supersession, asset method/verification, tests, retained screenshot links and remaining limitations. Explicitly correct prior false claims about HomeDecisionCard props/tests/slot and deleted visual evidence; do not overwrite prior report history. No claim that v1 was followed exactly. The separate card is now authorized, but stale reporting and unverified assets are not thereby resolved.

Completion requires the revised visual result and retained evidence, not merely green unit tests. Populate CC report path and set CC_COMPLETE only after work/validation. Jonesy reviews against v2; Ripley performs final assessment. No commit, push, deploy or issue closure.
