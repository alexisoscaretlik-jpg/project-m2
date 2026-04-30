import Link from "next/link";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { supabase } from "@/lib/supabase";

export const metadata = {
  title: "Vue technique — Invest Coach",
  description:
    "Lecture des graphiques par classe d'actif, chaque jour, en français. Synthétisée à partir de l'analyse publique de @great_martis.",
};

// Orange modern metro tunnel — slug UaylYFMAhWk, CDN photo-1764831685497-…
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1764831685497-3095f33bada2?auto=format&fit=crop&w=1600&q=85";

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

function formatDateMono(iso: string): string {
  const d = new Date(iso);
  const months = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUI", "JUL", "AOÛ", "SEP", "OCT", "NOV", "DÉC"];
  return `${months[d.getMonth()]} ${d.getDate()} · ${d.getFullYear()}`;
}

function trim(text: string, max = 180): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

async function fetchLatestAnalyses(): Promise<AnalysisRow[]> {
  try {
    const { data: analyses } = await supabase
      .from("chart_analysis")
      .select(
        "id, tweet_id, asset_slug, asset_name, asset_class, tv_symbol, direction, key_quote, tweet_created_at, generated_at",
      )
      .order("tweet_created_at", { ascending: false })
      .limit(500);
    return (analyses ?? []) as AnalysisRow[];
  } catch {
    return [];
  }
}

