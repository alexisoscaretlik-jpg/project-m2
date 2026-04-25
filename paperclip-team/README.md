# Paperclip Team Package — Invest Coach v1

A portable markdown company package. Imports 9 agents into a Paperclip "invest coach" company.

## Import

```bash
# Dry-run first
npx paperclipai company import ./paperclip-team --target existing -C <COMPANY_ID> --collision skip --dry-run

# For real
npx paperclipai company import ./paperclip-team --target existing -C <COMPANY_ID> --collision skip --yes
```

`<COMPANY_ID>` from `npx paperclipai company list`.

`--collision skip` keeps any agent that already exists (e.g., the preset `ceo`).

## Re-import

The package is idempotent under `--collision skip`. To force-update an agent's SOUL/HEARTBEAT, use `--collision replace` and target a single agent with `--agents <slug>`.

## Source of truth

Each agent's spec lives in two places:
- `.claude/agents/<slug>.md` (root of repo) — full prose spec, Claude Code subagent format.
- `paperclip-team/agents/<slug>/{SOUL,HEARTBEAT,AGENTS,TOOLS}.md` — Paperclip-format split.

Treat `.claude/agents/<slug>.md` as the **canonical** spec; the Paperclip files are derived. When the spec changes, regenerate the Paperclip files and re-import.
