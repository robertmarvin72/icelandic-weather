"""#485 iteration-4 -- TEST-ONLY child-process entry point. CORRECTION v6
(R5/R6): the TLS test-CA plumbing moved ENTIRELY to this test-side file --
`transport_core.request()` no longer accepts a `ca_file`/`verify`
parameter at all; a custom trust root is installed by monkeypatching
`transport_core._create_tls_context` from WITHIN this process only (a
throwaway interpreter that exits immediately after), never via a
parameter on the shared function's signature. Secret encoding now goes
through the SAME `secret_policy.validate_and_encode()` as production
`child_worker.py`, not a raw append, so the policy itself cannot diverge
between the two.

Mirrors `../child_worker.py`'s protocol and structure, but reads its
TARGET (host/port/path/use_tls) from its own stdin payload instead of
`provider_target`'s fixed constants -- this is the ONE place in this task
that a transport target is externally supplied, and it lives only here,
under `test/`, never imported by `pipeline.py` or `child_worker.py`
(`test_import_isolation.py` asserts this statically, imports AND calls).

Optionally honours a `dns_stall_seconds` field: if present, monkeypatches
`socket.getaddrinfo` WITHIN THIS OWN PROCESS ONLY to sleep before
resolving, so the DNS-stall test can exercise the real "parent kills a
hung child" path without needing an actually unreachable DNS server.

Optionally honours an `ignore_deadline` field: if true, this child
deliberately does NOT respect its own cooperative deadline at all (it
sleeps far past it before ever calling `transport_core.request()`) --
used by the "uncooperative child" test to force the PARENT's real
SIGKILL/TerminateProcess path, proving an actual kill, not a voluntary
exit(0).
"""
import json
import os
import socket
import sys
import time

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _THIS_DIR)
import _network_guard as _guard  # noqa: E402
_guard.install()  # CORRECTION v7 (R1): installed before transport_core is ever imported/used

sys.path.insert(0, os.path.join(_THIS_DIR, ".."))
import secret_policy  # noqa: E402
import transport_core  # noqa: E402


def _install_dns_stall(stall_seconds):
    real_getaddrinfo = socket.getaddrinfo

    def _stalling(*args, **kwargs):
        time.sleep(stall_seconds)
        return real_getaddrinfo(*args, **kwargs)

    socket.getaddrinfo = _stalling


def _install_test_ca(ca_file):
    import ssl

    def _test_tls_context():
        return ssl.create_default_context(cafile=ca_file)

    transport_core._create_tls_context = _test_tls_context


def main():
    raw = sys.stdin.readline()
    try:
        payload = json.loads(raw)
        host = payload["host"]
        port = int(payload["port"])
        path = payload["path"]
        use_tls = bool(payload["use_tls"])
        query_no_key = payload["query_no_key"]
        secret = payload["secret"]
        deadline_epoch = float(payload["deadline_epoch"])
        decoded_cap = int(payload["decoded_cap"])
        dns_stall_seconds = payload.get("dns_stall_seconds")
        ca_file = payload.get("ca_file")
        ignore_deadline = payload.get("ignore_deadline", False)
    except Exception:
        print(json.dumps({"category": "BAD_CHILD_INPUT", "status": None,
                           "bytes_decoded": 0, "truncated": False}))
        print(json.dumps({"body_latin1": ""}))
        return 0

    if dns_stall_seconds:
        _install_dns_stall(dns_stall_seconds)
    if ca_file:
        _install_test_ca(ca_file)

    if ignore_deadline:
        # Deliberately uncooperative: sleep well past any reasonable
        # parent-side total deadline WITHOUT checking it at all, so the
        # only way this process ever stops is the parent forcibly killing
        # it -- proving a REAL kill, never a cooperative exit.
        time.sleep(3600)
        return 0  # unreachable in practice; present for clarity only

    deadline_monotonic = time.monotonic() + (deadline_epoch - time.time())

    try:
        encoded_secret = secret_policy.validate_and_encode(secret) if secret else None
    except secret_policy.MalformedSecret as e:
        print(json.dumps({"category": e.category, "status": None, "bytes_decoded": 0, "truncated": False}))
        print(json.dumps({"body_latin1": ""}))
        return 0

    full_query = query_no_key + (("&apikey=" + encoded_secret) if encoded_secret else "")

    try:
        status, body, truncated, encoding = transport_core.request(
            host=host, port=port, path=path, query=full_query, headers=None,
            use_tls=use_tls, deadline_monotonic=deadline_monotonic, decoded_cap=decoded_cap,
        )
        result = {"category": "OK", "status": status, "bytes_decoded": len(body), "truncated": truncated}
    except transport_core.TransportError as e:
        result = {"category": e.category, "status": None, "bytes_decoded": 0, "truncated": False}
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