export default async function ChartsIndexPage() {
  const all = await fetchLatestAnalyses();

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

      {/* Row 1 — cream pastel hero with mega wordmark stack. */}
      <section
        className="ic-block-cream px-6 pt-12 pb-8 sm:px-8 sm:pt-16 sm:pb-12"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
        aria-labelledby="charts-mark"
      >
        <span className="ic-eyebrow-mono">Vue technique</span>
        <h1 id="charts-mark" className="mt-5">
          <span className="ic-mega" style={{ fontSize: "clamp(56px, 13vw, 200px)" }}>
            LIRE
          </span>
          <span className="ic-mega" style={{ fontSize: "clamp(56px, 13vw, 200px)" }}>
            LE MARCHÉ
          </span>
        </h1>
      </section>

      {/* Row 2 — mono tagline strip. */}
      <p className="ic-strip">
        Lecture quotidienne par @great_martis · Indices · Crypto · Matières · Obligations
      </p>

      {/* Row 3 — lilac × orange-tunnel split. */}
      <div
        className="grid md:grid-cols-2"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        <div
          className="ic-block-lilac flex min-h-[420px] flex-col justify-between px-6 py-12 sm:px-10 sm:py-16 md:min-h-[520px]"
          style={{ borderRight: "1px solid var(--ink-700)" }}
        >
          <div>
            <span className="ic-eyebrow-mono mb-6 inline-flex">La méthode</span>
            <h2 className="ic-bigsection mb-6" style={{ fontSize: "clamp(34px, 5vw, 72px)" }}>
              Sa voix.<br />Tes décisions.<br />Pas de bruit.
            </h2>
            <p
              className="max-w-[440px] text-[16px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--ink-700)",
                lineHeight: 1.55,
              }}
            >
              On lit chaque jour l&apos;analyse publique de{" "}
              <a
                href="https://x.com/great_martis"
                target="_blank"
                rel="noreferrer noopener"
                style={{
                  color: "var(--ink-700)",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  fontWeight: 600,
                }}
              >
                @great_martis
              </a>
              . On la relie à son symbole TradingView et on résume sa lecture
              en trois paragraphes — sa voix préservée, son cap intact. Pas
              d&apos;urgence, pas de buzz.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <p
              className="text-[11px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--ink-700)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {latest.length} analyses · {byCategory.size} classes
            </p>
            <p
              className="text-[11px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--ink-700)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              · Lecture éducative
            </p>
          </div>
        </div>

        <div className="relative min-h-[260px] md:min-h-[520px]" style={{ background: "var(--ink-700)" }}>
          <img
            src={HERO_PHOTO}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ display: "block" }}
          />
        </div>
      </div>

      {/* Row 4 — analysis grid by category. */}
      <section className="px-6 py-16 sm:px-8" style={{ borderBottom: "1px solid var(--ink-700)" }}>
        <div className="mx-auto" style={{ maxWidth: "1280px" }}>
          {latest.length === 0 ? (
            <div
              className="ic-block-cream"
              style={{
                border: "1px solid var(--ink-700)",
                padding: "32px 28px",
              }}
            >
              <span className="ic-eyebrow-mono">Pipeline en attente</span>
              <p
                className="mt-3 text-[16px]"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--ink-700)",
                  lineHeight: 1.5,
                  maxWidth: "520px",
                }}
              >
                Pas encore d&apos;analyse publiée. Le pipeline lit les tweets
                de @great_martis quotidiennement — reviens dans quelques
                heures.
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {CATEGORIES.map((cat) => {
                const items = byCategory.get(cat.slug) ?? [];
                if (items.length === 0) return null;
                return (
                  <section key={cat.slug}>
                    <header className="mb-6 flex items-baseline justify-between gap-4">
                      <span className="ic-eyebrow-mono">{cat.label}</span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--fg-muted)",
                        }}
                      >
                        {items.length} {items.length > 1 ? "actifs" : "actif"}
                      </span>
                    </header>
                    <ul className="grid gap-0 md:grid-cols-2 lg:grid-cols-3" style={{ border: "1px solid var(--ink-700)" }}>
                      {items.map((a, idx) => {
                        const col = idx % 3;
                        const isLastRow =
                          idx >= items.length - (items.length % 3 || 3);
                        return (
                          <li
                            key={a.id}
                            style={{
                              borderRight: col < 2 ? "1px solid var(--ink-700)" : "none",
                              borderBottom: !isLastRow ? "1px solid var(--ink-700)" : "none",
                            }}
                            className="md:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(2n)]:border-[var(--ink-700)] lg:[&:nth-child(3n)]:border-r-0"
                          >
                            <Link
                              href={`/charts/${encodeURIComponent(a.asset_slug)}`}
                              className="block h-full transition-colors hover:bg-[var(--paper-100)]"
                            >
                              <article className="flex h-full flex-col gap-4 p-6">
                                <div className="flex items-baseline justify-between gap-3">
                                  <span
                                    style={{
                                      fontFamily: "var(--font-mono)",
                                      fontSize: "13px",
                                      fontWeight: 700,
                                      letterSpacing: "0.04em",
                                      color: "var(--ink-700)",
                                    }}
                                  >
                                    {a.tv_symbol}
                                  </span>
                                  <span
                                    style={{
                                      fontFamily: "var(--font-mono)",
                                      fontSize: "10px",
                                      fontWeight: 700,
                                      letterSpacing: "0.12em",
                                      textTransform: "uppercase",
                                      padding: "4px 10px",
                                      border: `1px solid ${DIRECTION_COLOR[a.direction]}`,
                                      color: DIRECTION_COLOR[a.direction],
                                    }}
                                  >
                                    {DIRECTION_LABEL[a.direction]}
                                  </span>
                                </div>
                                <h3
                                  style={{
                                    fontFamily: "var(--font-display)",
                                    fontSize: "20px",
                                    fontWeight: 700,
                                    letterSpacing: "-0.02em",
                                    lineHeight: 1.2,
                                    color: "var(--ink-700)",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {a.asset_name}
                                </h3>
                                <p
                                  className="flex-1"
                                  style={{
                                    fontFamily: "var(--font-source-serif), Georgia, serif",
                                    fontSize: "15px",
                                    fontStyle: "italic",
                                    lineHeight: 1.5,
                                    color: "var(--ink-700)",
                                  }}
                                >
                                  « {trim(a.key_quote, 160)} »
                                </p>
                                <p
                                  style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "10px",
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    color: "var(--fg-muted)",
                                  }}
                                >
                                  {formatDateMono(a.tweet_created_at)}
                                </p>
                              </article>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Row 5 — disclaimer strip. */}
      <p className="ic-strip" style={{ background: "var(--paper-100)" }}>
        Pas un conseil en investissement personnalisé · Lecture éducative · L&apos;analyse originale appartient à @great_martis
      </p>

      <Footer />
    </main>
  );
}
