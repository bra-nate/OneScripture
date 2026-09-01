from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from onescripture_worker.config import (  # noqa: E402
    MODEL_REVISION,
    SUPPORTED_VOICES,
    WorkerSettings,
)


BASE_ENVIRONMENT = {
    "NEXT_PUBLIC_SUPABASE_URL": "https://example.supabase.co",
    "SUPABASE_SERVICE_ROLE_KEY": "test-service-role-key",
    "ONESCRIPTURE_WORKER_ID": "worker-test-01",
}


class WorkerSettingsTests(unittest.TestCase):
    def test_loads_safe_bounded_defaults(self) -> None:
        with patch.dict(os.environ, BASE_ENVIRONMENT, clear=True):
            settings = WorkerSettings.from_environment()

        self.assertEqual(settings.worker_id, "worker-test-01")
        self.assertEqual(settings.poll_seconds, 2.0)
        self.assertEqual(settings.lock_timeout_seconds, 900)
        self.assertEqual(settings.max_input_characters, 2000)
        self.assertNotIn("service_role_key", settings.safe_summary())

    def test_requires_service_role_credentials(self) -> None:
        environment = {"NEXT_PUBLIC_SUPABASE_URL": "https://example.supabase.co"}
        with patch.dict(os.environ, environment, clear=True):
            with self.assertRaisesRegex(ValueError, "SUPABASE_SERVICE_ROLE_KEY"):
                WorkerSettings.from_environment()

    def test_rejects_out_of_range_worker_limits(self) -> None:
        environment = {**BASE_ENVIRONMENT, "ONESCRIPTURE_POLL_SECONDS": "0"}
        with patch.dict(os.environ, environment, clear=True):
            with self.assertRaisesRegex(ValueError, "ONESCRIPTURE_POLL_SECONDS"):
                WorkerSettings.from_environment()

    def test_pins_the_approved_model_and_voices(self) -> None:
        self.assertEqual(
            MODEL_REVISION, "f3ff3571791e39611d31c381e3a41a3af07b4987"
        )
        self.assertEqual(SUPPORTED_VOICES, ("af_heart", "am_michael"))


if __name__ == "__main__":
    unittest.main()
