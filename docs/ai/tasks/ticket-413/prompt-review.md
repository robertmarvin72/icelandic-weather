# Ticket 413 — Tjaldur Character & Voice Bible

## Ripley — Initial prompt, Round 1 (2026-09-12)

Review material only. Jonesy: review scope, the safety-policy/runtime distinction and acceptance coverage; append APPROVED or REVISE. This is not an execution authorization.

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

## Jonesy review — Initial prompt, Round 1 (Initial prompt tilbúið)

**Verdict: APPROVED**

### Verification against live source

Read `weatherVoiceTypes.js`, `weatherVoiceEngine.js`, `weatherVoiceContent.js`, `weatherVoiceSelector.js`, and both `src/i18n/weatherVoice/is.js`/`en.js` directly, rather than trusting the prompt's "Verified current state" narrative. Every specific claim checks out:

- Nine conditions, evaluated in the stated priority order (`extreme_wind` → `heavy_rain` → `strong_wind` → `cold_wet` → `cold` → `rain` → `sun_wind` → `excellent` → `good`) — confirmed against `evaluateWeatherVoice()`'s actual predicate chain. `severity: 0|1|2|3` is documented in the engine's own JSDoc as "Voice intensity only... Never changes points, warnings, recommendations, or entitlement" — the prompt's "explicitly not safety classification" framing is the code's own stated intent, not an inference.
- `weatherVoiceContent.js`'s metadata registry has exactly 27 entries (5 extreme_wind + 3 strong_wind + 3 heavy_rain + 3 cold_wet + 3 cold + 2 rain + 2 sun_wind + 3 excellent + 3 good). None sets `ctaType`, so all 27 resolve to the default `null` — "all current CTAs are null" is exactly right. No `voice_level` field or safety-message registry exists anywhere in this file, `weatherVoiceTypes.js`, or the selector.
- `en.js` is a genuinely empty, genuinely supported array (distinct from an unsupported-language `null`) — matches "empty English content" precisely, not a placeholder claim.
- `weatherVoiceSelector.js`'s `selectWeatherVoiceComment()` filters strictly by `condition`/`mood`/severity-range (`isEligible`), then availability by cooldown (`isAvailable`) with a least-recently-shown fallback — exactly "filters condition/mood/severity, then cooldown," with no voice-level or safety gate anywhere in the pipeline.
- Read `is.js` directly: the five `wind_extreme_*` entries — all mapped to `extreme_wind`/`wrecked`, the single most severe condition/mood pairing the engine produces (severity 3) — are all dry/sarcastic ("Ég tek þetta sem persónulega árás" / "I take this as a personal attack," "Þetta var ekki í bæklingnum" / "This wasn't in the brochure"). This is the concrete, verified basis for the policy gap the ticket exists to address: today, nothing in the selection pipeline would prevent the most severe weather from surfacing a joke. The prompt is right to require this documented as an outstanding gap rather than something the Bible itself closes.

No `docs/weather-voice/` directory exists yet — no collision risk for the new file. `AGENTS.md`, `CLAUDE.md`, and `docs/ai/README.md` all exist at the paths CC is told to read first.

### Scope discipline

Single new file (`docs/weather-voice/character-and-voice-bible.md`) plus ticket workflow files — no src/api/assets/dependency/content-library changes authorized, consistent with this being a specification, not an implementation ticket. The STOP conditions correctly cover the two ways this could quietly turn into code work: choosing an authoritative danger classifier/threshold, or changing warning behavior.

### The safety-policy/runtime distinction — this is the part that matters most here, and it's handled correctly throughout

This is a documentation ticket about a policy gap that is real and currently unenforced (verified above), which makes it easy for a report to blur "we wrote down what should happen" with "we made it happen." The prompt heads that off at every point it comes up, not just once:

- Requirement 5's safety precedence is written as a hard requirement for a *future* runtime (`weatherSafetyMessages`, no fallback, no silent-unknown-as-SAFE), explicitly deferred: "Record safety signal/source and unknown-state handling as decisions required before runtime implementation."
- Requirement 6 labels `dangerous_wind` as "conceptual, not a current engine condition" — stops a future reader (or CC) from treating it as if it already exists in `weatherVoiceEngine.js`.
- Requirement 9's authoring-field table (`voice_level`, `cta_type`, `repeat_cooldown` in snake_case) is explicitly required to map to the current camelCase runtime fields (`ctaType`, `repeatCooldownDays`) rather than silently introducing a second, drifting vocabulary — a real risk given `weatherVoiceContent.js`'s existing metadata registry already has a naming convention of its own.
- Requirement 10 explicitly forbids retroactively claiming the existing 27 entries satisfy the new safety rules — necessary, since (as verified above) they plainly don't: every severity-3 entry today is sarcastic under a scheme that would classify severity-3-adjacent conditions as candidates for DANGEROUS/no-sarcasm.
- The objective, the validation section, and the closing handoff paragraph all separately restate "no production safety-enforcement claim is permitted from this docs-only deliverable" — redundant in a good way, since this is exactly the kind of claim that erodes into an implicit "done" over report revisions if only stated once.

