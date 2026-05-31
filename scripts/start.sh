#!/usr/bin/env bash
set -euo pipefail

# Render provides PORT dynamically; default for local fallback.
PORT="${PORT:-10000}"

exec gunicorn \
  --bind "0.0.0.0:${PORT}" \
  --workers "${WEB_CONCURRENCY:-2}" \
  --threads "${GUNICORN_THREADS:-4}" \
  --timeout "${GUNICORN_TIMEOUT:-60}" \
  server:app
