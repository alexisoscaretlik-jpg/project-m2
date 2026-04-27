// Minimal ElevenLabs TTS client.
// Reads ELEVENLABS_API_KEY from runtime env (Cloudflare Worker secret).
// Returns the raw MP3 bytes; caller persists them (R2 / Supabase).

export type ElevenVoice = {
  id: string;
  name: string;
  stability: number;
  similarityBoost: number;
  style?: number;
  useSpeakerBoost?: boolean;
};

export const VOICES = {
  // Defaults — can be overridden from env for A/B.
  // ElevenLabs offers French voices; replace IDs with the ones the
  // user wants once they confirm. These are placeholders.
  coach: {
    id: process.env.ELEVENLABS_VOICE_COACH || "XB0fDUnXU5powFXDhCwa",
    name: "Coach",
    stability: 0.55,
    similarityBoost: 0.75,
    style: 0.10,
    useSpeakerBoost: true,
  } satisfies ElevenVoice,
  investisseur: {
    id: process.env.ELEVENLABS_VOICE_INVESTISSEUR || "pNInz6obpgDQGcFmaJgB",
    name: "Investisseur",
    stability: 0.50,
    similarityBoost: 0.70,
    style: 0.20,
    useSpeakerBoost: true,
  } satisfies ElevenVoice,
  narrateur: {
    id: process.env.ELEVENLABS_VOICE_NARRATEUR || "XB0fDUnXU5powFXDhCwa",
    name: "Narrateur",
    stability: 0.65,
    similarityBoost: 0.80,
    style: 0.05,
    useSpeakerBoost: true,
  } satisfies ElevenVoice,
};

const ELEVEN_API = "https://api.elevenlabs.io/v1";
// `eleven_multilingual_v2` is the highest-quality model for FR with the right
// emotional range. `eleven_turbo_v2_5` is ~3x cheaper but flatter — keep multilingual_v2
// for the paying-user feature.
const MODEL_ID = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";

export async function synthLine(
  text: string,
  voice: ElevenVoice,
): Promise<Uint8Array> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY non configurée.");
  }

  const res = await fetch(`${ELEVEN_API}/text-to-speech/${voice.id}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: voice.stability,
        similarity_boost: voice.similarityBoost,
        style: voice.style ?? 0,
        use_speaker_boost: voice.useSpeakerBoost ?? true,
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`ElevenLabs ${res.status}: ${errBody.slice(0, 300)}`);
  }

  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

// Concatenate raw MP3 segments. Browsers and standard MP3 decoders
// tolerate naive concatenation of constant-bitrate MP3 frames produced by the
// same encoder, which is what ElevenLabs returns. For VBR or true gapless,
// we'd need ffmpeg — out of scope for v1.
export function concatMp3(segments: Uint8Array[]): Uint8Array {
  const total = segments.reduce((n, s) => n + s.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const seg of segments) {
    out.set(seg, offset);
    offset += seg.byteLength;
  }
  return out;
}

// Rough cost estimator. ElevenLabs Creator tier pricing (subject to change):
// ~$0.30 per 1,000 characters with multilingual_v2.
// Pro tier ≈ $0.18 per 1,000.
export function estimateTtsCostUsd(text: string, tier: "creator" | "pro" = "creator"): number {
  const perK = tier === "pro" ? 0.18 : 0.30;
  return (text.length / 1000) * perK;
}

export function pickVoiceForSpeaker(speaker: "Narrateur" | "Coach" | "Investisseur"): ElevenVoice {
  if (speaker === "Coach") return VOICES.coach;
  if (speaker === "Investisseur") return VOICES.investisseur;
  return VOICES.narrateur;
}
