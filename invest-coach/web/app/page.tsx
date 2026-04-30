import Link from "next/link";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SubscribeForm } from "@/app/newsletter/subscribe-form";
import { CoachingPodcast } from "@/components/coaching-podcast";
import { PodcastEpisodeList } from "@/components/podcast-episode-list";
import { SpotifyEpisodeList } from "@/components/spotify-episode-card";
import { PricingTable } from "@/components/pricing-table";
import { ProductTabsNav } from "@/components/product-tabs-nav";
import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";

type ArticleRow = { slug: string; title: string; published_at: string };
export type PodcastEpisode = {
  id: string;
  title: string;
  summary: string;
  script: { speaker: "Coach" | "Investisseur"; text: string }[];
  youtube_url: string;
  audio_url?: string;
  created_at: string;
};

const QUICK_TOOLS: { href: string; label: string; desc: string }[] = [
  { href: "/simulation", label: "Simulateur", desc: "PEA, CTO, AV — compare tes enveloppes" },
  { href: "/charts", label: "Vue technique", desc: "Lecture des marchés par @great_martis" },
  { href: "/tax", label: "Fiscalité", desc: "IR 2042, plus-values, déclaration guidée" },
  { href: "/bank", label: "Banque", desc: "Analyse tes relevés et frais cachés" },
];

async function fetchEpisodes(): Promise<PodcastEpisode[]> {
  try {
    const sb = serviceClient();
    const { data } = await sb
      .from("private_notes")
      .select("id, source, polished, raw_input, created_at")
      .like("source", "podcast-%")
      .order("created_at", { ascending: false })
      .limit(10);
    return (data ?? []).map((row: { id: number; source: string; polished: string; raw_input: string; created_at: string }) => {
      const parsed = JSON.parse(row.polished);
      return {
        id: String(row.id),
        title: parsed.title ?? "Episode",
        summary: parsed.summary ?? "",
        script: parsed.script ?? [],
        youtube_url: row.raw_input,
        audio_url: parsed.audioUrl ?? undefined,
        created_at: row.created_at,
      };
    });
  } catch {
    return [];
  }
}

export default async function Home() {
  let user = null;
  try {
    const sb = await createClient();
    const res = await sb.auth.getUser();
    user = res.data.user;
  } catch {}

  if (!user) return <Landing />;

  const [episodes, articles] = await Promise.all([
    fetchEpisodes(),
    (async (): Promise<ArticleRow[]> => {
      try {
        const sb = serviceClient();
        const { data } = await sb
          .from("articles")
          .select("slug, title, published_at")
          .order("published_at", { ascending: false })
          .limit(4);
        return (data ?? []) as ArticleRow[];
      } catch { return []; }
    })(),
  ]);

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/" />

      <div className="mx-auto max-w-[720px] px-6 py-10">
        <div className="cap-eyebrow mb-1">Money Coaching</div>
        <h1
          className="mb-8 text-[28px] font-semibold leading-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--fg)", letterSpacing: "-0.015em" }}
        >
          Apprends à faire travailler ton argent.
        </h1>

        {/* Spotify episodes — renders nothing until SPOTIFY_EPISODES has entries */}
        <SpotifyEpisodeList />

        {/* Pre-generated podcast episodes from Supabase */}
        <PodcastEpisodeList episodes={episodes} />

        {/* Quick tools */}
        <section className="mb-10">
          <div className="cap-eyebrow mb-4">Outils</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK_TOOLS.map((t) => (
              <Link key={t.href} href={t.href} className="block">
                <div
                  className="rounded-xl p-4 transition-colors hover:border-[var(--forest-600)]"
                  style={{ background: "var(--paper-100)", border: "1px solid var(--border)" }}
                >
                  <div className="text-[15px] font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}>
                    {t.label}
                  </div>
                  <div className="mt-0.5 text-[13px]" style={{ fontFamily: "var(--font-serif)", color: "var(--fg-muted)" }}>
                    {t.desc}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent articles */}
        {articles.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-baseline justify-between">
              <div className="cap-eyebrow">Guides récents</div>
              <Link href="/articles" className="text-[13px] font-medium" style={{ color: "var(--forest-600)", fontFamily: "var(--font-display)" }}>
                Tous →
              </Link>
            </div>
            <ul className="space-y-2">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link href={`/articles/${a.slug}`} className="block rounded-xl px-4 py-3 transition-colors hover:bg-[var(--paper-100)]" style={{ border: "1px solid var(--border)" }}>
                    <span className="text-[15px]" style={{ fontFamily: "var(--font-serif)", color: "var(--fg)" }}>{a.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Generate from your own URL — collapsed at bottom */}
        <details className="mb-8">
          <summary
            className="cursor-pointer select-none rounded-xl px-4 py-3 text-[14px] font-medium"
            style={{ background: "var(--paper-100)", border: "1px solid var(--border)", fontFamily: "var(--font-display)", color: "var(--fg-muted)" }}
          >
            Générer un épisode depuis une autre vidéo YouTube…
          </summary>
          <div className="mt-3">
            <CoachingPodcast />
          </div>
        </details>
      </div>

      <Footer />
    </main>
  );
}

// ========================================================================
// Landing — Invest Coach
// Light, bold, lavender-accent. Inter Tight throughout. Pill CTAs.
// Sections: Hero (with inline newsletter capture) · Features · Pricing · Footer.
// ========================================================================

function Landing() {
  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/" />
      <HeroSection />
      <HowItWorksSection />
      <ProductPreviewGrid />
      <SavingsEqualsEarningsSection />
      <IntegrationsSection />
      <PhilosophySection />
      <PricingTable />
      <TrustStatsBar />
      <Footer />
    </main>
  );
}

// ─────────────────────── How It Works · 3-step isometric ───────────────────────

