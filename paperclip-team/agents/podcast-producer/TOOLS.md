# TOOLS.md -- Podcast Producer

## Allowed

- `Read`, `Glob`, `Grep` across:
  - `invest-coach/web/prompts/coach-thomas-master-v3.md` (the master prompt)
  - `invest-coach/web/scripts/build-jellypod-prompt-v3.ts` (Stage 1 + Stage 2 runner)
  - `invest-coach/web/scripts/publish-babylon.ts` (Supabase uploader + listen gate)
  - `invest-coach/web/lib/podcast/{storage,sources}.{ts,json}` (storage helper + source curation)
  - `invest-coach/web/app/podcast/page.tsx` (public listing — read-only to verify metadata fields rendered)
  - `docs/podcast-prompt-spec.md`, `docs/podcast-demo-runbook.md`
  - `reports/podcast-producer/**` (your own daily logs)
- `Edit` — through PR only, on:
  - The master prompt (`coach-thomas-master-v3.md`) for editorial revisions (Reviewer-gated).
  - The runner script for resilience improvements (retries, error handling, observability).
  - The publish-babylon listen-gate prompt text (wording-only changes).
  - The runbook + spec doc.
- `Bash`:
  - `npx tsx scripts/build-jellypod-prompt-v3.ts <url>` — runner.
  - `npx tsx scripts/publish-babylon.ts <mp3> <json>` — uploader (will prompt for `oui` interactively).
  - `curl -sI <Supabase URL>` — verify public URL.
  - `git log/diff/blame` — read-only.
- Supabase Storage write on the `podcasts` bucket via `publish-babylon.ts`.
- Anthropic API + Gemini API via the existing runner (keys live in `.env.local`, never committed).

## Forbidden

- **Skipping the listen gate**. Passing `--yes` to `publish-babylon.ts` for a first publish (only allowed for re-uploads of already-vetted audio).
- Committing API keys, Jellypod tokens, Supabase service-role keys, or any secret to the repo.
- Hot-editing `coach-thomas-master-v3.md` on `main` — must go through PR + Reviewer gate.
- Editing `lib/podcast/{babylon-prompt,script,synth,elevenlabs}.ts` — dead code, removal scheduled in a separate cleanup PR.
- Programmatic Spotify upload — blocked by Spotify security; manual operator step only.
- Programmatic voice reassignment in Jellypod — operator decision only.
- Naming the source book (Babylon, Arkad, Clason) or source-video creator (Alux, etc.) in any committed dialogue or in the listening audio.
- Recommending nominative financial products in dialogue (`iShares`, `Trade Republic`, `Yomoni`, etc.) — categories OK ("un ETF MSCI World capitalisant"), brand names not.
- Promising future returns in dialogue (`tu vas faire 7%`, `garanti`, `sans risque`).
- Spending more than $5 per episode without `@ceo` approval.
- Adding new compliance bans without Reviewer sign-off; removing existing bans without Reviewer sign-off.

## References

- Canonical agent spec (Claude Code side): `.claude/agents/podcast-producer.md`
- Editorial intent (the why): `docs/podcast-prompt-spec.md`
- Operating runbook (the how): `docs/podcast-demo-runbook.md`
- Universal repo rules: `invest-coach/web/AGENTS.md`
