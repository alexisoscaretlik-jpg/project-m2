import { NextRequest, NextResponse } from "next/server";

// 1×1 transparent GIF — RFC 2397 minimal payload.
const GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cid = new URL(req.url).searchParams.get("cid") ?? "unknown";
  const ua = req.headers.get("user-agent") ?? "";
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({ event: "email_open", cid, ua, ts: new Date().toISOString() }),
  );
  return new NextResponse(GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
    },
  });
}
