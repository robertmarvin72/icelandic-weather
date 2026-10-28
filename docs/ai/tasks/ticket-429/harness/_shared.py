"""Shared helpers for ticket-429 correction-round (v2) analysis scripts.

Pure stdlib, read-only. No network. No imports of repo application code
(this avoids touching forecastCache.js's runtime/cache/network path, per
approved-prompt-v2 R1). Every script in this folder prints an input
manifest (filename + SHA256) before its findings so a reviewer can
regenerate the headline numbers from the retained samples alone.
"""
import hashlib
import json
import os
import sys

# Windows' python3 defaults stdout to the cp1252 console codepage, which
# mis-encodes Icelandic characters (e.g. "ð") when output is redirected to a
# file. Force UTF-8 so saved -output.txt files match the UTF-8 the retained
# samples themselves use.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "..", "samples")


def sha256_of(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def sample_path(name):
    return os.path.join(SAMPLES_DIR, name)


def print_input_manifest(names):
    print("## Input manifest (this script's only inputs; read-only, no network)")
    for name in names:
        p = sample_path(name)
        print(f"- {name}  sha256={sha256_of(p)}  bytes={os.path.getsize(p)}")
    print()


def load_json(name):
    with open(sample_path(name), encoding="utf-8") as f:
        return json.load(f)


def load_text(name):
    with open(sample_path(name), encoding="utf-8") as f:
        return f.read()
