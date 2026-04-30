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

// Pastel background per level type — palette C only (rose / lilac /
// peach / paper). No green / red. Border + text stay ink.
const TYPE_BG: Record<KeyLevel["type"], string> = {
  support: "var(--lavender-200)",      // lilac — "le sol"
  resistance: "var(--rose-100)",       // rose — "le plafond"
  target: "var(--terracotta-100)",     // peach — "la cible"
  trend: "var(--paper-100)",           // off-white — "la direction"
};

const TYPE_LABEL: Record<KeyLevel["type"], string> = {
  support: "Support",
  resistance: "Résistance",
  target: "Objectif",
  trend: "Tendance",
};

// One-sentence plain-French explainer per level type. Shown directly
// under the level value so a reader who's never seen a chart still
// understands what the number means.
const TYPE_EXPLAINER: Record<KeyLevel["type"], string> = {
  support:
    "Prix « plancher » — niveau où le marché a tendance à rebondir vers le haut.",
  resistance:
    "Prix « plafond » — niveau où le marché a tendance à buter et redescendre.",
  target:
    "Prix « cible » — objectif que vise le mouvement en cours s'il continue.",
  trend:
    "Direction de fond — la pente générale du graphique sur la période.",
};

// Static glossary of universal technical-analysis concepts, in plain
// French — always shown at the bottom of every chart detail page so a
// first-time reader can decode the AI synthesis above. Independent of
// what the model wrote in `body_md ## Glossaire`.
const STATIC_GLOSSARY: { term: string; definition: string }[] = [
  {
    term: "Support",
    definition:
      "Prix « plancher » — quand le cours descend dessus, il a tendance à rebondir. Un support cassé devient souvent une nouvelle résistance.",
  },
  {
    term: "Résistance",
    definition:
      "Prix « plafond » — quand le cours monte dessus, il a tendance à buter. Une résistance franchie devient souvent un nouveau support.",
  },
  {
    term: "Tendance",
    definition:
      "Direction générale du marché. Haussière (sommets et creux qui montent), baissière (qui descendent) ou neutre (latérale).",
  },
  {
    term: "Cassure (breakout)",
    definition:
      "Le cours franchit un support ou une résistance. Souvent suivi d'un mouvement plus marqué dans la direction de la cassure.",
  },
  {
    term: "Retracement",
    definition:
      "Repli temporaire dans une tendance plus longue. Ne change pas le cap, juste un souffle.",
  },
  {
    term: "Volume",
    definition:
      "Quantité d'actifs échangés. Un mouvement avec gros volume est plus crédible qu'un mouvement à volume faible.",
  },
  {
    term: "Volatilité",
    definition:
      "Amplitude des variations. Forte volatilité = grands écarts, faible volatilité = mouvement calme.",
  },
  {
    term: "Moyenne mobile (MA)",
    definition:
      "Moyenne des prix sur N jours, recalculée chaque jour. Lisse le bruit pour faire ressortir la tendance.",
  },
  {
    term: "RSI (Relative Strength Index)",
    definition:
      "Indicateur entre 0 et 100. Au-dessus de 70 → marché « suracheté », en-dessous de 30 → « survendu ». À lire avec la tendance, pas en isolation.",
  },
  {
    term: "Bougies (candlesticks)",
    definition:
      "Chaque bougie résume une période (jour, heure…) : ouverture, clôture, plus haut, plus bas. Verte = clôture au-dessus de l'ouverture, rouge = au-dessous.",
  },
  {
    term: "Haussier / baissier",
    definition:
      "Vocabulaire de direction : haussier (bull) = on s'attend à monter, baissier (bear) = on s'attend à descendre, neutre = pas d'opinion forte.",
  },
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
          <section className="mt-12">
            <span className="ic-eyebrow-mono">Niveaux clés</span>
            <p
              className="mt-3 text-[14px]"
              style={{
                fontFamily: "var(--font-source-serif), Georgia, serif",
                fontStyle: "italic",
                color: "var(--ink-700)",
                opacity: 0.85,
                lineHeight: 1.55,
              }}
            >
              « Les chiffres ci-dessous sont des prix repères. Ils ne disent
              pas où aller — ils disent où regarder. »
            </p>
            <ul
              className="mt-6 grid sm:grid-cols-2"
              style={{
                listStyle: "none",
                padding: 0,
                border: "1px solid var(--ink-700)",
              }}
            >
              {a.key_levels.map((lvl, i) => {
                const col = i % 2;
                const totalRows = Math.ceil(a.key_levels.length / 2);
                const row = Math.floor(i / 2);
                const isLastRow = row === totalRows - 1;
                return (
                  <li
                    key={`${lvl.label}-${i}`}
                    style={{
                      borderRight:
                        col === 0 ? "1px solid var(--ink-700)" : "none",
                      borderBottom: !isLastRow ? "1px solid var(--ink-700)" : "none",
                    }}
                  >
                    <div className="flex h-full flex-col">
                      <div
                        className="px-5 py-4"
                        style={{
                          background: TYPE_BG[lvl.type] ?? "var(--paper-100)",
                          borderBottom: "1px solid var(--ink-700)",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: "var(--ink-700)",
                          }}
                        >
                          ↳ {TYPE_LABEL[lvl.type] ?? "Niveau"}
                        </div>
                        <div
                          className="mt-1.5"
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "13px",
                            color: "var(--ink-700)",
                            opacity: 0.75,
                          }}
                        >
                          {lvl.label}
                        </div>
                      </div>
                      <div className="flex-1 px-5 py-5">
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontFeatureSettings: '"tnum" 1',
                            fontSize: "32px",
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                            lineHeight: 1,
                            color: "var(--ink-700)",
                          }}
                        >
                          {lvl.value}
                        </div>
                        <p
                          className="mt-3 text-[13px]"
                          style={{
                            fontFamily: "var(--font-source-serif), Georgia, serif",
                            fontStyle: "italic",
                            color: "var(--ink-700)",
                            lineHeight: 1.5,
                            opacity: 0.8,
                          }}
                        >
                          « {TYPE_EXPLAINER[lvl.type]} »
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {/* AI-synthesised glossary specific to this analysis. */}
        {parsed.glossary.length > 0 ? (
          <section
            className="ic-block-lilac mt-12 px-6 py-8 sm:px-8"
            style={{ border: "1px solid var(--ink-700)" }}
          >
            <span className="ic-eyebrow-mono">Vocabulaire de l&apos;analyse</span>
            <p
              className="mt-3 text-[13px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--ink-700)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                opacity: 0.7,
              }}
            >
              Termes utilisés dans la lecture de cette journée
            </p>
            <dl className="mt-6 space-y-5">
              {parsed.glossary.map((g, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-1 md:grid-cols-[180px_1fr] md:gap-6"
                  style={{
                    borderTop: i === 0 ? "1px solid var(--ink-700)" : "none",
                    borderBottom: "1px solid var(--ink-700)",
                    padding: "16px 0",
                  }}
                >
                  <dt
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--ink-700)",
                    }}
                  >
                    ↳ {g.term}
                  </dt>
                  <dd
                    style={{
                      fontFamily: "var(--font-source-serif), Georgia, serif",
                      fontStyle: "italic",
                      fontSize: "15px",
                      color: "var(--ink-700)",
                      lineHeight: 1.55,
                      marginLeft: 0,
                    }}
                  >
                    « {g.definition} »
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {/* Static "key concepts" glossary — universal terms anyone reading
            a chart should recognise. Always shown, regardless of what the
            AI synthesis covered. Plain French, no jargon dump. */}
        <section
          className="ic-block-rose mt-10 px-6 py-10 sm:px-8 sm:py-14"
          style={{ border: "1px solid var(--ink-700)" }}
        >
          <span className="ic-eyebrow-mono">Termes clés à connaître</span>
          <h3
            className="mt-3 mb-2"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 3vw, 32px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: "var(--ink-700)",
              textTransform: "uppercase",
            }}
          >
            Lire un graphique sans jargon
          </h3>
          <p
            className="mb-8 max-w-[640px] text-[15px]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--ink-700)",
              lineHeight: 1.55,
              opacity: 0.85,
            }}
          >
            Onze concepts à connaître pour comprendre n&apos;importe quelle
            lecture de marché. Pas une formation, juste le minimum vital pour
            décoder ce qui est écrit au-dessus.
          </p>
          <dl
            style={{
              borderTop: "1px solid var(--ink-700)",
              borderBottom: "1px solid var(--ink-700)",
            }}
          >
            {STATIC_GLOSSARY.map((g, i) => (
              <div
                key={g.term}
                className="grid grid-cols-1 gap-2 py-4 md:grid-cols-[200px_1fr] md:gap-6"
                style={{
                  borderBottom:
                    i < STATIC_GLOSSARY.length - 1
                      ? "1px solid var(--ink-700)"
                      : "none",
                }}
              >
                <dt
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--ink-700)",
                  }}
                >
                  ↳ {g.term}
                </dt>
                <dd
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "15px",
                    color: "var(--ink-700)",
                    lineHeight: 1.55,
                    marginLeft: 0,
                  }}
                >
                  {g.definition}
                </dd>
              </div>
            ))}
          </dl>
          <p
            className="mt-8 text-[13px]"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--ink-700)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            Lecture éducative · Pas de signal d&apos;achat · Confirme avec un expert
          </p>
        </section>

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
