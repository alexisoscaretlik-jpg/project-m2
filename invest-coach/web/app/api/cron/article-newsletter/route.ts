import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";

import { emailConfigured, send } from "@/lib/email";
import { serviceClient } from "@/lib/supabase/service";
import { articleHtml, articleText, articleSubject, ArticleInput } from "@/lib/newsletter/templates";

// One-shot article newsletter. Reads a campaign markdown file from
// lib/newsletter/<campaign>.md, renders it, and sends to all subscribers.
// Manual trigger:
//   curl -H "Authorization: Bearer <secret>" \
//        "http://localhost:3000/api/cron/article-newsletter?campaign=2026-W20"
// Add ?preview=1 to render HTML in-browser without sending.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseCampaignMd(raw: string): Omit<ArticleInput, "trackPixelUrl"> {
  // Strip YAML frontmatter
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fmMatch) throw new Error("missing frontmatter");

  const fm = fmMatch[1];
  const body = fmMatch[2].trimStart();

  function fmVal(key: string): string {
    const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    return m ? m[1].trim() : "";
  }

  const campaign = fmVal("campaign");
  const preheader = fmVal("preheader");

  // First # heading is the h1; everything after is the body.
  const h1Match = body.match(/^#\s+(.+)$/m);
  if (!h1Match) throw new Error("missing h1");
  const h1 = h1Match[1].trim();
  const bodyMd = body.slice(body.indexOf(h1Match[0]) + h1Match[0].length).trimStart();

  return { h1, bodyMd, preheader, campaign };
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const url = new URL(req.url);
  const campaign = url.searchParams.get("campaign");
  const preview = url.searchParams.get("preview") === "1";

  if (!campaign) {
    return NextResponse.json({ error: "missing campaign param, e.g. ?campaign=2026-W20" }, { status: 400 });
  }

  // Sanitize campaign name — only alphanumeric + dash
  if (!/^[a-zA-Z0-9-]+$/.test(campaign)) {
    return NextResponse.json({ error: "invalid campaign name" }, { status: 400 });
  }

  const mdPath = join(process.cwd(), "lib", "newsletter", `${campaign}.md`);
  let raw: string;
  try {
    raw = readFileSync(mdPath, "utf8");
  } catch {
    return NextResponse.json({ error: `campaign file not found: ${campaign}.md` }, { status: 404 });
  }

  let parsed: Omit<ArticleInput, "trackPixelUrl">;
  try {
    parsed = parseCampaignMd(raw);
  } catch (e) {
    return NextResponse.json({ error: `parse error: ${(e as Error).message}` }, { status: 422 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trading-bot-2-opal.vercel.app";
  const trackPixelUrl = `${siteUrl}/api/track/open?cid=${encodeURIComponent(parsed.campaign || campaign)}`;
  const input: ArticleInput = { ...parsed, trackPixelUrl };

  const html = articleHtml(input);
  const text = articleText(input);
  const subject = articleSubject(parsed.h1);

  if (preview) {
    return new NextResponse(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  if (!emailConfigured()) {
    return NextResponse.json(
      { error: "email_not_configured", hint: "Set RESEND_API_KEY and EMAIL_FROM" },
      { status: 503 },
    );
  }

  const sb = serviceClient();
  const { data: subs } = await sb
    .from("newsletter_subscribers")
    .select("email")
    .eq("unsubscribed", false);
  const emails = (subs ?? []).map((s: { email: string }) => s.email);

  if (emails.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_subscribers" });
  }

  let sent = 0;
  const errors: string[] = [];
  for (const to of emails) {
    try {
      await send({ to, subject, html, text, trackOpens: true, trackClicks: true });
      sent++;
    } catch (err) {
      errors.push(`${to}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json({
    campaign,
    subject,
    sent,
    failures: errors.length,
    total: emails.length,
    errors: errors.slice(0, 10),
  });
}
