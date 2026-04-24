#!/bin/bash
# Daily at 14:00 — hits /api/cron/watch-kevin on the local Next.js server.
# The route fetches Kevin's YouTube RSS, has Gemini watch any new videos,
# and stores the summaries in private_notes.

set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${HERE}/.env.local"

if [ ! -f "${ENV_FILE}" ]; then
  echo "[$(date)] ERROR: ${ENV_FILE} not found" >&2
  exit 1
fi

CRON_SECRET=$(grep '^CRON_SECRET=' "${ENV_FILE}" | cut -d= -f2-)
if [ -z "${CRON_SECRET}" ]; then
  echo "[$(date)] ERROR: CRON_SECRET empty" >&2
  exit 1
fi

echo "[$(date)] Asking Gemini to watch Kevin's latest videos..."
RESPONSE=$(curl -fsS -w "\nHTTP %{http_code}\n" \
  --max-time 290 \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:3000/api/cron/watch-kevin)
RC=$?

echo "${RESPONSE}"

if [ "${RC}" -ne 0 ]; then
  echo "[$(date)] curl failed with exit ${RC}" >&2
  exit ${RC}
fi

echo "[$(date)] Done."
