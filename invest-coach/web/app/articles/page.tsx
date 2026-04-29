import Link from "next/link";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ARTICLES } from "./articles";

export const metadata = {
  title: "Articles — Invest Coach",
  description:
    "Guides pratiques pour investir en France : PEA, assurance-vie, fiscalité, stratégie long terme.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ArticlesIndexPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/articles" />

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
              <span className="ic-pill-badge">Le journal</span>
              Édité chaque semaine
            </span>
          </div>
          <h1 className="ic-h1 mx-auto" style={{ maxWidth: "720px" }}>
            Articles
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
            Les bases, sans jargon. Chaque article est pensé pour te faire
            gagner du temps — pas pour te vendre un produit.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 pt-4 pb-12 sm:px-8">
        {ARTICLES.length > 0 ? (
          <Link
            href={`/articles/${ARTICLES[0].slug}`}
            className="mb-8 block ic-card-pastel-lavender"
            style={{
              borderRadius: "var(--r-2xl)",
              padding: "32px",
              border: "1px solid rgba(124,91,250,0.14)",
              transition: "all 200ms var(--ease-standard)",
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
              À la une · {ARTICLES[0].readMinutes} min de lecture
            </div>
            <h2
              className="mt-3 text-[28px] font-bold"
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.025em",
                color: "var(--ink-700)",
                lineHeight: 1.15,
              }}
            >
              {ARTICLES[0].title}
            </h2>
            <p
              className="mt-3 text-[16px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--fg-muted)",
                lineHeight: 1.55,
              }}
            >
              {ARTICLES[0].teaser}
            </p>
            <p
              className="mt-5 text-[13px] font-semibold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--lavender-700)",
              }}
            >
              Lire l&apos;article →
            </p>
          </Link>
        ) : null}

        <ul className="space-y-3">
          {ARTICLES.slice(1).map((a) => (
            <li key={a.slug}>
              <Link href={`/articles/${a.slug}`} className="block">
                <article
                  className="rounded-2xl px-6 py-5 transition-all"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3
                      className="text-[19px] font-bold leading-snug"
                      style={{
                        fontFamily: "var(--font-display)",
                        letterSpacing: "-0.015em",
                        color: "var(--ink-700)",
                      }}
                    >
                      {a.title}
                    </h3>
                    <span
                      className="shrink-0 text-[11px]"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "var(--fg-subtle)",
                      }}
                    >
                      {a.readMinutes} min
                    </span>
                  </div>
                  <p
                    className="mt-2 text-[14px]"
                    style={{
                      fontFamily: "var(--font-display)",
                      lineHeight: 1.55,
                      color: "var(--fg-muted)",
                    }}
                  >
                    {a.teaser}
                  </p>
                  <p
                    className="mt-3 text-[12px]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--fg-subtle)",
                    }}
                  >
                    {formatDate(a.updated)}
                  </p>
                </article>
              </Link>
            </li>
          ))}
        </ul>

        <p
          className="mt-12 text-[12px] italic"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--fg-subtle)",
          }}
        >
          Invest Coach publie des contenus éducatifs. Rien de ce qui est écrit
          ici ne constitue un conseil en investissement personnalisé.
        </p>
      </div>
      <Footer />
    </main>
  );
}
