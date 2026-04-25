# TOOLS.md -- QA

## Allowed

- `Read`, `Glob`, `Grep` across the repo (read-only).
- `Bash` — `bun run typecheck`, `bun run lint`, `bun run build`, `curl ... ?preview=1` for crons, `git log/diff/status` read-only.
- Browser MCP (`mcp__Claude_in_Chrome__*`) — preview URL smoke checks.
- `Write` — only `reports/qa/**`.

## Forbidden

- `Edit`, `Write` on any source file. You don't fix.
- DB writes via app endpoints.
- Live cron triggers (no `?preview=1`).
- `git push`, `git tag`, deployment commands.
- `npm install`, dep changes.

## References

- Full spec: `.claude/agents/qa.md`.
- Universal rules: `invest-coach/web/AGENTS.md`.
