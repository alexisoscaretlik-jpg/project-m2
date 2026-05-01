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

// Smartphone (Unsplash qUJ8fgoaLTg) — modern, calm, mobile-first feel
// fits the watchlist alert metaphor.
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1773332611514-238856b76198?auto=format&fit=crop&w=1600&q=85";

// Tone → palette C pastel. No greens / reds / yellows. Direction is
// signalled through pastel background only; border + text stay ink.
const TONE_BG: Record<string, string> = {
  bullish: "var(--lavender-200)",      // solide → lilac
  cautious: "var(--terracotta-100)",   // à surveiller → peach
  red_flag: "var(--rose-100)",         // signal rouge → rose
  educational: "var(--paper-100)",     // pédagogique → off-white
};
const TONE_LABEL: Record<string, string> = {
  bullish: "solide",
  cautious: "à surveiller",
  red_flag: "signal rouge",
  educational: "pédagogique",
};

function first<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

function formatDateMono(iso: string) {
  const d = new Date(iso);
  const months = [
    "JAN", "FÉV", "MAR", "AVR", "MAI", "JUI",
    "JUL", "AOÛ", "SEP", "OCT", "NOV", "DÉC",
  ];
  return `${months[d.getMonth()]} ${d.getDate()} · ${d.getFullYear()}`;
}

