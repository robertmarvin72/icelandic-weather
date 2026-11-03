"""#485 iteration-4 correction v7 (R5) -- genuine fault-injection proof of
ledger crash recovery: a REAL separate OS process is REALLY killed at the
exact instant its write has been fsynced to `.tmp` but NOT yet
`os.replace()`'d. The fault-injection hook this requires
(`_post_fsync_pre_replace_hook`) has been REMOVED from the real
candidate's `ledger.py` entirely (Jonesy's Round-2 finding: a production-
side test seam, even if unused by default) -- this test instead builds a
task-local SCRATCH COPY of `ledger.py` (+ `limits.py`) with the hook
TEXT-INSERTED into the copy only, and drives the worker/loader against
that copy. The real `ledger.py` is never read for anything but its own
source text (to build the copy) and is never written to.

This is distinct from `test/test_ledger.py`'s
`tmp_written_but_not_replaced_is_recovered`, which hand-constructs that
on-disk state directly rather than forcing a real process into it and
killing it for real.

A SECOND, separate fresh OS process then recovers the ledger, proving
the property end-to-end from genuine on-disk state, not shared memory.
"""
import json
import os
import shutil
import subprocess
import sys
import time
import uuid

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_PARENT_DIR = os.path.dirname(_THIS_DIR)

TMP_ROOT = os.path.join(_PARENT_DIR, "tmp", "crash_injection")
WORKER_PATH = os.path.join(_THIS_DIR, "_crash_injection_worker.py")
LOADER_PATH = os.path.join(_THIS_DIR, "_load_ledger_worker.py")

_REAL_LEDGER_PATH = os.path.join(_PARENT_DIR, "ledger.py")

_ATOMIC_WRITE_FROM = '''def _atomic_write(path, obj):
    tmp = _tmp_path(path)
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)'''
_ATOMIC_WRITE_TO = '''# TEST-ONLY (scratch copy only -- see test_ledger_crash_injection.py):
# a fault-injection hook, never present in the real candidate's ledger.py.
_post_fsync_pre_replace_hook = None


def _atomic_write(path, obj):
    tmp = _tmp_path(path)
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.flush()
        os.fsync(f.fileno())
    if _post_fsync_pre_replace_hook is not None:
        _post_fsync_pre_replace_hook()
    os.replace(tmp, path)'''


def _build_scratch_ledger_copy():
    """Returns the path to a scratch directory containing a COPY of
    `ledger.py` (with the fault-injection hook text-inserted) and a
    straight copy of `limits.py`. The real `ledger.py` is only ever
    opened for reading here."""
    scratch_dir = os.path.join(TMP_ROOT, "module_copy_" + uuid.uuid4().hex[:8])
    os.makedirs(scratch_dir, exist_ok=True)
    real_source = open(_REAL_LEDGER_PATH, encoding="utf-8").read()
    assert _ATOMIC_WRITE_FROM in real_source, (
        "test setup bug: expected _atomic_write() source snippet not found verbatim in ledger.py "
        "-- this test is stale relative to the real file and must be updated, not skipped")
    mutated_source = real_source.replace(_ATOMIC_WRITE_FROM, _ATOMIC_WRITE_TO, 1)
    assert mutated_source != real_source
    copy_ledger_path = os.path.join(scratch_dir, "ledger.py")
    with open(copy_ledger_path, "w", encoding="utf-8") as f:
        f.write(mutated_source)
    shutil.copy2(os.path.join(_PARENT_DIR, "limits.py"), os.path.join(scratch_dir, "limits.py"))
    return copy_ledger_path


def _popen_kwargs(**extra):
    kwargs = dict(stdout=subprocess.PIPE, stderr=subprocess.PIPE, **extra)
    if sys.platform == "win32":
        kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW
    return kwargs


