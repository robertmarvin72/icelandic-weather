"""Windows DPAPI secret storage via ctypes -- no pip package (NT6).
Uses CryptProtectData/CryptUnprotectData (advapi32/crypt32), scoped to
the CURRENT USER (no CRYPTPROTECT_LOCAL_MACHINE flag), so the stored
blob is only ever decryptable by the same Windows user account.

Phase A note: this module's real DPAPI calls are only exercised by a
live-Windows-session test (NT6/NT8); Phase A's own automated test
suite uses the `encrypt`/`decrypt` functions directly against a
tempfile path (no machine-config write, no secret ever a real ntfy
token) to prove the round-trip logic, and the real secret-store PATH
(a file under %LOCALAPPDATA%) is only ever WRITTEN in Phase B, after
a dated owner activation record, never as a side effect of running
this module's own tests.
"""
import ctypes
import ctypes.wintypes as wintypes
from pathlib import Path
from typing import Optional


class SecretStoreError(Exception):
    pass


class _DATA_BLOB(ctypes.Structure):
    _fields_ = [("cbData", wintypes.DWORD), ("pbData", ctypes.POINTER(ctypes.c_char))]


def _to_blob(data: bytes) -> _DATA_BLOB:
    buf = ctypes.create_string_buffer(data, len(data))
    return _DATA_BLOB(len(data), ctypes.cast(buf, ctypes.POINTER(ctypes.c_char)))


def dpapi_encrypt(plaintext: bytes, entropy: Optional[bytes] = None) -> bytes:
    """CryptProtectData, current-user scope. Returns the encrypted blob."""
    if not hasattr(ctypes, "windll"):
        raise SecretStoreError("DPAPI is only available on Windows")
    crypt32 = ctypes.windll.crypt32
    in_blob = _to_blob(plaintext)
    entropy_blob = _to_blob(entropy) if entropy else None
    out_blob = _DATA_BLOB()
    ok = crypt32.CryptProtectData(
        ctypes.byref(in_blob), None, ctypes.byref(entropy_blob) if entropy_blob else None,
        None, None, 0, ctypes.byref(out_blob),
    )
    if not ok:
        raise SecretStoreError(f"CryptProtectData failed: {ctypes.GetLastError()}")
    try:
        return ctypes.string_at(out_blob.pbData, out_blob.cbData)
    finally:
        ctypes.windll.kernel32.LocalFree(out_blob.pbData)


def dpapi_decrypt(ciphertext: bytes, entropy: Optional[bytes] = None) -> bytes:
    if not hasattr(ctypes, "windll"):
        raise SecretStoreError("DPAPI is only available on Windows")
    crypt32 = ctypes.windll.crypt32
    in_blob = _to_blob(ciphertext)
    entropy_blob = _to_blob(entropy) if entropy else None
    out_blob = _DATA_BLOB()
    ok = crypt32.CryptUnprotectData(
        ctypes.byref(in_blob), None, ctypes.byref(entropy_blob) if entropy_blob else None,
        None, None, 0, ctypes.byref(out_blob),
    )
    if not ok:
        raise SecretStoreError(f"CryptUnprotectData failed: {ctypes.GetLastError()}")
    try:
        return ctypes.string_at(out_blob.pbData, out_blob.cbData)
    finally:
        ctypes.windll.kernel32.LocalFree(out_blob.pbData)


def write_secret_file(path: Path, secret: bytes) -> None:
    """Writes a DPAPI-encrypted secret to `path`, creating parent dirs
    with default (user-only by inheritance) ACLs. Phase B only -- never
    called by this round's own automated tests against a real path."""
    encrypted = dpapi_encrypt(secret)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(encrypted)


def read_secret_file(path: Path) -> bytes:
    return dpapi_decrypt(path.read_bytes())
