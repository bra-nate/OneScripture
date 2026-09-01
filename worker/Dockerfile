FROM python:3.12.14-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app/src \
    HF_HOME=/home/onescripture/.cache/huggingface

RUN apt-get update \
    && apt-get install --yes --no-install-recommends \
        ca-certificates \
        espeak-ng \
        ffmpeg \
        libsndfile1 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 10001 onescripture \
    && useradd --system --uid 10001 --gid onescripture --create-home onescripture

WORKDIR /app

COPY worker/requirements.txt ./requirements.txt
RUN python -m pip install \
        --index-url https://download.pytorch.org/whl/cpu \
        "torch==2.13.0+cpu" \
    && python -m pip install --requirement requirements.txt

RUN python -m pip install --no-deps \
    "https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl"

RUN mkdir -p /home/onescripture/.cache/huggingface \
    && chown -R onescripture:onescripture /home/onescripture/.cache

COPY worker/src ./src

USER onescripture

ENTRYPOINT ["python", "-m", "onescripture_worker"]
