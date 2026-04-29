import Link from "next/link";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { requireUser } from "@/lib/supabase/require-auth";

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

const toneStyles: Record<string, { bg: string; fg: string; label: string }> = {
  bullish: {
    bg: "var(--forest-50)",
    fg: "var(--forest-700)",
    label: "Solide",
  },
  cautious: {
    bg: "var(--warning-soft)",
    fg: "var(--warning)",
    label: "À surveiller",
  },
  red_flag: {
    bg: "var(--terracotta-50)",
    fg: "var(--terracotta-700)",
    label: "Signal rouge",
  },
  educational: {
    bg: "var(--lavender-50)",
    fg: "var(--lavender-700)",
    label: "Pédagogique",
  },
};

function first<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

function formatFrenchDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/watchlist" />

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
              <span className="ic-pill-badge">Suivi</span>
              {watched.length} entreprise{watched.length === 1 ? "" : "s"} suivie{watched.length === 1 ? "" : "s"}
            </span>
          </div>
          <h1 className="ic-h1 mx-auto" style={{ maxWidth: "720px" }}>
            Watchlist
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
            Suis les entreprises qui te concernent. Pas de prix en temps réel —
            on te ping quand une publication compte vraiment.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 pt-4 pb-16 sm:px-8">
        {watched.length > 0 ? (
          <section>
            <div
              className="mb-3 text-[11px] font-semibold uppercase"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--lavender-700)",
                letterSpacing: "0.12em",
              }}
            >
              Tu suis
            </div>
            <ul className="space-y-2">
              {watched.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-2xl px-5 py-4"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Link
                    href={`/ticker/${encodeURIComponent(c.ticker)}`}
                    className="flex items-baseline gap-3"
                  >
                    <span
                      className="text-[14px] font-semibold"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "var(--ink-700)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {c.ticker}
                    </span>
                    <span
                      className="text-[14px]"
                      style={{
                        fontFamily: "var(--font-display)",
                        color: "var(--fg)",
                      }}
                    >
                      {c.name}
                    </span>
                  </Link>
                  <form action={removeFromWatchlist}>
                    <input type="hidden" name="company_id" value={c.id} />
                    <button
                      type="submit"
                      className="text-[12px] transition-colors hover:text-[var(--terracotta-500)]"
                      style={{
                        fontFamily: "var(--font-display)",
                        color: "var(--fg-muted)",
                      }}
                    >
                      Retirer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section
            className="ic-card-pastel-lavender"
            style={{
              borderRadius: "var(--r-2xl)",
              padding: "32px 28px",
              border: "1px solid rgba(124,91,250,0.14)",
            }}
          >
            <div
              className="text-[11px] font-semibold uppercase"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--lavender-700)",
                letterSpacing: "0.12em",
              }}
            >
              Ta liste est vide
            </div>
            <h2
              className="mt-2 text-[22px] font-bold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--ink-700)",
                letterSpacing: "-0.02em",
              }}
            >
              Ajoute ta première action.
            </h2>
            <p
              className="mt-2 text-[15px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--fg-muted)",
                lineHeight: 1.55,
              }}
            >
              Choisis une entreprise dans la liste ci-dessous. On t&apos;enverra
              les coachings dès qu&apos;elle publie un événement public —
              rapport trimestriel, alerte AMF, changement de direction.
            </p>
          </section>
        )}

        {addable.length > 0 ? (
          <section className="mt-10">
            <div
              className="mb-3 text-[11px] font-semibold uppercase"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--lavender-700)",
                letterSpacing: "0.12em",
              }}
            >
              Ajouter une entreprise
            </div>
            <ul className="flex flex-wrap gap-2">
              {addable.map((c) => (
                <li key={c.id}>
                  <form action={addToWatchlist}>
                    <input type="hidden" name="ticker" value={c.ticker} />
                    <button
                      type="submit"
                      className="rounded-full px-4 py-2 transition-all hover:translate-y-[-1px]"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--paper-300)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      <span
                        className="text-[13px] font-semibold"
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "var(--ink-700)",
                        }}
                      >
                        {c.ticker}
                      </span>
                      <span
                        className="ml-2 text-[13px]"
                        style={{ color: "var(--fg-muted)" }}
                      >
                        {c.name}
                      </span>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {feed.length > 0 ? (
          <section className="mt-12">
            <div
              className="mb-3 text-[11px] font-semibold uppercase"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--lavender-700)",
                letterSpacing: "0.12em",
              }}
            >
              Coachings récents
            </div>
            <ul className="space-y-3">
              {feed.map((card) => {
                const company = first(card.companies);
                const tone = card.tone ?? "educational";
                const toneStyle = toneStyles[tone] ?? toneStyles.educational;
                return (
                  <li key={card.id}>
                    <Link
                      href={`/ticker/${company ? encodeURIComponent(company.ticker) : ""}`}
                      className="block rounded-2xl px-5 py-5 transition-all hover:translate-y-[-1px] hover:shadow-md"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div className="mb-2 flex items-center gap-3">
                        <span
                          className="text-[13px] font-semibold"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "var(--ink-700)",
                          }}
                        >
                          {company?.ticker ?? "?"}
                        </span>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                          style={{
                            fontFamily: "var(--font-display)",
                            background: toneStyle.bg,
                            color: toneStyle.fg,
                            letterSpacing: "0.06em",
                          }}
                        >
                          {toneStyle.label}
                        </span>
                      </div>
                      <p
                        className="text-[16px] font-semibold"
                        style={{
                          fontFamily: "var(--font-display)",
                          color: "var(--ink-700)",
                          lineHeight: 1.4,
                          letterSpacing: "-0.015em",
                        }}
                      >
                        {card.title}
                      </p>
                      <p
                        className="mt-1.5 text-[12px]"
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "var(--fg-subtle)",
                        }}
                      >
                        {formatFrenchDate(card.published_at)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
      <Footer />
    </main>
  );
}
