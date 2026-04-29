import Link from "next/link";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SubscribeForm } from "@/app/newsletter/subscribe-form";
import { CoachingPodcast } from "@/components/coaching-podcast";
import { PodcastEpisodeList } from "@/components/podcast-episode-list";
import { SpotifyEpisodeList } from "@/components/spotify-episode-card";
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
      <WorldPlaygroundSection />
      <IntegrationsSection />
      <ProductPreviewGrid />
      <SavingsEqualsEarningsSection />
      <PricingSection />
      <Footer />
    </main>
  );
}

// ─────────────────────── Integrations Section ───────────────────────

const INTEGRATIONS: { name: string; bg: string; fg: string }[] = [
  { name: "Boursorama",     bg: "#fef2f2", fg: "#e11d48" },
  { name: "Fortuneo",       bg: "#fff7ed", fg: "#ea580c" },
  { name: "Trade Republic", bg: "#f5f5f4", fg: "#1c1917" },
  { name: "Bourse Direct",  bg: "#eff6ff", fg: "#1d4ed8" },
  { name: "Linxea",         bg: "#ecfeff", fg: "#0e7490" },
  { name: "Saxo Bank",      bg: "#eff6ff", fg: "#1e3a8a" },
  { name: "DEGIRO",         bg: "#fefce8", fg: "#a16207" },
  { name: "BoursoBank",     bg: "#fdf2f8", fg: "#be185d" },
];

function IntegrationsSection() {
  return (
    <section className="mx-auto px-6 py-20 sm:px-8" style={{ maxWidth: "1080px" }}>
      <div className="mb-10 text-center">
        <div
          className="mb-3 text-[12px] font-semibold uppercase"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--lavender-700)",
            letterSpacing: "0.16em",
          }}
        >
          Compatible avec ton écosystème
        </div>
        <h2
          className="mx-auto text-[28px] font-bold sm:text-[32px]"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--ink-700)",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            maxWidth: "560px",
          }}
        >
          Tu changes de courtier ? On t&apos;y suit.
        </h2>
        <p
          className="mx-auto mt-4 text-[15px]"
          style={{
            maxWidth: "520px",
            fontFamily: "var(--font-display)",
            color: "var(--fg-muted)",
            lineHeight: 1.55,
          }}
        >
          Que ton PEA soit chez Bourso, ton AV chez Linxea ou ton CTO chez
          Trade Republic, on parle leur langue. Et on connaît leurs frais.
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {INTEGRATIONS.map((it) => (
          <li
            key={it.name}
            className="flex h-16 items-center justify-center rounded-2xl px-4 transition-transform"
            style={{
              background: it.bg,
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="text-[15px] font-bold"
              style={{
                fontFamily: "var(--font-display)",
                color: it.fg,
                letterSpacing: "-0.01em",
              }}
            >
              {it.name}
            </span>
          </li>
        ))}
      </ul>

      <p
        className="mx-auto mt-6 text-center text-[12px]"
        style={{
          fontFamily: "var(--font-mono)",
          color: "var(--fg-subtle)",
          maxWidth: "560px",
        }}
      >
        Marques citées à titre informatif. Aucun partenariat commercial avec
        ces établissements.
      </p>
    </section>
  );
}

