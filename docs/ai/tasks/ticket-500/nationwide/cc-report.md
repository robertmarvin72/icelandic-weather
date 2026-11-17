# #500 — nationwide 56-place data contract, CC report

## Authorization record

- Approved prompt: `docs/ai/tasks/ticket-500/nationwide/approved-prompt-v1.md`
  (Jonesy APPROVED context/56-place list, NB1 incorporated; Ripley
  2026-11-14).
- Owner handoff: "Prompt approved" on `CURRENT.md` while `Stage:
  READY_FOR_CC`, 2026-11-14.

## What was created

- **`server_data/winter-route-places.json`** — `schema_version: 1`, 56
  place entries, copied verbatim (name + region + order) from
  `docs/ai/tasks/ticket-500/nationwide-owner-scope.md`'s "Lokaður listi
  veljanlegra staða". No place added, removed, or renamed.
  - The four existing access points (`reykjavik-raudavatn`, `egilsstadir`,
    `seydisfjordur`, `akureyri`) keep their existing ids and reuse their
    exact coordinates/road references from the reviewed
    `ticket-500/places-v1.json` (current, KD1/KD2-corrected, on-disk copy —
    read fresh this round, not from memory). `name` for the Reykjavík entry
    is the owner's plain "Reykjavík"; the Rauðavatn/R1 distinction is
    carried in `approach`, per NB3 — no independent city-core decision was
    made.
  - The other 52 places get new simple ASCII-slug ids, `coordinates:
    null`, `approach: null`, and `connectionStatus.state: "PENDING"` with
    an explicit Icelandic reason ("ekki yfirfarið fyrir þessa vöruskrá") —
    never "no data"/"road closed" wording.
  - `Keflavík` and `Keflavíkurflugvöllur (KEF)` are two separate entries;
    `"KEF"` is an alias of the airport entry only.
  - `Reykjahlíð (Mývatn)` carries the NB2-corrected status
    (`NAME_MATCH_INFERRED`, piece 3566) in its pending reason text, not
    "no match found".
  - No place's `connectionStatus` is `supported`/`routable` in this round.
- **`api/_lib/winterRoute/places.test.js`** — one targeted Vitest suite
  reading the real JSON file from disk (matching this project's existing
  `fs`/`path.join(process.cwd(), ...)` read pattern, as in
  `api/campsites.js`), verifying:
  1. Exactly 56 entries, names+regions equal to an **independently
     transcribed** expected list (not derived from the file under test),
     in the same order.
  2. All 56 ids unique and ASCII-slug shaped.
  3. Keflavík/KEF are two distinct entries; `"KEF"` aliases only the
     airport; no alias string collides with a real place id (no 57th
     place).
  4. The four retained ids keep their exact prior coordinates; Reykjavík's
     `approach` text names Rauðavatn explicitly.
  5. The other 52 places have `null` coordinates/approach, `PENDING`
     status, and a reason that is never "no data"/"road closed" wording.
  6. No place anywhere has a `supported`/`routable` connection state.
- `docs/ai/tasks/ticket-500/nationwide/cc-report.md` (this file).

## Verification performed

- `npx vitest run api/_lib/winterRoute/places.test.js` — **11/11 tests
  pass**.
- `npx eslint api/_lib/winterRoute/places.test.js` — clean, no warnings.
- `git diff --check` on the tracked change (`CURRENT.md`) — clean.
- New untracked files (`winter-route-places.json`, `places.test.js`,
  `ticket-500/nationwide/`) read back directly after writing to confirm
  content; raw-byte check confirmed correct UTF-8 encoding of Icelandic
  characters (no BOM/escape corruption).
- `git status --porcelain` confirms only the files the approved prompt's
  "Leyfðar breytingar" list permits were touched: `CURRENT.md` (tracked,
  modified) plus the three new files/dir above. No other file in the
  repository was changed.

## What is NOT delivered (explicitly out of scope this round)

- No route engine, `/winter-route` UI wiring, or API endpoint change — the
  existing `/winter-route` entrypoint is unchanged.
- No new coordinates/approach data was invented for the 52 pending places
  — they stay honestly `null`/`PENDING`.
- No `#501`–`#504` ticket text, GitHub issue, commit, or push.
- No change to any previously-approved prompt or research data
  (`places-v1.json`, `r1-north-connection.json`, `endpoint-registry.json`,
  `#491` chain data) — all read-only this round.
- Route composition / Frá-Til UI wiring is explicitly deferred to a
  separate, later prompt with its own review, per NB1.

## Status

PASS for this round's own stated acceptance: the 56-place product list is
fixed, matches the owner's exact names/order/regions, keeps the four
existing access points unchanged, and is confirmed by the targeted test
suite above. This does not mean `#500` nationwide coverage is complete —
52 of the 56 places still need an access-point/connection decision, and
route composition across the network has not started.