const HOW_STEPS: {
  index: string;
  title: string;
  body: string;
  illustration: "scan" | "gears" | "sign";
}[] = [
  {
    index: "01",
    title: "Connecte ton avis d'imposition",
    body: "PDF, photo, ou copie-colle. On lit ton TMI, tes revenus, tes parts. Aucune donnée ne quitte la France.",
    illustration: "scan",
  },
  {
    index: "02",
    title: "On chiffre tes leviers",
    body: "PEA, AV, PER, dons, frais réels. Trois à cinq actions classées par euros gagnés, pas par buzz.",
    illustration: "gears",
  },
  {
    index: "03",
    title: "Tu signes ta déclaration",
    body: "On pré-remplit ton 2042. Tu vérifies, tu signes, tu envoies à impots.gouv. Cinq minutes en mai.",
    illustration: "sign",
  },
];

function HowItWorksSection() {
  return (
    <section
      className="px-6 py-20 sm:px-8 sm:py-24"
      style={{
        background: "var(--paper-0)",
        borderBottom: "1px solid var(--ink-700)",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "1280px" }}>
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="ic-eyebrow-mono">Comment ça marche</span>
            <h2
              className="ic-bigsection mt-5"
              style={{ fontSize: "clamp(34px, 5vw, 72px)" }}
            >
              Trois étapes.<br />Quinze minutes<br />au total.
            </h2>
          </div>
          <p
            className="max-w-[380px] text-[15px]"
            style={{
              fontFamily: "var(--font-source-serif), Georgia, serif",
              fontStyle: "italic",
              color: "var(--ink-700)",
              lineHeight: 1.55,
            }}
          >
            « Pas de rendez-vous, pas de jargon de conseiller, pas de revente
            de ta data. Tu pilotes, on chiffre. »
          </p>
        </div>

        <ol
          className="grid md:grid-cols-3"
          style={{ border: "1px solid var(--ink-700)" }}
        >
          {HOW_STEPS.map((s, idx) => (
            <li
              key={s.index}
              className="flex flex-col"
              style={{
                borderRight:
                  idx < HOW_STEPS.length - 1
                    ? "1px solid var(--ink-700)"
                    : "none",
              }}
            >
              <div
                className="flex h-44 items-center justify-center"
                style={{
                  background:
                    idx === 0
                      ? "var(--rose-100)"
                      : idx === 1
                        ? "var(--lavender-200)"
                        : "var(--terracotta-100)",
                  borderBottom: "1px solid var(--ink-700)",
                }}
              >
                <IsoIllustration kind={s.illustration} />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6 sm:p-8">
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--ink-700)",
                  }}
                >
                  ↳ Étape {s.index}
                </span>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "22px",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "var(--ink-700)",
                    lineHeight: 1.2,
                    textTransform: "uppercase",
                  }}
                >
                  {s.title}
                </h3>
                <p
                  className="text-[14px]"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--ink-700)",
                    lineHeight: 1.55,
                    opacity: 0.78,
                  }}
                >
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function IsoIllustration({ kind }: { kind: "scan" | "gears" | "sign" }) {
  if (kind === "scan") {
    // Isometric document with a scanning beam.
    return (
      <svg width="120" height="100" viewBox="0 0 120 100" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="isoPaperA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--paper-0)" />
            <stop offset="100%" stopColor="var(--lavender-50)" />
          </linearGradient>
        </defs>
        {/* Document — isometric face */}
        <path d="M 30 26 L 75 14 L 100 30 L 55 42 Z" fill="url(#isoPaperA)" stroke="var(--lavender-400)" strokeWidth="1.2" />
        <path d="M 55 42 L 100 30 L 100 78 L 55 90 Z" fill="var(--lavender-100)" stroke="var(--lavender-400)" strokeWidth="1.2" />
        <path d="M 30 26 L 55 42 L 55 90 L 30 74 Z" fill="var(--lavender-200)" stroke="var(--lavender-400)" strokeWidth="1.2" />
        {/* Lines on the front face */}
        <line x1="62" y1="55" x2="92" y2="47" stroke="var(--lavender-500)" strokeWidth="1" />
        <line x1="62" y1="63" x2="86" y2="56" stroke="var(--lavender-400)" strokeWidth="1" opacity="0.8" />
        <line x1="62" y1="71" x2="80" y2="66" stroke="var(--lavender-400)" strokeWidth="1" opacity="0.8" />
        {/* Scan beam */}
        <line x1="20" y1="50" x2="110" y2="50" stroke="var(--terracotta-500)" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.9" />
      </svg>
    );
  }
  if (kind === "gears") {
    // Two interlocked isometric gears + a stack of coins.
    return (
      <svg width="120" height="100" viewBox="0 0 120 100" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="isoCoin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--lavender-200)" />
            <stop offset="100%" stopColor="var(--lavender-400)" />
          </linearGradient>
        </defs>
        {/* Coin stack (isometric) */}
        <g>
          <ellipse cx="38" cy="78" rx="22" ry="8" fill="var(--lavender-300)" />
          <rect x="16" y="62" width="44" height="16" fill="url(#isoCoin)" />
          <ellipse cx="38" cy="62" rx="22" ry="8" fill="var(--lavender-200)" stroke="var(--lavender-500)" strokeWidth="0.8" />
          <ellipse cx="38" cy="58" rx="22" ry="8" fill="var(--lavender-100)" stroke="var(--lavender-500)" strokeWidth="0.8" />
          <ellipse cx="38" cy="54" rx="22" ry="8" fill="var(--paper-0)" stroke="var(--lavender-500)" strokeWidth="0.8" />
          <text x="38" y="58" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fontWeight="700" fill="var(--lavender-700)">€</text>
        </g>
        {/* Big gear */}
        <g transform="translate(86 38)">
          <circle r="20" fill="var(--lavender-100)" stroke="var(--lavender-500)" strokeWidth="1.2" />
          <circle r="6"  fill="var(--paper-0)"     stroke="var(--lavender-500)" strokeWidth="1" />
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <rect
              key={angle}
              x="-3"
              y="-24"
              width="6"
              height="6"
              fill="var(--lavender-400)"
              transform={`rotate(${angle})`}
            />
          ))}
        </g>
        {/* Small gear */}
        <g transform="translate(98 76)">
          <circle r="11" fill="var(--lavender-200)" stroke="var(--lavender-500)" strokeWidth="1" />
          <circle r="3"  fill="var(--paper-0)"     stroke="var(--lavender-500)" strokeWidth="0.8" />
          {[0, 72, 144, 216, 288].map((angle) => (
            <rect
              key={angle}
              x="-2"
              y="-14"
              width="4"
              height="4"
              fill="var(--lavender-500)"
              transform={`rotate(${angle})`}
            />
          ))}
        </g>
      </svg>
    );
  }
  // sign
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="isoSheet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--paper-0)" />
          <stop offset="100%" stopColor="var(--paper-100)" />
        </linearGradient>
      </defs>
      {/* Folder back */}
      <path d="M 24 30 L 70 18 L 100 32 L 54 44 Z" fill="var(--lavender-200)" stroke="var(--lavender-500)" strokeWidth="1" />
      {/* Sheet on top, isometric */}
      <path d="M 30 38 L 76 26 L 96 38 L 50 50 Z"  fill="url(#isoSheet)" stroke="var(--lavender-500)" strokeWidth="1.2" />
      <path d="M 50 50 L 96 38 L 96 80 L 50 92 Z"  fill="var(--paper-0)"  stroke="var(--lavender-500)" strokeWidth="1.2" />
      <path d="M 30 38 L 50 50 L 50 92 L 30 80 Z"  fill="var(--paper-100)" stroke="var(--lavender-500)" strokeWidth="1.2" />
      {/* Form rows */}
      <line x1="56" y1="60" x2="88" y2="51" stroke="var(--lavender-400)" strokeWidth="1" />
      <line x1="56" y1="68" x2="84" y2="60" stroke="var(--lavender-300)" strokeWidth="1" opacity="0.7" />
      {/* Signature swoosh */}
      <path d="M 58 80 Q 68 70 78 78 T 92 76" stroke="var(--terracotta-500)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Check mark */}
      <g transform="translate(94 22)">
        <circle r="10" fill="var(--forest-500)" />
        <path d="M -4 0 L -1 4 L 5 -3" stroke="var(--paper-0)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

