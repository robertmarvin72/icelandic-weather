#!/usr/bin/env python3
"""
#499 base endpoints -- copy of ticket-493-endpoint-acquisition/samples/
build_manifest.py, scoped to this round's own two calls (S2-WGS84,
ACCESS-CAPABILITIES; E1 excluded, retained not re-fetched). Written
and hashed BEFORE any network call. No forbidden parameters
(propertyName/sortBy/bbox/startIndex) appear anywhere. No network.

Also verifies, before writing anything, that both retained entries'
own encoded_request_sha256 match the PRIOR request-manifest.json's
recorded values exactly -- proving the encoded URL is reused
verbatim, not re-derived from a new filter class (approved-prompt-v1.md
step 3's own explicit requirement).
"""
import hashlib
import json
import sys
from pathlib import Path

TASK_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TASK_DIR.parent.parent.parent.parent
PRIOR_MANIFEST = REPO_ROOT / "docs/ai/tasks/ticket-493-endpoint-acquisition/request-manifest.json"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from request_encoding import REQUESTS, HOST, ORDER, build_path, encode_query  # noqa: E402

FORBIDDEN_PARAMS = {"propertyName", "sortBy", "bbox", "startIndex"}


def main():
    prior = json.loads(PRIOR_MANIFEST.read_bytes())
    prior_by_id = {e["request_id"]: e for e in prior["requests"]}

    entries = []
    total_cap = 0
    for request_id in ORDER:
        spec = REQUESTS[request_id]
        param_names = {k for k, v in spec["params"]}
        assert not (param_names & FORBIDDEN_PARAMS), f"{request_id} uses a forbidden parameter"
        encoded_query = encode_query(spec["params"])
        encoded_path = build_path(spec["path"], spec["params"])
        full_url = f"https://{HOST}{encoded_path}"
        encoded_request_sha256 = hashlib.sha256(full_url.encode("utf-8")).hexdigest()

        prior_entry = prior_by_id[request_id]
        assert full_url == prior_entry["full_url"], (
            f"{request_id}: full_url differs from prior manifest -- "
            f"new={full_url!r} prior={prior_entry['full_url']!r}"
        )
        assert encoded_request_sha256 == prior_entry["encoded_request_sha256"], (
            f"{request_id}: encoded_request_sha256 differs from prior manifest -- "
            f"new={encoded_request_sha256} prior={prior_entry['encoded_request_sha256']}"
        )

        entry = {
            "request_id": request_id,
            "host": HOST,
            "method": "GET",
            "path": spec["path"],
            "decoded_params": [{"key": k, "value": v} for k, v in spec["params"]],
            "encoded_query": encoded_query,
            "encoded_path": encoded_path,
            "full_url": full_url,
            "encoded_request_sha256": encoded_request_sha256,
            "verbatim_reuse_of_prior_manifest": "docs/ai/tasks/ticket-493-endpoint-acquisition/request-manifest.json",
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

    assert total_cap == 4456448, total_cap
    manifest = {
        "status": "ALL REQUESTS NOT_AUTHORISED until the owner's own \"Prompt approved\" handoff on READY_FOR_CC -- this file specifies, it does not itself authorise.",
        "note": "S2-WGS84 and ACCESS-CAPABILITIES only; E1-WGS84 is retained from #493 and is NOT in this round's own call order -- its encoded_request_sha256 is cross-checked above but it is never requested.",
        "host_allowlist": [HOST],
        "order": ORDER,
        "max_total_calls": 2,
        "max_total_bytes": 4456448,
        "max_bytes_per_response_default": None,
        "timeout_s_per_request_socket": 20,
        "wall_clock_cap_s_per_request": 20,
        "acquisition_window_minutes": 10,
        "retries": 0,
        "redirects_followed": 0,
        "requests": entries,
    }
    out_path = TASK_DIR / "request-manifest.json"
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
        f.write("\n")
    manifest_sha = hashlib.sha256(out_path.read_bytes()).hexdigest()
    (TASK_DIR / "request-manifest.sha256").write_text(f"{manifest_sha}  request-manifest.json\n", encoding="utf-8", newline="\n")
    print("wrote", out_path, "sha256:", manifest_sha)
    print("verbatim-reuse check: PASSED for", ORDER)


if __name__ == "__main__":
    main()
