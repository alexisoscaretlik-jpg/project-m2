#!/usr/bin/env bash
# Ship Vue Technique end-to-end:
#   0. (one-time) Print the migration SQL if chart_analysis table is missing
#   1. Push TWITTER_CREATOR_HANDLE to Cloudflare Worker secrets
#   2. Build + deploy via OpenNext for Cloudflare (8GB heap)
#   3. Trigger fetch-tweets cron (incremental)
#   4. Trigger analyze-charts cron (Gemini + Claude → chart_analysis rows)
#   5. Print the report and the live URL
#
# Run from invest-coach/web:   bash scripts/ship-vue-technique.sh
set -euo pipefail

cd "$(dirname "$0")/.."
ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "error: $ENV_FILE not found. Run from invest-coach/web." >&2
  exit 1
fi

WORKER_URL="https://project-m2.alexisoscaretlik.workers.dev"
MIGRATION_FILE="../supabase/migrations/2026-04-25-chart-analysis.sql"

get_env() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" | head -1 | sed -E "s/^${key}=//; s/^['\"]//; s/['\"]$//"
}

CRON_SECRET="$(get_env CRON_SECRET)"
HANDLE="$(get_env TWITTER_CREATOR_HANDLE)"
SUPABASE_URL_VAL="$(get_env NEXT_PUBLIC_SUPABASE_URL)"
SUPABASE_ANON="$(get_env NEXT_PUBLIC_SUPABASE_ANON_KEY)"

if [ -z "$CRON_SECRET" ] || [ -z "$HANDLE" ]; then
  echo "error: CRON_SECRET or TWITTER_CREATOR_HANDLE missing in $ENV_FILE" >&2
  exit 1
fi

prettify() {
  if command -v python3 >/dev/null 2>&1; then
    python3 -m json.tool 2>/dev/null || cat
  else
    cat
  fi
}

# ── Step 0: ensure chart_analysis table exists; auto-apply migration if not ──
echo ""
echo "▶︎ Step 0/5 — Checking chart_analysis table"
TABLE_CHECK="$(curl -fsSL -o /dev/null -w "%{http_code}" \
  -H "apikey: $SUPABASE_ANON" \
  -H "Authorization: Bearer $SUPABASE_ANON" \
  "$SUPABASE_URL_VAL/rest/v1/chart_analysis?select=id&limit=1" || true)"
if [ "$TABLE_CHECK" = "200" ]; then
  echo "  ✓ chart_analysis table is present."
else
  echo "  ⚠️  chart_analysis missing (HTTP $TABLE_CHECK). Auto-applying migration…"
  set +e
  node scripts/run-migration.mjs "$MIGRATION_FILE"
  MIG_EXIT=$?
  set -e
  if [ "$MIG_EXIT" != "0" ]; then
    echo ""
    echo "  Migration runner exited $MIG_EXIT. Fix the issue above and re-run."
    exit "$MIG_EXIT"
  fi
fi

# ── Step 1: Cloudflare worker secret push ─────────────────────────────────────
echo ""
echo "▶︎ Step 1/5 — Pushing TWITTER_CREATOR_HANDLE=$HANDLE to Cloudflare worker"
echo "$HANDLE" | npx --yes wrangler secret put TWITTER_CREATOR_HANDLE

# ── Step 2: build + deploy ───────────────────────────────────────────────────
echo ""
echo "▶︎ Step 2/5 — Building & deploying"
NODE_OPTIONS="--max-old-space-size=8192" npm run deploy

# ── Step 3: incremental tweet refresh ────────────────────────────────────────
echo ""
echo "▶︎ Step 3/5 — Refresh tweet inventory (incremental)"
TWEETS_RESP="$(curl -fsSL -H "Authorization: Bearer $CRON_SECRET" \
  "$WORKER_URL/api/cron/fetch-tweets")"
echo "$TWEETS_RESP" | prettify

# ── Step 4: chart analysis pipeline ──────────────────────────────────────────
echo ""
echo "▶︎ Step 4/5 — Running chart-analysis pipeline (target=50, 2-4 min)"
ANALYZE_RESP="$(curl -fsSL --max-time 600 -H "Authorization: Bearer $CRON_SECRET" \
  "$WORKER_URL/api/cron/analyze-charts?target=50")"
echo "$ANALYZE_RESP" | prettify

echo ""
echo "▶︎ Step 5/5 — Done."
echo "    Open:  $WORKER_URL/charts"
