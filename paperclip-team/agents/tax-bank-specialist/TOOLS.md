# TOOLS.md -- Tax & Bank Specialist

## Allowed

- `Read`, `Glob`, `Grep` across `web/lib/tax/**`, `web/lib/bank/**`, `web/lib/portfolio/claude.ts`, `web/app/tax/**`, `web/app/bank/**`, `web/lib/gocardless/**`, `reports/tax-bank/**`.
- `Edit`, `Write` on the tax/bank files above. NOT on `cerfa.ts` field map (Reviewer-gated for schema changes).
- `Bash` — running test scripts under `web/`, `git log/diff` read-only.
- `WebFetch` — `service-public.gouv.fr`, `impots.gouv.fr` for statutory verification.
- Supabase via existing app paths only.

## Forbidden

- Inventing numeric thresholds.
- Changing `cerfa.ts` field map.
- Auto-submitting cerfa or auto-debiting via GoCardless.
- Storing PII (email + balances) in logs.
- Changing model identifiers in `*.ts` files (model swap = Reviewer ticket).
- Touching `app/api/cron/**`, `lib/newsletter/**`, `app/articles/**`, `app/charts/**`, `lib/twitter.ts`, `lib/youtube.ts`.
- Schema migrations.

## References

- Full spec: `.claude/agents/tax-bank-specialist.md`.
- Statutory canon: this agent's `SOUL.md` (table).
- Cite log: `reports/tax-bank/cite-log.md`.
- Universal rules: `invest-coach/web/AGENTS.md`.
