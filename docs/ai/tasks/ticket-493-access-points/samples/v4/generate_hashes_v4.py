#!/usr/bin/env python3
"""
#493 access-points v4 -- hash table for this round's own new files,
plus a final confirmation that all 77 v1/v2/v3/input baseline files
are still byte-identical (or, for the two append-only files, that the
OLD bytes remain an exact PREFIX of the new, appended file). Run LAST,
after evidence-v4.md reached final form. Uses Path.as_posix() throughout.
Does not hash itself.
"""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent

V4_FILES = [
    "rules-v4.md",
    "rules-v4.sha256",
    "evidence-v4.md",
    "samples/v4/snapshot_v3_and_inputs.py",
    "samples/v4/v1_v2_v3_and_input_baseline.json",
    "samples/v4/direction_status_frozen_map.json",
    "samples/v4/validate_final_outputs_v4.py",
    "samples/v4/mutation_tests_v4.py",
    "samples/v4/mutation_test_report_v4.json",
    "samples/v4/compute_7_of_15_v4.py",
    "samples/v4/seven_of_fifteen_analysis_v4.json",
]

APPEND_ONLY_SUFFIXES = ("ticket-493-access-points/cc-report.md", "ticket-493-access-points/result-review.md")


def hash_file(p):
    data = p.read_bytes()
    return {"sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data), "line_ending": "CRLF" if b"\r\n" in data else "LF"}


def main():
    rows = [{"path": (TASK_DIR / rel).relative_to(REPO_ROOT).as_posix(), **hash_file(TASK_DIR / rel)} for rel in V4_FILES]

    baseline = json.loads((TASK_DIR / "samples/v4/v1_v2_v3_and_input_baseline.json").read_bytes())
    checks = []
    all_ok = True
    for row in baseline:
        p = REPO_ROOT / row["path"]
        data = p.read_bytes()
        if row["path"].endswith(APPEND_ONLY_SUFFIXES):
            prefix = data[: row["size_bytes"]]
            ok = hashlib.sha256(prefix).hexdigest() == row["sha256"] and len(data) >= row["size_bytes"]
            checks.append({"path": row["path"], "check": "prefix_sha256", "before_sha256": row["sha256"], "prefix_matches": ok, "new_total_size": len(data), "old_size": row["size_bytes"]})
        else:
            after = hash_file(p)
            ok = after["sha256"] == row["sha256"] and after["size_bytes"] == row["size_bytes"]
            checks.append({"path": row["path"], "check": "unchanged", "before_sha256": row["sha256"], "after_sha256": after["sha256"], "unchanged": ok})
        all_ok = all_ok and ok

    out = {"v4_new_files": rows, "v1_v2_v3_and_inputs_still_unchanged": checks, "all_ok": all_ok, "baseline_file_count": len(baseline)}
    with open(TASK_DIR / "samples/v4/HASHES-v4.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    with open(TASK_DIR / "samples/v4/HASHES-v4.sha256", "w", encoding="utf-8", newline="\n") as f:
        for r in rows:
            f.write(f"{r['sha256']}  {r['path']}\n")

    for r in rows:
        print(r["sha256"], r["size_bytes"], r["line_ending"], r["path"])
    print(f"--- v1/v2/v3/input baseline check ({len(baseline)} files) ---")
    for c in checks:
        print(c["check"], c.get("unchanged", c.get("prefix_matches")), c["path"])
    print("all_ok:", all_ok)


if __name__ == "__main__":
    main()
