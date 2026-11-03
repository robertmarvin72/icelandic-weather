"""#485 iteration-4 correction v6 (R1, R4) -- ledger unit/regression tests.
No network, no real secrets.
"""
import json
import os
import shutil
import sys
import time

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_PARENT_DIR = os.path.dirname(_THIS_DIR)
sys.path.insert(0, _PARENT_DIR)
import ledger  # noqa: E402

TMP_ROOT = os.path.join(_PARENT_DIR, "tmp", "test_ledger")


def fresh_dir(name):
    d = os.path.join(TMP_ROOT, name)
    if os.path.exists(d):
        shutil.rmtree(d, ignore_errors=True)
    os.makedirs(d, exist_ok=True)
    return os.path.join(d, "ledger.json")


def test_terminal_persists_and_blocks_future_reserve():
    print("[ledger 1] mark_terminal() durably blocks ALL future reserve_attempt() calls, "
          "across a fresh load (simulated restart) ... ", end="")
    lp = fresh_dir("terminal")
    aid = ledger.reserve_attempt(lp)
    ledger.mark_terminal(lp, "SUSPECTED_SECRET_DISCLOSURE")
    try:
        ledger.reserve_attempt(lp)
        print("RED FAIL -- a second reservation was wrongly permitted after mark_terminal()")
        sys.exit(1)
    except ledger.LedgerTerminal:
        pass
    # "restart": brand-new load, as a new process invocation would do
    led = ledger.load_ledger(lp)
    assert led["terminal"] is True
    try:
        ledger.reserve_attempt(lp)
        print("RED FAIL -- terminal state did not survive a fresh load")
        sys.exit(1)
    except ledger.LedgerTerminal:
        pass
    print(f"PASS (attempt {aid[:8]}... reserved, then terminal set, then blocked twice incl. after reload)")


def test_wall_clock_window_not_monotonic_garbage():
    print("[ledger 2] run-window start is wall-clock UTC; malformed/future values are rejected, not guessed ... ")
    lp = fresh_dir("wallclock")
    aid = ledger.reserve_attempt(lp)
    # Complete this attempt (R2: an incomplete row would otherwise block
    # the next reserve_attempt() calls below via LedgerIncomplete, before
    # ever reaching the window check this test is actually exercising).
    ledger.record_outcome(lp, aid, {"category": "OK", "status": 200, "bytes_decoded": 0, "truncated": False})
    led = json.load(open(lp, encoding="utf-8"))
    assert "run_window_start_monotonic" not in led, "RED: a monotonic value is still being persisted"
    start = led["run_window_start_utc"]
    import datetime
    parsed = datetime.datetime.strptime(start, "%Y-%m-%dT%H:%M:%S.%fZ")
    assert abs((datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None) - parsed).total_seconds()) < 5
    print("    PASS: run_window_start_utc is a real wall-clock timestamp, no monotonic field persisted")

    # malformed window start -> ambiguous, refused
    led["run_window_start_utc"] = "not-a-timestamp"
    json.dump(led, open(lp, "w", encoding="utf-8"))
    try:
        ledger.reserve_attempt(lp)
        print("    RED FAIL -- malformed run_window_start_utc was not rejected")
        sys.exit(1)
    except ledger.LedgerAmbiguous:
        print("    PASS: malformed run_window_start_utc correctly refused (LedgerAmbiguous)")

    # future window start -> ambiguous, refused
    import datetime as dt
    future = (dt.datetime.now(dt.timezone.utc).replace(tzinfo=None) + dt.timedelta(hours=1)).strftime(
        "%Y-%m-%dT%H:%M:%S.%fZ")
    led["run_window_start_utc"] = future
    json.dump(led, open(lp, "w", encoding="utf-8"))
    try:
        ledger.reserve_attempt(lp)
        print("    RED FAIL -- a FUTURE run_window_start_utc was not rejected")
        sys.exit(1)
    except ledger.LedgerAmbiguous:
        print("    PASS: future run_window_start_utc correctly refused (LedgerAmbiguous)")


