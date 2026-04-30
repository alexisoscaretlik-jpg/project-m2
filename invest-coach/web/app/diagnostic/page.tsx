import Link from "next/link";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { DEV_USER_EMAIL, DEV_USER_ID, IS_DEV } from "@/lib/devUser";
import { createClient } from "@/lib/supabase/server";

import { TypeformEmbed } from "./typeform-embed";

export const metadata = {
  title: "Diagnostic fiscal — Invest Coach",
  description:
    "Cinq questions, deux minutes. On lit ton profil et on chiffre tes leviers fiscaux pour 2026 — PEA, AV, PER, IR. Sans engagement, sans appel commercial.",
};

// Spiral staircase (Unsplash 67Ws06I8yv4) — architectural, ascending.
// Same tone as /outils because this is the entry-point to the toolset.
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1774618683913-b8262a72fa53?auto=format&fit=crop&w=1600&q=85";

export default async function DiagnosticPage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  // In dev with no real session, fall back to the seed user so the
  // embed still has a user_id to pass through. In prod, redirect to
  // login first.
  const userId = user?.id ?? (IS_DEV ? DEV_USER_ID : null);
  const userEmail = user?.email ?? (IS_DEV ? DEV_USER_EMAIL : null);

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/diagnostic" />

      {/* Row 1 — peach hero with mega wordmark stack. */}
      <section
        className="ic-block-peach px-6 pt-12 pb-8 sm:px-8 sm:pt-16 sm:pb-12"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
        aria-labelledby="diagnostic-mark"
      >
        <span className="ic-eyebrow-mono">Diagnostic</span>
        <h1 id="diagnostic-mark" className="mt-5">
          <span className="ic-mega" style={{ fontSize: "clamp(56px, 13vw, 200px)" }}>
            CINQ QUESTIONS
          </span>
          <span className="ic-mega" style={{ fontSize: "clamp(56px, 13vw, 200px)" }}>
            DEUX MINUTES
          </span>
        </h1>
      </section>

      {/* Row 2 — mono tagline strip. */}
      <p className="ic-strip">
        Sans engagement · Sans appel commercial · Données hébergées en France
      </p>

      {/* Row 3 — lilac × staircase split with the embed inside the lilac block. */}
      <div
        className="grid lg:grid-cols-[1fr_360px]"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        <div
          className="ic-block-lilac flex flex-col gap-8 px-6 py-12 sm:px-10 sm:py-14"
          style={{ borderRight: "1px solid var(--ink-700)" }}
        >
          <div>
            <span className="ic-eyebrow-mono mb-5 inline-flex">La méthode</span>
            <h2
              className="ic-bigsection mb-5"
              style={{ fontSize: "clamp(28px, 4vw, 56px)" }}
            >
              On lit ton profil.<br />
              On chiffre tes leviers.
            </h2>
            <p
              className="max-w-[480px] text-[16px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--ink-700)",
                lineHeight: 1.55,
              }}
            >
              Salarié, freelance, mixte ? Propriétaire, investisseur, crypto ?
              Chaque situation ouvre des leviers fiscaux différents. Réponds
              à cinq questions et reçois un rapport personnalisé pour 2026 —
              PEA, AV, PER, IR, déficit foncier.
            </p>
          </div>

          {userId ? (
            <TypeformEmbed userId={userId} email={userEmail} />
          ) : (
            <div
              className="ic-block-rose"
              style={{
                border: "1px solid var(--ink-700)",
                padding: "28px 24px",
              }}
            >
              <span className="ic-eyebrow-mono">Connexion requise</span>
              <p
                className="mt-3 text-[15px]"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--ink-700)",
                  lineHeight: 1.55,
                }}
              >
                Pour qu&apos;on puisse te renvoyer ton rapport personnalisé,
                connecte-toi d&apos;abord — un seul lien magique par e-mail,
                pas de mot de passe.
              </p>
              <div className="mt-5">
                <Link href="/login?next=/diagnostic" className="ic-btn-block">
                  ↳ Se connecter
                </Link>
              </div>
            </div>
          )}
        </div>

        <div
          className="relative min-h-[300px] lg:min-h-full"
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

      {/* Row 4 — three reassurance strips. */}
      <section
        className="px-6 py-16 sm:px-8"
        style={{
          background: "var(--paper-0)",
          borderBottom: "1px solid var(--ink-700)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "1280px" }}>
          <ul
            className="grid md:grid-cols-3"
            style={{ border: "1px solid var(--ink-700)" }}
          >
            {[
              {
                k: "Cinq questions",
                v: "Profil, revenus, situation, patrimoine, objectifs. Deux minutes top chrono.",
              },
              {
                k: "Trois à cinq leviers",
                v: "Classés par euros gagnés sur ta vraie déclaration 2026 — pas de buzz.",
              },
              {
                k: "Aucun appel commercial",
                v: "On t'envoie le rapport par e-mail. Pas de coach par téléphone, pas de relance.",
              },
            ].map((p, i, arr) => (
              <li
                key={p.k}
                className="px-6 py-10 sm:px-8 sm:py-12"
                style={{
                  borderRight:
                    i < arr.length - 1
                      ? "1px solid var(--ink-700)"
                      : "none",
                }}
              >
                <span className="ic-eyebrow-mono">{p.k}</span>
                <p
                  className="mt-4 text-[15px]"
                  style={{
                    fontFamily: "var(--font-source-serif), Georgia, serif",
                    fontStyle: "italic",
                    color: "var(--ink-700)",
                    lineHeight: 1.55,
                  }}
                >
                  « {p.v} »
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Row 5 — rose prose block with editorial drop-cap. */}
      <section className="ic-block-rose px-6 py-20 sm:px-8">
        <div className="mx-auto" style={{ maxWidth: "720px" }}>
          <span className="ic-eyebrow-mono">Pourquoi ce diagnostic</span>
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
            Tu n&apos;as pas la même fiscalité que ton voisin.
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
            Un calcul fait pour quelqu&apos;un d&apos;autre, c&apos;est un
            calcul faux. Ton TMI, tes parts, tes revenus du capital, tes
            biens immobiliers, ton statut — tout ça change l&apos;ordre des
            leviers à activer. On te demande cinq questions, on calcule pour
            ton profil, et on te renvoie une feuille de route en français.
            Pas de jargon, pas de placement déguisé.
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
            Si tu préfères répondre directement dans le navigateur, le wizard
            Path B reste disponible sur{" "}
            <Link
              href="/tax/declaration"
              style={{
                color: "var(--ink-700)",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                fontWeight: 600,
              }}
            >
              /tax/declaration
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Disclaimer strip. */}
      <p className="ic-strip">
        Informations éducatives · Pas un conseil fiscal personnalisé · Confirme avec un expert
      </p>

      <Footer />
    </main>
  );
}
