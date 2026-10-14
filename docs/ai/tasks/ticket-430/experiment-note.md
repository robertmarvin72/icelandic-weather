# #430 — Northern Lights affiliate CTA: revenue measurement runbook

**Status as of 2026-10-14: not deployed.** Implementation, tests, and the equivalent GA validation are complete (see `cc-report.md`). No GA data exists for this feature yet — nothing in this file is a claim that baseline or observation data has been collected or analyzed. The experiment starts only when the owner approves and deploys, and only from that actual timestamp, never retroactively.

## v2 correction (2026-10-14): baseline and observation are PRE-affiliate, not post-deployment

**The v1 text of this section was wrong and is replaced below.** v1 treated "baseline" as if it had to be a post-deployment window (reasoning that the CTA's own events can't exist before the CTA does) and effectively redefined the issue's baseline/observation windows as something to measure after deployment. That is not what the issue asks for, and this file never shifts those windows or invents a date.

**Baseline (1.–7. október 2026) and Observation (8.–12. október 2026) are both HISTORICAL, PRE-AFFILIATE Northern Lights engagement windows** — periods during which the Northern Lights forecast was already free and live, but the affiliate CTA did not exist yet. They measure existing, organic NL usage before the CTA, using **events and metrics that already existed in this codebase before this ticket**: unique users of `northern_lights_card_viewed` (homepage) and `aurora_landing_viewed` (landing), returning-user/session metrics already in GA4, and `northern_lights_night_selected` (forecast interactions). This ticket adds no new event for the baseline/observation windows themselves — it reuses what was already there.

I independently retrieved issue #430 via `gh issue view 430` (not just Ripley's quotation, though it matches) and confirmed section 7, "Experiment timeline," reads:

> **Baseline: 1.–7. október 2026** — Free Northern Lights án affiliate CTA. Mæla: Users, Engagement, Returning users, Forecast interactions.
>
> **Observation: 8.–12. október 2026** — Engar affiliate breytingar. Halda áfram að mæla organic traffic, engagement og returning users.
>
> **Affiliate MVP: frá samþykktri útgáfu, 14. október 2026 eða síðar** — Innleiða Viator CTA. Raunverulegur deployment-tími skal skráður og notaður sem upphaf affiliate-test tímabilsins. Ekki telja daga fyrir deployment sem affiliate-test daga.

**No baseline or observation data has been gathered or verified by CC.** Whether that historical data (Oct 1–12) was actually looked at, recorded, or still exists in GA4 is entirely unknown here — this file does not claim it was collected, and does not claim it wasn't. **GA4 Explorations have limited event-level data retention** (commonly far shorter than GA4's own aggregated-report retention) — if the owner wants to inspect the Oct 1–12 baseline/observation period from raw event-level data, **that should happen soon**, before an Exploration's retention window passes; if only standard aggregated reports remain available for that period, some breakdowns (e.g. by `placement`, which did not exist as a dimension before this ticket) will not be retroactively available regardless of when it is checked.

Only the **affiliate period** starts at actual deployment, never retroactively and never counting pre-deployment days as affiliate-test days.

## Deployment and evaluation timeline

| Step | When |
|---|---|
| Baseline (pre-affiliate, historical) | 1.–7. október 2026 — already past; data not gathered/verified here |
| Observation (pre-affiliate, historical) | 8.–12. október 2026 — already past; data not gathered/verified here |
| Affiliate MVP deployment (owner-approved, timestamp recorded by the owner) | **pending** — not yet set; "14. október 2026 eða síðar" per the issue |
| First evaluation | after 7 complete days of live affiliate data from the actual deployment timestamp |
| Follow-up evaluation | 14–30 days after the actual deployment timestamp |

Record the actual deployment timestamp here once it happens; the two evaluation rows are computed from that timestamp, never from this document's write date and never from the baseline/observation dates above.

## Events and GA4 metrics

Two events carry this feature's data, both already defined and tested (see `cc-report.md` §"Implementation"):

- `affiliate_offer_viewed` — one per placement per route visit (deduped by the impression holder), fires only when the card is ≥50% visible on a visible tab.
- `affiliate_clicked` — every real anchor activation (left click, keyboard Enter, modified click, and middle click), independent of whether an impression ever fired.
- Both carry `partner`, `campaign`, `placement`, `business_model_experiment`, and (when available) `forecast_verdict`/`selected_night`. `affiliate_clicked` additionally carries `destination`.

### Unique users, viewers, clickers

Pull from GA4 standard reporting (Explore / Events): unique users who triggered `affiliate_offer_viewed` ("viewers") and unique users who triggered `affiliate_clicked` ("clickers"), **segmented by `placement`** (`homepage_northern_lights` vs `northern_lights_forecast`) and compared only **within the same reporting period and timezone**. **Do not sum unique users across the two placements** — a user who saw both placements would be double-counted; GA4's own cross-event unique-user count (not a manual sum of two segment totals) is the correct way to get a combined figure if one is ever needed.

### Formulas

- **CTR** = unique clickers ÷ unique viewers × 100.
- **Clicks per 100 NL users** = unique clickers ÷ NL users × 100.
- **Revenue per 100 NL users** = affiliate revenue (from Viator reporting, see below) ÷ NL users × 100.

