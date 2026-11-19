# #501 B2-LOCAL-GEOMETRY-ATTEMPT-2 — result

## Short conclusion: the request was sent, a real response was fully captured, and the server rejected it (HTTP 400) — B2 is still unproven, but this time honestly and completely, not lost

The one new, owner-authorized request was dispatched, cleanly, with the
fixed wrapper — **no crash this time**. The server actually answered,
and the answer was: `HTTP/1.1 400 Bad Request`, nginx's own generic
error page (not a GeoServer WFS `ServiceExceptionReport`), 157 bytes,
fully retained with a verified SHA-256. **B2 remains neither confirmed
nor refuted** — this is a different kind of inconclusive result than
attempt-1 (a genuine server-side rejection of the exact approved
request, fully recorded, rather than a lost response), not a step
toward "no connector exists."

## What was verified before dispatch

- `request-manifest.json`'s `encoded_request_sha256` independently
  re-verified (`sha256(b"GET " + url)` matches exactly), and the
  URL/`urlsplit`-reassembly check passed — the exact same URL as
  attempt-1, byte for byte.
- The prior `b2-geometry/` attempt's `dispatch-marker-B2-LOCAL-GEOMETRY.json`
  and `b2_fetch.py` hashed **before and after** this round (O3):
  identical both times (`cfa658af…` and `bbf057b5…` respectively) —
  that folder is untouched.
- 13/13 local self-test cases passed on this machine before any
  dispatch was attempted: the 8 required scenarios (`Connection: close`
  response, truncated chunked/`IncompleteRead`, bad status line, short
  body vs `Content-Length`, slow-trickle wall deadline, exact 1-byte
  cap overflow, dispatch-marker resend refusal, redirect not followed)
  plus 5 offline `classify_response()` fixtures (good body, wrong CRS,
  `numberReturned==100`, count mismatch, non-JSON body).

## The one new request — dispatched exactly once

- `dispatch-marker-B2-LOCAL-GEOMETRY-ATTEMPT-2.json` created
  (`dispatch_started_utc: 2026-11-17T19:01:22Z`) before any socket
  activity — the honest record that this round's one call was sent.
- `request-ledger.json`: `http_status: 400`, `Content-Type: text/html`,
  `Content-Length: 157` (matches the retained body's own byte count —
  transport itself was complete, not truncated), `Connection: close`
  (the **server's** own choice this time, not a header this client
  sent — removing the client's own `Connection: close` header, per
  JG1, did not stop the server from closing on its own).
- `raw-B2-LOCAL-GEOMETRY-ATTEMPT-2.bin` (157 bytes, SHA-256
  `261c4ca72e7bec9b49794d577e7fc9a6348f97af405a24b05bce341dbd3786b0`):
  nginx's stock 400 page —

  ```html
  <html>
  <head><title>400 Bad Request</title></head>
  <body>
  <center><h1>400 Bad Request</h1></center>
  <hr><center>nginx/1.20.1</center>
  </body>
  </html>
  ```

  This is nginx's own default error page, not a WFS/GeoServer-level
  `ServiceExceptionReport` — the rejection happened at the HTTP/
  reverse-proxy layer, before (or without) reaching the WFS
  application layer that answered the earlier, successful
  `DescribeFeatureType` metadata-acquisition request on the same host.
- `outcome: "failed"`, `failure_reason: "http_status_400"` —
  `classify_response()` correctly stopped at the status-code check and
  never attempted to parse the HTML body as GeoJSON.

## Why this counts as a transport success despite the HTTP failure

Every R1–R3 persistence/classification requirement was exercised for
real this time: the marker was written, the ledger was written at both
checkpoints (after `getresponse()` and in the final `finally`), the
full body was captured and hashed, and `main()` returned normally with
a clean, fully-populated result — no `AttributeError`, no silent data
loss, nothing left for a human to reconstruct from a crash site. The
wrapper did exactly what R1–R3 asked of it.

## Why the 400 itself is not investigated further here

Diagnosing *why* nginx rejected this specific request (URL encoding
style, a header it expects, rate limiting, something else entirely)
would require trying a modified request — a different URL, different
headers, or a fresh probe — which this round's own approved scope
explicitly forbids ("no alternative URL", "max 1 sent HTTP request",
"ekki stækka box eða endurkeyra"). This is recorded as an honest,
specific limitation, not resolved by guessing.

## Per O6 — this is the second B2 round; no third attempt is proposed here

Attempt 1 lost its response to a tooling bug (fixed, documented,
regression-tested). Attempt 2 reached the server cleanly and was
rejected by it. Two different failure modes, same practical result:
**B2 is still unproven**, and the gap in question is 34.7 m of a
45.7 km corridor (0.08%). Per the approved prompt's own O6 stopping
rule, **no automatic third attempt is proposed.** The one next-step
decision point for the owner is below.

## One next decision point for the owner

Stop pursuing B2 via this exact WFS query and instead treat the
34.748670 m 2117↔2135 gap as a permanently honest, documented data gap
in the retained road register (as `offline-gap-check.md` already
frames it) — **or** separately authorize investigating *why* this
specific request got HTTP 400 (which would require a new request with
a deliberately different formulation, i.e. new scope, not a retry of
the same one). Given the gap's size relative to the whole corridor,
stopping B2 here and documenting the gap as-is is the simpler,
lower-cost option — consistent with the prior round's own advisory
note, not a conclusion this report imposes on its own.


## Ripley/Jonesy correction — JH1–JH3 — 2026-11-17

SUPERSEDED: assertions above that the server rejected the exact approved
request and that two unrelated failure modes justify stopping. Wrapper
putrequest automatically adds Host, then explicit putheader adds a second.
This malformed request likely explains HTTP400; it is not proved the sole
cause. URL equality does not establish a valid wire request. Attempt1 may
also have received 400 but its lost status remains UNKNOWN. Persistence
works in attempt2; B2 has no substantive response. Owner chooses whether
to stop or authorize one new minimally corrected attempt; none automatic.
No implication that the road/connector does not exist or that the provider
rejected the valid BBOX query. Do not edit/delete prior markers or rerun.
