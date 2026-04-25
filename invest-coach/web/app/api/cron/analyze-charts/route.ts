import { NextRequest, NextResponse } from "next/server";

import { serviceClient } from "@/lib/supabase/service";
import { runChartAnalysis } from "@/lib/chart-analysis";

// Per-tweet chart-analysis pipeline.
//   1. Pick up the freshest @great_martis tweets that haven't been analyzed yet
//   2. Gemini Flash classifies + extracts asset metadata
//   3. Claude Sonnet writes the Capucine-voiced editorial that preserves voice
//   4. Upserts into chart_analysis (UNIQUE on tweet_id + asset_slug)
//
// Bounded by ?target=N (default 50) — once that many NEW rows are written this
// run, the pipeline stops. Cheap to re-run; idempotent.
//
// Manual:
//   curl -H "Authorization: Bearer <secret>" \
//     "https://project-m2.alexisoscaretlik.workers.dev/api/cron/analyze-charts?target=50"

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const handle = (process.env.TWITTER_CREATOR_HANDLE || "great_martis").replace(
    /^@/,
    "",
  );
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not set" },
      { status: 503 },
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set" },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const target = Math.max(
    1,
    Math.min(200, parseInt(url.searchParams.get("target") ?? "50", 10) || 50),
  );

  try {
    const sb = serviceClient();
    const report = await runChartAnalysis(sb, {
      handle,
      targetCount: target,
      maxTweets: 600,
      geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      claudeModel: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
    });
    return NextResponse.json({ ok: true, ...report });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
