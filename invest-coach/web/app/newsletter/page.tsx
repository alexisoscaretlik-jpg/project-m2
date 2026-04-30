import Link from "next/link";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SubscribeForm } from "@/app/newsletter/subscribe-form";

export const metadata = {
  title: "Newsletter du dimanche — Invest Coach",
  description:
    "La newsletter qu'on lit sans hâte, le dimanche. Une loi d'argent par semaine, pour les épargnants français. Sans publicité, désabonnement en un clic.",
};

// Photos curated by Oscar (Unsplash, free commercial license).
const PHOTO_BALCONY =
  "https://images.unsplash.com/photo-1762760081003-28ae8d6adbbb?auto=format&fit=crop&w=1600&q=85"; // Zv96GyrvZ8I — man on balcony
const PHOTO_SAILBOAT =
  "https://images.unsplash.com/photo-1776693836271-3c25955c90de?auto=format&fit=crop&w=1200&q=85"; // -8tFu_2gh8s — lone sailboat
const PHOTO_WATERCOLOR =
  "https://images.unsplash.com/photo-1767321173860-52dea6b50337?auto=format&fit=crop&w=1200&q=85"; // TzWRjbPVTxY — pink/violet watercolor
const PHOTO_BLUE_YELLOW =
  "https://images.unsplash.com/photo-1618331833071-ce81bd50d300?auto=format&fit=crop&w=1200&q=85"; // zMl9PjGFPWg — abstract painting

// Mock recent issues — prototype copy. Swap with real CMS data later.
const ISSUES: { date: string; title: string; teaser: string; cover: string }[] = [
  {
    date: "AVR 27 · 2026",
    title: "PFU 30% ou barème : la case 2OP en chiffres",
    teaser: "Trois salaires, deux cas où cocher la case fait gagner mille euros.",
    cover: PHOTO_WATERCOLOR,
  },
  {
    date: "AVR 20 · 2026",
    title: "Or vs S&P 500 — allocation, pas opposition",
    teaser: "Pourquoi 5 à 10 % d'or rendent l'épargnant plus serein, pas plus riche.",
    cover: PHOTO_SAILBOAT,
  },
  {
    date: "AVR 13 · 2026",
    title: "PEA, AV, PER — l'ordre qui change tout",
    teaser: "On t'explique pourquoi remplir dans le mauvais ordre coûte 8 ans d'épargne.",
    cover: PHOTO_BLUE_YELLOW,
  },
];

const PROMISES: { label: string; body: string }[] = [
  {
    label: "Sans publicité",
    body: "Aucune marque ne nous paie pour t'écrire. On te dit ce qu'on ferait avec ton salaire.",
  },
  {
    label: "Fact-checké",
    body: "Chaque chiffre vient de Bercy, de l'AMF ou de la base BCE. Pas de Twitter, pas de buzz.",
  },
  {
    label: "Désabo en un clic",
    body: "Un lien en bas de chaque envoi. Pas de form, pas de chat, pas de chantage.",
  },
];

