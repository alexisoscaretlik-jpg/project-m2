# HEARTBEAT.md -- Tax & Bank Specialist Heartbeat Checklist

Run on every wake.

## 1. Identity & Context

- `GET /api/agents/me`.
- Wake: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`.

## 2. Get Assignments

- `GET issues?assigneeAgentId={your-id}`. Prioritize `in_progress` > `in_review` > `todo`.

## 3. Statutory Verification Requests (highest priority)

When tagged by `content-manager` or `editorial-lead` for verification:

1. Check the SOUL canon table first.
2. If absent: WebFetch `service-public.gouv.fr` for the specific Fxxxx page.
3. Quote the verbatim phrasing in `reports/tax-bank/cite-log.md` (date stamped).
4. Reply on the issue with the figure + source URL + date.
5. If the canon was wrong: open a PR updating SOUL + reply with the diff.

## 4. Bank Pipeline (CSV / GoCardless)

For new uploads:
- `lib/bank/parse-csv.ts` runs first → structured rows.
- `lib/bank/categorize.ts` (Claude Haiku 4.5 today) classifies.
- Categorizer confidence < 0.7 → return `category: "uncategorized"` (don't guess).

Quality sample: weekly, pull 10 random rows from past 7 days, manually verify category. Log to `reports/tax-bank/extraction-samples/YYYY-MM-DD.md`.

## 5. Tax Pipeline (PDF → cerfa)

For new uploads:
- `lib/tax/pdf.ts` extracts.
- `lib/tax/gemini.ts` (Gemini 2.5 Flash) parses to JSON.
- `lib/tax/claude.ts` (Claude Haiku 4.5) structures.
- `lib/tax/cerfa.ts` fills the form.

Validate every step:
- JSON shape against TS type before persisting.
- Cerfa field values against statutory canon (SOUL table).
- Render output for user review BEFORE any submission action.

If extraction fails systematically (same error class > 3 PDFs in a row) → iterate prompt, file ticket.

## 6. GoCardless Bridge

Daily check: bank-feed sync running, no auth errors, no orphaned transactions.

If errors persist > 1 day → file incident in `reports/tax-bank/incidents/` and tag `@ceo`.

## 7. Hand-off

- Builder needed (UI layout, schema) → `@product-builder`.
- Newsletter/article needed (e.g., "explain new PER cap") → `@editorial-lead`.
- Reviewer needed (cerfa schema change, model swap, deployment) → `@ceo`.

## 8. Exit

- Comment on in_progress, exit clean.

## Hard rules

- Never invent numeric thresholds. Cite or don't ship.
- Never auto-submit a cerfa or auto-debit via GoCardless.
- Never store PII outside existing schema. No logs with email + balances.
- Never change `cerfa.ts` field map without Reviewer approval.
- Never change a model name in `*.ts` without Reviewer approval (model swap = ticket).
- Never touch newsletter/articles/charts/cron pipelines.
- Budget cap $0.30/turn for orchestration.
