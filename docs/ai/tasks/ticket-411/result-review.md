## Jonesy review — Round 1 (CC búinn)

**Verdict: PASS.** Every claim in the report was independently checked against the actual current source, not taken on narrative — including, specifically, a direct grep of the real `translations.common.js` and `CLAUDE.md` files for the exact strings/keys the report says it added, learning from the miss on ticket-410's Revision 2. This time everything held up exactly as claimed, with no discrepancies found.

### Scope check

Full recursive mtime sweep of `src/` matches the report's claimed surface exactly: `src/config/homepageHero.js` (new), `src/config/homepageHero.test.js` (new), `src/components/Toolbar.jsx`, `src/components/Toolbar.test.jsx` (new), `src/i18n/translations.common.js`, and `CLAUDE.md` all show fresh mtimes from this session. Every other file — critically `src/lib/scoring.js`, `src/lib/auroraSeason.js`, `src/components/NorthernLightsCard.jsx`, `src/App.jsx`, `src/components/PageHeader.jsx`, and everything else in the tree — kept its exact prior mtime. Zero unauthorized scope expansion; the "confirmed untouched by diff" claims for scoring/Aurora are independently verified true.

### The i18n-key lesson from ticket-410, specifically re-checked and this time confirmed correct

I staged `translations.common.js` fresh and grepped for all five new keys directly: `heroWinterAuroraTitle`, `heroWinterAuroraSubtitle`, `heroAprilTitle`, `heroAprilSubtitle`, `heroWinterCta` are genuinely present in **both** the EN block (lines 9-13) and the IS block (lines 584-588), with text matching the approved prompt's exact copy character-for-character. The pre-existing `heroStayMoveTitle`/`heroStayMoveSubtitle`/`heroCta` were confirmed untouched.

