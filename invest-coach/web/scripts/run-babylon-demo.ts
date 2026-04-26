#!/usr/bin/env tsx
// Local runner for the Babylon-style 20-min podcast pipeline.
// Bypasses the Cloudflare Worker (which can hit the 5-min CPU cap)
// and runs the full pipeline directly from your Mac with .env.local.
//
// Usage:
//   cd invest-coach/web
//   npx tsx scripts/run-babylon-demo.ts <YOUTUBE_URL>
//
// Or with the npm script:
//   npm run podcast:demo -- https://www.youtube.com/watch?v=ZyYQgZ1tnWM
//
// Required .env.local keys:
//   GEMINI_API_KEY
//   ANTHROPIC_API_KEY
//   ELEVENLABS_API_KEY
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Optional .env.local keys:
//   ELEVENLABS_VOICE_COACH, _INVESTISSEUR, _NARRATEUR — French voice IDs
//   ANTHROPIC_PODCAST_MODEL — defaults to claude-sonnet-4-6
//   GEMINI_VIDEO_MODEL_PRO — defaults to gemini-2.5-pro

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Load .env.local first so the lib modules pick up keys from process.env.
const envPath = join(process.cwd(), ".env.local");
try {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && !(key in process.env)) process.env[key] = val;
  }
} catch {
  console.error(`Could not read ${envPath}. Make sure you're running from invest-coach/web/.`);
  process.exit(1);
}

import { extractVideoBrief } from "../lib/podcast/extract-video.js";
import { writeBabylonScript } from "../lib/podcast/script.js";
import { synthesizeEpisode } from "../lib/podcast/synth.js";
import { uploadEpisode } from "../lib/podcast/storage.js";
import type { BabylonBrief } from "../lib/podcast/babylon-prompt.js";

const url = process.argv[2];
if (!url) {
  console.error("Usage: npx tsx scripts/run-babylon-demo.ts <YOUTUBE_URL>");
  process.exit(1);
}
if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
  console.error("Not a YouTube URL.");
  process.exit(1);
}

function step(n: number, label: string) {
  const stamp = new Date().toISOString().slice(11, 19);
  console.log(`\n[${stamp}] ━━━ Step ${n}: ${label}`);
}

async function main() {
  console.log(`\nBabylon demo · source: ${url}`);
  console.log(`Started ${new Date().toISOString()}`);

  step(1, "Gemini Pro extracts the video insight");
  const extraction = await extractVideoBrief(url);
  console.log(`  Title:     ${extraction.videoTitle}`);
  console.log(`  Creator:   ${extraction.videoCreator ?? "(unknown)"}`);
  console.log(`  Law:       ${extraction.babylonianLawSuggestion}`);
  console.log(`  Character: ${extraction.characterSuggestion.name}, ${extraction.characterSuggestion.age}, ${extraction.characterSuggestion.city}`);
  console.log(`  Insights:  ${extraction.keyInsightBullets.length} bullets`);

  step(2, "Claude Sonnet 4.6 writes the 3-act script");
  const brief: BabylonBrief = {
    sourceUrl: url,
    sourceCreator: extraction.videoCreator ?? "Source YouTube",
    keyInsightBullets: extraction.keyInsightBullets,
    law: extraction.babylonianLawSuggestion,
    character: extraction.characterSuggestion,
    targetAction: extraction.targetActionSuggestion,
  };
  const script = await writeBabylonScript(brief);
  console.log(`  Title:    ${script.title}`);
  console.log(`  Lines:    ${script.lines.length}`);
  console.log(`  Words:    ${script.wordCount}`);
  console.log(`  Estimate: ${Math.round(script.wordCount / 150)} min`);

  // Save script to disk for inspection while audio is being made.
  const scriptPath = `/tmp/babylon-${Date.now()}.json`;
  writeFileSync(scriptPath, JSON.stringify(script, null, 2));
  console.log(`  Script saved: ${scriptPath}`);

  step(3, `ElevenLabs synthesizes ${script.lines.length} lines`);
  const t0 = Date.now();
  const synth = await synthesizeEpisode(script);
  const synthSec = Math.round((Date.now() - t0) / 1000);
  console.log(`  Segments: ${synth.segmentCount}`);
  console.log(`  Chars:    ${synth.totalChars}`);
  console.log(`  Cost est: $${synth.costEstimateUsd.toFixed(2)}`);
  console.log(`  Time:     ${synthSec}s`);
  console.log(`  Bytes:    ${synth.audio.byteLength.toLocaleString()}`);

  // Save the MP3 locally too — instant playback, no network needed.
  const localMp3 = `/tmp/babylon-${Date.now()}.mp3`;
  writeFileSync(localMp3, synth.audio);
  console.log(`  Local MP3: ${localMp3}`);

  step(4, "Uploading to Supabase Storage");
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
      generatedBy: "run-babylon-demo.ts",
    },
  });

  console.log(`\n━━━ DONE ━━━`);
  console.log(`Audio URL: ${upload.audioUrl}`);
  console.log(`Metadata:  ${upload.metadataUrl}`);
  console.log(`Local MP3: ${localMp3}`);
  console.log(`\nOpen the Audio URL in any browser to listen, or play the local file.`);
}

main().catch((e) => {
  console.error(`\nERROR: ${(e as Error).message}`);
  if ((e as Error).stack) console.error((e as Error).stack);
  process.exit(1);
});
