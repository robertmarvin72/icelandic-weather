"""#485 Phase B — single bounded, ledgered real-provider fetch. Every
invocation is one exchange against the REAL provider ledger
(../samples/ledger.json), pre-flight-checked against the frozen caps in
wrapper.py. Saves the retained (possibly truncated) body under
../samples/<outname> and a small headers/metadata sidecar under
../samples/<outname>-headers.txt.

Usage: python3 -B do_fetch.py <url> <data|doc> <outname>
"""
import hashlib
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))
import wrapper  # noqa: E402

LEDGER = os.path.join(os.path.dirname(__file__), "..", "samples", "ledger.json")
SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "..", "samples")


def main():
    url, cls, outname = sys.argv[1], sys.argv[2], sys.argv[3]
    request_time = wrapper.now_utc_iso()
    try:
        outcome, body = wrapper.fetch_once(url, cls, LEDGER, timeout=20)
    except wrapper.BudgetExceeded as e:
        print(f"REFUSED (pre-flight, no network attempted): {e}")
        sys.exit(2)
    except Exception as e:
        print(f"FAILED: {type(e).__name__}: {e}")
        sys.exit(1)

    out_path = os.path.join(SAMPLES_DIR, outname)
    with open(out_path, "wb") as f:
        f.write(body)
    sha = hashlib.sha256(body).hexdigest()

    headers_path = out_path + "-headers.txt"
    with open(headers_path, "w", encoding="utf-8") as f:
        f.write(f"URL: {url}\n")
        f.write(f"REQUEST_TIME_UTC: {request_time}\n")
        f.write(f"STATUS: {outcome['status']}\n")
        f.write(f"FINAL_URL: {outcome['final_url']}\n")
        f.write(f"REDIRECT_LOCATION: {outcome['redirect_location']}\n")
        f.write(f"BYTES_DECODED_RETAINED: {outcome['bytes_decoded']}\n")
        f.write(f"TRUNCATED: {outcome['truncated']}\n")
        f.write(f"ELAPSED_S: {outcome['elapsed_s']:.3f}\n")
        f.write(f"SHA256: {sha}\n")
        f.write("RESPONSE_HEADERS:\n")
        for k, v in outcome.get("response_headers", {}).items():
            f.write(f"  {k}: {v}\n")

    print(json.dumps({
        "url": url, "class": cls, "status": outcome["status"],
        "bytes": outcome["bytes_decoded"], "truncated": outcome["truncated"],
        "redirect_location": outcome["redirect_location"],
        "final_url": outcome["final_url"], "sha256": sha,
        "elapsed_s": round(outcome["elapsed_s"], 3),
    }, indent=2))


if __name__ == "__main__":
    main()
