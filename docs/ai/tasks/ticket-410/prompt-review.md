# Ticket 410 — Share cards and Facebook pilot

## Ripley — Preparatory draft (2026-09-12)

NOT ACTIVE; NOT APPROVED; NOT AN EXECUTION PROMPT. CURRENT.md still references blocked ticket-409. This draft preserves useful preparation while the owner resolves sequencing under the single-active-task rule.

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/410 (OPEN, no comments when read).

### Objective

Add a secondary Weather Voice sharing action and a purpose-designed branded image, with native file sharing where supported and a download fallback. Support IS/EN, readable mobile/feed layout, context and Eltum Veðrið branding/domain. Prepare a manually operated Facebook pilot and measurement plan; no automatic posting or paid campaign. Full completion requires deployed analytics and actual pilot results, not just a working export.

### Current evidence and dependencies

- #409 instrumentation is implementation-PASS but production verification, seven-day data and safety validation remain pending. Its weather_voice_viewed event must retain its validated exposure semantics.
- #413 defines safety precedence but no runtime safety classification exists. Severity is expressive intensity, not danger; a severity cutoff or a mood whitelist cannot silently become a safety classifier.
- #412 supplies 27 bilingual IDs; the hook returns presentation/action/episodeKey/onVisible. Presentation does not contain the normalized daily forecast context needed for an export; context must be derived from the same provenance-checked episode, not independently fetched or reconstructed from unrelated current state.
- Card's existing optional action is a weather CTA seam; all authored CTA types are null. Sharing is a separate secondary action, not a new weather recommendation CTA type.
- Initial src search found no navigator.share/canShare/toBlob implementation to reuse. Existing UTM parsing lives in src/lib/attribution.js; inspect it before defining campaign links.

### Proposed implementation boundaries for the reviewable prompt

1. Read current App/hook/card, asset paths, forecast normalization, analytics and attribution before editing. Design a separate export canvas/image using existing assets and browser APIs, not a screenshot of UI and not a new image-generation dependency. Provide a reviewable card template, tentatively square 1080px, with readable wrapping and IS/EN examples. Preserve aspect ratio/transparency and wait for fonts/image decode. Handle render failures without exporting a blank image.
2. Freeze a coherent share snapshot of the actually displayed episode: comment ID/text/language/mood, site label if appropriate, forecast date and normalized daily context. Do not present daily tmax/windMax as current-hour measurements. Label daily context and date clearly; do not add precise user coordinates or imply safety guarantees. Changing locale/site while generation is pending must not mix old text with new context.
3. Native file sharing must check actual file support via navigator.canShare. Preserve user activation: prepare data before the explicit share invocation or use a clear second user gesture when async rendering would lose activation. Cancellation is not a failed post or successful share. Provide a working download fallback and explicit failure feedback, with localized strings and no UI redesign. Revoke object URLs and clean up pending work appropriately.
4. Use weather_voice_share_clicked with the displayed snapshot's voice_id/language/severity/weather_type/surface/share_method. Define method values and exact trigger semantics before implementation. A click is intent; navigator.share resolution, clipboard success or download initiation does not prove a Facebook post or audience delivery. Omit share_completed unless an honestly supported outcome can be defined without claiming destination publication. Preserve #409 impressions and do not send free text/site/coordinates in analytics.
5. Define Facebook pilot links with utm_source=facebook, utm_medium=social, a stable Weather Voice campaign name and nonpersonal per-post utm_content. Do not tag all native user shares as Facebook; the destination is unknown. Preserve established attribution behavior. Prepare draft posts and an evidence table, but publish nothing without an explicit owner posting handoff.
6. Test image wrapping/diacritics, same-episode snapshot coherence, native file support/unsupported/cancel/error branches, fallback downloads, double-click prevention, URL cleanup and exact event payloads. Browser-check real card/export on IS/EN mobile/desktop; inspect exported PNGs themselves. Test actual supported browser sharing where available and label simulated API tests accurately. No scoring, thresholds, new comment library, personalization, backend or dependencies.

### Decisions required before this becomes executable

