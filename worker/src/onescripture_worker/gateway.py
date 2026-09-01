"""Supabase queue and private-storage adapter."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from supabase import Client, create_client

from .config import WorkerSettings
from .errors import TransientWorkerError
from .models import ClaimedJob

AUDIO_BUCKET = "scripture-audio"


class SupabaseGateway:
    def __init__(self, settings: WorkerSettings) -> None:
        self._client: Client = create_client(
            settings.supabase_url, settings.service_role_key
        )
        self._worker_id = settings.worker_id
        self._lock_timeout_seconds = settings.lock_timeout_seconds

    def claim(self) -> ClaimedJob | None:
        try:
            response = self._client.rpc(
                "claim_audio_generation_job",
                {
                    "p_worker_id": self._worker_id,
                    "p_lock_timeout_seconds": self._lock_timeout_seconds,
                },
            ).execute()
        except Exception as error:
            raise TransientWorkerError(
                "claim_failed", f"Unable to claim an audio job: {error}"
            ) from error
        rows: list[dict[str, Any]] = response.data or []
        return ClaimedJob.from_row(rows[0]) if rows else None

    def upload(self, storage_path: str, mp3_path: Path) -> None:
        try:
            with mp3_path.open("rb") as audio:
                self._client.storage.from_(AUDIO_BUCKET).upload(
                    path=storage_path,
                    file=audio,
                    file_options={
                        "cache-control": "3600",
                        "content-type": "audio/mpeg",
                        "upsert": "true",
                    },
                )
        except Exception as error:
            raise TransientWorkerError(
                "upload_failed", f"Unable to upload generated MP3: {error}"
            ) from error

    def complete(self, job: ClaimedJob, storage_path: str, duration_ms: int) -> None:
        try:
            self._client.rpc(
                "complete_audio_generation_job",
                {
                    "p_job_id": job.job_id,
                    "p_worker_id": self._worker_id,
                    "p_storage_path": storage_path,
                    "p_duration_ms": duration_ms,
                },
            ).execute()
        except Exception as error:
            if self._job_status(job.job_id) == "completed":
                return
            raise TransientWorkerError(
                "completion_failed", f"Unable to complete audio job: {error}"
            ) from error

    def fail(self, job: ClaimedJob, error: Exception) -> str:
        retryable = isinstance(error, TransientWorkerError)
        error_code = error.code if hasattr(error, "code") else "unexpected_error"
        retry_delay = min(30 * (2 ** max(job.attempt_count - 1, 0)), 300)
        try:
            response = self._client.rpc(
                "fail_audio_generation_job",
                {
                    "p_job_id": job.job_id,
                    "p_worker_id": self._worker_id,
                    "p_error_code": error_code,
                    "p_error_message": str(error),
                    "p_retryable": retryable,
                    "p_retry_delay_seconds": retry_delay,
                },
            ).execute()
        except Exception as transition_error:
            current_status = self._job_status(job.job_id)
            if current_status in ("queued", "failed"):
                return current_status
            raise TransientWorkerError(
                "failure_transition_failed",
                f"Unable to record audio job failure: {transition_error}",
            ) from transition_error
        return str(response.data)

    def _job_status(self, job_id: str) -> str | None:
        try:
            response = (
                self._client.table("audio_generation_jobs")
                .select("status")
                .eq("id", job_id)
                .single()
                .execute()
            )
        except Exception:
            return None
        return str(response.data.get("status")) if response.data else None