export default function NewsletterLandingPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/articles" />

      {/* Row 1 — rose pastel hero with mega wordmark stack. */}
      <section
        className="ic-block-rose px-6 pt-12 pb-8 sm:px-8 sm:pt-16 sm:pb-12"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
        aria-labelledby="newsletter-mark"
      >
        <span className="ic-eyebrow-mono">Newsletter du dimanche</span>
        <h1 id="newsletter-mark" className="mt-5">
          <span className="ic-mega" style={{ fontSize: "clamp(56px, 13vw, 200px)" }}>
            LA FINANCE
          </span>
          <span className="ic-mega" style={{ fontSize: "clamp(56px, 13vw, 200px)" }}>
            LE DIMANCHE
          </span>
        </h1>
      </section>

      {/* Row 2 — mono tagline strip. */}
      <p className="ic-strip">
        Édité depuis 2024 · Sans publicité · Désabonnement en un clic
      </p>

      {/* Row 3 — lilac × balcony-photo split. */}
      <div
        className="grid md:grid-cols-2"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        <div
          className="ic-block-lilac flex min-h-[460px] flex-col justify-between px-6 py-12 sm:px-10 sm:py-16 md:min-h-[560px]"
          style={{ borderRight: "1px solid var(--ink-700)" }}
        >
          <div>
            <span className="ic-eyebrow-mono mb-6 inline-flex">Pourquoi tu t&apos;abonnes</span>
            <h2 className="ic-bigsection mb-6" style={{ fontSize: "clamp(32px, 4.8vw, 64px)" }}>
              Une loi.<br />Un calcul.<br />Une décision.
            </h2>
            <p
              className="max-w-[440px] text-[16px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--ink-700)",
                lineHeight: 1.55,
              }}
            >
              Chaque dimanche, une seule règle d&apos;argent expliquée, chiffrée
              sur un vrai salaire français. Tu lis, tu décides, tu refermes le
              mail. Pas de hype, pas de signaux d&apos;achat, pas de coaching
              vendu sous couverture.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-5">
            <SubscribeForm source="newsletter-landing" />
            <p
              className="text-[11px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--ink-700)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Prochain dimanche · Sept minutes de lecture
            </p>
          </div>
        </div>

        <div className="relative min-h-[300px] md:min-h-[560px]">
          <img
            src={PHOTO_BALCONY}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ display: "block" }}
          />
        </div>
      </div>

      {/* Row 4 — promises strip (3 columns, ink borders). */}
      <section style={{ borderBottom: "1px solid var(--ink-700)" }}>
        <ul className="grid md:grid-cols-3" style={{ background: "var(--paper-0)" }}>
          {PROMISES.map((p, i) => (
            <li
              key={p.label}
              className="px-6 py-10 sm:px-8 sm:py-12"
              style={{
                borderRight:
                  i < PROMISES.length - 1
                    ? "1px solid var(--ink-700)"
                    : "none",
              }}
            >
              <span className="ic-eyebrow-mono">{p.label}</span>
              <p
                className="mt-4 text-[16px]"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--ink-700)",
                  lineHeight: 1.5,
                }}
              >
                {p.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Row 5 — three recent issues (mock). */}
      <section className="px-6 py-16 sm:px-8" style={{ borderBottom: "1px solid var(--ink-700)" }}>
        <div className="mx-auto" style={{ maxWidth: "1280px" }}>
          <div className="mb-8 flex items-baseline justify-between gap-4">
            <span className="ic-eyebrow-mono">Trois numéros récents</span>
            <Link
              href="/articles"
              className="text-[12px]"
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ink-700)",
                textDecoration: "underline",
                textUnderlineOffset: "4px",
              }}
            >
              ↳ Tous les guides
            </Link>
          </div>
          <ul className="grid gap-6 md:grid-cols-3">
            {ISSUES.map((issue) => (
              <li key={issue.title}>
                <article className="ic-edcard h-full">
                  <div className="ic-edcard-media">
                    <img
                      src={issue.cover}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="ic-edcard-foot">
                    <span>Numéro</span>
                    <span>{issue.date}</span>
                  </div>
                  <div
                    className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4"
                    style={{ borderTop: "1px solid var(--ink-700)" }}
                  >
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "20px",
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                        color: "var(--ink-700)",
                        textTransform: "uppercase",
                      }}
                    >
                      {issue.title}
                    </h3>
                    <p
                      className="text-[14px]"
                      style={{
                        fontFamily: "var(--font-source-serif), Georgia, serif",
                        fontStyle: "italic",
                        color: "var(--ink-700)",
                        lineHeight: 1.55,
                      }}
                    >
                      « {issue.teaser} »
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Row 6 — rose prose block "Pourquoi le dimanche ?" with editorial drop-cap. */}
      <section className="ic-block-rose px-6 py-20 sm:px-8">
        <div className="mx-auto" style={{ maxWidth: "720px" }}>
          <span className="ic-eyebrow-mono">Pourquoi le dimanche</span>
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
            On lit l&apos;argent comme on lit le journal du dimanche.
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
            Le lundi, tu cours. Le vendredi, tu décompresses. Le dimanche, tu
            t&apos;assois. C&apos;est l&apos;heure où on prend le temps —
            celui qu&apos;il faut pour comprendre une règle d&apos;argent en
            entier, pas en thread Twitter, pas en clip. Sept minutes de
            lecture, un calcul concret, une décision pour la semaine. Pas une
            de plus.
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
            La newsletter n&apos;est pas un produit. C&apos;est l&apos;atelier
            où on écrit notre méthode à voix haute, pour que tu la voies se
            faire.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
