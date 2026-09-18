"""Serve the production build locally with Gunicorn."""

from __future__ import annotations

import os
import sys

from project import PROJECT_ROOT, require_environment, run, venv_executable


def main() -> None:
    require_environment()
    port = os.environ.get("PORT", "5050")
    index_file = PROJECT_ROOT / "frontend" / "dist" / "index.html"
    if not index_file.exists():
        sys.exit("Frontend build not found. Run `npm run build` first.")

    try:
        run(
            [
                str(venv_executable("python")),
                "-m",
                "gunicorn",
                "--bind",
                f"0.0.0.0:{port}",
                "backend.app:app",
            ]
        )
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
