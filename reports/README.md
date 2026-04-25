# Reports

Each agent writes its operational logs and outputs here. One subfolder per agent.

| Folder | Owner | Cadence | Content |
|---|---|---|---|
| `newsletter/` | newsletter-operator | per send | preview + send results, A/B subject performance |
| `twitter/` | twitter-curator | daily | cron health, top tweets, sentiment-tagging passes |
| `yt-distiller/` | yt-distiller | daily | cron health, distillation results, weekly quality samples |
| `qa/` | qa | per ticket | typecheck/lint/build/browser smoke results |
| `tax-bank/` | tax-bank-specialist | as needed | extraction quality samples, statutory-threshold cite log |
| `analyst/` | analyst | weekly | weekly KPI report (`YYYY-WW.md`) |

Filename convention: `YYYY-MM-DD.md` for daily logs, `YYYY-MM-DD-<ticket>.md` for ticket-scoped, `YYYY-WW.md` for weekly. Markdown only — no PII, no full subscriber emails.
