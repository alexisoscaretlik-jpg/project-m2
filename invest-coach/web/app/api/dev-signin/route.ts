// Dev-only sign-in helper.
//
// Usage:
//   /api/dev-signin?email=you@example.com&token=12345678[&next=/tax]
//
// The token is the 6-8 digit "email_otp" returned by Supabase's
// admin.generateLink API. Bypasses the normal magic-link flow
// (which returns session tokens in a hash fragment unreadable
// server-side) by calling verifyOtp directly, which returns tokens
// in the response body and the SSR client writes them to cookies.
//
// Hard-gated to NODE_ENV === 'development' so this can't be used in
// production even if deployed accidentally.

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Disabled in production." }, { status: 404 });
  }

  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const token = url.searchParams.get("token");
  const next = url.searchParams.get("next") ?? "/tax";

  if (!email || !token) {
    return NextResponse.json(
      { error: "Missing email or token query param." },
      { status: 400 },
    );
  }

  const sb = await createClient();
  const { error } = await sb.auth.verifyOtp({ email, token, type: "email" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
