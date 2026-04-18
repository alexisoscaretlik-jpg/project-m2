import Link from "next/link";

import { Nav } from "@/components/nav";
import { SubscribeForm } from "@/app/newsletter/subscribe-form";
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
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) return <Landing />;

  const { data: cards } = await supabase
    .from("cards")
    .select(
      "id, title, tone, published_at, companies(ticker, name), extractions(the_one_thing)",
    )
    .order("published_at", { ascending: false })
    .limit(20);

  const feed = (cards ?? []) as FeedCard[];

  return (
    <main className="min-h-screen bg-slate-50">
      <Nav active="/" />
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
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-semibold text-slate-900">Invest Coach</span>
            <span className="hidden text-xs text-slate-500 sm:inline">
              · France
            </span>
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Se connecter
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 pb-16 pt-20 text-center sm:pt-28">
        <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
          Nouveau · Analyse IA des filings SEC &amp; Euronext
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Ton coach d&apos;investissement personnel.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          IA, fiscalité française et suivi bancaire — en un seul endroit.
          Optimise ton épargne, suis tes positions, paie moins d&apos;impôts.
        </p>
        <div className="mx-auto mt-8 max-w-md">
          <SubscribeForm source="hero" />
          <p className="mt-2 text-xs text-slate-500">
            Une newsletter par semaine. Zéro spam. Désinscription en un clic.
          </p>
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-medium text-blue-700 underline">
            Connecte-toi
          </Link>
          {" · "}
          <Link
            href="/simulation"
            className="font-medium text-blue-700 underline"
          >
            Teste le simulateur
          </Link>
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            title="Analyse de filings"
            body="Les 10-K, 8-K et 20-F sont lus et résumés par IA. Trois points clés, un verdict."
          />
          <Feature
            title="Optimisation fiscale"
            body="Upload ton avis d'imposition. Claude te rend 3-5 leviers personnalisés : PEA, PER, AV, dons."
          />
          <Feature
            title="Suivi bancaire"
            body="Importe ton CSV. Catégorisation automatique. Surplus mensuel calculé pour investir."
          />
          <Feature
            title="Watchlist TradingView"
            body="Graphiques temps réel, comparaison multi-actions, indicateurs techniques."
          />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Rejoins la newsletter
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Chaque mardi matin : les filings qui comptent, une astuce fiscale
            concrète, un point sur PEA &amp; assurance-vie.
          </p>
          <div className="mx-auto mt-6 max-w-md">
            <SubscribeForm source="footer" cta="Rejoindre" />
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}
