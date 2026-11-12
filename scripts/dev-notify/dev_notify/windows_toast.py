"""Windows notification, stdlib-only (no pip/npm package) -- NT6.
Shells out to the OS's own powershell.exe (not a new dependency) to
reach WinRT ToastNotificationManager; falls back to a classic
System.Windows.Forms.NotifyIcon balloon tip if the toast call fails
or is UNSUPPORTED. Title/text are passed via environment variables,
never interpolated into the PowerShell command string, so no title/
text value (even if it somehow contained quotes or `$`) can affect
what the script executes.
"""
import os
import subprocess
from typing import Tuple

_TOAST_SCRIPT = r"""
$ErrorActionPreference = 'Stop'
try {
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime] | Out-Null
    $title = $env:DEV_NOTIFY_TITLE
    $text = $env:DEV_NOTIFY_TEXT
    $aumid = $env:DEV_NOTIFY_AUMID
    $xmlText = "<toast><visual><binding template='ToastGeneric'><text>$([System.Security.SecurityElement]::Escape($title))</text><text>$([System.Security.SecurityElement]::Escape($text))</text></binding></visual></toast>"
    $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
    $xml.LoadXml($xmlText)
    $toast = New-Object Windows.UI.Notifications.ToastNotification $xml
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($aumid).Show($toast)
    Write-Output "TOAST_OK"
} catch {
    Write-Output "TOAST_FAIL: $($_.Exception.Message)"
    exit 1
}
"""

_BALLOON_DISPLAY_MS = 4000

_BALLOON_SCRIPT = rf"""
$ErrorActionPreference = 'Stop'
try {{
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $title = $env:DEV_NOTIFY_TITLE
    $text = $env:DEV_NOTIFY_TEXT
    $notify = New-Object System.Windows.Forms.NotifyIcon
    $notify.Icon = [System.Drawing.SystemIcons]::Information
    $notify.Visible = $true
    $notify.BalloonTipTitle = $title
    $notify.BalloonTipText = $text
    $notify.ShowBalloonTip({_BALLOON_DISPLAY_MS})
    # The NotifyIcon (and its balloon) is torn down as soon as this
    # process exits -- a live #498 owner test (2026-11-11) found an
    # earlier 300ms sleep here cut the balloon off right as it
    # appeared, making it easy to miss entirely. Stay alive for the
    # balloon's own requested display duration instead.
    Start-Sleep -Milliseconds {_BALLOON_DISPLAY_MS}
    $notify.Dispose()
    Write-Output "BALLOON_OK"
}} catch {{
    Write-Output "BALLOON_FAIL: $($_.Exception.Message)"
    exit 1
}}
"""

DEFAULT_AUMID = "DevNotify.Ticket498"


def _run_powershell(script: str, title: str, text: str, timeout_s: float, aumid: str) -> Tuple[bool, str]:
    env = dict(os.environ)
    env["DEV_NOTIFY_TITLE"] = title
    env["DEV_NOTIFY_TEXT"] = text
    env["DEV_NOTIFY_AUMID"] = aumid
    try:
        proc = subprocess.run(
            ["powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
            capture_output=True, text=True, timeout=timeout_s, env=env,
        )
        ok = proc.returncode == 0 and "OK" in (proc.stdout or "")
        return ok, (proc.stdout or "") + (proc.stderr or "")
    except Exception as e:
        return False, f"EXCEPTION: {type(e).__name__}: {e}"


def send_windows_notification(title: str, text: str, timeout_s: float = 6.0, aumid: str = DEFAULT_AUMID,
                               runner=_run_powershell, prefer_toast: bool = False) -> dict:
    """Returns a result dict: {"method": "toast"|"balloon"|"none",
    "ok": bool, "detail": str}. Never raises -- a transport failure
    here must never affect the calling agent (dedup-rules.md).

    `prefer_toast` defaults to False: a live owner-run test on this
    feature's own target machine (2026-11-11, #498) found that the
    WinRT toast call reports success (`TOAST_OK`, no exception) for
    this unregistered script WITHOUT an actually-visible toast ever
    appearing -- a known Windows behavior where an unrecognized AUMID
    is silently accepted and the notification is dropped by the
    shell, not surfaced as an API failure. The balloon-tip fallback
    WAS confirmed visibly seen by the owner in that same test. Since
    there is no stdlib-only way to verify real toast rendering (the
    API's own non-throwing "success" is not trustworthy proof), the
    confirmed-working balloon path is tried FIRST by default. Set
    `prefer_toast=True` only after a real AUMID registration step
    (e.g. a Start Menu shortcut) makes toast's own success signal
    trustworthy again -- not implemented by #498, out of scope."""
    order = (("toast", _TOAST_SCRIPT), ("balloon", _BALLOON_SCRIPT)) if prefer_toast else (("balloon", _BALLOON_SCRIPT), ("toast", _TOAST_SCRIPT))
    attempts = {}
    for method, script in order:
        ok, detail = runner(script, title, text, timeout_s, aumid)
        attempts[method] = detail
        if ok:
            return {"method": method, "ok": True, "detail": detail}
    return {"method": "none", "ok": False, "detail": " ".join(f"{m}={d!r}" for m, d in attempts.items())}
