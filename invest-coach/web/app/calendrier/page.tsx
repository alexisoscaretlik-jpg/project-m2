import Link from "next/link";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Calendrier fiscal 2026 — Invest Coach",
  description:
    "Les 9 dates clés de l'année fiscale française : déclaration, deadlines PER, FCPI, dons, Girardin. Coach Calendrier te rappelle 2 semaines avant chaque échéance.",
};

// Spiral staircase — same hero photo as /outils + /diagnostic for
// visual continuity (these are the action surfaces of the toolset).
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1774618683913-b8262a72fa53?auto=format&fit=crop&w=1600&q=85";

type MomentTone = "rose" | "lilac" | "peach" | "neutre";

type FiscalMoment = {
  id: string;
  monthLabel: string;          // "Avril" / "Mai" / "Décembre"
  windowLabel: string;         // human-readable window
  title: string;               // headline action
  who: string;                 // who this concerns
  body: string;                // 2-3 sentence French explainer
  action: string;              // the one-line action
  href?: string;               // internal link if relevant
  tone: MomentTone;
};

const TONE_BG: Record<MomentTone, string> = {
  rose: "var(--rose-100)",
  lilac: "var(--lavender-200)",
  peach: "var(--terracotta-100)",
  neutre: "var(--paper-0)",
};

