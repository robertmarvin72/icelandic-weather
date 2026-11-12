import unittest

from dev_notify.events import Agent, EventCategory, NotifyEvent, Surface
from dev_notify import templates


class TestTemplates(unittest.TestCase):
    def test_completed_template(self):
        event = NotifyEvent(agent=Agent.CC, surface=Surface.CLAUDE_CLI, event_category=EventCategory.COMPLETED, project_alias="myproj")
        r = templates.render(event)
        self.assertEqual(r["text"], "CC finished a turn — myproj")
        self.assertEqual(r["title"], "Run completed")

    def test_failed_template_includes_error_code(self):
        event = NotifyEvent(agent=Agent.RIPLEY, surface=Surface.CODEX_CLI, event_category=EventCategory.FAILED, project_alias="myproj", error_code="rate_limit")
        r = templates.render(event)
        self.assertIn("rate_limit", r["text"])
        self.assertIn("Ripley", r["text"])

    def test_failed_template_without_error_code_uses_unknown(self):
        event = NotifyEvent(agent=Agent.CC, surface=Surface.CLAUDE_CLI, event_category=EventCategory.FAILED, project_alias="myproj")
        r = templates.render(event)
        self.assertIn("unknown", r["text"])


if __name__ == "__main__":
    unittest.main()
