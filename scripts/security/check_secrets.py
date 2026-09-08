#!/usr/bin/env python3
"""Scan the repository for common secret patterns and sensitive filenames.

This is a basic pre-publication safeguard for the PolyTutor paper-trading lab.
It is not a replacement for GitHub secret scanning, gitleaks, or trufflehog.

Never prints matched secret values — only relative paths, line numbers,
pattern names, and risk levels.
Exit 0 if clean; exit 1 if potential findings exist.
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

SKIP_DIRS = {
    ".git",
    "node_modules",
    ".next",
    "out",
    "dist",
    "build",
    "coverage",
    "__pycache__",
    ".pytest_cache",
    ".venv",
    "venv",
    ".vercel",
    ".turbo",
    ".cache",
}

SKIP_FILE_NAMES = {
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "next-env.d.ts",
    "check_secrets.py",
}

ALLOW_FILE_NAMES = {
    ".env.example",
    "SECURITY.md",
    "SECURITY_AUDIT.md",
}

TEXT_SUFFIXES = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".json",
    ".yml",
    ".yaml",
    ".toml",
    ".env",
    ".sh",
    ".py",
    ".md",
    ".txt",
    ".csv",
    ".html",
    ".css",
    ".jsonc",
    ".example",
}

# Local env files are gitignored on purpose; do not treat their presence as a leak.
LOCAL_ENV_NAMES = re.compile(r"^\.env($|\.(?!example$).+)$")

SENSITIVE_NAMES = re.compile(
    r"^("
    r"credentials\.json|"
    r"secrets\.json|"
    r".*\.pem|"
    r".*\.key|"
    r".*\.p12|"
    r".*\.pfx|"
    r".*\.secret|"
    r"id_rsa|"
    r"id_ed25519"
    r")$",
    re.IGNORECASE,
)

MAX_FILE_BYTES = 2_000_000

PLACEHOLDER_VALUES = {
    "",
    "...",
    "xxx",
    "changeme",
    "change-me",
    "placeholder",
    "example",
    "dummy",
    "fake",
    "todo",
    "null",
    "none",
    "your_api_key_here",
    "your-api-key-here",
}

PLACEHOLDER_SUBSTR = (
    "your_",
    "example",
    "placeholder",
    "changeme",
    "dummy",
    "fake",
    "todo",
    "replace_me",
    "insert_",
    "xxxx",
    "localhost",
)


def _p(parts: list[str]) -> re.Pattern[str]:
    return re.compile("".join(parts))


# High-confidence value patterns. Each match is a finding; values are never printed.
VALUE_PATTERNS: list[tuple[str, str, re.Pattern[str]]] = [
    ("HIGH", "aws_access_key_id", _p(["AKIA", "[0-9A-Z]{16}"])),
    ("HIGH", "github_pat", _p(["ghp_", "[A-Za-z0-9]{36}"])),
    ("HIGH", "github_fine_grained_pat", _p(["github_pat_", "[A-Za-z0-9_]{20,}"])),
    ("HIGH", "github_oauth", _p(["gho_", "[A-Za-z0-9]{36}"])),
    ("HIGH", "openai_style_key", _p(["sk-", "[A-Za-z0-9]{20,}"])),
    ("HIGH", "slack_token", _p(["xox", "[baprs]-", "[0-9A-Za-z-]{10,}"])),
    (
        "HIGH",
        "pem_header",
        _p(["-----BEGIN ", "(?:RSA |OPENSSH |EC )?", "PRIVATE ", "KEY-----"]),
    ),
    (
        "MEDIUM",
        "jwt_style",
        _p(
            [
                "eyJ",
                r"[A-Za-z0-9_-]{10,}\.",
                r"[A-Za-z0-9_-]{10,}\.",
                r"[A-Za-z0-9_-]{10,}",
            ]
        ),
    ),
]

ASSIGNMENT_PATTERNS: list[tuple[str, str, re.Pattern[str]]] = [
    (
        "HIGH",
        "private_key_assignment",
        re.compile(
            r"(?i)\b(?:POLYMARKET_)?PRIVATE_KEY\s*[=:]\s*['\"]?"
            r"(0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64})\b"
        ),
    ),
    (
        "HIGH",
        "seed_phrase_assignment",
        re.compile(
            r"(?i)\b(?:MNEMONIC|SEED_PHRASE|SEED_PHRASE_WORDS)\s*[=:]\s*['\"]"
            r"([a-z]+(?:\s+[a-z]+){11,23})['\"]"
        ),
    ),
    (
        "HIGH",
        "blob_or_api_token_assignment",
        re.compile(
            r"(?i)\b(?:BLOB_READ_WRITE_TOKEN|BLOB_STORE_ID|API_SECRET|"
            r"CLIENT_SECRET|WEBHOOK_SECRET|POLYMARKET_SECRET|"
            r"POLYMARKET_PASSPHRASE)\s*[=:]\s*['\"]?"
            r"([A-Za-z0-9_\-+/=]{20,})"
        ),
    ),
]

BEARER_RE = re.compile(
    r"(?i)(?:Authorization\s*[:=]\s*['\"]?Bearer|Bearer)\s+"
    r"([A-Za-z0-9_\-\.]{32,})"
)


def is_placeholder(value: str) -> bool:
    cleaned = value.strip().strip("'\"").rstrip(".")
    if cleaned.lower() in PLACEHOLDER_VALUES:
        return True
    lower = cleaned.lower()
    if any(token in lower for token in PLACEHOLDER_SUBSTR):
        return True
    if len(cleaned) < 16:
        return True
    return False


def looks_binary(sample: bytes) -> bool:
    return b"\x00" in sample[:8192]


def is_text_file(path: Path) -> bool:
    if path.name in {".env", "Dockerfile", "Makefile"}:
        return True
    if path.name.startswith(".env"):
        return True
    return path.suffix.lower() in TEXT_SUFFIXES


def skip_content_scan(path: Path) -> bool:
    if path.name in SKIP_FILE_NAMES or path.name in ALLOW_FILE_NAMES:
        return True
    if path.suffix.lower() == ".md":
        return True
    if path.name.endswith(".example"):
        return True
    if LOCAL_ENV_NAMES.match(path.name):
        return True
    return False


def main() -> int:
    findings: list[str] = []
    scanned = 0
    skipped = 0

    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            path = Path(dirpath) / name
            rel = path.relative_to(ROOT).as_posix()

            if SENSITIVE_NAMES.match(name):
                findings.append(f"{rel} — sensitive_filename — HIGH")
                continue

            if skip_content_scan(path) or not is_text_file(path):
                skipped += 1
                continue

            try:
                size = path.stat().st_size
            except OSError:
                skipped += 1
                continue
            if size > MAX_FILE_BYTES:
                skipped += 1
                continue

            try:
                raw = path.read_bytes()
            except OSError:
                skipped += 1
                continue
            if looks_binary(raw):
                skipped += 1
                continue

            try:
                text = raw.decode("utf-8")
            except UnicodeDecodeError:
                try:
                    text = raw.decode("latin-1")
                except UnicodeDecodeError:
                    skipped += 1
                    continue

            scanned += 1
            for line_no, line in enumerate(text.splitlines(), start=1):
                for risk, pattern_name, rx in VALUE_PATTERNS:
                    if rx.search(line):
                        findings.append(
                            f"{rel}:{line_no} — {pattern_name} — {risk}"
                        )
                for risk, pattern_name, rx in ASSIGNMENT_PATTERNS:
                    match = rx.search(line)
                    if not match:
                        continue
                    if is_placeholder(match.group(1)):
                        continue
                    findings.append(
                        f"{rel}:{line_no} — {pattern_name} — {risk}"
                    )
                bearer = BEARER_RE.search(line)
                if bearer:
                    value = bearer.group(1)
                    if (
                        is_placeholder(value)
                        or value.startswith("{")
                        or value.startswith("$")
                    ):
                        continue
                    findings.append(
                        f"{rel}:{line_no} — bearer_token — MEDIUM"
                    )

    print(f"Files scanned: {scanned}")
    print(f"Files skipped: {skipped}")

    if findings:
        print("Secret scan: FAIL")
        print(f"{len(findings)} suspicious findings (values redacted).")
        print()
        for item in findings:
            print(item)
        return 1

    print("Secret scan: PASS")
    print("0 suspicious committed secrets found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
