# Ticket 408 — Approved exposure-lifecycle correction v3

Approved by Jonesy in the Correction v3 review. Execute only after Róbert sends `Prompt approved` and CURRENT.md references this file at READY_FOR_CC. Inherit `docs/ai/tasks/ticket-408/approved-prompt-v2.md` and its retained v1 data/lifecycle safeguards; prior approved files remain immutable. Do not revisit the accepted owner-directed card or assets.

Fix only WeatherVoiceCard exposure lifecycle and, if required for episode identity, its narrow useWeatherVoice/App callback contract. Read current files/tests, approved v2, CC report and Ripley's Revision 2 result findings first. Reproduce the preserved failing test before implementing. No scoring, provenance, content, cooldown-policy, styling, asset or entitlement changes.

Requirements:
- Observer callbacks must be scoped to the current committed episode/result and observed node. Cleanup invalidates callbacks as well as disconnecting. A queued callback after replacement/unmount must neither notify nor mutate current notification state. Do not assume disconnect removes already queued callbacks.
- Bind observation evidence to the episode it actually observed; latest-ref lookup alone is not evidence that a newly selected episode was seen. Same comment ID reused across a different site/day episode must still get correct exposure observation. Keep StrictMode exactly-once and rerender stability.
- Track current intersection eligibility (require isIntersecting and ratio >= 0.5). A partially intersecting initial notification below the threshold is not eligible. Handle document visibilitychange so hidden-to-visible with unchanged eligible geometry records once. Never notify while hidden; clean up listeners, invalidate stale handlers and guard missing browser APIs. No polling of storage, no new analytics.
- Add integrated real-hook/card tests proving old observer callbacks cannot write history for a new episode; include replacement, unmount, same ID across episodes, StrictMode replay, hidden intersection followed by visible document, below-threshold entry and once-only legitimate exposure. Preserve selection-without-exposure silence and existing history behavior. Use deterministic fake observer/time/storage.
- Run component/hook/App integration and existing Weather Voice/provenance/scoring-invariance regression suites, targeted lint/build. Recheck one real-browser visibility/site-switch flow and preserve evidence. Append honest CC correction report with exact commands/results; retain prior histories.

CC execution begins only after Jonesy approval and Róbert's Prompt approved handoff; follow CURRENT lifecycle. Completion requires these reproduced gaps closed without changing the accepted presentation. No commit/push.