def test_unreadable_tmp_never_deleted():
    print("[ledger 3] an unreadable (OSError) durable .tmp is NEVER deleted -- fails closed instead ... ", end="")
    lp = fresh_dir("unreadable_tmp")
    aid = ledger.reserve_attempt(lp)
    led = ledger.load_ledger(lp)
    # Simulate a second, in-flight reservation's tmp that exists but cannot
    # be READ (permission-denied-shaped failure) -- on this platform we
    # simulate by pointing the tmp at a directory (not a file), which
    # reliably raises OSError (IsADirectoryError) on open(), the same
    # class of failure as a real permission error.
    tmp_path = lp + ".tmp"
    if os.path.exists(tmp_path):
        os.remove(tmp_path)
    os.makedirs(tmp_path)
    try:
        ledger.load_ledger(lp)
        print("RED FAIL -- an unreadable .tmp was silently accepted/discarded instead of refusing")
        sys.exit(1)
    except ledger.LedgerAmbiguous:
        pass
    assert os.path.isdir(tmp_path), "RED: the unreadable .tmp was DELETED -- it must be preserved untouched"
    print(f"PASS (unreadable .tmp preserved untouched, LedgerAmbiguous correctly raised; attempt {aid[:8]}... "
          f"from before this simulated fault is still intact)")
    os.rmdir(tmp_path)


def test_corrupt_tmp_safely_discarded():
    print("[ledger 4] a CONFIRMED-corrupt (truncated JSON) .tmp -- which could never have returned an "
          "attempt ID to any caller -- is safely discarded on recovery ... ", end="")
    lp = fresh_dir("corrupt_tmp")
    tmp_path = lp + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        f.write('{"attempts": [')  # deliberately truncated, invalid JSON
    led = ledger.load_ledger(lp)
    assert led["attempts"] == [], "RED: corrupt tmp content leaked into the recovered ledger"
    assert not os.path.exists(tmp_path), "RED: the confirmed-corrupt tmp was not cleaned up"
    print("PASS (corrupt tmp discarded, fresh empty ledger returned, no crash)")


def test_tmp_written_but_not_replaced_is_recovered():
    print("[ledger 5] a VALID, fully-written .tmp that never got replace()'d is completed on recovery "
          "(the crash-recovery case this design exists for) ... ", end="")
    lp = fresh_dir("tmp_recover")
    aid1 = ledger.reserve_attempt(lp)
    led = json.load(open(lp, encoding="utf-8"))
    led["attempts"].append({"id": "simulated-crashed-reservation", "status": "reserved",
                             "reserved_utc": ledger.now_utc_iso(), "target_origin": None,
                             "reserved_decoded_cap": 2097152, "outcome": None})
    tmp_path = lp + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(led, f)
        f.flush()
        os.fsync(f.fileno())
    recovered = ledger.load_ledger(lp)
    assert len(recovered["attempts"]) == 2, f"RED: expected 2 attempts recovered, got {len(recovered['attempts'])}"
    assert not os.path.exists(tmp_path)
    print(f"PASS (2/2 attempts recovered: {aid1[:8]}... and the simulated crashed one)")


def test_byte_charging_unknown_charges_full_cap():
    print("[ledger 6] a non-OK-category attempt charges the FULL reserved cap, not the (possibly "
          "nonzero but irrelevant) bytes_decoded value -- category-based, correction v7 R4 ... ", end="")
    lp = fresh_dir("byte_charge")
    orig_per_attempt = ledger.CLASS_CAPS["provider"]["bytes_per_attempt"]
    ledger.CLASS_CAPS["provider"]["bytes_per_attempt"] = 12345
    try:
        aid = ledger.reserve_attempt(lp)
        # Deliberately includes a nonzero bytes_decoded (R4: honestly
        # observed partial bytes on a cooperative failure) -- charging
        # must STILL use the full reserved cap, never this smaller number,
        # because the category is not "OK".
        ledger.record_outcome(lp, aid, {"category": "TRANSPORT_FAILURE", "status": None,
                                         "bytes_decoded": 1_900_000, "truncated": False})
        led = ledger.load_ledger(lp)
        assert led["bytes_total"] == 12345, f"RED: expected full cap 12345 charged, got {led['bytes_total']}"
        assert led["attempts"][0]["bytes_observed"] == 1_900_000, (
            "RED: the honestly-observed partial byte count was not recorded")
        print(f"PASS (non-OK attempt charged the full 12345-byte reserved cap despite 1,900,000 "
              f"observed bytes; bytes_observed recorded honestly)")
    finally:
        ledger.CLASS_CAPS["provider"]["bytes_per_attempt"] = orig_per_attempt


