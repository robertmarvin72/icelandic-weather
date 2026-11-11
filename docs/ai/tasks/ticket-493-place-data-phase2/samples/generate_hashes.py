#!/usr/bin/env python3
"""#493 phase2 -- hash/size/line-ending table for this round's own new
files, generated from final bytes on disk, run LAST. Does not list its
own hash."""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent

FILES = [
    "owner-authorisation.md",
    "pre-sample-plan.md",
    "evidence.md",
    "place-inventory.csv",
    "samples/bounded_fetch.py",
    "samples/local_enforcement_test.py",
    "samples/local-test-ledger.json",
    "samples/exchange1_metadata.py",
    "samples/exchange2_data.py",
    "samples/exchange3_wfs93.py",
    "samples/exchange-ledger.jsonl",
    "samples/metadata-MAN030106-raw.json",
    "samples/data-MAN030106-raw.json",
    "samples/wfs93-raw.json",
    "samples/hagstofa_settlements_2023_2025.csv",
    "samples/build_road93_candidate.py",
    "samples/road93-candidate.json",
    "samples/generate_hashes.py",
]

UNCHANGED_PRIOR_FILES = [
    "../ticket-493-place-network/place-inventory.csv",
    "../ticket-493-place-network/evidence.md",
    "../ticket-493-place-network/cc-report.md",
    "../ticket-493-place-network/rules.md",
    "../ticket-493-place-network/rules-addendum-v4.md",
    "../ticket-493-place-network/samples/road-links.csv",
    "../ticket-493-place-network/samples/chain-walks-v4.json",
    "../ticket-483/samples/wfs-vegnr1-all.json",
    "../ticket-493-north-data/route-data-candidate.json",
]


def hash_file(p):
    data = p.read_bytes()
    return {
        "sha256": hashlib.sha256(data).hexdigest(),
        "size_bytes": len(data),
        "line_ending": "CRLF" if b"\r\n" in data else "LF",
    }


def main():
    rows = []
    for rel in FILES:
        p = TASK_DIR / rel
        row = {"path": rel}
        row.update(hash_file(p))
        rows.append(row)

    unchanged_rows = []
    for rel in UNCHANGED_PRIOR_FILES:
        p = (TASK_DIR / rel).resolve()
        row = {"path": str(p.relative_to(TASK_DIR.parent.parent))}
        row.update(hash_file(p))
        unchanged_rows.append(row)

    with open(TASK_DIR / "samples/HASHES.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump({"this_round_new_files": rows, "confirmed_unchanged_prior_files": unchanged_rows}, f, ensure_ascii=False, indent=1)
        f.write("\n")

    with open(TASK_DIR / "samples/HASHES.sha256", "w", encoding="utf-8", newline="\n") as f:
        for r in rows:
            f.write(f"{r['sha256']}  {r['path']}\n")

    for r in rows:
        print(r["sha256"], r["size_bytes"], r["line_ending"], r["path"])
    print("--- confirmed unchanged prior files ---")
    for r in unchanged_rows:
        print(r["sha256"], r["size_bytes"], r["line_ending"], r["path"])


if __name__ == "__main__":
    main()
