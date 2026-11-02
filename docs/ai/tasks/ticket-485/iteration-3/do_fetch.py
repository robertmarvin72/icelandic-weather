"""#485 iteration-3 Phase B — one bounded, ledgered, allowlisted doc/data
fetch per invocation, using the NEW iteration-3 client. Saves the body and
a headers sidecar under samples/.

Usage: python3 -B do_fetch.py <https-url> doc <outname>
"""
import hashlib
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import client  # noqa: E402

LEDGER = os.path.join(os.path.dirname(__file__), "samples", "ledger.json")
SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "samples")

ALLOWED = {
    "https://open-meteo.com/en/docs",
    "https://gagnaveita.vegagerdin.is/vefthjonustur/faerd-gagnasnid",
    "https://epsg.org/crs_3057/ISN93-Lambert-1993.html",
    "https://epsg.org/method_9802/Lambert-Conic-Conformal-2SP.html",
    # Manual redirect hop, added once observed -- host (www.vegagerdin.is) is on the
    # approved prompt's own permitted redirect-host list; the exact path was not
    # predictable in advance, per a normal server-side redirect.
    "https://www.vegagerdin.is/upplysingar-og-utgafa/gagnaveita-vegagerdarinnar/",
}


def main():
    url, cls, outname = sys.argv[1], sys.argv[2], sys.argv[3]
    try:
        outcome, body = client.fetch_once(url, cls, LEDGER, allowed_exact_urls=ALLOWED, timeout=20)
    except client.BudgetExceeded as e:
        print(f"REFUSED (pre-flight): {e}")
        sys.exit(2)
    except Exception as e:
        print(f"FAILED: {type(e).__name__}: {e}")
        sys.exit(1)

    out_path = os.path.join(SAMPLES_DIR, outname)
    with open(out_path, "wb") as f:
        f.write(body)
    sha = hashlib.sha256(body).hexdigest()
    with open(out_path + "-headers.txt", "w", encoding="utf-8") as f:
        f.write(f"URL: {url}\nSTATUS: {outcome['status']}\nFINAL_URL: {outcome['final_url']}\n"
                f"REDIRECT_LOCATION: {outcome['redirect_location']}\n"
                f"BYTES_DECODED_RETAINED: {outcome['bytes_decoded']}\nTRUNCATED: {outcome['truncated']}\n"
                f"ELAPSED_S: {outcome['elapsed_s']:.3f}\nSHA256: {sha}\n")
    print(json.dumps({"url": url, "status": outcome["status"], "bytes": outcome["bytes_decoded"],
                       "truncated": outcome["truncated"], "redirect_location": outcome["redirect_location"],
                       "sha256": sha, "elapsed_s": round(outcome["elapsed_s"], 3)}, indent=2))


if __name__ == "__main__":
    main()
