import { NextRequest, NextResponse } from "next/server";

import { serviceClient } from "@/lib/supabase/service";

// Cron — generates real audio podcast episodes from curated YouTube URLs.
// Pipeline: Gemini watches video → generates FR dialogue script →
//           Gemini TTS renders 2-voice audio → stored in Supabase Storage →
//           private_notes row stores JSON with audioUrl.
//
// Auth: Bearer CRON_SECRET.

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CURATED_VIDEOS = [
  "https://www.youtube.com/watch?v=VF07FCbNpD8",
  // Expand this list — agents will add more French finance channels
];

// Voice mapping: Coach = deep/authoritative, Investisseur = curious/bright
const VOICES: Record<string, string> = {
  Coach: "Charon",
  Investisseur: "Zephyr",
};

const SCRIPT_PROMPT = `Tu regardes une vidéo YouTube financière. Transforme-la en podcast éducatif en français pour un investisseur particulier français (PEA, assurance-vie, CTO).

Dialogue entre :
- **Coach** : Expert bienveillant, exemples concrets, chiffres réels. Jamais condescendant.
- **Investisseur** : Curieux, autodidacte, 35-50 ans. Vraies questions, doutes légitimes.

Règles : 10-14 échanges · 100% français · contexte FR (PEA/AV/PER, IR 2042, PFU 30%) · dernière réplique = action concrète cette semaine.

Réponds UNIQUEMENT avec JSON valide, sans markdown :
{
  "title": "Titre court (max 80 caractères)",
  "summary": "Deux phrases résumant le sujet et son intérêt.",
  "script": [
    {"speaker": "Coach", "text": "..."},
    {"speaker": "Investisseur", "text": "..."}
  ]
}`;

function ytId(url: string): string | null {
  return url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1] ?? null;
}

function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bitDepth = 16): Buffer {
  const dataSize = pcm.length;
  const wav = Buffer.alloc(44 + dataSize);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);           // PCM
  wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * channels * (bitDepth / 8), 28);
  wav.writeUInt16LE(channels * (bitDepth / 8), 32);
  wav.writeUInt16LE(bitDepth, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(dataSize, 40);
  pcm.copy(wav, 44);
  return wav;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 503 });
  }

  const sb = serviceClient();

  // Ensure storage bucket exists (public, for audio streaming)
  await sb.storage.createBucket("podcast-audio", { public: true }).catch(() => {});

  // Skip already-processed
  const { data: existing } = await sb
    .from("private_notes").select("source").like("source", "podcast-%");
  const seen = new Set((existing ?? []).map((r: { source: string }) => r.source));
  const fresh = CURATED_VIDEOS.filter(url => {
    const id = ytId(url);
    return id && !seen.has(`podcast-${id}`);
  });

  if (fresh.length === 0) {
    return NextResponse.json({ ok: true, new: 0 });
  }

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const videoModel = process.env.GEMINI_VIDEO_MODEL || "gemini-2.5-flash";

  const results = [];

  for (const url of fresh) {
    const id = ytId(url)!;
    try {
      // ── 1. Generate dialogue script ───────────────────────────────────────
      const scriptRes = await ai.models.generateContent({
        model: videoModel,
        contents: [
          { fileData: { fileUri: url, mimeType: "video/mp4" } },
          { text: SCRIPT_PROMPT },
        ] as unknown as string,
      });
      const rawScript = (scriptRes.text ?? "").trim()
        .replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(rawScript);
      if (!Array.isArray(parsed.script)) throw new Error("bad script");

      // ── 2. Generate multi-speaker TTS audio ───────────────────────────────
      const ttsText = parsed.script
        .map((l: { speaker: string; text: string }) => `${l.speaker}: ${l.text}`)
        .join("\n");

      const ttsRes = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: ttsText }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: Object.entries(VOICES).map(([speaker, voiceName]) => ({
                speaker,
                voiceConfig: { prebuiltVoiceConfig: { voiceName } },
              })),
            },
          },
        },
      } as unknown as Parameters<typeof ai.models.generateContent>[0]);

      const audioB64 = (ttsRes as unknown as {
        candidates: { content: { parts: { inlineData?: { data: string; mimeType: string } }[] } }[]
      }).candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!audioB64) throw new Error("TTS returned no audio");

      // ── 3. Convert PCM → WAV and upload ───────────────────────────────────
      const pcm = Buffer.from(audioB64, "base64");
      const wav = pcmToWav(pcm);
      const fileName = `${id}.wav`;

      const { error: uploadErr } = await sb.storage
        .from("podcast-audio")
        .upload(fileName, wav, { contentType: "audio/wav", upsert: true });
      if (uploadErr) throw new Error(`storage: ${uploadErr.message}`);

      const { data: { publicUrl } } = sb.storage
        .from("podcast-audio")
        .getPublicUrl(fileName);

      // ── 4. Save to private_notes ──────────────────────────────────────────
      const { error: dbErr } = await sb.from("private_notes").insert({
        source: `podcast-${id}`,
        raw_input: url,
        polished: JSON.stringify({ ...parsed, audioUrl: publicUrl }),
      });
      if (dbErr) throw new Error(`db: ${dbErr.message}`);

      results.push({ id, status: "saved", audioUrl: publicUrl });
    } catch (e) {
      results.push({ id, status: "error", error: (e as Error).message });
    }
  }

  return NextResponse.json({ ok: true, new: fresh.length, results });
}