### Acceptance coverage

The ten required-content items map cleanly onto the issue's stated concerns as summarized in the prompt: background/voice (1-2), the writing test and context-dependent eligibility (3), the three-level table (4), hard safety precedence (5), condition/mood/voice-level separation (6), silence behavior tied to the real `{ show: false }` API (7), IS/EN parity without obligatory literal translation (8), the future authoring schema (9), and a practical review checklist plus honest gap section (10). Nothing in the "Verified current state" section is left unaddressed by a numbered requirement, and the validation section's instructions (cross-check every acceptance item against a Bible section, verify links/field names/factual runtime statements against source, `git diff --check`, no unnecessary test suite runs for a docs-only change) are appropriately scoped to what a Markdown deliverable actually needs.

### Conclusion

**APPROVED.** Every "verified current state" claim checks out against the live engine/content/selector code, the scope is correctly held to a single new document, and the safety-policy-vs-runtime-enforcement line — the one place this kind of ticket usually blurs — is drawn explicitly and repeatedly rather than left to a single caveat. Proceed as normal: Róbert's "Prompt approved" moves `CURRENT.md` to `READY_FOR_CC` for this prompt.

## Ripley — Correction prompt, Round 2 (2026-09-12)

Review material only. Jonesy: review this correction and append APPROVED or REVISE. Inherit the full approved-prompt-v1.md documentation-only scope and required Bible content. No production changes and no new danger thresholds or classifier selection.

Correct only the factual/conceptual issues documented in Ripley's Round 1 final assessment:

- In Bible section 5.4 distinguish internally generated hazard notices from official warnings issued by external authorities. Do not imply HAZARDS_V1 confers official authority. Preserve both categories where present without inventing an external feed integration.
- In section 11 describe the actual data flow: weatherVoiceRules imports HAZARDS_V1.rainWarn as RAIN_HEAVY_MM and the engine consumes that threshold, while no safety-classification result is supplied to Weather Voice selection. The selector does filter severityMin/Max, but that expressive-intensity filter is not a safety gate. Correct other absolute claims of complete independence or ignored severity consistently.
- Distinguish situation safety classification (SAFE/POOR/DANGEROUS) from authored message tone (sarcastic/cautious/serious). They have a required policy mapping, not interchangeable meanings. A per-message tone/eligibility field is not evidence of the current situation's safety. Keep the authoritative situation-classification source unresolved, without suggesting that selecting or labeling a text can determine weather danger. Preserve the separate safety collection and override/no-joke-fallback rules.
- Remove the implication in section 7 that missing safety routing removes the practical concern. In sections 6/11 state current safety compliance is unverified/unenforced; sarcastic extreme_wind content is evidence of the routing gap, not proof that extreme_wind has been classified DANGEROUS. Qualify claims to Weather Voice, not 'any system'. Preserve the pending contextual review of all 27 entries.

Read and cross-check the full document for contradictions after these edits, particularly sections 4–7 and 9–11. Preserve the accepted character/background/examples and the original issue's requirements. Do not turn this into another implementation or design task.

Append an honest correction report to cc-report.md acknowledging earlier inaccurate claims; do not overwrite CC/Jonesy/Ripley history. Validate references against live rules/engine/selector source, review issue coverage, inspect the documentation diff and check whitespace (including the new document if untracked). No unnecessary application tests. Follow canonical CC lifecycle only after this round is approved, an immutable v2 prompt is created and the owner gives the execution handoff.

## Jonesy review — Correction prompt, Round 2 (Review uppfært, after Ripley's REVISE on Round 1)

**Verdict: APPROVED**

### Owning the miss

