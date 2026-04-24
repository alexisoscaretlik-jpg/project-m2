#!/bin/bash
# End-to-end newsletter test:
#   1. Start Next.js dev server on port 3000
#   2. Wait for it to become ready
#   3. Curl the weekly-digest preview endpoint
#   4. Show the first ~60 lines of rendered HTML
#   5. Stop the server
#
# Run from the invest-coach/web dir:
#   bash test_preview.sh

set -u
set -o pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "${HERE}"

if [ ! -f .env.local ]; then
  echo "ERROR: .env.local missing in ${HERE}"
  exit 1
fi

# Load CRON_SECRET for the curl auth header
CRON_SECRET=$(grep '^CRON_SECRET=' .env.local | cut -d= -f2-)
if [ -z "${CRON_SECRET}" ]; then
  echo "ERROR: CRON_SECRET not set in .env.local"
  exit 1
fi

LOG=/tmp/invest-coach-dev.log
PID=""

cleanup() {
  if [ -n "${PID}" ] && kill -0 "${PID}" 2>/dev/null; then
    echo ""
    echo "==> Stopping dev server (pid ${PID})"
    kill "${PID}" 2>/dev/null || true
    sleep 1
    kill -9 "${PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "============================================"
echo "  newsletter preview test"
echo "============================================"

echo ""
echo "==> [1/4] Starting next dev on port 3000 (log: ${LOG})"
# Use `npx next dev` so we don't care whether .bin is on PATH
(npx --yes next dev --port 3000 > "${LOG}" 2>&1) &
PID=$!
echo "    pid=${PID}"

echo ""
echo "==> [2/4] Waiting for server (max 60s)"
READY=0
for i in $(seq 1 60); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -qE "^(200|301|302|307|308|404)$"; then
    READY=1
    echo "    ready after ${i}s"
    break
  fi
  sleep 1
done

if [ "${READY}" -ne 1 ]; then
  echo "    server never became ready. Tail of log:"
  tail -40 "${LOG}"
  exit 1
fi

echo ""
echo "==> [3/4] GET /api/cron/weekly-digest?preview=1"
HTTP_CODE=$(curl -s -o /tmp/digest.html -w "%{http_code}" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "http://localhost:3000/api/cron/weekly-digest?preview=1")

echo "    HTTP ${HTTP_CODE}"
BYTES=$(wc -c < /tmp/digest.html)
echo "    ${BYTES} bytes received"

if [ "${HTTP_CODE}" != "200" ]; then
  echo ""
  echo "    Response body:"
  head -40 /tmp/digest.html
  exit 1
fi

echo ""
echo "==> [4/4] First 60 lines of rendered digest HTML:"
echo "    (full HTML saved at /tmp/digest.html — open it in a browser if you want a visual)"
echo "------------------------------------------------------------"
head -60 /tmp/digest.html
echo "------------------------------------------------------------"

echo ""
echo "============================================"
echo "  Preview test PASSED"
echo "============================================"
echo ""
echo "To see it rendered visually: open /tmp/digest.html"
echo "Or open http://localhost:3000/api/cron/weekly-digest?preview=1 while dev is running (with auth header)."