// ─────────────────────── Philosophy section (dark editorial pull-quote) ───────────────────────

function PhilosophySection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "var(--ink-700)",
        borderTop: "1px solid var(--ink-700)",
        borderBottom: "1px solid var(--ink-700)",
      }}
    >
      <img
        src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2000&q=85"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ display: "block" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.82) 100%)",
        }}
      />

      <div
        className="relative mx-auto px-6 py-24 sm:px-8 sm:py-32"
        style={{ maxWidth: "1080px" }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--paper-0)",
          }}
        >
          ↳ La méthode
        </div>
        <p
          className="mt-8"
          style={{
            fontFamily: "var(--font-source-serif), Georgia, serif",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: "clamp(32px, 5vw, 64px)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: "var(--paper-0)",
            maxWidth: "880px",
            textWrap: "balance",
          }}
        >
          Le temps est l&apos;allié de l&apos;épargnant patient.{" "}
          <span style={{ color: "var(--rose-200)" }}>
            Pas le marché. Pas le timing. Pas la chance.
          </span>
        </p>
        <p
          className="mt-10 text-[12px]"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--paper-0)",
            opacity: 0.6,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Une règle qu&apos;on rabâche · parce qu&apos;elle marche depuis 1900
        </p>
      </div>
    </section>
  );
}

// ─────────────────────── Trust Stats Bar (above footer) ───────────────────────

function TrustStatsBar() {
  const stats = [
    { num: "Depuis 2024", label: "Newsletter du dimanche, sans interruption." },
    { num: "9 articles", label: "Tous fact-checkés, mis à jour à chaque réforme." },
    { num: "1 podcast", label: "Premier épisode sur Spotify · trois par mois à venir." },
  ];
  return (
    <section
      style={{
        background: "var(--paper-0)",
        borderBottom: "1px solid var(--ink-700)",
      }}
    >
      <ul
        className="grid md:grid-cols-3"
        style={{ borderTop: "1px solid var(--ink-700)" }}
      >
        {stats.map((s, i) => (
          <li
            key={s.label}
            className="px-6 py-12 sm:px-8"
            style={{
              borderRight:
                i < stats.length - 1
                  ? "1px solid var(--ink-700)"
                  : "none",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-700)",
              }}
            >
              ↳ Repère 0{i + 1}
            </span>
            <div
              className="mt-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 3.4vw, 40px)",
                fontWeight: 800,
                color: "var(--ink-700)",
                letterSpacing: "-0.025em",
                lineHeight: 1.05,
                textTransform: "uppercase",
              }}
            >
              {s.num}
            </div>
            <p
              className="mt-3 text-[14px]"
              style={{
                fontFamily: "var(--font-source-serif), Georgia, serif",
                fontStyle: "italic",
                color: "var(--ink-700)",
                lineHeight: 1.55,
              }}
            >
              « {s.label} »
            </p>
          </li>
        ))}
      </ul>
      <p className="ic-strip">
        Données hébergées en France · Pas de revente · Désabonnement en un clic
      </p>
    </section>
  );
}

// ─────────────────────── Integrations Section ───────────────────────

const INTEGRATIONS: string[] = [
  "Boursorama",
  "Fortuneo",
  "Trade Republic",
  "Bourse Direct",
  "Linxea",
  "Saxo Bank",
  "DEGIRO",
  "BoursoBank",
];

