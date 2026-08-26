# Decision-comprehension research quiz (#395)

Small, unlisted research tool that checks whether real users understand the
homepage's canonical `stay` / `move` / `consider` recommendation, rendered via
the real `HomeDecisionCard` component with frozen fixtures. Results are
appended to a private, owner-controlled Google Sheet via a small Google Apps
Script web app — there is no application backend/database involvement.

Related: GitHub issue #395 (follow-up implementation for #377).

## How it works, in one paragraph

A participant opens `/research/decision-quiz` (never linked from navigation),
gives lightweight consent, sees the three canonical scenarios in a random
order, answers a few fixed-choice questions per scenario, and presses one
submit button. The browser POSTs a JSON payload directly to a Google Apps
Script web app URL (`text/plain` body, no custom headers — the only shape
Apps Script can answer without a CORS preflight). Apps Script validates,
formula-sanitizes, and appends one row per completed quiz to a Sheet tab,
then returns a small JSON acknowledgment the browser can actually read. The
participant only ever sees "confirmed" once that acknowledgment is verified.

## Owner setup (one-time)

1. **Create the private Google Sheet.** Any private Sheet you own. Note its
   ID (the long string in the Sheet's URL between `/d/` and `/edit`).
2. **Open Apps Script attached to that Sheet**: Extensions → Apps Script.
3. **Copy in the two source files** from this repo, verbatim, as separate
   files in the Apps Script project:
   - `google-apps-script/decision-quiz/core.js`
   - `google-apps-script/decision-quiz/adapter.js`

   Do not rename either file's top-level identifiers (`DecisionQuizCore`,
   `doPost`, `doGet`) — the adapter calls the core by that exact global name.
4. **Set the manifest.** In the Apps Script editor, enable "Show
   `appsscript.json` manifest file" (Project Settings) and match the
   settings in `google-apps-script/decision-quiz/appsscript.json` (V8
   runtime, timezone, web app access).
5. **Set Script Properties** (Project Settings → Script Properties):

   | Property | Value |
   |---|---|
   | `SPREADSHEET_ID` | the Sheet ID from step 1 |
   | `SHEET_TAB_NAME` | e.g. `responses` (created automatically with headers if missing) |
   | `ACTIVE_TEST_VERSION` | `1` — must exactly match the frontend's `RESEARCH_QUIZ_TEST_VERSION` (`src/config/researchQuiz.js`) |

   None of these values ever reach the frontend or the public.
6. **Deploy as a web app**: Deploy → New deployment → type "Web app".
   - Execute as: **Me** (your account)
   - Who has access: **Anyone**
   - Copy the resulting `https://script.google.com/macros/s/XXXXX/exec` URL.

   Redeploy (New deployment, not "Manage deployments" edit-in-place) whenever
   `core.js`/`adapter.js` change, so the live URL picks up the new code.
7. **Authorize the script** the first time — Apps Script will prompt for the
   Sheets scope on first execution (either via the editor's "Run" button on a
   trivial test call, or on the first real submission).

## Frontend configuration

Set these on the Vercel project (or `.env.local` for local testing) —
**never commit the real web app URL to a public value if you'd rather keep it
private; it is not secret in the security sense, but is not meant for public
discovery either**:

```bash
VITE_RESEARCH_QUIZ_ENABLED=true
VITE_RESEARCH_QUIZ_WEBAPP_URL=https://script.google.com/macros/s/XXXXX/exec
VITE_RESEARCH_QUIZ_CAMPAIGN=optional-shareable-label
```

Missing or invalid configuration (wrong URL shape, `ENABLED` not exactly
`"true"`/`"1"`) fails closed: the route renders a neutral "not available"
message and cannot submit anything.

## Disabling the quiz

Set `VITE_RESEARCH_QUIZ_ENABLED=false` (or remove it) and redeploy the
frontend. The route still exists but immediately renders the disabled state
— no code removal needed, and this does not affect the reusable
quiz/scenario infrastructure for a future test version.

## Participant link

Share exactly: `https://<your-domain>/research/decision-quiz` (optionally
append `?...` only if a future version adds query-based campaign tagging —
v1 reads the campaign value from build-time config, not the URL). The link
itself is the only access control (plus the independent enabled/disabled
switch above) — this is an unlisted URL, not an authentication boundary.

## Sheet schema

One row per completed quiz. Headers (in order), created automatically on the
first write if the tab is empty — see `DecisionQuizCore.SHEET_HEADERS` in
`google-apps-script/decision-quiz/core.js` for the single source of truth:

```
received_at, session_id, test_version, fixture_version, campaign, lang, viewport,
client_started_at, client_completed_at, scenario_order,
scenario_1_id, scenario_1_interpretation, scenario_1_reason, scenario_1_action,
  scenario_1_first_action, scenario_1_interpretation_ms, scenario_1_note,
scenario_2_id, scenario_2_interpretation, scenario_2_reason, scenario_2_action,
  scenario_2_first_action, scenario_2_interpretation_ms, scenario_2_note,
scenario_3_id, scenario_3_interpretation, scenario_3_reason, scenario_3_action,
  scenario_3_first_action, scenario_3_interpretation_ms, scenario_3_note
```

`scenario_N_*` columns are ordered by `scenario_order` for that row (i.e.
`scenario_1_*` is whichever canonical scenario the participant saw first),
not by a fixed stay/move/consider order — join on `scenario_order` (a
comma-separated string, e.g. `move,stay,consider`) if you need to normalize
across rows for analysis.

No PII column exists by design — no name, email, account ID, cookie, IP,
user-agent, exact viewport, or precise location is ever collected.

## Exporting to CSV

File → Download → Comma-separated values (.csv) directly from the Google
Sheet's own File menu, or File → Download for the specific tab. No in-app
export feature was built — the Sheet's own export is sufficient and
directly analyzable (flat columns, no embedded JSON).

## Known limitations

- **CORS/acknowledgment**: verified (see cc-report.md for sources) that an
  Apps Script `doPost` returning `ContentService.createTextOutput(...)` — not
  `HtmlService` — produces a response a normal browser `fetch()` (default
  `'cors'` mode, no `no-cors`) can actually read for this simple-request
  shape. If Google changes this platform behavior, the frontend's
  "unconfirmed" state (not a false "confirmed") is the fallback — never a
  fabricated success.
- **Freshness/availability**: Apps Script web apps and Sheets both have
  execution/quota limits appropriate for a short-lived, low-volume research
  tool; they are not designed for high-throughput production traffic. This
  quiz is not intended to run indefinitely at scale.
- **Abuse controls**: bounded payload size/shape, strict enum validation, and
  idempotency naturally limit abuse; there is no bot-detection or IP-based
  rate limiting (deliberately — the frontend collects no IP, and this is
  proportionate to an unlisted, low-traffic research link, not a public
  form).
- **CSP**: no project-wide Content-Security-Policy existed before this
  change (see cc-report.md, "CSP audit finding"). The new header restricts
  only `connect-src` and only on `/research/decision-quiz` — see that file
  for the reasoning.
- **No live Google deployment exists yet in this environment.** The owner
  (Róbert) must perform steps 1–7 above and the manual browser→Sheet smoke
  test before sharing the participant link with real users. See
  cc-report.md's "Smoke-test status" section.
