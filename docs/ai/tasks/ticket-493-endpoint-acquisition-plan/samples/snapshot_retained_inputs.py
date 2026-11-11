#!/usr/bin/env python3
"""
#493 endpoint-acquisition-plan -- EP7(a). Read-only snapshot of every
retained input this plan cites, with SHA-256/size/line-ending, written
BEFORE acquisition-plan.md or any other deliverable in this task. Run
again at the end (generate_hashes.py re-verifies these same 20 files
unchanged) so the plan's own citations can't silently drift from disk.
No network. Writes exactly one file.
"""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent

RETAINED_INPUTS = [
    ("endpoint-candidates-v3.json", REPO_ROOT / "docs/ai/tasks/ticket-493-access-points/endpoint-candidates-v3.json"),
    ("evidence-v4.md (access-points)", REPO_ROOT / "docs/ai/tasks/ticket-493-access-points/evidence-v4.md"),
    ("result-review.md (access-points)", REPO_ROOT / "docs/ai/tasks/ticket-493-access-points/result-review.md"),
    ("endpoint-owner-decisions-2026-11-11.md", REPO_ROOT / "docs/ai/tasks/ticket-493/endpoint-owner-decisions-2026-11-11.md"),
    ("endpoint-decision-table-2026-11-11.md", REPO_ROOT / "docs/ai/tasks/ticket-493/endpoint-decision-table-2026-11-11.md"),
    ("akureyri-endpoint-decision.md", REPO_ROOT / "docs/ai/tasks/ticket-493/akureyri-endpoint-decision.md"),
    ("release-definition-proposal.md", REPO_ROOT / "docs/ai/tasks/ticket-493/release-definition-proposal.md"),
    ("road-links.csv", REPO_ROOT / "docs/ai/tasks/ticket-493-place-network/samples/road-links.csv"),
    ("continuity-pairs.csv", REPO_ROOT / "docs/ai/tasks/ticket-493-place-network/samples/continuity-pairs.csv"),
    ("chain-walks-v4.json", REPO_ROOT / "docs/ai/tasks/ticket-493-place-network/samples/chain-walks-v4.json"),
    ("place-inventory.csv (phase-1)", REPO_ROOT / "docs/ai/tasks/ticket-493-place-network/place-inventory.csv"),
    ("wfs93-raw.json", REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2/samples/wfs93-raw.json"),
    ("place-inventory-v3.csv (phase-2)", REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2/place-inventory-v3.csv"),
    ("exchange-ledger.jsonl (phase2)", REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2/samples/exchange-ledger.jsonl"),
    ("owner-authorisation.md (phase2)", REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2/owner-authorisation.md"),
    ("bounded_fetch.py (phase2)", REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2/samples/bounded_fetch.py"),
    ("pre-sample-plan.md (phase2)", REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2/pre-sample-plan.md"),
    ("wfs-north-4326.json", REPO_ROOT / "docs/ai/tasks/ticket-493-north-data/samples/wfs-north-4326.json"),
    ("exchange-ledger.jsonl (north-data)", REPO_ROOT / "docs/ai/tasks/ticket-493-north-data/samples/exchange-ledger.jsonl"),
    ("manifest.md (north-data)", REPO_ROOT / "docs/ai/tasks/ticket-493-north-data/samples/manifest.md"),
]


def hash_file(p):
    data = p.read_bytes()
    return {"sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data), "line_ending": "CRLF" if b"\r\n" in data else "LF"}


def main():
    rows = [{"label": label, "path": p.relative_to(REPO_ROOT).as_posix(), **hash_file(p)} for label, p in RETAINED_INPUTS]
    assert len(rows) == 20, len(rows)
    out_path = TASK_DIR / "samples/retained_inputs_baseline.json"
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"wrote {out_path.relative_to(REPO_ROOT).as_posix()} with {len(rows)} retained inputs")
    for r in rows:
        print(r["sha256"][:12], r["size_bytes"], r["line_ending"], r["label"], "->", r["path"])


if __name__ == "__main__":
    main()
