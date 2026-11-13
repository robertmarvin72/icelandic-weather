#!/usr/bin/env python3
"""
#493 endpoint-acquisition -- EA2. Task-local driver wrapping phase2's
own retained bounded_fetch.py (imported read-only, unmodified, SHA
checked against rp1_baseline.json before import) with the enforcement
EA2 requires that bounded_fetch.py itself does not provide:
  (a) a wall-clock cap per call, SEPARATE from bounded_fetch's own
      socket timeout -- run in a thread, joined with a hard timeout;
      a call that is still running when the deadline passes is marked
      timeout=true and abandoned (the driver stops WAITING for it,
      which is what "stop a call at the wall-clock limit" means here
      -- the underlying thread is daemonic and cannot block exit).
  (b) remaining_total_budget_bytes computed from actual ledger bytes
      received so far, never allowing a call's own cap to exceed it.
  (c) aggregate per-call guards: a 4th call, a repeated request_id, a
      call outside the acquisition window, or any call after a STOP
      is refused BEFORE connecting and ledgered as "refused".
  (d) a pre-connect failure (e.g. InvalidURL) counts toward the call
      count and is itself a STOP.
  (e) allow_insecure_for_local_test is hardcoded False on the live
      path; no parameter or environment variable can change it.
  (f) persistent budget state: refuses to start a LIVE run if a ledger
      file for this task already exists, so a crash/restart cannot
      exceed the call budget.
Offline except for the actual call itself, which this module makes
only when explicitly driven to do so by samples/live_driver.py (the
real run) or samples/run_ea2_tests.py (against 127.0.0.1 only).
"""
import hashlib
import json
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent
PHASE2_SAMPLES = REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2/samples"

EXPECTED_BOUNDED_FETCH_SHA = "c2610ebfbfdc56fd11776df0511c68246a7a958486fda96fd2e8858cab259be6"


def _import_bounded_fetch():
    live_bytes = (PHASE2_SAMPLES / "bounded_fetch.py").read_bytes()
    live_sha = hashlib.sha256(live_bytes).hexdigest()
    assert live_sha == EXPECTED_BOUNDED_FETCH_SHA, f"bounded_fetch.py has drifted from its recorded SHA ({live_sha} != {EXPECTED_BOUNDED_FETCH_SHA}) -- refusing to import an unverified helper"
    sys.path.insert(0, str(PHASE2_SAMPLES))
    import bounded_fetch  # noqa: E402
    return bounded_fetch


bounded_fetch_module = _import_bounded_fetch()


def _utc_now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


class RefusedBeforeConnect(Exception):
    def __init__(self, check_id, reason):
        self.check_id = check_id
        self.reason = reason
        super().__init__(f"{check_id}: {reason}")


