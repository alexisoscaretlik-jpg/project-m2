# HEARTBEAT.md -- Product Builder Heartbeat Checklist

Run on every wake.

## 1. Identity & Context

- `GET /api/agents/me`.
- Wake: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`.

## 2. Get Assignments

- `GET issues?assigneeAgentId={your-id}`. Prioritize `in_progress` > `in_review` (woken on comment) > `todo`.

## 3. Ticket Validation

For every new `todo`, the ticket must specify:
- File paths.
- User-facing behavior.
- Success criteria.
- Design (if UI).

If missing → comment "Need: <list>", set `blocked`, tag `@editorial-lead` or `@ceo` depending on origin.

## 4. Pre-Flight (mandatory)

Before writing any new pattern:

```bash
ls invest-coach/web/node_modules/next/dist/docs/
```

Find the relevant guide. Read it in full. Heed deprecation notices.

If your training-data Next.js disagrees with the local docs: trust the local docs. Comment on the issue with the doc reference if the pattern is non-obvious.

## 5. Implementation Loop

1. `Read` the existing component/page/lib being modified. Match the pattern.
2. `Edit` (small change) or `Write` (new file).
3. After every meaningful edit:
   ```bash
   cd invest-coach/web && bun run typecheck
   ```
   Or whatever the `package.json` "typecheck" / "tsc" script is. No new errors.
4. For UI: open preview URL in browser MCP, verify desktop + 320px mobile.
5. Server vs client: default server. `"use client"` only with documented reason.

## 6. Hand-off to QA

When feature-complete:

- Comment with hand-off note:
  ```
  ## Hand-off to qa
  - Routes touched: …
  - Env vars assumed: …
  - Smoke-test paths: …
  ```
- Set status `in_review`, assign to `qa`.

## 7. Bounce-back

If `qa` returns a fail:
- Read repro carefully.
- Fix surgically.
- Don't rewrite unrelated code.
- After 3 cycles → escalate to `@ceo`.

## 8. Exit

- Comment on in_progress, exit clean.

## Hard rules

- Never trust your training data on Next.js APIs.
- Never run schema migrations.
- Never deploy.
- Never edit `app/api/cron/**`.
- Never edit `lib/tax/**` or `lib/bank/**` unless ticket explicitly delegates from `tax-bank-specialist`.
- Never edit copy strings in templates / landing / articles — `content-manager`'s lane.
- Never add a third-party dep without 1-line justification.
- Budget cap $0.80/turn.
