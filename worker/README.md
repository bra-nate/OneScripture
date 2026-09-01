# Kokoro worker

Phase 4 runs as a private, single-concurrency Python service separate from
Next.js. It loads the pinned Kokoro model once, atomically claims durable jobs,
generates and validates canonical MP3s, uploads them to private Supabase
Storage, and records completion or a bounded retry.

## Validate locally

```sh
python3 -m unittest discover -s worker/tests -v
PYTHONPATH=worker/src \
  NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=local-check-only \
  python3 -m onescripture_worker --check
```

## Validate the container

Copy `worker.env.example` to the ignored `worker.env`, fill in the hosted
Supabase values, then validate and start the durable service:

```sh
docker compose -f worker/compose.yaml run --rm kokoro-worker --check
docker compose -f worker/compose.yaml up -d kokoro-worker
```

The image runs as UID/GID 10001, stores model downloads in a named cache volume,
limits the service to two CPUs and 5 GiB of memory, restarts unless stopped, and
does not expose a network port. `--once` processes at most one available job and
is intended for verification or maintenance.

## Hosted proof

With `.env.local` configured and the image built, the controlled recovery and
end-to-end proof is:

```sh
npm run worker:proof:prepare
docker run --rm --env-file .env.local \
  -e ONESCRIPTURE_WORKER_ID=kokoro-worker-proof \
  --memory=5g --cpus=2 \
  -v worker_kokoro-model-cache:/home/onescripture/.cache/huggingface \
  worker-kokoro-worker:latest --once
npm run worker:proof:verify
```

`prepare` creates one fresh John 3:17 `am_michael` asset and verifies both an
abandoned-lock recovery and a retryable failure. The real worker then completes
the third and final attempt. `verify` checks that there is exactly one reusable
ready asset, one completed job, and a valid signed MP3 byte-range response.
