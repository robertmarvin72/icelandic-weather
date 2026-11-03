"""#485 iteration-4 correction v7 (R1) -- TEST-ONLY helper, spawned as a
genuinely separate OS process (never sharing memory with its parent) to
prove the network guard must be installed INDEPENDENTLY in every child
-- never assumed to be "inherited" from a parent's monkeypatch, which
cannot propagate across a fresh `subprocess.Popen` interpreter anyway.

This script installs the guard itself (as every real test entry point
must), then attempts a non-loopback connect(). Prints exactly one line:
"BLOCKED" if the guard's own installation in THIS process caught it, or
"NOT_BLOCKED" (should never happen) if it somehow got through.
"""
import os
import socket
import sys

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _THIS_DIR)
import _network_guard as guard  # noqa: E402

guard.install()

try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(1)
    s.connect(("93.184.216.34", 80))  # a real external IP, literal -- never reached if the guard works
    print("NOT_BLOCKED")
except guard.NetworkGuardViolation:
    print("BLOCKED")
except Exception as e:
    print(f"OTHER_EXCEPTION:{type(e).__name__}")
