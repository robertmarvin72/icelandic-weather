# #430 — v2 packet summary

See `review-packet/implementation-summary.md` (v1, frozen, byte-identical to what Jonesy already hashed) for the full original description. This file only adds the v2 corrections on top of it; it does not restate the whole implementation.

## Correction to the v1 summary (F5)

`review-packet/implementation-summary.md`'s "New files" section describes `AffiliateCta.jsx` as using a "decorative" SVG icon via a new `lucide-react` import, alongside similar language in `cc-report.md` (v1). **This was false.** `AffiliateCta.jsx` has no icon — title, body, button and disclosure only. `lucide-react` is used elsewhere in the codebase (e.g. `NorthernLightsThreeNight.jsx`'s `Sparkles`, and `#435`'s `Toolbar.jsx` `LogOut`), and that true fact about the codebase appears to have been mixed into #430's own report language by mistake. `AffiliateCta.jsx`'s diff (in both `review-packet/candidate.diff` and this packet's `candidate.diff`) can be read directly to confirm: no `lucide-react` import, no `<svg>`, no icon element of any kind.

The frozen v1 file itself is not edited (D6: "frozen v1 implementation-summary stays immutable"). `cc-report.md` (which is CC's own living report, not a frozen packet file) has had the equivalent false sentences corrected in place, with a dated v2 section explaining the change — see `cc-report.md`.

## What changed in v2 (see `change-list-v1-to-v2.md` for the full file-by-file list)

1. **F1** — the disclosure font-size floor (`text-[11px]` → `text-xs`), with a browser-measured font-size (≥12px) confirming it, across 7 contrast-matrix cells.
2. **F2** — real pixel-sampled contrast (not a Tailwind-class calculation) for title/body/disclosure/button-label, across homepage EN (320/1280 × light/dark), homepage IS (320, light), and landing EN (320, dark; 1280, light) — 7 cells, every element's minimum sampled-pixel contrast ≥4.5:1.
3. **F3** — the browser threshold check now installs its own real `IntersectionObserver` to prove a delivery happened before asserting `affiliate_offer_viewed` count `=== 0`, and asserts exactly `0` before / exactly `1` after a real scroll, with no presence-only or `<=1` checks remaining. The changing-night scenario proves the CTA never reaches 50% visibility from the night-tab interaction alone (a dispatched click, not a scrolling Playwright `locator.click()`).
4. **F4** — a new test proves the `App.jsx` pathname-reset branch is reachable by real in-place (no full remount) router navigation, via the holder's own recorded `startVisit` call sequence.
5. **F5** — corrected the false SVG/lucide-react and "Four events" statements (this file and `cc-report.md`/`experiment-note.md`).
6. **F6** — `experiment-note.md`'s baseline (Oct 1–7) and observation (Oct 8–12) are now correctly described as historical, pre-affiliate Northern Lights engagement windows (per the issue, independently verified via `gh issue view 430`), not a post-deployment window as v1 incorrectly had it.

No scoring/ranking/freshness/gating/payment/analytics-framework/backend change. No icon added. No new dependency. No Qwen re-run (the comparison in `local-review/local-review-comparison.md`, once Ripley writes it, remains about the original frozen v1 candidate with its documented partial coverage).
