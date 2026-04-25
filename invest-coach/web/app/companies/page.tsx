import Link from "next/link";

import { Nav } from "@/components/nav";
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

export default async function CompaniesPage() {
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, ticker, name, country, exchange")
    .order("ticker");

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-[color:var(--terracotta-500)]">Error</h1>
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
    <main className="min-h-screen bg-muted">
      <Nav active="/" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-foreground">Companies</h1>
          <p className="text-xs text-muted-foreground">
            {companies?.length ?? 0} tickers tracked
          </p>
        </div>
        <ul className="space-y-2">
          {companies?.map((c: Company) => {
            const latestAt = latestByCompany.get(c.id);
            return (
              <li key={c.id}>
                <Link
                  href={`/ticker/${encodeURIComponent(c.ticker)}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm transition hover:border-border hover:shadow"
                >
                  <div>
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {c.ticker}
                    </span>
                    <span className="ml-3 text-foreground">{c.name}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">
                      {c.country} · {c.exchange}
                    </span>
                    {latestAt ? (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-[color:var(--forest-700)]">
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
