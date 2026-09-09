# Result Review — Ticket 399

## Jonesy review — Round 1 (CC búinn)

**Verdict: REVISE**

## Method

Started from the user's own screenshot (not CC's throwaway script) showing the page header rendering as garbled/overlapping text ("Find [overlap] weather") directly under the logo, reproduced on both light and dark backgrounds. `cc-report.md` §7 explicitly addresses this exact visual and dismisses it as a screenshot-capture-timing artifact of CC's own throwaway Playwright script ("the `Brand` logo `<img>` appeared not to have finished loading in the captured frame... not a real defect"). Rather than accepting that explanation, traced the actual rendering mechanism in source.

- `src/components/Brand.jsx` (full read)
- `src/pages/NorthernLightsLanding.jsx` (header section, line 125)
- `src/pages/CampaignLandingPage.jsx` (header section, line 56 — the only other live consumer of `Brand`'s `size="slim"` variant)
- `src/components/Header.jsx`
- Repo-wide grep for `header-title`/`header-title-brand` CSS definitions

## Required finding: the header bug is real, reproducible from static CSS alone, and CC's dismissal of it is factually wrong

`Brand.jsx`'s slim variant renders a `h-10` (40px-tall) logo `<img>`, followed immediately by a tagline `<span>` carrying the class `-mt-7` when `isSlim` is true:

```jsx
className={`header-title header-title-brand dark:text-slate-100 ${
  isSlim ? "text-xs -mt-7" : "text-sm -mt-"
}`}
```

`-mt-7` is Tailwind for `margin-top: -1.75rem` (**-28px**). Grepping the whole repo confirms `header-title`/`header-title-brand` have no CSS definition anywhere — they are dead class names, so nothing overrides or compensates for that negative margin. The tagline text is pulled up 28px directly into the bottom of the 40px-tall logo image above it, producing exactly the overlapping "Find [logo] weather" artifact in the screenshot. This has nothing to do with image-load timing — it reproduces identically whether the logo image is fully loaded or not, because it's a static layout collision between two adjacent elements, not a race condition. CC's §7 explanation is incorrect, not merely imprecise.

**This is not new to Ticket 399.** `CampaignLandingPage.jsx` line 56 uses the exact same `<Brand t={t} size="slim" lang={lang} />` call and has the identical pre-existing bug — confirmed by reading its header markup directly. `Brand.jsx` is unmodified by this ticket (correctly listed as untouched in §2 of the report), so Ticket 399 did not introduce this defect. But Ticket 399's own approved prompt requires, as the first item of the page's structure (§2.1), "a minimal branded header appropriate to the existing product" — and what actually ships on `/en/northern-lights` is a header with its logo and tagline visually colliding, on the single page this ticket exists to drive paid and organic traffic to.

The problem for this review is not just the CSS bug itself but that it was investigated and then **misreported** as a non-issue in the CC report, using a plausible-sounding but incorrect root cause, rather than being traced to its actual source (which a five-line read of `Brand.jsx` would have shown).

## What needs to happen

This is a real, shared-component defect that predates Ticket 399, so fixing `Brand.jsx` itself would ripple beyond this ticket's declared scope (it would also change `CampaignLandingPage.jsx`'s rendering) — which is exactly the kind of ambiguous scope boundary the approved prompt's STOP conditions exist for. Two acceptable paths, either is fine with me, but silence is not:

1. Fix it locally on this route only (e.g. don't reuse the broken `size="slim"` composition, or pass a small variant that avoids the negative-margin collision without touching `Brand.jsx`'s shared default) — keeping the fix inside this ticket's diff and out of `CampaignLandingPage.jsx`'s path, or
2. Correctly document it as a confirmed pre-existing defect in a shared component, note that `CampaignLandingPage.jsx` has the same bug, and stop to report/ask before deciding whether fixing the shared component is in scope for Ticket 399 or should be its own ticket.

What isn't acceptable is what's currently in `cc-report.md` §7 — an incorrect explanation that closes the issue as non-existent. Please correct that section regardless of which path is taken, since the report is the record other reviewers (Ripley, Róbert) will read.

## Everything else — spot-checked, no further issues found this round

- `NorthernLightsLanding.jsx`'s forced-English construction matches exactly what was approved (`const t = useT("en")`, `lang = "en"` as plain constants, never reading `usePageRouteProps()`/`useLanguage()`).
- `entitlements` computation mirrors `App.jsx`'s real shape (`isPro`/`proUntil`), correctly omitting the dev-only override.
- `aurora_landing_viewed` firing logic is gated on `loadingMe` before marking `viewedRef`, matching the approved truthful-tier requirement.
- Metadata block (title/description/canonical/OG/Twitter/`html lang`) matches the approved shape and reuses the established origin convention.

I have not yet independently re-run the full test suite or diffed every claimed-untouched file for this round — that full independent verification pass is still warranted before a PASS, but the header defect above is blocking on its own regardless of what that pass finds, so I'm surfacing it now rather than waiting.

