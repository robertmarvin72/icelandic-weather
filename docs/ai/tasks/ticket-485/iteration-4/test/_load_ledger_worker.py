"""#485 iteration-4 correction v7 (R5) -- TEST-ONLY helper: loads a ledger
file in a FRESH, separate OS process (never the process that wrote or
crashed it), using the SAME scratch-copy `ledger.py` module as
`_crash_injection_worker.py` (for exact behavioural consistency with
what wrote it), and prints the result as JSON. Recovery is verified from
genuine on-disk state only, never anything held in a shared process's
memory.

Usage: python _load_ledger_worker.py <copy_ledger_module_path> <ledger_json_path>
"""
import importlib.util
import json
import os
import sys


def main():
    copy_ledger_path = sys.argv[1]
    ledger_path = sys.argv[2]

    sys.path.insert(0, os.path.dirname(os.path.abspath(copy_ledger_path)))
    spec = importlib.util.spec_from_file_location("copy_ledger_loader", copy_ledger_path)
    copy_ledger = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(copy_ledger)

    led = copy_ledger.load_ledger(ledger_path)
    print(json.dumps(led))


if __name__ == "__main__":
    main()
