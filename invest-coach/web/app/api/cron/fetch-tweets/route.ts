import { NextRequest, NextResponse } from "next/server";

import { serviceClient } from "@/lib/supabase/service";
import { syncHandle } from "@/lib/twitter";

// Daily cron — pulls the last ~50 tweets from TWITTER_CREATOR_HANDLE and
// upserts them into the `tweets` table. Called by launchd every day at 07:00.
// Authenticated via CRON_SECRET bearer header. Manual trigger:
//   curl -H "Authorization: Bearer <secret>" https://.../api/cron/fetch-tweets

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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
  if (!process.env.TWITTER_BEARER_TOKEN) {
    return NextResponse.json(
      { error: "TWITTER_BEARER_TOKEN not set in env" },
      { status: 503 },
    );
  }

  try {
    const sb = serviceClient();
    const result = await syncHandle(handle, sb);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
