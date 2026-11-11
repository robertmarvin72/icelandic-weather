#!/usr/bin/env python3
"""
#493 endpoint-acquisition-plan -- hash table for this round's own
deliverables, plus a final confirmation that all 20 retained inputs
cited by this plan are still byte-identical to the pre-write snapshot
(EP7a/c). Run LAST, after cc-report.md reached final form. Uses
Path.as_posix() throughout. Does not hash itself.
"""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent

DELIVERABLES = [
    "acquisition-plan.md",
    "request-plan.json",
    "coverage-matrix.json",
    "cc-report.md",
    "samples/snapshot_retained_inputs.py",
    "samples/retained_inputs_baseline.json",
    "samples/verify_plan.py",
    "samples/verification_report.json",
]


def hash_file(p):
    data = p.read_bytes()
    return {"sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data), "line_ending": "CRLF" if b"\r\n" in data else "LF"}


def main():
    rows = [{"path": (TASK_DIR / rel).relative_to(REPO_ROOT).as_posix(), **hash_file(TASK_DIR / rel)} for rel in DELIVERABLES]

    baseline = json.loads((TASK_DIR / "samples/retained_inputs_baseline.json").read_bytes())
    checks = []
    all_ok = True
    for row in baseline:
        p = REPO_ROOT / row["path"]
        after = hash_file(p)
        ok = after["sha256"] == row["sha256"] and after["size_bytes"] == row["size_bytes"]
        checks.append({"path": row["path"], "label": row["label"], "before_sha256": row["sha256"], "after_sha256": after["sha256"], "unchanged": ok})
        all_ok = all_ok and ok

    out = {"deliverables": rows, "retained_inputs_still_unchanged": checks, "all_ok": all_ok, "retained_input_count": len(baseline)}
    with open(TASK_DIR / "samples/HASHES.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    with open(TASK_DIR / "samples/HASHES.sha256", "w", encoding="utf-8", newline="\n") as f:
        for r in rows:
            f.write(f"{r['sha256']}  {r['path']}\n")

    for r in rows:
        print(r["sha256"], r["size_bytes"], r["line_ending"], r["path"])
    print(f"--- retained-input check ({len(baseline)} files) ---")
    for c in checks:
        print("unchanged" if c["unchanged"] else "CHANGED!!", c["label"])
    print("all_ok:", all_ok)


if __name__ == "__main__":
    main()
