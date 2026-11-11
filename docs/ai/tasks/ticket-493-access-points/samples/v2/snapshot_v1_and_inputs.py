#!/usr/bin/env python3
"""
#493 access-points v2 correction (J6, "Fastar nákvæmniákvarðanir v2"
last bullet). READ-ONLY: the FIRST action of this round, run before
rules-v2.md or any other v2 output is written. Records SHA-256/size/
line-ending for every pre-existing v1 task file and all 12 of G7's
original input files, using Path.as_posix() (H7) for every repo-
relative path. This is the "before" baseline; the same paths are
re-hashed at the end of the round and compared.
"""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent
PHASE2_DIR = REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2"
NETWORK_DIR = REPO_ROOT / "docs/ai/tasks/ticket-493-place-network"
NORTH_DIR = REPO_ROOT / "docs/ai/tasks/ticket-493-north-data"
TICKET493_DIR = REPO_ROOT / "docs/ai/tasks/ticket-493"

V1_TASK_FILES = [
    "approved-prompt-v1.md",
    "approved-prompt-v2.md",
    "cc-report.md",
    "correction-prompt-review.md",
    "endpoint-candidates.json",
    "evidence.md",
    "place-access-status.csv",
    "prompt-review.md",
    "result-review.md",
    "rules.md",
    "rules.sha256",
    "samples/HASHES.json",
    "samples/HASHES.sha256",
    "samples/build_access_points.py",
    "samples/gap_list.json",
    "samples/generate_hashes.py",
    "samples/input_hashes.json",
    "samples/name_match_candidates.json",
]

ORIGINAL_INPUT_FILES = [
    PHASE2_DIR / "samples/place_nodes-v3.json",
    PHASE2_DIR / "samples/worklist_matching-v3.json",
    PHASE2_DIR / "samples/road93_section-v2.json",
    PHASE2_DIR / "samples/wfs93-raw.json",
    NETWORK_DIR / "samples/chain-walks-v4.json",
    NETWORK_DIR / "samples/road-links.csv",
    NETWORK_DIR / "place-inventory.csv",
    PHASE2_DIR / "place-inventory-v3.csv",
    NORTH_DIR / "route-data-candidate.json",
    NORTH_DIR / "samples/wfs-north-4326.json",
    TICKET493_DIR / "national-place-coverage.md",
    TICKET493_DIR / "akureyri-endpoint-decision.md",
]


def hash_file(p):
    data = p.read_bytes()
    return {"sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data), "line_ending": "CRLF" if b"\r\n" in data else "LF"}


def main():
    rows = []
    for rel in V1_TASK_FILES:
        p = TASK_DIR / rel
        row = {"path": (TASK_DIR / rel).relative_to(REPO_ROOT).as_posix()}
        row.update(hash_file(p))
        rows.append(row)

    for p in ORIGINAL_INPUT_FILES:
        row = {"path": p.relative_to(REPO_ROOT).as_posix()}
        row.update(hash_file(p))
        rows.append(row)

    out = TASK_DIR / "samples/v2/v1_and_input_baseline.json"
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)
        f.write("\n")
    for r in rows:
        print(r["sha256"], r["size_bytes"], r["line_ending"], r["path"])
    print(f"baseline recorded: {len(rows)} files -> {out.relative_to(REPO_ROOT).as_posix()}")


if __name__ == "__main__":
    main()
