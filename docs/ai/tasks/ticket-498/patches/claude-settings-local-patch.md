# Concrete dry-run patch preview — `.claude/settings.local.json` (NT1/NT7)

Generated 2026-11-12T19:30:33Z by
`generate_patch_previews.py`, calling `dev_notify.apply_config_patch.plan_claude()`
read-only against the REAL current `.claude/settings.local.json` (safe:
contains only `gh` CLI permissions, no secrets, already confirmed
gitignored — see audit-report.md). This is a **plan only** — nothing
was written. `before_sha256` is the real current file's hash; re-run
the generator to confirm it still matches before using this preview.

Activating this patch for real (Phase B) requires `apply_config_patch.py
claude apply --apply`, which itself still only runs with the owner's
separate dated activation record per NT1 — this file alone authorizes
nothing.

`<PYTHON_EXE>` must be replaced with the real Python
interpreter (e.g. an absolute path, since hook commands don't
necessarily inherit a dev shell's PATH) during that B activation step.

- before_sha256: `b15d8c59f1d007aaf0caa516fc90f5e20be7f28aebf251c52ad40a10e84bc5b0`
- after_preview_sha256: `e0f86dca509ed4c85b5b8ca3cfaaeb2136a7ca2655201c03ad88030d8c890d74`
- no_op: `False`

```diff
--- .claude/settings.local.json
+++ .claude/settings.local.json (planned)
@@ -4,5 +4,43 @@
       "Bash(gh project:*)",
       "Bash(gh auth:*)"
     ]
+  },
+  "hooks": {
+    "Notification": [
+      {
+        "hooks": [
+          {
+            "type": "command",
+            "command": "\"<PYTHON_EXE>\" \"${CLAUDE_PROJECT_DIR}/scripts/dev-notify/dev_notify/cli_claude.py\"",
+            "timeout": 10,
+            "async": true
+          }
+        ]
+      }
+    ],
+    "Stop": [
+      {
+        "hooks": [
+          {
+            "type": "command",
+            "command": "\"<PYTHON_EXE>\" \"${CLAUDE_PROJECT_DIR}/scripts/dev-notify/dev_notify/cli_claude.py\"",
+            "timeout": 10,
+            "async": true
+          }
+        ]
+      }
+    ],
+    "StopFailure": [
+      {
+        "hooks": [
+          {
+            "type": "command",
+            "command": "\"<PYTHON_EXE>\" \"${CLAUDE_PROJECT_DIR}/scripts/dev-notify/dev_notify/cli_claude.py\"",
+            "timeout": 10,
+            "async": true
+          }
+        ]
+      }
+    ]
   }
 }
```
