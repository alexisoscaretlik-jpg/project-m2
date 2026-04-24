#!/bin/bash
# Hits the weekly-digest endpoint on the local Next.js server.
# Runs on a launchd calendar schedule (Mondays 08:00 local time).

set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${HERE}/.env.local"

if [ ! -f "${ENV_FILE}" ]; then
  echo "[$(date)] ERROR: ${ENV_FILE} not found" >&2
  exit 1
fi

CRON_SECRET=$(grep '^CRON_SECRET=' "${ENV_FILE}" | cut -d= -f2-)
if [ -z "${CRON_SECRET}" ]; then
  echo "[$(date)] ERROR: CRON_SECRET empty in ${ENV_FILE}" >&2
  exit 1
fi

echo "[$(date)] Triggering weekly digest..."
RESPONSE=$(curl -fsS -w "\nHTTP %{http_code}\n" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:3000/api/cron/weekly-digest)
RC=$?

echo "${RESPONSE}"

if [ "${RC}" -ne 0 ]; then
  echo "[$(date)] curl failed with exit ${RC}" >&2
  exit ${RC}
fi

echo "[$(date)] Done."