function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 70% at 50% 0%, var(--lavender-100) 0%, var(--paper-50) 55%, var(--paper-50) 100%)",
      }}
    >
      <div
        className="relative mx-auto px-6 pt-20 pb-24 text-center sm:px-8 sm:pt-28 sm:pb-32"
        style={{ maxWidth: "880px" }}
      >
        <div className="mb-6 flex justify-center">
          <Link
            href="/podcast"
            className="group inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] transition-colors"
            style={{
              fontFamily: "var(--font-display)",
              background: "var(--paper-0)",
              border: "1px solid var(--border)",
              color: "var(--ink-700)",
            }}
          >
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{
                background: "var(--lavender-600)",
                color: "var(--paper-0)",
                letterSpacing: "0.06em",
              }}
            >
              Nouveau
            </span>
            <span>Premier épisode du podcast est sorti</span>
            <span
              className="transition-transform group-hover:translate-x-0.5"
              style={{ color: "var(--lavender-700)" }}
              aria-hidden="true"
            >
              →
            </span>
          </Link>
        </div>
        <div className="mb-8 flex justify-center">
          <span className="ic-pill">
            <span className="ic-pill-badge">Pour épargnants français</span>
            PEA · AV · PER · IR
          </span>
        </div>
        <h1 className="ic-display mb-6">
          Ton empreinte fiscale est unique. <em>La méthode, non.</em>
        </h1>
        <p
          className="mx-auto mb-10 max-w-[600px] ic-lede"
          style={{ color: "var(--fg-muted)" }}
        >
          Tu paies un impôt français, mais tes ETF sont mondiaux. On t&apos;apprend
          à voir les deux — et à les piloter ensemble. Économiser de l&apos;impôt,
          c&apos;est gagner de l&apos;argent.
        </p>

        <div className="mx-auto flex flex-col items-center gap-5">
          <SubscribeForm source="landing-hero" />
          <p
            className="text-[12px]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--fg-subtle)",
              letterSpacing: "0.02em",
            }}
          >
            Édité chaque dimanche depuis 2024 · Sans publicité · Désabonnement en un clic
          </p>
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
          <div
            className="mb-3 text-[12px] font-semibold uppercase"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--lavender-700)",
              letterSpacing: "0.16em",
            }}
          >
            Le monde · ton terrain de jeu
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

