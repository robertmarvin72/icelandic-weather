# Approved Prompt v2 — Ticket 396 Narrow Result-Review Revision

Address only the concrete omission identified in Jonesy's result review and confirmed by Ripley's direct source inspection. Preserve every already-verified v1 implementation choice.

## Required changes

1. Update `travelAdvisorMoveCtaBody` in both English and Icelandic in `src/i18n/translations.routePlanner.js` so it explicitly describes better **weather/weather conditions**, not an unqualified “better option” / “betri kostur”. Keep `move` as the stronger forecast-grounded recommendation; do not turn it into a guarantee or safety command.
2. Update `travelAdvisorConsiderCtaBody` in both English and Icelandic so it:
   - explicitly describes potentially/slightly better weather or weather conditions;
   - explicitly says the difference is not enough for the product to recommend moving;
   - remains exploratory/hedged and does not imply immediate relocation.
3. Extend the existing required-copy compliance test in `src/components/HomeDecisionCard.test.jsx` to include both `travelAdvisorMoveCtaBody` and `travelAdvisorConsiderCtaBody`. The test must cover both languages and enforce the same banned unqualified “better option” / “betri kostur” rule. Also assert the `consider` copy contains the not-enough-to-recommend-moving meaning in both languages if that semantic is not already directly covered for these exact keys.
4. Append a clearly labeled **Revision 2** section to `docs/ai/tasks/ticket-396/cc-report.md` correcting §7's inaccurate claim that these keys were checked and already compliant. Do not rewrite or erase the original report; preserve the audit trail. Record exact text changes, tests, commands, outcomes, deviations, and remaining risks.

## Validation

Run at minimum:

- the focused `HomeDecisionCard` copy/behavior tests;
- `RoutePlannerCard.test.jsx` because these strings render on that surface;
- the #395 research scenario/page tests to guard the real-card validation path;
- the full Vitest suite;
- lint;
- production build.

Record exact commands and results in the Revision 2 report. Do not claim human comprehension validation has occurred.

## Scope boundary

Do not change `HomeDecisionCard.jsx`, scoring, recommendation/data flow, candidate selection, tier/entitlement behavior, CTA navigation, analytics semantics, research fixtures/answer keys, checkout/payment code, or any already-approved v1 behavior. Do not add dependencies, backend work, TypeScript, or `.tsx` files.

If the four translation values and focused test extension cannot resolve the finding without any prohibited change above, STOP and report the conflict. Otherwise implement only this narrow revision.

Do not commit. Do not push. Follow the required `CURRENT.md` transitions: verify `READY_FOR_CC`, set `CC_IN_PROGRESS`, append the Revision 2 CC report, keep/populate the canonical CC report path, then set `CC_COMPLETE`.
