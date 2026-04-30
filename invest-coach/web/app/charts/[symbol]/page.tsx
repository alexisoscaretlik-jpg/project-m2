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

  // Tone → palette C pastel for the direction pill (no green/red).
  const directionBg: Record<string, string> = {
    bullish: "var(--lavender-200)",
    bearish: "var(--rose-100)",
    neutral: "transparent",
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/charts" />

      {/* Row 1 — peach hero with back link, mega title, ticker + date + direction. */}
      <section
        className="ic-block-peach px-6 pt-10 pb-12 sm:px-8 sm:pt-14 sm:pb-16"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        <div className="mx-auto" style={{ maxWidth: "1280px" }}>
          <Link
            href="/charts"
            className="ic-eyebrow-mono"
            style={{ textDecoration: "none" }}
          >
            Retour aux vues techniques
          </Link>
          <div
            aria-hidden="true"
            className="mt-6 mb-8"
            style={{ borderTop: "1px solid var(--ink-700)" }}
          />
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="ic-eyebrow-mono">
              {CLASS_LABEL[a.asset_class] ?? a.asset_class}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-700)",
                opacity: 0.7,
              }}
            >
              · {formatFrenchDate(a.tweet_created_at)}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-700)",
                background: directionBg[a.direction] ?? "transparent",
                border: "1px solid var(--ink-700)",
                padding: "4px 10px",
              }}
            >
              {DIRECTION_LABEL[a.direction]}
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(34px, 6vw, 96px)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 0.96,
              color: "var(--ink-700)",
              textTransform: "uppercase",
              textWrap: "balance",
            }}
          >
            {a.asset_name}
          </h1>
          <p
            className="mt-4"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink-700)",
            }}
          >
            ↳ {a.tv_symbol}
          </p>
        </div>
      </section>

      {/* Row 2 — full-bleed annotated chart image (when available). */}
      {heroImage ? (
        <figure
          className="m-0"
          style={{
            background: "var(--ink-700)",
            borderBottom: "1px solid var(--ink-700)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt={`Graphique annoté de ${a.asset_name} par @${tweetRow?.author_handle ?? "great_martis"}`}
            className="block w-full"
            style={{
              maxHeight: "720px",
              objectFit: "contain",
              background: "var(--paper-0)",
            }}
          />
          <figcaption
            className="px-6 py-3 sm:px-8"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--paper-0)",
              background: "var(--ink-700)",
            }}
          >
            ↳ Graphique annoté par @{tweetRow?.author_handle ?? "great_martis"} · {formatFrenchDate(a.tweet_created_at)}
          </figcaption>
        </figure>
      ) : null}

      {/* Row 3 — lilac pull-quote block (the AI's one-line synthesis). */}
      {a.key_quote ? (
        <section
          className="ic-block-lilac px-6 py-12 sm:px-8 sm:py-16"
          style={{ borderBottom: "1px solid var(--ink-700)" }}
        >
          <div className="mx-auto" style={{ maxWidth: "1080px" }}>
            <span className="ic-eyebrow-mono">La lecture du jour</span>
            <p
              className="mt-6"
              style={{
                fontFamily: "var(--font-source-serif), Georgia, serif",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "clamp(24px, 3.6vw, 44px)",
                lineHeight: 1.2,
                letterSpacing: "-0.015em",
                color: "var(--ink-700)",
                textWrap: "balance",
              }}
            >
              « {a.key_quote} »
            </p>
          </div>
        </section>
      ) : null}

      <article className="mx-auto max-w-[760px] px-6 py-12 sm:px-8 sm:py-16">{/* end of header / start of body */}

        {parsed.takeaways.length > 0 ? (
          <section>
            <span className="ic-eyebrow-mono">Ce qu&apos;il faut retenir</span>
            <ul
              className="mt-6 space-y-4"
              style={{
                listStyle: "none",
                padding: 0,
                borderTop: "1px solid var(--ink-700)",
                borderBottom: "1px solid var(--ink-700)",
              }}
            >
              {parsed.takeaways.map((t, i) => (
                <li
                  key={i}
                  className="flex gap-4 py-4"
                  style={{
                    borderBottom:
                      i < parsed.takeaways.length - 1
                        ? "1px solid var(--ink-700)"
                        : "none",
                  }}
                >
                  <span
                    className="shrink-0"
                    style={{
                      width: "44px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: "var(--ink-700)",
                    }}
                  >
                    ↳ {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "17px",
                      lineHeight: 1.55,
                      color: "var(--ink-700)",
                    }}
                    dangerouslySetInnerHTML={{ __html: renderInline(t) }}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {parsed.why ? (
          <section className="mt-12">
            <span className="ic-eyebrow-mono">Pourquoi ça compte</span>
            <p
              className="mt-5 text-[18px]"
              style={{
                fontFamily: "var(--font-display)",
                lineHeight: 1.65,
                color: "var(--ink-700)",
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
              {(a.key_levels ?? []).map((lvl, i) => {
                const levels = a.key_levels ?? [];
                const col = i % 2;
                const totalRows = Math.ceil(levels.length / 2);
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
            className="ic-btn-block"
          >
            ↳ Aller à la source · @{tweetRow?.author_handle ?? "great_martis"}
          </a>
        </section>

        {history.length > 0 ? (
          <section className="mt-14">
            <span className="ic-eyebrow-mono">
              Historique sur {a.asset_name}
            </span>
            <ul
              className="mt-6"
              style={{
                listStyle: "none",
                padding: 0,
                border: "1px solid var(--ink-700)",
              }}
            >
              {history.map((h, i) => (
                <li
                  key={h.id}
                  style={{
                    borderBottom:
                      i < history.length - 1
                        ? "1px solid var(--ink-700)"
                        : "none",
                  }}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-4">
                    <span
                      style={{
                        fontFamily: "var(--font-source-serif), Georgia, serif",
                        fontStyle: "italic",
                        color: "var(--ink-700)",
                        fontSize: "14px",
                        lineHeight: 1.5,
                        flex: 1,
                      }}
                    >
                      « {h.key_quote.slice(0, 120)} »
                    </span>
                    <span
                      className="shrink-0"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--ink-700)",
                        opacity: 0.7,
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
          className="mt-12 text-[11px]"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--ink-700)",
            opacity: 0.65,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            lineHeight: 1.55,
          }}
        >
          Lecture éducative · Pas un conseil en investissement personnalisé · Graphique annoté par @{tweetRow?.author_handle ?? "great_martis"} · Synthèse {formatFrenchDate(a.generated_at)} · {a.model}
        </p>
      </article>

      <Footer />
    </main>
  );
}
