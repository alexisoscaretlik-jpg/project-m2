import Link from "next/link";
import { notFound } from "next/navigation";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Analysis = {
  id: number;
  tweet_id: string;
  asset_slug: string;
  asset_name: string;
  asset_class: string;
  tv_symbol: string;
  tv_interval: string;
  direction: "bullish" | "bearish" | "neutral";
  key_quote: string;
  body_md: string;
  key_levels: KeyLevel[] | null;
  model: string;
  tweet_created_at: string;
  generated_at: string;
};

type KeyLevel = {
  label: string;
  value: string;
  type: "support" | "resistance" | "target" | "trend";
};

type Tweet = {
  id: string;
  text: string;
  created_at: string;
  url: string;
  author_handle: string;
  media_urls: string[] | null;
};

const TYPE_COLOR: Record<KeyLevel["type"], string> = {
  support: "var(--forest-600)",
  resistance: "var(--terracotta-500)",
  target: "var(--forest-700)",
  trend: "var(--ink-500)",
};

const TYPE_LABEL: Record<KeyLevel["type"], string> = {
  support: "Support",
  resistance: "Résistance",
  target: "Objectif",
  trend: "Tendance",
};

const DIRECTION_COLOR: Record<string, string> = {
  bullish: "var(--forest-600)",
  bearish: "var(--terracotta-500)",
  neutral: "var(--ink-400)",
};

const DIRECTION_LABEL: Record<string, string> = {
  bullish: "haussier",
  bearish: "baissier",
  neutral: "neutre",
};

const CLASS_LABEL: Record<string, string> = {
  indice: "Indice",
  action: "Action",
  devise: "Devise",
  matiere: "Matière première",
  crypto: "Crypto",
  etf: "ETF",
  obligation: "Obligation",
  fund: "Fonds",
  autre: "Autre",
};

function formatFrenchDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type ParsedBody = {
  takeaways: string[];
  why: string;
  glossary: { term: string; definition: string }[];
};

/**
 * Parse the structured body_md (## Ce qu'il faut retenir / ## Pourquoi ça compte
 * / ## Glossaire) into separate sections so the page can render each one with
 * its own treatment. Falls back gracefully if the model returned legacy prose
 * — the whole body becomes the "why" block, with empty bullets and glossary.
 */
