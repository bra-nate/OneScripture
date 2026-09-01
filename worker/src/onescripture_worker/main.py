"""Worker entry point; safe runtime validation precedes job processing."""

from __future__ import annotations

import argparse
import json
import signal
import shutil
import subprocess
import sys

from .config import WorkerSettings
from .errors import WorkerError
from .logging import log_event


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="validate configuration and media tools, then exit",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="process at most one available job, then exit",
    )
    return parser.parse_args(argv)


def validate_media_tools() -> dict[str, str]:
    versions: dict[str, str] = {}
    for executable in ("ffmpeg", "ffprobe"):
        path = shutil.which(executable)
        if path is None:
            raise RuntimeError(f"{executable} is required on PATH")
        result = subprocess.run(
            [path, "-version"],
            check=True,
            capture_output=True,
            text=True,
        )
        versions[executable] = result.stdout.splitlines()[0]
    return versions


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        settings = WorkerSettings.from_environment()
        media_tools = validate_media_tools()
    except (OSError, subprocess.SubprocessError, ValueError, RuntimeError) as error:
        print(
            json.dumps(
                {"event": "worker_configuration_failed", "error": str(error)},
                sort_keys=True,
            ),
            file=sys.stderr,
        )
        return 2

    print(
        json.dumps(
            {
                "event": "worker_configuration_valid",
                "settings": settings.safe_summary(),
                "media_tools": media_tools,
            },
            sort_keys=True,
        )
    )
    if args.check:
        return 0

    try:
        from .gateway import SupabaseGateway
        from .media import KokoroSynthesizer
        from .service import AudioWorker

        log_event("kokoro_model_loading", worker_id=settings.worker_id)
        worker = AudioWorker(
            settings,
            SupabaseGateway(settings),
            KokoroSynthesizer(),
        )
        log_event("kokoro_model_ready", worker_id=settings.worker_id)
        if args.once:
            processed = worker.run_once()
            log_event("worker_once_finished", processed=processed)
            return 0

        stopping = False

        def request_stop(_signum: int, _frame: object) -> None:
            nonlocal stopping
            stopping = True

        signal.signal(signal.SIGINT, request_stop)
        signal.signal(signal.SIGTERM, request_stop)
        log_event("worker_started", worker_id=settings.worker_id, concurrency=1)
        worker.run_forever(lambda: stopping)
        log_event("worker_stopped", worker_id=settings.worker_id)
        return 0
    except WorkerError as error:
        log_event(
            "worker_start_failed",
            error_code=error.code,
            retryable=error.retryable,
            error=str(error),
        )
        return 4
