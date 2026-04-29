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
      <FeaturesSection />
      <PricingSection />
      <Footer />
    </main>
  );
}

const THEMES: {
  slug: string;
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
}[] = [
  {
    slug: "money",
    label: "Argent",
    eyebrow: "Thème · 01",
    title: "Argent",
    body: "Le podcast qui transforme une vidéo en coaching. Une loi simple par épisode, appliquée à ton vrai salaire — PEA, AV, PER, IR.",
    cta: "Écouter les épisodes",
    href: "/podcast?theme=money",
  },
];

function ThemesSection() {
  return (
    <section
      className="mx-auto px-8 pb-12 pt-4"
      style={{ maxWidth: "1280px" }}
    >
      <div className="pb-8">
        <div className="cap-eyebrow">Sujets</div>
        <h2 className="cap-h1 mt-3" style={{ maxWidth: "720px" }}>
          Choisis le sujet qui te concerne aujourd&apos;hui.
        </h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((t) => (
          <Link key={t.slug} href={t.href} className="block">
            <article
              className="cap-card flex h-full flex-col"
              style={{ minHeight: "240px" }}
            >
              <div
                className="text-[11px]"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--terracotta-500)",
                  letterSpacing: "0.06em",
                }}
              >
                {t.eyebrow}
              </div>
              <h3 className="cap-h3 mt-2 text-[28px]">{t.title}</h3>
              <p
                className="mt-3 flex-1 text-[15px]"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--fg-muted)",
                  lineHeight: 1.55,
                }}
              >
                {t.body}
              </p>
              <span
                className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--forest-600)",
                }}
              >
                {t.cta} →
              </span>
            </article>
          </Link>
        ))}
      </div>
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
        <div className="mb-8 flex justify-center">
          <span className="ic-pill">
            <span className="ic-pill-badge">Newsletter</span>
            Le journal du dimanche
          </span>
        </div>
        <h1 className="ic-display mb-6">
          Apprends à <em>faire travailler</em> ton argent.
        </h1>
        <p
          className="mx-auto mb-10 max-w-[560px] ic-lede"
          style={{ color: "var(--fg-muted)" }}
        >
          Une lettre par semaine. Des explications fiscales en français clair,
          écrites pour les épargnants — pas pour les traders. Sans bruit, sans
          publicité.
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

const FEATURES: {
  eyebrow: string;
  title: string;
  body: string;
  emoji: string;
  pastel: string;
}[] = [
  {
    eyebrow: "01",
    title: "Le journal du dimanche",
    body: "Une édition longue le dimanche, trois brèves en semaine. Pour comprendre, pas pour réagir.",
    emoji: "📰",
    pastel: "ic-card-pastel-lavender",
  },
  {
    eyebrow: "02",
    title: "Optimisation fiscale",
    body: "PEA, CTO, assurance-vie, PER : trois enveloppes, des règles claires, des chiffres en euros.",
    emoji: "💰",
    pastel: "ic-card-pastel-peach",
  },
  {
    eyebrow: "03",
    title: "Coach IA",
    body: "Pose une question à toute heure. Le coach répond comme un ami patient qui aurait lu tous les rapports.",
    emoji: "🎯",
    pastel: "ic-card-pastel-mint",
  },
  {
    eyebrow: "04",
    title: "Watchlist & alertes",
    body: "Suis les entreprises qui te concernent. On t'envoie un mot quand un événement public compte vraiment.",
    emoji: "👀",
    pastel: "ic-card-pastel-lavender",
  },
  {
    eyebrow: "05",
    title: "Simulateur d'enveloppes",
    body: "Compare ton PEA, ton CTO, ton AV sur 10 ans. Les vraies hypothèses fiscales, pas un calculateur générique.",
    emoji: "📊",
    pastel: "ic-card-pastel-peach",
  },
  {
    eyebrow: "06",
    title: "Notes de recherche",
    body: "Chaque rapport d'entreprise, résumé en deux pages. Tu lis les chiffres, pas le jargon.",
    emoji: "📑",
    pastel: "ic-card-pastel-mint",
  },
];

function FeaturesSection() {
  return (
    <section className="mx-auto px-6 py-24 sm:px-8" style={{ maxWidth: "1280px" }}>
      <div className="mb-14 text-center">
        <h2 className="ic-h1 mx-auto" style={{ maxWidth: "720px" }}>
          Tout pour comprendre, rien pour spéculer.
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
          Six outils. Une seule philosophie&nbsp;: 1&nbsp;% mieux chaque jour, sans
          devenir trader.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <article
            key={f.eyebrow}
            className={f.pastel}
            style={{
              borderRadius: "var(--r-2xl)",
              padding: "32px 28px",
              border: "1px solid rgba(20,16,40,0.04)",
              transition: "all 200ms var(--ease-standard)",
            }}
          >
            <div
              className="grid h-[64px] w-[64px] place-items-center rounded-2xl"
              style={{
                background: "var(--paper-0)",
                fontSize: "28px",
                boxShadow: "var(--sh-md)",
              }}
            >
              {f.emoji}
            </div>
            <div
              className="mt-6 text-[11px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--lavender-700)",
                letterSpacing: "0.08em",
              }}
            >
              {f.eyebrow}
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
              {f.title}
            </h3>
            <p
              className="mt-3 text-[15px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--fg-muted)",
                lineHeight: 1.5,
              }}
            >
              {f.body}
            </p>
          </article>
        ))}
      </div>
    </section>
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

function NewsletterSection() {
  return (
    <section className="mx-auto px-8 py-24" style={{ maxWidth: "1080px" }}>
      <div
        className="cap-card-inverse mx-auto"
        style={{
          maxWidth: "720px",
          padding: "48px 40px",
          borderRadius: "var(--r-2xl)",
        }}
      >
        <div
          className="cap-eyebrow"
          style={{ color: "var(--terracotta-300)" }}
        >
          La newsletter
        </div>
        <h2
          className="mt-3 mb-4 text-[36px] font-semibold leading-tight"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--paper-50)",
            letterSpacing: "-0.02em",
          }}
        >
          Reçois la lecture du dimanche.
        </h2>
        <p
          className="mb-6 text-[17px]"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--paper-200)",
            lineHeight: 1.55,
          }}
        >
          Une édition longue par semaine, trois brèves dans la boîte. Sans
          publicité, sans bruit, sans urgence. Tu peux te désabonner d&apos;un
          clic.
        </p>
        <SubscribeForm />
      </div>
    </section>
  );
}
