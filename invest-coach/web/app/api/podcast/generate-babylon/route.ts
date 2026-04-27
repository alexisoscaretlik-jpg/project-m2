import { NextRequest, NextResponse } from "next/server";
import { extractVideoBrief } from "@/lib/podcast/extract-video";
import { writeBabylonScript } from "@/lib/podcast/script";
import { synthesizeEpisode } from "@/lib/podcast/synth";
import { uploadEpisode } from "@/lib/podcast/storage";
import type { BabylonBrief } from "@/lib/podcast/babylon-prompt";

export const dynamic = "force-dynamic";
// Long-running: video extraction (~60s) + script (~30s) + ElevenLabs TTS
// per line × ~25 lines × ~5s. Total budget 4-6 minutes. The Cloudflare
// Worker runtime is the practical ceiling — see AGENTS.md for limits.
export const maxDuration = 600;

type GenerateBody = {
  url?: string;
};

type GenerateResult = {
  audioUrl: string;
  metadataUrl: string;
  title: string;
  summary: string;
  durationEstimateMin: number;
  wordCount: number;
  segmentCount: number;
  costEstimateUsd: number;
  source: { url: string; creator: string };
};

export async function POST(req: NextRequest) {
  const body: GenerateBody = await req.json().catch(() => ({}));
  const url = body.url?.trim() ?? "";

  if (!url || (!url.includes("youtube.com") && !url.includes("youtu.be"))) {
    return NextResponse.json({ error: "URL YouTube invalide." }, { status: 400 });
  }

  try {
    // 1. Extract insight from the video.
    const extraction = await extractVideoBrief(url);

    // 2. Build the brief for the script generator.
    const brief: BabylonBrief = {
      sourceUrl: url,
      sourceCreator: extraction.videoCreator ?? "Source YouTube",
      keyInsightBullets: extraction.keyInsightBullets,
      law: extraction.babylonianLawSuggestion,
      character: extraction.characterSuggestion,
      targetAction: extraction.targetActionSuggestion,
    };

    // 3. Write the 3-act French script with Claude.
    const script = await writeBabylonScript(brief);

    // 4. Synthesize line-by-line with ElevenLabs and concatenate.
    const synth = await synthesizeEpisode(script);

    // 5. Persist the MP3 + metadata to Supabase Storage.
    const upload = await uploadEpisode({
      title: script.title,
      audio: synth.audio,
      metadata: {
        title: script.title,
        summary: script.summary,
        law: script.law,
        character: script.character,
        source: script.source,
        lines: script.lines,
        wordCount: script.wordCount,
        generatedAt: new Date().toISOString(),
      },
    });

    const result: GenerateResult = {
      audioUrl: upload.audioUrl,
      metadataUrl: upload.metadataUrl,
      title: script.title,
      summary: script.summary,
      durationEstimateMin: Math.round(script.wordCount / 150),
      wordCount: script.wordCount,
      segmentCount: synth.segmentCount,
      costEstimateUsd: Number(synth.costEstimateUsd.toFixed(2)),
      source: script.source,
    };

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