def test_known_bytes_reconcile_to_real_count():
    print("[ledger 7] a clean 'OK'-category attempt charges the real, smaller byte count (reconciliation) ... ",
          end="")
    lp = fresh_dir("byte_reconcile")
    aid = ledger.reserve_attempt(lp)
    ledger.record_outcome(lp, aid, {"category": "OK", "status": 200, "bytes_decoded": 42, "truncated": False})
    led = ledger.load_ledger(lp)
    assert led["bytes_total"] == 42, led["bytes_total"]
    print("PASS (verified 42 bytes charged, not the full reserved cap)")


def test_reserved_decoded_cap_is_min_of_per_attempt_and_remaining_global():
    print("[ledger 7b] reserved_decoded_cap is MIN(per-attempt cap, remaining global budget) -- "
          "correction v7 R4 real MIN, not an arithmetic-only invariant ... ")
    lp = fresh_dir("min_cap")
    orig_per_attempt = ledger.CLASS_CAPS["provider"]["bytes_per_attempt"]
    orig_total = ledger.CLASS_CAPS["provider"]["bytes_total"]
    ledger.CLASS_CAPS["provider"]["bytes_per_attempt"] = 1000
    ledger.CLASS_CAPS["provider"]["bytes_total"] = 1200
    try:
        aid1 = ledger.reserve_attempt(lp)
        cap1 = ledger.get_reserved_decoded_cap(lp, aid1)
        assert cap1 == 1000, f"RED: expected the flat per-attempt cap 1000 when nothing is spent yet, got {cap1}"
        ledger.record_outcome(lp, aid1, {"category": "OK", "status": 200, "bytes_decoded": 1000, "truncated": False})

        # Remaining global budget is now 1200-1000=200, LESS than the flat
        # per-attempt cap of 1000 -- the second reservation's cap must be
        # the smaller remaining-global figure, not the flat constant.
        aid2 = ledger.reserve_attempt(lp)
        cap2 = ledger.get_reserved_decoded_cap(lp, aid2)
        assert cap2 == 200, f"RED: expected MIN(1000, 200)=200, got {cap2}"
        print(f"    PASS: first attempt capped at the flat 1000, second attempt correctly capped at the "
              f"remaining-global 200 (< per-attempt cap)")
    finally:
        ledger.CLASS_CAPS["provider"]["bytes_per_attempt"] = orig_per_attempt
        ledger.CLASS_CAPS["provider"]["bytes_total"] = orig_total


def test_incomplete_attempt_blocks_future_reservation():
    print("[ledger 7c] an attempt left 'reserved' (never completed) blocks ANY future reservation -- "
          "correction v7 R2, LedgerIncomplete, distinct from the plain count cap ... ", end="")
    lp = fresh_dir("incomplete")
    aid = ledger.reserve_attempt(lp)  # never completed -- simulates a crash before any outcome
    try:
        ledger.reserve_attempt(lp)
        print("RED FAIL -- a new reservation was wrongly permitted despite an unresolved 'reserved' row")
        sys.exit(1)
    except ledger.LedgerIncomplete:
        pass
    print(f"PASS (attempt {aid[:8]}... left 'reserved'; a further reservation correctly refused "
          f"with LedgerIncomplete)")


