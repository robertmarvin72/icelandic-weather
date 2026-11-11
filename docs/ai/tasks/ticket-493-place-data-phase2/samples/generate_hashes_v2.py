#!/usr/bin/env python3
"""#493 phase2 v2 -- hash/size/line-ending table for this correction
round's own new/changed files plus confirmation that older files
(v1's own, phase-1's own, and the legacy evidence files) remain
byte-unchanged. Generated from final bytes on disk, run LAST --
AFTER cc-report.md's own v2 addendum is written, which is itself
included below (K7)."""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent

V2_NEW_OR_CHANGED_FILES = [
    "evidence.md",
    "cc-report.md",
    "rules-addendum-v2.md",
    "place-inventory-v2.csv",
    "samples/build_phase2_v2.py",
    "samples/road_condition_footprint-v2.json",
    "samples/hagstofa_classification-v2.json",
    "samples/egilsstadir_nodes-v2.json",
    "samples/road93_section-v2.json",
    "samples/worklist_and_weatherpoints-v2.json",
    "samples/generate_hashes_v2.py",
    "samples/v1/evidence-v1-superseded.md",
    "samples/v1/cc-report-v1-superseded.md",
    "samples/v1/place-inventory-v1-superseded.csv",
]

CONFIRMED_UNCHANGED_THIS_TASK = [
    "place-inventory.csv",
    "pre-sample-plan.md",
    "owner-authorisation.md",
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
    "samples/HASHES.json",
    "samples/HASHES.sha256",
]

CONFIRMED_UNCHANGED_OTHER_TASKS = [
    "docs/ai/tasks/ticket-493-place-network/place-inventory.csv",
    "docs/ai/tasks/ticket-493-place-network/evidence.md",
    "docs/ai/tasks/ticket-493-place-network/cc-report.md",
    "docs/ai/tasks/ticket-493-place-network/rules.md",
    "docs/ai/tasks/ticket-493-place-network/rules-addendum-v4.md",
    "docs/ai/tasks/ticket-493-place-network/samples/road-links.csv",
    "docs/ai/tasks/ticket-493-place-network/samples/chain-walks-v4.json",
    "docs/ai/tasks/ticket-493-place-network/samples/national_inventory_v4.py",
    "docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json",
    "docs/ai/tasks/ticket-483/samples/legacy-faerd-fresh.json",
    "docs/ai/tasks/ticket-483/samples/legacy-faerdpunktar.json",
    "docs/ai/tasks/ticket-485/samples/legacy-faerd-https.json",
    "docs/ai/tasks/ticket-485/samples/legacy-faerdpunktar-https.json",
    "docs/ai/tasks/ticket-493-north-data/route-data-candidate.json",
    "docs/ai/tasks/ticket-493/national-place-coverage.md",
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
    for rel in V2_NEW_OR_CHANGED_FILES:
        p = TASK_DIR / rel
        row = {"path": rel}
        row.update(hash_file(p))
        rows.append(row)

    unchanged_rows = []
    for rel in CONFIRMED_UNCHANGED_THIS_TASK:
        p = TASK_DIR / rel
        row = {"path": rel}
        row.update(hash_file(p))
        unchanged_rows.append(row)
    for rel in CONFIRMED_UNCHANGED_OTHER_TASKS:
        p = REPO_ROOT / rel
        row = {"path": rel}
        row.update(hash_file(p))
        unchanged_rows.append(row)

    with open(TASK_DIR / "samples/HASHES-v2.json", "w", encoding="utf-8", newline="\n") as f:
        json.dump({"v2_new_or_changed_files": rows, "confirmed_unchanged": unchanged_rows}, f, ensure_ascii=False, indent=1)
        f.write("\n")

    with open(TASK_DIR / "samples/HASHES-v2.sha256", "w", encoding="utf-8", newline="\n") as f:
        for r in rows:
            f.write(f"{r['sha256']}  {r['path']}\n")

    for r in rows:
        print(r["sha256"], r["size_bytes"], r["line_ending"], r["path"])
    print("--- confirmed unchanged (this task + other tasks) ---")
    for r in unchanged_rows:
        print(r["sha256"], r["size_bytes"], r["line_ending"], r["path"])


if __name__ == "__main__":
    main()