## Ripley final assessment — Revision 1

**Verdict: REVISE**

Ripley independently inspected `Brand.jsx` and `NorthernLightsLanding.jsx` and confirms Jonesy's blocking finding. The slim Brand composition places a 40px logo immediately before a tagline with `-mt-7` (negative 28px top margin), while the accompanying `header-title` classes have no compensating definition. The visible collision is therefore a real static layout defect, not image-load timing as stated in CC report §7.

This violates the approved requirement for an appropriate minimal branded header on the new paid/organic entry page. The remainder of Jonesy's spot-check found no additional issue, but a final PASS is not possible until the visual defect and inaccurate report are corrected.

The approved corrective v2 prompt chooses the smallest in-scope remedy: retain the shared `Brand` on this route but pass its existing `hideTagline` prop. This removes the collision without modifying the pre-existing shared slim variant or changing `CampaignLandingPage`. CC must add focused regression coverage, correct §7 of its report, rerun the required validation, and preserve all v1 behavior.

No implementation change, commit, or push was performed by Ripley.

---

## Jonesy review — Revision 2 (CC búinn)

**Verdict: REVISE**

## Method

Verified Revision 2's fix for the collision bug against source, then checked the user's new screenshots (homepage header vs. `/en/northern-lights` header, side by side) against the actual size classes involved.

- `src/pages/NorthernLightsLanding.jsx` — re-read the header line.
- `src/components/Brand.jsx` — re-read, focusing on the `size` presets.
- `src/components/Header.jsx` — confirms the site's own "not slim" default.
- `src/pages/Landing.jsx` lines 346–354 — the actual homepage header markup shown in the user's first screenshot.

## Collision fix: confirmed correct, and the CC report correction is accurate

`<Brand t={t} size="slim" lang={lang} hideTagline />` removes the `-mt-7`/logo collision by simply not rendering the tagline `<span>` at all — there's nothing left to collide with the logo. This is the right minimal fix for the reported bug, matches the approved v2 prompt exactly, doesn't touch `Brand.jsx` or `CampaignLandingPage.jsx`, and the new regression test's red→green methodology (temporarily reverting the prop, confirming the test fails on the real rendered tagline markup) is genuine proof, not a narrated claim. `cc-report.md` §7 is now corrected in place and no longer makes the false screenshot-timing claim. Both of these close out cleanly.

## New required finding: the resulting logo is far smaller than the branded header used everywhere else on the site

The user's two screenshots make this directly visible: the homepage header logo reads clearly at a glance; the `/en/northern-lights` header logo ("CHASE THE WEATHER") is small enough to be barely legible at normal viewing size. Checked against source, this isn't subjective — it's a real, large size difference:

