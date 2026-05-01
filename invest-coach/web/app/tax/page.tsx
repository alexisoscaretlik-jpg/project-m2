import Link from "next/link";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Fiscalité — Invest Coach",
  description:
    "Optimise ton impôt sur le revenu, légalement. PEA, AV, PER, CTO, IR 2042, plus-values — trois étapes pour récupérer cinq à neuf cents euros par an.",
};

// White truck through colorful autumn forest — Unsplash HVRnH4TB54M.
// Visual metaphor for the annual fiscal cycle: tu pars, tu traverses, tu arrives.
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1776066361430-dd62847db7c6?auto=format&fit=crop&w=1600&q=85";

const STEPS: {
  number: string;
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  pastel: string;
}[] = [
  {
    number: "01",
    href: "/tax/onboarding",
    eyebrow: "Profil",
    title: "Connecte ton avis d'imposition",
    body: "PDF, photo, ou copie-colle. On lit ton TMI, tes revenus, tes parts. Aucune donnée ne quitte la France.",
    pastel: "var(--rose-100)",
  },
  {
    number: "02",
    href: "/tax/levers",
    eyebrow: "Leviers",
    title: "On chiffre tes optimisations",
    body: "PEA, AV, PER, dons, frais réels, déficit foncier. Trois à cinq leviers classés par euros gagnés, pas par buzz.",
    pastel: "var(--lavender-200)",
  },
  {
    number: "03",
    href: "/tax/declaration",
    eyebrow: "Déclaration",
    title: "Tu signes ton 2042",
    body: "On pré-remplit ton Cerfa 2042. Tu vérifies, tu signes, tu envoies à impots.gouv. Cinq minutes en mai.",
    pastel: "var(--terracotta-100)",
  },
];

const LEVERS_LIST: { k: string; v: string }[] = [
  { k: "PFU vs barème", v: "Case 2OP cochée ou non — un calcul, deux euros à la fin du mois." },
  { k: "Plafond PER", v: "10 % de tes revenus déductibles, jusqu'à 32 909 € en 2026." },
  { k: "PEA 5 ans", v: "Exonération d'IR sur les plus-values — 17,2 % de PS seulement." },
  { k: "Donations", v: "100 000 € exonérés tous les 15 ans, par parent et par enfant." },
  { k: "Déficit foncier", v: "Jusqu'à 10 700 € imputables sur le revenu global, sous conditions." },
  { k: "Frais réels", v: "Repas, kilomètres, télétravail — la décote forfaitaire n'est pas toujours la meilleure." },
];

