"""#485 iteration-4 -- PRODUCTION child-process entry point. CORRECTION v6
(R5): the secret is now validated and percent-encoded EXACTLY ONCE via
`secret_policy.validate_and_encode()` (shared with the test-only child,
so the policy itself cannot diverge) instead of being raw-appended to the
query string -- a malformed key (CRLF/control/non-ASCII/overlong) is
rejected with a fixed category before any socket is touched, and a key
containing reserved characters (e.g. `&`, `=`, `#`) is encoded so it can
never be mistaken for query syntax or split into an extra field.

Also clamps whatever `decoded_cap`/deadline the parent's stdin payload
requests to the FIXED ceiling in `limits.py`, defence-in-depth against a
buggy/compromised parent -- this file never imports `pipeline.py` or
`ledger.py`, only the limits it needs.

Spawned by pipeline.py as a separate OS process (`python3 child_worker.py`).
Reads EXACTLY ONE JSON line from stdin (never argv, never an environment
variable, never a temp file). Writes EXACTLY ONE JSON line of safe
metadata plus one line of the (still-opaque-to-this-file-caller) decoded
body, to stdout -- never the query, the secret, or any raw exception
text. Imports ONLY `provider_target`/`transport_core`/`secret_policy`/
`limits`. Imports NOTHING from `test/` -- enforced by
`test/test_import_isolation.py`'s static source check (imports AND calls).
"""
import json
import sys
import time

import limits
import provider_target
import secret_policy
import transport_core


def main():
    raw = sys.stdin.readline()
    try:
        payload = json.loads(raw)
        query_no_key = payload["query_no_key"]
        secret = payload["secret"]
        deadline_epoch = float(payload["deadline_epoch"])
        requested_cap = int(payload["decoded_cap"])
    except Exception:
        print(json.dumps({"category": "BAD_CHILD_INPUT", "status": None,
                           "bytes_decoded": 0, "truncated": False}))
        print(json.dumps({"body_latin1": ""}))
        return 0

    decoded_cap = min(requested_cap, limits.DECODED_CAP_PER_ATTEMPT)
    deadline_monotonic = time.monotonic() + (deadline_epoch - time.time())

    try:
        encoded_secret = secret_policy.validate_and_encode(secret)
    except secret_policy.MalformedSecret as e:
        print(json.dumps({"category": e.category, "status": None, "bytes_decoded": 0, "truncated": False}))
        print(json.dumps({"body_latin1": ""}))
        return 0

    # Secret appended HERE, in memory, inside the child, encoded exactly
    # once by a real query encoder -- never raw, never by the parent.
    full_query = query_no_key + "&apikey=" + encoded_secret

    try:
        status, body, truncated, encoding = transport_core.request(
            host=provider_target.PROVIDER_HOST,
            port=provider_target.PROVIDER_PORT,
            path=provider_target.PROVIDER_PATH,
            query=full_query,
            headers=None,
            use_tls=(provider_target.PROVIDER_SCHEME == "https"),
            deadline_monotonic=deadline_monotonic,
            decoded_cap=decoded_cap,
        )
        result = {"category": "OK", "status": status, "bytes_decoded": len(body), "truncated": truncated}
    except transport_core.TransportError as e:
        # CORRECTION v7 (R4): report whatever was honestly observed before
        # the failure (0 if nothing had been read yet), instead of
        # hardcoding 0 regardless -- the parent's ledger accounting
        # charges the full reserved cap for any non-"OK" category
        # regardless of this value (conservative by category, not by
        # this number), so this is purely honest reporting, never a way
        # to charge less than the reserved cap for an incomplete transfer.
        result = {"category": e.category, "status": None,
                  "bytes_decoded": getattr(e, "bytes_decoded_so_far", 0), "truncated": False}
        body = b""
    except Exception:
        result = {"category": "CHILD_INTERNAL_ERROR", "status": None, "bytes_decoded": 0, "truncated": False}
        body = b""

    print(json.dumps(result))
    sys.stdout.flush()
    print(json.dumps({"body_latin1": body.decode("latin1")}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
