import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Magic-link redirect target. Supabase sends the user here with a
// one-time code — exchange it for a session cookie, then forward to
// wherever they were headed.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/watchlist";

  if (code) {
    const sb = await createClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
}
