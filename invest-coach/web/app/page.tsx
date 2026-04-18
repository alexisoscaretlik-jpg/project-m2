import Link from "next/link";

import { Nav } from "@/components/nav";
import { supabase } from "@/lib/supabase";

type CompanyRef = {
  ticker: string;
  name: string;
};

type ExtractionRef = {
  the_one_thing: string | null;
};

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

function first<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function relativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default async function Home() {
  const { data: cards, error } = await supabase
    .from("cards")
    .select(
      "id, title, tone, published_at, companies(ticker, name), extractions(the_one_thing)",
    )
    .order("published_at", { ascending: false })
    .limit(20);

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <pre className="mt-4 text-sm">{error.message}</pre>
      </main>
    );
  }

  const feed = (cards ?? []) as FeedCard[];

  return (
    <main className="min-h-screen bg-slate-50">
      <Nav active="/" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-xs text-slate-500">
            30-second reads from SEC filings
          </p>
          <Link
            href="/companies"
            className="text-xs text-blue-600 hover:underline"
          >
            All companies &rarr;
          </Link>
        </div>
        {feed.length === 0 ? (
          <p className="text-center text-slate-500">No cards yet.</p>
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
