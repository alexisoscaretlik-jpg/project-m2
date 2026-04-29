import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { TvTickerTape } from "@/components/tv-ticker-tape";
import { TvMarketOverview } from "@/components/tv-market-overview";
import { TvScreener } from "@/components/tv-screener";
import { TvEconomicCalendar } from "@/components/tv-economic-calendar";

export const metadata = {
  title: "Marchés — Invest Coach",
  description:
    "Indices, top movers CAC 40 & US, agenda macro. La photo du marché en temps réel.",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-3 text-[12px] font-semibold uppercase"
      style={{
        fontFamily: "var(--font-display)",
        color: "var(--lavender-700)",
        letterSpacing: "0.16em",
      }}
    >
      {children}
    </div>
  );
}

function PanelFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="overflow-hidden"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-2xl)",
      }}
    >
      {children}
    </div>
  );
}

export default function MarketsPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/markets" />
      <TvTickerTape />

      <section
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 0%, var(--lavender-100) 0%, var(--paper-50) 60%, var(--paper-50) 100%)",
        }}
      >
        <div
          className="mx-auto px-6 pt-16 pb-10 text-center sm:px-8 sm:pt-20"
          style={{ maxWidth: "880px" }}
        >
          <div className="mb-6 flex justify-center">
            <span className="ic-pill">
              <span className="ic-pill-badge">Marchés</span>
              CAC 40 · S&amp;P 500 · Agenda macro
            </span>
          </div>
          <h1 className="ic-h1 mx-auto" style={{ maxWidth: "720px" }}>
            La photo du marché, <em>sans le bruit.</em>
          </h1>
          <p
            className="mx-auto mt-5 text-[17px]"
            style={{
              maxWidth: "560px",
              fontFamily: "var(--font-display)",
              color: "var(--fg-muted)",
              lineHeight: 1.55,
            }}
          >
            Indices, top movers, agenda macro. Tout ce dont tu as besoin pour
            te repérer le matin — rien dont tu n&apos;aies besoin.
          </p>

          {/* Decorative line-chart illustration. */}
          <svg
            aria-hidden="true"
            className="mx-auto mt-10"
            width="180"
            height="48"
            viewBox="0 0 180 48"
            fill="none"
          >
            <polyline
              points="2,36 22,28 42,32 62,18 82,22 102,12 122,20 142,8 162,14 178,4"
              stroke="var(--lavender-500)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="2,42 22,38 42,40 62,30 82,34 102,26 122,32 142,22 162,28 178,18"
              stroke="var(--lavender-300)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="3 3"
            />
            <line x1="0" y1="46" x2="180" y2="46" stroke="var(--border)" strokeWidth="1" />
          </svg>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-8">
        <section className="mb-10">
          <SectionLabel>Vue d&apos;ensemble</SectionLabel>
          <PanelFrame>
            <TvMarketOverview />
          </PanelFrame>
        </section>

        <section className="mb-10 grid gap-6 lg:grid-cols-2">
          <div>
            <SectionLabel>Top gagnants · France</SectionLabel>
            <PanelFrame>
              <TvScreener market="france" defaultScreen="top_gainers" height={480} />
            </PanelFrame>
          </div>
          <div>
            <SectionLabel>Top perdants · France</SectionLabel>
            <PanelFrame>
              <TvScreener market="france" defaultScreen="top_losers" height={480} />
            </PanelFrame>
          </div>
        </section>

        <section className="mb-10">
          <SectionLabel>Agenda macro · cette semaine</SectionLabel>
          <PanelFrame>
            <TvEconomicCalendar />
          </PanelFrame>
        </section>

        <section className="mb-12">
          <SectionLabel>Les plus capitalisées · US</SectionLabel>
          <PanelFrame>
            <TvScreener market="america" defaultScreen="most_capitalized" height={560} />
          </PanelFrame>
        </section>

        <p
          className="text-[12px]"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--fg-subtle)",
          }}
        >
          Données fournies par TradingView. Décalées de 15 minutes sur certains
          marchés. Pas un conseil en investissement personnalisé.
        </p>
      </div>

      <Footer />
    </main>
  );
}