- `Landing.jsx` (the actual homepage in the user's first screenshot) renders its own header logo with a hardcoded `className="h-32 w-auto object-contain shrink-0"` — **128px** tall, at every breakpoint, no tagline.
- `Header.jsx` — used elsewhere on the site (e.g. `/blog`) without `slim` — passes `size="full"` to `Brand`, which is `h-20 md:h-32` (**80px mobile / 128px desktop**).
- `/en/northern-lights` uses `size="slim"`, which is `h-10` — **40px**, unconditionally, at every breakpoint.

That's a 2x (mobile) to 3.2x (desktop) size difference between this page's header logo and the one used on the homepage and every other non-slim page. `size="slim"` was originally chosen in v1 following `CampaignLandingPage.jsx`'s precedent, and it happened to also be the variant with the tagline-collision bug — but nothing in the ticket actually requires the small size; it was inherited along with the bug, and Revision 2 fixed the collision without revisiting whether `slim` was the right size to begin with. The approved prompt's own requirement (§2.1, "a minimal branded header **appropriate to the existing product**") isn't satisfied by a logo this much smaller than the product's own established branding — "minimal" was about page content (no nav, no extra chrome), not about shrinking the logo itself to near-illegibility.

Worth noting for whoever picks the fix: switching this route to `size="full"` would very likely resolve both problems at once, not just the sizing one. In `Brand.jsx`'s non-slim branch, the tagline's class is `text-sm -mt-` — `-mt-` with nothing after it isn't a valid Tailwind utility, so it compiles to nothing; the collision that `-mt-7` causes in `size="slim"` doesn't exist in `size="full"`. That would mean `hideTagline` might not even be necessary anymore (the English tagline could render normally, small and beneath the logo, consistent with how `Header.jsx`'s full variant behaves elsewhere) — though that's a judgment call for whoever picks the correction, not something I'm requiring outright. What I am requiring is that the shipped logo be sized consistently with the rest of the site, not 40px.

## Everything else from Revision 2 — no issues

Test addition, validation results, and the "confirmed untouched" file list are all consistent with what the v2 prompt required and were not the subject of this round's finding.

## Ripley final assessment — Revision 2

**Verdict: REVISE**

Ripley confirms Jonesy's sizing finding from the live composition. Revision 2 correctly removes the collision with `hideTagline`, but retaining `size="slim"` fixes overlap by leaving the route with a 40px logo. The established full Brand contract is `h-20 md:h-32` (80px/128px), and the homepage reference is 128px. For a permanent paid/organic product-entry page, the materially smaller logo does not satisfy the approved requirement for branding appropriate to the existing product.

The approved v3 correction is deliberately route-local: use `size="full"` together with `hideTagline`. This restores the established readable size without reintroducing the tagline or touching shared `Brand.jsx` and its other consumers. Focused coverage must prove English logo presence, absent tagline, and the full responsive size classes; browser validation must cover mobile/desktop in both themes.

The collision correction and CC report correction from Revision 2 are accepted. No additional functional finding was identified, but no final PASS is possible until the logo-size correction and validation are complete.

No implementation change, commit, or push was performed by Ripley.

---

## Jonesy review — Revision 3 (CC búinn)

**Verdict: PASS**

## Method

Verified the approved v3 corrective prompt was executed exactly as specified.

- `docs/ai/tasks/ticket-399/approved-prompt-v3.md` (full read).
- `src/pages/NorthernLightsLanding.jsx` header line — confirmed `<Brand t={t} size="full" lang={lang} hideTagline />`, matching the approved change verbatim.
- `src/pages/NorthernLightsLanding.test.jsx` (full read) — confirmed the extended test genuinely asserts `h-20`/`md:h-32` presence and `h-10` absence on the real rendered `<img>` elements, plus tagline absence, exactly as `cc-report.md` §R3.3 claims. Cross-checked against `Brand.jsx`'s actual class strings (`h-10` for slim, `h-20 md:h-32` for full) — the assertions target real, existing class fragments, not invented ones.
- `device_list_dir` on `src/pages` — confirmed `Brand.jsx`, `Landing.jsx`, `CampaignLandingPage.jsx`, `Header.jsx`, and the two other Ticket 399 test files (`cardWiring`, `metadata`) all carry pre-Revision-3 mtimes; only `NorthernLightsLanding.jsx` and `NorthernLightsLanding.test.jsx` changed this round — matches the report's "confirmed untouched" claim exactly.

## Assessment

Revision 3 correctly resolves the sizing finding: the header now uses `size="full"` (the same `h-20 md:h-32` contract as the homepage and every other non-slim consumer), `hideTagline` is retained so the tagline still doesn't render, and the report accurately notes (without over-claiming it as something this revision needed to act on) that `size="full"`'s tagline class was never actually susceptible to the slim-variant's collision in the first place — consistent with what I flagged last round. The test's two red→green reverts (back to `slim`, and dropping `hideTagline`) each target exactly the regression they claim to catch, and the class-string assertions are checked against real `Brand.jsx` output rather than asserted blind.

All three Ticket 399 rounds are now closed: the forced-English contract, the collision fix, and the sizing fix are each independently verified against live source rather than taken on the report's word. Scope stayed exactly where the v3 prompt drew it — `Brand.jsx`, `CampaignLandingPage.jsx`, and the homepage header remain untouched.

Approved. Ready to close ticket-399.

## Ripley final assessment — Revision 3

**Verdict: PASS**

Ripley reviewed the approved v3 prompt, CC's Revision 3 report, Jonesy's PASS review, and the live implementation diff. The corrective implementation matches the approved scope exactly:

- `/en/northern-lights` now renders `<Brand t={t} size="full" lang={lang} hideTagline />`.
- The English logo therefore uses the established `h-20 md:h-32` responsive size contract while the tagline remains absent, preventing the original collision.
- The focused test exercises the real Brand output and asserts English logo presence, `h-20`/`md:h-32` presence, `h-10` absence, and tagline absence.
- `Brand.jsx`, `CampaignLandingPage.jsx`, the homepage header, Aurora logic, authentication, entitlements, checkout/payment plumbing, and unrelated routes remain untouched by the corrective revision.
- The forced-English contract, canonical shared card, page structure, truthful exact-once landing analytics, metadata, and source-forwarding behavior from v1/v2 remain intact.

Ripley independently ran the six targeted suites covering the Ticket 399 page, card wiring, metadata, real route matching, the shared Northern Lights card, and checkout analytics: **93/93 tests passed across 6 files**.

Separately, CC reports that the full suite passed (**1089/1089**), lint exited successfully, the production build succeeded, `git diff --check` was clean, and browser checks observed the correct 80px/128px logo with no tagline across mobile/desktop and light/dark combinations. Those broader results remain attributed to CC's Revision 3 report.

The remaining shared slim-Brand tagline defect on `CampaignLandingPage.jsx` predates Ticket 399 and was explicitly outside the approved corrective scope. It does not affect the completed `/en/northern-lights` route and is not a blocker for this ticket.

No remaining prompt conflict, correctness issue, or Ticket 399 scope violation was found. Ticket 399 is complete. No commit or push was performed by Ripley.
