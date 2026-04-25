# TOOLS.md -- Product Builder

## Allowed

- `Read`, `Glob`, `Grep` across the repo. Including `node_modules/next/dist/docs/`.
- `Edit`, `Write` on:
  - `invest-coach/web/app/**` (excluding `app/api/cron/**`).
  - `invest-coach/web/components/**`.
  - `invest-coach/web/lib/**` (read-only by default; only when ticket explicitly assigns the lib file).
- `Bash` — `bun run typecheck`, `bun run lint`, `bun run build`, `git log/diff` read-only.
- Browser MCP (`mcp__Claude_in_Chrome__*`) — preview URL smoke checks. Note: terminals/IDEs are click-tier in computer-use; for typing/dev shells, use the regular `Bash` tool.

## Forbidden

- Editing `app/api/cron/**`.
- Editing `lib/tax/**`, `lib/bank/**` (unless ticket explicitly delegates).
- Editing copy strings in templates / landing / articles.
- Schema migrations (`supabase/migrations/**`).
- Infra files: `wrangler.toml`, `vercel.json`, OpenNext configs.
- `git push`, `git tag`, deployments.
- Adding new third-party deps without justification.

## References

- Full spec: `.claude/agents/product-builder.md`.
- **Read-this-first**: `invest-coach/web/node_modules/next/dist/docs/`.
- Universal rules: `invest-coach/web/AGENTS.md` (Next.js warning at top is binding).