Ripley's findings are real, and two of them are things I had the evidence for in my own Round 1 review and didn't call out. When I checked `weatherVoiceRules.js` I saw `RAIN_HEAVY_MM = HAZARDS_V1.rainWarn` at line 54 and even noted internally that this shows the engine isn't numerically independent of `HAZARDS_V1` — but I filed that as "a nuance" rather than flagging it against the Bible's own §11.4 text, which says the hazard system is "algjörlega ótengt" (completely unrelated) and that "hvorugt les það" (neither function reads it). Those are flatly contradicted by the import I saw myself. I also read §5.4's "opinber viðvörunar-yfirborð" (official warning surfaces) framing and accepted it without questioning whether an internally-defined threshold config (`HAZARDS_V1` — numbers CampCast picked, not a Veðurstofan feed) actually qualifies as "official" — it doesn't, and the document's own §5.7 correctly reserves "opinber veðurviðvörun (Veðurstofan)" for a genuinely external authority a few paragraphs later, so the document contradicts itself on this point. I re-verified both independently this round: `weatherVoiceRules.js:13` imports `HAZARDS_V1`, `:54` sets `RAIN_HEAVY_MM = HAZARDS_V1.rainWarn`, and `weatherVoiceEngine.js:102` consumes `RAIN_HEAVY_MM` — a real, direct dependency, not the "completely unrelated" picture §11.4 painted.

The other two findings hold up the same way under a fresh check against the actual document text:

- `weatherVoiceSelector.js`'s `isEligible()` (lines 26-27) and its use at line 104 do filter by `severityMin`/`severityMax` — §11.3's "óháð severity" (regardless of severity) is inaccurate. It's a no-op today only because all 27 entries default to the full 0-3 range; the mechanism itself is real and would matter for narrower future entries.
- §5.7 lists "handvirkt authored-svið á hverri línu" (a manually-authored per-line field) as a candidate *source of the situation's DANGEROUS classification*, and §9 explicitly calls the SAFE/POOR/DANGEROUS labels and the sarcastic/cautious/serious voice-level labels interchangeable names for "the same three stages." That conflates two genuinely different things: whether the weather situation is actually dangerous (a fact about the world, needing an authoritative signal) versus what tone a given line of text should carry (a property authored per-message). Collapsing them risks a future implementer treating "I wrote this line as serious" as if it were evidence the weather is dangerous, which is backwards.
- §7's "ekki áhyggjuefni í reynd" (not a practical concern) because no safety flow exists gets the logic backwards — the absence of a gate is exactly why today IS a live exposure, not proof it isn't. §11.6 then treats the sarcastic `wind_extreme_*` content as proof the entries "fail" the DANGEROUS rule, while §6 itself says `extreme_wind` isn't automatically DANGEROUS — an internal contradiction between two sections. And "ekki flokkað sem DANGEROUS af neinu kerfi í dag" (§6) overreaches into a claim about every system in the codebase when the real, supportable claim is scoped to Weather Voice.

### Assessment of the v2 correction prompt

All four bullets are technically accurate replacements for what I independently confirmed, not just restatements of Ripley's prose:

- Bullet 1 correctly asks to distinguish internal threshold notices from externally-issued official warnings without inventing a new integration — matches the real gap (§5.4 mislabeling, while §5.7 already has the correct distinction elsewhere in the same document).
- Bullet 2's data-flow description is exactly right: `weatherVoiceRules` imports `HAZARDS_V1.rainWarn` as `RAIN_HEAVY_MM`, the engine consumes that threshold, no safety-classification *result* flows into selection, and severity filtering exists but isn't a safety gate. It also correctly asks to fix "other absolute claims of complete independence or ignored severity consistently" — a generalized instruction rather than four isolated string edits, which matters since these phrasings could recur beyond the exact lines quoted.
- Bullet 3 keeps the authoritative situation-classification source genuinely unresolved (no premature decision), while requiring the document stop implying that authoring or selecting text can itself establish real-world danger — the right fix without overreaching into deciding the actual mechanism.
- Bullet 4 asks for "unverified/unenforced" rather than "proven to fail," scopes the "not classified" claim to Weather Voice rather than "any system," and preserves the pending contextual review framing for the 27 entries rather than either overclaiming compliance or overclaiming violation.

The prompt correctly requires a full read-through after the edits ("particularly sections 4-7 and 9-11") rather than trusting four isolated point-fixes not to create new contradictions, and it explicitly guards against scope creep: "Preserve the accepted character/background/examples," "Do not turn this into another implementation or design task," no new thresholds or classifier selection. The v1 approved prompt stays immutable; this is a genuinely narrow, additive correction targeting exactly what Ripley found and what I've now independently re-confirmed.

### Conclusion

**APPROVED.** All four of Ripley's findings check out against the live source and the delivered document's own text — two of them (the HAZARDS_V1 independence overstatement and the "official warnings" mislabel) were things I had the evidence for and should have caught in Round 1. The correction prompt is accurate, appropriately scoped, and requires a holistic consistency pass rather than isolated edits. Proceed as normal: Róbert's "Prompt approved" moves `CURRENT.md` to `READY_FOR_CC` for the v2 correction, execution produces an immutable `approved-prompt-v2.md`.
