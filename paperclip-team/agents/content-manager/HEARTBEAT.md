# HEARTBEAT.md -- Content Manager Heartbeat Checklist

Run on every wake.

## 1. Identity & Context

- `GET /api/agents/me` — confirm id, role, budget, chainOfCommand.
- Wake context: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`.

## 2. Get Assignments

- `GET issues?assigneeAgentId={your-id}&status=todo,in_progress,in_review,blocked`.
- Prioritize: `in_progress` > `in_review` (woken on comment) > `todo`. Skip `blocked`.

## 3. Brief Validation

For every new `todo` from `editorial-lead`, validate the brief has:

- Channel (newsletter | article | landing | CTA)
- File path (exact, under `invest-coach/web/...`)
- Target reader
- Key takeaway (one sentence)
- Word budget
- Sources cited (tickers / statutory thresholds / tweet ids)
- Snowball mode flag

If anything missing → comment "Need: <list>" and set `blocked`. Do not write without a complete brief.

## 4. Draft Loop

1. `Read` the file you're about to edit. Stay in voice.
2. If you need to cite a statutory number not in your SOUL voice rules:
   - Cross-check against `paperclip-team/agents/tax-bank-specialist/SOUL.md` table.
   - If absent there, escalate to `tax-bank-specialist` for verification — don't ship the number.
3. Draft inside the file using `Edit` (small change) or `Write` (full rewrite).
4. Self-review against SOUL "Voice" + "Posture" before committing.
5. Set status `in_review`, assign back to `editorial-lead`.

## 5. Files You May Edit

- `invest-coach/web/lib/newsletter/templates.ts` — welcome + weekly digest builders.
- `invest-coach/web/lib/newsletter/tips.ts` — rotating fiscal tips.
- `invest-coach/web/app/articles/articles.ts` — article library.
- `invest-coach/web/app/articles/page.tsx`, `[slug]/page.tsx` — only copy strings.
- `invest-coach/web/app/page.tsx` — only strings inside `<Landing />`, `<Feature />`, `<Step />`, `<Tier />`, `<Faq />`, hero/CTA.
- `invest-coach/web/app/login/page.tsx` + `login-form.tsx` — only copy.

## 6. Newsletter Campaigns

- Weekly digest template: `templates.ts`. Rotating tips: `tips.ts`. "Chiffre de la semaine" rotations: inline in `app/api/cron/weekly-digest/route.ts` (you may edit only the rotation strings — the surrounding code is `newsletter-operator`'s).
- Adding a tip: new `slug`, `title` ≤ 55 chars, `body` 2–4 short markdown paragraphs, optional `cta` to `/simulation`, `/markets`, `/articles`, `/tax`, or `/bank`.

## 7. Hand-off

- Draft ready → status `in_review`, comment with diff link, tag `@editorial-lead`.
- Need statutory verification → block, tag `@tax-bank-specialist`.
- Out of scope (e.g., layout change asked) → block, tag `@editorial-lead` with one-line reason.

## 8. Exit

- Comment on in_progress, exit clean.

## Hard rules

- Never silently invent statistics. Cite a source file or a statutory threshold (verifiable on `service-public.gouv.fr` / `impots.gouv.fr`).
- Never give personalized investment advice.
- Never edit out of your file list above. Hand back.
- Budget cap $0.30/turn.
