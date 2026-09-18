"""Shared process helpers for LogiDex's repository-level commands."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
VENV_DIR = PROJECT_ROOT / ".venv"


def venv_executable(command: str) -> Path:
    """Return the platform-specific path to an executable in the virtualenv."""
    scripts_dir = "Scripts" if os.name == "nt" else "bin"
    suffix = ".exe" if os.name == "nt" else ""
    return VENV_DIR / scripts_dir / f"{command}{suffix}"


def run(command: list[str], **kwargs) -> None:
    """Run a command from the repository root and fail on a non-zero exit."""
    subprocess.run(command, cwd=PROJECT_ROOT, check=True, **kwargs)


def require_environment() -> None:
    """Explain how to create the local environment when it is missing."""
    if not venv_executable("python").exists():
        sys.exit("Local environment not found. Run `npm run setup` first.")
