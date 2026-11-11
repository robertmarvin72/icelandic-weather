#!/usr/bin/env python3
"""
#493 access-points v4 -- read-only baseline snapshot. Per J6/F6(d)'s
own pattern, run BEFORE rules-v4.md or any other v4 output is written.
Unlike v2/v3's own hand-listed baselines, this one WALKS the entire
pre-existing task directory (every v1+v2+v3 file that exists right
now, whatever it is) plus the 12 retained inputs -- so nothing can be
missed by a manual list going stale. Writes exactly one file:
samples/v4/v1_v2_v3_and_input_baseline.json. No other output. Offline.
"""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent

INPUT_FILES = [
    ("place_nodes-v3.json", REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2/samples/place_nodes-v3.json"),
    ("worklist_matching-v3.json", REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2/samples/worklist_matching-v3.json"),
    ("road93_section-v2.json", REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2/samples/road93_section-v2.json"),
    ("wfs93-raw.json", REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2/samples/wfs93-raw.json"),
    ("chain-walks-v4.json", REPO_ROOT / "docs/ai/tasks/ticket-493-place-network/samples/chain-walks-v4.json"),
    ("road-links.csv", REPO_ROOT / "docs/ai/tasks/ticket-493-place-network/samples/road-links.csv"),
    ("place-inventory.csv (phase-1)", REPO_ROOT / "docs/ai/tasks/ticket-493-place-network/place-inventory.csv"),
    ("place-inventory-v3.csv (phase-2)", REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2/place-inventory-v3.csv"),
    ("route-data-candidate.json", REPO_ROOT / "docs/ai/tasks/ticket-493-north-data/route-data-candidate.json"),
    ("wfs-north-4326.json", REPO_ROOT / "docs/ai/tasks/ticket-493-north-data/samples/wfs-north-4326.json"),
    ("national-place-coverage.md", REPO_ROOT / "docs/ai/tasks/ticket-493/national-place-coverage.md"),
    ("akureyri-endpoint-decision.md", REPO_ROOT / "docs/ai/tasks/ticket-493/akureyri-endpoint-decision.md"),
]


def hash_file(p):
    data = p.read_bytes()
    return {"sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data), "line_ending": "CRLF" if b"\r\n" in data else "LF"}


def main():
    this_file = Path(__file__).resolve()
    task_files = sorted(p for p in TASK_DIR.rglob("*") if p.is_file() and p != this_file and "__pycache__" not in p.parts)
    rows = []
    for p in task_files:
        rows.append({"path": p.relative_to(REPO_ROOT).as_posix(), "group": "task_dir_pre_v4", **hash_file(p)})
    for label, p in INPUT_FILES:
        rows.append({"path": p.relative_to(REPO_ROOT).as_posix(), "group": "input", "label": label, **hash_file(p)})

    out_path = TASK_DIR / "samples/v4/v1_v2_v3_and_input_baseline.json"
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"wrote {out_path.relative_to(REPO_ROOT).as_posix()} with {len(rows)} entries ({len(task_files)} pre-existing task files + {len(INPUT_FILES)} inputs)")
    for r in rows:
        print(r["sha256"][:12], r["size_bytes"], r["line_ending"], r["path"])


if __name__ == "__main__":
    main()
