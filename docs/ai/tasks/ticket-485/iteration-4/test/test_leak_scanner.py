"""#485 iteration-4 correction v6 (R3) -- persisted fail-closed scanner
regression tests. No network, no real secrets.
"""
import codecs
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import leak_scanner  # noqa: E402

SECRET = "MySecretKey123"


def test_malformed_escape_does_not_hide_a_real_escaped_secret():
    print("[leak_scanner 1] malformed \\x escape elsewhere does NOT hide a validly-escaped secret ... ", end="")
    escaped_secret = SECRET.replace("S", "\\u0053")
    text = "prefix \\x " + escaped_secret + " suffix"
    try:
        codecs.decode(text, "unicode_escape")
        print("RED FAIL -- test setup bug: no decode error raised")
        sys.exit(1)
    except Exception:
        pass  # confirmed malformed, as intended
    result = leak_scanner.contains_secret(text, SECRET)
    assert result is True, "RED: malformed escape elsewhere hid the real escaped-secret match (the v5 bug)"
    print("PASS")


def test_fully_undecidable_text_fails_closed():
    print("[leak_scanner 2] a wholly-undecidable escape sequence (no secret present at all) still fails closed ... ",
          end="")
    text = "just \\x a truncated escape, no secret anywhere"
    result = leak_scanner.contains_secret(text, SECRET)
    assert result is True, (
        "RED: an undecidable representation was treated as 'safe' instead of failing closed")
    print("PASS (correctly refused as undecidable, even though no real secret is present)")


def test_clean_text_still_passes_green():
    print("[leak_scanner 3] ordinary clean text with no malformed escapes and no secret: GREEN ... ", end="")
    result = leak_scanner.contains_secret("perfectly ordinary response text", SECRET)
    assert result is False, "RED: a clean, decidable text was wrongly flagged"
    print("PASS")


def test_raw_percent_double_percent_json_all_detected():
    print("[leak_scanner 4] raw / percent / double-percent / JSON-escaped forms all detected ... ", end="")
    import json
    import urllib.parse
    assert leak_scanner.contains_secret(f"x={SECRET}", SECRET)
    enc = urllib.parse.quote(SECRET, safe="")
    assert leak_scanner.contains_secret(f"x={enc}", SECRET)
    double = urllib.parse.quote(enc, safe="")
    assert leak_scanner.contains_secret(f"x={double}", SECRET)
    assert leak_scanner.contains_secret(json.dumps(SECRET), SECRET)
    print("PASS")


def test_stream_scanner_removed():
    print("[leak_scanner 5] StreamScanner (unused in v5, misleading) is REMOVED, not merely unused ... ", end="")
    assert not hasattr(leak_scanner, "StreamScanner"), (
        "RED: StreamScanner still exists -- it should have been removed per the approved correction")
    print("PASS")


def main():
    test_malformed_escape_does_not_hide_a_real_escaped_secret()
    test_fully_undecidable_text_fails_closed()
    test_clean_text_still_passes_green()
    test_raw_percent_double_percent_json_all_detected()
    test_stream_scanner_removed()
    print("\nALL LEAK-SCANNER REGRESSION TESTS PASS (exit 0).")


if __name__ == "__main__":
    main()
