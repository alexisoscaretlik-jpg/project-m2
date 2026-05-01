import Link from "next/link";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ARTICLES, type Article } from "./articles";

export const metadata = {
  title: "Articles — Invest Coach",
  description:
    "Le journal de l'épargnant français : guides pratiques sur PEA, AV, fiscalité, ETF, stratégie long terme. Sans jargon, fact-checkés, mis à jour à chaque réforme.",
};

// Photos curated by Oscar (Unsplash, free commercial license).
// Cycled through articles for cover variety. Watercolor is the canonical
// "default article cover" already used in /articles/[slug] template.
const COVERS = [
  "https://images.unsplash.com/photo-1767321173860-52dea6b50337?auto=format&fit=crop&w=1600&q=85", // watercolor
  "https://images.unsplash.com/photo-1776693836271-3c25955c90de?auto=format&fit=crop&w=1600&q=85", // sailboat
  "https://images.unsplash.com/photo-1618331833071-ce81bd50d300?auto=format&fit=crop&w=1600&q=85", // abstract painting
  "https://images.unsplash.com/photo-1762760081003-28ae8d6adbbb?auto=format&fit=crop&w=1600&q=85", // balcony
  "https://images.unsplash.com/photo-1764831685497-3095f33bada2?auto=format&fit=crop&w=1600&q=85", // orange tunnel
  "https://images.unsplash.com/photo-1774618683913-b8262a72fa53?auto=format&fit=crop&w=1600&q=85", // staircase
  "https://images.unsplash.com/photo-1776066361430-dd62847db7c6?auto=format&fit=crop&w=1600&q=85", // autumn truck
  "https://images.unsplash.com/photo-1777033481363-96640776ae62?auto=format&fit=crop&w=1600&q=85", // orange/black fluid
  "https://images.unsplash.com/photo-1773332611514-238856b76198?auto=format&fit=crop&w=1600&q=85", // smartphone
];

function coverFor(idx: number): string {
  return COVERS[idx % COVERS.length];
}

function formatDateMono(iso: string) {
  const d = new Date(iso);
  const months = [
    "JAN",
    "FÉV",
    "MAR",
    "AVR",
    "MAI",
    "JUI",
    "JUL",
    "AOÛ",
    "SEP",
    "OCT",
    "NOV",
    "DÉC",
  ];
  return `${months[d.getMonth()]} ${d.getDate()} · ${d.getFullYear()}`;
}

function ArticleCard({ a, idx, num }: { a: Article; idx: number; num: number }) {
  const issueLabel = String(num).padStart(2, "0");
  return (
    <Link
      href={`/articles/${a.slug}`}
      className="group block h-full transition-colors hover:bg-[var(--paper-100)]"
    >
      <article className="ic-edcard h-full">
        <div className="ic-edcard-media">
          <img
            src={coverFor(idx)}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="ic-edcard-foot">
          <span>N° {issueLabel}</span>
          <span>{formatDateMono(a.updated)}</span>
        </div>
        <div
          className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4"
          style={{ borderTop: "1px solid var(--ink-700)" }}
        >
          <div className="flex items-baseline justify-between gap-4">
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-700)",
              }}
            >
              ↳ {a.readMinutes} min
            </span>
            <span
              aria-hidden="true"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--ink-700)",
              }}
            >
              →
            </span>
          </div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.18,
              color: "var(--ink-700)",
              textTransform: "uppercase",
            }}
          >
            {a.title}
          </h3>
          <p
            className="flex-1 text-[14px]"
            style={{
              fontFamily: "var(--font-source-serif), Georgia, serif",
              fontStyle: "italic",
              color: "var(--ink-700)",
              lineHeight: 1.55,
            }}
          >
            « {a.teaser} »
          </p>
        </div>
      </article>
    </Link>
  );
}

