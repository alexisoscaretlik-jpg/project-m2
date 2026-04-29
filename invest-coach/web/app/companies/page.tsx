import Link from "next/link";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { supabase } from "@/lib/supabase";

export const metadata = {
  title: "Entreprises — Invest Coach",
  description:
    "Toutes les entreprises suivies par Invest Coach : tickers, pays, dernier card publié.",
};

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function CompaniesPage() {
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, ticker, name, country, exchange")
    .order("ticker");

  if (error) {
    return (
      <main className="min-h-screen p-8" style={{ background: "var(--paper-50)" }}>
        <Nav active="/companies" />
        <h1 className="ic-h2 mt-8" style={{ color: "var(--terracotta-500)" }}>
          Erreur
        </h1>
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

  const list = (companies ?? []) as Company[];

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/companies" />

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
              <span className="ic-pill-badge">Entreprises</span>
              {list.length} tickers suivis
            </span>
          </div>
          <h1 className="ic-h1 mx-auto" style={{ maxWidth: "720px" }}>
            Les entreprises qu&apos;on regarde, <em>une par une.</em>
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
            Pas de listes infinies. Une sélection volontaire de cotées
            européennes et américaines, chacune avec sa fiche maintenue.
          </p>

          {/* Decorative skyline-tiles illustration. */}
          <svg
            aria-hidden="true"
            className="mx-auto mt-10"
            width="180"
            height="48"
            viewBox="0 0 180 48"
            fill="none"
          >
            <rect x="6"   y="20" width="22" height="22" rx="2" fill="var(--lavender-300)" opacity="0.7" />
            <rect x="34"  y="12" width="22" height="30" rx="2" fill="var(--lavender-400)" opacity="0.85" />
            <rect x="62"  y="6"  width="22" height="36" rx="2" fill="var(--lavender-500)" />
            <rect x="90"  y="14" width="22" height="28" rx="2" fill="var(--lavender-400)" opacity="0.85" />
            <rect x="118" y="22" width="22" height="20" rx="2" fill="var(--lavender-300)" opacity="0.7" />
            <rect x="146" y="10" width="22" height="32" rx="2" fill="var(--lavender-400)" opacity="0.85" />
            <line x1="0" y1="44" x2="180" y2="44" stroke="var(--border)" strokeWidth="1" />
          </svg>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
        <ul className="space-y-2">
          {list.map((c) => {
            const latestAt = latestByCompany.get(c.id);
            return (
              <li key={c.id}>
                <Link
                  href={`/ticker/${encodeURIComponent(c.ticker)}`}
                  className="flex items-center justify-between rounded-2xl px-5 py-4 transition-colors"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="min-w-0">
                    <span
                      className="font-mono text-[13px] font-semibold"
                      style={{ color: "var(--ink-700)" }}
                    >
                      {c.ticker}
                    </span>
                    <span
                      className="ml-3 text-[15px]"
                      style={{
                        fontFamily: "var(--font-display)",
                        color: "var(--ink-700)",
                      }}
                    >
                      {c.name}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className="text-[11px]"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "var(--fg-subtle)",
                      }}
                    >
                      {c.country}
                      {c.exchange ? ` · ${c.exchange}` : ""}
                    </span>
                    {latestAt ? (
                      <span
                        className="text-[10px] font-semibold uppercase"
                        style={{
                          fontFamily: "var(--font-display)",
                          color: "var(--forest-700)",
                          letterSpacing: "0.08em",
                        }}
                      >
                        Card · {formatDate(latestAt)}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <Footer />
    </main>
  );
}