- Workflow sequencing: owner exception to move CURRENT.md from blocked #409 to #410 while retaining #409's pending record, or another explicit disposition. Do not silently mark #409 CLOSED/CANCELLED or activate two tasks.
- Safety gate: how will the UI know a message is safety-critical and suppress social encouragement? There is no authorized signal today. Do not resolve this by equating severity with danger. A concrete separately reviewed safety contract or an explicitly restricted nonproduction share prototype is needed before authorizing production sharing.
- #409's observation-before-larger-UX-change rule: determine whether to prepare an isolated prototype while observation is pending or authorize a specific sequencing exception. Do not claim production evidence already supports a rollout.

Once these are resolved, Ripley will produce the complete Jonesy review prompt with explicit acceptance criteria and STOP conditions. Full ticket completion must separately track code readiness, deployment, manual Facebook publication and measured pilot results. No commit/push/deploy, Facebook publication, recurring automation or GitHub issue closure is authorized by this draft.

## Owner-directed activation

Owner instruction: "Virkjaðu miðann. Við þurfum ekki að bíða eftir niðurstöðum úr 409 fyrir þetta."

This explicitly resolves the sequencing and observation-window dependencies above: #410 is now active at PROMPT_DRAFT and may proceed without #409 results. The earlier NOT ACTIVE label describes the historical preparatory draft only. #409 remains unfinished in its own records; no closure or cancellation is implied. The production-sharing safety contract remains a design requirement, not an observation-window dependency. No approved execution prompt exists yet.

## Ripley — Initial prompt, Round 1 (supersedes preparatory draft)

Review material only. Jonesy: append APPROVED or REVISE, with explicit assessment of the conservative sharing policy below. Only an immutable approved prompt referenced by CURRENT.md at READY_FOR_CC may be executed by CC after the owner's handoff.

### Goal and owner authorization

Implement #410's bilingual Weather Voice share image and secondary sharing action, plus local analytics and a reviewable manual Facebook pilot plan. The owner explicitly authorized proceeding without #409 production results. Do not reintroduce that waiting dependency. #409's outstanding checks remain recorded separately; this task neither closes them nor claims they passed.

Read AGENTS.md, CLAUDE.md, docs/ai/README.md, CURRENT.md, #413's Bible, #408 exposure fixes and #412/#409 code before editing. Audit App -> useForecast -> useWeatherVoice -> WeatherVoiceCard, current assets, i18n, analytics and attribution. The entrypoint is the existing standalone homepage Weather Voice card. Keep its position, dominant comment, mascot size and existing exposure observer.

### 1. Conservative share promotion policy

This ticket must not invent a dangerous-weather classifier. Instead define a narrow editorial promotion policy: only current canonical `good` and `excellent` episodes are eligible for the new share action in this first release. All other conditions, invalid/missing data, unsupported language, stale provenance and unknown conditions suppress the action. This is a deliberately conservative growth-feature limit, NOT a declaration that good/excellent implies safe travel. Do not label any episode SAFE, derive safety from numeric severity/mood, or change the engine or its output.

Audit existing warning evidence associated with the same site/day. Any available active hazard/warning must veto promotion even for good/excellent. Reuse an existing result where available; do not copy thresholds, reinterpret raw data with a new classifier, or use another site's warning as if it belonged to this episode. Record the exact available warning signal and its coverage; unavailable optional signals must not be presented as an all-clear. If an authoritative safety-critical message signal is introduced later, its true/unknown state must veto promotion until explicitly cleared. No serious/safety-message share CTA should become enabled by default when new content types arrive.

The image renderer may handle synthetic long serious text for layout testing, but production sharing is restricted as above. Wind/rain/cold pilot posts remain editorially deferred, not automatically approved. This explicitly limits the initial pilot to good/unusually good weather pending a separately reviewed broader promotion policy. Jonesy must assess this narrowing against the issue; return REVISE if it needs a different concrete policy. Do not silently implement a broad severity whitelist or claim this resolves #413's safety gap.

### 2. Share snapshot and image

Add a narrow share-context adapter at the hook/integration boundary. Snapshot the actually displayed comment id/text, language, mood asset, site display name when it is a public campsite, forecast date and the same normalized daily context. Preserve original engine condition/severity and episode key internally. Never fetch independent weather for sharing, select a new joke, or combine old text with a newly selected site's forecast.

