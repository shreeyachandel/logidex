"""Run the Flask API and React development server together."""

from __future__ import annotations

import os
import signal
import subprocess
import sys

from project import PROJECT_ROOT, require_environment, venv_executable


def main() -> None:
    require_environment()

    process_kwargs = {"cwd": PROJECT_ROOT}
    if os.name != "nt":
        process_kwargs["start_new_session"] = True

    processes = [
        subprocess.Popen(
            [str(venv_executable("python")), "-m", "backend.app"],
            **process_kwargs,
        ),
        subprocess.Popen(["npm", "start", "--prefix", "frontend"], **process_kwargs),
    ]

    def stop_processes(*_args) -> None:
        for process in processes:
            if process.poll() is not None:
                continue
            try:
                if os.name == "nt":
                    process.terminate()
                else:
                    os.killpg(process.pid, signal.SIGTERM)
            except (PermissionError, ProcessLookupError):
                # Some shells or containers do not permit process-group signals.
                try:
                    process.terminate()
                except ProcessLookupError:
                    pass

    signal.signal(signal.SIGINT, stop_processes)
    signal.signal(signal.SIGTERM, stop_processes)

    try:
        exit_code = 0
        while all(process.poll() is None for process in processes):
            for process in processes:
                try:
                    exit_code = process.wait(timeout=0.25)
                    break
                except subprocess.TimeoutExpired:
                    continue
        stop_processes()
        for process in processes:
            process.wait()
        sys.exit(exit_code)
    finally:
        stop_processes()


if __name__ == "__main__":
    main()
