#!/usr/bin/env python3
"""
#493 endpoint-acquisition -- hash table for this round's own
deliverables, plus a final confirmation that all 18 retained inputs
(RP1) are still byte-identical to the pre-write baseline. Run LAST,
after cc-report.md reached final form. Does not hash itself.
"""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent

DELIVERABLES = [
    "owner-authorisation.md",
    "pairing-rules.md", "pairing-rules.sha256",
    "metadata-classification-rule.md", "metadata-classification-rule.sha256",
    "request-manifest.json", "request-manifest.sha256",
    "evidence.md",
    "endpoint-wgs84.json",
    "discovery-gaps.json",
    "cc-report.md",
    "samples/rp1_baseline.py", "samples/rp1_baseline.json",
    "samples/rp1_native_reference.py", "samples/rp1_native_reference.json",
    "samples/request_encoding.py", "samples/build_manifest.py",
    "samples/driver.py", "samples/test_server.py", "samples/run_ea2_tests.py", "samples/ea2_test_report.json",
    "samples/live_driver.py", "samples/exchange-ledger.jsonl", "samples/raw-E1-WGS84.json", "samples/live_run_summary.json",
    "samples/build_endpoint_output.py", "samples/validate_endpoint_output.py", "samples/run_negative_tests.py",
    "samples/negative_test_report.json",
]


def hash_file(p):
    data = p.read_bytes()
    return {"sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data), "line_ending": "CRLF" if b"\r\n" in data else "LF"}


def main():
    rows = []
    for rel in DELIVERABLES:
        p = TASK_DIR / rel
        if not p.exists():
            continue
        rows.append({"path": p.relative_to(REPO_ROOT).as_posix(), **hash_file(p)})

    baseline = json.loads((TASK_DIR / "samples/rp1_baseline.json").read_bytes())
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
    print("deliverables_hashed:", len(rows))


if __name__ == "__main__":
    main()
