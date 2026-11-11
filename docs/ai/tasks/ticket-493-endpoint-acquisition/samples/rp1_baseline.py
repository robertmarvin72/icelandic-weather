#!/usr/bin/env python3
"""
#493 endpoint-acquisition -- RP1. Read-only snapshot of every retained
input this round reads, with SHA-256/size/line-ending, fixed BEFORE
any new task output is written (after the mandatory CURRENT ->
CC_IN_PROGRESS update). Run again at the end (generate_hashes.py
re-verifies these same files unchanged). No network. Writes exactly
one file.
"""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent

RETAINED_INPUTS = [
    ("endpoint-owner-decisions-2026-11-11.md", REPO_ROOT / "docs/ai/tasks/ticket-493/endpoint-owner-decisions-2026-11-11.md"),
    ("endpoint-candidates-v3.json", REPO_ROOT / "docs/ai/tasks/ticket-493-access-points/endpoint-candidates-v3.json"),
    ("road-links.csv", REPO_ROOT / "docs/ai/tasks/ticket-493-place-network/samples/road-links.csv"),
    ("chain-walks-v4.json", REPO_ROOT / "docs/ai/tasks/ticket-493-place-network/samples/chain-walks-v4.json"),
    ("wfs-vegnr1-all.json (#483)", REPO_ROOT / "docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json"),
    ("wfs93-raw.json (phase2)", REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2/samples/wfs93-raw.json"),
    ("exchange-ledger.jsonl (north-data)", REPO_ROOT / "docs/ai/tasks/ticket-493-north-data/samples/exchange-ledger.jsonl"),
    ("wfs-north-4326.json", REPO_ROOT / "docs/ai/tasks/ticket-493-north-data/samples/wfs-north-4326.json"),
    ("bounded_fetch.py (phase2)", REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2/samples/bounded_fetch.py"),
    ("ledger_integrity-v3.json (phase2)", REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2/samples/ledger_integrity-v3.json"),
    ("owner-authorisation.md (phase2, precedent)", REPO_ROOT / "docs/ai/tasks/ticket-493-place-data-phase2/owner-authorisation.md"),
    ("acquisition-plan.md", REPO_ROOT / "docs/ai/tasks/ticket-493-endpoint-acquisition-plan/acquisition-plan.md"),
    ("request-plan.json", REPO_ROOT / "docs/ai/tasks/ticket-493-endpoint-acquisition-plan/request-plan.json"),
    ("coverage-matrix.json", REPO_ROOT / "docs/ai/tasks/ticket-493-endpoint-acquisition-plan/coverage-matrix.json"),
    ("result-review.md (acquisition-plan, RP1-RP4)", REPO_ROOT / "docs/ai/tasks/ticket-493-endpoint-acquisition-plan/result-review.md"),
    ("cc-report.md (acquisition-plan)", REPO_ROOT / "docs/ai/tasks/ticket-493-endpoint-acquisition-plan/cc-report.md"),
    ("approved-prompt-v1.md (this task)", REPO_ROOT / "docs/ai/tasks/ticket-493-endpoint-acquisition/approved-prompt-v1.md"),
    ("prompt-review.md (this task)", REPO_ROOT / "docs/ai/tasks/ticket-493-endpoint-acquisition/prompt-review.md"),
]


def hash_file(p):
    data = p.read_bytes()
    return {"sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data), "line_ending": "CRLF" if b"\r\n" in data else "LF"}


def main():
    rows = [{"label": label, "path": p.relative_to(REPO_ROOT).as_posix(), **hash_file(p)} for label, p in RETAINED_INPUTS]
    assert len(rows) == 18, len(rows)
    out_path = TASK_DIR / "samples/rp1_baseline.json"
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"wrote {out_path.relative_to(REPO_ROOT).as_posix()} with {len(rows)} retained inputs")
    for r in rows:
        print(r["sha256"][:12], r["size_bytes"], r["line_ending"], r["label"], "->", r["path"])


if __name__ == "__main__":
    main()
