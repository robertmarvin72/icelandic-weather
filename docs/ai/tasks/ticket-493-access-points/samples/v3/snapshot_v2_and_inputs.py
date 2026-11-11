#!/usr/bin/env python3
"""
#493 access-points v3 -- read-only baseline snapshot. Per J6/F6(d): run
BEFORE rules-v3.md or any other v3 output is written. Records SHA-256/
size/line-ending for every pre-existing v1 AND v2 task file plus all 12
of G7's original inputs. This is the SAME 30-file set v2's own baseline
covered, re-snapshotted now so v3's own final hash-check can prove
nothing in v1 or v2 was touched this round. Writes exactly one file:
samples/v3/v1_v2_and_input_baseline.json. No other output. Offline only.
"""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent

V1_FILES = [
    "rules.md", "rules.sha256", "evidence.md", "place-access-status.csv", "endpoint-candidates.json",
    "approved-prompt-v1.md", "prompt-review.md", "cc-report.md", "result-review.md",
    "samples/build_access_points.py", "samples/input_hashes.json", "samples/name_match_candidates.json",
    "samples/gap_list.json", "samples/generate_hashes.py", "samples/HASHES.json", "samples/HASHES.sha256",
]
V2_FILES = [
    "approved-prompt-v2.md", "correction-prompt-review.md", "rules-v2.md", "rules-v2.sha256",
    "evidence-v2.md", "place-access-status-v2.csv", "endpoint-candidates-v2.json",
    "samples/v2/build_access_points_v2.py", "samples/v2/validate_final_outputs_v2.py",
    "samples/v2/snapshot_v1_and_inputs.py", "samples/v2/v1_and_input_baseline.json",
    "samples/v2/input_hashes.json", "samples/v2/phase1_role_readout.json",
    "samples/v2/place-node-references.json", "samples/v2/gap_list_v2.json",
    "samples/v2/stem_search_hints.json", "samples/v2/mutation_test_summary.json",
    "samples/v2/counts_summary.json", "samples/v2/generate_hashes_v2.py",
    "samples/v2/HASHES-v2.json", "samples/v2/HASHES-v2.sha256",
]
APPEND_ONLY_V2_SUFFIXES = ("ticket-493-access-points/cc-report.md",)  # was already append-only before v2; v3 appends again on top

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
    rows = []
    for rel in V1_FILES + V2_FILES:
        p = TASK_DIR / rel
        rows.append({"path": p.relative_to(REPO_ROOT).as_posix(), "group": "v1" if rel in V1_FILES else "v2", **hash_file(p)})
    for label, p in INPUT_FILES:
        rows.append({"path": p.relative_to(REPO_ROOT).as_posix(), "group": "input", "label": label, **hash_file(p)})
    assert len(rows) == 16 + 21 + 12 == 49, len(rows)
    out_path = TASK_DIR / "samples/v3/v1_v2_and_input_baseline.json"
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"wrote {out_path.relative_to(REPO_ROOT).as_posix()} with {len(rows)} entries (16 v1 + 21 v2 + 12 input)")
    for r in rows:
        print(r["sha256"][:12], r["size_bytes"], r["line_ending"], r["path"])


if __name__ == "__main__":
    main()
