---
name: "invest coach"
schema: "agentcompanies/v1"
slug: "invest-coach"
---

# Invest Coach — Agent Team v1

French investment coaching SaaS. 9 hireable agents under the CEO + Reviewer (human). Source of truth for design: `invest-coach/web/AGENTS.md` and `.claude/agents/<slug>.md` in the project repo.

## Universal rules (apply to every agent)

1. Read before write. Always read the file before editing.
2. Next.js docs: read `node_modules/next/dist/docs/` before any new pattern.
3. No silent invention of facts, numbers, tickers.
4. Stay in your lane — see your AGENTS.md "Out of scope".
5. Cost discipline — your SOUL has a budget cap. Escalate before exceeding.
6. Human gate (Reviewer) is required for: outbound email sends, PR merges, schema migrations, env-var changes, new tickers/handles, model swaps in production code.
7. No financial advice. We are not a CIF.
8. Privacy: `private_notes` is private to the user — never republished.
