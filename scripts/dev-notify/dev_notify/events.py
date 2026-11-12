"""Closed event model. See docs/ai/tasks/ticket-498/payload-allowlist.md --
every field here is already on the allowlist; nothing else may be added
to NotifyEvent without updating that document first.
"""
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class EventCategory(str, Enum):
    COMPLETED = "COMPLETED"
    NEEDS_ATTENTION = "NEEDS_ATTENTION"
    FAILED = "FAILED"


class Agent(str, Enum):
    CC = "CC"
    RIPLEY = "Ripley"


class Surface(str, Enum):
    CLAUDE_CLI = "claude-cli"
    CLAUDE_VSCODE = "claude-vscode"
    CODEX_CLI = "codex-cli"
    CODEX_APP = "codex-app"


@dataclass(frozen=True)
class NotifyEvent:
    agent: Agent
    surface: Surface
    event_category: EventCategory
    project_alias: str
    discriminator: Optional[str] = None  # turn/prompt_id if the payload ever gives one; else None
    error_code: Optional[str] = None  # only for FAILED, a closed StopFailure.error value
    issue_number: Optional[int] = None

    def event_key(self) -> tuple:
        return (self.agent.value, self.surface.value, self.project_alias, self.event_category.value, self.discriminator)
