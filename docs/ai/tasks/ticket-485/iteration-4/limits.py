"""#485 iteration-4 -- the single, frozen source of truth for every cap/
deadline this candidate enforces. CORRECTION v6 (R5/R6): `pipeline.py`'s
v5 public `run_request(..., _decoded_cap=..., _total_deadline_s=...)`
parameters let a caller override these; removed entirely. Every module
that needs one of these values (`ledger.py`, `pipeline.py`,
`child_worker.py`) imports it from HERE, as a fixed constant -- there is
no parameter, anywhere on the provider-facing path, through which a
caller can change any of these. A test that genuinely needs a different
profile does so in its OWN copied tree (see `test/test_e2e_loopback.py`),
never by passing an override into the real module.
"""

PROVIDER_ATTEMPT_COUNT_CAP = 2
DECODED_CAP_PER_ATTEMPT = 2 * 1024 * 1024
DECODED_CAP_TOTAL = 4 * 1024 * 1024
RUN_WINDOW_S = 60
TOTAL_DEADLINE_S = 20  # DNS+connect+TLS+send+recv+decompression+IPC, the WHOLE exchange -- no added grace period
