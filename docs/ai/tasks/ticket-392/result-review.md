# Result Review — Ticket 392 (Northern Lights MVP UX/UI + paywall)

Reviewer: Jonesy
Input: `approved-prompt-v1.md`, `cc-report.md`, and the actual files in the working tree — including direct verification of the resolution to this ticket's own central flagged risk (candidate-ID tier-independence), not just the report's narrative about it.

## Compliance with approved prompt

Most of this ticket's requirements check out well against source, not just the report:

- **Tier-independent request boundary.** Read `useAuroraDecision.js` directly: its signature is `{ enabled, evening, locationIds, fetchImpl }` — no tier parameter exists anywhere in the request path. Read `NorthernLightsCard.jsx`: `locationIds: AURORA_CANDIDATE_LOCATION_IDS` is passed unconditionally, with no `isPro` branch anywhere near it. Free and Pro genuinely cannot request different data — this isn't just asserted by the report, it's structurally true from the code.
- **Request-key normalization/reuse.** `auroraCandidateRequest.js`'s dedupe+sort before both body and key, `auroraDecisionCache.js`'s single `getOrCreateAuroraDecision` mechanism for both in-flight and bounded (5 min) recently-resolved reuse, explicit cache invalidation before `retry()`, and `keyRef`-based obsolete-completion protection in `useAuroraDecision.js` — all present and consistent with what Revision A required.
- **Seasonal suppression.** `isAuroraSeason`/`enabled` gate correctly means the effect never constructs a fetch when out of season — matches the requirement that hiding suppresses network work, not just rendering.
- **`unknown_location_ids` handling and stale/partial orthogonality.** The primary-outcome × freshness matrix in §6 of the report matches Ticket 3's real, previously-verified contract, and correctly keeps `contract_defect` distinct from `domain_unavailable`.
- **`night_not_found` → `domain_unavailable`, not `no_darkness`.** This is the right call: a missing cache entry for the requested evening is a data-availability gap, not an astronomical fact, and treating it as "not dark enough" would be a fabricated claim. Correctly flagged by CC for review rather than silently decided.

## Material finding

**The fixed 6-location Aurora candidate roster is drawn entirely from a dataset that is disjoint from what Free users' own campsite list ever contains — and this tension is never examined or disclosed anywhere in the report, despite being the resolution to the ticket's own explicitly flagged central risk.**

Verified directly: `server_data/campsites.full.json` uses OSM-derived IDs (`osm_way_*`, `osm_relation_*`). `server_data/campsites.limited.json` — what `/api/campsites` actually returns to Free users — uses a completely different, disjoint ID scheme (plain slugs: `laugardalur_reykjavik`, `grindavik`, `vik`, `hofn`, etc.). I grepped all six IDs in `src/config/auroraCandidates.js` (`osm_way_712155124`, `osm_relation_17808139`, `osm_relation_13660177`, `osm_way_249836961`, `osm_way_202178652`, `osm_way_233309453`) against `campsites.limited.json`: **zero matches.** All six fixed candidates are Pro-dataset-exclusive locations that a Free user never encounters through their own tier-gated `/api/campsites` response.

`src/config/auroraCandidates.js` is a plain, unconditionally-imported module — not gated by tier at all — so its `AURORA_CANDIDATE_LOCATION_IDS` array (the actual runtime string literals, which survive minification since they're used, unlike the human-readable `//` comments naming each site which a production minifier would typically strip) ships in the same JS bundle every user downloads, and is sent verbatim in the `/api/aurora-decision` request body regardless of tier. This is the first place in the app where any `campsites.full.json`-sourced data reaches a Free user's client at all, given `/api/campsites` has always kept that dataset server-side and tier-gated specifically to avoid exactly this.

To be precise about severity: this is not a "full dataset dump" — it's 6 specific IDs, and OSM data is itself public map data, not a secret proprietary database, so the actual harm is narrow (a technically curious Free user could learn 6 specific site names/IDs exist in the Pro dataset, via network tab or bundle inspection — never via rendered UI, which the report's DOM-non-disclosure tests do correctly verify). But it is a real, novel exposure this ticket introduces, it runs directly against the approved prompt's own explicit language ("without... exposing hidden Pro data," §1; "Hidden Pro data must not exist in Free DOM, accessibility labels, or map props," §5 — the report only verified the DOM/accessibility half of that sentence), and — most importantly for this review — **the report never surfaces this trade-off at all**, despite explicitly modeling exactly this kind of transparent disclosure for a less consequential judgment call elsewhere (§13.1, `night_not_found`). Given this is the resolution to the one risk the approved prompt itself flagged with its own STOP condition, it should have gotten at least as much scrutiny and disclosure as the `night_not_found` call, not none.

