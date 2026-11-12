import unittest

from dev_notify.adapters import claude_adapter
from dev_notify.events import EventCategory


class TestClaudeAdapter(unittest.TestCase):
    def test_notification_permission_prompt_is_needs_attention(self):
        payload = {"hook_event_name": "Notification", "notification_type": "permission_prompt", "message": "x", "title": "y"}
        cat, disc, err = claude_adapter.classify(payload)
        self.assertEqual(cat, EventCategory.NEEDS_ATTENTION)
        self.assertIsNone(disc)
        self.assertIsNone(err)

    def test_notification_agent_needs_input_is_needs_attention(self):
        payload = {"hook_event_name": "Notification", "notification_type": "agent_needs_input"}
        cat, _, _ = claude_adapter.classify(payload)
        self.assertEqual(cat, EventCategory.NEEDS_ATTENTION)

    def test_notification_agent_completed_is_completed(self):
        payload = {"hook_event_name": "Notification", "notification_type": "agent_completed"}
        cat, _, _ = claude_adapter.classify(payload)
        self.assertEqual(cat, EventCategory.COMPLETED)

    def test_notification_idle_prompt_is_completed(self):
        payload = {"hook_event_name": "Notification", "notification_type": "idle_prompt"}
        cat, _, _ = claude_adapter.classify(payload)
        self.assertEqual(cat, EventCategory.COMPLETED)

    def test_notification_unmapped_types_produce_no_event(self):
        for nt in ("auth_success", "auth_storage_failure", "elicitation_dialog", "elicitation_url_dialog",
                   "elicitation_complete", "elicitation_response", "quota_auto_resume_fired",
                   "quota_auto_resume_stale", "quota_auto_resume_disabled", "plugin_notification", "something_new_and_unknown"):
            payload = {"hook_event_name": "Notification", "notification_type": nt}
            self.assertIsNone(claude_adapter.classify(payload), f"{nt} should not produce an event")

    def test_stop_is_completed_with_no_discriminator(self):
        payload = {"hook_event_name": "Stop", "stop_hook_active": False, "last_assistant_message": "done", "session_id": "abc"}
        cat, disc, err = claude_adapter.classify(payload)
        self.assertEqual(cat, EventCategory.COMPLETED)
        self.assertIsNone(disc)

    def test_stopfailure_is_failed_with_known_error_code(self):
        payload = {"hook_event_name": "StopFailure", "error": "rate_limit", "error_details": "429"}
        cat, disc, err = claude_adapter.classify(payload)
        self.assertEqual(cat, EventCategory.FAILED)
        self.assertEqual(err, "rate_limit")

    def test_stopfailure_unknown_error_value_falls_back_to_unknown(self):
        payload = {"hook_event_name": "StopFailure", "error": "something_not_in_the_closed_set"}
        cat, disc, err = claude_adapter.classify(payload)
        self.assertEqual(cat, EventCategory.FAILED)
        self.assertEqual(err, "unknown")

    def test_permissionrequest_event_never_classified(self):
        # This adapter must NEVER be registered for PermissionRequest,
        # but if it somehow received one, it must not produce a
        # notification -- never interact with that event's decision
        # channel in any way.
        payload = {"hook_event_name": "PermissionRequest", "tool_name": "Bash"}
        self.assertIsNone(claude_adapter.classify(payload))

    def test_sessionend_never_classified(self):
        payload = {"hook_event_name": "SessionEnd", "reason": "clear"}
        self.assertIsNone(claude_adapter.classify(payload))

    def test_unknown_hook_event_name_produces_no_event(self):
        payload = {"hook_event_name": "SomeFutureEventWeDontKnowAbout"}
        self.assertIsNone(claude_adapter.classify(payload))

    def test_non_dict_payload_produces_no_event(self):
        self.assertIsNone(claude_adapter.classify(["not", "a", "dict"]))
        self.assertIsNone(claude_adapter.classify("a string"))
        self.assertIsNone(claude_adapter.classify(None))

    def test_missing_fields_do_not_raise(self):
        self.assertIsNone(claude_adapter.classify({}))
        self.assertIsNone(claude_adapter.classify({"hook_event_name": "Notification"}))

    def test_RN2_unhashable_notification_type_does_not_raise(self):
        """Previously raised TypeError: unhashable type from
        dict.get(notification_type) when notification_type was a list
        or dict -- found 2026-11-11 by independent sandbox review."""
        for hostile in (["permission_prompt"], {"a": 1}, 123, 3.14, True):
            result = claude_adapter.classify({"hook_event_name": "Notification", "notification_type": hostile})
            self.assertIsNone(result, f"hostile notification_type {hostile!r} must classify to no event, not raise")

    def test_RN2_unhashable_stopfailure_error_does_not_raise(self):
        """Previously raised TypeError: unhashable type from
        `error in _STOPFAILURE_ERROR_VALUES` when error was a list or dict."""
        for hostile in (["rate_limit"], {"code": "rate_limit"}, 123, 3.14, True):
            cat, disc, err = claude_adapter.classify({"hook_event_name": "StopFailure", "error": hostile})
            self.assertEqual(cat, EventCategory.FAILED)
            self.assertEqual(err, "unknown", f"hostile error {hostile!r} must fall back to 'unknown', not raise")

    def test_RN2_hostile_hook_event_name_does_not_raise(self):
        for hostile in (123, ["Stop"], {"a": 1}, None, 3.14):
            self.assertIsNone(claude_adapter.classify({"hook_event_name": hostile}))

    # --- RN6(b): prompt_id IS a common input field, used as discriminator ---

    def test_RN6b_stop_uses_prompt_id_as_discriminator_when_present(self):
        payload = {"hook_event_name": "Stop", "prompt_id": "abc-123-uuid", "stop_hook_active": False}
        cat, disc, _ = claude_adapter.classify(payload)
        self.assertEqual(cat, EventCategory.COMPLETED)
        self.assertEqual(disc, "abc-123-uuid")

    def test_RN6b_notification_uses_prompt_id_as_discriminator_when_present(self):
        payload = {"hook_event_name": "Notification", "notification_type": "idle_prompt", "prompt_id": "xyz-789"}
        cat, disc, _ = claude_adapter.classify(payload)
        self.assertEqual(cat, EventCategory.COMPLETED)
        self.assertEqual(disc, "xyz-789")

    def test_RN6b_stopfailure_uses_prompt_id_as_discriminator_when_present(self):
        payload = {"hook_event_name": "StopFailure", "error": "rate_limit", "prompt_id": "pid-1"}
        cat, disc, err = claude_adapter.classify(payload)
        self.assertEqual(cat, EventCategory.FAILED)
        self.assertEqual(disc, "pid-1")
        self.assertEqual(err, "rate_limit")

    def test_RN6b_missing_prompt_id_falls_back_to_none(self):
        # Absent until the first user input (VERIFIED_FROM_DOCS) -- a
        # genuinely missing prompt_id must fall back cleanly, not raise.
        cat, disc, _ = claude_adapter.classify({"hook_event_name": "Stop"})
        self.assertEqual(cat, EventCategory.COMPLETED)
        self.assertIsNone(disc)

    def test_RN6b_hostile_prompt_id_type_falls_back_to_none(self):
        for hostile in (123, ["x"], {"a": 1}, ""):
            cat, disc, _ = claude_adapter.classify({"hook_event_name": "Stop", "prompt_id": hostile})
            self.assertEqual(cat, EventCategory.COMPLETED)
            self.assertIsNone(disc, f"hostile prompt_id {hostile!r} must fall back to None, not raise or pass through")


if __name__ == "__main__":
    unittest.main()
