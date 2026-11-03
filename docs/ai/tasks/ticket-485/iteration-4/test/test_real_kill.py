"""#485 iteration-4 correction v7 (R5) -- REPLACES the old test-local
Popen/kill reimplementation. v6's `test_real_kill.py` built its own
`subprocess.Popen`/`proc.kill()` sequence and asserted on that directly
-- Jonesy's Round-2 finding: this never drove the REAL production
`pipeline.run_request()`/`_dispatch_child_and_collect()` at all, so it
proved nothing about whether the real parent's own `TimeoutExpired`
branch actually works.

Both tests below use the SAME task-local copied-tree technique as
`test_e2e_loopback.py`: only `provider_target.py` is edited in the copy,
and the copy's own, completely unmodified `pipeline.run_request()` runs
for real, against a real local loopback HTTP server that is deliberately
made to stall. No test-local kill routine of any kind.

R1: the copy's runner process installs `_network_guard` before anything
else (see `e2e_copy_helper.py`), and every server here binds to
127.0.0.1 only.
"""
import json
import os
import shutil
import socket
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_CANDIDATE_DIR = os.path.dirname(_THIS_DIR)
sys.path.insert(0, _THIS_DIR)
sys.path.insert(0, _CANDIDATE_DIR)

import _network_guard as _guard  # noqa: E402
_guard.install()

import e2e_copy_helper as helper  # noqa: E402
import ledger  # noqa: E402 -- read-only, to inspect the COPY's ledger file

FAKE_KEY = "ITER4-REAL-KILL-FAKE-KEY-ccc333"

GOOD_PARAMS = [
    ["latitude", [64.0]], ["longitude", [-21.0]],
    ["hourly", ["temperature_2m", "wind_speed_10m", "wind_gusts_10m", "precipitation", "snowfall", "weather_code"]],
    ["wind_speed_unit", "ms"], ["temperature_unit", "celsius"], ["precipitation_unit", "mm"],
    ["timezone", "UTC"], ["forecast_days", 3],
]


class _StallHandler(BaseHTTPRequestHandler):
    """Accepts the connection, records receipt (a non-secret marker --
    just the fact that a request line arrived, never any request
    content), then NEVER responds. When the client (the real
    `child_worker.py` process) is later killed by its own real parent,
    the OS tears down this end of the TCP connection too -- observed
    here as `recv()` returning EOF (b'') -- genuine, OS-level evidence
    that the child process is actually gone, not merely abandoned."""

    def log_message(self, *a):
        pass

    def do_GET(self):
        server = self.server
        server.received = True
        sentinel = getattr(server, "sentinel_path", None)
        if sentinel:
            with open(sentinel, "w", encoding="utf-8") as f:
                f.write("received")
        try:
            self.connection.settimeout(35)
            data = self.connection.recv(1)
            server.peer_closed = (data == b"")
        except Exception:
            server.peer_closed = True  # reset/timeout -- also treated as "gone"


def _start_stall_server(sentinel_path=None):
    srv = ThreadingHTTPServer(("127.0.0.1", 0), _StallHandler)
    srv.received = False
    srv.peer_closed = False
    srv.sentinel_path = sentinel_path
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def test_production_parent_kills_a_genuinely_stalled_child_for_real():
    print("[real-kill 1] a child genuinely stalled past the production TOTAL deadline is killed by the "
          "REAL, unmodified parent -- production TimeoutExpired branch, not a test-local kill ... ")
    srv = _start_stall_server()
    try:
        copy_dir, runner, lp = helper.make_copy("http", "127.0.0.1", srv.server_port, "/stall")
        t0 = time.monotonic()
        result, stderr = helper.run_real_request(copy_dir, runner, GOOD_PARAMS, FAKE_KEY, timeout_s=40)
        elapsed = time.monotonic() - t0
        print(f"    result: {result}, elapsed={elapsed:.1f}s")

        assert result["ok"] is True, f"RED: {result}"
        assert result["outcome"]["category"] == "PARENT_ENFORCED_TOTAL_DEADLINE", (
            f"RED: expected the production parent's own deadline-kill category, got {result}")
        # limits.TOTAL_DEADLINE_S is 20s; the bounded post-kill join adds
        # at most ~5s more (disclosed cleanup latency) -- comfortably
        # under 30s total, well over a merely-cooperative sub-second exit.
        assert 18 <= elapsed <= 30, f"RED: elapsed {elapsed:.1f}s is not the expected ~20-25s deadline-bound window"

        assert srv.received, "RED: the server never even received the request -- test setup bug"
        assert srv.peer_closed, (
            "RED: the server's TCP connection to the child was never torn down -- the child process "
            "may still be alive/orphaned, not actually killed by the production parent")

        led = ledger.load_ledger(lp)
        assert led["terminal"] is True and led["terminal_reason_category"] == "HARD_DEADLINE_KILL", led

        # Restart refusal: a second real process invocation on the same
        # ledger must be refused, proving the terminal state persists
        # across a genuinely separate process (R1's own requirement,
        # re-confirmed here under this specific failure mode).
        result2, _ = helper.run_real_request(copy_dir, runner, GOOD_PARAMS, FAKE_KEY, timeout_s=10)
        assert result2["ok"] is False and result2["exception_type"] == "LedgerTerminal", result2
        print(f"    PASS: real parent-enforced kill, elapsed {elapsed:.1f}s (deadline-bounded incl. cleanup), "
              f"server observed the connection close (child genuinely gone), ledger terminal="
              f"HARD_DEADLINE_KILL, restart correctly refused")
    finally:
        srv.shutdown()


