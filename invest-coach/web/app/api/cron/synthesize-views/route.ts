import { NextRequest, NextResponse } from "next/server";

import { serviceClient } from "@/lib/supabase/service";
import { synthesizeAllCompanies } from "@/lib/vue-technique";

// Weekly cron — for each company, finds @great_martis tweets from the last
// 30 days that mention it, asks Gemini Flash to synthesize a Capucine-voiced
// "Vue technique" entry, upserts it into vue_technique keyed on
// (company_id, week_start). Re-running mid-week is idempotent.
//
// Triggered by:
//   - Cloudflare cron (configure in wrangler.jsonc once validated)
//   - Manual:  curl -H "Authorization: Bearer <secret>" \
//              https://project-m2.alexisoscaretlik.workers.dev/api/cron/synthesize-views
//
// Env:
//   CRON_SECRET           required for auth (skip in dev if unset)
//   TWITTER_CREATOR_HANDLE  required — the analyst whose tweets seed synthesis
//   GEMINI_API_KEY        required — Gemini Flash for the synthesis call
//   GEMINI_MODEL          optional, default "gemini-2.5-flash"

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 50 companies × ~3s/synth = 2.5 min worst case

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const handle = process.env.TWITTER_CREATOR_HANDLE;
  if (!handle) {
    return NextResponse.json(
      { error: "TWITTER_CREATOR_HANDLE not set in env" },
      { status: 503 },
    );
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not set in env" },
      { status: 503 },
    );
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  try {
    const sb = serviceClient();
    const report = await synthesizeAllCompanies(sb, {
      handle: handle.replace(/^@/, ""),
      lookbackDays: 30,
      modelName,
    });
    return NextResponse.json({ ok: true, ...report });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
