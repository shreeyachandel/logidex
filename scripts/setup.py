"""Create the Python environment and install all project dependencies."""

from __future__ import annotations

import shutil
import sys
import venv

from project import PROJECT_ROOT, VENV_DIR, run, venv_executable


def main() -> None:
    if shutil.which("npm") is None:
        sys.exit("npm was not found. Install Node.js 20 or newer and try again.")

    if not VENV_DIR.exists():
        print("Creating Python virtual environment...")
        venv.create(VENV_DIR, with_pip=True)

    print("Installing Python dependencies...")
    run(
        [
            str(venv_executable("python")),
            "-m",
            "pip",
            "install",
            "-r",
            str(PROJECT_ROOT / "backend" / "requirements.txt"),
        ]
    )

    print("Installing frontend dependencies...")
    run(["npm", "ci", "--prefix", "frontend"])
    print("\nLogiDex is ready. Run `npm start`.")


if __name__ == "__main__":
    main()
