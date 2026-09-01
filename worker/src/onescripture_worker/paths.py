"""Canonical storage paths shared by every generated verse asset."""

from __future__ import annotations

import re

from .errors import PermanentWorkerError
from .models import ClaimedJob

TRANSLATION_PATTERN = re.compile(r"^[A-Z0-9_-]{2,16}$")
VERSION_PATTERN = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._-]{1,127}$")
VOICE_PATTERN = re.compile(r"^[a-z0-9][a-z0-9_-]{1,63}$")
BOOK_PATTERN = re.compile(r"^(?:[1-3][A-Z]{2}|[A-Z]{3})$")


def build_storage_path(job: ClaimedJob) -> str:
    if not TRANSLATION_PATTERN.fullmatch(job.translation_code):
        raise PermanentWorkerError("invalid_translation", "Invalid translation code")
    if not VERSION_PATTERN.fullmatch(job.model_version):
        raise PermanentWorkerError("invalid_model_version", "Invalid model version")
    if not VOICE_PATTERN.fullmatch(job.voice_id):
        raise PermanentWorkerError("invalid_voice", "Invalid voice identifier")
    if not BOOK_PATTERN.fullmatch(job.book_id):
        raise PermanentWorkerError("invalid_book", "Invalid canonical book identifier")
    if not 1 <= job.chapter <= 999 or not 1 <= job.verse <= 999:
        raise PermanentWorkerError("invalid_reference", "Invalid chapter or verse")
    return (
        f"{job.translation_code}/{job.model_version}/{job.voice_id}/"
        f"{job.book_id}/{job.chapter:03d}/{job.verse:03d}.mp3"
    )
