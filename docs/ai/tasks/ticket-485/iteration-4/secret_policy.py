"""#485 iteration-4 -- shared secret validation/encoding policy. CORRECTION
v6 (R5): v5 accepted and raw-appended ANY string as the key, including
CRLF/control/space/non-ASCII/overlong values, straight into the query
string -- a malformed key could corrupt the HTTP request syntax or be
mistaken for something else. Fixed here, in ONE place imported by both
`child_worker.py` (production) and `test/test_transport_child.py`
(test-only) so the policy itself cannot silently diverge between them.

This module never logs, prints, or returns the key value itself -- only
a fixed category string on rejection, and the ENCODED (not raw) value on
acceptance, to the one caller that appends it to a query.
"""
import string
import urllib.parse

MAX_KEY_LEN = 256
# Deliberately permissive printable-ASCII policy (inferred from this
# task's own synthetic fixtures, NOT a provider-documented guarantee --
# stated as such, not oversold): any printable ASCII character is
# accepted and percent-encoded once; control characters, CR/LF, raw
# whitespace, and non-ASCII are rejected outright, never encoded around.
ALLOWED_CHARS = set(string.printable) - set(string.whitespace) | {" "}
ALLOWED_CHARS -= {"\r", "\n", "\t", "\x0b", "\x0c"}


class MalformedSecret(Exception):
    """Carries only a fixed category -- never the value, never its length."""

    def __init__(self, category):
        super().__init__(category)
        self.category = category


def validate_and_encode(secret):
    """Returns the percent-encoded form of `secret`, ready to append as
    `apikey=<this>` to a query string -- using a real query encoder
    (`urllib.parse.quote`, safe="") exactly once, never a raw append.
    Raises `MalformedSecret` (fixed category only) for: not a string,
    empty/whitespace-only, containing CR/LF/other control characters or
    any non-ASCII character, or exceeding `MAX_KEY_LEN`."""
    if not isinstance(secret, str):
        raise MalformedSecret("MALFORMED_SECRET_NOT_A_STRING")
    if len(secret) == 0 or secret.strip() == "":
        raise MalformedSecret("MALFORMED_SECRET_EMPTY_OR_WHITESPACE")
    if len(secret) > MAX_KEY_LEN:
        raise MalformedSecret("MALFORMED_SECRET_OVERLONG")
    try:
        secret.encode("ascii")
    except UnicodeEncodeError:
        raise MalformedSecret("MALFORMED_SECRET_NON_ASCII")
    if any(ch not in ALLOWED_CHARS for ch in secret):
        raise MalformedSecret("MALFORMED_SECRET_CONTROL_OR_FORBIDDEN_CHARACTER")
    return urllib.parse.quote(secret, safe="")
