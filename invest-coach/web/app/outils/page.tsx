import Link from "next/link";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Outils — Invest Coach",
  description:
    "Fiscalité, simulateur d'enveloppes, watchlist, vue technique, analyse bancaire. Tous les outils Invest Coach pour piloter ton argent.",
};

const TOOLS: {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  emoji: string;
  pastel: string;
}[] = [
  {
    href: "/tax",
    eyebrow: "01 · Impôt",
    title: "Fiscalité",
    body: "IR-2042, plus-values, dividendes étrangers, déclaration guidée. Les règles françaises en chiffres concrets.",
    emoji: "🧾",
    pastel: "ic-card-pastel-lavender",
  },
  {
    href: "/simulation",
    eyebrow: "02 · Enveloppes",
    title: "Simulateur",
    body: "Compare PEA, CTO, AV, PER sur 10 ans. Vraies hypothèses fiscales, pas un calculateur générique.",
    emoji: "📊",
    pastel: "ic-card-pastel-peach",
  },
  {
    href: "/watchlist",
    eyebrow: "03 · Suivi",
    title: "Watchlist",
    body: "Ajoute les entreprises qui te concernent. Coaching automatique sur les publications trimestrielles et alertes AMF.",
    emoji: "👀",
    pastel: "ic-card-pastel-mint",
  },
  {
    href: "/bank",
    eyebrow: "04 · Relevés",
    title: "Analyse bancaire",
    body: "Importe ton relevé. On repère les frais cachés, les abonnements en doublon, et ce qui pèse vraiment.",
    emoji: "🏦",
    pastel: "ic-card-pastel-lavender",
  },
  {
    href: "/charts",
    eyebrow: "05 · Marchés",
    title: "Vue technique",
    body: "Lecture hebdomadaire des marchés par @great_martis. Support, résistance, tendance — en français clair.",
    emoji: "📈",
    pastel: "ic-card-pastel-peach",
  },
];

export default function OutilsPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/outils" />

      <section
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 0%, var(--lavender-100) 0%, var(--paper-50) 60%, var(--paper-50) 100%)",
        }}
      >
        <div
          className="mx-auto px-6 pt-20 pb-12 text-center sm:px-8 sm:pt-24"
          style={{ maxWidth: "880px" }}
        >
          <div className="mb-6 flex justify-center">
            <span className="ic-pill">
              <span className="ic-pill-badge">Outils</span>
              Cinq surfaces concrètes
            </span>
          </div>
          <h1 className="ic-h1 mx-auto" style={{ maxWidth: "720px" }}>
            Pour piloter ton argent, pas pour le subir.
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
            Cinq outils, conçus pour les épargnants français. Aucun n&apos;est
            indispensable seul — ensemble, ils répondent aux questions concrètes
            que tu te poses chaque mois.
          </p>
        </div>
      </section>

      <section
        className="mx-auto px-6 pb-24 sm:px-8"
        style={{ maxWidth: "1280px" }}
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="block">
              <article
                className={t.pastel}
                style={{
                  borderRadius: "var(--r-2xl)",
                  padding: "32px 28px",
                  border: "1px solid rgba(20,16,40,0.04)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 200ms var(--ease-standard)",
                }}
              >
                <div
                  className="grid h-[64px] w-[64px] place-items-center rounded-2xl"
                  style={{
                    background: "var(--paper-0)",
                    fontSize: "28px",
                    boxShadow: "var(--sh-md)",
                  }}
                >
                  {t.emoji}
                </div>
                <div
                  className="mt-6 text-[11px]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--lavender-700)",
                    letterSpacing: "0.08em",
                  }}
                >
                  {t.eyebrow}
                </div>
                <h3
                  className="mt-2 text-[22px] font-bold"
                  style={{
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.02em",
                    color: "var(--ink-700)",
                    lineHeight: 1.2,
                  }}
                >
                  {t.title}
                </h3>
                <p
                  className="mt-3 flex-1 text-[15px]"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--fg-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {t.body}
                </p>
                <span
                  className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--lavender-700)",
                  }}
                >
                  Ouvrir l&apos;outil →
                </span>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
