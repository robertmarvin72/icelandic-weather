"""#485 iteration-4 -- bounded secret-leak scanner. CORRECTION v6 (R3).

Checks a bounded piece of text/bytes for a known secret value in several
representations: raw, percent-encoded (any hex case), double percent-
encoded, and JSON/backslash-escaped. This is BOUNDED PROTECTION OF DEFINED
FORMS, not proof against all possible encodings -- stated explicitly, not
oversold.

Correction v6 (R3): the v5 version's `_safe_json_unescape` returned `None`
on ANY decode failure, and `contains_secret` then SKIPPED that layer
entirely for the WHOLE text -- so a single malformed/truncated escape
sequence anywhere in the text silently disabled detection of a perfectly
valid escaped secret elsewhere in the SAME text (Jonesy's reproduced
finding). Fixed to the explicit "UNDECIDABLE => refuse persistence" rule:
a decode failure at this layer is now treated as a POSITIVE match (fail
closed), never as "nothing to see here, move on." `StreamScanner` (v5,
unused by any real caller, and itself missed some split-offset cases) is
REMOVED -- the real caller (`pipeline.py`) now always scans the WHOLE,
already-capped (<=2MiB) reassembled body in one call, which needs no
cross-chunk-overlap logic at all, per the simpler option this round's
approved prompt explicitly allows.
"""
import codecs
import urllib.parse

UNDECIDABLE = object()  # sentinel: "could not be decoded one way or another" -- treated as a match, never skipped


def _safe_unquote(text):
    """percent-decode; on genuinely malformed escapes Python's unquote
    just leaves them alone rather than raising, which is fine here -- we
    are scanning for a MATCH, a failed/partial decode cannot hide one."""
    try:
        return urllib.parse.unquote(text, errors="strict")
    except Exception:
        return urllib.parse.unquote(text, errors="replace")


def _safe_json_unescape(text):
    """Backslash/JSON-style unescape. Returns UNDECIDABLE (never a plain
    `None` that a caller could mistake for 'nothing to check') on ANY
    decode error -- a caller must treat UNDECIDABLE as a match."""
    try:
        return codecs.decode(text, "unicode_escape")
    except Exception:
        return UNDECIDABLE


def contains_secret(text, secret, _depth=0, max_depth=3):
    """`text`: str. Returns True if `secret` appears in `text` under any
    of: raw, percent-decoded, double percent-decoded, or backslash/JSON-
    unescaped form. Recurses a BOUNDED number of times (max_depth) through
    decode layers. An UNDECIDABLE result at any layer (the JSON-unescape
    layer is the only one that can produce it) is treated as a match --
    fail closed, never silently skipped, so one malformed escape elsewhere
    in the text can never hide a real, validly-escaped secret."""
    if not secret:
        return False
    if secret in text:
        return True
    if _depth >= max_depth:
        return False
    # percent-decoded (handles any hex case, including mixed, since
    # urllib.parse.unquote itself is case-insensitive for %XX sequences)
    decoded = _safe_unquote(text)
    if decoded != text and contains_secret(decoded, secret, _depth + 1, max_depth):
        return True
    # backslash/JSON-escaped
    unescaped = _safe_json_unescape(text)
    if unescaped is UNDECIDABLE:
        return True  # fail closed -- this layer could not be ruled out
    if unescaped != text and contains_secret(unescaped, secret, _depth + 1, max_depth):
        return True
    return False


def contains_secret_bytes(data, secret_bytes):
    """Same, for raw bytes (e.g. a decoded response body) -- checked as
    latin1 text (lossless 1:1 byte<->codepoint mapping) so percent/escape
    decoding logic above can be reused without a real decode failure.
    Intended to be called ONCE on the whole, already-size-capped
    (<=2MiB, per the decoded-byte budget) reassembled body -- there is no
    separate streaming/chunked variant in this module any more (v5's
    `StreamScanner` was unused dead code and is removed)."""
    try:
        text = data.decode("latin1")
        secret = secret_bytes.decode("latin1")
    except Exception:
        return True  # undecidable -- fail closed, never silently pass
    return contains_secret(text, secret)
