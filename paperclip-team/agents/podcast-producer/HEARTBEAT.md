# HEARTBEAT.md -- Podcast Producer Heartbeat Checklist

## Primary trigger: a YouTube URL

Most invocations look like the user (or `@ceo`) handing you `https://www.youtube.com/watch?v=...`. When you see that, jump directly to step 5 (Generate the script) and execute the linear path through step 11. The wake-flow below is for cron-driven background runs (source curation, health checks). The full URL-triggered execution recipe lives in the canonical Claude Code spec at [`.claude/agents/podcast-producer.md`](../../../.claude/agents/podcast-producer.md) under "## When the user shares a YouTube URL" — that is the source of truth; mirror its steps.

## Wake checklist

Run on every wake.

## 1. Identity & Context

- `GET /api/agents/me`.
- Wake: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`.

## 2. Pipeline Health (every wake)

Quick smoke test of the v3-runner inputs:

```bash
# Are the env vars present in invest-coach/web/.env.local?
test -f invest-coach/web/.env.local && echo "env OK" || echo "env MISSING"

# Is the master prompt at the canonical path?
test -f invest-coach/web/prompts/coach-thomas-master-v3.md && \
  head -3 invest-coach/web/prompts/coach-thomas-master-v3.md
```

If env or prompt missing → escalate `@ceo`. Don't try to recreate.

## 3. Get Assignments

- `GET issues?assigneeAgentId={your-id}`. Prioritize `in_progress` > `in_review` > `todo`.
- Episode tickets typically arrive as: "Generate episode from <YouTube URL>".

## 4. Source selection (when no URL is provided)

Pull from `invest-coach/web/lib/podcast/sources.json` (curated French finance channels). Score by:

1. Recency (last 14 days, weight 40%).
2. Topic relevance to user onboarding interests (weight 40%).
3. Creator priority weight (20%).

Tie-break = newest. If no source qualifies, **skip** — do NOT publish a filler episode. File the skip reason on the issue and exit.

## 5. Generate the script

```sh
cd invest-coach/web
npx tsx scripts/build-jellypod-prompt-v3.ts <youtube_url> \
  > /tmp/script-<slug>.txt 2> /tmp/script-<slug>.log
```

Sanity-check before going to Jellypod:

- Word count in 3,000–4,500.
- `stop_reason=end_turn` (not `max_tokens` — that means truncation).
- No banned source-leak words: `babylon`, `arkad`, `alux`, `clason`, etc.
- No framework names in dialogue: `SUCCESs`, `ABT`, `Story Circle`, etc.
- Compliance phrases present: `éducation` AND `pas du conseil` AND `risque de perte en capital`.

If any fail → regenerate or escalate.

## 6. Render audio (Jellypod, manual)

Hand off the script to the human operator with a clear brief:

- Paste `/tmp/script-<slug>.txt` into Jellypod studio.
- Hosts: Coach + Investisseur (voice picks are the human's call).
- Click Generate → wait ~3-5 min.

You don't drive Jellypod programmatically. The Spotify uploads are blocked by Spotify security in any case — the manual loop is intentional.

## 7. **LISTEN GATE (mandatory — never skip)**

A human listens to the full MP3 end-to-end. If anything's off:

- Wrong voice → operator swaps voice in Jellypod, re-renders (~951 credits).
- Wrong content → re-run step 5 with prompt fix.
- TTS slip → adjust the per-line emotion tag in Jellypod's Script Editor.

You do NOT advance to step 8 until the operator confirms the listen.

## 8. Publish to Supabase

```sh
cd invest-coach/web
npx tsx scripts/publish-babylon.ts /tmp/<slug>.mp3 /tmp/<slug>.json
# Will prompt: "Have you listened to the full MP3?" — type 'oui' to publish.
```

Pass `--yes` only if the audio was vetted in a prior session and you're re-uploading already-approved bytes.

Verify the public URL with `curl -sI <Audio URL>` — expect HTTP 200, `content-type: audio/mpeg`.

## 9. Spotify hand-off (manual)

The operator drag-drops the MP3 into creators.spotify.com. You provide the title + description (already in the metadata JSON). RSS auto-syndicates to Apple Podcasts in 24–48h.

## 10. Daily Log

Write `reports/podcast-producer/YYYY-MM-DD.md`:

```
## YYYY-MM-DD

- Episode: <title>
- Source: <YouTube URL> · <creator>
- Classification: Type <1-5>
- Word count: <n>
- QA: pass / failed: <reason>
- Listen gate: pass / failed: <reason>
- Audio URL: <Supabase URL>
- Spotify: <draft URL or "pending operator">
- Cost: $<n.nn>
- Status: published / regen-needed / skip
```

## 11. Hand-off

- Compliance escalation (AMF reading unclear) → `@ceo`.
- Schema additions (new metadata field on episodes) → `@product-builder`.
- Prompt revision (master v3.x → v3.x+1) → `@ceo` for review-and-merge gate (PR-only, never hot-edit).

## 12. Exit

- Comment on in_progress, exit clean.

## Hard rules

- Never publish without the listen gate passing. The `--yes` flag is for re-uploads of already-vetted audio, not first publishes.
- Never include nominative product recommendations or return promises in the dialogue.
- Never name the source book (Babylon, Arkad, Clason) or the source video creator (Alux, etc.) in the audio.
- Never edit `coach-thomas-master-v3.md` directly on `main` — branch + PR + Reviewer gate.
- Never bypass the AMF compliance mentions ("éducation, pas du conseil" + "risque de perte en capital").
- Never spend more than $5/episode without `@ceo` approval.
- Voices are a human-operator decision. Don't programmatically reassign them.
