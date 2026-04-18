import Link from "next/link";

import { supabase } from "@/lib/supabase";

type Company = {
  id: number;
  ticker: string;
  name: string;
  country: string;
  exchange: string | null;
};

type CardRow = {
  company_id: number;
  published_at: string;
};

export default async function Home() {
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, ticker, name, country, exchange")
    .order("ticker");

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <pre className="mt-4 text-sm">{error.message}</pre>
      </main>
    );
  }

  const { data: cards } = await supabase
    .from("cards")
    .select("company_id, published_at")
    .order("published_at", { ascending: false });

  const latestByCompany = new Map<number, string>();
  for (const row of (cards ?? []) as CardRow[]) {
    if (!latestByCompany.has(row.company_id)) {
      latestByCompany.set(row.company_id, row.published_at);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Invest Coach</h1>
          <p className="mt-2 text-slate-600">
            Companies we track — {companies?.length ?? 0} tickers
          </p>
        </header>
        <ul className="space-y-2">
          {companies?.map((c: Company) => {
            const latestAt = latestByCompany.get(c.id);
            return (
              <li key={c.id}>
                <Link
                  href={`/ticker/${encodeURIComponent(c.ticker)}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-400 hover:shadow"
                >
                  <div>
                    <span className="font-mono text-sm font-semibold text-slate-900">
                      {c.ticker}
                    </span>
                    <span className="ml-3 text-slate-700">{c.name}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-slate-500">
                      {c.country} · {c.exchange}
                    </span>
                    {latestAt ? (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                        card · {new Date(latestAt).toLocaleDateString()}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