function IntegrationsSection() {
  return (
    <section
      className="px-6 py-20 sm:px-8 sm:py-24"
      style={{
        background: "var(--paper-0)",
        borderTop: "1px solid var(--ink-700)",
        borderBottom: "1px solid var(--ink-700)",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "1280px" }}>
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="ic-eyebrow-mono">Ton écosystème</span>
            <h2
              className="ic-bigsection mt-5"
              style={{ fontSize: "clamp(34px, 5vw, 72px)" }}
            >
              Tu changes<br />de courtier ?<br />On t&apos;y suit.
            </h2>
          </div>
          <p
            className="max-w-[420px] text-[15px]"
            style={{
              fontFamily: "var(--font-source-serif), Georgia, serif",
              fontStyle: "italic",
              color: "var(--ink-700)",
              lineHeight: 1.55,
            }}
          >
            « Que ton PEA soit chez Bourso, ton AV chez Linxea ou ton CTO chez
            Trade Republic, on parle leur langue. Et on connaît leurs frais. »
          </p>
        </div>

        <ul
          className="grid grid-cols-2 md:grid-cols-4"
          style={{ border: "1px solid var(--ink-700)" }}
        >
          {INTEGRATIONS.map((name, idx) => {
            const colCount = 4;
            const col = idx % colCount;
            const totalRows = Math.ceil(INTEGRATIONS.length / colCount);
            const row = Math.floor(idx / colCount);
            const isLastRow = row === totalRows - 1;
            return (
              <li
                key={name}
                className="flex h-20 items-center justify-center px-4 sm:h-24"
                style={{
                  borderRight:
                    col < colCount - 1 ? "1px solid var(--ink-700)" : "none",
                  borderBottom: !isLastRow ? "1px solid var(--ink-700)" : "none",
                }}
              >
                <span
                  className="text-[14px] sm:text-[15px]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--ink-700)",
                  }}
                >
                  {name}
                </span>
              </li>
            );
          })}
        </ul>

        <p
          className="mt-6 text-[11px]"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--fg-muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Marques citées à titre informatif. Aucun partenariat commercial.
        </p>
      </div>
    </section>
  );
}

function HeroSection() {
  // Innostart-style brutalist hero: pink mega wordmark, mono tagline strip,
  // lilac × photo split block. Replaces the prior atmospheric-mountain hero.
  return (
    <section aria-labelledby="hero-mark">
      {/* Row 1 — pink pastel block with mega wordmark stacked on two lines. */}
      <div
        className="ic-block-rose px-6 pt-10 pb-6 sm:px-8 sm:pt-14 sm:pb-10"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        <h1 id="hero-mark" className="text-center">
          <span className="ic-mega">INVEST</span>
          <span className="ic-mega">COACH</span>
        </h1>
      </div>

      {/* Row 2 — mono tagline strip (between hard hairlines). */}
      <p className="ic-strip">
        Arrête de tâtonner. Pilote ton épargne en français · PEA · AV · PER · IR
      </p>

      {/* Row 3 — lilac column × photo column split, with newsletter CTA inside lilac. */}
      <div className="grid md:grid-cols-2" style={{ borderBottom: "1px solid var(--ink-700)" }}>
        <div
          className="ic-block-lilac flex min-h-[460px] flex-col justify-between px-6 py-12 sm:px-10 sm:py-16 md:min-h-[560px]"
          style={{ borderRight: "1px solid var(--ink-700)" }}
        >
          <div>
            <span className="ic-eyebrow-mono mb-6 inline-flex">Prends le cap</span>
            <h2 className="ic-bigsection mb-6">
              Maîtrise<br />tes impôts.
            </h2>
            <p
              className="max-w-[420px] text-[16px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--ink-700)",
                lineHeight: 1.55,
              }}
            >
              Tu paies un impôt français, mais tes ETF sont mondiaux. On
              t&apos;apprend à voir les deux — et à les piloter ensemble.
              Économiser de l&apos;impôt, c&apos;est gagner de l&apos;argent.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-5">
            <SubscribeForm source="landing-hero" />
            <p
              className="text-[11px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--ink-700)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Chaque dimanche depuis 2024 · Sans publicité · Désabo en un clic
            </p>
          </div>
        </div>

        <div className="relative min-h-[300px] md:min-h-[560px]">
          <img
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=85"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ display: "block" }}
          />
          <Link
            href="/podcast"
            className="absolute bottom-6 left-6 ic-btn-block backdrop-blur-sm"
            style={{ background: "rgba(10,10,10,0.85)" }}
          >
            ↳ Premier épisode du podcast
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────── World Playground Section ───────────────────────

const PLAYGROUND_CITIES: {
  city: string;
  asset: string;
  delta: string;
  x: number; // percent left
  y: number; // percent top
  labelBelow?: boolean; // place label below the dot to avoid overlap
}[] = [
  { city: "New York", asset: "S&P 500", delta: "+0,6 %", x: 22, y: 44 },
  { city: "London", asset: "FTSE 100", delta: "+0,2 %", x: 41, y: 22 },
  { city: "Paris", asset: "CAC 40", delta: "+0,4 %", x: 48, y: 38, labelBelow: true },
  { city: "Frankfurt", asset: "DAX", delta: "+0,3 %", x: 57, y: 24 },
  { city: "Tokyo", asset: "Nikkei", delta: "−0,1 %", x: 82, y: 42 },
];

