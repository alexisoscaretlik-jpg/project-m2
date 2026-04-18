import Link from "next/link";

import { Nav } from "@/components/nav";
import { SubscribeForm } from "@/app/newsletter/subscribe-form";
import { TvTickerTape } from "@/components/tv-ticker-tape";
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

const toneStyles: Record<string, string> = {
  bullish: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cautious: "bg-amber-100 text-amber-800 border-amber-200",
  red_flag: "bg-rose-100 text-rose-800 border-rose-200",
  educational: "bg-slate-100 text-slate-700 border-slate-200",
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
  } catch {
    // If Supabase is unreachable or cookies are malformed, show the
    // public landing rather than crashing the root route.
  }

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
    <main className="min-h-screen bg-slate-50">
      <Nav active="/" />
      <TvTickerTape />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-xs text-slate-500">
            Lectures de 30 secondes sur les derniers filings SEC
          </p>
          <Link
            href="/companies"
            className="text-xs text-blue-600 hover:underline"
          >
            Toutes les entreprises &rarr;
          </Link>
        </div>
        {feed.length === 0 ? (
          <p className="text-center text-slate-500">Pas encore de cartes.</p>
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
                    className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400 hover:shadow"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-sm font-semibold text-slate-900">
                          {company?.ticker ?? "?"}
                        </span>
                        <span className="text-sm text-slate-600">
                          {company?.name ?? ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {card.tone ? (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                              toneStyles[card.tone] ?? toneStyles.educational
                            }`}
                          >
                            {card.tone.replace("_", " ")}
                          </span>
                        ) : null}
                        <span className="text-xs text-slate-400">
                          {relativeDate(card.published_at)}
                        </span>
                      </div>
                    </div>
                    {oneThing ? (
                      <p className="text-[15px] font-medium leading-snug text-slate-900">
                        {oneThing}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500 italic">
                        {card.title}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-400">{card.title}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

function Landing() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      <header className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-semibold text-slate-900">Invest Coach</span>
            <span className="hidden text-xs text-slate-500 sm:inline">
              · France
            </span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-slate-600 md:flex">
            <Link href="/markets" className="hover:text-slate-900">
              Marchés
            </Link>
            <Link href="/simulation" className="hover:text-slate-900">
              Simulateur
            </Link>
            <Link href="/articles" className="hover:text-slate-900">
              Guides
            </Link>
            <a href="#tarifs" className="hover:text-slate-900">
              Tarifs
            </a>
          </nav>
          <Link
            href="/login"
            className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Se connecter
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 pb-14 pt-20 text-center sm:pt-28">
        <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
          🇫🇷 Pensé pour les investisseurs particuliers français
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Investis plus intelligemment.
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Paie moins d&apos;impôts.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
          Invest Coach combine IA, fiscalité française et suivi bancaire pour
          t&apos;aider à construire ton patrimoine sereinement.
        </p>
        <div className="mx-auto mt-8 max-w-md">
          <SubscribeForm source="hero" cta="Commencer gratuitement" />
          <p className="mt-2 text-xs text-slate-500">
            1 email par semaine · 0 spam · Désinscription en un clic
          </p>
        </div>
        <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
          <span>🔒 Données hébergées en UE</span>
          <span>🤖 Claude Opus 4</span>
          <span>🏦 +150 banques compatibles</span>
          <span>📈 TradingView intégré</span>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <h2 className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
          Comment ça marche
        </h2>
        <div className="mx-auto mt-6 grid max-w-4xl gap-4 sm:grid-cols-3">
          <Step
            n={1}
            title="Connecte ton contexte"
            body="Upload ton avis d'imposition. Connecte ta banque (ou importe un CSV). Renseigne ton PEA et ton AV."
          />
          <Step
            n={2}
            title="L'IA lit tout"
            body="Claude analyse tes revenus, tes flux bancaires et les filings des entreprises que tu suis. Il repère les angles morts."
          />
          <Step
            n={3}
            title="Reçois un plan chiffré"
            body="3 à 5 actions concrètes, avec l'impact en euros. Pas de jargon. Pas de pub déguisée."
          />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          Tout ce qu&apos;un CGP te facturerait 1 500€ par an
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sans les conflits d&apos;intérêts. Sans les rétrocommissions.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            title="Analyse IA des filings"
            body="10-K, 8-K, 20-F lus et résumés. Trois points clés, un verdict, une carte en 30 secondes."
          />
          <Feature
            title="Optimisation fiscale"
            body="Upload ton avis d'imposition. 3 à 5 leviers personnalisés : PEA, PER, AV, dons, SCPI, déficit foncier."
          />
          <Feature
            title="Suivi bancaire"
            body="Connexion GoCardless ou import CSV. Catégorisation automatique. Surplus mensuel calculé."
          />
          <Feature
            title="Watchlist TradingView"
            body="Graphiques temps réel, sparklines, indicateurs techniques. CAC 40, US, Euronext."
          />
          <Feature
            title="Simulateur fiscal"
            body="Compare PEA, assurance-vie, CTO et PER sur 30 ans avec les vraies règles fiscales FR."
          />
          <Feature
            title="Guides hebdo"
            body="Newsletter du mardi : une astuce fiscale concrète, un filing qui compte, un point stratégie."
          />
        </div>
      </section>

      <section id="tarifs" className="mx-auto max-w-5xl px-4 pb-20">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          Choisis ton niveau
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Commence gratuitement. Passe à Plus quand tu veux la vue complète.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Tier
            name="Gratuit"
            price="0€"
            period="pour toujours"
            cta="Créer mon compte"
            href="/login"
            featured={false}
            features={[
              "Watchlist jusqu'à 5 entreprises",
              "Newsletter hebdo",
              "Guides fiscaux",
              "Simulateur PEA/AV/CTO/PER",
            ]}
          />
          <Tier
            name="Plus"
            price="9€"
            period="par mois"
            cta="Essayer Plus"
            href="/subscription"
            featured={true}
            badge="Le plus choisi"
            features={[
              "Watchlist illimitée",
              "Analyse IA complète de tes filings",
              "Plan fiscal personnalisé Claude",
              "Connexion bancaire GoCardless",
              "Résumé hebdo personnalisé",
              "Support email sous 24h",
            ]}
          />
          <Tier
            name="Wealth"
            price="29€"
            period="par mois"
            cta="Passer à Wealth"
            href="/subscription"
            featured={false}
            features={[
              "Tout de Plus",
              "Rebalancing automatique du portefeuille",
              "Alertes dépassement de TMI",
              "Assistant chat Claude illimité",
              "Optimisation IFI & transmission",
              "Accès bêta features",
            ]}
          />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          Les questions qu&apos;on nous pose
        </h2>
        <div className="mt-8 space-y-3">
          <Faq
            q="Est-ce que vous êtes régulés comme CIF ?"
            a="Non. Invest Coach publie du contenu éducatif et met à disposition des outils d'aide à la décision. On ne délivre aucune recommandation d'investissement personnalisée au sens de l'AMF."
          />
          <Faq
            q="Que fait l'IA exactement ?"
            a="Claude d'Anthropic lit les documents publics des entreprises (10-K, 8-K, rapports annuels), ton avis d'imposition si tu l'uploades, et tes flux bancaires si tu les importes. Elle synthétise, détecte les incohérences et propose des angles d'optimisation."
          />
          <Faq
            q="Mes données sont stockées où ?"
            a="Supabase (Irlande, UE). Chiffrées au repos. On ne revend rien. Tu peux tout supprimer depuis ton compte."
          />
          <Faq
            q="Puis-je utiliser sans connecter ma banque ?"
            a="Oui. La connexion GoCardless est optionnelle. Tu peux importer un CSV ou juste utiliser le simulateur, la watchlist et les guides."
          />
          <Faq
            q="Vous prenez des commissions sur les produits conseillés ?"
            a="Zéro. On ne vend aucun produit financier. On n'a aucun accord de rétrocession. Notre seul revenu, c'est ton abonnement."
          />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-blue-900 p-10 text-center text-white shadow-xl">
          <h2 className="text-2xl font-semibold">
            Prends 10 minutes pour ton patrimoine cette semaine.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
            Inscription gratuite. On t&apos;envoie le premier guide dès demain
            matin.
          </p>
          <div className="mx-auto mt-6 max-w-md">
            <SubscribeForm source="footer" cta="Je m'inscris" />
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row">
          <span>© Invest Coach · Paris</span>
          <span>
            Non régulé comme CIF. Contenu informatif, pas un conseil
            d&apos;investissement.
          </span>
        </div>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
        {n}
      </div>
      <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

function Tier({
  name,
  price,
  period,
  cta,
  href,
  features,
  featured,
  badge,
}: {
  name: string;
  price: string;
  period: string;
  cta: string;
  href: string;
  features: string[];
  featured: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-6 shadow-sm ${
        featured
          ? "border-blue-500 bg-white ring-2 ring-blue-500"
          : "border-slate-200 bg-white"
      }`}
    >
      {badge ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
          {badge}
        </span>
      ) : null}
      <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-slate-900">{price}</span>
        <span className="text-sm text-slate-500">/ {period}</span>
      </div>
      <ul className="mt-6 space-y-2 text-sm text-slate-700">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-600">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`mt-6 block w-full rounded-lg px-4 py-2 text-center text-sm font-medium ${
          featured
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "border border-slate-300 text-slate-900 hover:bg-slate-50"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm open:shadow-md">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-slate-900">
        {q}
        <span className="text-slate-400 transition group-open:rotate-45">+</span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{a}</p>
    </details>
  );
}