def test_finalize_attempt_sets_outcome_and_terminal_atomically():
    print("[ledger 7d] finalize_attempt() sets the outcome AND the terminal flag in ONE atomic write -- "
          "correction v7 R2, never two separate lock cycles with a crash gap between them ... ", end="")
    lp = fresh_dir("finalize_atomic")
    aid = ledger.reserve_attempt(lp)
    ledger.finalize_attempt(lp, aid, {"category": "PARENT_ENFORCED_TOTAL_DEADLINE", "status": None,
                                       "bytes_decoded": 0, "truncated": False},
                             terminal_reason_category="HARD_DEADLINE_KILL",
                             sample_written=None, sample_reason=None)
    led = ledger.load_ledger(lp)
    assert led["attempts"][0]["status"] == "complete"
    assert led["terminal"] is True and led["terminal_reason_category"] == "HARD_DEADLINE_KILL"
    print("PASS (outcome complete AND terminal flag set together, from a single finalize_attempt() call)")


def test_concurrent_lock_live_process_refuses():
    print("[ledger 8] a lock held by a LIVE process (this process's own PID) refuses a concurrent acquire ... ",
          end="")
    lp = fresh_dir("lock_live")
    lock = ledger._ExclusiveLock(lp)
    lock._acquire()
    try:
        second = ledger._ExclusiveLock(lp)
        try:
            second._acquire()
            print("RED FAIL -- a second lock acquire succeeded while the first (live-owned) lock was held")
            sys.exit(1)
        except ledger.LedgerBusy:
            print("PASS (LedgerBusy correctly raised against a live-owned lock)")
    finally:
        lock._release()


def test_lock_with_any_readable_pid_content_is_always_refused_never_reclaimed():
    print("[ledger 9] a lock file with ANY readable PID content is ALWAYS refused (LedgerBusy) -- "
          "correction v7 R3: NO automatic reclaim, NO liveness probe (os.kill(pid, 0) is not a safe "
          "passive existence check on Windows) ... ", end="")
    lp = fresh_dir("lock_no_reclaim")
    lock_path = lp + ".lock"
    # PID 1 is not a real process on this platform -- under the OLD (v6)
    # behaviour this would have been "confirmed dead" and reclaimed. Under
    # v7 there is no such judgment at all: ANY readable lock content means
    # LedgerBusy, full stop, regardless of whether the owner happens to be
    # alive, dead, or unverifiable.
    with open(lock_path, "w", encoding="utf-8") as f:
        f.write("1")
    assert not hasattr(ledger, "_process_is_alive"), (
        "RED: ledger._process_is_alive still exists -- the liveness probe this correction removes is still present")
    try:
        ledger.reserve_attempt(lp)
        print("RED FAIL -- a reservation succeeded despite an existing, readable lock file -- "
              "an automatic reclaim happened when it must not")
        sys.exit(1)
    except ledger.LedgerBusy:
        pass
    os.remove(lock_path)  # manual cleanup -- exactly the "human decides" step v7 requires
    aid = ledger.reserve_attempt(lp)  # now succeeds, because the lock is genuinely gone
    assert aid
    print(f"PASS (LedgerBusy correctly refused with no reclaim attempt; only manual removal of the lock "
          f"file allowed the next reservation {aid[:8]}... to succeed)")


def main():
    os.makedirs(TMP_ROOT, exist_ok=True)
    try:
        test_terminal_persists_and_blocks_future_reserve()
        test_wall_clock_window_not_monotonic_garbage()
        test_unreadable_tmp_never_deleted()
        test_corrupt_tmp_safely_discarded()
        test_tmp_written_but_not_replaced_is_recovered()
        test_byte_charging_unknown_charges_full_cap()
        test_known_bytes_reconcile_to_real_count()
        test_reserved_decoded_cap_is_min_of_per_attempt_and_remaining_global()
        test_incomplete_attempt_blocks_future_reservation()
        test_finalize_attempt_sets_outcome_and_terminal_atomically()
        test_concurrent_lock_live_process_refuses()
        test_lock_with_any_readable_pid_content_is_always_refused_never_reclaimed()
        print("\nALL LEDGER REGRESSION TESTS PASS (exit 0).")
    finally:
        shutil.rmtree(TMP_ROOT, ignore_errors=True)


if __name__ == "__main__":
    main()
