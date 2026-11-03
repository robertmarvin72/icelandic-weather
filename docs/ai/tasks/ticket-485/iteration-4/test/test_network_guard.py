"""#485 iteration-4 correction v7 (R1) -- retained negative guard tests.
Proves the network guard refuses a non-loopback hostname/address BEFORE
the real resolver/connect call, with the real call count provably zero
(via the guard's own counters, not merely "no exception" -- an exception
by itself doesn't prove the real function was never invoked), that a
literal loopback target is still allowed through, and that a genuinely
separate OS child process must install the guard itself (inheritance is
never assumed).
"""
import os
import socket
import subprocess
import sys

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _THIS_DIR)

import _network_guard as guard  # noqa: E402

CHILD_PROBE_PATH = os.path.join(_THIS_DIR, "_guard_child_probe.py")


def test_non_loopback_hostname_blocked_before_real_resolver():
    print("[guard 1] a non-loopback hostname is refused BEFORE the real resolver is ever called ... ", end="")
    guard.install()
    guard.reset_counters()
    real_getaddrinfo_calls = []
    orig = guard._real_getaddrinfo

    def _spy(*a, **kw):
        real_getaddrinfo_calls.append(a)
        return orig(*a, **kw)

    guard._real_getaddrinfo = _spy
    try:
        try:
            socket.getaddrinfo("customer-api.open-meteo.com", 443, type=socket.SOCK_STREAM)
            print("RED FAIL -- a non-loopback getaddrinfo() call was NOT blocked")
            sys.exit(1)
        except guard.NetworkGuardViolation:
            pass
        assert len(real_getaddrinfo_calls) == 0, (
            f"RED: the real getaddrinfo() was invoked {len(real_getaddrinfo_calls)} time(s) "
            f"despite the guard -- this is exactly the breach this guard exists to prevent")
        assert guard.blocked_count == 1 and "customer-api.open-meteo.com" in guard.blocked_hosts
        print(f"PASS (NetworkGuardViolation raised, real getaddrinfo() call count: "
              f"{len(real_getaddrinfo_calls)}, guard.blocked_count={guard.blocked_count})")
    finally:
        guard._real_getaddrinfo = orig


def test_non_loopback_literal_ip_connect_blocked():
    print("[guard 2] connect() to a non-loopback LITERAL IP address is refused ... ", end="")
    guard.install()
    guard.reset_counters()
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        try:
            s.connect(("93.184.216.34", 80))
            print("RED FAIL -- a non-loopback connect() was NOT blocked")
            sys.exit(1)
        except guard.NetworkGuardViolation:
            pass
        assert guard.blocked_count >= 1
        print(f"PASS (NetworkGuardViolation raised, guard.blocked_count={guard.blocked_count})")
    finally:
        s.close()


def test_loopback_literal_still_allowed():
    print("[guard 3] a literal loopback target (127.0.0.1) is still allowed through ... ", end="")
    guard.install()
    guard.reset_counters()
    addrinfo = socket.getaddrinfo("127.0.0.1", 0, type=socket.SOCK_STREAM)
    assert addrinfo, "RED: loopback getaddrinfo() returned nothing"
    assert guard.allowed_count == 1 and guard.blocked_count == 0
    print(f"PASS (loopback getaddrinfo() succeeded normally, guard.allowed_count={guard.allowed_count})")


def test_separate_child_process_must_install_guard_itself():
    print("[guard 4] a genuinely separate OS child process installs the guard independently "
          "(never assumed to inherit a parent's monkeypatch) ... ", end="")
    popen_kwargs = dict(stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if sys.platform == "win32":
        popen_kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW
    proc = subprocess.run([sys.executable, "-B", CHILD_PROBE_PATH], timeout=10, **popen_kwargs)
    out = proc.stdout.strip()
    assert out == "BLOCKED", (
        f"RED: the separate child process did not block its own non-loopback connect() "
        f"(stdout={out!r}, stderr={proc.stderr!r})")
    print(f"PASS (separate child process PID-distinct from this test, installed its own guard, "
          f"and blocked a real external IP connect itself: {out!r})")


def main():
    test_non_loopback_hostname_blocked_before_real_resolver()
    test_non_loopback_literal_ip_connect_blocked()
    test_loopback_literal_still_allowed()
    test_separate_child_process_must_install_guard_itself()
    print("\nALL NETWORK-GUARD TESTS PASS (exit 0).")


if __name__ == "__main__":
    main()