def test_real_kill_between_fsync_and_replace_is_recovered():
    print("[crash-injection] a REAL process is REALLY killed after fsync() but before os.replace() "
          "on its ledger write; a second real process then recovers it ... ")
    shutil.rmtree(TMP_ROOT, ignore_errors=True)
    os.makedirs(TMP_ROOT, exist_ok=True)
    copy_ledger_path = _build_scratch_ledger_copy()
    ledger_path = os.path.join(TMP_ROOT, "ledger.json")
    ready_sentinel = os.path.join(TMP_ROOT, "ready.sentinel")
    tmp_path = ledger_path + ".tmp"
    lock_path = ledger_path + ".lock"

    proc = subprocess.Popen(
        [sys.executable, "-B", WORKER_PATH, copy_ledger_path, ledger_path, ready_sentinel],
        **_popen_kwargs())

    try:
        # Wait for the worker's own confirmation that it has fsynced the
        # .tmp write and is now paused inside the hook -- a real,
        # observable signal, not a timing guess.
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            if os.path.exists(ready_sentinel):
                break
            assert proc.poll() is None, "test setup bug: worker exited before reaching the pause point"
            time.sleep(0.02)
        else:
            raise AssertionError("RED: worker never reached the post-fsync pause point within 10s")

        # At this exact moment: the .tmp write is fsynced (durable) but
        # os.replace() has NOT run -- verify both halves of that claim
        # directly from the filesystem, not by assumption.
        assert os.path.exists(tmp_path), "RED: .tmp does not exist even though the worker signalled ready"
        assert not os.path.exists(ledger_path), (
            "RED: the real ledger path already exists -- os.replace() ran before the kill, "
            "this test did not actually inject the fault where it claims to")
        tmp_contents_before_kill = open(tmp_path, encoding="utf-8").read()
        json.loads(tmp_contents_before_kill)  # must already be valid, complete JSON (fsync'd, not partial)

        # The REAL kill.
        proc.kill()
        proc.wait(timeout=5)
        assert proc.returncode != 0, f"RED: worker exited cooperatively (code {proc.returncode}), not killed"
        print(f"    worker (PID {proc.pid}) genuinely killed mid-write (returncode={proc.returncode}); "
              f".tmp exists, real path does not -- fault injected at the intended instant")

        # The lock file is now orphaned. load_ledger() itself never
        # touches the lock (only the mutating functions do), so this does
        # not block recovery. CORRECTION v7 (R3): this orphaned lock is
        # now left behind permanently -- there is no automatic reclaim of
        # any kind any more (no liveness probe, no self-initiated
        # cleanup); a real deployment would need a human to remove it
        # manually after confirming the owner is actually gone. This test
        # cleans it up itself afterward (a test fixture, not the
        # production code "reclaiming" it).
        assert os.path.exists(lock_path), "test setup bug: no lock file left behind by the killed worker"

        # SECOND, separate fresh OS process recovers it -- genuine
        # on-disk recovery, not anything held in this test process's or
        # the killed worker's memory.
        loader = subprocess.run([sys.executable, "-B", LOADER_PATH, copy_ledger_path, ledger_path],
                                 capture_output=True, text=True, timeout=10)
        assert loader.returncode == 0, f"RED: loader process failed: {loader.stderr}"
        recovered = json.loads(loader.stdout.strip())

        assert os.path.exists(ledger_path), "RED: recovery did not complete the real ledger file"
        assert not os.path.exists(tmp_path), "RED: recovery left the orphaned .tmp behind"
        assert len(recovered["attempts"]) == 1, f"RED: expected the killed reservation to survive recovery: {recovered}"
        assert recovered["attempts"][0]["status"] == "reserved"
        assert recovered["terminal"] is False
        print(f"    PASS: second real process recovered the reservation "
              f"(attempt {recovered['attempts'][0]['id'][:8]}..., status=reserved), "
              f".tmp cleaned up, real ledger file now exists")
    finally:
        if proc.poll() is None:
            proc.kill()
            proc.wait(timeout=5)
        shutil.rmtree(TMP_ROOT, ignore_errors=True)


def main():
    test_real_kill_between_fsync_and_replace_is_recovered()
    print("\nALL CRASH-INJECTION TESTS PASS (exit 0).")


if __name__ == "__main__":
    main()
