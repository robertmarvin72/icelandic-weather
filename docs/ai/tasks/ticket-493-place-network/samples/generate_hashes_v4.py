#!/usr/bin/env python3
"""
#493 place-network v4 (Q6) -- generates samples/HASHES-v4.json and
samples/HASHES-v4.sha256 from the FINAL bytes on disk, run LAST (after
evidence.md and place-inventory.csv reached their final v4 form). The
table never lists its own hash. Independent verification: run
`sha256sum -c samples/HASHES-v4.sha256` after this script.
"""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent

FILES = [
    "rules-addendum-v4.md",
    "evidence.md",
    "place-inventory.csv",
    "samples/national_inventory_v4.py",
    "samples/chain-walks-v4.json",
    "samples/bridge-summary-v4.json",
    "samples/national_inventory_v4-output.txt",
    "samples/generate_hashes_v4.py",
]


def main():
    rows = []
    for rel in FILES:
        p = TASK_DIR / rel
        data = p.read_bytes()
        rows.append(
            {
                "path": rel,
                "sha256": hashlib.sha256(data).hexdigest(),
                "size_bytes": len(data),
                "line_ending": "CRLF" if b"\r\n" in data else "LF",
            }
        )

    with open(TASK_DIR / "samples/HASHES-v4.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)
        f.write("\n")

    with open(TASK_DIR / "samples/HASHES-v4.sha256", "w", encoding="utf-8", newline="\n") as f:
        for r in rows:
            f.write(f"{r['sha256']}  {r['path']}\n")

    for r in rows:
        print(r["sha256"], r["size_bytes"], r["line_ending"], r["path"])


if __name__ == "__main__":
    main()
