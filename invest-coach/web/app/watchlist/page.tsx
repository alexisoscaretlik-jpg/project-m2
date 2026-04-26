import Link from "next/link";

import { Nav } from "@/components/nav";
import { TvMini } from "@/components/tv-mini";
import { TvTickerTape } from "@/components/tv-ticker-tape";
import { requireUser } from "@/lib/supabase/require-auth";
import { toTvSymbol } from "@/lib/tradingview";

import { addToWatchlist, removeFromWatchlist } from "./actions";

type Company = { id: number; ticker: string; name: string; country: string };
type WatchlistRow = { company_id: number; companies: Company | Company[] | null };

type FeedCard = {
  id: number;
  title: string;
  tone: string | null;
  published_at: string;
  company_id: number;
  companies: Company | Company[] | null;
};

const toneStyles: Record<string, string> = {
  bullish: "bg-[color:var(--forest-100)] text-[color:var(--forest-700)] border-[color:var(--forest-200)]",
  cautious: "bg-[color:var(--warning-soft)] text-[color:var(--warning)] border-[color:var(--warning)]",
  red_flag: "bg-[color:var(--terracotta-100)] text-[color:var(--terracotta-700)] border-[color:var(--terracotta-200)]",
  educational: "bg-muted text-foreground border-border",
};

function first<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export default async function WatchlistPage() {
  const { supabase: sb } = await requireUser("/watchlist");

  const { data: rows } = await sb
    .from("watchlist")
    .select("company_id, companies(id, ticker, name, country)")
    .order("created_at", { ascending: false });

  const watched = ((rows ?? []) as WatchlistRow[])
    .map((r) => first(r.companies))
    .filter((c): c is Company => !!c);

  const { data: allCompanies } = await sb
    .from("companies")
    .select("id, ticker, name, country")
    .order("ticker");

  const watchedIds = new Set(watched.map((c) => c.id));
  const addable = ((allCompanies ?? []) as Company[]).filter(
    (c) => !watchedIds.has(c.id),
  );

  let feed: FeedCard[] = [];
  if (watched.length > 0) {
    const { data: cards } = await sb
      .from("cards")
      .select(
        "id, title, tone, published_at, company_id, companies(id, ticker, name, country)",
      )
      .in("company_id", Array.from(watchedIds))
      .order("published_at", { ascending: false })
      .limit(20);
    feed = (cards ?? []) as FeedCard[];
  }

  return (
    <main className="min-h-screen bg-muted">
      <Nav active="/watchlist" />
      <TvTickerTape
        symbols={
          watched.length > 0
            ? watched.map((c) => ({
                proName: toTvSymbol(c.ticker),
                title: c.name,
              }))
            : undefined
        }
      />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold text-foreground">Ta watchlist</h1>
        <p className="text-xs text-muted-foreground">
          Les cartes des entreprises que tu suis apparaissent ici en priorité.
        </p>

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tu suis ({watched.length})
          </h2>
          {watched.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tu ne suis encore personne. Ajoute un ticker ci-dessous.
            </p>
          ) : (
            <ul className="space-y-2">
              {watched.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/ticker/${encodeURIComponent(c.ticker)}`}
                      className="flex items-baseline gap-2 hover:underline"
                    >
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {c.ticker}
                      </span>
                      <span className="text-sm text-foreground">{c.name}</span>
                    </Link>
                    <form action={removeFromWatchlist}>
                      <input type="hidden" name="company_id" value={c.id} />
                      <button
                        type="submit"
                        className="text-xs text-muted-foreground hover:text-[color:var(--terracotta-500)]"
                      >
                        Retirer
                      </button>
                    </form>
                  </div>
                  <div className="mt-2">
                    <TvMini symbol={toTvSymbol(c.ticker)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {addable.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Ajouter un ticker
            </h2>
            <ul className="flex flex-wrap gap-2">
              {addable.map((c) => (
                <li key={c.id}>
                  <form action={addToWatchlist}>
                    <input type="hidden" name="ticker" value={c.ticker} />
                    <button
                      type="submit"
                      className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:border-primary hover:bg-accent"
                    >
                      <span className="font-mono font-semibold">
                        {c.ticker}
                      </span>
                      <span className="ml-1 text-muted-foreground">{c.name}</span>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {feed.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Ton fil
            </h2>
            <ul className="space-y-3">
              {feed.map((card) => {
                const company = first(card.companies);
                return (
                  <li key={card.id}>
                    <Link
                      href={`/ticker/${company ? encodeURIComponent(company.ticker) : ""}`}
                      className="block rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-border hover:shadow"
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {company?.ticker ?? "?"}
                        </span>
                        {card.tone ? (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                              toneStyles[card.tone] ?? toneStyles.educational
                            }`}
                          >
                            {card.tone.replace("_", " ")}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-foreground">{card.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(card.published_at).toLocaleDateString()}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
