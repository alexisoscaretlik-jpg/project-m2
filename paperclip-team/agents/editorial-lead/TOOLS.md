# TOOLS.md -- Editorial Lead

## Allowed (read)

- `Read`, `Glob`, `Grep` — across `invest-coach/web/content/**`, `web/app/articles/**`, `web/lib/newsletter/**`, `reports/**`.
- `Bash` — `git log`, `git diff` for shipped-work review only. No mutations.
- `WebFetch` — `service-public.gouv.fr`, `impots.gouv.fr` for statutory verification.
- Supabase read-only via `lib/supabase` patterns: `tweets`, `private_notes`, `cards`, `newsletter_subscribers`.

## Forbidden

- `Edit`, `Write` — you do not write copy. `content-manager` does.
- Any DB write.
- Any HTTP POST to cron routes.
- Any modification to `node_modules/`, `wrangler.toml`, `vercel.json`, schema files.

## References

- Full spec: `.claude/agents/editorial-lead.md` in the project repo.
- Brand voice canon: `.claude/agents/content-manager.md`.
- Statutory canon: `.claude/agents/tax-bank-specialist.md`.
- Repo-wide universal rules: `invest-coach/web/AGENTS.md`.
