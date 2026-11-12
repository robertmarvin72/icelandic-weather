"""QA3: every test that launches cli_codex.py/cli_claude.py as a
subprocess must never inherit an ambient DEV_NOTIFY_* env var, and
must never let a fallback path (Path.home()) touch the real user
profile. Jonesy's sandbox review reproduced a real bug here: the
original test helper copied os.environ and only ADDED
DEV_NOTIFY_CHAINED_NOTIFY_CMD when a test explicitly wanted a chain --
it never REMOVED a pre-existing ambient value for tests that didn't.
After a real Phase B `setx`, every test that didn't explicitly ask
for chaining would have silently run the owner's own real chained
notify command (reproduced: 11 of 11 tests in test_cli_codex.py).
"""
import os

DEV_NOTIFY_ENV_PREFIX = "DEV_NOTIFY_"


def hermetic_env(tmp_dir: str, **overrides) -> dict:
    """Starts from a copy of the real environment (so PATH etc. still
    resolve for the subprocess), strips every `DEV_NOTIFY_*` var
    UNCONDITIONALLY, points `LOCALAPPDATA` and `HOME` at `tmp_dir`
    (covers both the Windows path and the Linux/macOS `Path.home()`
    fallback in `config.py`/`dispatch.py`), then applies `overrides`
    last -- so a test that wants a specific `DEV_NOTIFY_*` var set
    does so explicitly, never by ambient leakage from the real
    machine's own environment."""
    env = dict(os.environ)
    for key in list(env):
        if key.startswith(DEV_NOTIFY_ENV_PREFIX):
            del env[key]
    env["LOCALAPPDATA"] = tmp_dir
    env["HOME"] = tmp_dir
    env.update(overrides)
    return env
