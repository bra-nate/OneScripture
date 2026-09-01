"""Typed queue records exchanged with the database contract."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .errors import PermanentWorkerError


@dataclass(frozen=True, slots=True)
class ClaimedJob:
    job_id: str
    asset_id: str
    attempt_count: int
    max_attempts: int
    scripture_verse_id: int
    voice_id: str
    model_id: str
    model_version: str
    text_hash: str
    canonical_text: str
    translation_code: str
    book_id: str
    chapter: int
    verse: int

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "ClaimedJob":
        try:
            return cls(
                job_id=str(row["job_id"]),
                asset_id=str(row["asset_id"]),
                attempt_count=int(row["attempt_count"]),
                max_attempts=int(row["max_attempts"]),
                scripture_verse_id=int(row["scripture_verse_id"]),
                voice_id=str(row["voice_id"]),
                model_id=str(row["model_id"]),
                model_version=str(row["model_version"]),
                text_hash=str(row["text_hash"]),
                canonical_text=str(row["canonical_text"]),
                translation_code=str(row["translation_code"]),
                book_id=str(row["book_id"]),
                chapter=int(row["chapter"]),
                verse=int(row["verse"]),
            )
        except (KeyError, TypeError, ValueError) as error:
            raise PermanentWorkerError(
                "invalid_claim_payload", "Database returned an invalid claimed job"
            ) from error