export default function ArticlesIndexPage() {
  const featured = ARTICLES[0] ?? null;
  const rest = ARTICLES.slice(1);

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/articles" />

      {/* Row 1 — rose pastel hero with mega wordmark stack. */}
      <section
        className="ic-block-rose px-6 pt-12 pb-8 sm:px-8 sm:pt-16 sm:pb-12"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
        aria-labelledby="articles-mark"
      >
        <span className="ic-eyebrow-mono">Le journal</span>
        <h1 id="articles-mark" className="mt-5">
          <span className="ic-mega" style={{ fontSize: "clamp(56px, 13vw, 200px)" }}>
            LE JOURNAL
          </span>
          <span className="ic-mega" style={{ fontSize: "clamp(56px, 13vw, 200px)" }}>
            DE L&apos;ÉPARGNANT
          </span>
        </h1>
      </section>

      {/* Row 2 — mono tagline strip. */}
      <p className="ic-strip">
        {ARTICLES.length} guides publiés · Sans jargon · Fact-checkés · Mis à jour à chaque réforme
      </p>

      {/* Row 3 — featured "À la une" front-page split. */}
      {featured ? (
        <article
          className="grid md:grid-cols-2"
          style={{ borderBottom: "1px solid var(--ink-700)" }}
        >
          <Link
            href={`/articles/${featured.slug}`}
            className="ic-block-lilac flex min-h-[460px] flex-col justify-between px-6 py-12 transition-colors sm:px-10 sm:py-16 md:min-h-[560px] hover:opacity-95"
            style={{ borderRight: "1px solid var(--ink-700)" }}
          >
            <div>
              <span className="ic-eyebrow-mono mb-6 inline-flex">
                À la une · N° {String(ARTICLES.length).padStart(2, "0")}
              </span>
              <h2
                className="ic-bigsection mb-6"
                style={{ fontSize: "clamp(30px, 4.6vw, 64px)" }}
              >
                {featured.title}
              </h2>
              <p
                className="max-w-[480px] text-[16px] sm:text-[17px]"
                style={{
                  fontFamily: "var(--font-source-serif), Georgia, serif",
                  fontStyle: "italic",
                  color: "var(--ink-700)",
                  lineHeight: 1.5,
                }}
              >
                « {featured.teaser} »
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <span
                className="ic-btn-block"
                style={{ pointerEvents: "none" }}
              >
                ↳ Lire le guide
              </span>
              <p
                className="text-[11px]"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--ink-700)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {featured.readMinutes} min · Mis à jour {formatDateMono(featured.updated)}
              </p>
            </div>
          </Link>

          <div
            className="relative min-h-[300px] md:min-h-[560px]"
            style={{ background: "var(--ink-700)" }}
          >
            <img
              src={coverFor(0)}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ display: "block" }}
            />
          </div>
        </article>
      ) : null}

      {/* Row 4 — bordered ink 3-col grid of remaining guides. */}
      {rest.length > 0 ? (
        <section
          className="px-6 py-16 sm:px-8 sm:py-20"
          style={{
            background: "var(--paper-0)",
            borderBottom: "1px solid var(--ink-700)",
          }}
        >
          <div className="mx-auto" style={{ maxWidth: "1280px" }}>
            <div className="mb-8 flex items-baseline justify-between gap-4">
              <span className="ic-eyebrow-mono">Tous les guides</span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--fg-muted)",
                }}
              >
                {rest.length} {rest.length > 1 ? "numéros" : "numéro"}
              </span>
            </div>
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((a, idx) => (
                <li key={a.slug}>
                  <ArticleCard
                    a={a}
                    idx={idx + 1}
                    num={ARTICLES.length - 1 - idx}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Row 5 — rose prose section: editorial manifesto with drop-cap. */}
      <section className="ic-block-rose px-6 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto" style={{ maxWidth: "720px" }}>
          <span className="ic-eyebrow-mono">Le pourquoi</span>
          <h3
            className="mt-5 mb-6"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: "var(--ink-700)",
              textTransform: "uppercase",
            }}
          >
            Pas un blog. Une bibliothèque qu&apos;on tient pour toi.
          </h3>
          <p
            className="ic-dropcap"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "17px",
              lineHeight: 1.65,
              color: "var(--ink-700)",
            }}
          >
            Chaque guide démarre d&apos;une vraie question reçue d&apos;un
            lecteur — la case 2OP, le plafond PER, l&apos;abattement par durée
            de détention. On y répond avec les chiffres de Bercy, les BOI
            cités, et un calcul appliqué à un salaire moyen français. Pas de
            promesse de gain, pas de niche douteuse. Juste la version qu&apos;on
            aurait aimé lire avant de prendre la décision.
          </p>
          <p
            className="mt-6 text-[15px]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--ink-700)",
              opacity: 0.7,
              lineHeight: 1.65,
            }}
          >
            Tous les guides sont relus à chaque loi de finances. Si tu vois
            une erreur, écris-nous — on corrige et on cite.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/newsletter" className="ic-btn-block">
              ↳ Recevoir le prochain guide
            </Link>
            <p
              className="text-[11px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--ink-700)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Un dimanche sur deux · Désabo en un clic
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer strip. */}
      <p className="ic-strip">
        Contenu éducatif · Pas un conseil en investissement personnalisé · Confirme avec un expert
      </p>

      <Footer />
    </main>
  );
}