export default async function WatchlistPage() {
  const { supabase: sb } = await requireUser("/watchlist");

  // All Supabase calls wrapped in try/catch so the page never crashes
  // when env is missing in dev preview.
  let watched: Company[] = [];
  let addable: Company[] = [];
  let feed: FeedCard[] = [];

  try {
    const { data: rows } = await sb
      .from("watchlist")
      .select("company_id, companies(id, ticker, name, country)")
      .order("created_at", { ascending: false });

    watched = ((rows ?? []) as WatchlistRow[])
      .map((r) => first(r.companies))
      .filter((c): c is Company => !!c);

    const { data: allCompanies } = await sb
      .from("companies")
      .select("id, ticker, name, country")
      .order("ticker");

    const watchedIds = new Set(watched.map((c) => c.id));
    addable = ((allCompanies ?? []) as Company[]).filter(
      (c) => !watchedIds.has(c.id),
    );

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
  } catch {
    // Stay quiet — the empty-state UI handles "no data" gracefully.
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/watchlist" />

      {/* Row 1 — peach hero with mega wordmark stack. */}
      <section
        className="ic-block-peach px-6 pt-12 pb-8 sm:px-8 sm:pt-16 sm:pb-12"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
        aria-labelledby="watchlist-mark"
      >
        <span className="ic-eyebrow-mono">Watchlist</span>
        <h1 id="watchlist-mark" className="mt-5">
          <span className="ic-mega" style={{ fontSize: "clamp(56px, 13vw, 200px)" }}>
            TES ENTREPRISES
          </span>
          <span className="ic-mega" style={{ fontSize: "clamp(56px, 13vw, 200px)" }}>
            TON COACH
          </span>
        </h1>
      </section>

      {/* Row 2 — mono tagline strip. */}
      <p className="ic-strip">
        Publications trimestrielles · Alertes AMF · Pas de prix temps réel · Pas de signal d&apos;achat
      </p>

      {/* Row 3 — lilac × smartphone photo split. */}
      <div
        className="grid md:grid-cols-2"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        <div
          className="ic-block-lilac flex min-h-[420px] flex-col justify-between px-6 py-12 sm:px-10 sm:py-16 md:min-h-[520px]"
          style={{ borderRight: "1px solid var(--ink-700)" }}
        >
          <div>
            <span className="ic-eyebrow-mono mb-6 inline-flex">La méthode</span>
            <h2
              className="ic-bigsection mb-6"
              style={{ fontSize: "clamp(34px, 5vw, 72px)" }}
            >
              Tu choisis.<br />On lit.<br />On t&apos;explique.
            </h2>
            <p
              className="max-w-[440px] text-[16px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--ink-700)",
                lineHeight: 1.55,
              }}
            >
              Suis les sociétés cotées qui te concernent vraiment. À chaque
              publication trimestrielle ou alerte AMF, on t&apos;envoie une
              lecture éducative en français : earnings, guidance, changements
              de direction. Jamais de notification commerciale. Jamais de prix
              en temps réel.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <span
              className="text-[11px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--ink-700)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {watched.length} {watched.length === 1 ? "entreprise suivie" : "entreprises suivies"}
            </span>
            {feed.length > 0 ? (
              <span
                className="text-[11px]"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--ink-700)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                · {feed.length} coachings récents
              </span>
            ) : null}
          </div>
        </div>

        <div
          className="relative min-h-[260px] md:min-h-[520px]"
          style={{ background: "var(--ink-700)" }}
        >
          <img
            src={HERO_PHOTO}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ display: "block" }}
          />
        </div>
      </div>

      {/* Row 4 — your watchlist (or empty state) + add-companies row. */}
      <section
        className="px-6 py-16 sm:px-8 sm:py-20"
        style={{
          background: "var(--paper-0)",
          borderBottom: "1px solid var(--ink-700)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "1280px" }}>
          {watched.length > 0 ? (
            <>
              <div className="mb-6 flex items-baseline justify-between gap-4">
                <span className="ic-eyebrow-mono">Tu suis</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--fg-muted)",
                  }}
                >
                  {watched.length} {watched.length > 1 ? "actifs" : "actif"}
                </span>
              </div>
              <ul
                className="grid"
                style={{ border: "1px solid var(--ink-700)" }}
              >
                {watched.map((c, i) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8"
                    style={{
                      borderBottom:
                        i < watched.length - 1
                          ? "1px solid var(--ink-700)"
                          : "none",
                    }}
                  >
                    <Link
                      href={`/ticker/${encodeURIComponent(c.ticker)}`}
                      className="flex items-baseline gap-4 transition-opacity hover:opacity-70"
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "13px",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "var(--ink-700)",
                          minWidth: "80px",
                        }}
                      >
                        ↳ {c.ticker}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "var(--ink-700)",
                        }}
                      >
                        {c.name}
                      </span>
                    </Link>
                    <form action={removeFromWatchlist}>
                      <input type="hidden" name="company_id" value={c.id} />
                      <button
                        type="submit"
                        className="ic-btn-block-light"
                        style={{ padding: "8px 14px", fontSize: "11px" }}
                      >
                        ↳ Retirer
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div
              className="ic-block-rose"
              style={{
                border: "1px solid var(--ink-700)",
                padding: "40px 32px",
                maxWidth: "640px",
              }}
            >
              <span className="ic-eyebrow-mono">Ta liste est vide</span>
              <h2
                className="ic-bigsection mt-4"
                style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
              >
                Ajoute ta<br />première action.
              </h2>
              <p
                className="mt-4 text-[15px]"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--ink-700)",
                  lineHeight: 1.55,
                  maxWidth: "480px",
                }}
              >
                Choisis une entreprise dans la liste ci-dessous. À chaque
                publication trimestrielle ou alerte AMF, tu reçois un coaching
                éducatif rédigé en français.
              </p>
            </div>
          )}

          {addable.length > 0 ? (
            <section className="mt-14">
              <span className="ic-eyebrow-mono">Ajouter une entreprise</span>
              <ul
                className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                style={{ border: "1px solid var(--ink-700)" }}
              >
                {addable.slice(0, 16).map((c, idx) => {
                  const colCount = 4;
                  const col = idx % colCount;
                  const totalRows = Math.ceil(Math.min(addable.length, 16) / colCount);
                  const row = Math.floor(idx / colCount);
                  const isLastRow = row === totalRows - 1;
                  return (
                    <li
                      key={c.id}
                      style={{
                        borderRight:
                          col < colCount - 1
                            ? "1px solid var(--ink-700)"
                            : "none",
                        borderBottom: !isLastRow ? "1px solid var(--ink-700)" : "none",
                      }}
                    >
                      <form action={addToWatchlist} className="block h-full">
                        <input type="hidden" name="ticker" value={c.ticker} />
                        <button
                          type="submit"
                          className="block w-full px-5 py-5 text-left transition-colors hover:bg-[var(--paper-100)]"
                        >
                          <div
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "13px",
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              color: "var(--ink-700)",
                            }}
                          >
                            ↳ {c.ticker}
                          </div>
                          <div
                            className="mt-1.5"
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: "14px",
                              color: "var(--ink-700)",
                              lineHeight: 1.3,
                              opacity: 0.75,
                            }}
                          >
                            {c.name}
                          </div>
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
      </section>

      {/* Row 5 — recent coachings feed (if any). */}
      {feed.length > 0 ? (
        <section
          className="px-6 py-16 sm:px-8"
          style={{
            background: "var(--paper-0)",
            borderBottom: "1px solid var(--ink-700)",
          }}
        >
          <div className="mx-auto" style={{ maxWidth: "1280px" }}>
            <span className="ic-eyebrow-mono">Coachings récents</span>
            <ul
              className="mt-8 grid gap-0 md:grid-cols-2 lg:grid-cols-3"
              style={{ border: "1px solid var(--ink-700)" }}
            >
              {feed.map((card, idx) => {
                const company = first(card.companies);
                const tone = card.tone ?? "educational";
                const col = idx % 3;
                const isLastRow = idx >= feed.length - (feed.length % 3 || 3);
                return (
                  <li
                    key={card.id}
                    style={{
                      borderRight:
                        col < 2 ? "1px solid var(--ink-700)" : "none",
                      borderBottom: !isLastRow ? "1px solid var(--ink-700)" : "none",
                    }}
                  >
                    <Link
                      href={`/ticker/${company ? encodeURIComponent(company.ticker) : ""}`}
                      className="block h-full transition-colors hover:bg-[var(--paper-100)]"
                    >
                      <article className="flex h-full flex-col gap-3 p-6">
                        <div className="flex items-baseline justify-between gap-3">
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "12px",
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: "var(--ink-700)",
                            }}
                          >
                            ↳ {company?.ticker ?? "?"}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "10px",
                              fontWeight: 700,
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                              color: "var(--ink-700)",
                              border: "1px solid var(--ink-700)",
                              padding: "3px 8px",
                              background: TONE_BG[tone] ?? TONE_BG.educational,
                            }}
                          >
                            {TONE_LABEL[tone] ?? "neutre"}
                          </span>
                        </div>
                        <h3
                          className="flex-1"
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "18px",
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                            lineHeight: 1.25,
                            color: "var(--ink-700)",
                            textTransform: "uppercase",
                          }}
                        >
                          {card.title}
                        </h3>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "var(--fg-muted)",
                          }}
                        >
                          {formatDateMono(card.published_at)}
                        </span>
                      </article>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Disclaimer strip. */}
      <p className="ic-strip">
        Lecture éducative · Pas de prix temps réel · Pas un conseil en investissement personnalisé
      </p>

      <Footer />
    </main>
  );
}
