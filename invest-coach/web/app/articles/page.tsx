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

      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-10">
          <div className="cap-eyebrow">Le journal</div>
          <h1 className="cap-h1 mt-3">Guides</h1>
          <p className="cap-lede mt-4 max-w-[640px]">
            Les bases, sans jargon. Chaque guide est pensé pour te faire gagner
            du temps — pas pour te vendre un produit.
          </p>
        </div>

        <ul className="space-y-4">
          {ARTICLES.map((a) => (
            <li key={a.slug}>
              <Link href={`/articles/${a.slug}`} className="block">
                <article className="cap-card">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2
                      className="text-[22px] font-semibold leading-snug"
                      style={{
                        fontFamily: "var(--font-display)",
                        letterSpacing: "-0.01em",
                        color: "var(--fg)",
                      }}
                    >
                      {a.title}
                    </h2>
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
                    className="mt-2 text-[15px]"
                    style={{
                      fontFamily: "var(--font-serif)",
                      lineHeight: 1.55,
                      color: "var(--fg-muted)",
                    }}
                  >
                    {a.teaser}
                  </p>
                  <p
                    className="mt-4 text-[12px]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--fg-subtle)",
                    }}
                  >
                    Mis à jour le {formatDate(a.updated)}
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
