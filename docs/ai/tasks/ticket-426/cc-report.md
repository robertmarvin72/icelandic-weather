# #426 — CC report (approved-prompt-v1.md)

`CURRENT.md` moved READY_FOR_CC → CC_IN_PROGRESS first. Working tree at start: only the ticket-426 prompt documents were untracked (#423/#425 already committed as 59ec5cea/d8c48460). No commit, push, deployment or issue closure performed.

## 1. What was implemented

### Homepage Free value block (§1/§2)
`AuroraNightOutlook.jsx` gained a new `FreeValueBlock` component, rendered only when `surface === "homepage" && !isPro && !loadingMe` (`showHomepageFreeValue`), replacing the old generic `nlMultiFreeHint`/`nlUpgradeCta` pair on that surface only:

- **Qualifying result**: heading/body/CTA = the exact issue strings (`nlMultiFreeValueHeading/Body/Cta`). One CTA, no second CTA.
- **Poor/very-poor result** (`!display.hasQualifyingLocations`): a new, separate truthful block using the exact issue strings (`nlMultiFreePoorHeading/Body/Cta`) — Free previously got no upgrade content at all in this branch; it now gets a comparison-oriented block that never claims a location is recommended. The existing best-of-poor Pro disclosure rule is untouched (still no ranking/map for a poor result, Pro or Free).
- Both blocks carry a small caption naming the **selected** night (`nlMultiFreeValueForNight`, `"For {when}"` / `"Fyrir {when}"` — new, additive, not one of the mandated exact strings) built from the same `when` label the rest of the module already uses, so the block never implies "tonight" when a different night is selected. Verified by test: switching to "Tomorrow night" changes the caption from "For tonight" to "For tomorrow night" with no other layout change.
- Landing's `LockedValue` block, its keys, and its copy are **completely untouched** — the `!isPro && !isHomepage` branch is unchanged code, unconditioned on `loadingMe` (matches Jonesy requirement #2's explicit landing exclusion).
- Free receives no location name/coordinate/reason through the DOM or accessibility text in either block (verified by test — neither block reads any field off the canonical result at all).

### Analytics (§4, Jonesy requirement #1)
`NorthernLightsThreeNight.jsx`'s `handleUpgrade` now remaps the click source to `"northern_lights_homepage"` when `surface === "homepage"` before building every payload and before forwarding to the real `onUpgrade` callback:

- `northern_lights_upgrade_clicked` (homepage): `{ lang, source: "northern_lights_homepage", tier: "free", upgrade_source: "northern_lights_homepage" }` — exact literal shape, verified by test.
- `northern_lights_multi_day_upgrade_clicked` (homepage): existing fields unchanged (`selected_date, days_ahead, forecast_status, user_tier, source: "homepage"`) plus `upgrade_source: "northern_lights_homepage"`.
- Landing: **byte-identical to before** — `source: "northern_lights_card"` on `northern_lights_upgrade_clicked` (no `upgrade_source` field at all), `source: "landing"` on the multi-day event (no `upgrade_source`), `northern_lights_landing_cta_clicked` still fires only there. Verified by test.
- `onUpgrade("northern_lights_homepage")` is forwarded to the real checkout callback exactly once per click — verified against the **real** `useCheckoutFlow`/navigate adapter (see §4 below), not a mock of it.
- No new event name/system; nothing fires on render, mount, or duplicate click.

### IS homepage detail link removed (§3)
`NorthernLightsThreeNight.jsx`: the `Link` is now gated `isHomepage && lang !== "is"` (previously just `isHomepage`). Verified absent for both tiers, after switching night, and after expanding Pro details (IS). The EN homepage link, its href (`/en/northern-lights?date=<selected>`), and the landing route/query handling are all unchanged and re-verified by the existing (now-updated) hand-off tests.

**`nlHomeDetailsLink` IS translation value — explicit disposition (required to report):** the IS string (`"Sjá nánar á ensku síðunni"`) is **retained in `translations.northernLights.js` for EN/IS dictionary symmetry**, per the approved prompt. After this change it has **no production render path** on the IS homepage or anywhere else — confirmed by `grep` (its only reader was the now-removed IS branch of that `Link`) and by a dedicated test asserting `screen.queryByText(translations.is.nlHomeDetailsLink)` is null on the real rendered IS homepage. As a related side effect of replacing the qualifying Free block, `nlMultiFreeHint` also becomes production-unused on the homepage (it was never a landing key); `nlUpgradeCta` is **not** orphaned — it's still read by the retained-but-unmounted legacy `NorthernLightsCard.jsx` (#425's orphan report already covers that component's own status). No keys were deleted, per the prompt's "do not remove unrelated language-switching links or keys."

