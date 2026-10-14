# #430 — v1 → v2 change list

Base HEAD unchanged: `2091263f031b2fa8a6acf5a7ad7bb04281775ded`. Candidate grew from 15 to 16 files. 13 of the 15 v1 files are byte-identical in v2 (hashes match the v1 manifest exactly): `App.jsx`, `NorthernLightsThreeNight.jsx`, `translations.northernLights.js`, `NorthernLightsLanding.jsx`, `App.affiliateHolder.test.jsx`, `NorthernLightsThreeNight.affiliateCta.test.jsx`, `NorthernLightsThreeNight.affiliateCtaFallback.test.jsx`, `affiliateOffers.js`, `translations.northernLights.affiliateParity.test.js`, `affiliateImpressionHolder.js`, `affiliateImpressionHolder.test.js`, `analytics.affiliateGA.test.js`, `NorthernLightsLanding.affiliateHolder.test.jsx`. The remaining 2 v1 files changed (below), plus 1 new file.

## Changed (2 files)

- **`src/components/AffiliateCta.jsx`** (F1): the disclosure `<p>`'s class changed from `text-[11px]` to `text-xs`. One line, no other change. (v1 hash `4c2009df75…684ab9` → v2 hash `bfb669bb14…bc55b`.)
- **`src/components/AffiliateCta.test.jsx`** (F1): one new test added — "disclosure uses the text-xs class guard, not the old text-[11px]" (class guard only; the real evidence is the browser-measured font-size in `review-packet-v2/evidence/results-v2.json`). No existing test changed. (v1 hash `dbcc043def…ca3c` → v2 hash `09e73fde49…38920`.)

## New (1 file)

- **`src/App.affiliateHolder.inPlaceNavigation.test.jsx`** (F4): a new test that navigates within one mounted `<App/>` via `window.history.pushState` + a dispatched `popstate` (never a second `render(<App/>)` call), proving the pathname-reset branch's reachability through the holder's own identity (a wrapped `createAffiliateImpressionHolder` records every `startVisit` call). **Finding: the branch is reachable** — one holder instance received three ids (`/#1`, `/about#2`, `/#3`), and a callback captured before the navigation away did not consume the new visit's opportunity (2 impressions total, not 3). The existing unmount-based `/ → /about → /` test in `App.affiliateHolder.test.jsx` is unchanged and still passes.

## No other production or test files touched

Nothing else in the 15 v1 files changed. No scoring/ranking/freshness/gating/payment/analytics-framework/backend file is in this diff. No icon was added. No dependency was added.

## Report/runbook corrections made outside the candidate diff (F5/F6)

These are not "candidate" source/test files, so they are not in `candidate.diff`, but D6 requires them tracked and hashed (see `commands-results-v2.md` for the hash values):

- `docs/ai/tasks/ticket-430/cc-report.md` — removed the false "SVG decorative icon"/lucide-react-usage claims about `AffiliateCta.jsx` (it has no icon); appended a dated v2 section.
- `docs/ai/tasks/ticket-430/experiment-note.md` — corrected "Four events" to "Two events"; replaced the baseline/observation framing (was: treated as a post-deployment window; now: historical pre-affiliate windows per the issue, quoted from an independent `gh issue view 430` retrieval).
- `docs/ai/tasks/ticket-430/local-review/metadata-correction-note.md` (new) — corrects `qwen-review.md`'s "12 of 15 files" to "14 of 15", and clarifies `run-meta.json`'s `stoppedOnBudget` field (chunk cap, not wall-clock budget). The original `qwen-review.md`, `run-meta.json`, `chunk-budget.json` and every `chunk-NN-{prompt,response}.txt` are untouched.
- `docs/ai/tasks/ticket-430/review-packet/implementation-summary.md` (v1, frozen) is **not** edited — it stays byte-identical to what Jonesy already hashed. This packet's own `summary-v2.md` (below) is the annotation.
