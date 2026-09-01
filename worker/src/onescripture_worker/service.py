"""Durable single-concurrency worker orchestration."""

from __future__ import annotations

import hashlib
import tempfile
import time
from pathlib import Path
from typing import Callable, Protocol

from .config import MODEL_ID, MODEL_VERSION, SUPPORTED_VOICES, WorkerSettings
from .errors import PermanentWorkerError, WorkerError
from .logging import log_event
from .media import KokoroSynthesizer, encode_and_probe_mp3
from .models import ClaimedJob
from .paths import build_storage_path


class Gateway(Protocol):
    def claim(self) -> ClaimedJob | None: ...
    def upload(self, storage_path: str, mp3_path: Path) -> None: ...
    def complete(self, job: ClaimedJob, storage_path: str, duration_ms: int) -> None: ...
    def fail(self, job: ClaimedJob, error: Exception) -> str: ...


class Synthesizer(Protocol):
    def synthesize(self, text: str, voice_id: str, wav_path: Path) -> None: ...


class AudioWorker:
    def __init__(
        self,
        settings: WorkerSettings,
        gateway: Gateway,
        synthesizer: Synthesizer,
        encoder: Callable[[Path, Path], int] = encode_and_probe_mp3,
    ) -> None:
        self._settings = settings
        self._gateway = gateway
        self._synthesizer = synthesizer
        self._encoder = encoder
        settings.temp_directory.mkdir(mode=0o700, parents=True, exist_ok=True)

    def run_once(self) -> bool:
        job = self._gateway.claim()
        if job is None:
            return False

        log_event(
            "audio_job_claimed",
            job_id=job.job_id,
            asset_id=job.asset_id,
            attempt=job.attempt_count,
            worker_id=self._settings.worker_id,
        )
        try:
            self._validate_job(job)
            storage_path = build_storage_path(job)
            with tempfile.TemporaryDirectory(
                prefix=f"job-{job.job_id}-", dir=self._settings.temp_directory
            ) as directory:
                work_directory = Path(directory)
                wav_path = work_directory / "audio.wav"
                mp3_path = work_directory / "audio.mp3"
                self._synthesizer.synthesize(
                    job.canonical_text, job.voice_id, wav_path
                )
                duration_ms = self._encoder(wav_path, mp3_path)
                self._gateway.upload(storage_path, mp3_path)
                self._gateway.complete(job, storage_path, duration_ms)
            log_event(
                "audio_job_completed",
                job_id=job.job_id,
                asset_id=job.asset_id,
                storage_path=storage_path,
                duration_ms=duration_ms,
            )
        except Exception as error:
            worker_error = self._normalize_error(error)
            next_status = self._gateway.fail(job, worker_error)
            log_event(
                "audio_job_failed",
                job_id=job.job_id,
                asset_id=job.asset_id,
                error_code=worker_error.code,
                retryable=worker_error.retryable,
                next_status=next_status,
            )
        return True

    def run_forever(self, should_stop: Callable[[], bool]) -> None:
        while not should_stop():
            try:
                processed = self.run_once()
            except WorkerError as error:
                log_event(
                    "worker_poll_failed",
                    error_code=error.code,
                    retryable=error.retryable,
                    error=str(error),
                )
                processed = False
            if not processed:
                time.sleep(self._settings.poll_seconds)

    def _validate_job(self, job: ClaimedJob) -> None:
        if job.model_id != MODEL_ID or job.model_version != MODEL_VERSION:
            raise PermanentWorkerError(
                "unsupported_model", "Job does not use the pinned Kokoro model"
            )
        if job.voice_id not in SUPPORTED_VOICES:
            raise PermanentWorkerError(
                "unsupported_voice", f"Unsupported voice: {job.voice_id}"
            )
        if not job.canonical_text.strip():
            raise PermanentWorkerError("empty_text", "Canonical verse text is empty")
        if len(job.canonical_text) > self._settings.max_input_characters:
            raise PermanentWorkerError(
                "text_too_long", "Canonical verse exceeds the synthesis limit"
            )
        actual_hash = hashlib.sha256(job.canonical_text.encode("utf-8")).hexdigest()
        if actual_hash != job.text_hash:
            raise PermanentWorkerError(
                "text_hash_mismatch", "Canonical verse text hash does not match asset"
            )

    @staticmethod
    def _normalize_error(error: Exception) -> WorkerError:
        if isinstance(error, WorkerError):
            return error
        return PermanentWorkerError(
            "unexpected_error", f"Unexpected worker failure: {error}"
        )