Use a standalone 1080x1080 PNG composition rendered with browser canvas and existing local PNG/logo assets. No screenshot-of-UI, new dependency, backend or AI runtime image generation. Warm light surface, restrained orange accent, prominent mascot and quoted comment, smaller context/date, modest Eltum Veðrið branding and visible eltumvedrid.is. Preserve mascot aspect ratio/transparency. Adapt text naturally to IS/EN with language-appropriate quotes. Use existing fonts or a reliable fallback; await font readiness/image decoding. Wrap text by measured width, reduce within a documented readable floor and fail clearly rather than crop/ellipsis the actual comment. Test the longest current IS/EN entries and a synthetic long message. Use full-image evidence, not just DOM screenshots.

Weather context is DAILY, not live: explicitly label date and daily forecast in the selected language. Do not render tmax/windMax as an unqualified 'now: 8°C, 12m/s' reading; normalized windMax may be time-weighted. Prefer existing accurate daily labels and units, or omit an ambiguous metric while retaining truthful daily context. No precise user coordinates, personal location labels, official-warning claims or inferred movement recommendation. An exported image is a dated static snapshot; it is not a live weather link preview.

### 3. Secondary share UX and lifecycle

Add a separate secondary action: IS 'Deila Tjaldi', EN 'Share Tjaldur'. Do not repurpose ctaType or change weather-CTA metadata. Clicking opens a compact accessible preview/dialog with localized controls, image preview, method actions and status/error messaging; retain keyboard focus, Escape/close and focus restoration using existing patterns. Sharing never becomes the primary card content.

Prepare the PNG while preview opens; after ready, an explicit user click invokes native sharing with a File only if navigator.share and navigator.canShare({files}) support it. This second gesture preserves transient user activation; do not await slow rendering before the navigator.share invocation in that final click. Offer 'Vista mynd' / 'Save image' as a working download fallback on every supported browser. Clipboard/link/text fallback is optional and should only be added if it reuses a simple existing pattern; do not broaden into a menu of unnecessary options.

A locale/site/day/outcome change invalidates an open or generating preview and cancels stale work; close it with appropriate accessible feedback or require reopening. Do not allow a late image promise to overwrite the next episode's preview. Disable double invocation while busy. Handle AbortError as user cancellation without a frightening error or completion claim; handle unsupported/rejected sharing with the still-available save action. Rendering/load/tainted-canvas failures must not download a blank file. Revoke blob URLs on replacement/close/unmount after download consumers have had time to use them. No persistent image store.

### 4. Event contract

Reuse trackEvent and preserve weather_voice_viewed exactly. Emit weather_voice_share_clicked only when the user explicitly invokes an available final method (native share or download), with exactly voice_id, language, severity, weather_type, surface='homepage_decision', share_method='native'|'download'. Opening the preview is not a method attempt and emits no share event. Capture payload from the approved snapshot, not live drifting refs. One event per accepted gesture, with in-flight double-click suppression; a later intentional retry is a new attempt. Failed/canceled attempts still count as clicks, never completed posts. Catch analytics errors without breaking sharing.

Do NOT emit weather_voice_share_completed: browser resolution/download initiation does not prove destination publication. Do not fabricate weather_voice_interacted, user identifiers, site ids/names, coordinates, full text or episode keys in analytics. Document that click-rate is attempts/views, not successful shares/users. No production fixture traffic; mock analytics transport for local browser verification.

### 5. Facebook pilot and links

Create docs/analytics/weather-voice-share-pilot.md covering the event dictionary, platform limitations, UTM convention, editorial safety restriction, deployment/publishing checklist and evidence table. Define manual Facebook links with utm_source=facebook, utm_medium=social, utm_campaign=weather_voice_pilot and nonpersonal per-post utm_content identifiers (e.g. post_01). Use URL/URLSearchParams and existing language routing; do not promise a permalink reproduces the same joke/weather without such a route. Show the canonical domain on the image; put clickable campaign URLs in post captions.

Native user shares must not falsely claim Facebook attribution; destination is unknown. If they include a URL, use a documented destination-neutral campaign/source convention or an untagged canonical language-appropriate URL. Preserve attribution.js behavior; no tracking cookies or attribution redesign.

