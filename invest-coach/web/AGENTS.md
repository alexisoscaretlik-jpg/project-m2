<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Invest Coach — Agent Team (v1)

Multi-agent setup inspired by Paperclip. Treats agents as employees with roles, owned files, budgets, and escalation paths. Detailed prompts live one per file under `.claude/agents/`.

## Org chart

```
                       Reviewer (human)            ← final gate
                              │
                       CEO / Orchestrator          ← Paperclip server (or you)
                              │
       ┌──────────────┬───────┴──────┬───────────────┬───────────────┐
   Editorial      Ingestion        Product        Tax & Bank      Analytics
       │             │                │                │                │
   ┌───┴───┐    ┌────┴────┐       ┌───┴──┐         (one)           (one)
 lead  writer  twitter  yt-     builder  qa
                curator distill
```

## Roster

| # | Role | Slug (`.claude/agents/<slug>.md`) | Production model | Scope |
|---|---|---|---|---|
| 1 | Editorial Lead | `editorial-lead` | `claude-opus-4-7` | Content calendar, briefs, gates publish |
| 2 | FR Writer | `content-manager` *(existing)* | `claude-opus-4-7` | French copy, articles, emails |
| 3 | Newsletter Operator | `newsletter-operator` | `gemini-2.5-flash` | Runs `cron/weekly-digest`, A/B subjects |
| 4 | Twitter Curator | `twitter-curator` | `gemini-2.5-flash` | Owns `cron/fetch-tweets` + `/charts` source pipeline |
| 5 | YT Distiller | `yt-distiller` | `gemini-2.5-flash` | Owns `cron/watch-kevin`, video → `private_notes` |
| 6 | Product Builder | `product-builder` | `claude-opus-4-7[1m]` | Next.js pages, components, server actions |
| 7 | QA | `qa` | `gemini-2.5-flash` | Typecheck, lint, browser smoke on preview |
| 8 | Tax & Bank Specialist | `tax-bank-specialist` | `claude-opus-4-7` (orchestration) + `gemini-2.5-flash` (PDF/CSV) | `lib/tax/**`, `lib/bank/**` |
| 9 | Analyst | `analyst` | `claude-opus-4-7[1m]` | KPIs, prompt efficacy, weekly report |
| 10 | Reviewer | — (human) | — | Approves merges, sends, schema, env, model swaps |

## Universal rules (apply to every agent)

1. **Read before write.** Always read the file you're editing first. Stay in the existing voice / pattern.
2. **Next.js**: this is not your training-data Next.js — read `node_modules/next/dist/docs/` before any new pattern. Heed deprecation notices.
3. **No silent invention.** Every number, fiscal threshold, ticker, or external fact is either already in a source file or comes from a verifiable statutory source. If you can't verify, don't write it.
4. **Stay in your lane.** If a task touches files outside your "Owns" list, hand it back to the Orchestrator with a one-line reason. Never side-quest.
5. **Cost discipline.** Cap each LLM call at the budget noted in your agent file. If you'd exceed, escalate.
6. **Human gate is non-negotiable** for: outbound email sends, PR merges, schema migrations, env-var changes, new tracked tickers/handles, model swaps in production code.
7. **No financial advice.** We are not a CIF (Conseiller en Investissements Financiers). Explain mechanisms, compare options, cite statutory thresholds. Never tell a user to buy/sell.
8. **Privacy.** `private_notes` is private to the user — never include its content in newsletters or public pages.

## Ticket lifecycle

```
Reviewer → Orchestrator → Lead agent → Sub-agent(s) → QA → Reviewer (gate) → merge/send
```

Every ticket carries: goal, owner agent, files-in-scope, budget, success criteria, escalation path.

## Where each agent reaches in the codebase

| Agent | Reads | Writes |
|---|---|---|
| editorial-lead | all of `web/content/**`, `web/app/articles/**`, `web/lib/newsletter/**`, repo `git log` | issues briefs only — does not edit |
| content-manager | files listed in its own `.md` | same |
| newsletter-operator | `web/lib/newsletter/**`, `web/app/api/cron/weekly-digest/**` | digest dry-runs, subject A/B copy |
| twitter-curator | `web/lib/twitter.ts`, `web/app/api/cron/fetch-tweets/**`, `tweets` table | tags/sentiment in `tweets`; no schema changes |
| yt-distiller | `web/app/api/cron/watch-kevin/**`, `web/lib/youtube.ts`, `private_notes` | `ANALYSIS_PROMPT` PRs only |
| product-builder | `web/app/**`, `web/components/**`, `web/lib/**` (read), `node_modules/next/dist/docs/` | `web/app/**`, `web/components/**` |
| qa | the whole repo (read) | nothing — reports only |
| tax-bank-specialist | `web/lib/tax/**`, `web/lib/bank/**` | same |
| analyst | Supabase (read-only), `reports/**` | `reports/**` only |

## Production-runtime models (today, in code)

| File | Model |
|---|---|
| `web/lib/bank/categorize.ts`, `web/lib/bank/parse-csv.ts` | `claude-haiku-4-5` |
| `web/lib/tax/claude.ts`, `web/lib/tax/cerfa.ts`, `web/lib/portfolio/claude.ts` | `claude-haiku-4-5` |
| `web/lib/tax/gemini.ts`, `web/app/gemini/actions.ts`, `web/app/admin/notes/actions.ts` | `gemini-2.5-flash` |
| `web/app/api/cron/watch-kevin/route.ts` | `gemini-2.5-flash` (env: `GEMINI_VIDEO_MODEL`) |

> Migration target: roles previously planned on Haiku consolidate on `gemini-2.5-flash`; roles previously on Sonnet move to `claude-opus-4-7` (or `[1m]` where long context matters). Code-level migration is a separate ticket — agent files describe target state.
