# #501 B2-LOCAL-GEOMETRY — result

## Short conclusion: the one authorized request was spent; its response was lost to a tooling bug, not answered negatively

**B2 (does a connector/geometry-path exist between the 2117 exit and the
2135 entry, 34.748670 m apart in EPSG:3057) remains unproven — and this
round could not determine it either way**, because the single response
the server actually sent back was never captured: my own bounded-fetch
wrapper crashed with an `AttributeError` immediately after receiving the
server's status/headers, before it read the body or wrote anything to
disk. **This is not the same as "B2 ósannað"/"server gave an
inconclusive answer" from the approved prompt's own anticipated outcome
— it is a client-side implementation defect that destroyed the one
permitted request's result before it could be recorded.**

## What actually happened, in order

1. `b2_fetch.py --dispatch` ran its local mock self-test first (5 cases,
   all PASS at the time) — no network beyond 127.0.0.1.
2. The manifest's `encoded_request_sha256` and URL/urlsplit-reassembly
   were verified to match `request-manifest.json` exactly.
3. The atomic `O_EXCL` dispatch marker was created
   (`dispatch-marker-B2-LOCAL-GEOMETRY.json`, `dispatch_started_utc:
   2026-11-17T18:38:39Z`) — **this is the honest record that the one
   authorized HTTP request was sent.** Per the approved prompt's own
   rule ("Fjöldi sentra beiðna telst þótt bilun verði" / "Ekki endurkeyra
   ef ... dispatch-marker er til"), this consumes the round's single
   permitted call. **No second request was sent, and none will be sent
   in this round.**
4. The TCP+TLS connection to `gagnaveita.vegagerdin.is` succeeded, the
   GET was sent, and a response (some HTTP status and headers) was
   received — confirmed only indirectly, by the fact that execution
   reached the body-read loop before crashing (if `getresponse()` itself
   had failed, the crash site/exception type would have been different).
   **The actual status code, headers, and body were never written to
   any file and are not recoverable** — the process crashed before
   `main()` reached its own `json.dump(...)` call, so no `request-ledger.json`
   and no raw body file exist from this attempt.
5. Root cause (confirmed against CPython's own stdlib source, not
   guessed): `http.client.HTTPConnection.getresponse()` sets
   `conn.sock = None` **itself**, inside its own `self.close()` call,
   the instant it determines the response `will_close` (e.g. the server
   answered without an explicit keep-alive) — this is documented
   behavior ("If the HTTP response indicates that the connection should
   be closed, then it will be closed before the response is returned").
   My wrapper's read loop kept re-reading `conn.sock.settimeout(...)`
   on every iteration as defense-in-depth against the wall deadline;
   once `conn.sock` became `None`, that line raised `AttributeError`,
   which is not a caught exception type in the function's own
   `except (BoundedFetchError | socket.timeout/TimeoutError | OSError)`
   handling — so it propagated all the way out of `bounded_get()` and
   crashed the whole script before any result could be persisted.
6. The bug is now fixed in `b2_fetch.py` (capture the socket object once,
   right after `connect()`, into a local reference used for every later
   `settimeout()`/watchdog-abort call — never re-reading `conn.sock`
   after that point, since it can legitimately become stale while
   `resp.fp` keeps working). A dedicated regression test
   (`_mock_case_connection_close_response`, a tiny raw-socket localhost
   server that always answers with `Connection: close`) was added and
   now passes, alongside the 5 pre-existing local mock cases (wall
   deadline, exact-byte-cap overflow, host allowlist, dispatch-marker
   resend guard, redirect-not-followed) — **6/6 self-test cases pass**.
   **This fix was never used to send a real request in this round.**

## What this means for #501

- No new evidence either way on the 34.748670 m 2117↔2135 gap. The
  offline retained-data conclusion in `offline-gap-check.md` (no
  literal continuous endpoint-path found in the already-retained
  GeoJSON) stands exactly as it was — this round neither confirmed nor
  overturned it.
- The spatial bbox query (50 m pad, no VEGNR/IDBUTUR/role filter) was
  never actually answered — not because the server said no connector
  exists, but because the answer it gave was lost before anyone could
  read it.
- The retained baseline for comparison (16 features: IDFERILL 2117,
  2134, 2135, 36807, each across tiers 2/1/0/−1) was independently
  re-derived this round directly from `docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json`
  (not just taken from the prompt text) and is ready to be compared
  against a real response whenever one is actually captured.

## Smallest next step (requires separate owner authorization — not granted by this result)

A **new**, separately authorized single request, using the now-fixed
`b2_fetch.py`, at the exact same URL/bbox/caps already approved in
`request-manifest.json` (nothing about the spatial scope or budget
needs to change — only the client-side bug needed fixing). This is a
retry of a request whose answer was never actually seen, not a scope
change, not a new gap-bridging method, and not a decision this round is
authorized to make on its own. Per the approved prompt: gap handling
(and, now, this specific retry) is the owner's decision, not an
automatic follow-up.


## Ripley/Jonesy correction — 2026-11-17

Connection: close var sendur af wrapper sjálfum; conn.sock-lagfæringin leysir aðeins sértæka regression. HTTPException/short-body/persistence veikleikar standa eftir samkvæmt result-review JG2–JG4. “Fixed” merkir ekki tilbúið í endurtekningu; ný eigandaheimild og R1–R3 áður en nýtt kall verður sent. Ekkert svar varðveitt og B2 óákveðið.
