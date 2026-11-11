# #493 phase2 — Owner authorisation record (P1)

**Date:** 2026-11-09.

Per `approved-prompt-v1.md`'s own header instruction ("Skráðu dagsetta
handoff-staðfestingu í owner-authorisation.md áður en fyrsta ytra kall er
sent") and condition P1, this file records the dated owner handoff that
authorises this task's bounded network exchange, written BEFORE any
external HTTP call is made.

## Record

- The owner (Róbert) sent the literal, canonical "Prompt approved"
  handoff message addressed to this Claude Code execution session,
  with `docs/ai/CURRENT.md` at the time pointing to:
  - Task: `ticket-493-place-data-phase2`
  - Stage: `READY_FOR_CC`
  - Approved prompt: `docs/ai/tasks/ticket-493-place-data-phase2/
    approved-prompt-v1.md`
- That approved prompt's own text states explicitly: "Eigandahandoff
  'Prompt approved' á þetta prompt staðfestir sérstaklega lestur
  `px.hagstofa.is`, töflu MAN030106, fyrir þessa lotu innan
  12 exchanges/32 MiB/8 MiB/20 s/30 mín marka." — i.e. the owner's
  "Prompt approved" message, directed at this specific approved prompt,
  IS the dated, in-repo authorisation for THIS bounded exchange, per
  Ripley's own design of this task's approval gate (P1, `prompt-
  review.md`).
- Per the single-active-task invariant (`docs/ai/README.md`), only this
  task was active in `docs/ai/CURRENT.md` at the moment of that handoff.

## What is authorised, and only this

- **Host:** `px.hagstofa.is` (PxWeb API) — read-only (GET for metadata,
  POST for data queries, both read operations against a public
  statistics API; no write/mutating call of any kind).
- **Table:** `MAN030106` (candidate; to be confirmed against its own
  metadata response per item 1/P4 — population by byggðakjarna/
  settlement).
- **Scope:** this task only (`ticket-493-place-data-phase2`); not a
  standing allowlist entry for any other task.
- **Budget ceiling:** 12 HTTP exchanges total, 32 MiB total received,
  8 MiB per response body, 20 s per request, 30-minute acquisition
  window — per item 6/P2/P3, enforced by a small bounded fetch wrapper,
  tested locally against 127.0.0.1 before any real external call (P3).
- **Also already-authorised, from prior rounds, unchanged by this
  record:** `gagnaveita.vegagerdin.is` (WFS), already used by #429/#483/
  #491/north-data/phase1 under its own existing authorisation.

## What is explicitly NOT authorised by this record

- Any other host, table, or dataset — a new host/table/geographic
  dataset requires its own separate proposal step (item 1/3's own
  instruction), not an extension of this record.
- `www.hagstofa.is` (a different host from `px.hagstofa.is`) is not
  needed and not authorised here.
- Any population figure entering the product/app before the owner has
  separately confirmed Hagstofa's own licence/terms (`LICENSE_NOT_
  DETERMINED` until then, per P1).
- Open-Meteo, live weather/road-condition fetches, payments, keys, new
  dependencies, subagents, commit/push, or any GitHub action — all out
  of scope per the approved prompt's own "Verkefni" section.

This record does not itself perform any network action — it is the
dated confirmation required before the first one is attempted.
