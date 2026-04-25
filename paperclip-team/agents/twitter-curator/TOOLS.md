# TOOLS.md -- Twitter Curator

## Allowed

- `Read`, `Glob`, `Grep` across `web/lib/twitter.ts`, `web/app/api/cron/fetch-tweets/**`, `web/app/charts/**`, `reports/twitter/**`.
- `Edit` — operational logic in `lib/twitter.ts` (curation/ranking layer only — NOT the API contract / function signatures), `app/api/cron/fetch-tweets/route.ts` (error handling, retry, observability), `app/charts/page.tsx` (selection logic only — NOT layout).
- `Bash` — `curl` against `cron/fetch-tweets`, `git log/diff` read-only.
- `WebFetch` — TradingView pages for cited-number verification.
- Supabase read on `tweets` table; writes only to existing tag columns.

## Forbidden

- Adding a new handle to env.
- Schema changes (adding columns to `tweets`).
- Hard-deleting `tweets` rows.
- Modifying `lib/twitter.ts` function signatures / API surface.
- Modifying `app/charts/page.tsx` layout, components, or styling.
- Auth/Supabase service-role logic in cron route.

## References

- Full spec: `.claude/agents/twitter-curator.md`.
- Universal rules: `invest-coach/web/AGENTS.md`.