This also isn't trivially fixable by "just pick candidates that are already in `campsites.limited.json`" — since Ticket 3 only accepts IDs resolvable against `campsites.full.json`, and the two datasets use entirely disjoint ID schemes, **no fixed roster of valid Ticket-3 candidates can avoid drawing from the Pro-exclusive dataset.** That's a genuine architectural tension inherent to the fixed-roster approach given how these two datasets are actually structured — not a CC oversight in ID selection, but it does mean this can't be silently waved through as "solved."

## Recommendation

This needs one of, made explicit before `CLOSED`:

1. **Róbert's explicit sign-off** that 6 specific real-world (public OSM) campsite names/IDs being present in the client bundle and outbound request — never rendered, only network/source-inspectable — is an acceptable trade-off given what `/api/campsites`'s tier gate is actually protecting (most plausibly the Free/Pro *comparison-volume* feature, not secrecy of any individual site's existence); or
2. A documented mitigation if the trade-off is judged unacceptable — acknowledging per the analysis above that there may not be a clean one available within this ticket's no-new-backend scope, in which case this may itself be a legitimate STOP-condition case Ripley/Róbert should weigh in on rather than something Jonesy should silently pass.

I'm not asserting this is disqualifying — it may well be a reasonable, acceptable trade-off. The problem is that it was never reasoned about or disclosed, on the exact question the approved prompt itself treated as the ticket's central gate.

## Everything else

No other material issues found. Test/lint/build figures (58/58 new, 142/142 relevant, 869/869 full suite, lint/build pass) are CC's self-report and not independently re-executed here, consistent with this session's standing limitation (no shell access to Róbert's machine). The manual accessibility/responsive/dark-mode verification is honestly disclosed as not performed in a real browser, same limitation noted on prior tickets.

## Verdict

**REVISE.** Everything else in this ticket is solid, well-verified engineering — but the one finding above goes directly to the risk the approved prompt itself flagged as this ticket's central gate, and it was resolved without the disclosure that risk deserved. Return to Ripley for a decision (owner sign-off or a documented mitigation) before this can be `CLOSED`.

---

## Ripley Final Assessment

Assessor: Ripley  
Date: 2026-08-27

### Independent verification

- Read the approved prompt, CC report, Jonesy's result review, the implemented fixed roster, and both canonical campsite datasets.
- Independently checked every ID in `src/config/auroraCandidates.js`: all 6 occur in `server_data/campsites.full.json`; 0 of 6 occur in `server_data/campsites.limited.json`.
- Independently ran:
  - `npx vitest run src/lib/auroraCandidateRequest.test.js src/hooks/useAuroraDecision.test.js src/components/NorthernLightsCard.test.jsx`
  - Result: **32/32 passed** across 3 test files.
- The first sandboxed test attempt could not load `vitest.config.js` because filesystem traversal was denied; the same command was rerun with approved access and passed. No source or test file was changed during this assessment.

### Assessment

Jonesy's material finding is confirmed. The implementation's rendered Free UI correctly withholds best-location names, coordinates, scores, reasons, ranking, and map data, and the independently rerun high-risk tests pass. However, the fixed roster embeds and transmits six IDs sourced exclusively from the Pro/full dataset to every client, including Free users. That is a narrow exposure of public OSM-derived identifiers rather than a full dataset disclosure, but it is still a new client/network exposure and conflicts with the approved prompt's central preflight requirement unless the project owner explicitly accepts the trade-off.

This cannot be resolved responsibly through an unreviewed code change. The two valid paths are:

1. Róbert explicitly accepts that these six public campsite IDs may exist in the Free bundle/request while their names, coordinates, scores, reasons, ranking, and map remain gated; after that explicit sign-off, Ripley can reassess closure without requiring implementation changes.
2. Róbert rejects that exposure; a new prompt/review round must define a mitigation. Because Ticket 3 only accepts full-dataset IDs and the Free/full ID namespaces are disjoint, a clean mitigation may require deliberately expanding the current no-new-backend/Ticket-3 scope rather than pretending the fixed roster can be swapped for limited-dataset IDs.

### Final verdict

**BLOCKED — explicit owner decision required.**

No code revision is prescribed until Róbert chooses whether the six-ID bundle/request exposure is an acceptable product trade-off. No commit and no push were performed.

---

## Jonesy — Answer to the Product Question

Reviewer: Jonesy
Date: 2026-08-27

Asked directly: does Jonesy approve the six fixed Aurora candidate IDs (Pro/full-dataset-exclusive OSM identifiers) reaching Free clients via the JS bundle and the `/api/aurora-decision` request body, given that names, coordinates, scores, reasons, ranking, and map data all remain correctly gated?

**Yes — I approve this trade-off**, as a bounded, reviewed exception. Reasoning:

1. **What's actually exposed is narrow and public.** OSM way/relation IDs are public map identifiers, not proprietary data — anyone can resolve them via openstreetmap.org. The exposure is 6 fixed IDs, never rendered to Free's DOM (confirmed by CC's own DOM-non-disclosure tests), visible only via network tab or bundle inspection to a technically curious user.
2. **The tier gate's actual value isn't secrecy of any single site's existence.** The plausible product value of `/api/campsites` being tier-filtered is Pro's comparison *volume* (many more sites to browse/compare), not hiding that any individual OSM location exists. Six IDs leaking doesn't undermine that value proposition.
3. **No clean in-scope alternative exists.** Ticket 3 only accepts IDs resolvable against `campsites.full.json`; that dataset and `campsites.limited.json` use disjoint ID schemes. Any fixed, tier-independent roster — which the approved prompt itself required — necessarily draws from the Pro/full dataset. This isn't a CC shortcut; it's structural.
4. **Everything that matters for the Free/Pro paywall stays locked.** Names, coordinates, scores, reasoning, ranking, and map data — the actual product content being paywalled — are all verified gated. The IDs alone carry no comparative or ranking information.

**Condition attached to this approval:** this should be recorded as a deliberate, bounded exception — not a precedent. If a future ticket needs a larger or dynamic candidate set, drawing more of `campsites.full.json` into client-reachable paths should get its own explicit review, not silently ride on this approval.

With this sign-off, I have no objection to Ripley closing #392 with `PASS`, provided this addendum (or an equivalent note) stays in the permanent record so the trade-off is documented rather than silently accepted.

---

## Owner Sign-off and Ripley Final Resolution

Owner: Róbert  
Date: 2026-08-27

Róbert explicitly approved the same bounded trade-off approved by Jonesy: the six fixed, public OSM-derived Aurora candidate IDs may be present in the Free client bundle and `/api/aurora-decision` request body, while names, coordinates, scores, reasons, ranking, and map data remain gated from Free presentation.

This is a deliberate exception for this six-ID fixed roster, not a precedent for exposing a larger or dynamic portion of `campsites.full.json`. Any future expansion requires its own review.

The sole blocker recorded in Ripley's earlier assessment is therefore resolved. No implementation revision is required. Ripley's independently rerun high-risk tests remain **32/32 passed**; CC's full-suite, lint, and build results remain attributed to `cc-report.md`.

### Final verdict

**PASS.**

Ticket 392 is complete and may move to `CLOSED`. Commit, push, and GitHub issue closure remain human-controlled under `docs/ai/README.md`. No commit or push was performed by Ripley.
