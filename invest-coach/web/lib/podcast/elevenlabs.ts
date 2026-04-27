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

// Concatenate ElevenLabs MP3 segments into one playable file.
//
// ElevenLabs prefixes each segment with an ID3v2 tag. Naively concatenating
// leaves an ID3v2 tag in the middle of the audio stream, which makes many
// players (Apple Music, iOS Safari) report only the duration of the first
// segment. Strip the ID3v2 prefix and any ID3v1 trailer from each segment;
// the result is pure MP3 frames concatenated end-to-end.
export function concatMp3(segments: Uint8Array[]): Uint8Array {
  const stripped = segments.map(stripId3);
  const total = stripped.reduce((n, s) => n + s.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const seg of stripped) {
    out.set(seg, offset);
    offset += seg.byteLength;
  }
  return out;
}

function stripId3(seg: Uint8Array): Uint8Array {
  let start = 0;
  let end = seg.byteLength;

  // ID3v2 header: "ID3" + 2 version bytes + 1 flags + 4 synchsafe size bytes,
  // then `size` bytes of tag content. Total stripped = 10 + size.
  if (seg.byteLength >= 10 && seg[0] === 0x49 && seg[1] === 0x44 && seg[2] === 0x33) {
    const size = (seg[6] << 21) | (seg[7] << 14) | (seg[8] << 7) | seg[9];
    start = 10 + size;
  }

  // ID3v1 trailer: last 128 bytes start with "TAG".
  if (
    seg.byteLength >= 128 &&
    seg[seg.byteLength - 128] === 0x54 &&
    seg[seg.byteLength - 127] === 0x41 &&
    seg[seg.byteLength - 126] === 0x47
  ) {
    end = seg.byteLength - 128;
  }

  return start === 0 && end === seg.byteLength ? seg : seg.subarray(start, end);
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
