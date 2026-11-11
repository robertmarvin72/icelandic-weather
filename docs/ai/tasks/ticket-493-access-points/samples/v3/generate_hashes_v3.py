#!/usr/bin/env python3
"""
#493 access-points v3 -- hash table for this round's own new files,
plus a final confirmation that all 49 v1/v2/input baseline files are
still byte-identical (or, for the two append-only files, that the OLD
bytes remain an exact PREFIX of the new, appended file -- J6/F6(d)'s
own prefix-SHA requirement). Run LAST, after evidence-v3.md reached
final form. Uses Path.as_posix() throughout. Does not hash itself.
"""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent

V3_FILES = [
    "rules-v3.md",
    "rules-v3.sha256",
    "evidence-v3.md",
    "place-access-status-v3.csv",
    "endpoint-candidates-v3.json",
    "samples/v3/snapshot_v2_and_inputs.py",
    "samples/v3/v1_v2_and_input_baseline.json",
    "samples/v3/build_access_points_v3.py",
    "samples/v3/input_hashes_v3.json",
    "samples/v3/phase1_role_readout_v3.json",
    "samples/v3/place-node-references-v3.json",
    "samples/v3/gap_list_v3.json",
    "samples/v3/mutation_test_summary_v3.json",
    "samples/v3/stem_search_hints_v3.json",
    "samples/v3/counts_summary_v3.json",
    "samples/v3/role_divergences_v3.json",
    "samples/v3/validate_final_outputs_v3.py",
    "samples/v3/mutation_tests_v3.py",
    "samples/v3/mutation_test_report_v3.json",
    "samples/v3/compare_v3_vs_v2.py",
    "samples/v3/compare_v3_vs_v2_report.json",
]

APPEND_ONLY_SUFFIXES = ("ticket-493-access-points/cc-report.md", "ticket-493-access-points/result-review.md")


def hash_file(p):
    data = p.read_bytes()
    return {"sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data), "line_ending": "CRLF" if b"\r\n" in data else "LF"}


def main():
    rows = [{"path": (TASK_DIR / rel).relative_to(REPO_ROOT).as_posix(), **hash_file(TASK_DIR / rel)} for rel in V3_FILES]

    baseline = json.loads((TASK_DIR / "samples/v3/v1_v2_and_input_baseline.json").read_bytes())
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

    out = {"v3_new_files": rows, "v1_v2_and_inputs_still_unchanged": checks, "all_ok": all_ok, "baseline_file_count": len(baseline)}
    with open(TASK_DIR / "samples/v3/HASHES-v3.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    with open(TASK_DIR / "samples/v3/HASHES-v3.sha256", "w", encoding="utf-8", newline="\n") as f:
        for r in rows:
            f.write(f"{r['sha256']}  {r['path']}\n")

    for r in rows:
        print(r["sha256"], r["size_bytes"], r["line_ending"], r["path"])
    print("--- v1/v2/input baseline check (49 files) ---")
    for c in checks:
        print(c["check"], c.get("unchanged", c.get("prefix_matches")), c["path"])
    print("all_ok:", all_ok)


if __name__ == "__main__":
    main()
