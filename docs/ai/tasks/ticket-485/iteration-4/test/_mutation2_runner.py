"""#485 iteration-4 correction v7 (R1 fix, R2 proof) -- TEST-ONLY runner
for mutation 2. CORRECTS the same real hard-rule breach as
`_url_leak_injection_runner.py`: the v6 version ran the REAL, unmodified
`child_worker.py` against the REAL `provider_target` constants (the
actual `customer-api.open-meteo.com` host), so `transport_core.
request()` called the real resolver for that host before the mutated
`connect()` was ever reached.

Fix: installs `_network_guard` first, and retargets `provider_target` to
a literal loopback address via a scratch directory placed on `sys.path`
ahead of both the mutated `transport_core.py` copy (argv[1]'s directory)
and the real candidate directory -- `child_worker.py` itself is never
touched, loaded via `runpy.run_path()` straight off disk.

Mirrors `_url_leak_injection_runner.py`'s fault (a low-level `connect()`
raising an exception whose message embeds a full URL+secret), but
targets `transport_core.request()`'s own catch-all -- the actual layer
responsible for discarding raw exception text in this architecture, and
therefore the correct place to reintroduce the historical "printed
str(e)" defect for this mutation test.
"""
import os
import shutil
import socket
import sys
import uuid

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_PARENT_DIR = os.path.dirname(_THIS_DIR)
CHILD_WORKER_PATH = os.path.join(_PARENT_DIR, "child_worker.py")  # REAL, unmodified -- never edited

sys.path.insert(0, _THIS_DIR)
import _network_guard as _guard  # noqa: E402

FAKE_SECRET = "ITER4-MUTATION2-FAKE-SECRET-bbb222"
FAKE_URL = f"http://fake-provider.invalid/v1/forecast?latitude=1.0&apikey={FAKE_SECRET}"


def _exploding_connect(self, *args, **kwargs):
    # Deliberately NOT an OSError/socket.timeout: transport_core.request()
    # has its own INNER `except OSError: raise TransportError(CATEGORY_
    # CONNECT_FAILURE)` around sock.connect() specifically, which already
    # safely discards an OSError's text (unmutated, by design) -- that
    # would catch this before it ever reached the OUTER catch-all this
    # mutation targets. A RuntimeError has no inner handler anywhere in
    # transport_core.request() and only reaches the outermost catch-all.
    raise RuntimeError(f"simulated low-level failure while connecting to {FAKE_URL}: connection refused")


def _build_retargeted_provider_target_dir():
    scratch_dir = os.path.join(_PARENT_DIR, "tmp", "mutation2_provider_target_" + uuid.uuid4().hex[:8])
    os.makedirs(scratch_dir, exist_ok=True)
    with open(os.path.join(scratch_dir, "provider_target.py"), "w", encoding="utf-8") as f:
        f.write(
            '"""TEST-ONLY retargeted copy -- never the real provider_target.py."""\n'
            'PROVIDER_SCHEME = "http"\n'
            'PROVIDER_HOST = "127.0.0.1"\n'
            'PROVIDER_PORT = 1\n'
            'PROVIDER_PATH = "/forecast"\n'
        )
    return scratch_dir


def main():
    _guard.install()
    mutated_transport_dir = sys.argv[1]
    provider_target_dir = _build_retargeted_provider_target_dir()
    try:
        socket.socket.connect = _exploding_connect
        # Order matters: the retargeted provider_target.py and the mutated
        # transport_core.py must BOTH resolve before the real candidate
        # directory's own copies of either.
        sys.path.insert(0, provider_target_dir)
        sys.path.insert(1, mutated_transport_dir)
        sys.path.insert(2, _PARENT_DIR)  # real limits/secret_policy -- unaffected
        import runpy
        sys.argv = [CHILD_WORKER_PATH]
        runpy.run_path(CHILD_WORKER_PATH, run_name="__main__")
    finally:
        shutil.rmtree(provider_target_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
