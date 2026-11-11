#!/usr/bin/env python3
"""#493 access-points v2 -- hash table for this round's own new files,
plus a final confirmation that all 30 v1/input baseline files are
still byte-identical (or, for cc-report.md, that the OLD bytes remain
an exact PREFIX of the new, appended file -- J6's own prefix-SHA
requirement). Run LAST, after evidence-v2.md reached final form. Uses
Path.as_posix() throughout (H7). Does not hash itself."""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent

V2_FILES = [
    "rules-v2.md",
    "rules-v2.sha256",
    "evidence-v2.md",
    "place-access-status-v2.csv",
    "endpoint-candidates-v2.json",
    "samples/v2/build_access_points_v2.py",
    "samples/v2/validate_final_outputs_v2.py",
    "samples/v2/snapshot_v1_and_inputs.py",
    "samples/v2/v1_and_input_baseline.json",
    "samples/v2/input_hashes.json",
    "samples/v2/phase1_role_readout.json",
    "samples/v2/place-node-references.json",
    "samples/v2/gap_list_v2.json",
    "samples/v2/stem_search_hints.json",
    "samples/v2/mutation_test_summary.json",
    "samples/v2/counts_summary.json",
]


def hash_file(p):
    data = p.read_bytes()
    return {"sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data), "line_ending": "CRLF" if b"\r\n" in data else "LF"}


def main():
    rows = [{"path": (TASK_DIR / rel).relative_to(REPO_ROOT).as_posix(), **hash_file(TASK_DIR / rel)} for rel in V2_FILES]

    baseline = json.loads((TASK_DIR / "samples/v2/v1_and_input_baseline.json").read_bytes())
    checks = []
    all_ok = True
    for row in baseline:
        p = REPO_ROOT / row["path"]
        data = p.read_bytes()
        if row["path"].endswith("ticket-493-access-points/cc-report.md"):
            prefix = data[: row["size_bytes"]]
            ok = hashlib.sha256(prefix).hexdigest() == row["sha256"] and len(data) >= row["size_bytes"]
            checks.append({"path": row["path"], "check": "prefix_sha256", "before_sha256": row["sha256"], "prefix_matches": ok, "new_total_size": len(data), "old_size": row["size_bytes"]})
        else:
            after = hash_file(p)
            ok = after["sha256"] == row["sha256"] and after["size_bytes"] == row["size_bytes"]
            checks.append({"path": row["path"], "check": "unchanged", "before_sha256": row["sha256"], "after_sha256": after["sha256"], "unchanged": ok})
        all_ok = all_ok and ok

    out = {"v2_new_files": rows, "v1_and_inputs_still_unchanged": checks, "all_ok": all_ok}
    with open(TASK_DIR / "samples/v2/HASHES-v2.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    with open(TASK_DIR / "samples/v2/HASHES-v2.sha256", "w", encoding="utf-8", newline="\n") as f:
        for r in rows:
            f.write(f"{r['sha256']}  {r['path']}\n")

    for r in rows:
        print(r["sha256"], r["size_bytes"], r["line_ending"], r["path"])
    print("--- v1/input baseline check ---")
    for c in checks:
        print(c["check"], c.get("unchanged", c.get("prefix_matches")), c["path"])
    print("all_ok:", all_ok)


if __name__ == "__main__":
    main()
