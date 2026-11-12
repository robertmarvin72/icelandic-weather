"""Codex `notify` adapter.

RN5 correction (2026-11-12): the previous round treated the payload
shape and delivery mechanism as UNKNOWN/INFERRED-from-memory. Both are
now VERIFIED_FROM_CODE, read directly from the primary Codex source
(read-only GET, per CV3(a)'s approved scope -- no clone/install/exec):

- Delivery mechanism: `codex-rs/hooks/src/legacy_notify.rs`, function
  `notify_hook` -- `command.arg(notify_payload)` appends the JSON as
  the FINAL argv argument; `.stdin(Stdio::null())` closes the child's
  stdin. The payload is NEVER delivered via stdin for this mechanism.
- Payload shape: the `UserNotification` enum, `#[serde(tag = "type",
  rename_all = "kebab-case")]`, with exactly ONE variant,
  `AgentTurnComplete`, fields `thread-id`, `turn-id`, `cwd`,
  `client` (optional), `input-messages`, `last-assistant-message`
  (optional). Fired from `HookEvent::AfterAgent` only -- there is no
  other variant, so this mechanism structurally cannot ever signal a
  NEEDS_ATTENTION/FAILED case; COMPLETED-only is now a confirmed
  property of the ABI, not a conservative fallback for an unknown one.
- Both read from https://raw.githubusercontent.com/openai/codex/ at
  commit b4b58be951a4fcbbda5cf50d48dcd7d4d8a41533 (tag
  rust-v0.167.0-alpha.3.2 -- the EXACT installed local version, not
  just `main`; confirmed by an identical blob SHA
  5be7d7b32ee13572cd9c0f9af276bb5b083f7159 at both refs), 2026-11-12.
- `environment` passed to the spawned notify command comes from
  `std::env::vars_os()` captured once by Codex's own process at hooks-
  registry construction (`codex-rs/hooks/src/registry.rs`), then
  `env_clear()` + `envs(environment)` on the child -- the child's env
  is a full REPLACEMENT with that snapshot, not the parent shell's
  live environment. This is why a persistent user-level env var (the
  Phase B `DEV_NOTIFY_CHAINED_NOTIFY_CMD` chaining mechanism) requires
  Codex itself to have been started/restarted AFTER the var was set --
  already documented as a known limitation in docs/dev/dev-notify-setup.md,
  now with the exact code-level reason.

Boundary this verification does NOT cover: whether the Codex **app**
(as opposed to the CLI binary) invokes `notify` through this exact
same code path, and whether a future Codex release changes this ABI --
both remain UNKNOWN/to be confirmed per-surface at Phase B (NT3d).
"""
from typing import Optional, Tuple

from ..events import EventCategory

CODEX_LEGACY_NOTIFY_SOURCE_REF = (
    "https://raw.githubusercontent.com/openai/codex/"
    "b4b58be951a4fcbbda5cf50d48dcd7d4d8a41533/codex-rs/hooks/src/legacy_notify.rs"
)


def classify(payload) -> Optional[Tuple[EventCategory, Optional[str], Optional[str]]]:
    """`payload` is whatever `json.loads` returned for the LAST argv
    argument (the confirmed delivery path -- see module docstring).
    Returns (category, discriminator, error_code).

    For the confirmed `agent-turn-complete` shape, `turn-id` is used
    as the dedup discriminator (a real per-turn id, strictly better
    than the pure sliding-time-window fallback other surfaces need).
    Any other shape -- a dict without the expected keys, a scalar, a
    list, anything -- still classifies as COMPLETED (the ABI has no
    other variant) but WITHOUT a discriminator, since we cannot trust
    an unverified field name from an unrecognized shape."""
    if isinstance(payload, dict) and payload.get("type") == "agent-turn-complete":
        turn_id = payload.get("turn-id")
        discriminator = turn_id if isinstance(turn_id, str) and turn_id else None
        return EventCategory.COMPLETED, discriminator, None
    return EventCategory.COMPLETED, None, None


def extract_cwd(payload) -> Optional[str]:
    """The confirmed shape carries its own `cwd` field (the thread's
    actual working directory, serialized from `payload.cwd.display()`
    on the Rust side) -- this is strictly more reliable for project
    filtering than `PWD`/`os.getcwd()` in the spawned child, whose
    environment Codex fully replaces (see module docstring) and whose
    own process cwd is not guaranteed to be the Codex session's cwd."""
    if isinstance(payload, dict):
        cwd = payload.get("cwd")
        if isinstance(cwd, str) and cwd:
            return cwd
    return None
