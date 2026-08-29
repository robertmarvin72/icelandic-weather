# Approved Prompt v3 — Ticket 396 Owner Copy Follow-up

Apply Róbert's post-workflow copy correction as a narrow bilingual presentation-only revision. The current `consider` support copy incorrectly uses danger/severe-warning framing for ordinary poor weather, and the Icelandic `routePainConsiderBody` also has the grammatical error “tjaldlíf minni notalegt”.

## Required changes

Update only these active `consider` support-copy keys in EN and IS:

1. `routePainConsiderBody` in `src/i18n/translations.routePlanner.js`:
   - IS: use **“Slakt veður getur samt gert tjaldlífið minna notalegt.”**
   - EN: use the equivalent **“Poor weather can still make camping less comfortable.”**
2. `icConsiderFallback` in `src/i18n/translations.common.js`: remove the “weather isn't dangerous / veðrið er ekki hættulegt” contrast and use calm compare/monitor wording consistent with canonical `consider` semantics. Do not imply moving is recommended.
3. `routePainConsiderBulletLessPleasant` in `src/i18n/translations.routePlanner.js`: remove the “serious warnings / alvarlegar veðurviðvaranir” contrast and describe ordinary camping comfort instead. Keep it concise and distinct from the body where practical.

The result must frame `consider` around comfort, poor/slack weather, comparison, and monitoring — not danger, hazards, or severe warnings. Preserve the canonical rule that potentially better weather is not enough to recommend moving.

## Tests

Add or extend a focused bilingual translation-content test covering these exact three keys. Prove:

- IS `routePainConsiderBody` contains the grammatically correct “minna notalegt”, never “minni notalegt”;
- none of the three EN/IS keys contains danger/hazard/severe-warning framing (`danger`, `dangerous`, `hazard`, `serious warning`, `hætta`, `hættulegt`, `alvarleg ... viðvörun`, or equivalent wording introduced by the implementation);
- the copy remains real translated text in both languages and does not become an untranslated key/fallback;
- existing `move`, `stay`, tone×tier CTA, analytics, and research-scenario tests remain unchanged and green.

Run the focused `HomeDecisionCard`/translation test, `InstantComparison` tests that cover the fallback where available, `RoutePlannerCard.test.jsx`, the #395 research scenario/page tests, then the full Vitest suite, lint, and production build. Record exact commands/results.

## Scope boundary

Do not change components, scoring, recommendation/data flow, forecast inputs, candidate selection, tier/entitlement behavior, CTA behavior, analytics semantics, research fixtures/answers, checkout/payment code, or unrelated hazard copy used in genuinely hazardous states. This revision authorizes translation values for the three named keys plus focused tests and workflow reports only.

Append a clearly labeled **Revision 3** section to `cc-report.md`; preserve prior report history. Do not claim human comprehension validation has occurred. Do not commit or push. Follow the required `CURRENT.md` transitions through `CC_IN_PROGRESS` and `CC_COMPLETE`.
