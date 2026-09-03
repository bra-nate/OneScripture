from __future__ import annotations

import hashlib
import os
import sys
import tempfile
import unittest
from dataclasses import replace
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from onescripture_worker.config import (  # noqa: E402
    MODEL_ID,
    MODEL_VERSION,
    WorkerSettings,
)
from onescripture_worker.errors import TransientWorkerError  # noqa: E402
from onescripture_worker.models import ClaimedJob  # noqa: E402
from onescripture_worker.paths import build_storage_path  # noqa: E402
from onescripture_worker.service import AudioWorker  # noqa: E402


CANONICAL_TEXT = "For God so loved the world."


def make_job(**overrides: object) -> ClaimedJob:
    values: dict[str, object] = {
        "job_id": "00000000-0000-0000-0000-000000000001",
        "asset_id": "00000000-0000-0000-0000-000000000002",
        "attempt_count": 1,
        "max_attempts": 3,
        "scripture_verse_id": 1,
        "voice_id": "af_heart",
        "model_id": MODEL_ID,
        "model_version": MODEL_VERSION,
        "text_hash": hashlib.sha256(CANONICAL_TEXT.encode()).hexdigest(),
        "canonical_text": CANONICAL_TEXT,
        "translation_code": "WEB",
        "book_id": "JHN",
        "chapter": 3,
        "verse": 16,
    }
    values.update(overrides)
    return ClaimedJob(**values)  # type: ignore[arg-type]


class FakeGateway:
    def __init__(self, job: ClaimedJob) -> None:
        self.job = job
        self.uploaded: tuple[str, bytes] | None = None
        self.completed: tuple[str, int] | None = None
        self.failed: Exception | None = None

    def claim(self) -> ClaimedJob | None:
        job, self.job = self.job, None  # type: ignore[assignment]
        return job

    def upload(self, storage_path: str, mp3_path: Path) -> None:
        self.uploaded = (storage_path, mp3_path.read_bytes())

    def complete(
        self, job: ClaimedJob, storage_path: str, duration_ms: int
    ) -> None:
        self.completed = (storage_path, duration_ms)

    def fail(self, job: ClaimedJob, error: Exception) -> str:
        self.failed = error
        return "queued" if getattr(error, "retryable", False) else "failed"


class RestartableGateway(FakeGateway):
    def fail(self, job: ClaimedJob, error: Exception) -> str:
        next_status = super().fail(job, error)
        if next_status == "queued":
            self.job = replace(job, attempt_count=job.attempt_count + 1)
        return next_status


class FakeSynthesizer:
    def __init__(self, error: Exception | None = None) -> None:
        self.error = error
        self.wav_path: Path | None = None

    def synthesize(self, text: str, voice_id: str, wav_path: Path) -> None:
        self.wav_path = wav_path
        if self.error:
            raise self.error
        wav_path.write_bytes(b"test-wav")


class AudioWorkerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.settings = WorkerSettings(
            supabase_url="https://example.supabase.co",
            service_role_key="test-key",
            worker_id="worker-test",
            poll_seconds=0.25,
            lock_timeout_seconds=900,
            max_input_characters=2000,
            temp_directory=Path(self.temporary_directory.name),
        )

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def test_processes_uploads_completes_and_cleans_temporary_files(self) -> None:
        gateway = FakeGateway(make_job())
        synthesizer = FakeSynthesizer()

        def encode(wav_path: Path, mp3_path: Path) -> int:
            self.assertEqual(wav_path.read_bytes(), b"test-wav")
            mp3_path.write_bytes(b"test-mp3")
            return 8550

        worker = AudioWorker(self.settings, gateway, synthesizer, encode)

        self.assertTrue(worker.run_once())
        expected_path = (
            "WEB/kokoro-82m-v1.0-f3ff357/af_heart/JHN/003/016.mp3"
        )
        self.assertEqual(gateway.uploaded, (expected_path, b"test-mp3"))
        self.assertEqual(gateway.completed, (expected_path, 8550))
        self.assertIsNone(gateway.failed)
        self.assertEqual(list(self.settings.temp_directory.iterdir()), [])

    def test_requeues_transient_synthesis_failure_and_cleans_files(self) -> None:
        gateway = FakeGateway(make_job())
        synthesizer = FakeSynthesizer(
            TransientWorkerError("synthesis_failed", "temporary failure")
        )
        worker = AudioWorker(self.settings, gateway, synthesizer)

        self.assertTrue(worker.run_once())
        self.assertIsInstance(gateway.failed, TransientWorkerError)
        self.assertIsNone(gateway.completed)
        self.assertEqual(list(self.settings.temp_directory.iterdir()), [])

    def test_a_restarted_worker_completes_a_durably_requeued_job(self) -> None:
        gateway = RestartableGateway(make_job())
        interrupted_worker = AudioWorker(
            self.settings,
            gateway,
            FakeSynthesizer(
                TransientWorkerError("worker_stopped", "simulated restart")
            ),
        )

        self.assertTrue(interrupted_worker.run_once())
        self.assertIsNotNone(gateway.job)
        self.assertEqual(gateway.job.attempt_count, 2)

        def encode(_wav_path: Path, mp3_path: Path) -> int:
            mp3_path.write_bytes(b"restarted-worker-mp3")
            return 7200

        restarted_worker = AudioWorker(
            self.settings,
            gateway,
            FakeSynthesizer(),
            encode,
        )

        self.assertTrue(restarted_worker.run_once())
        self.assertEqual(gateway.uploaded[1], b"restarted-worker-mp3")
        self.assertEqual(gateway.completed[1], 7200)
        self.assertEqual(list(self.settings.temp_directory.iterdir()), [])

    def test_permanently_fails_tampered_canonical_text(self) -> None:
        gateway = FakeGateway(make_job(text_hash="0" * 64))
        worker = AudioWorker(self.settings, gateway, FakeSynthesizer())

        self.assertTrue(worker.run_once())
        self.assertEqual(getattr(gateway.failed, "code", None), "text_hash_mismatch")
        self.assertFalse(getattr(gateway.failed, "retryable", True))

    def test_builds_the_same_canonical_path_as_the_application(self) -> None:
        self.assertEqual(
            build_storage_path(make_job(voice_id="am_michael")),
            "WEB/kokoro-82m-v1.0-f3ff357/am_michael/JHN/003/016.mp3",
        )

    def test_rejects_unsafe_storage_path_fields(self) -> None:
        with self.assertRaisesRegex(Exception, "Invalid voice"):
            build_storage_path(make_job(voice_id="../../escape"))


if __name__ == "__main__":
    unittest.main()
