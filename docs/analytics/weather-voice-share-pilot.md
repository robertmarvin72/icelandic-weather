# Weather Voice Share — Manual Facebook Pilot Plan (#410)

**Scope:** Prepares a manually-operated Facebook pilot for the new Weather Voice share image/action. **No post has been published, no message has been sent to anyone, no paid campaign exists, and no auto-posting is scheduled or implemented.** Actual pilot posts require the owner's explicit publishing handoff and contemporaneous weather/context review at posting time — this document prepares the mechanism and drafts only.

**Code provenance:** Written alongside the Ticket 410 implementation, uncommitted/undeployed at the time of writing (see `docs/ai/tasks/ticket-410/cc-report.md` for the exact commit this sits on top of). Code completion is explicitly **not** pilot completion.

**Revision 2 update (owner-authorized universal sharing, approved-prompt-v2.md §1):** the in-app "Deila Tjaldi"/"Share Tjaldur" entrypoint is now available for **every** displayed Tjaldur comment, regardless of condition, mood, severity, or warning signal — not only `good`/`excellent`. This document distinguishes that universal, always-available **user-facing entrypoint** from the still-deliberately-conservative **manually-published Facebook pilot examples** below: universal in-app sharing is a product decision about what users are FREE to share themselves; it is not an editorial decision about what CC or the owner PROMOTES via a curated Facebook post. See §4 for the exact line between the two.

