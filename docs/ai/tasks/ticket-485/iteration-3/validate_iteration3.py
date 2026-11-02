"""#485 iteration-3 cross-document validation. Every check either passes
silently/prints PASS or raises AssertionError / calls sys.exit(1) -- no
"print a mismatch and exit 0" defect (the exact class #483's harness/05
and this ticket's own round-2 correction already fixed once; this script
re-applies the same discipline to the NEW iteration-3 deliverables).

Correction v4: extended with checks [6]-[8] below after Jonesy's review
found real secret-leak paths in client.py/do_fetch.py that this script's
original 5 checks never could have caught (they check document/ledger
consistency, not the client's source code). Passing this script does NOT
establish the client is safe for a keyed request -- see iteration-3/README.md
and the research-report/cc-report "Correction v4" sections for that finding.
This script itself makes zero network requests, offline-only, consistent
with approved-prompt-v4.md's ban on any network (including loopback) this
round.

Run with: python3 -B validate_iteration3.py
"""
import csv
import json
import os
import re
import sys

HERE = os.path.dirname(__file__)


def check_coverage_matches_geometry_output():
    print("[1] coverage-iteration-3.csv span0 lengths match geometry_analysis-output.txt ... ", end="")
    with open(os.path.join(HERE, "geometry_analysis-output.txt"), encoding="utf-8") as f:
        text = f.read()
    m_short = re.search(r"SHORTER-arc hypothetical scenario: ([\d.]+)m", text)
    m_long = re.search(r"LONGER-arc sensitivity: ([\d.]+)m", text)
    assert m_short and m_long, "RED: could not find span0 length figures in geometry_analysis-output.txt"
    short_m, long_m = float(m_short.group(1)), float(m_long.group(1))

    with open(os.path.join(HERE, "coverage-iteration-3.csv"), encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    span0 = [r for r in rows if r["span"] == "0"][0]
    csv_short_km = float(span0["oriented_length_km_shorter"])
    csv_long_km = float(span0["oriented_length_km_longer"])
    assert abs(csv_short_km * 1000 - short_m) < 1.0, (
        f"RED: coverage CSV shorter-arc length {csv_short_km}km disagrees with script output {short_m}m")
    assert abs(csv_long_km * 1000 - long_m) < 1.0, (
        f"RED: coverage CSV longer-arc length {csv_long_km}km disagrees with script output {long_m}m")
    print(f"PASS ({csv_short_km}km == {short_m}m, {csv_long_km}km == {long_m}m)")


def check_rings_are_closed():
    print("[2] both bridge rings are independently confirmed closed (not just asserted) ... ", end="")
    with open(os.path.join(HERE, "geometry_analysis-output.txt"), encoding="utf-8") as f:
        text = f.read()
    occurrences = text.count("closed ring verified: first vertex == last vertex")
    assert occurrences == 2, f"RED: expected exactly 2 independently-verified closed rings, found {occurrences}"
    print(f"PASS ({occurrences}/2 rings independently verified closed)")


def check_no_keyed_exchange_in_ledger():
    print("[3] zero keyed exchanges in the real ledger (key was absent -- must not silently appear) ... ", end="")
    with open(os.path.join(HERE, "samples", "ledger.json"), encoding="utf-8") as f:
        ledger = json.load(f)
    for att in ledger["attempts"]:
        assert "customer-api.open-meteo.com" not in att["url"], (
            f"RED: a keyed-host URL appears in the ledger despite the key being absent: {att['url']!r}")
    assert ledger["data"]["count"] == 0, f"RED: expected 0 data-class exchanges this round, got {ledger['data']['count']}"
    print(f"PASS (0 keyed-host attempts, {ledger['doc']['count']} doc / {ledger['data']['count']} data exchanges)")


def check_ceilings_respected():
    print("[4] ledger stayed within the frozen 4 data / 6 doc, 30min/180s ceilings ... ", end="")
    with open(os.path.join(HERE, "samples", "ledger.json"), encoding="utf-8") as f:
        ledger = json.load(f)
    assert ledger["data"]["count"] <= 4, f"RED: data count {ledger['data']['count']} exceeds cap 4"
    assert ledger["doc"]["count"] <= 6, f"RED: doc count {ledger['doc']['count']} exceeds cap 6"
    assert ledger["cumulative_wait_seconds"] <= 180, "RED: cumulative wait exceeded 180s cap"
    print(f"PASS (data {ledger['data']['count']}/4, doc {ledger['doc']['count']}/6, "
          f"wait {ledger['cumulative_wait_seconds']:.2f}/180s)")


def check_no_secret_in_any_retained_artifact():
    print("[5] no literal fake-test-key VALUE leaked into any retained non-source artifact ... ", end="")
    # The FAKE_KEY VALUE itself (not the bare parameter name "apikey=", which is a legitimate
    # identifier that appears in source code describing the mechanism, not a leaked secret).
    FAKE_KEY_VALUE = "FAKE-TEST-KEY-NOT-REAL-0000000000"
    # Source files that legitimately contain this literal as a defined constant, by design
    # (this validator's own source, and the self-test that defines it) -- excluded from the
    # sweep, which targets DATA/OUTPUT artifacts (samples, ledger, *-output.txt), not source.
    SELF_EXCLUDED = {"client_selftest.py", os.path.basename(__file__)}
    hits = []
    for root, _, files in os.walk(HERE):
        for fn in files:
            if fn in SELF_EXCLUDED:
                continue
            path = os.path.join(root, fn)
            try:
                with open(path, "rb") as f:
                    data = f.read()
            except (IsADirectoryError, PermissionError):
                continue
            if FAKE_KEY_VALUE.encode() in data:
                hits.append(path)
    assert not hits, f"RED: found the fake-key VALUE in retained artifact(s): {hits}"
    print("PASS (fake-key value absent from every retained data/output artifact and non-defining source file)")


def check_coverage_row_grades(rows):
    """Raises AssertionError (not a printed warning) on any violation --
    shared by the real-file check and the red/green demo below."""
    for r in rows:
        assert r["axis4_forecast"] == "NOT_TESTED", (
            f"span {r['span']} axis4_forecast is {r['axis4_forecast']!r}, expected NOT_TESTED (no key)")
        assert r["axis6_rights"] != "PASS", (
            f"span {r['span']} axis6_rights reads PASS -- standing owner-attestation gap not respected")
        assert r["axis1_direction"] != "PASS", (
            f"span {r['span']} axis1_direction reads PASS -- correction v4 (R5): no span this round has "
            f"freshly-verified circulation/travel-direction evidence, including spans 1-6 (inherited, "
            f"not re-derived this round)")
        assert r.get("axis5_keyed_safety_contract") != "PASS", (
            f"span {r['span']} axis5_keyed_safety_contract reads PASS -- correction v4 (R1/R2): the "
            f"forward-looking keyed-safety contract is NOT proven (confirmed leak paths in client.py/"
            f"do_fetch.py), must never read PASS")
        assert r.get("eta_route_status") == "HYPOTHETICAL_NOT_ROUTE_VALID", (
            f"span {r['span']} eta_route_status is {r.get('eta_route_status')!r}, expected "
            f"HYPOTHETICAL_NOT_ROUTE_VALID -- correction v4 (R5): no eta_route_utc value may be presented "
            f"as route-valid")


def check_axis_grades_everywhere():
    print("[6] axis1/4/5/6 grade caps + ETA-status label, real file ... ", end="")
    with open(os.path.join(HERE, "coverage-iteration-3.csv"), encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    check_coverage_row_grades(rows)
    print(f"PASS (all {len(rows)} spans: axis1/5/6 never PASS, axis4=NOT_TESTED, "
          f"eta_route_status=HYPOTHETICAL_NOT_ROUTE_VALID)")


def check_axis_grades_red_green_demo():
    """Correction v4 (Validation/deliverable): expected-RED mutations in a
    TASK-LOCAL copy of the CSV, then GREEN on the real file. No network."""
    print("[7] axis-grade cross-check -- expected-RED (corrupted copies) then GREEN (real file) ... ")
    real_path = os.path.join(HERE, "coverage-iteration-3.csv")
    with open(real_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        real_rows = list(reader)

    mutations = [
        ("axis1_direction", "PASS", "span 1 axis1_direction wrongly set to PASS"),
        ("axis5_keyed_safety_contract", "PASS", "span 0 axis5_keyed_safety_contract wrongly set to PASS"),
        ("eta_route_status", "VERIFIED", "span 0 eta_route_status wrongly claimed VERIFIED"),
        ("axis4_forecast", "PASS", "span 0 axis4_forecast wrongly set to PASS despite no key"),
    ]
    for field, bad_value, description in mutations:
        rows = [dict(r) for r in real_rows]
        rows[0][field] = bad_value  # mutate only the first data row -- enough to trip the check
        red_raised = False
        try:
            check_coverage_row_grades(rows)
        except AssertionError as e:
            red_raised = True
            msg = str(e)
        if not red_raised:
            print(f"    RED  FAIL -- {description} was NOT caught. Aborting with nonzero exit.")
            sys.exit(1)
        print(f"    RED  PASS: {description} correctly rejected ({msg[:80]})")

    check_coverage_row_grades(real_rows)  # must NOT raise
    print("    GREEN PASS: the real coverage-iteration-3.csv passes every grade-cap assertion cleanly")


def check_no_client_readiness_claimed():
    print("[8] no 'secret handling proven' / 'executed in full' / client-readiness claim remains ... ", end="")
    FORBIDDEN = ["secret handling proven", "executed in full", "ready for keyed",
                 "future keyed run needs no phase a", "client is ready"]
    hits = []
    for fn in ("README.md", "research-report-iteration-3.md", os.path.join("samples", "manifest-iteration-3.md"),
               os.path.join("..", "cc-report-iteration-3.md")):
        path = os.path.join(HERE, fn)
        if not os.path.exists(path):
            continue
        text = open(path, encoding="utf-8").read().lower()
        for phrase in FORBIDDEN:
            if phrase in text:
                hits.append((fn, phrase))
    assert not hits, f"RED: forbidden client-readiness claim(s) still present: {hits}"
    print("PASS (no forbidden readiness claim found in README/research-report/manifest)")


def main():
    check_coverage_matches_geometry_output()
    check_rings_are_closed()
    check_no_keyed_exchange_in_ledger()
    check_ceilings_respected()
    check_no_secret_in_any_retained_artifact()
    check_axis_grades_everywhere()
    check_axis_grades_red_green_demo()
    check_no_client_readiness_claimed()
    print("\nALL ITERATION-3 VALIDATION CHECKS PASS (exit 0).")


if __name__ == "__main__":
    main()
