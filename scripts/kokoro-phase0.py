#!/usr/bin/env python3
"""Generate and benchmark the audio samples required by Kokoro Phase 0."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import resource
import subprocess
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import soundfile as sf
import torch
from huggingface_hub import hf_hub_download
from kokoro import KPipeline

SAMPLE_RATE = 24_000
VOICE_ID = "af_heart"
MALE_VOICE_ID = "am_michael"
MODEL_ID = "hexgrad/Kokoro-82M"
MODEL_VERSION = "v1.0"
MODEL_REVISION = "f3ff3571791e39611d31c381e3a41a3af07b4987"
MODEL_SHA256 = "496dba118d1a58f5f3db2efc88dbdc216e0483fc89fe6e47ee1f2c53f18ad1e4"
VOICE_SHA256_BY_ID = {
    VOICE_ID: "0ab5709b8ffab19bfd849cd11d98f75b60af7733253ad0d67b12382a102cb4ff",
    MALE_VOICE_ID: "9a443b79a4b22489a5b0ab7c651a0bcd1a30bef675c28333f06971abbd47bd37",
}
SOURCE_ID = "engwebp"
SOURCE_VERSION = "2020 stable text edition; source files dated 2026-08-26"


@dataclass(frozen=True)
class Sample:
    slug: str
    reference: str
    category: str
    source_url: str
    text: str


SAMPLES = (
    Sample(
        slug="john-3-16",
        reference="John 3:16",
        category="single verse",
        source_url="https://ebible.org/engwebp/JHN03.htm",
        text=(
            "For God so loved the world, that he gave his only born Son, that "
            "whoever believes in him should not perish, but have eternal life."
        ),
    ),
    Sample(
        slug="psalm-23",
        reference="Psalm 23:1-6",
        category="complete passage",
        source_url="https://ebible.org/engwebp/PSA023.htm",
        text=(
            "The LORD is my shepherd; I shall lack nothing.\n"
            "He makes me lie down in green pastures. He leads me beside still waters.\n"
            "He restores my soul. He guides me in the paths of righteousness for his name’s sake.\n"
            "Even though I walk through the valley of the shadow of death, I will fear no evil, "
            "for you are with me. Your rod and your staff, they comfort me.\n"
            "You prepare a table before me in the presence of my enemies. You anoint my head "
            "with oil. My cup runs over.\n"
            "Surely goodness and loving kindness shall follow me all the days of my life, and "
            "I will dwell in the LORD’s house forever."
        ),
    ),
    Sample(
        slug="esther-8-9",
        reference="Esther 8:9",
        category="long verse",
        source_url="https://ebible.org/engwebp/EST08.htm",
        text=(
            "Then the king’s scribes were called at that time, in the third month, which is the "
            "month Sivan, on the twenty-third day of the month; and it was written according to "
            "all that Mordecai commanded to the Jews, and to the local governors, and the "
            "governors and princes of the provinces which are from India to Ethiopia, one "
            "hundred twenty-seven provinces, to every province according to its writing, and to "
            "every people in their language, and to the Jews in their writing, and in their language."
        ),
    ),
    Sample(
        slug="first-chronicles-1-1-7",
        reference="1 Chronicles 1:1-7",
        category="difficult biblical names",
        source_url="https://ebible.org/engwebp/1CH01.htm",
        text=(
            "Adam, Seth, Enosh, Kenan, Mahalalel, Jared, Enoch, Methuselah, Lamech, Noah, Shem, "
            "Ham, and Japheth. The sons of Japheth: Gomer, Magog, Madai, Javan, Tubal, Meshech, "
            "and Tiras. The sons of Gomer: Ashkenaz, Diphath, and Togarmah. The sons of Javan: "
            "Elishah, Tarshish, Kittim, and Rodanim."
        ),
    ),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--voice", default=VOICE_ID)
    parser.add_argument("--speed", type=float, default=0.95)
    parser.add_argument("--bitrate", default="64k")
    parser.add_argument("--loudness-lufs", type=float, default=-18.0)
    parser.add_argument("--true-peak-dbtp", type=float, default=-1.5)
    return parser.parse_args()


def max_rss_mb() -> float:
    value = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    # macOS reports bytes; Linux reports KiB.
    divisor = 1024 * 1024 if platform.system() == "Darwin" else 1024
    return round(value / divisor, 2)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_model_artifacts(voice: str) -> dict[str, str]:
    expected_voice_hash = VOICE_SHA256_BY_ID.get(voice)
    if expected_voice_hash is None:
        raise ValueError(
            f"Unsupported Phase 0 voice {voice}; choose one of "
            f"{', '.join(VOICE_SHA256_BY_ID)}"
        )
    model_path = Path(
        hf_hub_download(MODEL_ID, "kokoro-v1_0.pth", revision=MODEL_REVISION)
    )
    voice_path = Path(
        hf_hub_download(MODEL_ID, f"voices/{voice}.pt", revision=MODEL_REVISION)
    )
    actual_model_hash = sha256_file(model_path)
    actual_voice_hash = sha256_file(voice_path)
    if actual_model_hash != MODEL_SHA256:
        raise RuntimeError(f"Unexpected Kokoro model checksum: {actual_model_hash}")
    if actual_voice_hash != expected_voice_hash:
        raise RuntimeError(f"Unexpected Kokoro voice checksum: {actual_voice_hash}")
    return {
        "revision": MODEL_REVISION,
        "model_sha256": actual_model_hash,
        "voice_sha256": actual_voice_hash,
    }


def ffprobe(path: Path) -> dict[str, Any]:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "a:0",
            "-show_entries",
            "stream=codec_name,sample_rate,channels,bit_rate:format=duration,size,bit_rate",
            "-of",
            "json",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def encode_mp3(
    wav_path: Path,
    mp3_path: Path,
    bitrate: str,
    loudness_lufs: float,
    true_peak_dbtp: float,
) -> float:
    started = time.perf_counter()
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
            f"loudnorm=I={loudness_lufs}:LRA=7:TP={true_peak_dbtp}",
            "-ac",
            "1",
            "-ar",
            str(SAMPLE_RATE),
            "-codec:a",
            "libmp3lame",
            "-b:a",
            bitrate,
            str(mp3_path),
        ],
        check=True,
    )
    return time.perf_counter() - started


def generate_sample(
    pipeline: KPipeline,
    sample: Sample,
    output_dir: Path,
    args: argparse.Namespace,
) -> dict[str, Any]:
    wav_path = output_dir / f"{sample.slug}.wav"
    mp3_path = output_dir / f"{sample.slug}.mp3"
    wall_started = time.perf_counter()
    cpu_started = time.process_time()

    chunks: list[np.ndarray] = []
    chunk_count = 0
    for result in pipeline(
        sample.text,
        voice=args.voice,
        speed=args.speed,
        split_pattern=r"\n+",
    ):
        if result.audio is None:
            continue
        audio = result.audio.detach().cpu().numpy()
        if chunks:
            chunks.append(np.zeros(int(SAMPLE_RATE * 0.18), dtype=np.float32))
        chunks.append(audio.astype(np.float32, copy=False))
        chunk_count += 1

    if not chunks:
        raise RuntimeError(f"Kokoro returned no audio for {sample.reference}")

    audio = np.concatenate(chunks)
    sf.write(wav_path, audio, SAMPLE_RATE, subtype="PCM_16")
    generation_wall_seconds = time.perf_counter() - wall_started
    generation_cpu_seconds = time.process_time() - cpu_started
    encode_seconds = encode_mp3(
        wav_path,
        mp3_path,
        args.bitrate,
        args.loudness_lufs,
        args.true_peak_dbtp,
    )
    wav_info = ffprobe(wav_path)
    mp3_info = ffprobe(mp3_path)
    duration_seconds = float(mp3_info["format"]["duration"])

    if mp3_info["streams"][0]["codec_name"] != "mp3" or duration_seconds <= 0:
        raise RuntimeError(f"Invalid MP3 generated for {sample.reference}")

    return {
        **asdict(sample),
        "text_sha256": hashlib.sha256(sample.text.encode("utf-8")).hexdigest(),
        "characters": len(sample.text),
        "chunks": chunk_count,
        "audio_duration_seconds": round(duration_seconds, 3),
        "generation_wall_seconds": round(generation_wall_seconds, 3),
        "generation_cpu_seconds": round(generation_cpu_seconds, 3),
        "generation_realtime_factor": round(generation_wall_seconds / duration_seconds, 4),
        "encode_seconds": round(encode_seconds, 3),
        "peak_process_rss_mb": max_rss_mb(),
        "wav_size_bytes": wav_path.stat().st_size,
        "mp3_size_bytes": mp3_path.stat().st_size,
        "wav_probe": wav_info,
        "mp3_probe": mp3_info,
        "wav_path": str(wav_path),
        "mp3_path": str(mp3_path),
    }


def main() -> None:
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    load_started = time.perf_counter()
    artifact_identity = verify_model_artifacts(args.voice)
    pipeline = KPipeline(lang_code="a", repo_id=MODEL_ID, device="cpu")
    model_load_seconds = time.perf_counter() - load_started

    results = []
    for sample in SAMPLES:
        print(f"Generating {sample.reference}...", flush=True)
        results.append(generate_sample(pipeline, sample, args.output_dir, args))

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": {
            "id": SOURCE_ID,
            "name": "World English Bible, 66-book protocanon",
            "version": SOURCE_VERSION,
            "copyright_url": "https://ebible.org/engwebp/copyright.htm",
        },
        "model": {
            "id": MODEL_ID,
            "version": MODEL_VERSION,
            **artifact_identity,
            "voice": args.voice,
            "language_code": "a",
            "device": "cpu",
            "speed": args.speed,
            "model_load_seconds": round(model_load_seconds, 3),
        },
        "encoding": {
            "codec": "libmp3lame",
            "bitrate": args.bitrate,
            "sample_rate_hz": SAMPLE_RATE,
            "channels": 1,
            "integrated_loudness_lufs": args.loudness_lufs,
            "loudness_range_lu": 7,
            "true_peak_dbtp": args.true_peak_dbtp,
        },
        "environment": {
            "platform": platform.platform(),
            "machine": platform.machine(),
            "python": platform.python_version(),
            "torch": torch.__version__,
            "torch_threads": torch.get_num_threads(),
            "ffmpeg": subprocess.run(
                ["ffmpeg", "-version"], check=True, capture_output=True, text=True
            ).stdout.splitlines()[0],
            "peak_process_rss_mb": max_rss_mb(),
            "logical_cpu_count": os.cpu_count(),
        },
        "samples": results,
    }
    report_path = args.output_dir / "benchmark.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {report_path}")


if __name__ == "__main__":
    main()
