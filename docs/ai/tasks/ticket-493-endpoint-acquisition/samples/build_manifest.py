#!/usr/bin/env python3
"""
#493 endpoint-acquisition -- EA1(4)/EA3. Builds request-manifest.json
from samples/request_encoding.py's own REQUESTS dict (the same module
the live driver imports) -- written and hashed BEFORE any network
call. No forbidden parameters (propertyName/sortBy/bbox/startIndex)
appear anywhere. No network.
"""
import hashlib
import json
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent

import sys  # noqa: E402
sys.path.insert(0, str(Path(__file__).resolve().parent))
from request_encoding import REQUESTS, HOST, ORDER, build_path, encode_query  # noqa: E402

FORBIDDEN_PARAMS = {"propertyName", "sortBy", "bbox", "startIndex"}


def main():
    entries = []
    total_cap = 0
    for request_id in ORDER:
        spec = REQUESTS[request_id]
        param_names = {k for k, v in spec["params"]}
        assert not (param_names & FORBIDDEN_PARAMS), f"{request_id} uses a forbidden parameter"
        encoded_query = encode_query(spec["params"])
        encoded_path = build_path(spec["path"], spec["params"])
        full_url = f"https://{HOST}{encoded_path}"
        entry = {
            "request_id": request_id,
            "host": HOST,
            "method": "GET",
            "path": spec["path"],
            "decoded_params": [{"key": k, "value": v} for k, v in spec["params"]],
            "encoded_query": encoded_query,
            "encoded_path": encoded_path,
            "full_url": full_url,
            "encoded_request_sha256": hashlib.sha256(full_url.encode("utf-8")).hexdigest(),
            "encode_function": "request_encoding.encode_query (urllib.parse.urlencode, quote_via=urllib.parse.quote)",
            "per_body_cap_bytes": spec["per_body_cap_bytes"],
            "max_calls": 1,
            "timeout_s_socket": 20,
            "wall_clock_cap_s": 20,
            "redirects_allowed": 0,
            "retries": 0,
            "tls_verify": True,
            "allow_insecure_for_local_test": False,
        }
        entries.append(entry)
        total_cap += spec["per_body_cap_bytes"]

    assert total_cap == 4718592, total_cap
    manifest = {
        "status": "ALL REQUESTS NOT_AUTHORISED until owner-authorisation.md is written and EA1's own gate is satisfied in full -- this file specifies, it does not itself authorise.",
        "host_allowlist": [HOST],
        "order": ORDER,
        "max_total_calls": 3,
        "max_total_bytes": 4718592,
        "max_bytes_per_response_default": None,
        "timeout_s_per_request_socket": 20,
        "wall_clock_cap_s_per_request": 20,
        "acquisition_window_minutes": 30,
        "retries": 0,
        "redirects_followed": 0,
        "requests": entries,
    }
    out_path = TASK_DIR / "request-manifest.json"
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
        f.write("\n")
    data = out_path.read_bytes()
    sha = hashlib.sha256(data).hexdigest()
    with open(TASK_DIR / "request-manifest.sha256", "w", encoding="utf-8", newline="\n") as f:
        f.write(f"{sha}  docs/ai/tasks/ticket-493-endpoint-acquisition/request-manifest.json\n")
    print(f"wrote {out_path.relative_to(REPO_ROOT).as_posix()} ({len(data)} B), sha256={sha}")
    for e in entries:
        print(" ", e["request_id"], e["encoded_path"], "cap=", e["per_body_cap_bytes"])
    print("total_cap_bytes:", total_cap)


if __name__ == "__main__":
    main()
