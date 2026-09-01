"""Small structured logger for machine-readable worker events."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any


def log_event(event: str, **fields: Any) -> None:
    print(
        json.dumps(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event": event,
                **fields,
            },
            sort_keys=True,
            default=str,
        ),
        flush=True,
    )
