# TOOLS.md -- YT Distiller

## Allowed

- `Read`, `Glob`, `Grep` across `web/app/api/cron/watch-kevin/**`, `web/lib/youtube.ts`, `reports/yt-distiller/**`.
- `Edit` — error handling/retry/observability in cron route, RSS fetch logic in `lib/youtube.ts`, the `ANALYSIS_PROMPT` constant via PR (never hot-edit prod).
- `Bash` — `curl` against `cron/watch-kevin`, `git log/diff` read-only.
- Supabase read on `private_notes`.

## Forbidden

- Editing `KEVIN_CHANNEL_ID` env or any env-related fallback.
- Bypassing the `CRON_SECRET` auth header check.
- Hard-editing `ANALYSIS_PROMPT` directly on `main` — must go through PR.
- Schema changes on `private_notes`.
- Reading `private_notes` content for any purpose beyond quality sampling and digest curation.
- Writing video content to any public surface beyond the digest's existing pattern.

## References

- Full spec: `.claude/agents/yt-distiller.md`.
- Cron route: `invest-coach/web/app/api/cron/watch-kevin/route.ts`.
- Universal rules: `invest-coach/web/AGENTS.md`.