function WorldPlaygroundSection() {
  return (
    <section
      className="relative overflow-hidden py-24"
      style={{ background: "var(--paper-100)" }}
    >
      <div className="mx-auto px-6 sm:px-8" style={{ maxWidth: "1080px" }}>
        <div className="mb-10 text-center">
          <div className="mb-3 flex justify-center">
            <span className="ic-eyebrow-mono">Le monde · ton terrain de jeu</span>
          </div>
          <h2 className="ic-h1 mx-auto" style={{ maxWidth: "640px" }}>
            Pendant que tu dors, ton argent voyage.
          </h2>
          <p
            className="mx-auto mt-5 text-[17px]"
            style={{
              maxWidth: "560px",
              fontFamily: "var(--font-display)",
              color: "var(--fg-muted)",
              lineHeight: 1.55,
            }}
          >
            Tes ETF sont à Wall Street. Ton PEA à Paris. Tes SCPI à Lyon. On
            t&apos;aide à voir où ton argent travaille — et combien tu paies en
            frais et impôts pour ça.
          </p>
        </div>

        <div
          className="relative mx-auto"
          style={{
            maxWidth: "920px",
            aspectRatio: "16 / 9",
            background: "var(--paper-0)",
            borderRadius: "var(--r-2xl)",
            border: "1px solid var(--border)",
            overflow: "hidden",
            boxShadow: "var(--sh-md)",
          }}
        >
          {/* Particle world map — Stripe-style dense dot field, lavender tinted. */}
          <svg
            viewBox="0 0 920 520"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              {/* Two staggered dot patterns for a denser, more organic particle field. */}
              <pattern id="dots-a" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="0.85" fill="var(--lavender-400)" opacity="0.55" />
              </pattern>
              <pattern id="dots-b" x="4" y="4" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="0.55" fill="var(--lavender-300)" opacity="0.45" />
              </pattern>
              <radialGradient id="globeGlow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="var(--lavender-100)" stopOpacity="0.7" />
                <stop offset="100%" stopColor="var(--paper-0)" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"  stopColor="var(--lavender-600)" stopOpacity="0" />
                <stop offset="50%" stopColor="var(--lavender-600)" stopOpacity="0.85" />
                <stop offset="100%" stopColor="var(--lavender-600)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect width="920" height="520" fill="url(#globeGlow)" />
            {/* Continent silhouettes filled with the dense particle field. */}
            <g opacity="0.95">
              {/* North America */}
              <path d="M 80 130 Q 100 100 160 105 T 280 130 Q 305 180 280 230 Q 240 270 200 280 Q 150 270 110 240 Q 80 200 80 130 Z" fill="url(#dots-a)" />
              <path d="M 80 130 Q 100 100 160 105 T 280 130 Q 305 180 280 230 Q 240 270 200 280 Q 150 270 110 240 Q 80 200 80 130 Z" fill="url(#dots-b)" />
              {/* South America */}
              <path d="M 240 290 Q 260 285 280 310 Q 290 360 280 410 Q 260 440 240 430 Q 220 400 230 350 Z" fill="url(#dots-a)" />
              <path d="M 240 290 Q 260 285 280 310 Q 290 360 280 410 Q 260 440 240 430 Q 220 400 230 350 Z" fill="url(#dots-b)" />
              {/* Europe */}
              <path d="M 420 140 Q 460 115 510 130 Q 535 165 525 200 Q 490 220 450 215 Q 420 195 415 165 Z" fill="url(#dots-a)" />
              <path d="M 420 140 Q 460 115 510 130 Q 535 165 525 200 Q 490 220 450 215 Q 420 195 415 165 Z" fill="url(#dots-b)" />
              {/* Africa */}
              <path d="M 460 230 Q 510 230 540 270 Q 555 340 520 400 Q 480 425 450 410 Q 420 360 430 290 Z" fill="url(#dots-a)" />
              <path d="M 460 230 Q 510 230 540 270 Q 555 340 520 400 Q 480 425 450 410 Q 420 360 430 290 Z" fill="url(#dots-b)" />
              {/* Asia */}
              <path d="M 555 130 Q 640 105 740 135 Q 800 170 800 215 Q 760 240 700 240 Q 620 235 565 215 Q 540 175 555 130 Z" fill="url(#dots-a)" />
              <path d="M 555 130 Q 640 105 740 135 Q 800 170 800 215 Q 760 240 700 240 Q 620 235 565 215 Q 540 175 555 130 Z" fill="url(#dots-b)" />
              {/* India */}
              <path d="M 640 240 Q 670 245 685 280 Q 685 320 660 330 Q 635 320 630 285 Z" fill="url(#dots-a)" />
              <path d="M 640 240 Q 670 245 685 280 Q 685 320 660 330 Q 635 320 630 285 Z" fill="url(#dots-b)" />
              {/* Australia */}
              <path d="M 740 360 Q 790 350 820 380 Q 820 410 785 420 Q 745 415 730 390 Z" fill="url(#dots-a)" />
              <path d="M 740 360 Q 790 350 820 380 Q 820 410 785 420 Q 745 415 730 390 Z" fill="url(#dots-b)" />
            </g>
            {/* Animated transaction arcs — lavender pulse traveling along each curve. */}
            <g fill="none" strokeWidth="1.5" strokeLinecap="round">
              {/* NY → London */}
              <path
                className="ic-arc-trail"
                d="M 200 200 Q 350 70 470 165"
                stroke="var(--lavender-200)"
                strokeWidth="1"
                opacity="0.6"
                strokeDasharray="3 5"
              />
              <path
                className="ic-arc-pulse ic-arc-pulse-a"
                d="M 200 200 Q 350 70 470 165"
                stroke="url(#arcGradient)"
              />
              {/* London → Tokyo */}
              <path
                className="ic-arc-trail"
                d="M 470 165 Q 620 60 770 195"
                stroke="var(--lavender-200)"
                strokeWidth="1"
                opacity="0.6"
                strokeDasharray="3 5"
              />
              <path
                className="ic-arc-pulse ic-arc-pulse-b"
                d="M 470 165 Q 620 60 770 195"
                stroke="url(#arcGradient)"
              />
              {/* Paris → Frankfurt */}
              <path
                className="ic-arc-trail"
                d="M 442 197 Q 480 130 525 175"
                stroke="var(--lavender-200)"
                strokeWidth="1"
                opacity="0.5"
                strokeDasharray="3 5"
              />
              <path
                className="ic-arc-pulse ic-arc-pulse-c"
                d="M 442 197 Q 480 130 525 175"
                stroke="url(#arcGradient)"
              />
            </g>
          </svg>

          {/* Animated city dots with floating delta labels */}
          {PLAYGROUND_CITIES.map((c, i) => (
            <div
              key={c.city}
              className="absolute"
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span
                className="ic-globe-pulse block"
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "var(--lavender-600)",
                  // @ts-expect-error animation delay CSS var
                  "--pulse-delay": `${i * 0.6}s`,
                }}
                aria-hidden="true"
              />
              <div
                className="ic-globe-card absolute hidden sm:block"
                style={{
                  // @ts-expect-error animation delay CSS var
                  "--float-delay": `${i * 0.4}s`,
                  ...(c.labelBelow
                    ? { top: "calc(100% + 8px)" }
                    : { bottom: "calc(100% + 8px)" }),
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--paper-0)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "6px 10px",
                  fontFamily: "var(--font-display)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--ink-700)",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 12px -4px rgba(20,16,40,0.12)",
                }}
              >
                <span style={{ color: "var(--fg-muted)" }}>{c.city}</span>
                <span style={{ marginLeft: 6 }}>{c.asset}</span>
                <span
                  style={{
                    marginLeft: 8,
                    fontFamily: "var(--font-mono)",
                    color: c.delta.startsWith("−")
                      ? "var(--terracotta-500)"
                      : "var(--forest-500)",
                  }}
                >
                  {c.delta}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile-only legend — the floating cards are hidden < sm to avoid overlap. */}
        <ul
          className="mx-auto mt-5 grid grid-cols-2 gap-2 sm:hidden"
          style={{ maxWidth: "560px" }}
        >
          {PLAYGROUND_CITIES.map((c) => (
            <li
              key={c.city}
              className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{
                background: "var(--paper-0)",
                border: "1px solid var(--border)",
                fontFamily: "var(--font-display)",
                fontSize: "12px",
              }}
            >
              <span>
                <span style={{ color: "var(--fg-muted)" }}>{c.city}</span>
                <span className="ml-1.5" style={{ color: "var(--ink-700)", fontWeight: 600 }}>
                  {c.asset}
                </span>
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: c.delta.startsWith("−")
                    ? "var(--terracotta-500)"
                    : "var(--forest-500)",
                }}
              >
                {c.delta}
              </span>
            </li>
          ))}
        </ul>

        <p
          className="mx-auto mt-6 text-center text-[12px]"
          style={{
            maxWidth: "560px",
            fontFamily: "var(--font-display)",
            color: "var(--fg-subtle)",
          }}
        >
          Données illustratives. Pas de conseil en investissement personnalisé —
          on explique, on n&apos;exécute pas pour toi.
        </p>
      </div>

    </section>
  );
}