Prepare a few DRAFT captions using existing eligible comments and clearly label mock weather examples as fixtures. Actual pilot posts require contemporaneous weather/context review and the owner's explicit publishing handoff. Do not publish, message others, create a paid campaign or schedule auto-posting. Full pilot measurements require actual Facebook reach/reactions/comments/shares/link clicks plus tagged sessions and onsite engagement; document unavailable access/data as pending and small samples as inconclusive. Code completion is not pilot completion.

### 6. Tests, visual verification and scope

Add meaningful tests for editorial eligibility (good/excellent allowed; others/unknown/silent/stale and available hazard veto rejected), same-episode context, async invalidation, decode/render failure, native canShare support, second-gesture invocation, cancellation/errors, download fallback, duplicate-action guard, URL cleanup and exact event payload/throw isolation. Rendering tests should cover wrapping/diacritics and sizes without relying solely on snapshots or mirroring implementation constants. Preserve #408/#409 impression and history regression tests, including locale changes and StrictMode.

Run affected unit/integration suites, Weather Voice hook/card/App/engine/content/selector/history regressions, lint/build and whitespace checks. Browser-check IS/EN at 320/390/1280px, light/dark, preview keyboard flow, native API mocked branches, real download file and actual exported PNGs. Inspect PNGs for readable text, visible branding/date, correct asset and no clipping. Real native OS share-sheet behavior must be verified where available or explicitly left unverified; Playwright API stubs are not OS proof. Retain scripts/results/screenshots/exported PNGs under outputs/ticket-410-weather-voice-share-evidence/.

Expected code surfaces: narrow share helper/hook/dialog, WeatherVoiceCard/App integration as required, i18n and tests. No new dependencies, backend, scoring, thresholds, weather classification, forecast normalization, entitlement, checkout, Northern Lights or existing content-library changes. No new joke IDs. No commit/push/deploy or Facebook publication. STOP for work beyond scope, a safety policy conflict, context requiring unsupported live-weather claims, or a need to change shared scoring/provenance. Document concrete evidence rather than asking for permission for routine reversible choices.

### Handoff and completion

CC follows READY_FOR_CC -> CC_IN_PROGRESS -> CC_COMPLETE only after approval and owner handoff. Report exact audit findings (including warning-signal coverage), changed files, policy, commands/results, inspected exports, browser support limits, and pending deployment/pilot steps in docs/ai/tasks/ticket-410/cc-report.md. Preserve earlier history. Jonesy reviews both code and exported design; Ripley performs final assessment. A code-level PASS can coexist with unfinished production analytics/native-device validation/Facebook pilot; do not mark the full issue CLOSED without its actual acceptance evidence. #409 results are explicitly not a prerequisite for this work.

## Jonesy — Initial prompt, Round 1

**Verdict: APPROVED**, with two concrete implementation notes below that CC's report must address explicitly (not blocking — the prompt's own hedged wording already permits the honest outcome I expect, but CC should not have to guess at it).

### Sequencing

`CURRENT.md` records the owner's explicit Icelandic-language authorization to activate #410 without waiting for #409, and preserves #409's unfinished/BLOCKED status in its own record rather than closing or cancelling it. That's the correct handling of the single-active-task rule's owner-override path — no objection.

### Verified against live source, not just the prompt's narrative

- `src/lib/weatherVoicePresentation.js` and `src/components/WeatherVoiceCard.jsx` (both read in full, current versions): confirm the CTA seam (`resolveWeatherVoiceCta`/`action` prop) is exactly as the prompt describes — a single optional `{label, onClick}` rendered as one text button. The prompt correctly requires a *separate* action rather than repurposing this seam.
- `src/lib/attribution.js` (read in full): a minimal, first-touch-only inbound UTM capture (`if (localStorage.getItem(STORAGE_KEY)) return;` before ever overwriting), driven by `URLSearchParams` on page load, no cookies. This is orthogonal to outbound campaign-link construction for Facebook posts — building `utm_source=facebook&utm_medium=social&utm_campaign=weather_voice_pilot&utm_content=post_XX` links doesn't touch this file at all; it only matters later if someone clicks through, where the existing unmodified capture logic already applies. "Preserve attribution.js behavior; no tracking cookies or attribution redesign" is accurate and low-risk as scoped.
- `src/hooks/useForecast.js` (read in full): confirms `rows` are daily aggregates from `normalizeDailyToScoreInput`, each carrying `date`/`tmax`/`windMax`/`rain`/`code` — consistent with "daily, not live" framing and with what `useWeatherVoice.js` already reads.

