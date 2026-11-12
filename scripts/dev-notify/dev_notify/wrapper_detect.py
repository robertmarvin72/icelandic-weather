"""CG2 (2026-11-12): one small, shared, FAIL-CLOSED helper for
deciding whether a notify-command argv list refers to our own
`cli_codex.py` wrapper. Used identically by three surfaces so they
can never disagree about what counts as "the wrapper":

  - `apply_config_patch.py` -- refuses to persist/write when the
    CURRENT config's `notify` already points at the wrapper
    (RE1/CG2's own "already_patched" guard).
  - `cli_codex.py` -- refuses to chain (never spawns `Popen`) when the
    CHAIN command it was given points at the wrapper (RE1's runtime
    guard, CG3's "top-level run" case).
  - `diagnostic_dry_run.py` -- reports `chain_points_to_wrapper`
    read-only, never the value itself.

RE1's own repro: a second `apply` on an already-patched config reads
the CURRENT `notify` value (now the wrapper itself) as "the old
command to chain to" and persists THAT as the chain value -- a
different python interpreter path, different case, or `\\` vs `/`
was enough to defeat a naive exact-string comparison, so this
normalizes aggressively and is deliberately conservative: an
AMBIGUOUS or malformed shape is treated as "yes, this is (or might
be) the wrapper" -- never as "safe." A caller that wants to proceed
anyway must do so explicitly (e.g. via `rollback` + a fresh `plan`),
never by this helper silently waving it through.

Known, accepted limitation (documented, not fixed): an UNRELATED
command whose text happens to contain the substring `cli_codex.py`
(e.g. a comment or an unrelated path) will also be flagged -- a false
positive, which is the safe direction to be wrong in. There is no
automatic "I promise this is fine" override; the stated remedy is
`rollback --backup <path>` followed by a fresh `plan`/`apply`, never
a forced bypass.

PS3 (2026-11-12): `classify_argv()` added to distinguish WHY
something was flagged -- `"wrapper"` (a genuine basename/substring
match) vs. `"ambiguous"` (a malformed/unparseable shape that isn't
actually identified as the wrapper, just unconfirmable) vs. `"ok"`
(confirmed safe). This exists ONLY to pick clearer reason text for a
caller's own error message (e.g. `apply_config_patch.py` reporting
`already_patched` for a genuine wrapper match vs.
`notify_ambiguous_or_wrapper` for an ambiguous shape like a legitimate
old command with a stray empty argv element) -- `is_wrapper_argv()`'s
own fail-closed True/False contract is UNCHANGED for every existing
caller (`classify_argv(argv) != "ok"`): both `"wrapper"` and
`"ambiguous"` still block identically everywhere this helper is used.
"""
from typing import Any, List

WRAPPER_BASENAME = "cli_codex.py"


def _normalize(s: str) -> str:
    return s.replace("\\", "/").strip().strip('"').strip("'").lower()


def _classify_item(item: Any) -> str:
    """Returns `"wrapper"`, `"ambiguous"`, or `"ok"` for ONE argv
    element."""
    if not isinstance(item, str):
        return "ambiguous"
    norm = _normalize(item)
    if not norm:
        return "ambiguous"
    if norm == WRAPPER_BASENAME or norm.endswith("/" + WRAPPER_BASENAME):
        return "wrapper"
    if WRAPPER_BASENAME in norm:  # substring match -- e.g. a single `cmd /c "...\cli_codex.py"` element
        return "wrapper"
    return "ok"


def classify_argv(argv: Any) -> str:
    """Returns `"wrapper"`, `"ambiguous"`, or `"ok"` for the WHOLE
    argv list -- `"wrapper"` takes precedence over `"ambiguous"` if
    both appear (a definite match is reported as a definite match
    even if another element is merely unparseable)."""
    if not isinstance(argv, list) or not argv:
        return "ambiguous"
    classifications: List[str] = [_classify_item(item) for item in argv]
    if "wrapper" in classifications:
        return "wrapper"
    if "ambiguous" in classifications:
        return "ambiguous"
    return "ok"


def is_wrapper_argv(argv: Any) -> bool:
    """Returns True if `argv` looks like it refers to our own
    `cli_codex.py` wrapper, OR if its shape is ambiguous enough that
    it cannot be confirmed safe (fail-closed: ambiguous -> True,
    never False). `argv` is expected to be a list of strings (a
    notify/chain command); anything else is itself suspicious.
    Equivalent to `classify_argv(argv) != "ok"` -- kept as a simple
    boolean for callers (`cli_codex.py`'s runtime guard) that only
    ever need "block or don't," never the reason why."""
    return classify_argv(argv) != "ok"
