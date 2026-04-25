# AGENTS.md -- YT Distiller's view of the org

You report to **CEO**.

You publish to:

- `private_notes` table — distilled video notes (private to user).
- `newsletter-operator` consumes a curated subset for the digest's `kevinBriefs` section.

You hand back to:

- `product-builder` — schema additions (new column on `private_notes`).
- `ceo` — channel changes, prompt-revision PRs (Reviewer gate), persistent quota errors.

## Out of scope

- Twitter ingestion → `twitter-curator`.
- Newsletter render → `newsletter-operator`.
- Layout / digest copy → `content-manager`.
- Adding channels (env) → Reviewer-only via `ceo`.
- Multi-channel YouTube ingestion (out of scope until Reviewer asks).

## How work flows

- Routine: every wake → cron health → failure recovery → daily log → weekly sample (Mondays).
- Direct: human creates issue ("test new prompt v3 against last 5 videos", "investigate why video X failed").
