import Link from "next/link";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { supabase } from "@/lib/supabase";

export const metadata = {
  title: "Vue technique — Invest Coach",
  description:
    "Lecture des graphiques par classe d'actif, chaque jour, en français. Synthétisée à partir de l'analyse publique de @great_martis.",
};

type AnalysisRow = {
  id: number;
  tweet_id: string;
  asset_slug: string;
  asset_name: string;
  asset_class: string;
  tv_symbol: string;
  direction: "bullish" | "bearish" | "neutral";
  key_quote: string;
  tweet_created_at: string;
  generated_at: string;
};

const CATEGORIES: {
  slug: string;
  label: string;
  blurb: string;
}[] = [
  { slug: "indice", label: "Indices", blurb: "S&P, Nasdaq, CAC, SOX et compagnie" },
  { slug: "action", label: "Actions", blurb: "Sociétés cotées, l'unité par l'unité" },
  { slug: "devise", label: "Devises", blurb: "EUR, USD, JPY — la guerre des monnaies" },
  { slug: "matiere", label: "Matières premières", blurb: "Or, pétrole, cuivre, argent" },
  { slug: "crypto", label: "Crypto", blurb: "Bitcoin, Ethereum et alts notoires" },
  { slug: "etf", label: "ETF", blurb: "Trackers, fonds indiciels cotés" },
  { slug: "obligation", label: "Obligations", blurb: "Taux souverains, courbe, spreads" },
  { slug: "fund", label: "Fonds", blurb: "Fonds gérés à suivre" },
  { slug: "autre", label: "Autres", blurb: "Tout ce qui ne rentre pas ailleurs" },
];

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

function formatFrenchDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function trim(text: string, max = 180): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export default async function ChartsIndexPage() {
  // Latest analysis per asset_slug.
  const { data: analyses } = await supabase
    .from("chart_analysis")
    .select(
      "id, tweet_id, asset_slug, asset_name, asset_class, tv_symbol, direction, key_quote, tweet_created_at, generated_at",
    )
    .order("tweet_created_at", { ascending: false })
    .limit(500);

  const all = (analyses ?? []) as AnalysisRow[];

  // Dedup: latest per asset_slug.
  const latestBySlug = new Map<string, AnalysisRow>();
  for (const a of all) {
    if (!latestBySlug.has(a.asset_slug)) latestBySlug.set(a.asset_slug, a);
  }
  const latest = Array.from(latestBySlug.values());

  // Group by category.
  const byCategory = new Map<string, AnalysisRow[]>();
  for (const a of latest) {
    const list = byCategory.get(a.asset_class) ?? [];
    list.push(a);
    byCategory.set(a.asset_class, list);
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/charts" />

      <div className="mx-auto max-w-[820px] px-6 py-12">
        <div className="mb-12">
          <div className="cap-eyebrow">Vue technique · revue continue</div>
          <h1 className="cap-h1 mt-3">Lecture des graphiques</h1>
          <p className="cap-lede mt-4 max-w-[640px]">
            On lit chaque jour l&apos;analyse publique de{" "}
            <a
              href="https://x.com/great_martis"
              target="_blank"
              rel="noreferrer noopener"
              style={{
                color: "var(--terracotta-500)",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              @great_martis
            </a>
            , on relie chaque graphique à son symbole TradingView, et on
            résume en trois paragraphes — sa voix préservée. Pas de conseil,
            pas d&apos;urgence. Une lecture du marché à la façon du journal
            du dimanche.
          </p>
          <p
            className="mt-3 text-[12px]"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--fg-subtle)",
              letterSpacing: "0.04em",
            }}
          >
            {latest.length} analyses · {byCategory.size} classes d&apos;actif
          </p>
        </div>

        {latest.length === 0 ? (
          <p
            className="text-center"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--fg-muted)",
              fontStyle: "italic",
            }}
          >
            Le pipeline n&apos;a encore rien publié. Reviens dans quelques
            minutes.
          </p>
        ) : (
          <div className="space-y-14">
            {CATEGORIES.map((cat) => {
              const items = byCategory.get(cat.slug) ?? [];
              if (items.length === 0) return null;
              return (
                <section key={cat.slug}>
                  <header className="mb-5">
                    <div className="cap-eyebrow">{cat.label}</div>
                    <p
                      className="mt-1 text-[14px]"
                      style={{
                        fontFamily: "var(--font-serif)",
                        color: "var(--fg-muted)",
                        fontStyle: "italic",
                      }}
                    >
                      {cat.blurb} · {items.length}
                    </p>
                  </header>
                  <ul className="space-y-3">
                    {items.map((a) => (
                      <li key={a.id}>
                        <Link
                          href={`/charts/${encodeURIComponent(a.asset_slug)}`}
                          className="block"
                        >
                          <article className="cap-card">
                            <div className="flex items-baseline justify-between gap-3">
                              <div className="flex items-baseline gap-3">
                                <span
                                  className="cap-num text-[12px] font-semibold"
                                  style={{ color: "var(--ink-700)" }}
                                >
                                  {a.tv_symbol}
                                </span>
                                <h3
                                  className="text-[18px] font-semibold leading-snug"
                                  style={{
                                    fontFamily: "var(--font-display)",
                                    letterSpacing: "-0.01em",
                                    color: "var(--fg)",
                                  }}
                                >
                                  {a.asset_name}
                                </h3>
                              </div>
                              <span
                                className="shrink-0 cap-pill"
                                style={{
                                  borderColor: DIRECTION_COLOR[a.direction],
                                  color: DIRECTION_COLOR[a.direction],
                                }}
                              >
                                {DIRECTION_LABEL[a.direction]}
                              </span>
                            </div>
                            <p
                              className="mt-3 text-[16px] italic"
                              style={{
                                fontFamily: "var(--font-serif)",
                                lineHeight: 1.5,
                                color: "var(--fg)",
                              }}
                            >
                              « {trim(a.key_quote, 180)} »
                            </p>
                            <p
                              className="mt-3 text-[12px]"
                              style={{
                                fontFamily: "var(--font-mono)",
                                color: "var(--fg-subtle)",
                              }}
                            >
                              {formatFrenchDate(a.tweet_created_at)}
                            </p>
                          </article>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        <p
          className="mt-16 text-[12px] italic"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--fg-subtle)",
          }}
        >
          Lecture éducative. Pas un conseil en investissement personnalisé.
          L&apos;analyse originale appartient à @great_martis et reste
          accessible sur X.
        </p>
      </div>

      <Footer />
    </main>
  );
}
