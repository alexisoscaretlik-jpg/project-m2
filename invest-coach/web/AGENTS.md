<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cloudflare deploy quirks

- **Build command override is load-bearing** (for now). Cloudflare's build trigger has `build_command` set to:
  ```
  npm install --no-save --no-audit --no-fund @opennextjs/cloudflare@^1.19.4 wrangler@^4.84.1 && npx opennextjs-cloudflare build
  ```
  The repo's `package.json` does NOT declare these two as devDependencies — so local files diverge slightly. To "properly" fix: add them to devDependencies, regenerate `package-lock.json`, push both, then change Cloudflare's build_command back to plain `npx opennextjs-cloudflare build`. The local files (your Mac) already have the deps wired in; you just need to push from there since the agent sandbox can't push the large lockfile through the web UI.

- **No `proxy.ts`.** Next.js 16's Proxy abstraction is Node-only and OpenNext for Cloudflare doesn't support it yet. Auth gating must live per-page (server component `await supabase.auth.getUser()` → `redirect('/login')`).

- **Runtime env vars** live in Cloudflare → Workers → project-m2 → Settings → Variables and Secrets. `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` should be marked **Secret** (not Plaintext); the rest can stay Plaintext.
