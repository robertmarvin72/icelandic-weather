# #500 — Hveragerði–Vík, one shared decision table

Owner gets one combined disposition here rather than five separate prompts,
per approved-prompt-v1.md's own instruction. Everything below is reused
from retained data (`docs/ai/tasks/ticket-493-place-network/samples/
chain-walks-v4.json`'s `cw_long` chain, steps for pieces 2135..23041, and
`docs/ai/tasks/ticket-493-access-points/place-access-status-v3.csv` /
`place-node-references-v3.json`) — no new WFS call. Full candidate detail
and source citations are in `server_data/winter-route-south-connections.json`;
this table is the short summary.

| Place | Recommended approach | Alternative (if any) | What's missing | Data ready for #501 once owner selects? |
|---|---|---|---|---|
| **Hveragerði** | Piece 2135, native END, (63.99538228° N, 21.19270972° W) | None — only retained node | Only a **NAME_MATCH_INFERRED** reading of piece 2135's name ("Selfoss-Hveragerði"), not a dedicated Hveragerði node; driving access/direction EXACT_GAP | Yes, once owner approves this single candidate — but still `unsupported` for driving direction |
| **Selfoss** | Piece 2138, native END, (63.9523133° N, 21.02049034° W) — 0.0 m continuous toward Hveragerði | Piece 2138, native START, (63.93759503° N, 21.00380428° W) — 30.1 m gap toward Hella side | Owner must pick one of the two; driving access/direction EXACT_GAP either way | Yes, once owner picks a candidate — still `unsupported` for driving direction |
| **Hella** | Piece 3591, native END, (63.84144538° N, 20.40797134° W) — 0.0 m continuous toward Selfoss | Piece 3591, native START, (63.83460817° N, 20.40236144° W) — 32.63 m gap toward Hvolsvöllur side | Owner must pick one of the two; driving access/direction EXACT_GAP either way | Yes, once owner picks a candidate — still `unsupported` for driving direction |
| **Hvolsvöllur** | Piece 3593, native END, (63.75128586° N, 20.23549109° W) — chosen only for naming consistency with Selfoss/Hella; **both sides are 0.0 m continuous, sources do not differentiate** | Piece 3593, native START, (63.74919708° N, 20.23236739° W) — equally supported | Owner choice here is genuinely a coin-flip on current data, not evidence-driven; driving access/direction EXACT_GAP either way | Yes, once owner picks a candidate — still `unsupported` for driving direction |
| **Vík** | Piece 3849, native START, (63.41782798° N, 19.00028197° W) — 0.0 m continuous both sides; internal junction of 3849/23041 within IDBUTUR 801100037; the fixed route continues about 629 m east along 23041, so this is not its endpoint | None — only retained node | Still **OWNER_SELECTION_PENDING** even though there is only one candidate (per `winter-route-south-connections.json#approach_candidates.vik`); driving access/direction EXACT_GAP | Yes, once owner approves — still `unsupported` for driving direction |

All five remain `coordinates: null` / `approach: null` in
`server_data/winter-route-places.json` — only `connectionStatus` and a new
`candidateReference` were added. None is `SUPPORTED`/`ROUTABLE`. Owner
approval of a candidate per place is still required before `#501` can treat
any of these five as a usable Frá/Til endpoint — and even after that,
driving access/direction stays `unsupported` for `#501` until the one
precise gap below is closed.

## The one precise next data gap

**What's missing:** an authoritative source for legal driving
direction/access on this stretch of Route 1 (Hringvegur) between
Hveragerði and Vík — the retained WFS layer (`faerdferlar2017_1`) has no
field encoding this for any of the 25 pieces in this corridor, exactly as
for every other place in `#499`/`#500` so far. The pieces' own
`stored_direction: "rev"` label is a digital/geometry fact (the pieces are
stored running west, opposite to how this corridor is walked east), never a
legal-traffic-direction proof — this is the same ND3 caveat already in the
approved prompt.

**Search limitation:** CC did not use the permitted web-search/page budget.
The retained `faerdferlar2017_1` layer has no field proving legal direction
or access for these corridor pieces. That establishes a limitation of this
layer, not that all other official sources lack the information or that a
search could not resolve the question. No new authoritative access-source
check was performed; legal direction/access remains unresolved. A generic
road mention alone would not suffice, but no broader impossibility claim
is justified by this delivery.

**Stopping here:** per approved-prompt-v1.md's own instruction, this is
recorded as the one precise next gap rather than restating a generic
"EXACT_GAP" or opening a new research track. The five places/candidates are
otherwise ready for the owner's disposition.
