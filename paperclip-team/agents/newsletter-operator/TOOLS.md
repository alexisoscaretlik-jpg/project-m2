# TOOLS.md -- Newsletter Operator

## Allowed

- `Read`, `Glob`, `Grep` across `web/lib/newsletter/**`, `web/app/api/cron/**`, `web/lib/email.ts`, `reports/newsletter/**`.
- `Edit` — only on operational logic in `web/app/api/cron/weekly-digest/route.ts` and `web/lib/newsletter/templates.ts` (copy strings are forbidden — `content-manager` only).
- `Bash` — `curl` against cron routes (with `?preview=1` for any non-approved send), `git log/diff` read-only.
- `Read` Supabase via app endpoints — never direct DB writes.

## Forbidden

- Editing copy strings inside templates / cron route file (e.g., `rotations[]`, tip strings).
- Live cron triggers without two gates.
- DB writes on `newsletter_subscribers`.
- Modifying `vercel.json` cron schedule.
- Adding new digest sections.

## References

- Full spec: `.claude/agents/newsletter-operator.md`.
- Cron route: `invest-coach/web/app/api/cron/weekly-digest/route.ts`.
- Universal rules: `invest-coach/web/AGENTS.md`.
