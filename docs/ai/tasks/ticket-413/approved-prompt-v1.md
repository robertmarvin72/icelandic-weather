# Ticket 413 — Approved prompt v1

Approved by Jonesy in Initial prompt, Round 1. Execute only after the owner's Prompt approved handoff, with CURRENT.md at READY_FOR_CC and referencing this file. Follow the canonical CC lifecycle in docs/ai/README.md.

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/413 (OPEN when read on 2026-09-12).

### Objective and scope

Create the canonical editorial Character & Voice Bible for Tjaldur before the 100-comment library is authored. The issue explicitly calls this a content/brand specification. Deliver `docs/weather-voice/character-and-voice-bible.md`, primarily in Icelandic, with natural English examples and a clear future-authoring contract. Do not implement a classifier, safety-message selector or expand production content in this ticket.

Read AGENTS.md, CLAUDE.md, docs/ai/README.md and CURRENT.md first. Audit the current Weather Voice engine/types/rules, content/selector, IS/EN libraries and #408 approved design before writing. Existing UI entrypoint is the conditional homepage card between HomeDecisionCard and NorthernLightsCard; no new entrypoint is needed for an editorial specification.

### Verified current state and policy gap

- #405 defines nine conditions and a twelve-mood vocabulary. Runtime `severity: 0|1|2|3` means expressive intensity, explicitly not safety classification.
- #406 has 27 Icelandic entries, empty English content, shared metadata (`condition`, `mood`, `severityMin/Max`, `repeatCooldownDays`, `ctaType`). All current CTAs are null. No `voice_level` or safety-message collection exists.
- The selector filters condition/mood/severity, then cooldown. Existing `extreme_wind`/`wrecked` entries include sarcastic lines. Neither those labels nor severity=3 establish a DANGEROUS classification.
- #408 already supplies silence, transparent assets, a standalone warm card and exposure-based history. Preserve these decisions.

Distinguish normative policy from current runtime enforcement explicitly. The issue's requirement that dangerous conditions cannot select sarcastic content must be fully specified, but must NOT be reported as implemented by a Markdown change. Document the outstanding enforcement dependency and required future acceptance tests. If Jonesy interprets that criterion as requiring runtime delivery in #413, return REVISE so scope can be resolved before execution; do not quietly add code work.

### Required Bible content

1. Background: Tjaldur has seen all Icelandic weather, twice; sun, sleet, horizontal rain and extraordinary wind. Weather-experienced, terse, dry/deadpan, skeptical, slightly grumpy, composed, occasionally unexpectedly pleased. He states what he thinks rather than performing a joke.
2. Voice boundaries: never childish, hyper, emoji-heavy, rude, forced-funny or contemptuous of users. Humor targets weather and occasionally himself, never users' decisions or experience. Shorter is usually better; avoid imposing an arbitrary hard length limit on serious messages.
3. Preserve the issue's good/bad Icelandic examples and its five-question writing test, including rejection for any applicable context where a line could minimize real danger. Explain context-dependent eligibility: a good character line is not automatically suitable for every weather state. Examples about aurora do not authorize a new aurora surface; imperative copy does not authorize a navigation CTA or a safety claim.
4. Define the three voice levels in a clear table: SAFE -> SARCASTIC, POOR -> CAUTIOUS, DANGEROUS -> SERIOUS. Poor conditions prioritize useful, clear wording over punchlines; dangerous conditions allow no sarcasm, punchline or minimization. SAFE is an editorial category, not a guarantee that travel is safe. Issue examples such as 8 m/s plus rain illustrate tone, not universal hazard thresholds.
5. Hard safety precedence: safety classification overrides visual mood, ordinary eligibility and cooldown fallback. DANGEROUS must use only a separate reviewed `weatherSafetyMessages` collection (or equivalent), never the ordinary sarcastic library, including empty-pool, missing-language or cooldown cases. Specify no fallback to a joke when safety content is unavailable; existing official warning surfaces must remain intact. No invented thresholds, official-warning integration, or mapping from severity=3 to DANGEROUS. Record safety signal/source and unknown-state handling as decisions required before runtime implementation; unknown must not be silently assumed SAFE.
6. Separate condition, visual mood and voice level. Preserve the issue's illustrative strong-wind/struggling/sarcastic and dangerous-wind/wrecked/serious distinction, clearly labeling `dangerous_wind` as conceptual, not a current engine condition. A wrecked image never makes a joke safety-eligible.
7. Silence: no filler and no neutral/indifferent appearance simply to display Tjaldur. Explain conceptual `show_weather_voice = false` corresponds to current `{ show: false }`; do not rename the API. Serious warnings must not be suppressed merely for lack of a joke.
8. IS/EN share personality and safety rules. English is natural adaptation, not obligatory literal translation. Include a small paired example set across the three levels and explain the editorial choices. Label new examples as editorial illustrations, not production-ready additions or approved operational safety advice. Preserve the issue's serious example without adding unsupported weather/road claims. EN production content remains empty in this task.
9. Define the future 100-comment authoring fields: `comment_id`, `condition`, `mood`, `voice_level`, `text_is`, `text_en`, `cta_type`, `repeat_cooldown`. Specify cooldown units (days, consistent with current code), stable language-independent IDs, allowed voice values and nullable CTA. Provide a mapping to current camelCase runtime fields, clearly marking voice_level and safety routing as future changes. Do not create 100 entries or migrate/rename existing fields. Distinguish ordinary content from separately reviewed safety entries.
10. Practical editorial review checklist: apply the five writing questions, assign eligible voice/context, review IS/EN parity and safety exclusions, and require future content to reference this Bible. Include a short acceptance-coverage checklist and a clearly named current-implementation-gaps section. Do not retroactively claim the existing 27 entries satisfy all newly specified safety rules.

### Constraints and STOP conditions

Only the new editorial document and active ticket workflow files may change. No src, api, assets, dependencies, scoring, forecast, recommendation, Free/Pro, entitlement, checkout, analytics, content library, UI or history changes. No git commit/push/deployment or GitHub issue closure. Preserve prior ticket history and immutable approved prompts.

Stop and report if completing the agreed scope requires production changes, choosing an authoritative danger classifier/threshold, changing warning behavior, or conflicting with a later owner decision. Record gaps honestly rather than silently treating specification as enforcement.

### Validation and handoff

For documentation-only work, do not add implementation-mirroring tests or run the application suite unnecessarily. Review every issue acceptance item against a section of the Bible; check local links, field names and factual runtime statements against source; run `git diff --check`. Report normative safety coverage separately from runtime enforcement still pending. List exact changed files and validation, including any unresolved decisions, in `docs/ai/tasks/ticket-413/cc-report.md`.

After approval and the owner's execution handoff, CC must follow CURRENT transitions READY_FOR_CC -> CC_IN_PROGRESS -> CC_COMPLETE and populate its report path. Jonesy then reviews the delivered specification; Ripley performs final assessment. No production safety-enforcement claim is permitted from this docs-only deliverable.

