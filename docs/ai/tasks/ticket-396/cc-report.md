# CC Report — Ticket 396 (Skýra muninn á „færa sig" og „íhuga")

Executed against: `docs/ai/tasks/ticket-396/approved-prompt-v1.md` (v1, READY_FOR_CC → CC_IN_PROGRESS).

## 1. Mandatory preflight audit

Read before editing: `CLAUDE.md` ("Canonical Decision Tone", "Homepage Canonical Decision Surface", "Free/Pro Gating — Forecast Data Rule"); ticket #395's approved prompt/cc-report/result-review (both revisions); `src/components/HomeDecisionCard.jsx` and its full test file; `src/lib/routeVerdictMeta.js`; `src/hooks/useComparisonState.js`; `src/lib/comparisonUtils.js`; `src/components/RoutePlannerCard.jsx` and its test file; `src/i18n/translations.routePlanner.js` and `translations.js`'s composition; `src/lib/researchQuiz/scenarios.js`/its tests, `src/pages/DecisionQuizResearch.jsx`. (`src/lib/routePlannerSummary.js` was located but not separately audited in depth — `deriveRoutePlannerSummary`'s output (`decisionLower`, `candidate`, `top3`) is consumed unchanged by both `HomeDecisionCard` and `RoutePlannerCard`; this ticket does not touch it and confirmed no presentation logic needed to move there.)

### Which surfaces can present canonical stay/move/consider

