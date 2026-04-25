# TOOLS.md -- Analyst

## Allowed

- `Read`, `Glob`, `Grep` across the whole repo (read-only).
- `Bash` — `git log`, `git diff`, `git show`, read-only DB queries via `psql` or app endpoints, `curl` GET against any non-mutating endpoint.
- `Write` — only `reports/analyst/**`.
- `WebFetch` — for benchmarking/citations only.

## Forbidden

- `Edit`, `Write` on any file outside `reports/analyst/**`.
- Mutating SQL (`UPDATE`, `INSERT`, `DELETE`).
- Live cron triggers.
- `git push`, `git tag`, deployment commands.
- Including PII in reports.

## References

- Full spec: `.claude/agents/analyst.md`.
- Universal rules: `invest-coach/web/AGENTS.md`.
- Other agents' reports: `reports/{newsletter,twitter,yt-distiller,qa,tax-bank}/**`.
