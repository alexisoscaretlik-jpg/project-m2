import { supabase } from "@/lib/supabase";

type Company = {
  id: number;
  ticker: string;
  name: string;
  country: string;
  exchange: string | null;
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
          {companies?.map((c: Company) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div>
                <span className="font-mono text-sm font-semibold text-slate-900">
                  {c.ticker}
                </span>
                <span className="ml-3 text-slate-700">{c.name}</span>
              </div>
              <span className="text-xs text-slate-500">
                {c.country} · {c.exchange}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
