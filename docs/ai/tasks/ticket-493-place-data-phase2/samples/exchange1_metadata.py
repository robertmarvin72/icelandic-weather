#!/usr/bin/env python3
"""Exchange #1 (pre-sample-plan.md): Hagstofa MAN030106 metadata GET."""
import json
import bounded_fetch as bf

URL = "https://px.hagstofa.is/pxis/api/v1/is/Ibuar/mannfjoldi/2_byggdir/Byggdakjarnar/MAN030106.px"

if __name__ == "__main__":
    e = bf.bounded_fetch("GET", URL, headers={"Accept": "application/json"})
    bf.append_ledger("exchange-ledger.jsonl", e)
    body = e["_body_bytes"]
    print("status:", e["status"], "bytes:", e["bytes_received"], "truncated:", e["truncated"], "error:", e["error"])
    if body:
        with open("metadata-MAN030106-raw.json", "wb") as f:
            f.write(body)
        print("wrote metadata-MAN030106-raw.json")
        try:
            parsed = json.loads(body)
            print(json.dumps(parsed, ensure_ascii=False, indent=1)[:3000])
        except Exception as exc:
            print("not JSON or parse error:", exc)
            print(body[:1000])
