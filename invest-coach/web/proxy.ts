import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (err) {
    // Missing env vars or transient Supabase errors shouldn't 500 every
    // page. Log and pass through — protected pages will gate server-side.
    console.error("proxy error:", err);
    return NextResponse.next({ request });
  }
}

export const runtime = "edge";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
