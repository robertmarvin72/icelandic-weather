"""#485 iteration-4 correction v7 (R1 fix, R2/R6 proof) -- TEST-ONLY
runner. CORRECTS a real hard-rule breach Jonesy's Round-2 review found:
the v6 version of this runner ran the REAL, unmodified `child_worker.py`
against the REAL `provider_target` constants (the actual
`customer-api.open-meteo.com` host), patching only `socket.socket.
connect` -- so `transport_core.request()` still called
`socket.getaddrinfo("customer-api.open-meteo.com", 443)` for REAL before
the patched `connect()` was ever reached. That is a genuine "no external
network, DNS included" breach, even though no TCP connection or key ever
actually left the process.

Fix: (1) installs `_network_guard` FIRST, as a hard backstop -- any
accidental non-loopback lookup/connect anywhere in this process is
refused before it ever reaches a real resolver/socket call; (2) builds a
scratch `provider_target.py` RETARGETED to a literal loopback address
and places its directory FIRST on `sys.path`, so the REAL, unmodified
`child_worker.py` (loaded via `runpy.run_path()`, never copied or
edited) resolves `import provider_target` to the retargeted copy, while
`transport_core`/`limits`/`secret_policy` still resolve to the REAL,
unmodified candidate files (added to `sys.path` SECOND). Then
monkeypatches `socket.socket.connect` WITHIN THIS OWN PROCESS ONLY to
raise a raw OSError whose message embeds a full FAKE provider URL
(`fake-provider.invalid` -- an address that is never actually looked up
or connected to; it only ever appears as literal text inside the
injected exception's message) WITH the secret appended as a query
parameter -- simulating the worst case: some underlying stdlib/OS call
reporting an error that happens to echo back exactly the data it was
asked to send.

This proves `transport_core.request()`'s own `except OSError: raise
TransportError(CATEGORY_CONNECT_FAILURE)` (and `child_worker.py`'s outer
`except Exception: CHILD_INTERNAL_ERROR` as a second line of defence) is
not merely declared but ACTUALLY discards that raw, secret-bearing
message -- using the REAL production `child_worker.py` file, unmodified,
not a seam, and with zero real network/DNS activity of any kind.
"""
import os
import shutil
import socket
import sys
import uuid

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_PARENT_DIR = os.path.dirname(_THIS_DIR)
CHILD_WORKER_PATH = os.path.join(_PARENT_DIR, "child_worker.py")  # the real, unmodified production file

sys.path.insert(0, _THIS_DIR)
import _network_guard as _guard  # noqa: E402

# A fixed, hardcoded constant (not passed via env/argv -- those channels
# are either stripped by pipeline.py's _minimal_child_env() or already
# used by child_worker.py's own stdin protocol). The test file imports
# this exact constant for its assertions, so there is one source of
# truth, never two copies that could silently drift apart.
FAKE_SECRET = "ITER4-URL-LEAK-INJECTION-FAKE-SECRET-zzz999"
FAKE_URL = f"http://fake-provider.invalid/v1/forecast?latitude=1.0&apikey={FAKE_SECRET}"

_real_connect = socket.socket.connect


def _exploding_connect(self, *args, **kwargs):
    raise OSError(f"simulated low-level failure while connecting to {FAKE_URL}: connection refused")


def _build_retargeted_provider_target_dir():
    """A scratch directory containing ONLY a retargeted `provider_target.py`
    (literal loopback host) -- never the real one, never written to the
    real candidate tree."""
    scratch_dir = os.path.join(_PARENT_DIR, "tmp", "url_leak_provider_target_" + uuid.uuid4().hex[:8])
    os.makedirs(scratch_dir, exist_ok=True)
    with open(os.path.join(scratch_dir, "provider_target.py"), "w", encoding="utf-8") as f:
        f.write(
            '"""TEST-ONLY retargeted copy -- never the real provider_target.py."""\n'
            'PROVIDER_SCHEME = "http"\n'
            'PROVIDER_HOST = "127.0.0.1"\n'
            'PROVIDER_PORT = 1\n'  # nothing need actually be listening -- connect() is intercepted below
            'PROVIDER_PATH = "/forecast"\n'
        )
    return scratch_dir


def main():
    _guard.install()
    retargeted_dir = _build_retargeted_provider_target_dir()
    try:
        socket.socket.connect = _exploding_connect
        import runpy
        sys.argv = [CHILD_WORKER_PATH]
        sys.path.insert(0, retargeted_dir)  # resolves `import provider_target` to the loopback copy FIRST
        sys.path.insert(1, _PARENT_DIR)     # the REAL, unmodified transport_core/limits/secret_policy
        runpy.run_path(CHILD_WORKER_PATH, run_name="__main__")
    finally:
        shutil.rmtree(retargeted_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
