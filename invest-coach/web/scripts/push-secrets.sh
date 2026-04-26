#!/usr/bin/env bash
# Push every key from .env.local to Cloudflare Workers as a secret.
# Run from invest-coach/web:   bash scripts/push-secrets.sh
#
# - Uses `wrangler secret bulk` so it's a single API call.
# - Values never touch disk anywhere except your existing .env.local.
# - Skips comments and empty lines.
# - Trims surrounding quotes if present.
set -euo pipefail

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "error: $ENV_FILE not found. Run from invest-coach/web." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "error: node not found." >&2
  exit 1
fi

# Use Node to safely parse the .env file into JSON (handles quoted values,
# escaped chars, equals signs in values, etc.) and pipe to wrangler.
JSON=$(node -e '
  const fs = require("fs");
  const lines = fs.readFileSync(process.argv[1], "utf8").split(/\r?\n/);
  const out = {};
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith("\"") && val.endsWith("\"")) ||
        (val.startsWith("\x27") && val.endsWith("\x27"))) {
      val = val.slice(1, -1);
    }
    if (key) out[key] = val;
  }
  process.stdout.write(JSON.stringify(out));
' "$ENV_FILE")

KEY_COUNT=$(node -e 'console.log(Object.keys(JSON.parse(process.argv[1])).length)' "$JSON")
echo "Pushing $KEY_COUNT secrets to Cloudflare worker 'project-m2'..."

# wrangler secret bulk expects JSON on stdin (use "-" as the path arg).
echo "$JSON" | npx --yes wrangler secret bulk -

echo "Done. Check Cloudflare dashboard → Workers & Pages → project-m2 → Settings → Variables and Secrets."
