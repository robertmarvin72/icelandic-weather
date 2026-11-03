"""#485 iteration-4 correction v7 (R4) -- helper process for the 6-process
concurrent-reservation test. Each invocation attempts exactly ONE
reserve_attempt() against the ledger path given as argv[1], and prints
"OK <id>", "BUSY", "EXCEEDED", or "INCOMPLETE" to stdout. No network, no
secrets. This worker deliberately never completes its own attempt (no
record_outcome()/finalize_attempt() call) -- under correction v7's R2
fix, that means AT MOST ONE worker, across the whole race, can ever
succeed: every subsequent lock holder will find that still-'reserved'
row and be refused with LedgerIncomplete, deterministically, regardless
of scheduling order.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import ledger  # noqa: E402

if __name__ == "__main__":
    path = sys.argv[1]
    try:
        aid = ledger.reserve_attempt(path)
        print(f"OK {aid}")
    except ledger.BudgetExceeded:
        print("EXCEEDED")
    except ledger.LedgerBusy:
        print("BUSY")
    except ledger.LedgerIncomplete:
        print("INCOMPLETE")
    except Exception as e:
        print(f"ERROR {type(e).__name__}")