**Ticket 417 update (#417) — direct Facebook sharing + immutable comment permalinks:** the share entrypoint now offers a compact choice — "Deila mynd"/"Share image" (the existing PNG dialog above, unchanged) or "Deila á Facebook"/"Share on Facebook" (new: a real `https://www.facebook.com/sharer/sharer.php?u=...` link pointing at a finite, pre-generated, immutable static page for that EXACT comment/language pair — see §1b and §9). This is still governed by the SAME universal-sharing policy Revision 2 established: every currently valid mood/condition is shareable, both by image and by Facebook, and neither path is a safety determination. §9 documents the new permalink and its `tjaldur_facebook_share_clicked` event; it does not change or supersede §1's `weather_voice_share_clicked` (native/download) semantics.

---

## 1. Event dictionary (shared with the code implementation)

### `weather_voice_share_clicked`

Fires only when the user explicitly invokes an available final sharing method (native OS share or download) from the share preview dialog — **never** when the preview merely opens.

| Field | Type | Meaning |
|---|---|---|
| `voice_id` | string | The displayed comment's stable ID (same as `weather_voice_viewed`) |
| `language` | string | `is` \| `en` |
| `severity` | number (0–3) | Expressive intensity only — **not a safety/danger signal** |
| `weather_type` | string | Canonical condition — as of Revision 2, any of the nine real conditions (`extreme_wind`, `heavy_rain`, `strong_wind`, `cold_wet`, `cold`, `rain`, `sun_wind`, `excellent`, `good`); see §4 for the distinction between universal in-app sharing and the still-conservative manual Facebook pilot |
| `surface` | string | Always `"homepage_decision"` |
| `share_method` | string | `"native"` (the OS share sheet was invoked) or `"download"` (the "Save image" fallback was used) |

**A click is intent, not a completed post.** `navigator.share()` resolving, a clipboard write succeeding, or a download starting does **not** prove a Facebook post, an audience impression, or a "successful share" — the browser has no way to know what the user does after the OS share sheet or a saved file leaves this app's control. Click-rate from this event must always be reported as **attempts/views**, never as "successful shares" or "users who shared."

**No `weather_voice_share_completed` event exists, and none should be added** without an honestly-supportable definition that does not claim destination publication — none currently exists.

### Reused, unchanged: `weather_voice_viewed`

This ticket does not modify `weather_voice_viewed`'s trigger, payload, or dedup semantics (see `docs/analytics/weather-voice-production-validation.md`, #409). The share event is additive.

### What is never sent

Free text (the comment itself), user identifiers, site name, coordinates, the full episode key, or timestamps — in either event.

---

## 2. Platform limitations (honest, not worked around)

- **Facebook attribution for native/OS shares is unknown.** When a user taps the in-app "Share Tjaldur" → native share sheet, the destination app (Facebook, Messenger, iMessage, email, "copy to clipboard," etc.) is chosen by the OS/user, not by this app. `share_method: "native"` records that the OS share sheet was invoked — it is **not** evidence the destination was Facebook. This document, and any dashboard built on this data, must never present native-share counts as "Facebook shares."
- **No permalink reproduces the same joke/weather — for the homepage itself.** The homepage (`/`) has no per-language route (confirmed: `AppRoutes.jsx` has no `/en` homepage variant — language is a `localStorage` toggle, not a URL parameter, for the main page) and Weather Voice's content on the homepage depends on the viewer's own selected/geolocated site and the CURRENT day's weather. **A homepage link included in a shared image or post will never show the same comment, mascot mood, or weather the poster saw** — it shows whatever is true for that visitor, on that day, at their own site. No caption or UI copy may imply otherwise.
  **Ticket 417 (#417) narrows this, deliberately, for the new Facebook path only:** the `/share/tjaldur/v1/<language>/<voiceId>.html` pages ARE genuine, immutable permalinks that reproduce the exact comment text and mascot mood every time, for anyone, forever (or until a version bump) — see §9. This is explicitly NOT a live forecast reproduction: the page itself says so in its own body copy, links to the homepage (which behaves as described above, unchanged), and carries no site/date/weather context at all. The two are different artifacts with different guarantees; do not conflate them.
- **GA4 has no visibility into what happens after `navigator.share()` returns.** Full pilot measurement of actual Facebook reach/reactions/comments/shares/link clicks requires Facebook's own native tools (Page Insights, or manually recorded reaction/comment/share counts read directly off the published post) — none of which this codebase or CC has access to. These are documented as pending, external, manual data collection — not something `trackEvent` can capture.

---

## 3. UTM convention for MANUAL Facebook post links

For deliberately-posted Facebook pilot posts (not native user shares — see §2), any link included in the **post caption** (not the image itself) should use:

```
utm_source=facebook
utm_medium=social
utm_campaign=weather_voice_pilot
utm_content=post_01   (post_02, post_03, ... — one nonpersonal, sequential identifier per post)
```

Example, built the same way `src/lib/attribution.js` already parses inbound UTM params (via `URLSearchParams`, read-only — this convention does not add or change any code, it only defines the query string a human pastes into a Facebook post caption):

```
https://eltumvedrid.is/?utm_source=facebook&utm_medium=social&utm_campaign=weather_voice_pilot&utm_content=post_01
```

This is an **untagged campaign link for the caption**, not a tag embedded in the shared image — the canonical domain (`eltumvedrid.is`) is what appears ON the image itself (see the approved prompt's image design requirements), and the clickable, UTM-tagged version belongs in the post's own text, where the poster controls it directly. `attribution.js`'s existing first-touch-only capture behavior is unchanged and unaffected by this convention — inbound clicks are handled exactly as they are today for every other campaign link in this codebase.

**Native user shares must never be tagged with `utm_source=facebook`** — per §2, the destination is genuinely unknown for those; only links the owner manually places in an actual Facebook post caption use this convention.

---

## 4. Universal in-app sharing vs. the still-conservative manual Facebook pilot

**These are two different decisions, made at two different layers, and this section keeps them explicitly separate.**

### 4a. In-app entrypoint — universal (owner-authorized, Revision 2)

The "Deila Tjaldi"/"Share Tjaldur" button appears for **every** genuinely displayed Tjaldur — `extreme_wind`/`heavy_rain`/`strong_wind`/`cold_wet`/`cold`/`rain`/`sun_wind` included, not only `good`/`excellent`. `src/lib/weatherVoiceSharePolicy.js` was reduced to structural validity only (a real, active, supported-language episode) — the condition allowlist and the (always-inactive) hazard-veto seam were both **removed**, not merely disabled, per the owner's explicit override. This is a genuine product decision: it means Tjaldur's own dry commentary on bad weather is now something any user can share themselves, same as good weather. **It is not a safety determination** — the export renders serious/severe messages faithfully, without added celebratory encouragement or minimization, and does not resolve #413's safety gap (no classifier or `voice_level` field exists; severity remains expressive intensity only).

**Universal user sharing does not authorize automated posting or editorial Facebook promotion during hazardous conditions.** That distinction is exactly what §4b keeps in place.

### 4b. Manually-published Facebook pilot examples — still conservative, separately reviewed

The draft captions in §5, and any actual pilot post the owner chooses to publish, remain restricted to genuinely good/pleasant weather content by **editorial choice**, independent of what the in-app button now allows. Nothing in Revision 2 pre-authorizes posting a wind/rain/cold/hazardous-condition share image to Facebook as a curated pilot example — that would be a distinct, separately-reviewed editorial decision this document does not make. The owner remains free to manually save and post any image a real user could also generate themselves (that's the nature of universal in-app sharing being genuinely universal), but doing so **as an official Eltum Veðrið Facebook post** is an editorial/publishing act requiring its own contemporaneous review, not something this ticket's code change decides on its own.

- **Hazard-signal audit (recorded honestly, not glossed over):** there is no already-computed per-site/day hazard/warning result anywhere in the Weather Voice data path today (confirmed in the pre-implementation audit — see `cc-report.md`, both Revision 1 and Revision 2). The removed hazard-veto seam never had a real signal to check — this is explicitly **not** evidence that dangerous weather is "checked" or "safe" in any sense, and must never be described that way in any pilot messaging.
- **A future authoritative safety-classification signal**, if one is ever authorized and built, would need its own separate review of how it interacts with BOTH the universal in-app entrypoint and the manual pilot process — this document does not pre-decide that either.

---

## 5. Draft captions (good/excellent comments only, by editorial choice — see §4b)

**These are drafts for the owner's review before any posting decision — none have been posted.** Each draft must be paired with a real, contemporaneous weather check at actual posting time (the weather described must genuinely be happening or forecast, not assumed from this document's writing date). Deliberately limited to good/excellent examples per §4b's editorial (not technical) restriction — the in-app button itself would also let a real user generate and share e.g. a `rain`/`cold` image (see the real `rain_02` example proven end-to-end in `cc-report.md`'s browser evidence), but no such example is drafted here for MANUAL Facebook posting without its own separate editorial review.

| Draft # | `utm_content` | Comment ID | IS text | EN text | Caption sketch (IS) |
|---|---|---|---|---|---|
| post_01 | `post_01` | `excellent_02` | „Ekki segja neinum." | "Don't tell anyone." | Tjaldur segir það sem er. 🏕️ [MOCK — fixture, not a live forecast] |
| post_02 | `post_02` | `good_01` | „Þetta má alveg." | "This'll do." | Ekkert drama, bara ágætis veður. [MOCK — fixture, not a live forecast] |

**Every weather example above is a mock/fixture** used only to illustrate the caption format — neither corresponds to a real, verified, contemporaneous forecast. Actual pilot posts require re-checking real weather at posting time and must not reuse these mock examples as if they were live.

---

## 6. Deployment/publishing checklist (for the owner, before any real post)

1. Confirm the code is deployed to production (this ticket does not deploy anything).
2. Confirm `weather_voice_viewed`/`weather_voice_share_clicked` are verified live in GA4 DebugView (see #409's own post-deployment checklist — the share event should be checked the same way).
3. Pick a genuinely good/excellent day for the intended site; verify the actual live comment/mascot/date shown in the app matches what will appear in the exported image before using it in a post.
4. Build the caption's campaign link per §3, with the next sequential `utm_content`.
5. Manually export the image via the app's own "Share Tjaldur" → "Save image" flow (or native share → save) — never fabricate or hand-edit the image outside the app.
6. Post manually to Facebook. **This step requires the owner's explicit action — CC does not and will not perform it.**
7. Record the post's URL, `utm_content` value, posting timestamp, and the real weather/comment shown at posting time in the evidence table below.

---

## 7. Evidence table (pilot results — currently empty, PENDING)

| Post # | Date posted | `utm_content` | Comment ID | Reach | Reactions | Comments | Shares | Link clicks (via UTM) | Tagged-session engagement | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | Pending | Pending | Pending | Pending | Pending | Pending | No post has been published yet. |

**Full pilot measurement requires:** actual Facebook Page Insights data (reach/reactions/comments/shares — read manually from Facebook, not obtainable via this codebase), GA4 sessions carrying the post's `utm_content` (to measure link-click-through and on-site engagement), and enough posts/time for a non-trivial sample. **A small sample size must be recorded as inconclusive, never as a negative or positive product conclusion.** Code completion (this ticket) is not pilot completion — this table stays empty until real posts exist and their real results are manually recorded here.

---

## 9. Ticket 417 (#417) — direct Facebook sharing and the static comment-permalink catalogue

### 9a. `tjaldur_facebook_share_clicked` — event dictionary

Fires once per genuine activation of the "Deila á Facebook"/"Share on Facebook" link, via `trackEvent`, synchronously before the browser follows the anchor's own `href` (no `preventDefault`, no await beforehand) — an analytics exception can never block that native navigation.

| Field | Type | Meaning |
|---|---|---|
| `mood` | string | The frozen snapshot's mood (e.g. `unimpressed`, `happy`) — never inferred from severity |
| `language` | string | `is` \| `en` |
| `source` | string | Always `"homepage_decision"` |

This is the exact payload the issue specified — deliberately no `voice_id` (unlike `weather_voice_share_clicked`); exact-quote fidelity is enforced structurally by the manifest match (§9c), not by adding it to this event. No location, quote text, `episodeKey`, tokens, or user identifiers appear in the URL or the event.

**This is an attempt event, not confirmation of a post.** Exactly like `weather_voice_share_clicked` (§1), a click only proves the user activated the Facebook sharer link — Facebook's own sharer dialog is what the user actually interacts with next, entirely outside this app's visibility. Never report this as "Facebook shares" or "posts created."

**Distinct from, and never a substitute for, `weather_voice_share_clicked`:** choosing "Share image" still fires the existing native/download event exactly as before (§1, unchanged); choosing "Share on Facebook" fires only this new event. A single dialog open can produce at most one of the two, per actual method chosen — they must never be summed as if they were the same action.

### 9b. No calls on: render, opening the share choice, choosing the image path instead, generation, rerender, or an unavailable state

Matches the same discipline already established for `weather_voice_share_clicked`. A later, separate deliberate click on the Facebook link after a prior click is a new, genuine activation and counts again.

### 9c. The static comment-permalink catalogue (what the Facebook link actually points to)

Every (language, comment) pair currently in `getWeatherVoiceLibrary()` (54 combinations as of this writing: 27 comments × is/en) has a pre-generated, checked-in, immutable pair of files:

- `public/share/tjaldur/v1/<language>/<voiceId>.html` — a plain static page (no JavaScript required to render its content) with complete Open Graph metadata, `<meta name="robots" content="noindex, follow">`, and a link back to the real public homepage.
- `public/share/tjaldur/v1/<language>/<voiceId>.png` — a standalone 1200×630 image showing only the exact comment text and the correct mascot for its mood — no site/date/weather/location context of any kind, unlike the 1080×1080 in-app share image.

Generated by `scripts/exportWeatherVoiceShare.mjs` (`npm run share:export`), never at request time or during `npm run build` — production builds only copy files this script already produced. The runtime Facebook resolver (`src/lib/weatherVoiceFacebookShare.js`) only offers the Facebook link when the CURRENT frozen snapshot's `voiceId`+`language`+`text`+`mood` exactly match a generated entry; any drift (edited copy, an id genuinely absent from the catalogue) shows a localized "Facebook sharing isn't available for this comment yet" state instead — image sharing keeps working regardless, and no other quote is ever substituted.

**Released versions are immutable.** A future copy change to an already-exported comment ships as a new version (`v2`, etc., see `src/lib/weatherVoiceShareUrl.js`) — the export script itself refuses to silently overwrite a released `v1` entry's text/mood.

### 9d. Relationship to the manual Facebook pilot (§4/§5)

The universal, user-initiated "Share on Facebook" button (this ticket) and the still-conservative, editorially-curated manual pilot posts (§4b/§5) remain two separate things, exactly as §4 already establishes for image sharing: this ticket does not expand, authorize, or change what the owner chooses to manually publish as an official Eltum Veðrið Facebook post. A user who taps "Share on Facebook" is initiating their OWN share via Facebook's own sharer dialog — this app never posts on anyone's behalf, uploads an image to Facebook directly, or holds any Facebook app secret/SDK.

### 9e. Live Facebook rendering — external, pending, and out of this document's control

`developers.facebook.com/docs/sharing/webmasters/` returned HTTP 429 during this ticket's own preflight research — no live-Facebook-rendering behavior is independently verified or claimed anywhere in this codebase or its evidence. **Live Facebook preview acceptance is an explicit, separate, external step** requiring an owner-provided public deployment checked with Facebook's own Sharing Debugger (`developers.facebook.com/tools/debug/`) and a real desktop/mobile Facebook client — this remains pending after this ticket's code-level completion, exactly like every other "deploy and verify externally" item already tracked in §6/§7.

---

## 8. What this document does NOT authorize

- No post has been published.
- No message has been sent to any person, group, or page.
- No paid Facebook campaign has been created.
- No automatic/scheduled posting exists or is implemented anywhere in this codebase.
- No GitHub issue has been closed and no follow-up issue has been created by CC.
- **Ticket 417 (#417) addition:** no static share page has been deployed to production, no Facebook Sharing Debugger check has been run, and no Facebook post has been created via the new "Share on Facebook" link by CC — this is client-side code + a checked-in static asset catalogue only.
