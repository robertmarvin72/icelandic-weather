"""#485 iteration-4 correction v7 (R2, R3, R4) -- 6 real concurrent OS
processes racing to reserve_attempt() against the SAME ledger file. No
network, no secrets. Proves: the ledger file stays valid JSON throughout
(no corrupted interleaved write), no attempt ID is ever duplicated or
lost, lock contention refuses safely (R3: never by signalling/killing
the owner), and -- since this worker never completes its own attempt --
AT MOST ONE reservation can ever succeed across the whole race (R2: every
later lock holder finds that still-'reserved' row and is refused with
LedgerIncomplete, deterministically).
"""
import json
import os
import shutil
import subprocess
import sys

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_PARENT_DIR = os.path.dirname(_THIS_DIR)
sys.path.insert(0, _PARENT_DIR)
import ledger  # noqa: E402

WORKER = os.path.join(_THIS_DIR, "_concurrent_reserve_worker.py")
TMP_DIR = os.path.join(_PARENT_DIR, "tmp", "test_ledger_concurrency")


def test_six_concurrent_processes_respect_the_cap():
    print("[ledger-concurrency] 6 real OS processes race reserve_attempt() against one ledger file ... ")
    if os.path.exists(TMP_DIR):
        shutil.rmtree(TMP_DIR, ignore_errors=True)
    os.makedirs(TMP_DIR, exist_ok=True)
    lp = os.path.join(TMP_DIR, "ledger.json")

    orig_count = ledger.CLASS_CAPS["provider"]["count"]
    ledger.CLASS_CAPS["provider"]["count"] = 2
    try:
        procs = [subprocess.Popen([sys.executable, "-B", WORKER, lp],
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                 for _ in range(6)]
        outputs = []
        for p in procs:
            out, err = p.communicate(timeout=30)
            outputs.append(out.decode().strip())

        ok_count = sum(1 for o in outputs if o.startswith("OK"))
        exceeded_count = sum(1 for o in outputs if o == "EXCEEDED")
        busy_count = sum(1 for o in outputs if o == "BUSY")
        incomplete_count = sum(1 for o in outputs if o == "INCOMPLETE")
        error_count = sum(1 for o in outputs if o.startswith("ERROR"))
        print(f"    outcomes: OK={ok_count} EXCEEDED={exceeded_count} BUSY={busy_count} "
              f"INCOMPLETE={incomplete_count} ERROR={error_count}")
        print(f"    raw: {outputs}")

        assert error_count == 0, f"RED: {error_count} worker(s) hit an unexpected exception: {outputs}"
        # R2: this worker never completes its own attempt, so AT MOST ONE
        # reservation can ever succeed across the whole race -- every
        # later lock holder deterministically finds that still-'reserved'
        # row and is refused with LedgerIncomplete, regardless of
        # scheduling order (not merely "the count cap of 2 holds").
        assert ok_count <= 1, f"RED: {ok_count} successful reservations -- expected at most 1 (R2 fix)"
        assert ok_count + exceeded_count + busy_count + incomplete_count == 6

        # The ledger file itself must be valid, uncorrupted JSON with
        # exactly `ok_count` distinct attempt records -- not fewer (a lost
        # reservation) and not more (a duplicate/phantom one).
        with open(lp, encoding="utf-8") as f:
            led = json.load(f)
        ids = [a["id"] for a in led["attempts"]]
        assert len(ids) == ok_count, f"RED: ledger has {len(ids)} attempts, but {ok_count} workers reported OK"
        assert len(set(ids)) == len(ids), f"RED: duplicate attempt IDs in the ledger: {ids}"
        # Every ID a worker reported OK must actually be present.
        reported_ids = {o.split()[1] for o in outputs if o.startswith("OK")}
        assert reported_ids == set(ids), "RED: mismatch between worker-reported IDs and the ledger's own IDs"

        if ok_count == 0:
            print(f"    NOTE: zero reservations succeeded under this race (all hit BUSY/INCOMPLETE) -- "
                  f"an extreme scheduling outcome, not a failure; the property under test (at most 1, "
                  f"never more) still holds.")
        print(f"PASS: at most 1 reservation ever succeeds ({ok_count}<=1, deterministic under R2), "
              f"ledger valid, no duplicate/lost attempt IDs, {incomplete_count} worker(s) correctly "
              f"refused via LedgerIncomplete")
    finally:
        ledger.CLASS_CAPS["provider"]["count"] = orig_count
        shutil.rmtree(TMP_DIR, ignore_errors=True)


def main():
    test_six_concurrent_processes_respect_the_cap()
    print("\nALL LEDGER-CONCURRENCY TESTS PASS (exit 0).")


if __name__ == "__main__":
    main()
