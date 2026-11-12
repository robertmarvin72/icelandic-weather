import unittest

from dev_notify.adapters import codex_adapter
from dev_notify.events import EventCategory


class TestCodexAdapter(unittest.TestCase):
    def test_any_dict_payload_classifies_as_completed(self):
        cat, disc, err = codex_adapter.classify({"anything": "at all", "we": "dont know the real shape"})
        self.assertEqual(cat, EventCategory.COMPLETED)
        self.assertIsNone(disc)
        self.assertIsNone(err)

    def test_empty_dict_still_classifies_as_completed(self):
        cat, _, _ = codex_adapter.classify({})
        self.assertEqual(cat, EventCategory.COMPLETED)

    def test_list_payload_still_classifies_as_completed(self):
        # The real shape is unconfirmed (audit-report.md); this adapter
        # deliberately does not reject non-dict JSON, since rejecting it
        # would itself be an assumption about a schema we were told not
        # to invent.
        cat, _, _ = codex_adapter.classify([1, 2, 3])
        self.assertEqual(cat, EventCategory.COMPLETED)

    def test_never_produces_needs_attention_or_failed(self):
        # Confirmed structural property (RN5, VERIFIED_FROM_CODE): the
        # legacy_notify ABI has exactly one enum variant, fired only
        # from HookEvent::AfterAgent -- it cannot signal attention/failure.
        for payload in ({"error": "boom"}, {"type": "permission"}, {"status": "failed"}):
            cat, _, _ = codex_adapter.classify(payload)
            self.assertEqual(cat, EventCategory.COMPLETED)

    def test_confirmed_agent_turn_complete_shape_uses_turn_id_as_discriminator(self):
        payload = {
            "type": "agent-turn-complete", "thread-id": "b5f6c1c2-1111-2222-3333-444455556666",
            "turn-id": "12345", "cwd": "/home/user/project", "client": "codex-tui",
            "input-messages": ["hi"], "last-assistant-message": "done",
        }
        cat, disc, err = codex_adapter.classify(payload)
        self.assertEqual(cat, EventCategory.COMPLETED)
        self.assertEqual(disc, "12345")
        self.assertIsNone(err)

    def test_confirmed_shape_with_non_string_turn_id_has_no_discriminator(self):
        payload = {"type": "agent-turn-complete", "turn-id": 12345}
        cat, disc, _ = codex_adapter.classify(payload)
        self.assertEqual(cat, EventCategory.COMPLETED)
        self.assertIsNone(disc)

    def test_confirmed_shape_missing_turn_id_has_no_discriminator(self):
        payload = {"type": "agent-turn-complete"}
        cat, disc, _ = codex_adapter.classify(payload)
        self.assertEqual(cat, EventCategory.COMPLETED)
        self.assertIsNone(disc)

    def test_extract_cwd_from_confirmed_shape(self):
        self.assertEqual(codex_adapter.extract_cwd({"type": "agent-turn-complete", "cwd": "/a/b"}), "/a/b")

    def test_extract_cwd_missing_or_wrong_type_returns_none(self):
        self.assertIsNone(codex_adapter.extract_cwd({"cwd": 123}))
        self.assertIsNone(codex_adapter.extract_cwd({}))
        self.assertIsNone(codex_adapter.extract_cwd([1, 2, 3]))
        self.assertIsNone(codex_adapter.extract_cwd("not a dict"))


if __name__ == "__main__":
    unittest.main()
