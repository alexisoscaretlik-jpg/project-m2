# Money-coaching podcast — prompt specification

This document is the durable spec for the Babylon-style podcast pipeline.
The canonical prompt lives in
[`invest-coach/web/lib/podcast/babylon-prompt.ts`](../invest-coach/web/lib/podcast/babylon-prompt.ts);
this file explains *why* the prompt is shaped this way, so a future Claude
Code session (or human) can adjust without losing the editorial intent.

## What we're producing

One French podcast episode per source video (typically a long-form Alux
YouTube on personal finance), ~18 minutes, hosted as MP3 in Supabase
Storage, listed on `/podcast` of the deployed site.

Each episode teaches **one** money law in a **conversational** format and
finishes on a **hook for the next month**.

## Format rules (load-bearing)

- **Two voices only.** Coach + Investisseur. **No narrator.** Earlier
  versions had a 3-act structure with a Narrateur; listening tests showed
  it felt staged. Do not re-introduce.
- **Speaking ratio ~80 / 20.** Coach carries the episode; Investisseur
  reacts. The QA gate accepts 70-90 % Coach — outside that band, regenerate.
- **No "show notes" framing.** No "in this episode we will cover", no act
  announcements, no "back to you, X". You drop into a real conversation.
- **No book name, ever.** The seven-laws scaffolding comes from a 1926
  finance classic (public-domain text already in `docs/reference/`), but
  none of the following may appear in audio: "Babylon", "Babylone", "the
  richest man", "Arkad", "Algamish", "Bansir", "Clason". The book is the
  Coach's mental map; the listener never sees it. The QA gate enforces
  this with a banned-phrase list.
- **Source video stays invisible too.** Insights are extracted by Gemini
  and used as story material — the script never says "as in the Alux video"
  or names the creator.

## Coach — voice and role

- French, posed, calm, never condescending. Tutoiement.
- Teaches by question more than by declaration. The "concrete arithmetic
  question" pattern (e.g. "If you put in 10 eggs each morning and take
  out 9 each evening, what happens to the basket?") is the dominant move
  — but expressed as ordinary modern French finance, never quoted from
  the book.
- Tells the story of the episode's protagonist (a fictional French
  character generated per episode by `extract-video.ts` —
  e.g. *Antoine, 32, Toulouse*). The protagonist's situation, choices,
  mistakes are the material for the lesson.
- Phrases courtes, beaucoup de pauses respirées.

## Investisseur — voice and role

- 38 yo CDI Lille, loyer 850 €, fille en CP, RIB qui clignote rouge le
  22 du mois. This default is fixed across episodes — he is the listener
  archetype. (If we later want listener variants — northern bourgeoisie,
  rural cadre, freelance Parisien — that's a future feature, not a
  parameter today.)
- Reacts with HIS OWN life, not parables. He doesn't tell stories;
  he asks questions and rebounds with personal detail.
- Asks **the real questions a French saver actually has** about PEA, AV,
  PER, Livret A, LMNP, SCPI, TMI. Examples in the prompt are non-negotiable
  — they're how we signal the show is for *real* French savers, not for
  YouTube finfluencer audience.
- "Ouais", "attends, attends", il rit, il doute. Not too smart, not too
  dumb. Auto-didacte sceptique.

## Ending — hook, not CTA

- The episode finishes with the Coach planting next-month attention:
  "Le mois prochain, on parle de [next law]. Et tu vas comprendre
  pourquoi cette action de cette semaine, c'est seulement la première
  marche."
- Investisseur closes: "Ah ouais. Là, j'attends de voir."
- The listener should finish with one thought: *I want the next one.*
  That is the conversion driver for monthly subscriptions. CTAs
  ("abonne-toi", "like") are explicitly banned — they undercut the
  storytelling and signal cheap content.

## Banned phrases (QA-enforced)

- Marketing CTAs: `abonnez-vous`, `likez`, `partagez`
- Pump language: `garanti`, `sans risque`, `doublez votre capital`,
  `révolutionnaire`, `achète cette action`
- Source-book leak: `babylone`, `babylon`, `babylonien`, `richest man`,
  `arkad`, `algamish`, `bansir`, `clason`
- Source-video leak: `alux`, `comme dans la vidéo`

Adding to this list is fine; removing requires explicit user sign-off
because each entry is a deliberate editorial choice.

## QA gate (script.ts)

Currently runs as a **warning**, not a throw, because Sonnet/Opus
sometimes lands just outside the band on the first try. The full pipeline
prints the warning and continues to TTS. If you want to make QA blocking,
flip `console.warn` → `throw` in
[`lib/podcast/script.ts`](../invest-coach/web/lib/podcast/script.ts).

Checks:
- Word count 3 000 – 4 500 (v3.2; the v3.0 band of 2 000–3 600 is obsolete)
- Both `Coach` and `Investisseur` appear, no other speakers
- Coach speaking-time ratio between 60 % and 75 % (v3.2 lowered Coach dominance from the 80/20 of v3.0; conversation is more balanced now)
- No banned phrase substring (case-insensitive)
- Mandatory compliance mentions present: "éducation, pas du conseil" (or paraphrase) AND "risque de perte en capital"

The programmatic gate above runs in `script.ts` and is non-blocking (warning, not throw). The **listen gate** in the runbook (step 6 of "Make a new episode") is the load-bearing checkpoint — a human must listen to the full MP3 before `publish-babylon.ts` will accept the upload.

## Models

- **Video extraction**: Gemini 2.5 Flash (set via
  `GEMINI_VIDEO_MODEL_PRO=gemini-2.5-flash` because free tier no longer
  grants any 2.5-pro quota). Returns the structured brief (title, law,
  character, target action, key insights).
- **Script writing**: Claude Opus 4.7 (set via
  `ANTHROPIC_PODCAST_MODEL=claude-opus-4-7`). Sonnet 4.6 was tried first
  but consistently produced scripts ~2 200-2 460 words — under the
  earlier 2 500 minimum. Opus also writes more naturally for this length.
- **TTS**: ElevenLabs `eleven_multilingual_v2`. Voice IDs come from
  `ELEVENLABS_VOICE_COACH` / `_INVESTISSEUR` env vars. Default voice IDs
  in `elevenlabs.ts` are placeholders (English-native voices speaking
  French — sound off). Replace with native French voice IDs from
  https://elevenlabs.io/app/voice-library before going live.

## How to run

```sh
cd invest-coach/web
npm run podcast:demo -- 'https://www.youtube.com/watch?v=YYYYYYYYYYY'
```

The runner is `scripts/run-babylon-demo.ts`. It loads `.env.local` from
the package root, calls Gemini → Claude → ElevenLabs → Supabase, and
prints the public audio URL.

To re-publish an existing local MP3 (e.g. after manual editing):

```sh
npx tsx scripts/publish-babylon.ts /tmp/babylon-XXXXXXXXXX.mp3 /tmp/babylon-XXXXXXXXXX.json
```

## Comparing to Jellypod

Jellypod (jellypod.com) was tested as a hosted alternative. It produces
similar quality with a more sensory writing style out of the box, but
locks editorial control in their UI. Decision (April 2026): keep our
pipeline as primary because we own the prompt, the voices, the storage,
and the page — Jellypod is a backup or a quality benchmark.
