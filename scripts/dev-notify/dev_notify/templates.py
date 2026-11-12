"""Fixed status-text templates. See payload-allowlist.md -- status_text
is built ONLY from these templates, filled in only with agent/
project_alias/error_code. Never from raw event message content.
"""
from .events import EventCategory, NotifyEvent

_TEMPLATES = {
    EventCategory.COMPLETED: "{agent} finished a turn — {project_alias}",
    EventCategory.NEEDS_ATTENTION: "{agent} needs your attention — {project_alias}",
    EventCategory.FAILED: "{agent} turn failed ({error_code}) — {project_alias}",
}

_TITLES = {
    EventCategory.COMPLETED: "Run completed",
    EventCategory.NEEDS_ATTENTION: "Needs attention",
    EventCategory.FAILED: "Run failed",
}


def render(event: NotifyEvent) -> dict:
    template = _TEMPLATES[event.event_category]
    text = template.format(agent=event.agent.value, project_alias=event.project_alias, error_code=event.error_code or "unknown")
    title = _TITLES[event.event_category]
    return {"title": title, "text": text}
