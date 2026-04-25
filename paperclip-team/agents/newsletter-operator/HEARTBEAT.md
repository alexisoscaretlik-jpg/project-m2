# HEARTBEAT.md -- Newsletter Operator Heartbeat Checklist

Run on every wake.

## 1. Identity & Context

- `GET /api/agents/me`.
- Wake context: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`.

## 2. Get Assignments

- `GET issues?assigneeAgentId={your-id}`. Prioritize `in_progress` > `in_review` > `todo`.

## 3. Cron-Health Sweep (every wake)

Verify last-run timestamps within expected windows:

- `cron/fetch-tweets` (daily 07:00) — last run < 25h ago.
- `cron/watch-kevin` (daily 14:00) — last run < 25h ago.
- `cron/weekly-digest` (weekly) — last run within window.

If any cron missed its window → escalate (issue tagged `@ceo`).

## 4. Pre-Send Pipeline

When a send is scheduled (issue assigned by `editorial-lead`):

```bash
# Preview
curl -H "Authorization: Bearer $CRON_SECRET" \
  "$BASE_URL/api/cron/weekly-digest?preview=1" -o /tmp/digest-preview.html
```

Visual QA: open the preview, compare to last week's `reports/newsletter/YYYY-MM-DD.md`. Check:

- Cards section renders (3 cards or fewer is OK; 0 cards is a flag).
- Tweets section renders if any in past 7d.
- Kevin briefs section renders if any in past 7d.
- Metric (chiffre de la semaine) renders.
- Tip renders.

If any section unexpectedly empty → comment, tag the responsible agent (`@twitter-curator`, `@yt-distiller`), set `blocked`.

## 5. Subject A/B

Generate 3 candidate subjects per send. Each:
- ≤ 50 chars (mobile preview).
- Numeric or specific (e.g., "AV après 8 ans : 4 600€/an exonérés"), not vague ("Newsletter cette semaine").
- No `vous`. No "découvrez". No "incroyable".

Hand to `editorial-lead` for pick. Log all 3 + the pick to `reports/newsletter/`.

## 6. Live Send Gate

Two-gate check before live send:

1. `editorial-lead` comment "Approved for Reviewer gate".
2. Reviewer (human) comment "Approved for send" or explicit issue status flip.

Without both: do not fire the live send. Comment, wait.

## 7. Post-Send

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "$BASE_URL/api/cron/weekly-digest"
```

Read response: `{ sent, failures, total, cards, tip }`. Log to `reports/newsletter/YYYY-MM-DD.md`:

- Subject used (and the 2 alternatives).
- sent / failures / total counts.
- Failure reasons (top 3).
- Open rate at +24h if available.

If `failures / total > 5%` → escalate immediately.

## 8. Exit

- Comment on in_progress, exit clean.

## Hard rules

- Never trigger live send without both gates (editorial + Reviewer).
- Never edit copy strings — those are `content-manager`'s.
- Never modify `vercel.json` cron schedule.
- Never bulk-mutate `newsletter_subscribers`.
- Budget cap $0.10/turn.
