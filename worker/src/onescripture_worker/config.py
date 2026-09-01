"""Validated configuration and immutable synthesis identity."""

from __future__ import annotations

import os
import socket
from dataclasses import dataclass
from pathlib import Path

MODEL_ID = "hexgrad/Kokoro-82M"
MODEL_VERSION = "kokoro-82m-v1.0-f3ff357"
MODEL_REVISION = "f3ff3571791e39611d31c381e3a41a3af07b4987"
MODEL_SHA256 = "496dba118d1a58f5f3db2efc88dbdc216e0483fc89fe6e47ee1f2c53f18ad1e4"
SUPPORTED_VOICES = ("af_heart", "am_michael")
VOICE_SHA256_BY_ID = {
    "af_heart": "0ab5709b8ffab19bfd849cd11d98f75b60af7733253ad0d67b12382a102cb4ff",
    "am_michael": "9a443b79a4b22489a5b0ab7c651a0bcd1a30bef675c28333f06971abbd47bd37",
}


@dataclass(frozen=True, slots=True)
class WorkerSettings:
    supabase_url: str
    service_role_key: str
    worker_id: str
    poll_seconds: float
    lock_timeout_seconds: int
    max_input_characters: int
    temp_directory: Path

    @classmethod
    def from_environment(cls) -> "WorkerSettings":
        return cls(
            supabase_url=_required("NEXT_PUBLIC_SUPABASE_URL"),
            service_role_key=_required("SUPABASE_SERVICE_ROLE_KEY"),
            worker_id=_worker_id(),
            poll_seconds=_bounded_float(
                "ONESCRIPTURE_POLL_SECONDS", default=2.0, minimum=0.25, maximum=60.0
            ),
            lock_timeout_seconds=_bounded_int(
                "ONESCRIPTURE_LOCK_TIMEOUT_SECONDS",
                default=900,
                minimum=60,
                maximum=3600,
            ),
            max_input_characters=_bounded_int(
                "ONESCRIPTURE_MAX_INPUT_CHARACTERS",
                default=2000,
                minimum=100,
                maximum=10_000,
            ),
            temp_directory=Path(
                os.getenv(
                    "ONESCRIPTURE_TEMP_DIRECTORY", "/tmp/onescripture-worker"
                )
            ),
        )

    def safe_summary(self) -> dict[str, object]:
        return {
            "supabase_url": self.supabase_url,
            "worker_id": self.worker_id,
            "poll_seconds": self.poll_seconds,
            "lock_timeout_seconds": self.lock_timeout_seconds,
            "max_input_characters": self.max_input_characters,
            "temp_directory": str(self.temp_directory),
            "model_id": MODEL_ID,
            "model_version": MODEL_VERSION,
            "model_revision": MODEL_REVISION,
            "supported_voices": list(SUPPORTED_VOICES),
        }


def _required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"{name} is required")
    return value


def _worker_id() -> str:
    value = os.getenv("ONESCRIPTURE_WORKER_ID", socket.gethostname()).strip()
    if not value or len(value) > 128:
        raise ValueError("ONESCRIPTURE_WORKER_ID must contain 1 to 128 characters")
    return value


def _bounded_int(name: str, *, default: int, minimum: int, maximum: int) -> int:
    raw = os.getenv(name, str(default))
    try:
        value = int(raw)
    except ValueError as error:
        raise ValueError(f"{name} must be an integer") from error
    if not minimum <= value <= maximum:
        raise ValueError(f"{name} must be between {minimum} and {maximum}")
    return value


def _bounded_float(
    name: str, *, default: float, minimum: float, maximum: float
) -> float:
    raw = os.getenv(name, str(default))
    try:
        value = float(raw)
    except ValueError as error:
        raise ValueError(f"{name} must be a number") from error
    if not minimum <= value <= maximum:
        raise ValueError(f"{name} must be between {minimum} and {maximum}")
    return value
