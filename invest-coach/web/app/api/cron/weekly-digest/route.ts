import { NextRequest, NextResponse } from "next/server";

import { emailConfigured, send } from "@/lib/email";
import { serviceClient } from "@/lib/supabase/service";
import {
  DigestCard,
  digestHtml,
  digestSubject,
  digestText,
} from "@/lib/newsletter/templates";
import { weeklyTip } from "@/lib/newsletter/tips";

// Weekly digest. Triggered by Vercel Cron — see vercel.json.
// Authenticated via CRON_SECRET header so the endpoint can't be hit
// by random traffic. Manual trigger:
//   curl -H "Authorization: Bearer <secret>" https://.../api/cron/weekly-digest
// Add ?preview=1 to render HTML in-browser without sending.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type CardRow = {
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

  const url = new URL(req.url);
  const preview = url.searchParams.get("preview") === "1";

  const sb = serviceClient();

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: cardsRaw } = await sb
    .from("cards")
    .select(
      "id, title, tone, body_markdown, published_at, companies(ticker, name)",
    )
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(3);
  const rows = (cardsRaw ?? []) as unknown as CardRow[];

  const cards: DigestCard[] = rows.map((r) => ({
    ticker: r.companies?.ticker ?? "—",
    company: r.companies?.name ?? "",
    title: r.title,
    tone: r.tone,
  }));

  const weekOf = new Date();
  const tip = weeklyTip(weekOf);
  const metric = await fetchMetric();

  const html = digestHtml({ cards, tip, weekOf, metric });
  const text = digestText({ cards, tip, weekOf, metric });
  const subject = digestSubject(weekOf);

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

  const { data: subs } = await sb
    .from("newsletter_subscribers")
    .select("email")
    .eq("unsubscribed", false);
  const emails = (subs ?? []).map((s) => s.email);

  if (emails.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_subscribers" });
  }

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

  return NextResponse.json({
    sent,
    failures: errors.length,
    total: emails.length,
    cards: cards.length,
    tip: tip.slug,
  });
}

// Small metric to anchor the digest. Static fallback values so the cron
// never fails if an external API is down — swap in a real market call
// here once you add one (Alpha Vantage, FMP, etc.).
async function fetchMetric(): Promise<
  { value: string; label: string; context: string } | undefined
> {
  const rotations: { value: string; label: string; context: string }[] = [
    {
      value: "+7,8 %",
      label: "Performance CAC 40 sur 12 mois glissants",
      context:
        "Dividendes réinvestis inclus. Contexte : plus-haut historique de 2024 intégré. Un tracker CAC40 à 0,25% de frais (CAC, PAEEM) bat 80% des fonds actifs France sur 10 ans.",
    },
    {
      value: "17,2 %",
      label: "Taux des prélèvements sociaux en PEA",
      context:
        "Après 5 ans, c'est la SEULE fiscalité restante sur les gains. Aucun impôt sur le revenu. Sur 100 000€ de plus-values, tu gardes 82 800€ net. En CTO, tu en garderais 70 000€.",
    },
    {
      value: "152 500 €",
      label: "Abattement AV par bénéficiaire (<70 ans)",
      context:
        "Chaque bénéficiaire désigné reçoit jusqu'à 152 500€ hors droits de succession. Avec 3 enfants : 457 500€ transmissibles sans frais. Condition : versements faits avant tes 70 ans.",
    },
    {
      value: "4 600 €",
      label: "Abattement annuel AV sur les gains après 8 ans",
      context:
        "Dès la 9ème année, tu peux retirer jusqu'à 4 600€ de gains (9 200€ pour un couple) sans aucun IR. Seuls les 17,2% de PS s'appliquent. Levier puissant pour une rente progressive.",
    },
  ];
  const week = Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
  return rotations[week % rotations.length];
}
