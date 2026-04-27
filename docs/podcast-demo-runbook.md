# Money-coaching podcast — operating runbook

This is the playbook for shipping a new episode of the Invest Coach podcast.
The editorial spec (why the prompt is shaped this way) lives separately in
[`podcast-prompt-spec.md`](podcast-prompt-spec.md). Don't change either one
without reading both.

## What "an episode" means today

| Field | Value |
|---|---|
| Format | 2-voice conversation, Coach (~80 %) + Investisseur (~20 %), no narrator |
| Length | ~12-18 min (target band; QA accepts 2 000-3 600 words) |
| Theme | `money` (only theme today, more later — see `EpisodeTheme` in `babylon-prompt.ts`) |
| Source | One YouTube URL per episode (Alux longform was the inaugural source) |
| Engine | Gemini 2.5 Flash → Claude Opus 4.7 → ElevenLabs multilingual_v2 → Supabase Storage |
| Distribution | `https://project-m2.alexisoscaretlik.workers.dev/podcast` + Spotify for Creators (manual upload, free) |
| Cost | ~$3.85 / episode in API spend (vs Jellypod $5/ep — see comparison below) |

## Pre-flight (one-time)

1. Be on `main` (or any branch with the latest `babylon-prompt.ts`).
2. `cd invest-coach/web && npm install`. If you ever see "tsx not found" later, also `npm install --save-dev tsx`.
3. `.env.local` must have these keys — values not placeholders:

   ```
   GEMINI_API_KEY=…
   GEMINI_VIDEO_MODEL_PRO=gemini-2.5-flash    # free-tier killed Pro quota
   ANTHROPIC_API_KEY=…
   ANTHROPIC_PODCAST_MODEL=claude-opus-4-7    # writes the bespoke Jellypod brief
   NEXT_PUBLIC_SUPABASE_URL=…
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_…
   ```

   ElevenLabs vars are no longer needed — Jellypod replaced our self-rolled TTS pipeline (decision April 2026, see "How we got here" below).

4. Supabase Storage bucket `podcasts` must exist, public-read. `scripts/publish-babylon.ts` will create it on first run if missing.

5. A Jellypod account at https://www.jellypod.com is required. Free trial includes 5 000 credits; one episode ≈ 1 000 credits. Paid Creator tier ($47/mo, 11k credits/mo) once volume picks up.

6. Two Jellypod hosts saved (Coach + Investisseur, native French voices). The current ones were created from voice-design backstories matching the prompt-spec personas.

## Make a new episode

The new flow is **two-stage**: Gemini → Opus produce a bespoke Jellypod brief, then Jellypod runs the production. Each episode gets its own Opus-authored brief — no template, no shared prompt — because the larger context of every Alux video differs.

```sh
cd invest-coach/web

# Stage 1+2: Gemini watches the video, Opus writes the Jellypod brief.
# Brief lands on stdout, progress on stderr.
npx tsx scripts/build-jellypod-prompt.ts \
  'https://www.youtube.com/watch?v=YYYYYYYYYYY' \
  > /tmp/brief.txt 2> /tmp/brief.log

# Inspect before pasting
cat /tmp/brief.log     # Gemini summary + Opus token usage
cat /tmp/brief.txt     # the brief Jellypod will consume
```

Then in Jellypod (web UI):

1. `/studio/new` → click `+` → YouTube → paste the same URL.
2. Click into the prompt area → paste the brief from `/tmp/brief.txt` (Jellypod will attach it as `default-text-file.txt`).
3. Add a one-line top-level prompt: *"Suis strictement le brief éditorial dans default-text-file.txt. La vidéo YouTube est la matière source que tu illustres. Ne nomme jamais la source."*
4. Click "Create a Podcast Episode" → set Hosts (2) to Coach + Investisseur → submit (up arrow).
5. Wait ~5 min. Listen via Jellypod's player.

If you like it, download MP3 → upload to Supabase:

