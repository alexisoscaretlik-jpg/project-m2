import { NextRequest, NextResponse } from "next/server";

import { finalizeConnection } from "../actions";

// GoCardless sends the user here with ?ref=<requisition_id> after
// they've authorized at their bank.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const ref = url.searchParams.get("ref");
  if (!ref) {
    return NextResponse.redirect(new URL("/bank?error=missing_ref", url.origin));
  }
  try {
    await finalizeConnection(ref);
  } catch (e) {
    // finalizeConnection ends in redirect() which throws internally;
    // any other error we catch and surface.
    const msg = (e as Error).message ?? "";
    if (msg.includes("NEXT_REDIRECT")) throw e;
    return NextResponse.redirect(
      new URL(`/bank?error=${encodeURIComponent(msg)}`, url.origin),
    );
  }
  return NextResponse.redirect(new URL("/bank", url.origin));
}
