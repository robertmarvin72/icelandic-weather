"""CV2(a): a loopback-networking preflight for tests that need a real
127.0.0.1 connection. Returns a THIRD, explicitly-named outcome --
neither a test PASS nor a FAIL -- when loopback networking itself
doesn't work in the current environment (observed once, 2026-11-11,
by Ripley in a separate sandbox; Jonesy's own Linux sandbox and this
session's own Windows runs have never reproduced it, so the root
cause there remains formally UNDETERMINED). Callers use this to
`skipTest()` rather than let the test fail with a confusing
`status: None` or silently weaken an assertion to pass anyway (CV2b/c
both forbid that).
"""
import socket
from typing import Callable, Optional, Tuple


def loopback_available(connect: Callable = socket.create_connection, timeout_s: float = 1.0) -> Tuple[bool, Optional[str]]:
    """Binds a real server socket on 127.0.0.1 and attempts a real
    connection to it via `connect` (injectable so the FALSE path can
    be proven without an actually-blocked environment -- see
    test_loopback_preflight.py). Returns (True, None) if it works, or
    (False, "ENV_LOOPBACK_BLOCKED: ...") if it doesn't."""
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        srv.bind(("127.0.0.1", 0))
        srv.listen(1)
        port = srv.getsockname()[1]
    except OSError as e:
        srv.close()
        return False, f"ENV_LOOPBACK_BLOCKED: bind/listen failed: {e}"
    try:
        cli = connect(("127.0.0.1", port), timeout=timeout_s)
        cli.close()
        return True, None
    except OSError as e:
        return False, f"ENV_LOOPBACK_BLOCKED: connect failed: {e}"
    finally:
        srv.close()