const MOMENTS: FiscalMoment[] = [
  {
    id: "01-janvier",
    monthLabel: "Janvier",
    windowLabel: "1er → 31 jan",
    title: "Préparation : tu rassembles l'année écoulée",
    who: "Tous les contribuables (salariés, freelances, retraités).",
    body:
      "C'est le mois où on collecte tout : justificatifs de dons, attestations PER, relevés de plus-values, taxe foncière, frais de garde. Si tu as cinq dossiers à retrouver en avril, c'est cinq dossiers que tu ne retrouveras pas. Janvier est le mois de la liste.",
    action:
      "Crée un dossier « Impôts 2026 » dans Drive / Notion et glisse-y chaque justificatif au fur et à mesure.",
    tone: "lilac",
  },
  {
    id: "02-mars",
    monthLabel: "Mars",
    windowLabel: "Mi-mars",
    title: "Ouverture de la déclaration en ligne",
    who: "Tous les foyers fiscaux français.",
    body:
      "Le service en ligne d'impots.gouv.fr s'ouvre vers le 10-15 avril historiquement, mais l'avis pré-rempli arrive courant mars. Tu reçois ta version « brouillon » que tu pourras corriger. C'est l'occasion de vérifier les revenus pré-remplis avant que la machine fiscale ne les valide.",
    action:
      "Vérifie ton brouillon dès qu'il arrive : revenus salaires, revenus capitaux, situation familiale, parts.",
    href: "/tax/declaration",
    tone: "rose",
  },
  {
    id: "03-avril",
    monthLabel: "Avril",
    windowLabel: "3e semaine d'avril",
    title: "Date limite déclaration papier",
    who: "Les foyers qui déclarent encore en papier (autorisé si revenus < 15 000 €).",
    body:
      "Si tu déclares en papier (de plus en plus rare), c'est ta deadline. Au-delà : majoration de 10 % automatique, plus pénalités de retard. Pour 99 % des lecteurs, on déclare en ligne — la date limite décale alors à mai selon ta zone.",
    action:
      "Si tu es papier : déclaration postée avant la 3e semaine d'avril (cachet de la poste).",
    tone: "peach",
  },
  {
    id: "04-mai",
    monthLabel: "Mai",
    windowLabel: "Fin mai (selon zone)",
    title: "Date limite déclaration en ligne — la grande deadline",
    who: "Quasi-tous les foyers fiscaux français.",
    body:
      "C'est LA deadline de l'année. Trois zones (1 / 2 / 3) avec trois dates différentes, échelonnées entre fin mai et début juin. Au-delà : 10 % de majoration. Cette année, c'est aussi le dernier moment pour cocher la case 2OP (option barème vs PFU) — décision qui peut te faire gagner ou perdre 200 à 800 €.",
    action:
      "Coche la case 2OP si ta TMI est ≤ 11 %. Vérifie tous les leviers (dons, frais de garde, emploi à domicile) avant de signer.",
    href: "/articles/pfu-30-vs-bareme-progressif",
    tone: "rose",
  },
  {
    id: "05-juillet-aout",
    monthLabel: "Juillet–Août",
    windowLabel: "Été",
    title: "Réception de l'avis d'imposition",
    who: "Tous les contribuables ayant déclaré en mai.",
    body:
      "Tu reçois ton avis officiel : revenu fiscal de référence, IR à payer, calcul détaillé. Si tu vois une erreur, tu as 3 mois pour réclamer (et 3 ans pour rectifier dans certains cas). Ne le laisse pas dans la boîte aux lettres : c'est la base de tous tes calculs pour l'année qui vient.",
    action:
      "Lis ton avis ligne par ligne. Si écart vs ton attente : réclamation en ligne sous 3 mois.",
    tone: "neutre",
  },
  {
    id: "06-septembre",
    monthLabel: "Septembre",
    windowLabel: "Rentrée",
    title: "Calcul du plafond PER restant pour 2026",
    who: "Salariés (TMI 30+) et freelances qui veulent défiscaliser.",
    body:
      "Le PER permet de déduire jusqu'à 10 % du revenu imposable de l'année précédente. Septembre est le moment de calculer ce plafond : combien tu peux verser d'ici fin décembre pour optimiser ton IR 2026 ? Plafond non utilisé = perdu après 3 ans.",
    action:
      "Calcule ton plafond PER 2026 (10 % du revenu imposable 2025, plafonné à 35 194 €).",
    href: "/tax/levers",
    tone: "lilac",
  },
  {
    id: "07-novembre",
    monthLabel: "Novembre",
    windowLabel: "Tout le mois",
    title: "Audit de fin d'année — qu'est-ce qu'il manque ?",
    who: "Tous les épargnants TMI 30+ qui veulent finir l'année optimisée.",
    body:
      "Novembre est le mois du tri. Tu compares ce que tu as fait (versements PER, dons, frais réels) à ce que tu pourrais faire (FCPI, GFF, Girardin, déficit foncier). Chaque levier non activé en décembre est perdu pour l'année. Anticipe les 6 dernières semaines.",
    action:
      "Liste les 3 leviers non activés. Pour chacun : quel montant ? quelle économie d'IR ? quelle deadline ?",
    href: "/tax/levers",
    tone: "peach",
  },
  {
    id: "08-decembre-15",
    monthLabel: "Décembre",
    windowLabel: "1er → 15 déc",
    title: "Clôture des dons aux associations",
    who: "Tous les contribuables (et tous les TMI : 0 % rend même les dons rentables).",
    body:
      "Pour qu'un don ouvre droit à la réduction d'IR au titre de 2026, il doit être effectué avant le 31 décembre 2026 — mais les associations recommandent de boucler avant le 15 décembre pour éviter les goulots d'étranglement. 100 € donnés à une asso d'intérêt général te coûtent 34 € (réduction 66 %).",
    action:
      "Choisis 1-2 associations, fais le versement avant le 15 décembre, garde le reçu.",
    href: "/tax/levers",
    tone: "rose",
  },
  {
    id: "09-decembre-31",
    monthLabel: "Décembre",
    windowLabel: "16 → 31 déc",
    title: "Dernière fenêtre PER, Girardin, FCPI / FIP",
    who: "Épargnants TMI 30+ avec capacité d'épargne fin d'année.",
    body:
      "C'est le sprint final. Les versements PER doivent être effectivement reçus par l'assureur avant le 31 décembre — pas le jour où tu envoies le virement, le jour où il arrive. Pareil pour Girardin Industriel (souscription bouclée) et FCPI / FIP (millésime annuel). Trois jours de retard = un an perdu.",
    action:
      "Versement PER au plus tard le 26 décembre. Souscriptions Girardin/FCPI envoyées au plus tard le 22 décembre.",
    href: "/produits",
    tone: "lilac",
  },
];

