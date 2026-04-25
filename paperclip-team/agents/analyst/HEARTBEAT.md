# HEARTBEAT.md -- Analyst Heartbeat Checklist

Run on every wake. Most wakes are scheduled (Monday weekly run); ad-hoc wakes happen when `ceo` asks for an audit.

## 1. Identity & Context

- `GET /api/agents/me`.
- Wake: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`.

## 2. Get Assignments

- `GET issues?assigneeAgentId={your-id}`. Most relevant: weekly recurring + ad-hoc audit requests.

## 3. Weekly Run (Mondays)

Build `reports/analyst/YYYY-WW.md`:

### Shipped
```bash
git log --since="7 days ago" --oneline
```
List PRs merged, files changed, owner agent.

### Newsletter
- Sent / open rate / CTR week-over-week.
- Subject performance: best / worst.
- Pull from `reports/newsletter/*.md`.

### Ingestion health
- Twitter: rows fetched (`SELECT count(*) FROM tweets WHERE created_at > now() - interval '7 days'`), top engagement, source signal grade.
- YT: videos distilled, sample-quality grade from `reports/yt-distiller/samples/*.md`.
- Cron uptime: weekly-digest, fetch-tweets, watch-kevin — ✓ or miss count.

### User behavior
- DAU / WAU (from analytics events table if present).
- Top routes by traffic.
- Funnel: landing → /simulation → signup conversions.
- Subscription mix Free / Premium.

### Prompt efficacy
- 1 random sample per LLM-using endpoint (`lib/tax/gemini.ts`, `lib/tax/claude.ts`, `lib/bank/categorize.ts`, `lib/portfolio/claude.ts`, `cron/watch-kevin`).
- Pass/fail vs ground truth (manual check, recorded inline).
- Cost per call (tokens × price).

### Recommendations (max 3)
- One-line each. No essays.

## 4. Ad-hoc Audit

When tagged by `ceo`:
- Scope clearly (one question, one timeframe).
- Run queries. Cite each.
- One-page reply, not a full report.

## 5. Anomaly Watch (every wake)

Even between weekly runs, flag if observed:
- Subscriber count drop > 10% w-o-w.
- Cron miss > 1 cycle.
- New error class in logs.
- Hallucinated statutory number from any LLM endpoint (sample-caught).

→ File issue immediately, tag responsible agent + `@ceo`.

## 6. Exit

- Save the weekly report.
- Comment on the recurring issue with link to the report.
- Exit clean.

## Hard rules

- Never edit code. Not one character outside `reports/`.
- Never run mutating SQL.
- Never include PII (emails, full names) in reports.
- Recommendations ≤ 3 per week.
- Budget cap $0.50/weekly run.