### Two things CC's audit should land on explicitly, not guess at

**1. There is no already-computed per-site/day hazard signal in the Weather Voice data path today.** I read `src/lib/hazardWindow.js` (the only hazard-window detector in the codebase) and `src/config/hazards.js` (`HAZARDS_V1`, already known from #409 to be thresholds only, not a safety classification). `detectHazardWindow` operates on **hourly** data (`hourly.time`/`windspeed_10m`/`windgusts_10m`/`precipitation`) over a multi-day window — it is not something already run per single day anywhere in the `useForecast` → `useWeatherVoice` path, which only ever sees the normalized **daily** `rows`; `useForecast`'s `data.hourly` is fetched but never threaded through to Weather Voice at all. So "reuse an existing result where available" almost certainly resolves to "no existing per-day result is available" on honest audit — the prompt's own hedged wording ("where available," "record the exact available warning signal and its coverage," "unavailable optional signals must not be presented as an all-clear") already accommodates this, so I'm not requesting a different policy. But CC should state this conclusion plainly rather than silently treating "found nothing to reuse" as unremarkable, and must NOT thread `data.hourly` into the Weather Voice hook to manufacture a new per-day hazard check to satisfy the veto — that would be exactly the kind of forecast-normalization/scope expansion the prompt's own boundaries forbid ("No... forecast normalization... changes"). The correct, scope-respecting outcome is: hazard veto documented as "not evaluated — no existing per-day signal available," good/excellent promotion proceeds ungated by it, and this limitation is recorded in `docs/analytics/weather-voice-share-pilot.md`, not silently absorbed.

**2. The one existing dialog pattern in this codebase does not do focus restoration — CC should build it, not assume it's already "the existing pattern."** I read `src/components/HourlyForecastModal.jsx` in full: it does implement `role="dialog"`/`aria-modal="true"`, Escape-to-close, and body-scroll-lock, but there is no focus trap and no restore-of-focus to the triggering element on close anywhere in it. The approved prompt's §3 says to retain "keyboard focus, Escape/close and focus restoration using existing patterns" — the existing pattern only covers two of those three. CC's report should say plainly that focus restoration is new work for this ticket (genuinely implemented, not copied), not imply the codebase already had it.

One minor, non-blocking note: I found no "private"/custom-location concept anywhere in the site model (`CampsitePicker.jsx`, `useMyLocationNearestSite.js`) — every selectable site comes from the fixed `campsites.full.json`/`campsites.limited.json` lists; "tier" (as seen in #409's own evidence fixtures) gates which list is available, not whether an individual site's name is public. So "site display name when it is a public campsite" will in practice always be true today; that's fine as forward-compatible wording, but CC shouldn't invent a "some sites are private" branch that has no corresponding real data field.

### Safety framing (§1) — assessed as requested

The conservative good/excellent-only promotion gate is a legitimate, clearly-labeled narrowing (explicitly not a safety classifier, explicitly not a SAFE label, explicitly deferring wind/rain/cold pilot posts) and is consistent with #413's precedence and #409's established distinction between expressive severity and hazard evidence. Combined with the hazard-veto handling above, this is an appropriately narrow first release rather than a silent broadening of what severity/mood are allowed to mean. No REVISE needed on this point.

### Everything else

Event contract (§4) correctly extends #409's pattern (`weather_voice_share_clicked` with the same five approved-episode fields plus `share_method`), correctly refuses to claim `share_completed`/destination delivery, and correctly isolates analytics failures. The Facebook-pilot section (§5) correctly separates code-readiness from actual pilot execution and requires the owner's explicit publishing handoff. The completion contract (§ Handoff) correctly states a code-level PASS can coexist with unfinished production/pilot validation. No contradictions found with #408/#409/#412/#413.

## Ripley — Correction prompt, Round 2 (2026-09-13)

Review material only. Jonesy: review and append APPROVED or REVISE. Inherit approved-prompt-v1.md and its clarifications; preserve accepted design/promotion scope and owner authorization to proceed without #409 results. Fix only the four implementation findings in Ripley's Round 1 result review.

1. Export truthful localized daily context: clearly label daily forecast and daily maximum temperature using i18n. Fix the evidenced English date inside the IS export, including a robust locale fallback and a persistent unambiguous date/year. No current-hour claims or changed weather inputs.
2. Enforce full renderer geometry: every comment line must fit measured width; comment + wrapped context must fit above reserved branding/domain. Handle long real campsite names and unbroken tokens; never crop actual comment text or overlap branding. Reduce within readable limits or reject clearly. Reproduce the retained failing test before editing. Add meaningful width/height/context tests, plus real canvas exports covering long names, 4–5 comment lines and an unfit token/message. Do not solve this by merely raising allowed line counts or hiding overflow.
3. Capture a stable opening snapshot in the card/share flow, rather than storing only its episode key and feeding live snapshots to the dialog. Keep preview, downloaded/native file and analytics tied to that frozen object during same-episode refetch/object rebuilds. Genuine locale/site/date/outcome/ineligibility changes must invalidate the preview without a stale share action or late generation result. Add integrated tests for same-key changed row/object while open and true episode/policy invalidation; preserve existing exposure and analytics behavior.
4. Require both native share function and file-capability support. Make download rapid-repeat suppression real despite React batching (synchronous ref/attempt guard, bounded release, later deliberate retry allowed); handle download exceptions without escaping to the user or counting success. Test rapid download clicks, retry, canShare-without-share, cancellation and errors. Keep URL lifetime safe for an immediately initiated download and cleanup after close/replacement. Bound the dialog to available viewport height with reachable scrolling content/actions; verify short mobile landscape and keyboard access. Preserve focus restoration and inspect focus behavior during unrelated parent rerenders as well.

Append an honest correction report; retain earlier history and evidence. Run share/hook/card/App/exposure/analytics regressions, lint/build and whitespace checks. Retain new exported PNGs and browser evidence under the existing ticket-410 evidence directory; inspect the actual images, not just return values or file size. Distinguish native API mocks from real OS verification and code readiness from pilot completion. No scoring, classifier, assets, joke library, dependency, entitlement or unrelated module changes. No commit/push/deploy/posting. Follow CC lifecycle only after Jonesy approval, immutable v2 creation and owner execution handoff.

## Ripley — Owner-reported missing share entrypoint, addendum to Round 2

The owner supplied a screenshot showing the visible rain_02 comment ('Regnjakki með aðalhlutverk.') with no share button and challenged how the user can share it. The root cause is the overly narrow good/excellent-only editorial allowlist in Ripley's original prompt, not a missing render implementation by CC. This product restriction needs correction; the owner feedback supersedes Round 2's earlier instruction to preserve that allowlist unchanged.

Add this requirement to the pending correction review:

- Make the existing ordinary `rain` condition eligible for sharing alongside good/excellent, so rain_01 and rain_02 have the secondary 'Deila Tjaldi' / 'Share Tjaldur' entrypoint when the normal snapshot/provenance requirements hold. Do not conflate rain with heavy_rain or change engine thresholds. Keep all other excluded conditions excluded in this narrow correction; broader condition policy can be reviewed separately.
- Preserve available-warning veto, unknown/invalid/silent suppression and the documented absence of a computed per-day hazard signal. This editorial expansion is not a safe-travel classification or a resolution of #413.
- Prove the actual owner scenario end-to-end using the real hook/card with ordinary rain, in IS and EN at mobile and desktop: visible rain_02 -> visible share button -> preview -> downloadable image with the same comment, rain mood asset and correctly labeled daily context. Assert heavy_rain remains excluded. Do not merely inject a fabricated shareSnapshot into a card test.
- Update the share-policy tests and pilot documentation from good/excellent-only to good/excellent/rain, distinguishing ordinary rain from heavy rain. Review the exported rain card visually and ensure nothing suggests the depicted weather is an official warning or safe-travel guarantee.

Jonesy should review this addendum together with the four Round 2 corrections before any v2 approved prompt is created. No existing approved prompt is edited and no implementation is performed by this addendum.

## Ripley — Owner override: every displayed Tjaldur is shareable

Owner instruction: "Ég vill að notandi geti alltaf deilt Tjaldi."

This supersedes ALL condition allowlists and warning-based sharing vetoes proposed in v1, Round 2 and the rain addendum. The earlier restricted promotion policy is no longer the requested product behavior. Apply this requirement together with the four pending implementation corrections:

- Whenever the Weather Voice card displays a valid comment and mascot, provide the secondary 'Deila Tjaldi' / 'Share Tjaldur' action, regardless of condition, mood or severity. Cover all nine current conditions, not only good/excellent/rain. Do not hide sharing because of a warning or an unavailable hazard signal.
- Keep legitimate absence of Weather Voice itself unchanged: no card means no share entrypoint. Invalid/stale snapshot data must never produce fabricated weather context or a mixed-episode image. If generation fails, retain the share entrypoint and provide clear error/retry handling; do not confuse temporary technical failure with editorial ineligibility.
- Remove the good/excellent-only share-policy gate and the later rain-only extension. Remove sharing-only hazard veto behavior rather than leaving dead policy that can accidentally suppress the action. Do not change weather rules, warning display, content selection, safety classification or existing provenance safeguards.
- Serious messages remain shareable through the same neutral secondary action. No celebratory prompt, engagement incentive or wording that minimizes warnings. Export the actual displayed text/context faithfully; do not transform safety wording into a joke. This owner instruction permits user-initiated sharing in all displayed states; it does not authorize automatic posting or editorial approval of a Facebook campaign in hazardous conditions.
- Test the real hook/card/snapshot flow across all nine current conditions in IS and EN, including extreme_wind, heavy_rain and cold_wet. Assert that visible Tjaldur always has the sharing entrypoint and that severity/mood/warning signals cannot suppress it. Preserve silent/invalid/provenance tests and the frozen-snapshot/invalidation corrections.
- Export and inspect representative rain, wind and cold cards as well as good/excellent; ensure the renderer's width/height/context fixes handle the full currently displayed library. Update pilot documentation to distinguish universally available user sharing from separately reviewed, owner-published Facebook examples. No automatic publication or changed analytics completion claims.

Jonesy must review the complete Round 2 correction WITH this latest owner override. Do not request renewed permission for universal user-initiated sharing; the owner has explicitly authorized it. No immutable approved prompt has been changed and no implementation is performed by this update.

## Jonesy — Prompt review, Round 2 (correction prompt + universal-sharing override)

**Verdict: APPROVED**, with three concrete notes below for CC's report to address explicitly.

### Ripley's four Round 1 findings — independently re-derived as genuine, not just trusted

Before reviewing the correction text itself, I re-checked Ripley's four findings against the exact code I already read in full during my own (now superseded) Round 1 PASS. All four hold up, and I owe an honest correction of my own: I should have caught findings 1 and 2 myself.

1. **IS date localization** — confirmed. I personally inspected the retained IS export in my Round 1 review and quoted its context line verbatim as "Thingvellir Test Site · Saturday, Sep 12 · Heiðskírt, 16°C" — and did not notice that "Saturday, Sep 12" is English text inside an Icelandic-language export. `buildDailyContextLabel` does pass `locale: "is-IS"` to `Intl.DateTimeFormat`, but the environment that rendered this evidence silently fell back to English weekday/month names rather than throwing — a real, user-visible defect I looked straight at and missed. Ripley's fix instruction (robust locale fallback, persistent unambiguous date, explicit daily/max-temperature labeling) correctly targets the actual cause, not just the symptom.
2. **Renderer geometry** — confirmed by re-deriving the math myself: `fitCommentText` only checks `lines.length <= maxLines`; `wrapTextToLines` always places a word on its own line even if that word alone exceeds `maxWidth` (there is nothing else it can do with a single unbreakable token), so a single very long token trivially satisfies `1 <= 5` at every size including the 64px start size. I read Ripley's retained repro (`weatherVoiceShare.review-repro.test.js`) directly — a 100-character unbroken token against `maxWidth: 885.6` (the real `size*0.82`) with a deterministic `length*size` measurer — and confirmed by hand that this returns a non-null `{size:64,...}` under the current code, exactly the failure Ripley describes. The context-line overlap math also checks out: `textBlockTop(540) + 5*64*1.25 + 36 = 976`, which sits inside the branding box's own `y: 950–1010` span — a real, arithmetically-confirmed overlap risk, and the context line itself (`ctx.fillText` of `siteName + contextLabel`) has no width measurement at all.
3. **Frozen snapshot** — confirmed: `useWeatherVoice.js`'s `shareSnapshot` memo depends on `site` and `todayRow` by object reference (not decomposed fields), and `WeatherVoiceShareDialog.jsx`'s image-generation effect depends on `[snapshot]` by reference. Any benign parent re-render that produces new (even value-identical) `site`/`todayRow` objects for the SAME episode would hand the open dialog a new snapshot reference, restarting image generation mid-preview — a real gap between the "frozen snapshot" the approved prompt required and what the code actually does.
4. **Dialog guards/viewport** — confirmed: `canShareFile` checks only `navigator.canShare`, never `typeof navigator.share === "function"`, which is a genuine deviation from approved-prompt-v1's explicit "only if navigator.share and navigator.canShare({files}) support it." The download handler's `busyMethod` is set and reset within the same synchronous call with no `await` in between, so it can never actually block a second physical click (the state is already back to `null` before any subsequent click event could fire) — a real, not merely theoretical, gap in the "duplicate-action guard" requirement. The dialog's fixed-center container has no `max-h`/`overflow-y-auto`, confirmed from the JSX I read.

### The correction instructions (Round 2, items 1–4) — sound and correctly scoped

Each of the four fix instructions targets the actual verified root cause rather than a workaround (e.g., §2 explicitly forbids "merely raising allowed line counts or hiding overflow," §4 explicitly requires a synchronous ref-based guard rather than relying on React state timing). Testing/evidence requirements are concrete and require real canvas exports, not just unit assertions. No contradiction with #408/#409/#412/#413 or with the still-accepted architecture (episode-key gating, exposure lifecycle, `weather_voice_viewed` semantics) — none of that is touched by these four fixes.

### The universal-sharing override — a legitimate product decision, correctly guarded

The owner's instruction ("every displayed Tjaldur is shareable") is a real product-policy change, not an implementation detail, and Ripley's synthesis draws the safety-relevant line correctly: user-initiated sharing of whatever is already on the user's own screen becomes universally available (arguably more transparent than gating it), while the separately-reviewed Facebook/editorial pilot promotion remains a distinct, still-conservative decision the owner controls. The override explicitly forbids exactly the things that would turn this into a #413 problem — no celebratory framing for serious messages, no minimizing of warnings, no claim that this resolves #413's safety gap, no automatic posting authorization — so I don't read this as reopening the safety-classification question, just as removing a growth-feature gate that was never itself a safety mechanism. Cross-checked against `weatherVoiceEngine.js`: there are exactly nine named conditions (`extreme_wind`, `heavy_rain`, `strong_wind`, `cold_wet`, `cold`, `rain`, `sun_wind`, `excellent`, `good`), matching "cover all nine current conditions" precisely, and #412 already established full 27-ID IS/EN parity across all of them, so there's no hidden per-condition content gap this change would newly expose.

### Three notes for CC's report to address explicitly (not blocking approval)

1. **State the disposition of `weatherVoiceSharePolicy.js` plainly.** The override says to remove the condition-gate and hazard-veto "rather than leaving dead policy that can accidentally suppress the action" — CC should say in the report whether the module is deleted outright or reduced to just structural validity, and confirm `weatherVoiceSharePolicy.test.js` was updated/removed to match rather than left asserting behavior that no longer exists.
2. **Preserve the unsupported-language guard.** Neither the correction items nor the override mention it, but `buildWeatherVoiceShareSnapshot`'s `lang !== "is" && lang !== "en"` rejection is a structural validity check, not part of the condition-eligibility policy being removed — CC should keep it and say so, rather than let it fall out incidentally while ripping out the policy module.
3. **Keep the frozen-snapshot fix (Round 2 §3) and the universal-sharing change mutually consistent in tests** — since both land in the same correction round, the "test across all nine conditions" requirement should specifically include a same-episode object-identity-churn case (the exact scenario finding #3 identified) for at least one non-good/excellent condition, not only for the conditions exercised in the original Round 1 evidence.

No further scope, safety, or sequencing concerns. Approved for CC to implement as an immutable v2 correction to approved-prompt-v1.md, per Ripley's own stated handoff conditions.
