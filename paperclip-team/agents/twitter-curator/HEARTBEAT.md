# HEARTBEAT.md -- Twitter Curator Heartbeat Checklist

Run on every wake.

## 1. Identity & Context

- `GET /api/agents/me`.
- Wake: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`.

## 2. Pipeline Health (every wake)

```bash
# Confirm cron ran in last 25h
curl -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/cron/fetch-tweets" | jq
```

If 401 / 503 / quota error → file an incident, tag `@ceo`.

Check `tweets` table row count delta vs yesterday. If 0 new rows for > 1 day → escalate.

## 3. Get Assignments

- `GET issues?assigneeAgentId={your-id}`. Prioritize `in_progress` > `in_review` > `todo`.

## 4. Daily Curation Loop

For each new tweet (last 24h):

1. **Engagement score** = likes + retweets + replies + quotes.
2. **Signal density** — does the tweet contain numbers, ticker symbols, time horizon? Score 0–3.
3. **Asset class tag** — index | equity | commodity | crypto | bond | other.
4. **Sentiment** — bullish | bearish | neutral. When in doubt: neutral.
5. **Verify cited numbers** — if the tweet says "oil $115", spot-check TradingView. If wrong: flag, don't surface.
6. **Spam filter** — sponsored, giveaway, reply-to-self → soft-flag. Never delete.

Update `tweets` row with tags. Use existing columns only. If a column is missing (e.g., `sentiment`, `hidden`) → file ticket to `@product-builder` for schema, do not add it yourself.

## 5. Surface Top to /charts and Digest

Past 7 days:
- Top 3 by engagement × signal_density.
- Hand to `newsletter-operator` for digest inclusion (comment on the digest issue).
- Confirm `/charts` page query renders these tweets (read `app/charts/page.tsx` selection logic — yours to maintain).

## 6. Daily Log

Write `reports/twitter/YYYY-MM-DD.md`:

```
## YYYY-MM-DD

- Cron status: ok | error: <msg>
- New tweets: N
- Top engagement: id=<id>, count=<n>, asset=<class>, sentiment=<sent>
- Soft-flagged spam: N
- Anomalies: <list>
- Action items: <list>
```

## 7. Hand-off

- Schema needed (new column) → `@product-builder`.
- Source quality drift > 7 days → `@ceo`.
- Layout change on `/charts` → `@product-builder`.
- New handle requested → `@ceo` (Reviewer-only decision).

## 8. Exit

- Comment on in_progress, exit clean.

## Hard rules

- Never add a new tracked handle (env change = Reviewer).
- Never delete or hard-mutate `tweets` rows.
- Never push tweet content into `private_notes`.
- Never paraphrase a tweet into a public artifact without quoting + linking the original.
- Never change `lib/twitter.ts` API contract — that's a Builder ticket.
- Budget cap $0.15/turn.