// ─────────────────────── Product Preview Grid ───────────────────────

const PRODUCTS: {
  id: string;
  href: string;
  number: string;
  eyebrow: string;
  title: string;
  body: string;
  pastel: string;
  mockup: "cerfa" | "watchlist" | "simulator" | "podcast";
}[] = [
  {
    id: "product-fiscalite",
    href: "/tax",
    number: "01",
    eyebrow: "Fiscalité",
    title: "Économiser l'impôt, c'est gagner de l'argent",
    body: "Ton avis d'imposition + ton profil = 3 à 5 leviers chiffrés en euros. Cerfa 2042 pré-remplie, prête à signer.",
    pastel: "var(--rose-100)",
    mockup: "cerfa",
  },
  {
    id: "product-watchlist",
    href: "/watchlist",
    number: "02",
    eyebrow: "Watchlist",
    title: "Coachings sur les entreprises que tu suis",
    body: "Trade alerts éducatifs sur les publications trimestrielles, alertes AMF. Jamais de prix temps réel.",
    pastel: "var(--lavender-200)",
    mockup: "watchlist",
  },
  {
    id: "product-simulateur",
    href: "/simulation",
    number: "03",
    eyebrow: "Simulateur",
    title: "PEA vs AV vs CTO sur 10 ans",
    body: "Vraies hypothèses fiscales, en euros nets. Compare tes enveloppes avec ton vrai TMI.",
    pastel: "var(--terracotta-100)",
    mockup: "simulator",
  },
  {
    id: "product-podcast",
    href: "/podcast",
    number: "04",
    eyebrow: "Podcast & articles",
    title: "Financial literacy, pour épargnants pressés",
    body: "Une lettre par semaine, un podcast par épisode. Coach + Investisseur creusent une seule loi de l'argent à la fois.",
    pastel: "var(--rose-100)",
    mockup: "podcast",
  },
];

function ProductMockup({ kind }: { kind: "cerfa" | "watchlist" | "simulator" | "podcast" }) {
  if (kind === "cerfa") return <CerfaMockup />;
  if (kind === "watchlist") return <WatchlistMockup />;
  if (kind === "simulator") return <SimulatorMockup />;
  return <PodcastMockup />;
}

function ProductPreviewGrid() {
  return (
    <section
      className="px-6 py-20 sm:px-8 sm:py-24"
      style={{
        background: "var(--paper-0)",
        borderBottom: "1px solid var(--ink-700)",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "1280px" }}>
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="ic-eyebrow-mono">Tes outils</span>
            <h2
              className="ic-bigsection mt-5"
              style={{ fontSize: "clamp(34px, 5vw, 72px)" }}
            >
              Quatre surfaces.<br />Une promesse :<br />1 % mieux chaque jour.
            </h2>
          </div>
          <p
            className="max-w-[420px] text-[15px]"
            style={{
              fontFamily: "var(--font-source-serif), Georgia, serif",
              fontStyle: "italic",
              color: "var(--ink-700)",
              lineHeight: 1.55,
            }}
          >
            « Tu n&apos;as ni le même salaire, ni le même TMI, ni le même PEA
            que ton voisin. Mais tu peux suivre la même méthode — et payer
            moins d&apos;impôts en la suivant. »
          </p>
        </div>

        <ul
          className="grid md:grid-cols-2"
          style={{ border: "1px solid var(--ink-700)" }}
        >
          {PRODUCTS.map((p, idx) => {
            const col = idx % 2;
            const totalRows = Math.ceil(PRODUCTS.length / 2);
            const row = Math.floor(idx / 2);
            const isLastRow = row === totalRows - 1;
            return (
              <li
                key={p.id}
                style={{
                  borderRight:
                    col === 0 ? "1px solid var(--ink-700)" : "none",
                  borderBottom: !isLastRow ? "1px solid var(--ink-700)" : "none",
                }}
              >
                <Link
                  id={p.id}
                  href={p.href}
                  className="block h-full transition-colors scroll-mt-24 hover:bg-[var(--paper-100)]"
                >
                  <article className="flex h-full flex-col">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        background: p.pastel,
                        borderBottom: "1px solid var(--ink-700)",
                        padding: "32px 24px",
                        minHeight: "240px",
                      }}
                    >
                      <ProductMockup kind={p.mockup} />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 px-6 py-6 sm:px-8 sm:py-8">
                      <div className="flex items-baseline justify-between gap-4">
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: "var(--ink-700)",
                          }}
                        >
                          ↳ {p.number} · {p.eyebrow}
                        </span>
                        <span
                          aria-hidden="true"
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "16px",
                            fontWeight: 700,
                            color: "var(--ink-700)",
                          }}
                        >
                          →
                        </span>
                      </div>
                      <h3
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "clamp(22px, 2.4vw, 28px)",
                          fontWeight: 700,
                          letterSpacing: "-0.025em",
                          lineHeight: 1.15,
                          color: "var(--ink-700)",
                          textTransform: "uppercase",
                        }}
                      >
                        {p.title}
                      </h3>
                      <p
                        className="text-[14px]"
                        style={{
                          fontFamily: "var(--font-source-serif), Georgia, serif",
                          fontStyle: "italic",
                          color: "var(--ink-700)",
                          lineHeight: 1.55,
                          opacity: 0.85,
                        }}
                      >
                        « {p.body} »
                      </p>
                    </div>
                  </article>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function CerfaMockup() {
  return (
    <div
      className="mt-7 rounded-2xl p-5"
      style={{
        background: "var(--paper-0)",
        border: "1px solid var(--paper-200)",
        boxShadow: "var(--sh-md)",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-semibold uppercase"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--fg-subtle)",
            letterSpacing: "0.12em",
          }}
        >
          Cerfa 2042 · Aperçu
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{
            fontFamily: "var(--font-mono)",
            background: "var(--forest-50)",
            color: "var(--forest-700)",
          }}
        >
          −1 240 €
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "1AJ · Salaires", value: "42 800 €" },
          { label: "2DH · Dividendes", value: "1 230 €" },
          { label: "6PS · PER versé", value: "3 000 €" },
        ].map((row) => (
          <div
            key={row.label}
            className="rounded-lg p-3"
            style={{ background: "var(--paper-100)" }}
          >
            <div
              className="text-[10px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--fg-subtle)",
                letterSpacing: "0.04em",
              }}
            >
              {row.label}
            </div>
            <div
              className="mt-1 text-[13px] font-semibold"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--ink-700)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {row.value}
            </div>
          </div>
        ))}
      </div>
      <div
        className="mt-4 flex items-center gap-2 rounded-lg p-3"
        style={{ background: "var(--lavender-50)" }}
      >
        <span
          className="grid h-6 w-6 place-items-center rounded-full text-[12px]"
          style={{
            background: "var(--lavender-600)",
            color: "var(--paper-0)",
          }}
        >
          ✓
        </span>
        <span
          className="text-[13px]"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--ink-700)",
          }}
        >
          PER plafond non utilisé&nbsp;: <strong>+9 200 €</strong> de versement déductible
        </span>
      </div>
    </div>
  );
}

