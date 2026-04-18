import { NextRequest, NextResponse } from "next/server";

import { emailConfigured, send } from "@/lib/email";
import { serviceClient } from "@/lib/supabase/service";

// Weekly digest. Triggered by Vercel Cron — see vercel.json.
// Authenticated via CRON_SECRET header so the endpoint can't be hit
// by random traffic. Manual trigger: `curl -H "Authorization: Bearer <secret>"`.
//
// Content pulled live at send time: top 6 cards from the last 7 days.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Card = {
  id: number;
  title: string;
  tone: string | null;
  body_markdown: string | null;
  published_at: string;
  companies: { ticker: string; name: string } | null;
};

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  if (!emailConfigured()) {
    return NextResponse.json(
      { error: "email_not_configured" },
      { status: 503 },
    );
  }

  const sb = serviceClient();

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: cardsRaw } = await sb
    .from("cards")
    .select("id, title, tone, body_markdown, published_at, companies(ticker, name)")
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(6);
  const cards = (cardsRaw ?? []) as unknown as Card[];

  if (cards.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_cards" });
  }

  const { data: subs } = await sb
    .from("newsletter_subscribers")
    .select("email")
    .eq("unsubscribed", false);
  const emails = (subs ?? []).map((s) => s.email);

  if (emails.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_subscribers" });
  }

  const html = buildHtml(cards);
  const text = buildText(cards);
  const subject = `Invest Coach · ${emails.length > 0 ? "Ta semaine en bourse" : ""}`.trim();

  let sent = 0;
  const errors: string[] = [];
  for (const to of emails) {
    try {
      await send({ to, subject, html, text });
      sent++;
    } catch (err) {
      errors.push(`${to}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json({ sent, failures: errors.length, total: emails.length });
}

function buildHtml(cards: Card[]): string {
  const items = cards
    .map((c) => {
      const company = c.companies;
      const ticker = company?.ticker ?? "—";
      const name = company?.name ?? "";
      const tone = c.tone ?? "educational";
      const toneColor =
        tone === "bullish"
          ? "#047857"
          : tone === "red_flag"
            ? "#be123c"
            : tone === "cautious"
              ? "#b45309"
              : "#475569";
      return `
      <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
          <span style="font-family:ui-monospace,Menlo,monospace;font-weight:600;color:#0f172a;">${ticker}</span>
          <span style="font-size:11px;text-transform:uppercase;color:${toneColor};">${tone.replace("_", " ")}</span>
        </div>
        <div style="font-size:13px;color:#475569;margin-bottom:6px;">${escapeHtml(name)}</div>
        <div style="font-size:15px;color:#0f172a;line-height:1.5;">${escapeHtml(c.title)}</div>
      </div>`;
    })
    .join("");

  return `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a;">
    <h1 style="font-size:22px;margin:0 0 4px;">Ta semaine en bourse</h1>
    <p style="font-size:13px;color:#64748b;margin:0 0 20px;">
      ${cards.length} cartes · analyses IA des derniers filings SEC &amp; Euronext
    </p>
    ${items}
    <p style="font-size:12px;color:#64748b;margin:32px 0 0;">
      Pour te désinscrire, réponds simplement à cet email.
    </p>
  </div>`;
}

function buildText(cards: Card[]): string {
  return (
    "Ta semaine en bourse\n\n" +
    cards
      .map((c) => {
        const ticker = c.companies?.ticker ?? "—";
        const tone = (c.tone ?? "").toUpperCase();
        return `[${ticker}] ${tone ? `(${tone}) ` : ""}${c.title}`;
      })
      .join("\n\n")
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