def test_parent_killed_after_child_receipt_leaves_incomplete_row_and_blocks_restart():
    print("[real-kill 2] the PARENT itself (the real run_request() process) is killed right after the "
          "child acknowledges request receipt; recovery refuses the incomplete row (R2) ... ")
    import tempfile
    sentinel_dir = tempfile.mkdtemp(prefix="iter4-sentinel-")
    sentinel_path = os.path.join(sentinel_dir, "received.marker")
    srv = _start_stall_server(sentinel_path=sentinel_path)
    try:
        copy_dir, runner, lp = helper.make_copy("http", "127.0.0.1", srv.server_port, "/stall")
        args = [sys.executable, "-B", runner, json.dumps(GOOD_PARAMS), FAKE_KEY]
        popen_kwargs = dict(cwd=copy_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if sys.platform == "win32":
            popen_kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW
        parent_proc = subprocess.Popen(args, **popen_kwargs)

        deadline = time.monotonic() + 15
        while time.monotonic() < deadline:
            if os.path.exists(sentinel_path):
                break
            assert parent_proc.poll() is None, "test setup bug: the parent process exited before the child's receipt"
            time.sleep(0.02)
        else:
            raise AssertionError("RED: the child never signalled receipt within 15s")

        # The real, unmodified child_worker.py has now genuinely sent its
        # request and the real local server has genuinely received it --
        # a true "acknowledged receipt" instant, not a guess. Kill the
        # PARENT (the run_request() process) right here, for real.
        parent_proc.kill()
        parent_proc.wait(timeout=5)
        assert parent_proc.returncode != 0, (
            f"RED: parent exited cooperatively (code {parent_proc.returncode}), not killed")

        led = ledger.load_ledger(lp)
        assert len(led["attempts"]) == 1, f"RED: expected exactly 1 attempt, got {led['attempts']}"
        assert led["attempts"][0]["status"] == "reserved", (
            f"RED: expected the attempt to be stuck 'reserved' (incomplete) after the parent was "
            f"killed mid-flight, got {led['attempts'][0]}")
        assert led["terminal"] is False, "test setup bug: ledger already terminal, not testing the incomplete path"

        # A fresh, SEPARATE real process attempting a new request on the
        # SAME ledger must be refused -- R2's "incomplete blocks future
        # reservations" rule, proven against a genuine real-process crash,
        # not a hand-simulated ledger state.
        result2, _ = helper.run_real_request(copy_dir, runner, GOOD_PARAMS, FAKE_KEY, timeout_s=10)
        assert result2["ok"] is False and result2["exception_type"] == "LedgerIncomplete", result2
        print(f"    PASS: parent genuinely killed right after the child's real request receipt; "
              f"ledger left with 1 'reserved' (incomplete) attempt; a second real process is "
              f"refused with LedgerIncomplete, not permitted to proceed")
    finally:
        srv.shutdown()
        shutil.rmtree(sentinel_dir, ignore_errors=True)


def main():
    try:
        test_production_parent_kills_a_genuinely_stalled_child_for_real()
        test_parent_killed_after_child_receipt_leaves_incomplete_row_and_blocks_restart()
        print("\nALL REAL-KILL TESTS PASS (exit 0).")
    finally:
        helper.cleanup_all()


if __name__ == "__main__":
    main()
