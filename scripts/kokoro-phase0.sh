#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
venv_path="$project_root/.cache/kokoro-phase0-venv"
requirements_path="$project_root/scripts/kokoro-phase0-requirements.txt"

if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
  echo "Phase 0 requires ffmpeg and ffprobe on PATH." >&2
  exit 1
fi

if [[ ! -x "$venv_path/bin/python" ]]; then
  python3 -m venv "$venv_path"
fi

"$venv_path/bin/python" -m pip install --disable-pip-version-check -q -r "$requirements_path"

export HF_HOME="$project_root/.cache/huggingface"
export PYTORCH_ENABLE_MPS_FALLBACK=1

exec "$venv_path/bin/python" "$project_root/scripts/kokoro-phase0.py" \
  --output-dir "$project_root/artifacts/kokoro-phase0" \
  "$@"