- **`HomeDecisionCard.jsx`** — the single primary canonical surface (per CLAUDE.md's "Homepage Canonical Decision Surface"). This is the surface this ticket revises.
- **`RoutePlannerCard.jsx`** — a secondary, collapsed-by-default supporting-detail surface (behind "Sjá nánar"). It renders its own `displayDecisionLower`-driven verdict block (`routeStateMove`/`routeStateConsider`/`routeStateStay` + descriptions) reconciled to the same canonical tone via `comparisonState`, but is presentation-independent code from `HomeDecisionCard`. Audited for contradiction only, per approved prompt §3 — see §7 below for the one real conflict found and fixed.
- **`DecisionQuizResearch.jsx` / `src/lib/researchQuiz/scenarios.js`** — not an independent presentation surface; it renders the real `HomeDecisionCard` with frozen fixtures, so it inherits this revision automatically. No separate copy exists there to audit.
- No other active surface (Brochure's `InstantComparison`, blog, etc.) renders canonical stay/move/consider — confirmed via grep for `routeVerdictMeta`/`decisionLockedCta`/`decisionConsiderLockedCta` usage; only `HomeDecisionCard.jsx` and `RoutePlannerCard.jsx` import/reference these.

### Stay-edge case interpretation

`showCandidate = best != null && !model.locked`. For `move`/`consider`, `model.locked = !isPro`, so `showCandidate` for those two tones is only ever true for **Pro**. For `stay` (including the `similar`/`current_better` comparisonState overrides), `model.locked` is never set (`undefined`, falsy), so `showCandidate` can be true for **any** tier whenever `comparisonState.best` exists alongside a `stay`-toned verdict — e.g. `routePlannerSummary.verdict === "stay"` with a `comparisonState` that still resolves a nearby candidate (`direction: "nearby_better"`, not `similar`/`current_better`). Per approved prompt §3, this generic candidate-visible CTA (`icCtaView`/`icCtaCompare`, tier-based) is **preserved unchanged** for `stay` — it is not converted into move/consider wording, and tone selection for the candidate CTA branches on `model.tone` first, falling through to the original tier logic only when `tone` is `stay`. Verified with a dedicated test (`HomeDecisionCard.test.jsx`, "stay-edge case").

## 2. This is presentation-only — confirmed, not asserted

No scoring threshold, candidate-selection function (`selectBestCandidate`, `classifyMetrics`, `classifyDirection`, `scoreTier`, `metricCap` in `comparisonUtils.js`), `useComparisonState` derivation, `routePlannerSummary`/`deriveRoutePlannerSummary` computation, entitlement check (`entitlements?.isPro`), or analytics event name/payload shape was modified. Only: (a) translation **values** (never keys) for existing move/consider copy, (b) two new translation keys per language for the candidate-visible CTA, (c) two new translation keys per language for the strength badges, (d) `HomeDecisionCard.jsx` render logic (badge, title emphasis, candidate-CTA tone-vs-tier branch, compliant fallback strings), (e) one `RoutePlannerCard`-adjacent translation value fix (§7). No STOP condition was triggered.

## 3. Files changed

- `src/i18n/translations.routePlanner.js` — revised copy for `decisionMoveLockedBody`, `decisionConsiderLockedBody`, `decisionMoveBodyWindowAware`, `decisionConsiderBodyWindowAware`, `decisionLockedCta`, `decisionConsiderLockedCta`, `routeStateConsiderDescription` (EN+IS each); added `decisionMoveCandidateCta`, `decisionConsiderCandidateCta`, `decisionMoveStrengthBadge`, `decisionConsiderStrengthBadge` (EN+IS).
- `src/components/HomeDecisionCard.jsx` — added the strength badge; added a title emphasis distinction (`text-base font-bold` for move vs `text-sm font-semibold` for consider — a real weight/size difference, not color alone); replaced the candidate-visible secondary CTA's tier-only selection with a tone-first branch (move/consider use the new dedicated keys for every tier; `stay` keeps the original `tier >= 2 ? icCtaView : icCtaCompare`); updated inline fallback strings to match the new compliant copy (never introduced a new hardcoded literal — existing `t(...) || "fallback"` pattern preserved with compliant text).
- `src/components/HomeDecisionCard.test.jsx` — fixed two pre-existing tests whose fixtures now correctly render the new tone-based candidate CTA text instead of the old generic `icCtaView`; added new describe blocks covering the required test matrix (§6 below).
- `src/lib/researchQuiz/scenarios.test.jsx` — added assertions proving the frozen move/consider fixtures render the new badge/copy, and that the diagnostic (raw-move→canonical-stay) fixture shows neither badge.

No other file was changed. No dependency was added. No `.tsx`/TypeScript was introduced.

## 4. Exact copy/visual/CTA mapping by tone and tier

| Tone | Tier | Title emphasis | Badge | Body | CTA |
|---|---|---|---|---|---|
| `move` | Free (locked) | `text-base font-bold` | `decisionMoveStrengthBadge` (solid emerald fill) | `decisionMoveLockedBody` | `decisionLockedCta` (locked button) |
| `move` | Pro (candidate-visible) | `text-base font-bold` | `decisionMoveStrengthBadge` | `decisionMoveBodyWindowAware` (interpolated `{site}`) | `decisionMoveCandidateCta` — **same key regardless of `comparisonState.tier`** |
| `consider` | Free (locked) | `text-sm font-semibold` | `decisionConsiderStrengthBadge` (outlined amber) | `decisionConsiderLockedBody` | `decisionConsiderLockedCta` (locked button) |
| `consider` | Pro (candidate-visible) | `text-sm font-semibold` | `decisionConsiderStrengthBadge` | `decisionConsiderBodyWindowAware` (interpolated `{site}`) | `decisionConsiderCandidateCta` — **same key regardless of tier** |
| `stay` (incl. `similar`/`current_better`) | any | unchanged (`text-sm font-semibold`) | none | unchanged (`decisionSimilarBody`/`decisionCurrentBetterBody`/`decisionStayBodyGood`/`decisionStayBodyRough`) | unchanged — no badge, no locked CTA; candidate-visible CTA (when a candidate exists) keeps the original tier-based `icCtaView`/`icCtaCompare` |

The badge's two visual treatments (solid fill vs. outline) plus the title weight/size difference are the "visual hierarchy... not color alone" signal required by §3 — both were asserted via distinct `className` values in tests, not just presence.

## 5. Copy compliance

Grepped every touched/audited copy key (both languages) for the banned unqualified phrase: none of `decisionMoveBodyWindowAware`, `decisionMoveLockedBody`, `decisionConsiderBodyWindowAware`, `decisionConsiderLockedBody`, `decisionLockedCta`, `decisionConsiderLockedCta`, `decisionMoveCandidateCta`, `decisionConsiderCandidateCta`, or `routeStateConsiderDescription` contains "better option"/"betri kostur" without a weather qualifier (test-enforced, not just manually checked — see §6 test #5). `decisionConsiderLockedBody`/`decisionConsiderBodyWindowAware`/`routeStateConsiderDescription` explicitly state the difference is "not enough" (EN) / "ekki nóg" (IS) to recommend moving.

## 6. Required targeted tests — status

All ten categories from approved-prompt §6 are covered:

1. Free `move` stronger wording + badge + action CTA — `HomeDecisionCard.test.jsx`.
2. Free `consider` explicit "not enough to recommend moving" + exploratory CTA — same file.
3. Candidate-visible CTA matrix (move/consider × low/high tier, distinct keys, never falls back to `icCtaView`/`icCtaCompare`) — same file, dedicated describe block.
4. Non-color accessible/visual strength cues, asserted via distinct `className` — same file.
5. No unqualified "better option"/"betri kostur" across all touched copy, both languages — same file, translation-content test.
6. Candidate identity absent from Free DOM for both tones — same file (`document.body.textContent` check).
7. `stay`/`similar`/`current_better` unchanged, including the audited generic fallback CTA — same file, dedicated regression describe block.
8. Raw-verdict/canonical-tone analytics event names, firing rules, and payload semantics unchanged — same file (asserted directly, not just "no diff" claimed).
9. EN/IS key completeness + `{site}` interpolation for the new/changed keys — same file.
10. All #395 research scenarios render the real card with unchanged identities/answer keys, now additionally proving the revised wording/badges render — `src/lib/researchQuiz/scenarios.test.jsx`.

## 7. RoutePlannerCard audit — one contradiction found and fixed

`routeStateConsiderDescription` (RoutePlannerCard's own expanded-details "consider" description, shown only when "Sjá nánar" is opened) read **"There may be a better option nearby, but the difference is not huge."** (EN) / **"Það gæti verið betri kostur í nágrenninu..."** (IS) — an actively rendered secondary recommendation surface using the exact banned vague phrasing, with no statement that the difference is insufficient to recommend moving. This directly contradicted the revised canonical framing. Fixed to: **"Weather may be a little better nearby, but not enough to recommend moving."** / **"Veðrið gæti verið aðeins betra í nágrenninu, en ekki nóg til að mæla með að færa sig."** — the smallest change that removes the vague phrase and aligns the stated meaning with `HomeDecisionCard`'s canonical `consider` framing, without restructuring or redesigning `RoutePlannerCard`. No other RoutePlannerCard string was found to conflict (`routeStateMoveDescription`, `routeAggregateSlight`, `routeImproveBetter`, `travelAdvisorMoveCta`/`ConsiderCta` either already use a weather qualifier or don't use the banned "better option"/"betri kostur" pattern — left unchanged per "smallest adjustment needed").

## 8. Research validation boundary

The #395 research route (`/research/decision-quiz`, gated by `VITE_RESEARCH_QUIZ_ENABLED`/`VITE_RESEARCH_QUIZ_WEBAPP_URL`) remains fully wired to the real `HomeDecisionCard` with unchanged scenario identities/answer keys (`src/lib/researchQuiz/scenarios.js` was not modified) — confirmed by both existing tests and the new #396-specific assertions passing unmodified/extended. **No participant results were fabricated or claimed improved.** Comprehension improvement is a human validation step owned by Róbert.

### Checklist to rerun the same/comparable three-scenario test and record #396 results

1. Confirm `VITE_RESEARCH_QUIZ_ENABLED=true` and a valid `VITE_RESEARCH_QUIZ_WEBAPP_URL` are configured (see `docs/research/decision-quiz/README.md`).
2. Share the existing unlisted link: `https://<domain>/research/decision-quiz`.
3. Run the same three canonical scenarios (`stay`, `move`, `consider`) with a comparable participant pool/size to the #377/#395 baseline round.
4. For each participant, record: interpretation, stated reason, intended next action, and — specifically for `move` — whether it was interpreted as `consider` (mirrors the baseline's "10/27 interpreted move as consider" finding); and for `consider` — whether the participant chose immediate relocation (mirrors "13/27 chose immediate relocation for consider").
5. Compute and record on issue #396 (for direct comparison against the stated baseline, not fabricated here):
   - `stay` interpretation accuracy (baseline 92.6%);
   - `consider` interpretation accuracy (baseline 77.8%);
   - `move` interpretation accuracy (baseline 55.6%);
   - all-three-correct rate (baseline 40.7%);
   - move→consider misinterpretation rate (baseline 10/27);
   - consider→immediate-relocation rate (baseline 13/27).
6. Compare directly against the baseline numbers above; do not average across differently-sized samples without noting sample size.

## 9. Tests, lint, and build actually run

- **Targeted `HomeDecisionCard`, research-scenario, and `RoutePlannerCard` tests** — `npx vitest run src/components/HomeDecisionCard.test.jsx src/lib/researchQuiz/scenarios.test.jsx src/components/RoutePlannerCard.test.jsx src/pages/DecisionQuizResearch.test.jsx` → **108/108 passed**, 4 files (53 + 11 + 35 + 9). Two pre-existing `HomeDecisionCard.test.jsx` tests initially failed after the CTA-precedence change (both asserted the old generic `icCtaView` text for a `move`-tone fixture) — this was the **expected, intended** behavior change; both were updated to assert the new `decisionMoveCandidateCta` text, with a comment explaining why. One new test in the added #396 block itself had a copy-paste fixture bug (checked the Pro-only body key against a Free-tier render) — caught on the first real run and corrected.
- **Full suite** — `npx vitest run` → **891/891 passed**, 79 files (up from 869/79 before this ticket — +22 tests, same file count; no pre-existing assertion was weakened, only the two intentionally-updated ones above).
- **Lint** — `npm run lint` → exit 0, no output.
- **Build** — `npm run build` → succeeded. Same pre-existing "chunks larger than 500 kB" notice as every prior run in this session, unrelated to this change.

## 10. Deviations and remaining risks

1. **Two existing tests were changed, not just added to** (§9) — an unavoidable, correctly-scoped consequence of approved prompt §3's own required behavior change (candidate-visible CTA precedence), not scope creep. Both changes are narrowly justified by a code comment referencing #396.
2. **`routeStateConsiderDescription` fix (§7)** is the one place this ticket touched a string outside `HomeDecisionCard.jsx`'s own direct copy set — flagged prominently since it's a `RoutePlannerCard` change, even though it is a translation-value-only fix with no logic/behavior change.
3. **Human comprehension validation is not yet performed** — by design, this is Róbert's follow-up step (§8 checklist), not something this ticket could or should claim.
4. No other risk identified: scoring, candidate selection, entitlement, checkout, and analytics event semantics are all unchanged and directly tested, not merely asserted.

## 11. Confirmation (Revision 1)

`docs/ai/CURRENT.md` has been updated: CC report path set to this file, stage set to `CC_COMPLETE`. **Not committed. Not pushed.**

---

## Revision 2 (approved-prompt-v2.md) — correcting §7's inaccurate claim

### Reason

Jonesy's result review (confirmed independently by Ripley against the live working tree) found that §7 of this report **incorrectly** stated `travelAdvisorMoveCta`/`travelAdvisorConsiderCta` "either already use a weather qualifier or don't use the banned pattern" and that no other `RoutePlannerCard` string conflicted. This overlooked the two **CTA-body** strings rendered immediately above those buttons in the same `isPreview` block (`RoutePlannerCard.jsx`, ~L1419–1447): `travelAdvisorMoveCtaBody` and `travelAdvisorConsiderCtaBody`. Both were live-rendered, both still used the unqualified "better option"/"betri kostur" pattern in both languages, and `travelAdvisorConsiderCtaBody` never stated the difference was insufficient to recommend moving. This was a genuine audit gap in Revision 1 — the two keys were never inspected, despite `translations.routePlanner.js` being named in the mandatory preflight list. **§7 above is now known to have been factually wrong on this point; it is left unedited above (per the workflow's "do not rewrite or erase the original report" instruction) and corrected here.**

### Changes made (translation values only, EN + IS)

`src/i18n/translations.routePlanner.js`:

- `travelAdvisorMoveCtaBody`: EN "A better option was found nearby..." → **"Better weather was found nearby. Pro shows you exactly where and why."** IS "Betri kostur fannst í nágrenninu..." → **"Betra veður fannst í nágrenninu. Pro sýnir þér nákvæmlega hvar og hvers vegna."**
- `travelAdvisorConsiderCtaBody`: EN "There may be a slightly better option nearby. Pro helps you explore it." → **"Weather conditions may be slightly better nearby, but not enough to recommend moving. Pro helps you compare."** IS "Það gæti verið örlítið betri kostur í nágrenninu..." → **"Veðurskilyrði gætu verið örlítið betri í nágrenninu, en ekki nóg til að mæla með að færa sig. Pro hjálpar þér að bera saman."**

`travelAdvisorMoveCta`/`travelAdvisorConsiderCta` (the button labels themselves, not their body copy) were re-confirmed as already compliant and were **not** changed, per the v2 prompt's narrow scope. No other file was touched. `HomeDecisionCard.jsx`, scoring, candidate selection, entitlement, CTA navigation, analytics semantics, and research fixtures/answer keys were not changed.

### Test extension

`src/components/HomeDecisionCard.test.jsx`'s existing "#396 no unqualified 'better option'" describe block:
- `keysToCheck` now includes `travelAdvisorMoveCtaBody` and `travelAdvisorConsiderCtaBody`, so the banned-pattern check runs against them in both languages;
- the "consider copy explicitly says... not enough to recommend moving" test now also asserts `travelAdvisorConsiderCtaBody` matches the not-enough marker;
- a new test asserts both `travelAdvisorMoveCtaBody` and `travelAdvisorConsiderCtaBody` explicitly contain a weather qualifier ("weather"/"veður") in both languages, closing the loop on the v2 prompt's explicit "describes better weather/weather conditions" requirement, not just the absence of the banned phrase.

### Verification — exact commands and results

1. Focused `HomeDecisionCard` copy/behavior tests + `RoutePlannerCard.test.jsx` (these strings render there) + #395 research scenario/page tests — `npx vitest run src/components/HomeDecisionCard.test.jsx src/components/RoutePlannerCard.test.jsx src/lib/researchQuiz/scenarios.test.jsx src/pages/DecisionQuizResearch.test.jsx` → **110/110 passed**, 4 files (was 108/4 in Revision 1 — +2 for the new weather-qualifier test's two `it.each` cases).
2. Full suite — `npx vitest run` → **893/893 passed**, 79 files (up from 891/79 in Revision 1 — +2 tests, same file count).
3. `npm run lint` → exit 0, no output.
4. `npm run build` → succeeded, same pre-existing unrelated chunk-size notice as every prior run.

No command was skipped or reported as passing without actually running.

### Deviations and remaining risks

None beyond what Revision 1 already recorded. No STOP condition was triggered — the four translation values and the focused test extension fully resolved the finding without touching `HomeDecisionCard.jsx`, scoring, candidate selection, entitlement, CTA navigation, analytics, or research fixtures. **Human comprehension validation has still not occurred** — the checklist in §8 above remains Róbert's follow-up step; nothing in this revision changes that.

### Handoff (Revision 2)

`docs/ai/CURRENT.md` CC report path remains this file; stage set to `CC_COMPLETE`. **Not committed. Not pushed.**

---

## Revision 3 (approved-prompt-v3.md) — owner copy follow-up: remove danger/hazard framing from `consider`

### Reason

Revision 2 reached `PASS` from both Jonesy and Ripley — no implementation work remained in the AI workflow. During Róbert's own human review afterward, he identified that Icelandic `routePainConsiderBody` had a grammatical error ("tjaldlíf minni notalegt" should be "tjaldlífið minna notalegt") and, more substantively, that contrasting ordinary poor weather with "dangerous" weather ("veðrið er ekki hættulegt"/"the weather isn't dangerous") is tonally wrong: genuinely dangerous conditions are rare, and this `consider` state normally describes only modest comfort differences. Ripley confirmed the same danger-contrast pattern also existed in the live `icConsiderFallback` (`InstantComparison.jsx`'s consider-state fallback copy) and in `routePainConsiderBulletLessPleasant`'s "serious warnings" contrast. This revision reopens exactly these three bilingual translation values.

### Changes made (translation values only, EN + IS)

`src/i18n/translations.routePlanner.js`:
- `routePainConsiderBody`: EN "The weather may not be dangerous, but it could still make camping less pleasant." → **"Poor weather can still make camping less comfortable."** IS "Veðrið er ekki endilega hættulegt, en það gæti gert tjaldlíf minni notalegt." → **"Slakt veður getur samt gert tjaldlífið minna notalegt."** (the exact wording specified by the approved prompt, including the grammar fix).
- `routePainConsiderBulletLessPleasant`: EN "Conditions may be unpleasant even if no serious warnings are active." → **"Conditions may be a little less comfortable than ideal."** IS "Aðstæður gætu verið óþægilegar jafnvel þótt engar alvarlegar veðurviðvaranir séu virkar." → **"Aðstæður gætu verið aðeins minna notalegar en best verður á kosið."**

`src/i18n/translations.common.js`:
- `icConsiderFallback` (rendered in `InstantComparison.jsx`'s consider-state fallback, Brochure-only per CLAUDE.md): EN "The weather isn't dangerous, but it may be worth checking nearby options." → **"Conditions nearby may be a little different — worth comparing or keeping an eye on things."** IS "Veðrið er ekki hættulegt, en það gæti verið þess virði að skoða valkosti í nágrenninu." → **"Aðstæður í nágrenninu gætu verið örlítið öðruvísi — vert að bera saman eða fylgjast með."** Neither language implies moving is recommended (test-enforced, see below).

No component, scoring, recommendation/data-flow, forecast-input, candidate-selection, tier/entitlement, CTA-behavior, analytics-semantics, research-fixture, or checkout/payment code was touched. No other hazard copy (i.e. copy describing genuinely hazardous states elsewhere in the app) was changed — only these three `consider`-specific keys.

### Test extension

New describe block in `src/components/HomeDecisionCard.test.jsx`, "#396 Revision 3: consider copy has no danger/hazard framing":
- a shared danger/hazard/severe-warning pattern (`danger`, `dangerous`, `hazard`, `serious warning`, `hætta`, `hættulegt`, `alvarleg... veðurviðvörun`-shaped) asserted absent from all three keys, both languages;
- a dedicated grammar test asserting IS `routePainConsiderBody` contains "minna notalegt" and never "minni notalegt";
- a real-copy test proving none of the three keys resolves to its own key name (i.e. remains genuine translated text) in either language;
- a dedicated test proving `icConsiderFallback` never implies moving is recommended, in either language.

**No `InstantComparison.jsx` test file exists in this repository** (confirmed via search — there is no `InstantComparison.test.jsx`), so the v3 prompt's "InstantComparison tests that cover the fallback where available" resolved to "not available" — `icConsiderFallback`'s copy is instead covered directly via the translation-content tests above, which is the same testing approach already used throughout this ticket for every other translation-only change. Creating a new `InstantComparison.jsx` test file was judged outside this revision's narrow "translation values for the three named keys plus focused tests" scope, and is not required by the prompt's own "where available" qualifier.

### Verification — exact commands and results

1. Focused `HomeDecisionCard`/translation tests + `RoutePlannerCard.test.jsx` + #395 research scenario/page tests — `npx vitest run src/components/HomeDecisionCard.test.jsx src/components/RoutePlannerCard.test.jsx src/lib/researchQuiz/scenarios.test.jsx src/pages/DecisionQuizResearch.test.jsx` → **116/116 passed**, 4 files (was 110/4 in Revision 2 — +6 for the new Revision 3 describe block's cases).
2. Full suite — `npx vitest run` → **899/899 passed**, 79 files (up from 893/79 in Revision 2 — +6 tests, same file count).
3. `npm run lint` → exit 0, no output.
4. `npm run build` → succeeded, same pre-existing unrelated chunk-size notice as every prior run.

No command was skipped or reported as passing without actually running.

### Deviations and remaining risks

1. **No `InstantComparison.jsx` test file exists to extend** (noted above) — `icConsiderFallback` is covered via translation-content assertions only, not a component-render test. This mirrors how `RoutePlannerCard`'s CTA-body keys were covered in Revisions 1–2 (translation content, not a new render test for that surface either), so it is consistent with this ticket's established testing pattern, not a new gap.
2. No STOP condition was triggered — all three translation values were updated within the narrow scope, with no component/logic change required.
3. **Human comprehension validation has still not occurred** — unchanged from Revisions 1–2; the `/research/decision-quiz` rerun-and-record checklist in §8 above remains Róbert's own follow-up step, separate from this copy correction.

### Handoff (Revision 3)

`docs/ai/CURRENT.md` CC report path remains this file; stage set to `CC_COMPLETE`. **Not committed. Not pushed.**
