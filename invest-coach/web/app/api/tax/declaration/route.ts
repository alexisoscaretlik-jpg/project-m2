// Download the user's filled Cerfa 2042 PDF.
//
// Paywalled: only users with tier = 'plus' or 'wealth' can hit it.
// Everyone else gets a 402 with a CTA to /subscription.

import { NextResponse } from "next/server";

import { DEV_USER_ID, IS_DEV } from "@/lib/devUser";
import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";
import { buildDeclaration } from "@/lib/tax/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const userId = user?.id ?? (IS_DEV ? DEV_USER_ID : null);
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const db = user ? sb : serviceClient();

  const { data: profile } = await db
    .from("profiles")
    .select("tier")
    .eq("user_id", userId)
    .maybeSingle();

  const tier = (profile?.tier as string | undefined) ?? "free";
  if (tier !== "plus" && tier !== "wealth") {
    return NextResponse.json(
      { error: "paid_required", upgrade: "/subscription" },
      { status: 402 },
    );
  }

  let result;
  try {
    result = await buildDeclaration(userId);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 422 },
    );
  }

  const filename = `declaration-${new Date().getFullYear()}.pdf`;

  return new NextResponse(Buffer.from(result.pdfBytes), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      // Diagnostics headers (small) so the UI can show fill coverage.
      "x-cerfa-filled-count": String(result.filled.length),
      "x-cerfa-unmatched-count": String(result.unmatched.length),
    },
  });
}
