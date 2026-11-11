#!/usr/bin/env python3
"""#493 access-points -- hash/size/line-ending table for this round's
own new files, plus a before/after confirmation that every G7 input
file is still byte-identical. Generated from final bytes on disk, run
LAST, after evidence.md reached its final form. Does not hash itself;
cc-report.md and CURRENT.md are intentionally outside this table."""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent

THIS_ROUND_FILES = [
    "rules.md",
    "rules.sha256",
    "evidence.md",
    "place-access-status.csv",
    "endpoint-candidates.json",
    "samples/build_access_points.py",
    "samples/input_hashes.json",
    "samples/name_match_candidates.json",
    "samples/gap_list.json",
]


def hash_file(p):
    data = p.read_bytes()
    return {"sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data), "line_ending": "CRLF" if b"\r\n" in data else "LF"}


def main():
    rows = [{"path": rel, **hash_file(TASK_DIR / rel)} for rel in THIS_ROUND_FILES]

    input_hashes_before = json.loads((TASK_DIR / "samples/input_hashes.json").read_bytes())
    g7_check = []
    all_ok = True
    for row in input_hashes_before:
        p = REPO_ROOT / row["path"]
        after = hash_file(p)
        ok = after["sha256"] == row["sha256"] and after["size_bytes"] == row["size_bytes"]
        all_ok = all_ok and ok
        g7_check.append({"path": row["path"], "before_sha256": row["sha256"], "after_sha256": after["sha256"], "unchanged": ok})

    with open(TASK_DIR / "samples/HASHES.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump({"this_round_files": rows, "g7_input_files_before_after": g7_check, "all_g7_inputs_unchanged": all_ok}, f, ensure_ascii=False, indent=1)
        f.write("\n")

    with open(TASK_DIR / "samples/HASHES.sha256", "w", encoding="utf-8", newline="\n") as f:
        for r in rows:
            f.write(f"{r['sha256']}  {r['path']}\n")

    for r in rows:
        print(r["sha256"], r["size_bytes"], r["line_ending"], r["path"])
    print("all_g7_inputs_unchanged:", all_ok)


if __name__ == "__main__":
    main()
