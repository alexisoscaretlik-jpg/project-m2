#!/bin/bash
# Daily at 07:00 — hits the local /api/cron/fetch-tweets endpoint, which
# pulls the latest tweets from TWITTER_CREATOR_HANDLE and upserts them
# into Supabase. The weekly-digest cron later reads from that table.

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

echo "[$(date)] Fetching tweets..."
RESPONSE=$(curl -fsS -w "\nHTTP %{http_code}\n" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:3000/api/cron/fetch-tweets)
RC=$?

echo "${RESPONSE}"

if [ "${RC}" -ne 0 ]; then
  echo "[$(date)] curl failed with exit ${RC}" >&2
  exit ${RC}
fi

echo "[$(date)] Done."