```sh
# Audio-Only download from Jellypod's web UI lands in ~/Downloads/.
npx tsx scripts/publish-babylon.ts \
  ~/Downloads/<title>.mp3 \
  /tmp/<metadata>.json     # craft a small JSON with title/summary/source/theme; see publish-babylon.ts
```

Then it appears at https://project-m2.alexisoscaretlik.workers.dev/podcast?theme=money.

## Listen and decide

Listen via Jellypod's web player while the episode is open at
`https://www.jellypod.com/studio/artifact/<id>`. Iterate hosts there
(Jellypod re-renders TTS only — that costs credits but no Opus call).
Once the audio is right, download Audio-Only MP3 from the Jellypod UI
and run `scripts/publish-babylon.ts` with a metadata JSON.

## Re-publish a manually edited MP3

If you tweaked the audio externally (Descript, Audacity, ffmpeg) and have a fresh `.mp3` + a `.json` metadata file:

```sh
npx tsx scripts/publish-babylon.ts /path/to/edited.mp3 /path/to/metadata.json
```

The script up-serts both files; same path overwrites silently. If `metadata.json` lacks a `theme` field, it'll default to `money`.

## Spotify for Creators (manual, web UI)

Spotify for Creators (formerly Anchor) is **free** — no monthly fee, no upload cost. RSS feed auto-generated, syndicates to Apple Podcasts via the same feed.

1. Go to https://creators.spotify.com → Log in with Spotify account.
2. First time only: "Create a new show" with name `Invest Coach`, French-language, category `Business → Investing`. Show art lives at `~/Desktop/invest-coach-cover.jpg` — drag-drop to upload. (Generated by `make_cover.py`; regenerate if you change brand colors.)
3. For each episode: "New episode" → drag the MP3 from `~/Downloads/` (or wherever you saved it) → set title and description (see `podcast-prompt-spec.md` for the marketing template) → save as draft, then publish.
4. First episode goes through ~24 h Spotify review. Subsequent episodes are typically near-instant.

Computer-use can't trigger native file picker dialogs reliably, so the upload step is faster done by hand.

## Themes

`EpisodeTheme` in `babylon-prompt.ts` is currently `"money"` only. The site treats it as the public-facing shelf:

- `app/page.tsx` Landing renders one card per theme in `<ThemesSection />`. Add a new theme by appending to the `THEMES` array.
- `app/podcast/page.tsx` accepts `?theme=money` (or any other slug) as a filter.
- Episode metadata JSON written by `script.ts` includes `theme`. Old episodes with no theme field fall back to `money`.

To add a new theme later:
1. Add the slug to `EpisodeTheme` in `babylon-prompt.ts`.
2. Add a new entry to `THEMES` in `app/page.tsx`.
3. Set `theme` on the episode brief (or hand-edit the metadata JSON before re-publish).

## Cost benchmarks (April 2026)

Per episode, ~14 min:

| Stage | Cost |
|---|---|
| Gemini 2.5 Flash video extraction | $0 (free tier) |
| Claude Opus 4.7 brief authoring | ~$0.30 (72k input + 2k output tokens, full Babylon book in context) |
| Jellypod generation (script + 2-voice TTS) | ~$5.00 (≈1 000 credits ÷ Creator plan $47/mo for 11 eps) |
| Supabase Storage | pennies |
| **Total** | **~$5.30 per episode** |

Monthly: Creator $47/mo handles ~11 eps (1/week + buffer). Business $150/mo handles ~30 eps (1/day) if cadence ramps.

## How we got here (April 2026 decision history)

We initially built our own end-to-end pipeline (Gemini → Claude Opus → ElevenLabs → Supabase) under `lib/podcast/{babylon-prompt,script,synth,elevenlabs}.ts`. It worked and was ~$3.85/ep, but on listening tests the ElevenLabs voices speaking French — even with native French voice IDs (Émilie / Yann) — felt flatter than Jellypod's defaults. The $1.45 saved per episode wasn't worth losing the storytelling and pacing quality Jellypod's tuning gives.

