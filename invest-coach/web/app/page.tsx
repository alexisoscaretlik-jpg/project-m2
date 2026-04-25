import Link from "next/link";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SubscribeForm } from "@/app/newsletter/subscribe-form";
import { TvTickerTape } from "@/components/tv-ticker-tape";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase";

type CompanyRef = { ticker: string; name: string };
type ExtractionRef = { the_one_thing: string | null };
type FeedCard = {
  id: number;
  title: string;
  tone: string | null;
  published_at: string;
  companies: CompanyRef | CompanyRef[] | null;
  extractions: ExtractionRef | ExtractionRef[] | null;
};

const toneVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  bullish: "default",
  cautious: "secondary",
  red_flag: "destructive",
  educational: "outline",
};

function first<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

function relativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (days < 1) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days}j`;
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`;
  return `il y a ${Math.floor(days / 365)}a`;
}

export default async function Home() {
  let user = null;
  try {
    const sb = await createClient();
    const res = await sb.auth.getUser();
    user = res.data.user;
  } catch {}

  if (!user) return <Landing />;

  let feed: FeedCard[] = [];
  try {
    const { data: cards } = await supabase
      .from("cards")
      .select(
        "id, title, tone, published_at, companies(ticker, name), extractions(the_one_thing)",
      )
      .order("published_at", { ascending: false })
      .limit(20);
    feed = (cards ?? []) as FeedCard[];
  } catch {
    feed = [];
  }

  return (
    <main className="min-h-screen bg-background">
      <Nav active="/" />
      <TvTickerTape />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-5 flex items-baseline justify-between">
          <span className="cap-eyebrow">Aujourd&apos;hui · feed</span>
          <Link
            href="/companies"
            className="text-xs font-medium text-primary hover:underline"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Toutes les entreprises →
          </Link>
        </div>
        <p className="cap-lede mb-6 text-base">
          Lectures de 30 secondes sur les derniers filings SEC.
        </p>
        {feed.length === 0 ? (
          <p
            className="text-center"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--fg-muted)",
              fontStyle: "italic",
            }}
          >
            Aucune carte aujourd&apos;hui. C&apos;est aussi ça, investir long terme.
          </p>
        ) : (
          <ul className="space-y-3">
            {feed.map((card) => {
              const company = first(card.companies);
              const extraction = first(card.extractions);
              const oneThing = extraction?.the_one_thing;
              return (
                <li key={card.id}>
                  <Link
                    href={`/ticker/${company ? encodeURIComponent(company.ticker) : ""}`}
                    className="block"
                  >
                    <Card className="transition hover:border-primary/40 hover:shadow-md">
                      <CardContent className="p-5">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="flex items-baseline gap-2">
                            <span
                              className="cap-num text-sm font-semibold"
                              style={{ color: "var(--ink-700)" }}
                            >
                              {company?.ticker ?? "?"}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {company?.name ?? ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {card.tone ? (
                              <Badge
                                variant={toneVariants[card.tone] ?? "outline"}
                                className="text-[10px] uppercase tracking-wide"
                              >
                                {card.tone.replace("_", " ")}
                              </Badge>
                            ) : null}
                            <span
                              className="text-xs"
                              style={{
                                color: "var(--fg-subtle)",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              {relativeDate(card.published_at)}
                            </span>
                          </div>
                        </div>
                        {oneThing ? (
                          <p
                            className="text-[16px] leading-snug"
                            style={{
                              fontFamily: "var(--font-serif)",
                              color: "var(--fg)",
                              fontWeight: 500,
                            }}
                          >
                            {oneThing}
                          </p>
                        ) : (
                          <p className="text-sm italic text-muted-foreground">
                            {card.title}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          {card.title}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Footer />
    </main>
  );
}

// ========================================================================
// Landing — Capucine editorial treatment.
// Cream paper, forest + terracotta, Inter Tight + Source Serif 4.
// Sections: Hero · Features · Pricing · Newsletter · Footer.
// ========================================================================

function Landing() {
  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/" />

      {/* Hero */}
      <HeroSection />

      {/* Features */}
      <FeaturesSection />

      {/* Pricing */}
      <PricingSection />

      {/* Newsletter teaser */}
      <NewsletterSection />

      <Footer />
    </main>
  );
}

function HeroSection() {
  return (
    <section
      className="relative mx-auto overflow-hidden px-8 pt-24 pb-16"
      style={{ maxWidth: "1280px" }}
    >
      <img
        src="/capucine/pattern-branches.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute select-none"
        style={{
          right: "-80px",
          top: "24px",
          width: "600px",
          opacity: 0.55,
        }}
      />
      <div className="relative" style={{ maxWidth: "720px" }}>
        <div className="cap-eyebrow">
          Numéro 124 · dimanche 26 avril
        </div>
        <h1 className="cap-display mt-4 mb-6">
          Ta liberté financière commence par{" "}
          <em>une lecture du dimanche.</em>
        </h1>
        <p className="cap-lede mb-8" style={{ maxWidth: "600px" }}>
          Une newsletter, des alertes, un coach. Pour que ton argent travaille
          pendant que tu dors — sans que tu deviennes trader.
        </p>
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-[15px] font-medium transition-colors"
            style={{
              fontFamily: "var(--font-display)",
              background: "var(--forest-600)",
              color: "var(--paper-50)",
              letterSpacing: "-0.005em",
            }}
          >
            Commencer · gratuit
          </Link>
          <Link
            href="/articles"
            className="inline-flex items-center gap-1 px-1 py-3 text-[14px] font-medium transition-colors"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--forest-600)",
            }}
          >
            Lire le dernier numéro →
          </Link>
        </div>
        <div
          className="flex flex-wrap items-center gap-3 text-[13px]"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--fg-muted)",
          }}
        >
          <span>
            <strong style={{ color: "var(--fg)", fontWeight: 600 }}>
              32 410
            </strong>{" "}
            lecteurs
          </span>
          <span style={{ color: "var(--fg-subtle)" }}>·</span>
          <span>Édité chaque dimanche depuis 2024</span>
          <span style={{ color: "var(--fg-subtle)" }}>·</span>
          <span>Sans publicité</span>
        </div>
      </div>
    </section>
  );
}

const FEATURES: {
  eyebrow: string;
  title: string;
  body: string;
  illo: string;
}[] = [
  {
    eyebrow: "01",
    title: "Le journal",
    body: "Une édition longue le dimanche, trois brèves en semaine. Pour comprendre, pas pour réagir.",
    illo: "newspaper",
  },
  {
    eyebrow: "02",
    title: "Alertes éprouvées",
    body: "Nos signaux ne sont publiés qu'après quinze ans de back-test. Quand le marché bouge, on prévient — pas avant.",
    illo: "curve",
  },
  {
    eyebrow: "03",
    title: "Coach IA",
    body: "Pose une question à toute heure. Le coach répond comme un ami patient qui aurait lu tous les rapports.",
    illo: "cafe",
  },
  {
    eyebrow: "04",
    title: "Optimisation fiscale",
    body: "PEA, CTO, assurance-vie : trois enveloppes, des règles claires, un simulateur qui parle français.",
    illo: "envelope",
  },
  {
    eyebrow: "05",
    title: "Recherche institutionnelle",
    body: "Les notes que les banques d'affaires gardent pour leurs clients. Ici, en accès direct, traduites.",
    illo: "window",
  },
  {
    eyebrow: "06",
    title: "Documents trimestriels",
    body: "Chaque rapport d'entreprise, résumé en deux pages. Tu lis les chiffres, pas le jargon.",
    illo: "newspaper",
  },
];

function FeaturesSection() {
  return (
    <section
      className="mx-auto pb-20 pt-16"
      style={{ maxWidth: "1280px" }}
    >
      <div className="px-8 pb-8">
        <div className="cap-eyebrow">Ce qu&apos;on fait</div>
        <h2 className="cap-h1 mt-3" style={{ maxWidth: "720px" }}>
          Six outils, une seule philosophie&nbsp;: 1&nbsp;% mieux chaque jour.
        </h2>
      </div>
      <div className="grid gap-6 px-8 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <article key={f.eyebrow} className="cap-card">
            <img
              src={`/capucine/illustrations/${f.illo}.svg`}
              alt=""
              className="h-[72px] w-[96px]"
              style={{ opacity: 0.85 }}
            />
            <div
              className="mt-3 text-[11px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--terracotta-500)",
              }}
            >
              {f.eyebrow}
            </div>
            <h3 className="cap-h3 mt-1.5 text-[22px]">{f.title}</h3>
            <p
              className="mt-2 text-[15px] leading-snug"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--fg-muted)",
                lineHeight: 1.55,
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
    <section
      id="tarifs"
      className="py-20"
      style={{ background: "var(--paper-100)" }}
    >
      <div className="mx-auto px-8 text-center" style={{ maxWidth: "720px" }}>
        <div className="cap-eyebrow">Abonnement mensuel</div>
        <h2 className="cap-h1 mt-3 mx-auto">
          Trois formules. Pas de frais cachés. Annulable en un clic.
        </h2>
      </div>
      <div
        className="mx-auto mt-12 grid gap-5 px-8 md:grid-cols-3"
        style={{ maxWidth: "1080px" }}
      >
        {TIERS.map((t) => (
          <article
            key={t.id}
            className={`cap-tier ${t.featured ? "cap-tier-featured" : ""}`}
            style={t.featured ? { transform: "translateY(-8px)" } : undefined}
          >
            {t.featured ? (
              <div className="cap-tier-ribbon">La plus choisie</div>
            ) : null}
            <h3
              className="m-0 text-[22px] font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t.name}
            </h3>
            <p
              className="m-0 text-[15px] italic"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--fg-muted)",
              }}
            >
              {t.tag}
            </p>
            <div
              className="flex items-baseline gap-1.5 py-2"
              style={{
                borderTop: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span
                className="cap-num"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "56px",
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
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
                  style={{ color: "var(--fg)", lineHeight: 1.45 }}
                >
                  <CheckIcon />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={t.href}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[14px] font-medium transition-colors"
              style={{
                fontFamily: "var(--font-display)",
                background: t.featured
                  ? "var(--forest-600)"
                  : "var(--bg-elevated)",
                color: t.featured ? "var(--paper-50)" : "var(--fg)",
                border: t.featured
                  ? "1px solid var(--forest-600)"
                  : "1px solid var(--border-strong)",
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        color: "var(--forest-600)",
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
