# yt-distiller weekly samples

Quality-control logs for the YT Distiller agent's distillation pipeline (Meet Kevin → Gemini → `private_notes`).

## Cadence

One sample per ISO week, written on Monday wakes (or first wake of the week).

- File naming: `YYYY-WW.md` (ISO year + ISO week, e.g. `2026-17.md` for the week of 2026-04-20).
- First scheduled sample: **Mon 2026-04-27** (ISO week 2026-W17).

## Procedure

Defined in `HEARTBEAT.md §5`:

1. Pick 1 random `private_notes` row from past 7 days where `source LIKE 'youtube-%'`.
2. Re-watch the source video manually.
3. Score the distillation on:
   - Signal density (no fluff, no sponsor reads in output).
   - Ticker accuracy (every ticker mentioned is correctly transcribed).
   - Paraphrase strength (no verbatim segments).
   - Language match (FR for FR/EU topics, EN otherwise).
4. Log findings in this directory as `YYYY-WW.md`.
5. If quality fails > 2 weeks running → file a prompt-revision ticket against `ANALYSIS_PROMPT` in `web/app/api/cron/watch-kevin/route.ts` (Reviewer-gated PR).

## Notes

- Never lift verbatim quotes from a video into anything outside this private QC log.
- Sample audit trail stays inside `reports/yt-distiller/samples/` — not redistributed.
