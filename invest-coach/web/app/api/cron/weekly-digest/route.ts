import { NextRequest, NextResponse } from "next/server";

import { emailConfigured, send } from "@/lib/email";
import { serviceClient } from "@/lib/supabase/service";
import {
  DigestCard,
  DigestKevinBrief,
  DigestTweet,
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

type TweetRow = {
  id: string;
  author_handle: string;
  author_name: string | null;
  text: string;
  url: string;
  created_at: string;
  metrics: {
    like_count?: number;
    retweet_count?: number;
    reply_count?: number;
    quote_count?: number;
  } | null;
};

const MAX_TWEETS_IN_DIGEST = 3;

function totalEngagement(m: TweetRow["metrics"]): number {
  if (!m) return 0;
  return (
    (m.like_count ?? 0) +
    (m.retweet_count ?? 0) +
    (m.reply_count ?? 0) +
    (m.quote_count ?? 0)
  );
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

  // Top-engagement tweets from the past 7 days (the fetch-tweets cron has
  // already upserted them into the table). Gracefully empty if the table
  // doesn't exist yet or no tweets have been fetched — the digest still ships
  // without the X section.
  let tweets: DigestTweet[] = [];
  try {
    const { data: tweetRows } = await sb
      .from("tweets")
      .select("id, author_handle, author_name, text, url, created_at, metrics")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(30);
    const rowsTyped = (tweetRows ?? []) as unknown as TweetRow[];
    tweets = rowsTyped
      .map((r) => ({
        handle: r.author_handle,
        name: r.author_name ?? r.author_handle,
        text: r.text,
        url: r.url,
        createdAt: new Date(r.created_at),
        engagement: totalEngagement(r.metrics),
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, MAX_TWEETS_IN_DIGEST);
  } catch {
    // Table missing or other non-fatal read error — ship without the section.
  }

  // Meet Kevin livestream briefings from the past 7 days.
  // Pulled from private_notes where source starts with 'meet-kevin-youtube-'.
  // Each row's `polished` column is already Claude's French distillation.
  let kevinBriefs: DigestKevinBrief[] = [];
  try {
    const { data: kevinRows } = await sb
      .from("private_notes")
      .select("id, source, polished, created_at")
      .like("source", "meet-kevin-youtube-%")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10);
    kevinBriefs = (kevinRows ?? []).map((r) => {
      // source format: meet-kevin-youtube-YYYY-MM-DD-<videoId>
      const parts = String(r.source).split("-");
      const videoId = parts.slice(-1)[0] ?? "";
      // First `# ...` heading in the polished body = the video title Claude emitted.
      const titleMatch = String(r.polished).match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : `Session ${videoId}`;
      return {
        title,
        videoId,
        date: new Date(String(r.created_at)),
        polished: String(r.polished),
      };
    });
  } catch {
    // private_notes may not exist in some environments — ship without the section.
  }

  const html = digestHtml({ cards, tip, weekOf, metric, tweets, kevinBriefs });
  const text = digestText({ cards, tip, weekOf, metric, tweets, kevinBriefs });
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
