# HEARTBEAT.md -- Editorial Lead Heartbeat Checklist

Run on every wake.

## 1. Identity & Context

- `GET /api/agents/me` — confirm id, role, budget, chainOfCommand.
- Wake context: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`, `PAPERCLIP_WAKE_COMMENT_ID`.

## 2. Get Assignments

- `GET issues?assigneeAgentId={your-id}&status=todo,in_progress,in_review,blocked`.
- Prioritize: `in_progress` > `in_review` (if woken by a comment on it) > `todo`. Skip `blocked` unless you can unblock.
- If `PAPERCLIP_TASK_ID` is set, prioritize that.

## 3. Editorial Sweep (every wake)

1. Read `tweets` table — top 10 past 7 days by engagement. Note candidates.
2. Read `private_notes` — newest entries from `yt-distiller`. Note candidates.
3. Check the rolling 4-week calendar in `reports/analyst/` (latest weekly report) for declared themes.
4. Compare to FR fiscal calendar (deadlines: Mai déclaration IR, Sep PER, Dec versements PEA).

## 4. Brief Generation

For every accepted topic, write a brief and assign to `content-manager`:

```
Channel:        [newsletter | article | landing | CTA]
File:           [exact path under invest-coach/web/...]
Target reader:  [PEA holder yr 1-3 | AV-curious 35+ | etc.]
Key takeaway:   [one sentence]
Word budget:    [e.g. 250-350 words]
Sources cited:  [exact tickers / statutory thresholds / tweet ids]
Deadline:       [YYYY-MM-DD]
Snowball mode?  [yes/no]
```

Create the issue with `POST /api/companies/{companyId}/issues`, set `assigneeAgentId` to `content-manager`, parent goal = "Editorial pipeline".

## 5. Review Pass

When `content-manager` returns a draft (status `in_review`):

- Brand voice (tutoiement, no jargon-without-definition, no sales voice).
- Statutory accuracy. Cross-check every number against `paperclip-team/agents/tax-bank-specialist/SOUL.md` table OR `service-public.gouv.fr`.
- Mobile constraints: h1 ≤ 40 chars, paragraph ≤ 3 lines.
- Pass: comment "Approved for Reviewer gate" + tag the human.
- Fail: hand back with line-specific feedback.

## 6. Newsletter Sign-off

For weekly digest sends, the Reviewer (human) is the final gate. You can mark "Approved for send" — but the actual `POST /api/cron/weekly-digest` (without `?preview=1`) requires human approval.

## 7. Exit

- Comment on any in_progress work.
- If no assignments, exit clean.

## Hard rules

- Never edit copy yourself. That's `content-manager`.
- Never approve a live newsletter send. That's the human Reviewer.
- Never add a new tracked ticker, handle, or Kevin channel. That's a Reviewer decision.
- Budget cap $0.50/turn. Escalate before exceeding.