function parseBody(md: string): ParsedBody {
  const takeaways: string[] = [];
  let why = "";
  const glossary: { term: string; definition: string }[] = [];

  const sections = md.split(/^##\s+/m).map((s) => s.trim()).filter(Boolean);
  if (sections.length === 0) return { takeaways: [], why: md, glossary: [] };

  for (const section of sections) {
    const firstNl = section.indexOf("\n");
    const heading = (firstNl >= 0 ? section.slice(0, firstNl) : section)
      .trim()
      .toLowerCase();
    const rest = firstNl >= 0 ? section.slice(firstNl + 1).trim() : "";

    if (heading.includes("retenir")) {
      for (const line of rest.split("\n")) {
        const m = line.trim().match(/^[-*]\s+(.+)$/);
        if (m) takeaways.push(m[1].trim());
      }
    } else if (heading.includes("compte") || heading.includes("matter")) {
      why = rest;
    } else if (heading.includes("glossaire") || heading.includes("glossary")) {
      for (const line of rest.split("\n")) {
        const m = line.trim().match(/^[-*]\s+\*\*(.+?)\*\*\s*:\s*(.+)$/);
        if (m) glossary.push({ term: m[1].trim(), definition: m[2].trim() });
      }
    }
  }

  // Legacy fallback — if no recognised sections, dump everything into "why"
  if (takeaways.length === 0 && why === "" && glossary.length === 0) {
    return { takeaways: [], why: md, glossary: [] };
  }

  return { takeaways, why, glossary };
}

function renderInline(s: string) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

export default async function ChartDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const slug = decodeURIComponent(symbol).toLowerCase();

  const { data: analysisRow } = await supabase
    .from("chart_analysis")
    .select(
      "id, tweet_id, asset_slug, asset_name, asset_class, tv_symbol, tv_interval, direction, key_quote, body_md, key_levels, model, tweet_created_at, generated_at",
    )
    .eq("asset_slug", slug)
    .order("tweet_created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Analysis>();

  if (!analysisRow) notFound();
  const a = analysisRow;

  const { data: tweetRow } = await supabase
    .from("tweets")
    .select("id, text, created_at, url, author_handle, media_urls")
    .eq("id", a.tweet_id)
    .maybeSingle<Tweet>();

  const heroImage =
    Array.isArray(tweetRow?.media_urls) && tweetRow!.media_urls!.length > 0
      ? tweetRow!.media_urls![0]
      : null;

  const parsed = parseBody(a.body_md);

  const { data: historyRows } = await supabase
    .from("chart_analysis")
    .select("id, tweet_id, asset_slug, key_quote, tweet_created_at, direction")
    .eq("asset_slug", slug)
    .order("tweet_created_at", { ascending: false })
    .limit(6);
  const history = (historyRows ?? []).filter((r) => r.tweet_id !== a.tweet_id);

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/charts" />

      <article className="mx-auto max-w-[760px] px-6 py-12">
        <Link
          href="/charts"
          className="inline-block text-[13px] font-medium"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--forest-600)",
          }}
        >
          ← Toutes les vues techniques
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="cap-eyebrow">
              {CLASS_LABEL[a.asset_class] ?? a.asset_class}
            </span>
            <span
              className="text-[11px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--fg-subtle)",
              }}
            >
              · {formatFrenchDate(a.tweet_created_at)}
            </span>
            <span
              className="cap-pill"
              style={{
                borderColor: DIRECTION_COLOR[a.direction],
                color: DIRECTION_COLOR[a.direction],
              }}
            >
              {DIRECTION_LABEL[a.direction]}
            </span>
          </div>
          <h1 className="cap-h1 mt-3 text-[40px] leading-[1.1]">
            {a.asset_name}
          </h1>
          <p
            className="mt-2 text-[12px]"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--fg-subtle)",
              letterSpacing: "0.04em",
            }}
          >
            {a.tv_symbol}
          </p>
        </header>

        {heroImage ? (
          <figure className="mt-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt={`Graphique annoté de ${a.asset_name} par @${tweetRow?.author_handle ?? "great_martis"}`}
              className="w-full rounded-lg"
              style={{
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
              }}
            />
            <figcaption
              className="mt-2 text-[12px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--fg-subtle)",
                letterSpacing: "0.02em",
              }}
            >
              Graphique annoté par @{tweetRow?.author_handle ?? "great_martis"}{" "}
              · {formatFrenchDate(a.tweet_created_at)}
            </figcaption>
          </figure>
        ) : null}

        {a.key_quote ? (
          <blockquote
            className="mt-10 mb-2"
            style={{
              borderLeft: "3px solid var(--terracotta-500)",
              paddingLeft: "24px",
              paddingTop: "6px",
              paddingBottom: "6px",
            }}
          >
            <p
              className="m-0 italic"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "30px",
                lineHeight: 1.25,
                color: "var(--fg)",
                textWrap: "balance",
              }}
            >
              « {a.key_quote} »
            </p>
          </blockquote>
        ) : null}

        {parsed.takeaways.length > 0 ? (
          <section className="mt-10">
            <div className="cap-eyebrow">Ce qu&apos;il faut retenir</div>
            <ul
              className="mt-4 space-y-3"
              style={{ listStyle: "none", padding: 0 }}
            >
              {parsed.takeaways.map((t, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-[18px]"
                  style={{
                    fontFamily: "var(--font-serif)",
                    lineHeight: 1.55,
                    color: "var(--fg)",
                  }}
                >
                  <span
                    className="shrink-0"
                    style={{
                      width: "20px",
                      paddingTop: "2px",
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      color: "var(--terracotta-500)",
                      fontSize: "13px",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: renderInline(t) }} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {parsed.why ? (
          <section className="mt-10">
            <div className="cap-eyebrow">Pourquoi ça compte</div>
            <p
              className="mt-4 text-[19px]"
              style={{
                fontFamily: "var(--font-serif)",
                lineHeight: 1.65,
                color: "var(--fg)",
                textWrap: "pretty",
              }}
              dangerouslySetInnerHTML={{ __html: renderInline(parsed.why) }}
            />
          </section>
        ) : null}

        {Array.isArray(a.key_levels) && a.key_levels.length > 0 ? (
          <section className="mt-10">
            <div className="cap-eyebrow">Niveaux clés</div>
            <ul
              className="mt-4 grid gap-3 sm:grid-cols-2"
              style={{ listStyle: "none", padding: 0 }}
            >
              {a.key_levels.map((lvl, i) => (
                <li
                  key={`${lvl.label}-${i}`}
                  className="rounded-lg p-4"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    className="text-[11px] uppercase"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      color: TYPE_COLOR[lvl.type] ?? "var(--fg-muted)",
                    }}
                  >
                    {TYPE_LABEL[lvl.type] ?? "Niveau"} · {lvl.label}
                  </div>
                  <div
                    className="cap-num mt-1 text-[22px] font-semibold"
                    style={{ color: "var(--ink-700)" }}
                  >
                    {lvl.value}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {parsed.glossary.length > 0 ? (
          <section
            className="mt-10 rounded-lg p-6"
            style={{
              background: "var(--paper-100)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="cap-eyebrow">Glossaire</div>
            <dl className="mt-4 space-y-3">
              {parsed.glossary.map((g, i) => (
                <div key={i}>
                  <dt
                    className="text-[15px]"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      color: "var(--ink-700)",
                    }}
                  >
                    {g.term}
                  </dt>
                  <dd
                    className="mt-0.5 text-[15px]"
                    style={{
                      fontFamily: "var(--font-serif)",
                      color: "var(--fg-muted)",
                      lineHeight: 1.5,
                      marginLeft: 0,
                    }}
                  >
                    {g.definition}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <section className="mt-12">
          <a
            href={
              tweetRow?.url ??
              `https://x.com/${tweetRow?.author_handle ?? "great_martis"}`
            }
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-[14px] font-medium"
            style={{
              fontFamily: "var(--font-display)",
              background: "var(--forest-600)",
              color: "var(--paper-50)",
            }}
          >
            Aller à la source · @
            {tweetRow?.author_handle ?? "great_martis"} →
          </a>
        </section>

        {history.length > 0 ? (
          <section className="mt-14">
            <div className="cap-eyebrow">
              Historique sur {a.asset_name}
            </div>
            <ul
              className="mt-4 space-y-2"
              style={{ listStyle: "none", padding: 0 }}
            >
              {history.map((h) => (
                <li key={h.id}>
                  <div
                    className="flex items-baseline justify-between gap-3 rounded-md p-3 text-[13px]"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-serif)",
                        color: "var(--fg)",
                        fontStyle: "italic",
                      }}
                    >
                      « {h.key_quote.slice(0, 120)} »
                    </span>
                    <span
                      className="shrink-0"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "var(--fg-subtle)",
                      }}
                    >
                      {formatFrenchDate(h.tweet_created_at)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p
          className="mt-12 text-[12px] italic"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--fg-subtle)",
          }}
        >
          Lecture éducative. Pas un conseil en investissement personnalisé.
          Le graphique annoté ci-dessus appartient à @
          {tweetRow?.author_handle ?? "great_martis"} et reste accessible sur X.
          Synthèse générée le {formatFrenchDate(a.generated_at)} avec {a.model}.
        </p>
      </article>

      <Footer />
    </main>
  );
}