**NL-user denominator:** defined from the existing semantic events already on this surface — e.g. `northern_lights_card_viewed` (homepage) or `aurora_landing_viewed` (landing) — unique users of those events, segmented by the matching surface/placement, over the same period. This denominator is **not** identical in scope to "unique viewers of the CTA" above (a user can see the forecast without the CTA reaching 50% visibility, or vice versa on a very short visit) — document this scope difference whenever the two are compared, rather than treating them as interchangeable.

**Zero handling:** when either the numerator or the denominator is zero for a period (e.g. zero viewers in a very short test window), report the ratio as **"unavailable"** for that period, not as `0%` or a divide-by-zero error — a `0%` reading would misleadingly imply the opportunity existed and converted at zero, when it may simply never have been measured.

## Revenue (Viator reporting, never GA)

GA4 does not automatically know Viator's commission or booking outcome — nothing here claims it does. Revenue figures come **only** from Viator's own affiliate/partner reporting (booking confirmations and commission statements), matched to the campaign (`Northern-lights`) and the `pid`/`mcid` in the outbound URL. When recording a revenue figure, note alongside it:

- **Status**: confirmed booking vs. pending vs. cancelled.
- **Currency** of the figure.
- **Settlement**: whether the commission has actually settled/been paid, or is still provisional.
- **Cancellations**: bookings that were later cancelled or refunded, and whether the figure already nets them out.
- **Report lag**: Viator's own reporting can lag actual bookings by some days; a figure pulled too soon after a period ends is **provisional**, and should be labelled as such until a later pull confirms it is final.

## GA4 pre-deploy checklist (owner-only; F6)

Before relying on `placement`/`forecast_verdict` segmentation in standard GA4 reports, the owner registers these as **event-scoped custom dimensions** in the GA4 property:

- `placement` (required for the placement-split metrics above).
- `forecast_verdict` (optional, if the owner wants to segment by band).
- `business_model_experiment` (needed if the owner wants to segment this experiment's traffic from any other concurrent experiment; see below).
- `partner` / `campaign` / `destination` are optional — useful mainly if additional affiliate partners or campaigns are added later.

CC made no GA settings changes; this is the owner's own GA4 console action. **Allow 24–48 hours after both collection and registration** before expecting standard reports to show the custom-dimension breakdowns — and note that **historical events are not backfilled**: data collected before a custom dimension is registered will not retroactively gain that dimension's segmentation in reports, though the underlying event count and built-in dimensions remain usable. Without the custom definitions registered, `placement`/`forecast_verdict` segmentation is unavailable in standard reports (the existing BigQuery export, if the owner has one, is a possible alternative path to this data, but setting that up is not part of this ticket).

Primary guidance verified 2026-10-14:
- https://support.google.com/analytics/answer/14239696?hl=en
- https://developers.google.com/analytics/devguides/collection/ga4/event-parameters

No live GA4 property was inspected to perform this check — this section is a checklist for the owner to run, not a confirmation that it has been done.

## Concurrency and scope limits

- **`northern_lights_free_v1`** (the existing Free/Pro access experiment, unchanged by this ticket — see `src/config/features.js`) is concurrently active on this same surface. This runbook's `business_model_experiment` field on both affiliate events already tags that context so it can be segmented out if needed; **do not assert there are no other concurrent factors** affecting the numbers — this runbook records what is known, not an exhaustive list of everything that could move the metrics. The owner records at deployment time whether that Free/Pro experiment is still running, already ended, or its status is otherwise unknown at the point this feature deploys.
- **#431's live GA4 verification remains unverified** (per `docs/ai/tasks/ticket-431/`) — this is a pre-existing limitation of this codebase's analytics verification, not something #430 introduces or resolves.
- **No concurrent Aurora/Seasonal Pass experiment** is introduced by this ticket, and none should be run at the same time as this one without a deliberate decision to do so.
- **MVP scope**: neither `affiliate_offer_viewed` nor `affiliate_clicked` carries `user_tier` or a language parameter. This means Free/Pro and language cannot be segmented through these two new events' own parameters in this MVP — only through whatever the GA4 session-level data otherwise provides (if anything). This was an explicit, reviewed scope decision (the issue's requested parameters do not ask for a Free/Pro split), not an oversight.
- **Context-menu "open in new tab"** (right-click → "open link in new tab") is explicitly unmeasured — browsers do not fire a measurable `click`/`auxclick` event that distinguishes this path from ordinary navigation away from the page. This is a known undercount of real traffic to Viator, not a bug.
- **CTA visibility changes with night selection**: when the user selects a night whose own result is not usable (loading/expired/unavailable/no-darkness/contract-defect/error), the CTA disappears; selecting back to a usable night, it reappears. This changes the page's height around that point. Report this as an observed layout effect if it comes up after deployment — it is expected behavior (see `cc-report.md`'s eligibility section), not a regression.
- **No legal-page or provider-language expansion**: the IS-language CTA leads to the same Viator URL as the EN one, whose destination language Viator controls, not this app. A Privacy/Terms affiliate-disclosure mention, if the owner wants one, is a separate, owner-selected task — out of scope here.

## No automation

This runbook is read and executed by the owner manually. Nothing in this ticket writes to a dashboard, imports bookings automatically, mutates any live account, or sets a minimum conversion target. No monitoring automation was added.
