"""#485 iteration-4 -- TEST-ONLY adapter: maps an already-validated logical
target to a loopback transport for the test suite, by calling pipeline.py's
PRIVATE `_dispatch_child_and_collect()` directly with `test_transport_child.py`
as its `child_script_path` argument, instead of the real `child_worker.py`.

CORRECTION v6 (R2/R5) scope note: R5 removed the old `_child_script_path=`
KEYWORD OVERRIDE from `run_request()`'s PUBLIC signature entirely -- that
seam no longer exists on the public API at all, for anyone. This adapter
still calls the PRIVATE `_dispatch_child_and_collect()` directly (now with
`child_script_path` as a plain positional argument, since that function
itself must still accept a script path -- `run_request()` is the only
real caller and always passes the literal `CHILD_WORKER_PATH` constant,
verified statically in `test_import_isolation.py`). This file's tests are
narrowly scoped to transport/leak-scan MECHANICS (oversized/redirect/TLS/
DNS-stall/proxy-env behavior) that need a controllable local fixture --
they do NOT constitute this task's R2 "real run_request() end-to-end"
proof. That proof is `test_e2e_loopback.py`'s task-local COPIED-TREE
tests, which run the genuinely public, unmodified `pipeline.run_request()`
with no private-function access at all.

This module is never imported by `pipeline.py`, `child_worker.py`,
`provider_target.py`, `schema.py`, `ledger.py`, `leak_scanner.py`, or
`transport_core.py` -- `test_import_isolation.py` asserts this statically
by parsing their source for any import of `test_adapter`/anything under
`test/`.
"""
import json
import os
import ssl
import subprocess
import sys
import time

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_PARENT_DIR = os.path.dirname(_THIS_DIR)
sys.path.insert(0, _PARENT_DIR)

import pipeline  # noqa: E402 -- the ONLY place this private function is called with an override
import leak_scanner  # noqa: E402

TEST_CHILD_PATH = os.path.join(_THIS_DIR, "test_transport_child.py")


def dispatch_to_loopback(host, port, path, use_tls, query_no_key, secret,
                         total_deadline_s, decoded_cap, dns_stall_seconds=None, ca_file=None):
    """Builds the test-child stdin payload and calls pipeline's private
    dispatch function with the test child script. Returns the SAME safe
    outcome shape `pipeline.run_request()` would persist -- this function
    reuses pipeline's real leak-scan/deadline-kill/parsing logic, it does
    not reimplement a simplified copy of it."""
    deadline_epoch = time.time() + total_deadline_s
    stdin_obj = {
        "host": host, "port": port, "path": path, "use_tls": use_tls,
        "query_no_key": query_no_key, "secret": secret,
        "deadline_epoch": deadline_epoch, "decoded_cap": decoded_cap,
    }
    if dns_stall_seconds is not None:
        stdin_obj["dns_stall_seconds"] = dns_stall_seconds
    if ca_file is not None:
        stdin_obj["ca_file"] = ca_file
    stdin_bytes = (json.dumps(stdin_obj) + "\n").encode("utf-8")
    outcome, validated_sample, sample_status, unknown_field_count = pipeline._dispatch_child_and_collect(
        stdin_bytes, secret, total_deadline_s, TEST_CHILD_PATH)
    return outcome


def spawn_dummy_child_with_kill_timing(stdin_bytes, total_deadline_s, kill_after_s=None):
    """For the kill/crash-recovery tests: spawns the REAL test child but
    lets the caller inspect timing/process-survival directly, rather than
    going through the full pipeline dispatch (which already asserts no
    live process survives past the deadline -- this helper is for the
    narrower "process is actually gone" assertion)."""
    popen_kwargs = dict(stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                         cwd=pipeline.HERE)
    if sys.platform == "win32":
        popen_kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW
    proc = subprocess.Popen([sys.executable, "-B", TEST_CHILD_PATH], **popen_kwargs)
    proc.stdin.write(stdin_bytes)
    proc.stdin.flush()
    try:
        proc.communicate(timeout=total_deadline_s)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait()
    return proc


def make_selfsigned_cert(dirpath):
    key, cert = os.path.join(dirpath, "key.pem"), os.path.join(dirpath, "cert.pem")
    subprocess.run(["openssl", "req", "-x509", "-newkey", "rsa:2048", "-keyout", key, "-out", cert,
                     "-days", "1", "-nodes", "-subj", "/CN=127.0.0.1",
                     "-addext", "subjectAltName=IP:127.0.0.1"], check=True, capture_output=True)
    return key, cert
