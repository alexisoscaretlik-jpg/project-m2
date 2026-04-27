import {
  concatMp3,
  estimateTtsCostUsd,
  pickVoiceForSpeaker,
  synthLine,
} from "./elevenlabs";
import type { BabylonScript } from "./babylon-prompt";

// Render a full Babylon script to a single MP3 by calling ElevenLabs
// once per line and concatenating the segments.
//
// Why per-line and not one giant call:
// - ElevenLabs has a per-request character cap and quality drops on very
//   long inputs.
// - Per-line lets us assign different voices to Coach / Investisseur /
//   Narrateur without splitting strings post-hoc.
// - Per-line lets us add small silences between speakers (future).

export type SynthesizedEpisode = {
  audio: Uint8Array;
  totalChars: number;
  costEstimateUsd: number;
  segmentCount: number;
};

const HARD_CAP_USD = 5.0;

export async function synthesizeEpisode(script: BabylonScript): Promise<SynthesizedEpisode> {
  const fullText = script.lines.map((l) => l.text).join(" ");
  const totalChars = fullText.length;
  const costEstimateUsd = estimateTtsCostUsd(fullText, "creator");

  if (costEstimateUsd > HARD_CAP_USD) {
    throw new Error(
      `Coût estimé ${costEstimateUsd.toFixed(2)}$ dépasse le plafond ${HARD_CAP_USD}$.`,
    );
  }

  const segments: Uint8Array[] = [];
  for (const line of script.lines) {
    const voice = pickVoiceForSpeaker(line.speaker);
    const trimmed = line.text.trim();
    if (!trimmed) continue;
    const seg = await synthLine(trimmed, voice);
    segments.push(seg);
  }

  const audio = concatMp3(segments);
  return {
    audio,
    totalChars,
    costEstimateUsd,
    segmentCount: segments.length,
  };
}
