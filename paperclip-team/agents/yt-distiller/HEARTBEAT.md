# HEARTBEAT.md -- YT Distiller Heartbeat Checklist

Run on every wake.

## 1. Identity & Context

- `GET /api/agents/me`.
- Wake: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`.

## 2. Pipeline Health (every wake)

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/cron/watch-kevin" | jq
```

Response: `{ ok, channel, model, seen, new, saved, results: [{id, status, title, error?}] }`. Status ∈ `saved | empty | gemini-error | db-error`.

If quota / auth errors > 1 cycle → escalate `@ceo`.

If backlog (`new` > `saved` + skip count, repeated) → file ticket to raise `YT_MAX_VIDEOS_PER_RUN` (Reviewer decides, cost trade-off).

## 3. Get Assignments

- `GET issues?assigneeAgentId={your-id}`. Prioritize `in_progress` > `in_review` > `todo`.

## 4. Failure Recovery

For each result with status ∈ `gemini-error | db-error | empty`:
- Retry once.
- If still failing: log to `reports/yt-distiller/YYYY-MM-DD.md`, skip. Don't block the queue.

## 5. Weekly Quality Sample

On Monday wakes (or first wake of the week):

1. Pick 1 random `private_notes` row from past 7 days where `source LIKE 'youtube-%'`.
2. Re-watch the source video manually (open URL in browser MCP).
3. Score the distillation on:
   - Signal density (no fluff, no sponsor reads in output).
   - Ticker accuracy (every ticker mentioned is correctly transcribed).
   - Paraphrase strength (no verbatim segments).
   - Language match (FR for FR/EU, EN otherwise).
4. Log to `reports/yt-distiller/samples/YYYY-WW.md`.
5. If quality fails > 2 weeks running → file prompt-revision ticket.

## 6. Prompt Iteration

The `ANALYSIS_PROMPT` constant lives in `web/app/api/cron/watch-kevin/route.ts`.

To iterate:
1. Branch + edit the constant.
2. Dev run with `YT_MAX_VIDEOS_PER_RUN=1` against a known video.
3. Diff the output vs current production.
4. PR with the diff + sample. Reviewer-gated merge.

Never hot-edit on a running production cron.

## 7. Daily Log

Write `reports/yt-distiller/YYYY-MM-DD.md`:

```
## YYYY-MM-DD

- Cron: ok
- Seen: N | New: N | Saved: N | Errored: N
- Errors: [{id, error}, ...]
- Backlog estimate: N
```

## 8. Hand-off

- Schema needed → `@product-builder` (schema = Reviewer).
- Channel addition request → `@ceo`.
- Prompt revision PR → `@ceo` for review-and-merge gate.

## 9. Exit

- Comment on in_progress, exit clean.

## Hard rules

- Never lift verbatim quotes from a video into a public artifact (newsletter, article).
- Never change `KEVIN_CHANNEL_ID` env without Reviewer approval.
- Never bypass auth header check on cron route.
- Never read/summarize unrelated channels.
- Never write video URLs / thumbnails to public surfaces beyond the digest pattern.
- Budget cap $0.30/turn during prompt work.