function ProductPreviewGrid() {
  return (
    <section className="mx-auto px-6 py-24 sm:px-8" style={{ maxWidth: "1280px" }}>
      <div className="mb-14 text-center">
        <div
          className="mb-3 text-[12px] font-semibold uppercase"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--lavender-700)",
            letterSpacing: "0.16em",
          }}
        >
          La même boîte à outils, pour chaque empreinte
        </div>
        <h2 className="ic-h1 mx-auto" style={{ maxWidth: "720px" }}>
          Cinq surfaces. Une seule promesse&nbsp;: 1&nbsp;% mieux chaque jour.
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
          Tu n&apos;as ni le même salaire, ni le même TMI, ni le même PEA que
          ton voisin. Mais tu peux suivre la même méthode — et payer moins
          d&apos;impôts en la suivant.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
        {/* 1. Fiscalité — wide card with form mockup */}
        <Link
          href="/tax"
          className="ic-card-pastel-lavender block md:col-span-2 lg:col-span-4"
          style={{
            borderRadius: "var(--r-2xl)",
            padding: "32px",
            border: "1px solid rgba(124,91,250,0.10)",
            transition: "all 200ms var(--ease-standard)",
          }}
        >
          <div
            className="text-[11px] font-semibold uppercase"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--lavender-700)",
              letterSpacing: "0.12em",
            }}
          >
            01 · Déclaration fiscale
          </div>
          <h3
            className="mt-2 text-[26px] font-bold"
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.025em",
              color: "var(--ink-700)",
              lineHeight: 1.15,
            }}
          >
            Économiser de l&apos;impôt, c&apos;est gagner de l&apos;argent.
          </h3>
          <p
            className="mt-3 max-w-[460px] text-[15px]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--fg-muted)",
              lineHeight: 1.55,
            }}
          >
            Ton avis d&apos;imposition + ton profil = 3 à 5 leviers chiffrés en
            euros. Cerfa 2042 pré-remplie, prête à signer.
          </p>
          <CerfaMockup />
        </Link>

        {/* 2. Watchlist mockup */}
        <Link
          href="/watchlist"
          className="block lg:col-span-2"
          style={{
            background: "var(--bg-elevated)",
            borderRadius: "var(--r-2xl)",
            padding: "32px",
            border: "1px solid var(--border)",
            transition: "all 200ms var(--ease-standard)",
          }}
        >
          <div
            className="text-[11px] font-semibold uppercase"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--lavender-700)",
              letterSpacing: "0.12em",
            }}
          >
            02 · Watchlist
          </div>
          <h3
            className="mt-2 text-[22px] font-bold"
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.02em",
              color: "var(--ink-700)",
              lineHeight: 1.2,
            }}
          >
            Coachings sur les entreprises que tu suis.
          </h3>
          <p
            className="mt-2 text-[14px]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--fg-muted)",
              lineHeight: 1.5,
            }}
          >
            Trade alerts éducatifs, jamais de prix temps réel.
          </p>
          <WatchlistMockup />
        </Link>

        {/* 3. Simulateur mockup */}
        <Link
          href="/simulation"
          className="ic-card-pastel-peach block lg:col-span-2"
          style={{
            borderRadius: "var(--r-2xl)",
            padding: "32px",
            border: "1px solid rgba(204,116,72,0.10)",
            transition: "all 200ms var(--ease-standard)",
          }}
        >
          <div
            className="text-[11px] font-semibold uppercase"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--terracotta-700)",
              letterSpacing: "0.12em",
            }}
          >
            03 · Simulateur
          </div>
          <h3
            className="mt-2 text-[22px] font-bold"
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.02em",
              color: "var(--ink-700)",
              lineHeight: 1.2,
            }}
          >
            PEA vs AV vs CTO sur 10 ans.
          </h3>
          <p
            className="mt-2 text-[14px]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--fg-muted)",
              lineHeight: 1.5,
            }}
          >
            Vraies hypothèses fiscales, en euros nets.
          </p>
          <SimulatorMockup />
        </Link>

        {/* 4. Podcast mockup */}
        <Link
          href="/podcast"
          className="ic-card-pastel-mint block md:col-span-2 lg:col-span-4"
          style={{
            borderRadius: "var(--r-2xl)",
            padding: "32px",
            border: "1px solid rgba(74,109,68,0.10)",
            transition: "all 200ms var(--ease-standard)",
          }}
        >
          <div
            className="text-[11px] font-semibold uppercase"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--forest-700)",
              letterSpacing: "0.12em",
            }}
          >
            04 · Podcast & articles
          </div>
          <h3
            className="mt-2 text-[26px] font-bold"
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.025em",
              color: "var(--ink-700)",
              lineHeight: 1.15,
            }}
          >
            Financial literacy, pour épargnants pressés.
          </h3>
          <p
            className="mt-3 max-w-[460px] text-[15px]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--fg-muted)",
              lineHeight: 1.55,
            }}
          >
            Une lettre par semaine, un podcast par épisode. Coach + Investisseur
            creusent une seule loi de l&apos;argent à la fois.
          </p>
          <PodcastMockup />
        </Link>
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
  return (
    <section
      className="relative overflow-hidden py-24"
      style={{
        background:
          "linear-gradient(180deg, var(--paper-50) 0%, var(--lavender-50) 100%)",
      }}
    >
      <div
        className="mx-auto px-6 sm:px-8"
        style={{ maxWidth: "1080px" }}
      >
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <div
              className="mb-3 text-[12px] font-semibold uppercase"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--lavender-700)",
                letterSpacing: "0.16em",
              }}
            >
              Le calcul que personne ne te fait
            </div>
            <h2 className="ic-h1">
              Économiser 5 000 € d&apos;impôts à 35 ans = <em>+38 000 €</em> à 65 ans.
            </h2>
            <p
              className="mt-5 text-[17px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--fg-muted)",
                lineHeight: 1.55,
              }}
            >
              Chaque euro d&apos;impôt non-payé reste dans ton PEA et compose
              pendant 30 ans. C&apos;est ça, notre métier&nbsp;: te montrer
              chaque année combien tu peux récupérer — légalement, BOI à
              l&apos;appui.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                {
                  k: "PER",
                  v: "Jusqu'à 10 % de tes revenus déductibles",
                },
                {
                  k: "PEA",
                  v: "Exonération d'IR après 5 ans (17,2 % de PS seulement)",
                },
                {
                  k: "Donations",
                  v: "100 000 € exonérés tous les 15 ans par parent et enfant",
                },
                {
                  k: "Plus-values",
                  v: "Abattement pour durée de détention sur titres pré-2018",
                },
              ].map((item) => (
                <li
                  key={item.k}
                  className="flex items-start gap-3 text-[15px]"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--ink-700)",
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      background: "var(--lavender-600)",
                      color: "var(--paper-0)",
                      fontWeight: 700,
                    }}
                  >
                    €
                  </span>
                  <span>
                    <strong style={{ color: "var(--lavender-700)" }}>{item.k}</strong>
                    <span style={{ color: "var(--fg-muted)" }}> · {item.v}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <CompoundingChart />
        </div>
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

