"""#485 iteration-4 correction v6 (R2) -- builds a TASK-LOCAL COPY of the
real candidate tree, with ONLY the copy's `provider_target.py` edited to
point at a loopback fixture, then runs the COPY's own, completely
unmodified `pipeline.run_request()` for real: real child-process spawn,
real socket, real ledger file, real deadline enforcement -- against
127.0.0.1 only. The SOURCE tree (`../provider_target.py`, `../pipeline.py`
etc.) is never touched and still has the fixed real provider target with
no live entry command.

This replaces v5's `test_adapter.py`-reaches-into-a-private-parameter
seam, which Jonesy correctly flagged as not proving anything about the
real `run_request()`/`child_worker.py` at all.
"""
import json
import os
import shutil
import subprocess
import sys
import uuid

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_CANDIDATE_DIR = os.path.dirname(_THIS_DIR)
TMP_ROOT = os.path.join(_CANDIDATE_DIR, "tmp", "e2e_copies")

_FILES_TO_COPY = [
    "limits.py", "secret_policy.py", "schema.py", "leak_scanner.py",
    "transport_core.py", "ledger.py", "child_worker.py", "pipeline.py",
]

_PROVIDER_TARGET_TEMPLATE = '''"""TEST-ONLY COPY -- edited by e2e_copy_helper.py for a REAL end-to-end
loopback test. This file does NOT exist in the real candidate with these
values; the real `../../provider_target.py` is untouched and still points
at the actual fixed provider."""

PROVIDER_SCHEME = {scheme!r}
PROVIDER_HOST = {host!r}
PROVIDER_PORT = {port!r}
PROVIDER_PATH = {path!r}

FIXED_TARGET = (PROVIDER_SCHEME, PROVIDER_HOST, PROVIDER_PORT, PROVIDER_PATH)
'''

_RUNNER_TEMPLATE = '''import json
import sys
sys.path.insert(0, {test_dir!r})
import _network_guard as _guard
_guard.install()  # CORRECTION v7 (R1): defense-in-depth, even though provider_target
                  # in this copy is already retargeted to loopback below

sys.path.insert(0, {copy_dir!r})
import pipeline

param_pairs = json.loads(sys.argv[1])
secret = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else None
param_pairs = [tuple(p) for p in param_pairs]
try:
    outcome = pipeline.run_request(param_pairs, secret)
    print(json.dumps({{"ok": True, "outcome": outcome}}))
except Exception as e:
    print(json.dumps({{"ok": False, "exception_type": type(e).__name__,
                        "exception_category": getattr(e, "category", None)}}))
'''


def make_copy(scheme, host, port, path):
    """Returns (copy_dir, ledger_path) for a freshly made, isolated copy."""
    os.makedirs(TMP_ROOT, exist_ok=True)
    copy_dir = os.path.join(TMP_ROOT, f"copy_{uuid.uuid4().hex[:12]}")
    os.makedirs(copy_dir, exist_ok=True)
    for fn in _FILES_TO_COPY:
        shutil.copy2(os.path.join(_CANDIDATE_DIR, fn), os.path.join(copy_dir, fn))
    with open(os.path.join(copy_dir, "provider_target.py"), "w", encoding="utf-8") as f:
        f.write(_PROVIDER_TARGET_TEMPLATE.format(scheme=scheme, host=host, port=port, path=path))
    runner_path = os.path.join(copy_dir, "_runner.py")
    with open(runner_path, "w", encoding="utf-8") as f:
        f.write(_RUNNER_TEMPLATE.format(copy_dir=copy_dir, test_dir=_THIS_DIR))
    ledger_path = os.path.join(copy_dir, "samples", "ledger.json")
    return copy_dir, runner_path, ledger_path


def run_real_request(copy_dir, runner_path, param_pairs, secret, timeout_s=40):
    """Invokes the COPY's own pipeline.run_request() in a fresh, separate
    OS process (so the copy's `sys.path`-shadowed `pipeline` module is
    cleanly isolated from the real one this test file itself may also
    have imported). Returns the parsed JSON result dict."""
    args = [sys.executable, "-B", runner_path, json.dumps(param_pairs), secret or ""]
    proc = subprocess.run(args, cwd=copy_dir, capture_output=True, timeout=timeout_s, text=True)
    try:
        return json.loads(proc.stdout.strip().splitlines()[-1]), proc.stderr
    except Exception:
        return {"ok": False, "exception_type": "RUNNER_OUTPUT_UNPARSEABLE",
                 "raw_stdout": proc.stdout, "raw_returncode": proc.returncode}, proc.stderr


def cleanup_all():
    shutil.rmtree(TMP_ROOT, ignore_errors=True)
