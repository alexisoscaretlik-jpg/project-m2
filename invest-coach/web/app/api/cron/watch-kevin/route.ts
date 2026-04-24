import { NextRequest, NextResponse } from "next/server";

import { serviceClient } from "@/lib/supabase/service";
import { fetchChannelVideos } from "@/lib/youtube";

// Daily 14:00 cron. Fetches Meet Kevin's YouTube RSS, identifies videos
// not yet processed, asks Gemini to "watch" each one (Gemini 2.5 accepts
// YouTube URLs natively), stores the distilled summary in private_notes.
//
// Auth: Bearer CRON_SECRET.
//
// Env:
//   KEVIN_CHANNEL_ID       default: UCUvvj5lwue7PspotMDjk5UA  (@MeetKevin main)
//   GEMINI_VIDEO_MODEL     default: gemini-2.5-flash
//   GEMINI_API_KEY         (shared with /admin/notes)
//   YT_MAX_VIDEOS_PER_RUN  default: 3 — safety cap on API cost per run

export const dynamic = "force-dynamic";
export const maxDuration = 300;  // up to 5 min — video analysis is slow

const ANALYSIS_PROMPT = `You are a research assistant for a French retail investor. You just watched a YouTube video from a US financial analyst. The viewer is LEARNING — your output goes into their private notes, never redistributed.

Paraphrase aggressively. Do not reproduce segments verbatim. Be ruthlessly signal-dense. Ignore self-promotion, sponsor reads, "smash the like button", giveaways, and unrelated tangents.

Output in French if the video covers French/European topics, otherwise English. Use EXACTLY these markdown headings, no preamble, no sign-off:

## TL;DR
Two sentences. What happened and why it matters to a retail investor.

## Key points
3-6 bullets. High signal. Short sentences.

## Tickers / assets mentioned
Comma-separated list, or "None".

## Thesis / take from the speaker
One paragraph summarizing the speaker's view (not yours).

## Counter-arguments the viewer should consider
2-3 bullets. What a skeptic would say.

## Action items for me
Things to research, verify, or watch next.`;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not set" },
      { status: 503 },
    );
  }

  const channelId = process.env.KEVIN_CHANNEL_ID || "UCUvvj5lwue7PspotMDjk5UA";
  const model     = process.env.GEMINI_VIDEO_MODEL || "gemini-2.5-flash";
  const maxPerRun = Number.parseInt(process.env.YT_MAX_VIDEOS_PER_RUN || "3", 10);

  const sb = serviceClient();

  // ── 1. fetch RSS ───────────────────────────────────────────────────────────
  let videos;
  try {
    videos = await fetchChannelVideos(channelId);
  } catch (e) {
    return NextResponse.json(
      { ok: false, step: "rss", error: (e as Error).message },
      { status: 502 },
    );
  }

  // ── 2. filter out already-processed videos ─────────────────────────────────
  const { data: existing } = await sb
    .from("private_notes")
    .select("source")
    .like("source", "youtube-%");
  const seen = new Set((existing ?? []).map((r: { source: string | null }) =>
    r.source?.split("-")[1],  // source format: "youtube-<id>-<slug>"
  ).filter(Boolean));

  const fresh = videos
    .filter((v) => !seen.has(v.id))
    .slice(0, maxPerRun);

  if (fresh.length === 0) {
    return NextResponse.json({ ok: true, seen: videos.length, new: 0, saved: 0 });
  }

  // ── 3. ask Gemini to watch each ────────────────────────────────────────────
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const results: Array<{ id: string; status: string; title: string; error?: string }> = [];

  for (const v of fresh) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          { fileData: { fileUri: v.url, mimeType: "video/mp4" } },
          { text: ANALYSIS_PROMPT },
        ] as unknown as string,  // @google/genai accepts the array form at runtime
      });
      const polished = (response.text ?? "").trim();
      if (!polished) {
        results.push({ id: v.id, title: v.title, status: "empty" });
        continue;
      }

      const slug = v.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
      const sourceLabel = `youtube-${v.id}-${slug}`;
      const raw = `${v.url}\nTitle: ${v.title}\nPublished: ${v.published}`;

      const { error } = await sb.from("private_notes").insert({
        source: sourceLabel,
        raw_input: raw,
        polished,
      });
      if (error) {
        results.push({ id: v.id, title: v.title, status: "db-error", error: error.message });
      } else {
        results.push({ id: v.id, title: v.title, status: "saved" });
      }
    } catch (e) {
      results.push({ id: v.id, title: v.title, status: "gemini-error", error: (e as Error).message });
    }
  }

  return NextResponse.json({
    ok: true,
    channel: channelId,
    model,
    seen: videos.length,
    new: fresh.length,
    saved: results.filter((r) => r.status === "saved").length,
    results,
  });
}
