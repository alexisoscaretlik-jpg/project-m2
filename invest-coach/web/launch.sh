#!/bin/bash
# Wrapper launchd calls. Sets PATH (launchd's is minimal), cds into the
# project, execs next start on port 3000.

set -u

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export NODE_ENV=production
export PORT=3000

cd "$(dirname "$0")"

# If a build doesn't exist yet, do one. Skipped on subsequent boots.
if [ ! -d .next ]; then
  echo "[launch.sh] First boot — running npm run build"
  /opt/homebrew/bin/npm run build
fi

# Bind to loopback so /admin and the whole app are only reachable from
# this Mac. If you later expose a tunnel (Cloudflare, Tailscale) point
# it at 127.0.0.1:3000 and block the admin route at the tunnel.
exec /opt/homebrew/bin/npm run start -- -H 127.0.0.1