export default function CalendrierPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/calendrier" />

      {/* Row 1 — peach hero with mega wordmark stack. */}
      <section
        className="ic-block-peach px-6 pt-12 pb-8 sm:px-8 sm:pt-16 sm:pb-12"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
        aria-labelledby="cal-mark"
      >
        <span className="ic-eyebrow-mono">Calendrier fiscal 2026</span>
        <h1 id="cal-mark" className="mt-5">
          <span className="ic-mega" style={{ fontSize: "clamp(48px, 11vw, 168px)" }}>
            NEUF MOMENTS
          </span>
          <span className="ic-mega" style={{ fontSize: "clamp(48px, 11vw, 168px)" }}>
            UNE ANNÉE
          </span>
        </h1>
      </section>

      {/* Row 2 — strip. */}
      <p className="ic-strip">
        9 deadlines · Toutes les TMI · Pour épargnants français · Mises à jour à chaque réforme
      </p>

      {/* Row 3 — lilac × staircase: thesis. */}
      <div
        className="grid md:grid-cols-2"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        <div
          className="ic-block-lilac flex min-h-[420px] flex-col justify-between px-6 py-12 sm:px-10 sm:py-16 md:min-h-[520px]"
          style={{ borderRight: "1px solid var(--ink-700)" }}
        >
          <div>
            <span className="ic-eyebrow-mono mb-6 inline-flex">La thèse</span>
            <h2
              className="ic-bigsection mb-6"
              style={{ fontSize: "clamp(30px, 4.6vw, 60px)" }}
            >
              Tu y penses<br />
              en décembre.<br />
              Trop tard.
            </h2>
            <p
              className="max-w-[460px] text-[16px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--ink-700)",
                lineHeight: 1.55,
              }}
            >
              Chaque année, les mêmes deadlines reviennent — déclaration, PER,
              FCPI, dons, Girardin. Chaque année, la majorité des
              optimisations sont ratées parce qu&apos;elles arrivent un
              dimanche soir 28 décembre. Coach Calendrier te rappelle deux
              semaines avant, avec ton montant chiffré, et l&apos;action prête
              à signer.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/diagnostic" className="ic-btn-block">
              ↳ Faire mon diagnostic
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
              2 minutes · Sans engagement
            </p>
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

      {/* Row 4 — the 9 moments, vertical timeline of bordered cards. */}
      <section
        className="px-6 py-16 sm:px-8 sm:py-20"
        style={{
          background: "var(--paper-0)",
          borderBottom: "1px solid var(--ink-700)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "1080px" }}>
          <div className="mb-10 flex items-baseline justify-between gap-4">
            <span className="ic-eyebrow-mono">Les 9 moments</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--fg-muted)",
              }}
            >
              Cycle annuel · 2026
            </span>
          </div>

          <ol
            className="grid"
            style={{ border: "1px solid var(--ink-700)" }}
          >
            {MOMENTS.map((m, i) => (
              <li
                key={m.id}
                style={{
                  borderBottom:
                    i < MOMENTS.length - 1
                      ? "1px solid var(--ink-700)"
                      : "none",
                }}
              >
                <article className="grid gap-0 md:grid-cols-[200px_1fr]">
                  <div
                    className="flex flex-col justify-between gap-3 px-6 py-6 sm:px-8 sm:py-8"
                    style={{
                      background: TONE_BG[m.tone],
                      borderRight: "1px solid var(--ink-700)",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "var(--ink-700)",
                          opacity: 0.75,
                        }}
                      >
                        ↳ Étape {String(i + 1).padStart(2, "0")}
                      </span>
                      <div
                        className="mt-3"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "clamp(28px, 3.6vw, 44px)",
                          fontWeight: 800,
                          letterSpacing: "-0.025em",
                          lineHeight: 0.95,
                          color: "var(--ink-700)",
                          textTransform: "uppercase",
                        }}
                      >
                        {m.monthLabel}
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--ink-700)",
                      }}
                    >
                      {m.windowLabel}
                    </span>
                  </div>

                  <div className="flex flex-col gap-4 px-6 py-6 sm:px-8 sm:py-8">
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "clamp(20px, 2.6vw, 28px)",
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                        color: "var(--ink-700)",
                        textTransform: "uppercase",
                      }}
                    >
                      {m.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--ink-700)",
                        opacity: 0.7,
                      }}
                    >
                      ↳ Concerne : {m.who}
                    </p>
                    <p
                      className="text-[15px] sm:text-[16px]"
                      style={{
                        fontFamily: "var(--font-display)",
                        color: "var(--ink-700)",
                        lineHeight: 1.6,
                      }}
                    >
                      {m.body}
                    </p>
                    <div
                      className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4"
                      style={{
                        borderTop: "1px solid var(--ink-700)",
                        paddingTop: "16px",
                      }}
                    >
                      <span
                        className="shrink-0"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--ink-700)",
                          minWidth: "80px",
                        }}
                      >
                        ↳ Action
                      </span>
                      <span
                        className="text-[14px]"
                        style={{
                          fontFamily: "var(--font-source-serif), Georgia, serif",
                          fontStyle: "italic",
                          color: "var(--ink-700)",
                          lineHeight: 1.55,
                        }}
                      >
                        « {m.action} »
                        {m.href ? (
                          <>
                            {" "}
                            <Link
                              href={m.href}
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontStyle: "normal",
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: "var(--ink-700)",
                                textDecoration: "underline",
                                textUnderlineOffset: "3px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              ↳ Voir le détail
                            </Link>
                          </>
                        ) : null}
                      </span>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Row 5 — rose CTA: subscribe to Coach Calendrier. */}
      <section className="ic-block-rose px-6 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto" style={{ maxWidth: "720px" }}>
          <span className="ic-eyebrow-mono">Coach Calendrier</span>
          <h3
            className="mt-5 mb-6"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(30px, 4.4vw, 56px)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              color: "var(--ink-700)",
              textTransform: "uppercase",
            }}
          >
            On te rappelle
            <br />
            deux semaines avant.
            <br />
            Pas la veille.
          </h3>
          <p
            className="mb-6 text-[16px] sm:text-[17px]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--ink-700)",
              lineHeight: 1.6,
            }}
          >
            Tu reçois un seul e-mail par semaine, le dimanche matin. Quand
            une deadline approche, on te chiffre l&apos;action sur ton vrai
            salaire et on prépare le bouton. Tu cliques, c&apos;est fait.
          </p>

          <ul
            className="mt-6 mb-10 space-y-3"
            style={{
              borderTop: "1px solid var(--ink-700)",
              borderBottom: "1px solid var(--ink-700)",
              padding: "16px 0",
              listStyle: "none",
            }}
          >
            {[
              {
                k: "Sunday brief",
                v: "Un e-mail / semaine, 90 secondes de lecture, ta situation.",
              },
              {
                k: "9 rappels / an",
                v: "Deux semaines avant chaque deadline fiscale, on te ping.",
              },
              {
                k: "Action templates",
                v: "Versement PER, case 2OP, dons : un bouton, c&apos;est fait.",
              },
              {
                k: "Sans engagement",
                v: "Désabonnement en un clic. Pas d&apos;appel commercial. Jamais.",
              },
            ].map((row) => (
              <li
                key={row.k}
                className="grid grid-cols-1 gap-1 py-2 md:grid-cols-[160px_1fr] md:gap-6"
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--ink-700)",
                  }}
                >
                  ↳ {row.k}
                </span>
                <span
                  className="text-[14px] sm:text-[15px]"
                  style={{
                    fontFamily: "var(--font-source-serif), Georgia, serif",
                    fontStyle: "italic",
                    color: "var(--ink-700)",
                    lineHeight: 1.55,
                  }}
                  dangerouslySetInnerHTML={{ __html: `« ${row.v} »` }}
                />
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/diagnostic" className="ic-btn-block">
              ↳ Démarrer mon Coach Calendrier
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
              14 € / mois · Annulable en un clic
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer strip. */}
      <p className="ic-strip">
        Informations éducatives · Pas un conseil personnalisé · Vérifie chaque date sur impots.gouv.fr
      </p>

      <Footer />
    </main>
  );
}