So as of April 2026 we:
- Keep `extract-video.ts` (Gemini stage 1).
- Keep `scripts/publish-babylon.ts` (Supabase upload).
- Keep `app/podcast/page.tsx` and the Money theme card.
- Add `scripts/build-jellypod-prompt.ts` (the new Opus-stage-2 brief author).
- Treat the rest of `lib/podcast/*` and `scripts/run-babylon-demo.ts` / `resynth-babylon.ts` as **dead code** — slated for cleanup in a separate PR. Don't add features to those files.

## What can go wrong

| Symptom | Cause | Fix |
|---|---|---|
| `GEMINI_API_KEY non configurée` | Key missing/empty in `.env.local` | Add it; restart shell |
| Gemini 429 free-tier quota | Pro model not allowed on free tier | Set `GEMINI_VIDEO_MODEL_PRO=gemini-2.5-flash` |
| `ANTHROPIC_API_KEY non configurée` despite key set | Empty pre-existing var in shell | Loader overrides empty values; if still seeing it, `unset ANTHROPIC_API_KEY` before running |
| Opus 4.7 brief leaks "Babylone" / "Arkad" / "Alux" / "abonnez-vous" | Meta-prompt got tweaked | grep the brief before pasting; if hits, regenerate. The meta-prompt in `build-jellypod-prompt.ts` lists the bans verbatim |
| Brief is generic / template-y | Opus didn't use the Babylon book context | Confirm `docs/reference/richest-man-of-babylon.md` exists and is non-empty; the script `readFileSync`s it |
| Jellypod paste creates `default-text-file.txt` instead of inline text | Expected — Jellypod treats >X chars as a file source | Use the one-line top-level prompt that points to it |
| Jellypod 0 hosts after submit | Hosts aren't auto-bound to a new episode in the new flow | Click `Hosts (0)` → tick Coach + Investisseur → close modal → submit |
| `Bucket not found` on `publish-babylon.ts` | `podcasts` Supabase bucket missing | Script creates it on first run; run once |

## Files of interest

- [`scripts/build-jellypod-prompt.ts`](../invest-coach/web/scripts/build-jellypod-prompt.ts) — Gemini → Opus → Jellypod-ready brief
- [`lib/podcast/extract-video.ts`](../invest-coach/web/lib/podcast/extract-video.ts) — Gemini video extraction (used by stage 1)
- [`lib/podcast/storage.ts`](../invest-coach/web/lib/podcast/storage.ts) — Supabase Storage upload helper
- [`scripts/publish-babylon.ts`](../invest-coach/web/scripts/publish-babylon.ts) — upload an MP3 + metadata to the `podcasts` bucket
- [`docs/reference/richest-man-of-babylon.md`](reference/richest-man-of-babylon.md) — the storytelling-craft reference Opus reads (never cited in audio)
- [`app/podcast/page.tsx`](../invest-coach/web/app/podcast/page.tsx) — public episode list, `?theme=` filter
- [`app/page.tsx`](../invest-coach/web/app/page.tsx) — Landing's `<ThemesSection />` Money card
- [`docs/podcast-prompt-spec.md`](podcast-prompt-spec.md) — editorial intent (the *why* behind the meta-prompt)

**Dead code, scheduled for removal:**
`lib/podcast/{babylon-prompt,script,synth,elevenlabs}.ts`,
`scripts/{run-babylon-demo,resynth-babylon}.ts`,
`app/api/podcast/generate*/route.ts`,
`components/coaching-podcast.tsx`. None imported by the new flow. Leave them alone — separate cleanup PR.

## How a future Claude Code session should pick this up

`MEMORY.md` for project-m2 points at `project_podcast_pipeline.md`, which links here. Reading this runbook + `docs/podcast-prompt-spec.md` + the meta-prompt inside `scripts/build-jellypod-prompt.ts` is enough context to ship a new episode in ~10 min.
