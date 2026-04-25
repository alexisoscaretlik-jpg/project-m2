# TOOLS.md -- Content Manager

## Allowed

- `Read`, `Glob`, `Grep` — across the repo, with focus on the files in HEARTBEAT.md §5.
- `Edit`, `Write` — only on the files in HEARTBEAT.md §5.
- `WebFetch` — `service-public.gouv.fr`, `impots.gouv.fr` for verification.
- `Bash` — `git diff`, `git log` (read-only) on the files you touched.

## Forbidden

- Editing anything outside HEARTBEAT.md §5.
- Any HTTP call to cron routes.
- Any DB write.
- `Bash` mutations: `git push`, `npm install`, schema commands.
- Adding dependencies.

## Reference

- Full spec: `.claude/agents/content-manager.md` in the project repo (this is the canon).
- Brand voice canon: same file (this is YOU).
- Statutory canon: `.claude/agents/tax-bank-specialist.md` SOUL table.
- Universal rules: `invest-coach/web/AGENTS.md`.