const TIERS: {
  id: string;
  name: string;
  price: string;
  period: string;
  tag: string;
  features: string[];
  cta: string;
  href: string;
  featured: boolean;
}[] = [
  {
    id: "decouverte",
    name: "Découverte",
    price: "0",
    period: "€ / mois",
    tag: "Gratuit, pour toujours.",
    features: [
      "Le journal du dimanche",
      "3 brèves par semaine",
      "Glossaire complet",
      "Communauté de lecteurs",
    ],
    cta: "Commencer · gratuit",
    href: "/login",
    featured: false,
  },
  {
    id: "investisseur",
    name: "Investisseur",
    price: "14",
    period: "€ / mois",
    tag: "Pour passer à l'acte.",
    features: [
      "Tout Découverte",
      "Alertes éprouvées",
      "Coach IA illimité",
      "Notes de recherche",
      "Simulateur PEA / CTO",
    ],
    cta: "Essayer 14 jours",
    href: "/subscription",
    featured: true,
  },
  {
    id: "patrimoine",
    name: "Patrimoine",
    price: "39",
    period: "€ / mois",
    tag: "Pour piloter l'ensemble.",
    features: [
      "Tout Investisseur",
      "Optimisation fiscale avancée",
      "Suivi multi-enveloppes",
      "Rapports trimestriels en deux pages",
      "Coach IA prioritaire",
    ],
    cta: "Essayer 14 jours",
    href: "/subscription",
    featured: false,
  },
];

function PricingSection() {
  return (
    <section id="tarifs" className="py-24" style={{ background: "var(--paper-100)" }}>
      <div className="mx-auto px-6 text-center sm:px-8" style={{ maxWidth: "720px" }}>
        <h2 className="ic-h1 mx-auto">
          Trois formules. Annulable en un clic.
        </h2>
        <p
          className="mx-auto mt-5 text-[17px]"
          style={{
            maxWidth: "520px",
            fontFamily: "var(--font-display)",
            color: "var(--fg-muted)",
            lineHeight: 1.55,
          }}
        >
          Découverte est gratuite, pour toujours. Tu passes payant seulement quand tu en veux plus.
        </p>
      </div>
      <div
        className="mx-auto mt-14 grid gap-6 px-6 sm:px-8 md:grid-cols-3"
        style={{ maxWidth: "1080px" }}
      >
        {TIERS.map((t) => (
          <article
            key={t.id}
            className={`ic-tier ${t.featured ? "ic-tier-featured" : ""}`}
            style={t.featured ? { transform: "translateY(-8px)" } : undefined}
          >
            {t.featured ? (
              <div className="ic-tier-ribbon">La plus choisie</div>
            ) : null}
            <h3
              className="m-0 text-[22px] font-bold"
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.02em",
                color: "var(--ink-700)",
              }}
            >
              {t.name}
            </h3>
            <p
              className="m-0 text-[14px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--fg-muted)",
              }}
            >
              {t.tag}
            </p>
            <div
              className="flex items-baseline gap-1.5 py-3"
              style={{
                borderTop: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "56px",
                  fontWeight: 700,
                  letterSpacing: "-0.035em",
                  lineHeight: 1,
                  color: "var(--ink-700)",
                }}
              >
                {t.price}
              </span>
              <span
                className="text-[13px]"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--fg-muted)",
                }}
              >
                {t.period}
              </span>
            </div>
            <ul className="m-0 flex flex-1 list-none flex-col gap-2.5 p-0">
              {t.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 text-[14px]"
                  style={{ color: "var(--fg)", lineHeight: 1.45, fontFamily: "var(--font-display)" }}
                >
                  <CheckIcon />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={t.href}
              className="mt-2 inline-flex items-center justify-center rounded-full px-5 py-3 text-[14px] font-semibold transition-all hover:translate-y-[-1px] hover:shadow-md"
              style={{
                fontFamily: "var(--font-display)",
                background: t.featured
                  ? "var(--ink-700)"
                  : "var(--bg-elevated)",
                color: t.featured ? "var(--paper-0)" : "var(--ink-700)",
                border: t.featured
                  ? "1px solid var(--ink-700)"
                  : "1px solid var(--paper-300)",
              }}
            >
              {t.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        color: "var(--lavender-600)",
        marginTop: "3px",
        flexShrink: 0,
      }}
    >
      <path d="M4 12 L10 18 L20 6" />
    </svg>
  );
}