### Entitlement-loading guard (§2, Jonesy requirement #2)
`AuroraNightOutlook.jsx` gained a `loadingMe` prop (`NorthernLightsThreeNight.jsx` forwards its own `loadingMe`). `showHomepageFreeValue = isHomepage && !isPro && !loadingMe` gates **both** the qualifying and the poor Free blocks identically — while `loadingMe` is true, neither block renders regardless of the (possibly still-defaulting-to-Free) computed `isPro`, so a Pro user is never briefly shown a Free upsell. The general forecast (pill/headline/body/stale-partial notices/update-time line) is rendered unconditionally, never hidden by this guard. Verified by 4 tests: qualifying-branch hide/show/hide across loading→Free→Pro, poor-branch hide/show, and two "resolve while a non-default night is selected" tests proving the selected tab and pill content survive the entitlement transition unchanged (using a same-shaped-tree `rerender` so the component instance is genuinely preserved, not remounted — see the "act discovery" note in §7).

### Selected-night description and its explicit boundary (§1)
The whole module already only ever renders the **currently selected** slot's data (established in #423/#425); this ticket's new blocks reuse that same `when` label, so "describes the selected night, not tonight by default" was largely already structurally true — the new caption makes it explicit in the copy too. No selection reset was added or is triggered by: CTA click, login-modal open/close (verified against the real modal), an entitlement-loading transition, or an ordinary rerender.

**Explicit reported boundary (as required):** there is still **no date-through-checkout contract**. `startCheckout`/`useCheckoutFlow` only ever passes `email` and `src` to `/pricing`; it does not and was not made to carry the selected date. Confirmed by source inspection (`useCheckoutFlow.js`) and by the new real-adapter test: a logged-in click navigates to `/pricing?src=northern_lights_homepage&email=...` with no date parameter. **Also reported, not fixed (already noted as out of scope by the approved prompt):** `useLoginFlow.js`'s existing post-login navigation (`navigate(\`/pricing?email=${email}\`)`, both the existing-user and new-user paths) carries **only** `email` — it does not carry `src` either, confirmed by source inspection and exercised by a real-modal test. So a logged-out Free visitor who logs in from this CTA reaches Pricing with **no attribution at all** (`upgrade_source` falls back to whatever `checkoutSource.js`'s resolver does for a missing `src`), not just missing the homepage-specific value. This is the exact pre-existing gap the approved prompt described and explicitly told me not to fix in this ticket; no protected login/payment code was touched.

## 2. Files changed

