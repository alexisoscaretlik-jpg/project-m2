# Babylon podcast demo — runbook

**Goal:** generate one real 20-minute French podcast episode from a YouTube source, on your Mac, using ElevenLabs voices.

**Total time:** ~10 minutes (5 min setup + ~5 min for the pipeline to run).

**Where to run this:** Terminal on your Mac, inside the project directory. You can also paste this whole file into your desktop Claude Code session and ask it to do the steps for you.

---

## Pre-flight — do these once

### 1. Get on the right branch

```bash
cd ~/path/to/project-m2          # adjust to wherever the repo lives on your Mac
git fetch origin
git checkout claude/general-session-M0FqT
git pull
```

### 2. Install dependencies (first time only)

```bash
cd invest-coach/web
npm install
```

If you get a "tsx not found" later, also run:

```bash
npm install --save-dev tsx
```

### 3. Make sure your `.env.local` has all five keys

Open `invest-coach/web/.env.local` and confirm these lines exist (values, not placeholders):

```
GEMINI_API_KEY=<your Gemini key>
ANTHROPIC_API_KEY=<your Anthropic key>
ELEVENLABS_API_KEY=<your rotated ElevenLabs key — NOT the one leaked in chat>
NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>
SUPABASE_SERVICE_ROLE_KEY=<your Supabase service role key>
```

If you don't have an `.env.local`, copy from `.env.example` if it exists, or create one with the lines above.

### 4. Pick three French ElevenLabs voices (recommended, optional)

Default voices in `lib/podcast/elevenlabs.ts` may be English. To swap to French:

1. Log in to https://elevenlabs.io/app/voice-library
2. Filter by language: French
3. Pick three voices — one warm/slow for **Coach**, one curious/mid-30s for **Investisseur**, one for **Narrateur** (can be the same as Coach)
4. For each voice, click the "..." menu → **Copy voice ID**
5. Add to `.env.local`:

```
ELEVENLABS_VOICE_COACH=<voice id 1>
ELEVENLABS_VOICE_INVESTISSEUR=<voice id 2>
ELEVENLABS_VOICE_NARRATEUR=<voice id 3>
```

If you skip this step the demo will still run, just possibly with English-leaning voices on French text.

### 5. Create the Supabase Storage bucket

In your Supabase dashboard:
- **Storage** → **New bucket**
- Name: `podcasts`
- Public: ✅ **yes** (so the audio plays without signed URLs)
- Save

If you skip this step the upload step at the end will fail — but the local MP3 file at `/tmp/babylon-*.mp3` is still produced and playable.

---

## Run

One command:

```bash
cd ~/path/to/project-m2/invest-coach/web
npm run podcast:demo -- https://www.youtube.com/watch?v=ZyYQgZ1tnWM
```

Replace the URL if you want a different source video. Otherwise it uses the demo URL you sent.

---

## What you'll see

Roughly 4–6 minutes of step-by-step output:

```
[20:12:01] ━━━ Step 1: Gemini Pro extracts the video insight    (60–90s)
[20:13:15] ━━━ Step 2: Claude Sonnet 4.6 writes the 3-act script (~30s)
[20:13:48] ━━━ Step 3: ElevenLabs synthesizes 28 lines           (~3–4 min)
[20:18:30] ━━━ Step 4: Uploading to Supabase Storage             (~5s)

━━━ DONE ━━━
Audio URL: https://...supabase.co/.../podcasts/babylon/2026-04-26/<slug>.mp3
Local MP3: /tmp/babylon-1717...mp3
```

## Listen

Two options, either works:

```bash
# Option A — open the MP3 locally in QuickTime / your default player
open /tmp/babylon-*.mp3

# Option B — open the public URL in any browser (works on phone too)
# Just paste the "Audio URL" line into Safari.
```

---

## If something fails

| Error you see | What it means | Fix |
|---|---|---|
| `Could not read .env.local` | You're not in `invest-coach/web/` | `cd invest-coach/web` |
| `GEMINI_API_KEY non configurée` | Key missing in `.env.local` | Add it, save, re-run |
| `ANTHROPIC_API_KEY not set` | Key missing in `.env.local` | Add it, save, re-run |
| `ELEVENLABS_API_KEY non configurée` | Key missing in `.env.local` | Add the **rotated** key, save, re-run |
| `ElevenLabs 401: invalid_api_key` | Key is wrong, expired, or revoked | Generate a new one at elevenlabs.io/app/settings/api-keys, update `.env.local` |
| `ElevenLabs 422: voice_not_found` | A voice ID in `.env.local` is wrong | Re-copy from voice library, or remove the env line to use defaults |
| `QA script échoué: Trop court / Trop long` | Claude returned a script outside 2,500–3,400 words | Just re-run — non-deterministic, usually fine on retry |
| `Upload MP3 échoué: bucket not found` | `podcasts` bucket doesn't exist in Supabase | Create it (see pre-flight step 5). The local MP3 is still saved at `/tmp/babylon-*.mp3` |
| `Upload MP3 échoué: row-level security` | Bucket exists but isn't public | In Supabase, edit the bucket → toggle public → save |
| Hangs at Step 1 for >3 min | Gemini is rate-limiting or video is private | Try a different YouTube URL; verify the video is public |
| Hangs at Step 3 for >10 min | ElevenLabs is overloaded or voice is wrong | Check status.elevenlabs.io; cancel and retry |

If it fails halfway through, the script JSON from Step 2 is saved at `/tmp/babylon-<timestamp>.json` — useful for debugging without paying for TTS again.

---

## After you've heard it

Reply with one of:

- **"Voice good, story good, ship it"** → I merge Track A + Track B (cron + episode list + this pipeline) and we're production-ready.
- **"Voice bad"** → tell me which one (Coach / Investisseur / Narrateur), I'll adjust voice IDs or stability settings.
- **"Story flat"** → tell me what felt off (too academic? not enough story? too much jargon?) and I'll tune the prompt.
- **"Failed at step X"** → paste the error, I'll fix.

---

## File reference (for your desktop Claude Code session)

If you want to ask desktop Claude to do this for you, point it at these files:

- `invest-coach/web/scripts/run-babylon-demo.ts` — the runner
- `invest-coach/web/lib/podcast/babylon-prompt.ts` — the script-generation prompt
- `invest-coach/web/lib/podcast/extract-video.ts` — Gemini video extraction
- `invest-coach/web/lib/podcast/script.ts` — Claude script generation
- `invest-coach/web/lib/podcast/synth.ts` — ElevenLabs line-by-line synthesis
- `invest-coach/web/lib/podcast/storage.ts` — Supabase Storage upload
- `docs/reference/richest-man-of-babylon.md` — book reference (lives on branch `claude/pedantic-cerf-609ffa`)