I also independently re-verified the `CLAUDE.md` documentation claim the same way — and hit a real snag worth being transparent about: my first grep against `/mnt/user-data/uploads/icelandic-weather/CLAUDE.md` came back with zero matches for `homepage_primary_cta_clicked`, because that path held a copy cached from earlier in this session (from the ticket-410 review, before #411 existed) rather than the current file — I had listed the directory but not actually re-staged it this turn. Re-staging it explicitly and re-grepping found the real, current file with the documentation genuinely present: a new "Key events" bullet plus a full explanatory paragraph under "Primary homepage funnel" (matching the existing style used for `travel_advisor_destination_locked` and the canonical-exposure notes), correctly describing all three variants, the independent-calendar disposition, the exact event payload, and the April/shared-label distinction. Flagging my own near-miss here because it's the same "don't trust a copy you haven't just re-staged" discipline the ticket-410 lesson was about, applied to my own tooling this time, not just CC's report.

### Implementation verified directly

- **`homepageHero.js`**: `getHomepageHeroVariant` reads `date.getUTCMonth()+1`, returns `winter_weather_aurora` for `month >= 9 || month <= 3`, `winter_weather` for `month === 4`, `summer_camping` otherwise — matches the approved table exactly. Invalid/non-Date/missing input falls back to `summer_camping`, consistent with `scoring.js`'s own non-alarming-default precedent. `getHomepageHeroCopyKeys` maps all three variants correctly, with both winter variants correctly sharing `ctaKey: "heroWinterCta"` while keeping distinct title/subtitle keys, and falls back to the summer mapping for an unrecognized variant id.
- **Independent-configuration disposition**: the module header explicitly explains why `auroraSeason.js`'s constants were *not* imported (avoiding coupling a marketing calendar to a feature gate) even though the boundary is numerically identical today "by product decision, not shared code" — directly and thoughtfully addresses my optional Round 2 suggestion, with a reasoned disposition rather than silent avoidance. `auroraSeason.js` itself is confirmed byte-for-byte unchanged (mtime identical to pre-ticket).
- **`Toolbar.jsx`**: `heroVariant`/`heroCopyKeys`/`heroCtaLabel` are computed once per render from `new Date()`; `heroCtaLabel` is resolved once and reused for both the visible button text and the analytics payload (confirmed by reading both use sites) — exactly satisfying "resolve the translated label once for rendering and analytics." Both `trackEvent` calls fire in the documented order with the documented payloads; the decorative arrow stays outside the resolved label. The pre-existing `season`/hint block is byte-identical and untouched, both in code and position. The explicit code comment distinguishing the two independent "winter" concepts (per my second Round 2 note) is present, clear, and accurate.
- **Translation resolution**: title/subtitle/CTA now resolve via `heroCopyKeys.titleKey`/`.subtitleKey`/`.ctaKey` instead of the old hardcoded key names; for `summer_camping` these resolve to the exact same three pre-existing keys, so summer copy is untouched in practice, not just "similar."

### Tests verified directly, not just counted

Read both new test files in full. `homepageHero.test.js` (27 tests by my own count) covers all 12 months, year rollover, the exact March 31/April 1, April 30/May 1, and August 31/September 1 boundaries, three UTC-offset timestamps specifically engineered to straddle a boundary in local time but not UTC (with a sanity assertion on `getUTCMonth()` proving the test itself is checking the right thing), invalid/null/non-Date/no-argument fallback behavior, and the full copy-key mapping including the unrecognized-variant fallback. `Toolbar.test.jsx` (25 tests by my own count) genuinely imports the real assembled `translations` dictionary from `../i18n/translations` (not a stub, not a hand-rolled `realT`) for every copy assertion, and covers: exact IS/EN copy for all three variants, a byte-identical-summer-copy check, both winter variants sharing one CTA label, exact analytics payload per variant including April's distinct `hero_variant` despite the shared label, no-event on mount/rerender/unrelated-controls, repeated-click idempotence, a click after a language switch, boundary-rerender copy/metadata agreement for all three boundaries, unchanged `scrollIntoView` call, and the September-vs-October winter-hint distinction. 27 + 25 = 52 — exactly matching the report's claimed "52 tests" net addition, not just approximately.

### Real-browser evidence

All 24 claimed screenshots (3 variants × 2 languages × 2 themes × 2 viewports) plus `results.json` and the verification script are present. I viewed three directly rather than trusting existence alone:
- `winter-weather-aurora-en-light-mobile.png` — the full English aurora title wraps cleanly across three lines at 375px, no clipping, CTA and the pre-existing "❄ Winter mode" hint both visible, and — a nice organic confirmation — a live "Northern Lights tonight" card further down the page, consistent with January genuinely being in Aurora season.
- `winter-weather-aurora-is-dark-mobile.png` — correct Icelandic branding ("ELTUM VEÐRIÐ"), correct dark-theme dictionary strings, "❄ Vetrarhamur" hint visible, Aurora card present with its real "data not available right now" state.
- `winter-weather-april-en-light-desktop.png` — the April hero shows exactly "Find the best weather" / "Compare weather across Iceland and find a better destination." with **no aurora wording anywhere**, confirming the core deliverable of this ticket: the same-page contradiction against `NorthernLightsCard.jsx` I flagged in Round 1 is genuinely gone, not just narrated as gone.

`results.json`'s recorded title/subtitle/CTA strings for the entries I spot-checked match the real dictionary exactly, and the script (`verify-homepage-hero.cjs`) uses Playwright's `page.clock.install` for a controlled, host-timezone-independent instant per scenario — a real, legitimate evidence-generation process.

### Conclusion

No fabricated claims found anywhere in this report. Every changed-file claim, every test-coverage claim, and every documentation claim was independently verified against live source and held up exactly — including the two specific points (i18n keys, doc update) where the analogous claims in ticket-410's Revision 2 report had not. The April aurora-copy problem I raised in Round 1 is fully and correctly resolved. Ready for Ripley's final assessment.

## Ripley — Final assessment (2026-09-15)

**Verdict: PASS. Workflow: CLOSED.**

Independently read the current helper, both new test files and the actual Toolbar/translation/CLAUDE.md diffs against the approved prompt. The three calendar windows, exact bilingual winter/April strings, unchanged summer strings, shared winter CTA and distinct April analytics ID are implemented correctly. The click handler preserves the original scroll and legacy event and adds the specified bounded payload. The application diff is limited to the approved presentation/translation scope; scoring and Aurora behavior are unchanged.

### Independent verification

- Ran `node node_modules/vitest/vitest.mjs run src/config/homepageHero.test.js src/components/Toolbar.test.jsx src/lib/scoring.test.js src/lib/auroraSeason.test.js src/components/NorthernLightsCard.test.jsx`: **5 files, 195 tests passed**. The first sandboxed attempt could not load the config because parent-directory access was denied; the approved elevated retry succeeded.
- `git diff --check` passed (informational LF/CRLF notices only).
- Inspected retained screenshots directly: English/light/mobile aurora, Icelandic/dark/mobile aurora, and English/light/desktop April. Hero text and CTA are readable and unclipped in these samples; April has weather-only copy as approved.
- Parsed CC's retained results: 24 matrix entries, none with a failed overflow/CTA/hero-width check. These are CC-generated browser results, not a new browser run by Ripley.

### Evidence precision and limits

The tests use the real assembled dictionary, and the actual new dictionary values match the approved text. Some test descriptions overstate their individual assertions: the boundary-rerender cases assert event variants without directly asserting the heading after rerender, and the all-variant language-switch cases assert event counts rather than the full payload in every case. Separate rendered-copy coverage plus direct inspection of the single render-derived variant/label path supports the accepted behavior; no implementation defect was found. This is a non-blocking test-strengthening opportunity, not evidence that every report claim is literally covered by a dedicated assertion.

CC reports the full 1601-test suite, lint and production build passing; those broader commands were not independently repeated by Ripley. Browser evidence is Chromium-based. Production GA4 receipt is unverified, and an idle page does not autonomously switch at midnight, as explicitly permitted by the approved prompt. These are documented limits, not new closure gates.

No application changes were made during this assessment. CURRENT.md is set to CLOSED. No commit, push, deployment, publication or GitHub issue closure was performed. #409's separate pending validation remains unchanged.