function WatchlistMockup() {
  const rows = [
    { ticker: "MC.PA", name: "LVMH", tone: "À surveiller", toneClr: "var(--warning)" },
    { ticker: "TTE.PA", name: "TotalEnergies", tone: "Solide", toneClr: "var(--forest-600)" },
    { ticker: "AIR.PA", name: "Airbus", tone: "Signal rouge", toneClr: "var(--terracotta-500)" },
  ];
  return (
    <div className="mt-6 space-y-2">
      {rows.map((r) => (
        <div
          key={r.ticker}
          className="flex items-center justify-between rounded-xl p-3"
          style={{
            background: "var(--paper-0)",
            border: "1px solid var(--paper-200)",
          }}
        >
          <div className="flex items-baseline gap-2">
            <span
              className="text-[12px] font-semibold"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--ink-700)",
              }}
            >
              {r.ticker}
            </span>
            <span
              className="text-[12px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--fg-muted)",
              }}
            >
              {r.name}
            </span>
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
            style={{
              fontFamily: "var(--font-display)",
              color: r.toneClr,
              border: `1px solid ${r.toneClr}`,
              letterSpacing: "0.04em",
            }}
          >
            {r.tone}
          </span>
        </div>
      ))}
    </div>
  );
}

function SimulatorMockup() {
  // Simple bar chart: PEA vs AV over 10 years
  const data = [
    { label: "PEA", value: 100, height: "100%", color: "var(--lavender-600)" },
    { label: "AV", value: 84, height: "84%", color: "var(--lavender-300)" },
    { label: "CTO", value: 71, height: "71%", color: "var(--terracotta-300)" },
  ];
  return (
    <div
      className="mt-6 rounded-2xl p-4"
      style={{
        background: "var(--paper-0)",
        border: "1px solid var(--paper-200)",
        boxShadow: "var(--sh-sm)",
      }}
    >
      <div className="flex items-end justify-between gap-3" style={{ height: "100px" }}>
        {data.map((d) => (
          <div key={d.label} className="flex h-full flex-1 flex-col justify-end">
            <div
              className="rounded-t-md"
              style={{
                height: d.height,
                background: d.color,
                minHeight: "6px",
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        {data.map((d) => (
          <div
            key={d.label}
            className="flex-1 text-center"
          >
            <div
              className="text-[10px] font-semibold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--fg-muted)",
                letterSpacing: "0.04em",
              }}
            >
              {d.label}
            </div>
            <div
              className="text-[12px] font-semibold"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--ink-700)",
              }}
            >
              {Math.round(d.value * 1.34)} k€
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PodcastMockup() {
  return (
    <div
      className="mt-6 rounded-full p-2 pl-2 pr-5"
      style={{
        background: "var(--paper-0)",
        border: "1px solid var(--paper-200)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        boxShadow: "var(--sh-sm)",
      }}
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
        style={{
          background: "var(--lavender-600)",
          color: "var(--paper-0)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M3 2v10l8-5z" />
        </svg>
      </span>
      <div className="flex-1 min-w-0">
        <div
          className="truncate text-[13px] font-semibold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--ink-700)",
            letterSpacing: "-0.005em",
          }}
        >
          Ce que change la réforme PEA pour ton argent
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div
            className="h-1 flex-1 rounded-full"
            style={{ background: "var(--paper-200)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: "38%",
                background: "var(--lavender-600)",
              }}
            />
          </div>
          <span
            className="text-[11px]"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--fg-muted)",
            }}
          >
            12 min
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────── Savings = Earnings Section ───────────────────────

function SavingsEqualsEarningsSection() {
  // Photo: orange/black abstract fluid texture (Unsplash gSRCehQLUu0).
  // Sits behind the "compounding" message — visual stand-in for the chart
  // we removed: motion, density, time. No data, just mood.
  const PHOTO_FLUID =
    "https://images.unsplash.com/photo-1777033481363-96640776ae62?auto=format&fit=crop&w=1600&q=85";

  const LEVERS: { k: string; v: string }[] = [
    { k: "PER", v: "Jusqu'à 10 % de tes revenus déductibles" },
    { k: "PEA", v: "Exonération d'IR après 5 ans (17,2 % de PS seulement)" },
    { k: "Donations", v: "100 000 € exonérés tous les 15 ans, par parent et par enfant" },
    { k: "Plus-values", v: "Abattement pour durée de détention sur titres pré-2018" },
  ];

  return (
    <section
      className="grid md:grid-cols-2"
      style={{ borderBottom: "1px solid var(--ink-700)" }}
    >
      <div
        className="ic-block-lilac flex flex-col justify-between px-6 py-14 sm:px-10 sm:py-20"
        style={{ borderRight: "1px solid var(--ink-700)" }}
      >
        <div>
          <span className="ic-eyebrow-mono mb-6 inline-flex">
            Le calcul que personne ne te fait
          </span>
          <h2
            className="ic-bigsection mb-6"
            style={{ fontSize: "clamp(30px, 4.4vw, 60px)" }}
          >
            5 000 € d&apos;impôt<br />économisés à 35 ans<br />= 38 000 € à 65.
          </h2>
          <p
            className="max-w-[440px] text-[16px]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--ink-700)",
              lineHeight: 1.55,
            }}
          >
            Chaque euro d&apos;impôt non payé reste dans ton PEA et compose
            pendant trente ans. C&apos;est ça, notre métier — te montrer
            chaque année combien tu peux récupérer, légalement, BOI à
            l&apos;appui.
          </p>
        </div>

        <ul
          className="mt-10"
          style={{ borderTop: "1px solid var(--ink-700)" }}
        >
          {LEVERS.map((item, i) => (
            <li
              key={item.k}
              className="flex items-baseline gap-4 py-4"
              style={{
                borderBottom:
                  i < LEVERS.length - 1
                    ? "1px solid var(--ink-700)"
                    : "none",
              }}
            >
              <span
                className="shrink-0"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--ink-700)",
                  width: "112px",
                }}
              >
                ↳ {item.k}
              </span>
              <span
                className="flex-1 text-[14px] sm:text-[15px]"
                style={{
                  fontFamily: "var(--font-source-serif), Georgia, serif",
                  fontStyle: "italic",
                  color: "var(--ink-700)",
                  lineHeight: 1.5,
                }}
              >
                « {item.v} »
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="relative min-h-[360px] md:min-h-full"
        style={{ background: "var(--ink-700)" }}
      >
        <img
          src={PHOTO_FLUID}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ display: "block" }}
        />
      </div>
    </section>
  );
}