export default function TaxLandingPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/tax" />

      {/* Row 1 — peach pastel hero with mega wordmark stack. */}
      <section
        className="ic-block-peach px-6 pt-12 pb-8 sm:px-8 sm:pt-16 sm:pb-12"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
        aria-labelledby="tax-mark"
      >
        <span className="ic-eyebrow-mono">Fiscalité</span>
        <h1 id="tax-mark" className="mt-5">
          <span className="ic-mega" style={{ fontSize: "clamp(56px, 13vw, 200px)" }}>
            OPTIMISE
          </span>
          <span className="ic-mega" style={{ fontSize: "clamp(56px, 13vw, 200px)" }}>
            LÉGALEMENT
          </span>
        </h1>
      </section>

      {/* Row 2 — mono tagline strip. */}
      <p className="ic-strip">
        PEA · AV · PER · CTO · IR 2042 · Plus-values · Donations · Déficit foncier
      </p>

      {/* Row 3 — lilac × autumn forest truck split. */}
      <div
        className="grid md:grid-cols-2"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        <div
          className="ic-block-lilac flex min-h-[460px] flex-col justify-between px-6 py-12 sm:px-10 sm:py-16 md:min-h-[560px]"
          style={{ borderRight: "1px solid var(--ink-700)" }}
        >
          <div>
            <span className="ic-eyebrow-mono mb-6 inline-flex">Le cycle fiscal</span>
            <h2
              className="ic-bigsection mb-6"
              style={{ fontSize: "clamp(34px, 5vw, 72px)" }}
            >
              Tu pars.<br />Tu traverses.<br />Tu arrives.
            </h2>
            <p
              className="max-w-[440px] text-[16px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--ink-700)",
                lineHeight: 1.55,
              }}
            >
              Chaque année, le même chemin — janvier à mai. On t&apos;y suit.
              Profil, leviers, déclaration. Trois étapes, quinze minutes, et
              entre 500 et 5 000 € de récupérés selon ta situation.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/tax/onboarding" className="ic-btn-block">
              ↳ Démarrer ma déclaration
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
              Données hébergées en France
            </p>
          </div>
        </div>

        <div
          className="relative min-h-[300px] md:min-h-[560px]"
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

      {/* Row 4 — three steps as bordered ink grid, each linking to a sub-page. */}
      <section
        className="px-6 py-20 sm:px-8 sm:py-24"
        style={{
          background: "var(--paper-0)",
          borderBottom: "1px solid var(--ink-700)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "1280px" }}>
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="ic-eyebrow-mono">Trois étapes</span>
              <h2
                className="ic-bigsection mt-5"
                style={{ fontSize: "clamp(34px, 5vw, 72px)" }}
              >
                Quinze minutes<br />pour récupérer<br />ton mois de mai.
              </h2>
            </div>
            <p
              className="max-w-[420px] text-[15px]"
              style={{
                fontFamily: "var(--font-source-serif), Georgia, serif",
                fontStyle: "italic",
                color: "var(--ink-700)",
                lineHeight: 1.55,
              }}
            >
              « Pas de rendez-vous, pas de jargon de conseiller, pas de revente
              de ta data. Tu pilotes, on chiffre, l&apos;État encaisse moins. »
            </p>
          </div>

          <ul
            className="grid md:grid-cols-3"
            style={{ border: "1px solid var(--ink-700)" }}
          >
            {STEPS.map((s, idx) => (
              <li
                key={s.number}
                style={{
                  borderRight:
                    idx < STEPS.length - 1
                      ? "1px solid var(--ink-700)"
                      : "none",
                }}
              >
                <Link
                  href={s.href}
                  className="block h-full transition-colors hover:bg-[var(--paper-100)]"
                >
                  <article className="flex h-full flex-col">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        background: s.pastel,
                        borderBottom: "1px solid var(--ink-700)",
                        padding: "32px 24px",
                        minHeight: "200px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "clamp(72px, 9vw, 120px)",
                          fontWeight: 800,
                          letterSpacing: "-0.04em",
                          color: "var(--ink-700)",
                          lineHeight: 1,
                        }}
                      >
                        {s.number}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 px-6 py-6 sm:px-8 sm:py-8">
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
                          ↳ Étape {s.number} · {s.eyebrow}
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
                          lineHeight: 1.2,
                          color: "var(--ink-700)",
                          textTransform: "uppercase",
                        }}
                      >
                        {s.title}
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
                        « {s.body} »
                      </p>
                    </div>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Row 5 — rose block "Ce qu'on chiffre pour toi" with editorial drop-cap. */}
      <section className="ic-block-rose px-6 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto" style={{ maxWidth: "1080px" }}>
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="ic-eyebrow-mono">Ce qu&apos;on chiffre</span>
              <h2
                className="ic-bigsection mt-5"
                style={{ fontSize: "clamp(30px, 4.4vw, 60px)" }}
              >
                Six leviers<br />qu&apos;on connaît<br />par cœur.
              </h2>
            </div>
            <p
              className="max-w-[380px] text-[15px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--ink-700)",
                lineHeight: 1.55,
              }}
            >
              Pas de magie, pas de niche douteuse. Six décisions qui pèsent,
              et qu&apos;on peut chiffrer sur ton vrai salaire.
            </p>
          </div>

          <ul
            style={{
              borderTop: "1px solid var(--ink-700)",
              borderBottom: "1px solid var(--ink-700)",
            }}
          >
            {LEVERS_LIST.map((item, i) => (
              <li
                key={item.k}
                className="grid grid-cols-1 gap-2 py-5 md:grid-cols-[200px_1fr] md:gap-8 md:py-6"
                style={{
                  borderBottom:
                    i < LEVERS_LIST.length - 1
                      ? "1px solid var(--ink-700)"
                      : "none",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--ink-700)",
                  }}
                >
                  ↳ {item.k}
                </span>
                <span
                  className="text-[15px] md:text-[16px]"
                  style={{
                    fontFamily: "var(--font-source-serif), Georgia, serif",
                    fontStyle: "italic",
                    color: "var(--ink-700)",
                    lineHeight: 1.5,
                  }}
                >
                  « {item.v} »
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/tax/levers" className="ic-btn-block">
              ↳ Voir les 14 leviers du catalogue
            </Link>
            <Link href="/produits" className="ic-btn-block-light">
              ↳ Voir les offres en cours
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
              4 tiers · du PER aux Girardin / Malraux
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer strip. */}
      <p className="ic-strip">
        Informations éducatives · Pas un conseil fiscal personnalisé · Confirme avec un expert-comptable
      </p>

      <Footer />
    </main>
  );
}
