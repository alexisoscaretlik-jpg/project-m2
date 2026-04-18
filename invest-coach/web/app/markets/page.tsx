import { Nav } from "@/components/nav";
import { TvTickerTape } from "@/components/tv-ticker-tape";
import { TvMarketOverview } from "@/components/tv-market-overview";
import { TvScreener } from "@/components/tv-screener";
import { TvEconomicCalendar } from "@/components/tv-economic-calendar";

export const metadata = {
  title: "Marchés — Invest Coach",
  description:
    "Indices, top movers CAC 40 & US, agenda macro. La photo du marché en temps réel.",
};

export default function MarketsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Nav active="/markets" />
      <TvTickerTape />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Marchés</h1>
          <p className="mt-1 text-sm text-slate-600">
            Indices, top movers et agenda macro. En direct.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Vue d&apos;ensemble
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <TvMarketOverview />
          </div>
        </section>

        <section className="mb-10 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Top gagnants — France
            </h2>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <TvScreener
                market="france"
                defaultScreen="top_gainers"
                height={480}
              />
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Top perdants — France
            </h2>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <TvScreener
                market="france"
                defaultScreen="top_losers"
                height={480}
              />
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Agenda macro — cette semaine
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <TvEconomicCalendar />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Les plus capitalisées — US
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <TvScreener
              market="america"
              defaultScreen="most_capitalized"
              height={560}
            />
          </div>
        </section>

        <p className="text-xs text-slate-400">
          Données fournies par TradingView. Décalées de 15 minutes sur certains
          marchés. Pas un conseil en investissement.
        </p>
      </div>
    </main>
  );
}
