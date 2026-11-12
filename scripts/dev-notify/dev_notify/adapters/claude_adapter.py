"""Claude Code hook adapter. See docs/ai/tasks/ticket-498/audit-report.md
for the exact, docs-confirmed schema this classification is built from.

Deliberately registered ONLY for Notification, Stop, and StopFailure
(see audit-report.md "Design decisions") -- never PermissionRequest,
never SessionEnd. This module does not know or care which hooks are
actually registered; it only classifies whatever hook_event_name it
is given, and the CLI entrypoint (cli_claude.py) is the only place
that ever runs with exit code 0 regardless of outcome (NT3a).
"""
from typing import Optional, Tuple

from ..events import EventCategory

# Closed mapping -- a notification_type not in this dict is NOT an
# event #498 ever sends a notification for (payload-allowlist.md).
_NOTIFICATION_TYPE_MAP = {
    "permission_prompt": EventCategory.NEEDS_ATTENTION,
    "agent_needs_input": EventCategory.NEEDS_ATTENTION,
    "agent_completed": EventCategory.COMPLETED,
    "idle_prompt": EventCategory.COMPLETED,
    # Deliberately NOT mapped (no notification sent for these):
    # auth_success, auth_storage_failure, elicitation_dialog,
    # elicitation_url_dialog, elicitation_complete, elicitation_response,
    # quota_auto_resume_fired, quota_auto_resume_stale,
    # quota_auto_resume_disabled, plugin_notification.
}

_STOPFAILURE_ERROR_VALUES = {
    "rate_limit", "overloaded", "authentication_failed", "oauth_org_not_allowed",
    "account_on_hold", "billing_error", "invalid_request", "model_not_found",
    "server_error", "max_output_tokens", "cloud_credential_error", "unknown",
}


def _common_discriminator(payload: dict) -> Optional[str]:
    """RN6(b) correction: `prompt_id` IS one of Claude Code's own
    COMMON input fields (present on every hook event's JSON, not a
    Stop-specific field) -- VERIFIED_FROM_DOCS, `https://code.claude.com/
    docs/en/hooks`, "Common input fields" table, read 2026-11-12:
    "UUID identifying the user prompt currently being processed...
    Absent until the first user input." The original audit-report.md
    only checked Stop's own event-specific extra fields and missed
    this common one, leading to a documented, unresolved discrepancy
    (result-review.md RN6b). Using it (when present) as the dedup
    discriminator is strictly better than the pure sliding-time-window
    fallback: two genuinely different prompts/turns within the same
    75s window are no longer merged into one notification."""
    prompt_id = payload.get("prompt_id")
    return prompt_id if isinstance(prompt_id, str) and prompt_id else None


def classify(payload: dict) -> Optional[Tuple[EventCategory, Optional[str], Optional[str]]]:
    """Returns (event_category, discriminator, error_code) or None if
    this payload maps to no notification at all. `payload` must already
    be parsed JSON (a dict) -- the caller handles malformed input."""
    if not isinstance(payload, dict):
        return None
    hook_event_name = payload.get("hook_event_name")
    discriminator = _common_discriminator(payload)

    if hook_event_name == "Notification":
        notification_type = payload.get("notification_type")
        # RN2: a non-string, unhashable notification_type (e.g. a list
        # or dict) previously raised an uncaught TypeError from dict.get()
        # -- found 2026-11-11 by independent sandbox review. Any non-str
        # value is simply never in this closed mapping.
        category = _NOTIFICATION_TYPE_MAP.get(notification_type) if isinstance(notification_type, str) else None
        if category is None:
            return None
        return category, discriminator, None

    if hook_event_name == "Stop":
        # Falls back to the sliding time window alone (dedup-rules.md)
        # only when prompt_id is genuinely absent (e.g. before the
        # first user input) -- see _common_discriminator above.
        return EventCategory.COMPLETED, discriminator, None

    if hook_event_name == "StopFailure":
        error = payload.get("error")
        # Same RN2 fix: `in` on a set also raises for an unhashable type.
        error_code = error if isinstance(error, str) and error in _STOPFAILURE_ERROR_VALUES else "unknown"
        return EventCategory.FAILED, discriminator, error_code

    return None  # any other hook_event_name: not one we classify, ever
