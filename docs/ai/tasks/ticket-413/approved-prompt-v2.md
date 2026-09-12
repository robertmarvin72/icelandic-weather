# Ticket 413 — Approved correction prompt v2

Approved by Jonesy in Correction prompt, Round 2 (2026-09-12). Inherit the full documentation-only scope and required Bible content of docs/ai/tasks/ticket-413/approved-prompt-v1.md; this correction takes precedence where relevant. No production changes and no new danger thresholds or classifier selection.

Execute only after the owner's Prompt approved handoff, with CURRENT.md at READY_FOR_CC and referencing this file. Follow docs/ai/README.md: set CC_IN_PROGRESS before work, append the correction report, then set CC_COMPLETE. This approved file already exists before execution and must remain immutable.

Correct only the factual/conceptual issues documented in Ripley's Round 1 final assessment:

- In Bible section 5.4 distinguish internally generated hazard notices from official warnings issued by external authorities. Do not imply HAZARDS_V1 confers official authority. Preserve both categories where present without inventing an external feed integration.
- In section 11 describe the actual data flow: weatherVoiceRules imports HAZARDS_V1.rainWarn as RAIN_HEAVY_MM and the engine consumes that threshold, while no safety-classification result is supplied to Weather Voice selection. The selector does filter severityMin/Max, but that expressive-intensity filter is not a safety gate. Correct other absolute claims of complete independence or ignored severity consistently.
- Distinguish situation safety classification (SAFE/POOR/DANGEROUS) from authored message tone (sarcastic/cautious/serious). They have a required policy mapping, not interchangeable meanings. A per-message tone/eligibility field is not evidence of the current situation's safety. Keep the authoritative situation-classification source unresolved, without suggesting that selecting or labeling a text can determine weather danger. Preserve the separate safety collection and override/no-joke-fallback rules.
- Remove the implication in section 7 that missing safety routing removes the practical concern. In sections 6/11 state current safety compliance is unverified/unenforced; sarcastic extreme_wind content is evidence of the routing gap, not proof that extreme_wind has been classified DANGEROUS. Qualify claims to Weather Voice, not 'any system'. Preserve the pending contextual review of all 27 entries.

Read and cross-check the full document for contradictions after these edits, particularly sections 4–7 and 9–11. Preserve the accepted character/background/examples and the original issue's requirements. Do not turn this into another implementation or design task.

Append an honest correction report to cc-report.md acknowledging earlier inaccurate claims; do not overwrite CC/Jonesy/Ripley history. Validate references against live rules/engine/selector source, review issue coverage, inspect the documentation diff and check whitespace (including the new document if untracked). No unnecessary application tests. Follow canonical CC lifecycle only after this round is approved, an immutable v2 prompt is created and the owner gives the execution handoff.
