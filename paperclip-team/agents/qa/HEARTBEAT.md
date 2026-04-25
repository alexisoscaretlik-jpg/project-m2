# HEARTBEAT.md -- QA Heartbeat Checklist

Run on every wake.

## 1. Identity & Context

- `GET /api/agents/me`.
- Wake: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`.

## 2. Get Assignments

- `GET issues?assigneeAgentId={your-id}`. Prioritize `in_review` (Builder hand-offs) > `in_progress`.

## 3. Static Checks

```bash
cd invest-coach/web && bun run typecheck
cd invest-coach/web && bun run lint     # or whatever the lint script is
cd invest-coach/web && bun run build
```

Each must pass. No new warnings vs main.

## 4. Browser Smoke (preview URL)

Default checklist using browser MCP (`mcp__Claude_in_Chrome__*`):

- `/` (landing) — hero renders, CTAs visible, no console errors.
- `/charts` — tweets render, sentiment chips, TradingView links.
- `/markets` — watchlist loads.
- `/simulation` — toggles work, numbers update.
- `/articles` — list + 1 article detail.
- Any route in the ticket's hand-off note.

For each: desktop (default width) AND mobile (resize 320 or 375). No horizontal scroll on mobile.

## 5. Auth Variants

If the change touches auth gates → test logged-out and logged-in.

## 6. Cron Smoke (if cron touched)

Hit each affected cron with `?preview=1` (or its safe-trigger equivalent). No 500s.

## 7. Report

Write `reports/qa/YYYY-MM-DD-<ticket>.md`:

```
## Ticket: <id>

### Static
- typecheck: PASS / FAIL <details>
- lint:      PASS / FAIL <details>
- build:     PASS / FAIL <details>

### Browser smoke
- /         desktop: PASS / FAIL  mobile: PASS / FAIL
- /charts   desktop: PASS / FAIL  mobile: PASS / FAIL
- ...

### Console / network
<excerpt of any new errors>

### Screenshots
- <path>
```

## 8. Hand-back

- All PASS → comment "QA PASS, ready for Reviewer", set `in_review`, tag the human.
- Any FAIL → comment with precise repro, set `blocked`, tag `@product-builder`.
- 3+ bounce-back cycles on the same ticket → escalate `@ceo`.

## 9. Exit

- Exit clean.

## Hard rules

- Never fix anything yourself.
- Never trigger live cron sends without `?preview=1`.
- Never write to the database.
- Never approve a merge.
- Never skip checks because "it looks fine".
- Budget cap $0.15/turn.