- `src/components/AuroraNightOutlook.jsx` — `FreeValueBlock`, `loadingMe` prop, poor-branch value block, qualifying-branch block replaced, header comment updated.
- `src/components/NorthernLightsThreeNight.jsx` — `handleUpgrade` source remap + `upgrade_source`, IS link removal, `loadingMe` forwarded to the outlook, header comment updated.
- `src/i18n/translations.northernLights.js` — 7 new EN keys + 7 new IS keys (additive only; no existing key's value changed, including no landing key).
- Tests: `src/pages/NorthernLightsLanding.homeHandoff.test.jsx` (updated + 12 new: IS link absence×2, qualifying-block copy/caption, poor-block copy/no-leak, upgrade payload/source, EN-only hand-off test replacing the old `it.each`, 4 loading-guard tests), `src/App.northernLightsAnchor.test.jsx` (2 tests updated for the new CTA/no-link), new `src/App.northernLightsHomepageCheckout.test.jsx` (3 tests: real logged-in navigation source, real logged-out modal + click-attribution, the reported login-continuation boundary), plus modal-preserves-selection test in that same file.

## 3. Tests, lint, build — exact commands and results (this run, not #425's old counts)

- Focused ticket-426 set: `npx vitest run src/pages/NorthernLightsLanding.homeHandoff.test.jsx src/App.northernLightsAnchor.test.jsx src/App.northernLightsHomepageCheckout.test.jsx src/components/NorthernLightsThreeNight.test.jsx src/components/NorthernLightsThreeNight.round5.test.jsx src/lib/checkoutSource.test.js src/pages/Pricing.upgradeSource.test.jsx` → **7 test files, 106 tests, all passed.**
- Full project: `npx vitest run` → **142 test files, 2000 tests, all passed** (up from #425's 141/1992 — net +1 file/+8 tests reflects the new checkout-adapter file plus the new/updated cases above, not a 1:1 count since several old tests were rewritten in place rather than added).
- `npm run lint` (whole repo): exit 0, no output.
- `npm run build`: succeeded, `built in 7.91s`.
- Existing checkout-source regression suites (`checkoutSource.test.js`, `Pricing.upgradeSource.test.jsx`, `Pricing.pass/renewal/staleSource/auroraFeature.test.jsx`, `Subscribe.renewal.test.jsx`) are all inside the full-suite run above and pass unchanged — none of their semantics were touched.

## 4. Real-adapter checkout/login verification (not a mock of the callback)

`src/App.northernLightsHomepageCheckout.test.jsx` renders the real `App` with only data-fetching hooks and Aurora network stubbed — `useCheckoutFlow`, `useLoginFlow`, and `LoginModal` are all real, and `useNavigate` is spied (not replaced) so the actual URL `useCheckoutFlow` builds is asserted directly:

- Logged-in Free: clicking the real CTA navigates to `/pricing?email=camper@example.com&src=northern_lights_homepage` — no login modal shown.
- Logged-out: clicking the real CTA opens the real `LoginModal` (`role="dialog"`), does **not** navigate, and still fires the click-attribution events with `upgrade_source: "northern_lights_homepage"`.
- A third test documents the login-continuation boundary described in §1 without attempting a real `/api/login` call (out of scope for this ticket).
- A fourth test opens and closes the real modal and confirms the selected night (tab + status pill) and the Aurora request count (3, unchanged) both survive the round trip.

## 5. Browser verification (new this task, real components)

Real Vite dev server + Playwright Chromium; `page.route` stubs for `/api/aurora-decision` (real current dates, D0 qualifying-excellent, D1 qualifying-good, D2 very-poor), `/api/me`, `/api/campsites`, `/api/forecast` (deterministic 7-day fixture). Matrix: {375px, 1280px} × {IS, EN} × {Free, Pro} = 8 runs, each checked on both the default (D0, qualifying) and day-2 (very-poor) selection. Observed in every run: no horizontal overflow; exactly one visible upgrade CTA for Free, zero for Pro; the IS runs never rendered `nl3-details-link` (`isLink=0`) while EN runs always did (`isLink=1`); the Free qualifying CTA received real keyboard focus with the correct accessible name; the poor-branch block showed the truthful "Compare locations with Pro" copy with no location name leaked. 16 screenshots are in `outputs/ticket-426-browser-evidence/`; I viewed the mobile EN Free poor-state and mobile IS Free poor-state screenshots directly (reproduced above).

**Known, pre-existing limitation (same root cause already documented in #425's report, not a new regression):** this headless Chromium build has no Icelandic ICU locale data, so `Intl.DateTimeFormat("is-IS")` silently falls back to `en-US`, producing "Fyrir Wednesdaykvöld" instead of the real Icelandic weekday-genitive form for the day-2 caption in the browser check. The underlying weekday-genitive transform itself is unit-tested (`auroraNightLabel.test.js`) directly against the intended real weekday names and is unaffected by this browser limitation; a browser with real `is` locale data renders it correctly.

## 6. Boundaries confirmed not touched

No backend/scoring/forecast/candidate/cache changes. No entitlement/pricing/checkout-plumbing changes — only the CTA's `src` string and one additive `upgrade_source` analytics field. No new route, general-language-routing change, library, or TypeScript. Landing page copy, CTAs, selected-date URL support, and both language routes are unchanged (re-verified by the full existing landing suite passing unchanged). `isFeatureAvailable`/`selectAuroraDisplay` gating logic itself was not touched — only which presentation block is chosen from their existing output.

## 7. Process note (for the record, not a defect)

While writing the entitlement-loading-guard tests, an early version used a `rerender()` call with a **differently-shaped** route tree (fewer siblings, a wildcard `Route` instead of the original two named routes) to change only `loadingMe`/`isPro`. This caused React Router to remount the matched component instead of updating it in place, silently defeating the exact "same instance, state preserved" guarantee the tests were meant to prove (the symptom was the whole module reverting to its loading state and the selected night resetting to tonight). Fixed by reusing one `homeAppTree(props)` helper with the identical tree shape for both the initial render and every `rerender` call, which genuinely preserves the component instance. Flagging this because it's a subtle testing-pattern trap specific to this codebase's `MemoryRouter`/`Routes` setup, not because it affected production behavior — the real app never remounts the module this way.

## 8. Status

Not committed, not pushed. `git status --short` confirms only the files listed in §2 changed, plus `docs/ai/tasks/ticket-426/` and `outputs/ticket-426-browser-evidence/` (both untracked). `CURRENT.md` set to CC_COMPLETE with this report path.