function CompoundingChart() {
  // Simple SVG showing two lines: with vs without tax savings, growing over 30 years
  const points = (start: number, growth: number) => {
    const arr: { x: number; y: number }[] = [];
    let v = start;
    for (let i = 0; i <= 30; i++) {
      arr.push({ x: i, y: v });
      v *= 1 + growth;
    }
    return arr;
  };
  const without = points(40000, 0.07); // 7%/y — long-term equity average
  const withSaved = points(45000, 0.07); // +5000 € d'impôt évité, même rendement
  const maxY = Math.max(...withSaved.map((p) => p.y));
  const w = 480;
  const h = 320;
  const padX = 40;
  const padY = 30;
  const sx = (i: number) => padX + (i / 30) * (w - padX * 2);
  const sy = (v: number) => h - padY - (v / maxY) * (h - padY * 2);
  const path = (pts: { x: number; y: number }[]) =>
    pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x)} ${sy(p.y)}`)
      .join(" ");
  const finalDelta = Math.round(withSaved[30].y - without[30].y);

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "var(--paper-0)",
        border: "1px solid var(--paper-200)",
        boxShadow: "var(--sh-md)",
      }}
    >
      <div className="flex items-baseline justify-between">
        <span
          className="text-[12px] font-semibold uppercase"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--fg-subtle)",
            letterSpacing: "0.12em",
          }}
        >
          Effet boule de neige · 30 ans
        </span>
        <span
          className="rounded-full px-3 py-1 text-[12px] font-semibold"
          style={{
            fontFamily: "var(--font-mono)",
            background: "var(--lavender-50)",
            color: "var(--lavender-700)",
          }}
        >
          +{finalDelta.toLocaleString("fr-FR")} €
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 w-full">
        <defs>
          <linearGradient id="lvAreaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--lavender-300)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--lavender-300)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Without savings (lower line, muted) */}
        <path
          d={path(without)}
          stroke="var(--paper-300)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 4"
        />
        {/* With savings (lavender, area + line) */}
        <path
          d={`${path(withSaved)} L ${sx(30)} ${h - padY} L ${sx(0)} ${h - padY} Z`}
          fill="url(#lvAreaGrad)"
        />
        <path
          d={path(withSaved)}
          stroke="var(--lavender-600)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Endpoints */}
        <circle
          cx={sx(30)}
          cy={sy(withSaved[30].y)}
          r="5"
          fill="var(--lavender-600)"
          stroke="var(--paper-0)"
          strokeWidth="2"
        />
        <circle
          cx={sx(30)}
          cy={sy(without[30].y)}
          r="4"
          fill="var(--paper-300)"
          stroke="var(--paper-0)"
          strokeWidth="2"
        />
        {/* X-axis labels */}
        <text
          x={padX}
          y={h - 5}
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--fg-subtle)"
        >
          35 ans
        </text>
        <text
          x={w - padX}
          y={h - 5}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--fg-subtle)"
        >
          65 ans
        </text>
      </svg>
      <div
        className="mt-3 flex items-center gap-4 text-[12px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <span className="flex items-center gap-2" style={{ color: "var(--lavender-700)" }}>
          <span
            className="inline-block h-2 w-6 rounded-full"
            style={{ background: "var(--lavender-600)" }}
          />
          Avec 5 000 € d&apos;impôt évité
        </span>
        <span className="flex items-center gap-2" style={{ color: "var(--fg-muted)" }}>
          <span
            className="inline-block h-1 w-6 rounded-full"
            style={{ background: "var(--paper-300)" }}
          />
          Sans
        </span>
      </div>
    </div>
  );
}

