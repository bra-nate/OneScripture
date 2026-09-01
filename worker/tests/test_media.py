from __future__ import annotations

import math
import struct
import sys
import tempfile
import unittest
import wave
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from onescripture_worker.media import SAMPLE_RATE, encode_and_probe_mp3  # noqa: E402


class MediaPipelineTests(unittest.TestCase):
    def test_encodes_and_validates_the_accepted_mp3_format(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            wav_path = Path(directory) / "input.wav"
            mp3_path = Path(directory) / "output.mp3"
            with wave.open(str(wav_path), "wb") as output:
                output.setnchannels(1)
                output.setsampwidth(2)
                output.setframerate(SAMPLE_RATE)
                frames = (
                    struct.pack(
                        "<h", int(6000 * math.sin(2 * math.pi * 440 * i / SAMPLE_RATE))
                    )
                    for i in range(SAMPLE_RATE)
                )
                output.writeframes(b"".join(frames))

            duration_ms = encode_and_probe_mp3(wav_path, mp3_path)

            self.assertGreaterEqual(duration_ms, 1000)
            self.assertLess(duration_ms, 1100)
            self.assertGreater(mp3_path.stat().st_size, 0)


if __name__ == "__main__":
    unittest.main()