class Driver:
    """One instance per acquisition window. `ledger_path` is the
    single source of truth for aggregate state (EA2f): if it already
    exists when the driver starts in LIVE mode, the driver refuses to
    run at all."""

    def __init__(self, ledger_path, allowlist, max_calls=3, max_total_bytes=4718592,
                 wall_clock_cap_s=20, socket_timeout_s=20, window_minutes=30,
                 live_mode=True):
        self.ledger_path = Path(ledger_path)
        self.allowlist = set(allowlist)
        self.max_calls = max_calls
        self.max_total_bytes = max_total_bytes
        self.wall_clock_cap_s = wall_clock_cap_s
        self.socket_timeout_s = socket_timeout_s
        self.window_minutes = window_minutes
        self.live_mode = live_mode
        self._stopped = False
        self._first_call_monotonic = None
        self._seen_request_ids = set()
        self._bytes_received_total = 0
        self._calls_made = 0

        if self.live_mode and self.ledger_path.exists():
            raise RefusedBeforeConnect("DRIVER_REFUSES_RESTART_LEDGER_EXISTS", f"ledger {self.ledger_path} already exists -- refusing to start a live run that could exceed the call budget on crash/restart")

    def _append_ledger(self, entry):
        to_write = {k: v for k, v in entry.items() if k != "_body_bytes"}
        with open(self.ledger_path, "a", encoding="utf-8", newline="\n") as f:
            f.write(json.dumps(to_write, ensure_ascii=False) + "\n")

    def _refuse(self, request_id, check_id, reason):
        entry = {
            "request_id": request_id, "refused": True, "check_id": check_id, "reason": reason,
            "started_at_utc": _utc_now_iso(), "ended_at_utc": _utc_now_iso(),
            "calls_made_before_this": self._calls_made, "bytes_received_before_this": self._bytes_received_total,
        }
        self._append_ledger(entry)
        raise RefusedBeforeConnect(check_id, reason)

    def attempt(self, request_id, url, per_body_cap_bytes, host_override_for_test=None):
        """Returns the ledger entry dict (also appended to the ledger
        file). Raises RefusedBeforeConnect for an aggregate-guard
        violation (EA2c) -- no connection attempted at all."""
        if self._stopped:
            self._refuse(request_id, "CALL_AFTER_STOP", "a prior call already set driver state to STOP")
        if self._calls_made >= self.max_calls:
            self._refuse(request_id, "FOURTH_CALL_REFUSED", f"already made {self._calls_made} calls, max is {self.max_calls}")
        if request_id in self._seen_request_ids:
            self._refuse(request_id, "DUPLICATE_REQUEST_ID_REFUSED", f"request_id {request_id!r} already used this run")
        now_mono = time.monotonic()
        if self._first_call_monotonic is not None:
            elapsed_min = (now_mono - self._first_call_monotonic) / 60.0
            if elapsed_min > self.window_minutes:
                self._refuse(request_id, "OUTSIDE_ACQUISITION_WINDOW", f"{elapsed_min:.2f} min since first call exceeds {self.window_minutes} min window")
        import urllib.parse
        host = host_override_for_test or urllib.parse.urlsplit(url).hostname
        if host not in self.allowlist:
            self._refuse(request_id, "HOST_NOT_ALLOWLISTED", f"host {host!r} not in {sorted(self.allowlist)}")

        remaining_budget = self.max_total_bytes - self._bytes_received_total
        if remaining_budget <= 0:
            self._refuse(request_id, "TOTAL_BUDGET_EXHAUSTED", f"remaining_total_budget_bytes={remaining_budget} <= 0")
        effective_cap = min(per_body_cap_bytes, remaining_budget)

        self._seen_request_ids.add(request_id)
        if self._first_call_monotonic is None:
            self._first_call_monotonic = now_mono
        self._calls_made += 1

        result_box = {}

        def _run():
            try:
                result_box["entry"] = bounded_fetch_module.bounded_fetch(
                    "GET", url, timeout_s=self.socket_timeout_s,
                    per_body_cap_bytes=per_body_cap_bytes,
                    remaining_total_budget_bytes=remaining_budget,
                    allowlist=self.allowlist,
                    allow_insecure_for_local_test=False,  # EA2(e): hardcoded, not a parameter of attempt()
                )
            except Exception as e:  # pre-connect failure, e.g. InvalidURL -- EA2(d)
                result_box["preconnect_error"] = e

        t0_wall = time.monotonic()
        thread = threading.Thread(target=_run, daemon=True)
        thread.start()
        thread.join(timeout=self.wall_clock_cap_s)
        wall_elapsed = time.monotonic() - t0_wall

        if thread.is_alive():
            # EA2(a): the driver stops WAITING at the wall-clock deadline,
            # even though status/error on the still-running call are
            # unknown -- treated as timeout=true regardless.
            entry = {
                "request_id": request_id, "started_at_utc": _utc_now_iso(), "ended_at_utc": _utc_now_iso(),
                "method": "GET", "url": url, "status": None, "bytes_received": 0, "truncated": False,
                "cap_applied_bytes": effective_cap, "sha256_of_received_bytes": None, "is_redirect": False,
                "redirect_location": None, "error": None, "timeout": True,
                "wall_clock_elapsed_s": wall_elapsed, "wall_clock_cap_exceeded": True,
                "budget_before_bytes": self._bytes_received_total, "remaining_total_budget_bytes_sent": remaining_budget,
            }
            self._append_ledger(entry)
            self._stopped = True
            return entry, b""

        if "preconnect_error" in result_box:
            e = result_box["preconnect_error"]
            entry = {
                "request_id": request_id, "started_at_utc": _utc_now_iso(), "ended_at_utc": _utc_now_iso(),
                "method": "GET", "url": url, "status": None, "bytes_received": 0, "truncated": False,
                "cap_applied_bytes": effective_cap, "sha256_of_received_bytes": None, "is_redirect": False,
                "redirect_location": None, "error": f"{type(e).__name__}: {e}", "timeout": False,
                "wall_clock_elapsed_s": wall_elapsed, "wall_clock_cap_exceeded": False,
                "budget_before_bytes": self._bytes_received_total, "remaining_total_budget_bytes_sent": remaining_budget,
                "preconnect_failure": True,
            }
            self._append_ledger(entry)
            self._stopped = True  # EA2(d): STOP
            return entry, b""

        raw = result_box["entry"]
        entry = dict(raw)
        entry["request_id"] = request_id
        entry["wall_clock_elapsed_s"] = wall_elapsed
        entry["wall_clock_cap_exceeded"] = wall_elapsed > self.wall_clock_cap_s
        entry["budget_before_bytes"] = self._bytes_received_total
        entry["remaining_total_budget_bytes_sent"] = remaining_budget
        self._bytes_received_total += entry.get("bytes_received", 0) or 0
        entry["budget_after_bytes"] = self._bytes_received_total

        body_bytes = raw.get("_body_bytes", b"")
        stop_reasons = []
        if entry.get("is_redirect"):
            stop_reasons.append("REDIRECT")
        if entry.get("status") != 200:
            stop_reasons.append("NON_200_STATUS")
        if entry.get("error"):
            stop_reasons.append("TRANSPORT_ERROR")
        if entry.get("timeout"):
            stop_reasons.append("TIMEOUT")
        if entry.get("truncated"):
            stop_reasons.append("TRUNCATED")
        if entry.get("wall_clock_cap_exceeded"):
            stop_reasons.append("WALL_CLOCK_CAP_EXCEEDED")
        entry["stop_reasons"] = stop_reasons
        if stop_reasons:
            self._stopped = True

        self._append_ledger(entry)
        return entry, body_bytes

    def mark_stop(self, reason):
        self._stopped = True

    def attempt_insecure_test_only(self, request_id, url, per_body_cap_bytes, host_override_for_test=None, socket_timeout_s_override=None):
        """EA2(e): the LIVE path (attempt() above) hardcodes
        allow_insecure_for_local_test=False with no parameter able to
        change it. THIS method is the only place in this module that
        ever passes allow_insecure_for_local_test=True -- it exists
        solely for samples/run_ea2_tests.py's own localhost self-tests
        (plain HTTP to 127.0.0.1) and must never be called from
        samples/live_driver.py. Otherwise identical to attempt()."""
        if self._stopped:
            self._refuse(request_id, "CALL_AFTER_STOP", "a prior call already set driver state to STOP")
        if self._calls_made >= self.max_calls:
            self._refuse(request_id, "FOURTH_CALL_REFUSED", f"already made {self._calls_made} calls, max is {self.max_calls}")
        if request_id in self._seen_request_ids:
            self._refuse(request_id, "DUPLICATE_REQUEST_ID_REFUSED", f"request_id {request_id!r} already used this run")
        now_mono = time.monotonic()
        if self._first_call_monotonic is not None:
            elapsed_min = (now_mono - self._first_call_monotonic) / 60.0
            if elapsed_min > self.window_minutes:
                self._refuse(request_id, "OUTSIDE_ACQUISITION_WINDOW", f"{elapsed_min:.2f} min since first call exceeds {self.window_minutes} min window")
        import urllib.parse
        host = host_override_for_test or urllib.parse.urlsplit(url).hostname
        if host not in self.allowlist:
            self._refuse(request_id, "HOST_NOT_ALLOWLISTED", f"host {host!r} not in {sorted(self.allowlist)}")

        remaining_budget = self.max_total_bytes - self._bytes_received_total
        if remaining_budget <= 0:
            self._refuse(request_id, "TOTAL_BUDGET_EXHAUSTED", f"remaining_total_budget_bytes={remaining_budget} <= 0")
        effective_cap = min(per_body_cap_bytes, remaining_budget)
        socket_timeout = socket_timeout_s_override if socket_timeout_s_override is not None else self.socket_timeout_s

        self._seen_request_ids.add(request_id)
        if self._first_call_monotonic is None:
            self._first_call_monotonic = now_mono
        self._calls_made += 1

        result_box = {}

        def _run():
            try:
                result_box["entry"] = bounded_fetch_module.bounded_fetch(
                    "GET", url, timeout_s=socket_timeout,
                    per_body_cap_bytes=per_body_cap_bytes,
                    remaining_total_budget_bytes=remaining_budget,
                    allowlist=self.allowlist,
                    allow_insecure_for_local_test=True,
                )
            except Exception as e:
                result_box["preconnect_error"] = e

        t0_wall = time.monotonic()
        thread = threading.Thread(target=_run, daemon=True)
        thread.start()
        thread.join(timeout=self.wall_clock_cap_s)
        wall_elapsed = time.monotonic() - t0_wall

        if thread.is_alive():
            entry = {
                "request_id": request_id, "started_at_utc": _utc_now_iso(), "ended_at_utc": _utc_now_iso(),
                "method": "GET", "url": url, "status": None, "bytes_received": 0, "truncated": False,
                "cap_applied_bytes": effective_cap, "sha256_of_received_bytes": None, "is_redirect": False,
                "redirect_location": None, "error": None, "timeout": True,
                "wall_clock_elapsed_s": wall_elapsed, "wall_clock_cap_exceeded": True,
                "budget_before_bytes": self._bytes_received_total, "remaining_total_budget_bytes_sent": remaining_budget,
            }
            self._append_ledger(entry)
            self._stopped = True
            return entry, b""

        if "preconnect_error" in result_box:
            e = result_box["preconnect_error"]
            entry = {
                "request_id": request_id, "started_at_utc": _utc_now_iso(), "ended_at_utc": _utc_now_iso(),
                "method": "GET", "url": url, "status": None, "bytes_received": 0, "truncated": False,
                "cap_applied_bytes": effective_cap, "sha256_of_received_bytes": None, "is_redirect": False,
                "redirect_location": None, "error": f"{type(e).__name__}: {e}", "timeout": False,
                "wall_clock_elapsed_s": wall_elapsed, "wall_clock_cap_exceeded": False,
                "budget_before_bytes": self._bytes_received_total, "remaining_total_budget_bytes_sent": remaining_budget,
                "preconnect_failure": True,
            }
            self._append_ledger(entry)
            self._stopped = True
            return entry, b""

        raw = result_box["entry"]
        entry = dict(raw)
        entry["request_id"] = request_id
        entry["wall_clock_elapsed_s"] = wall_elapsed
        entry["wall_clock_cap_exceeded"] = wall_elapsed > self.wall_clock_cap_s
        entry["budget_before_bytes"] = self._bytes_received_total
        entry["remaining_total_budget_bytes_sent"] = remaining_budget
        self._bytes_received_total += entry.get("bytes_received", 0) or 0
        entry["budget_after_bytes"] = self._bytes_received_total

        body_bytes = raw.get("_body_bytes", b"")
        stop_reasons = []
        if entry.get("is_redirect"):
            stop_reasons.append("REDIRECT")
        if entry.get("status") != 200:
            stop_reasons.append("NON_200_STATUS")
        if entry.get("error"):
            stop_reasons.append("TRANSPORT_ERROR")
        if entry.get("timeout"):
            stop_reasons.append("TIMEOUT")
        if entry.get("truncated"):
            stop_reasons.append("TRUNCATED")
        if entry.get("wall_clock_cap_exceeded"):
            stop_reasons.append("WALL_CLOCK_CAP_EXCEEDED")
        entry["stop_reasons"] = stop_reasons
        if stop_reasons:
            self._stopped = True

        self._append_ledger(entry)
        return entry, body_bytes
