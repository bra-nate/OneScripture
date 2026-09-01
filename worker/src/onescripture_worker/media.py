"""Pinned Kokoro synthesis and accepted MP3 encoding pipeline."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any

from .config import (
    MODEL_ID,
    MODEL_REVISION,
    MODEL_SHA256,
    SUPPORTED_VOICES,
    VOICE_SHA256_BY_ID,
)
from .errors import PermanentWorkerError, TransientWorkerError

SAMPLE_RATE = 24_000
MAX_AUDIO_BYTES = 10 * 1024 * 1024
INTER_CHUNK_SILENCE_SECONDS = 0.18


class KokoroSynthesizer:
    """Loads the pinned model once and reuses it for every claimed job."""

    def __init__(self) -> None:
        self._verify_model_artifacts()
        try:
            from kokoro import KPipeline

            self._pipeline = KPipeline(lang_code="a", repo_id=MODEL_ID, device="cpu")
        except Exception as error:
            raise TransientWorkerError(
                "model_load_failed", f"Unable to load Kokoro: {error}"
            ) from error

    def synthesize(self, text: str, voice_id: str, wav_path: Path) -> None:
        import numpy as np
        import soundfile as sf

        if voice_id not in SUPPORTED_VOICES:
            raise PermanentWorkerError(
                "unsupported_voice", f"Unsupported voice: {voice_id}"
            )
        chunks: list[np.ndarray] = []
        try:
            for result in self._pipeline(
                text,
                voice=voice_id,
                speed=0.95,
                split_pattern=r"\n+",
            ):
                if result.audio is None:
                    continue
                if chunks:
                    chunks.append(
                        np.zeros(
                            int(SAMPLE_RATE * INTER_CHUNK_SILENCE_SECONDS),
                            dtype=np.float32,
                        )
                    )
                chunks.append(
                    result.audio.detach().cpu().numpy().astype(np.float32, copy=False)
                )
            if not chunks:
                raise PermanentWorkerError(
                    "empty_synthesis", "Kokoro returned no audio"
                )
            sf.write(wav_path, np.concatenate(chunks), SAMPLE_RATE, subtype="PCM_16")
        except PermanentWorkerError:
            raise
        except Exception as error:
            raise TransientWorkerError(
                "synthesis_failed", f"Kokoro synthesis failed: {error}"
            ) from error

    @staticmethod
    def _verify_model_artifacts() -> None:
        try:
            from huggingface_hub import hf_hub_download

            model_path = Path(
                hf_hub_download(
                    MODEL_ID, "kokoro-v1_0.pth", revision=MODEL_REVISION
                )
            )
            if _sha256_file(model_path) != MODEL_SHA256:
                raise PermanentWorkerError(
                    "model_checksum_mismatch", "Kokoro model checksum mismatch"
                )
            for voice_id, expected_hash in VOICE_SHA256_BY_ID.items():
                voice_path = Path(
                    hf_hub_download(
                        MODEL_ID,
                        f"voices/{voice_id}.pt",
                        revision=MODEL_REVISION,
                    )
                )
                if _sha256_file(voice_path) != expected_hash:
                    raise PermanentWorkerError(
                        "voice_checksum_mismatch",
                        f"Kokoro voice checksum mismatch: {voice_id}",
                    )
        except PermanentWorkerError:
            raise
        except Exception as error:
            raise TransientWorkerError(
                "artifact_download_failed", f"Unable to verify Kokoro artifacts: {error}"
            ) from error


def encode_and_probe_mp3(wav_path: Path, mp3_path: Path) -> int:
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-i",
                str(wav_path),
                "-af",
                "loudnorm=I=-18:LRA=7:TP=-1.5",
                "-ac",
                "1",
                "-ar",
                str(SAMPLE_RATE),
                "-codec:a",
                "libmp3lame",
                "-b:a",
                "64k",
                str(mp3_path),
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        probe = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-select_streams",
                "a:0",
                "-show_entries",
                "stream=codec_name,sample_rate,channels:format=duration,size",
                "-of",
                "json",
                str(mp3_path),
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        metadata: dict[str, Any] = json.loads(probe.stdout)
    except (OSError, subprocess.SubprocessError, json.JSONDecodeError) as error:
        raise TransientWorkerError(
            "media_conversion_failed", f"FFmpeg validation failed: {error}"
        ) from error

    streams = metadata.get("streams", [])
    file_size = mp3_path.stat().st_size if mp3_path.exists() else 0
    try:
        duration_ms = round(float(metadata["format"]["duration"]) * 1000)
    except (KeyError, TypeError, ValueError) as error:
        raise PermanentWorkerError(
            "invalid_mp3", "Generated MP3 has no valid duration"
        ) from error
    if (
        len(streams) != 1
        or streams[0].get("codec_name") != "mp3"
        or int(streams[0].get("sample_rate", 0)) != SAMPLE_RATE
        or int(streams[0].get("channels", 0)) != 1
        or duration_ms < 1
        or file_size < 1
        or file_size > MAX_AUDIO_BYTES
    ):
        raise PermanentWorkerError(
            "invalid_mp3", "Generated MP3 does not match the accepted format"
        )
    return duration_ms


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()
