#!/usr/bin/env python3
"""Exchange #2 (pre-sample-plan.md addendum 1): Hagstofa MAN030106 data POST."""
import json
import bounded_fetch as bf

URL = "https://px.hagstofa.is/pxis/api/v1/is/Ibuar/mannfjoldi/2_byggdir/Byggdakjarnar/MAN030106.px"

PAYLOAD = {
    "query": [
        {"code": "Þéttbýlisstaðir", "selection": {"filter": "all", "values": ["*"]}},
        {"code": "Aldur", "selection": {"filter": "item", "values": ["-1"]}},
        {"code": "Kyn", "selection": {"filter": "item", "values": ["0"]}},
        {"code": "Ár", "selection": {"filter": "item", "values": ["2023", "2024", "2025"]}},
    ],
    "response": {"format": "json-stat2"},
}

if __name__ == "__main__":
    body = json.dumps(PAYLOAD, ensure_ascii=False).encode("utf-8")
    e = bf.bounded_fetch(
        "POST", URL, body=body,
        headers={"Accept": "application/json", "Content-Type": "application/json"},
    )
    bf.append_ledger("exchange-ledger.jsonl", e)
    rbody = e["_body_bytes"]
    print("status:", e["status"], "bytes:", e["bytes_received"], "truncated:", e["truncated"], "error:", e["error"])
    if rbody:
        with open("data-MAN030106-raw.json", "wb") as f:
            f.write(rbody)
        print("wrote data-MAN030106-raw.json")
