"use client";

import Link from "next/link";
import { useState } from "react";

// Photos curated by Oscar (Unsplash, free commercial license).
const PHOTO_AUTUMN_TRUCK =
  "https://images.unsplash.com/photo-1776066361430-dd62847db7c6?auto=format&fit=crop&w=1600&q=85"; // HVRnH4TB54M
const PHOTO_BLUE_YELLOW =
  "https://images.unsplash.com/photo-1618331833071-ce81bd50d300?auto=format&fit=crop&w=1600&q=85"; // zMl9PjGFPWg
const PHOTO_SMARTPHONE =
  "https://images.unsplash.com/photo-1773332611514-238856b76198?auto=format&fit=crop&w=1600&q=85"; // qUJ8fgoaLTg
const PHOTO_STAIRCASE =
  "https://images.unsplash.com/photo-1774618683913-b8262a72fa53?auto=format&fit=crop&w=1600&q=85"; // 67Ws06I8yv4
const PHOTO_TUNNEL =
  "https://images.unsplash.com/photo-1764831685497-3095f33bada2?auto=format&fit=crop&w=1600&q=85"; // UaylYFMAhWk

type Pastel = "rose" | "lilac" | "peach";

type Tool = {
  id: string;
  number: string;
  label: string;
  href: string;
  eyebrow: string;
  bigsection: string[]; // each line of the multi-line bigsection
  strip: string;
  prose: string;
  cta: string;
  photo: string;
  pastel: Pastel;
  bullets: { k: string; v: string }[];
};

const TOOLS: Tool[] = [
  {
    id: "tax",
    number: "01",
    label: "Fiscalité",
    href: "/tax",
    eyebrow: "Fiscalité",
    bigsection: ["Optimise", "légalement.", "Récupère mai."],
    strip: "PEA · AV · PER · CTO · IR 2042 · Plus-values · Donations",
    prose:
      "Ton avis d'imposition + ton profil = trois à cinq leviers chiffrés en euros. Cerfa 2042 pré-remplie, prête à signer. Pour résidents fiscaux français — salariés, freelances, retraités.",
    cta: "Démarrer ma déclaration",
    photo: PHOTO_AUTUMN_TRUCK,
    pastel: "rose",
    bullets: [
      { k: "Profil", v: "Cinq questions, deux minutes." },
      { k: "Leviers", v: "Trois à cinq optimisations chiffrées." },
      { k: "Déclaration", v: "Cerfa 2042 pré-remplie en PDF." },
    ],
  },
  {
    id: "simulation",
    number: "02",
    label: "Simulateur",
    href: "/simulation",
    eyebrow: "Simulateur",
    bigsection: ["PEA vs AV", "vs CTO sur", "dix ans."],
    strip: "Vraies hypothèses fiscales · Compare en euros nets · Sans engagement",
    prose:
      "Compare tes enveloppes avec ton vrai TMI, ta vraie part de versements, ta vraie durée d'investissement. Pas un calculateur générique — un simulateur qui parle français à ta situation.",
    cta: "Lancer une simulation",
    photo: PHOTO_BLUE_YELLOW,
    pastel: "lilac",
    bullets: [
      { k: "Enveloppes", v: "PEA, AV, PER, CTO sur même horizon." },
      { k: "Hypothèses", v: "PFU, barème, plafonds — tout ouvert." },
      { k: "Sortie", v: "Euros nets après frais et fiscalité." },
    ],
  },
  {
    id: "watchlist",
    number: "03",
    label: "Watchlist",
    href: "/watchlist",
    eyebrow: "Watchlist",
    bigsection: ["Coachings", "sur tes", "entreprises."],
    strip: "Publications trimestrielles · Alertes AMF · Pas de prix temps réel",
    prose:
      "Ajoute les sociétés cotées que tu suis vraiment. À chaque publication trimestrielle, on t'envoie une lecture éducative de ce qui change : earnings, guidance, alertes. Jamais de signal d'achat.",
    cta: "Ouvrir ma watchlist",
    photo: PHOTO_SMARTPHONE,
    pastel: "peach",
    bullets: [
      { k: "Suivi", v: "Tu choisis, on lit pour toi." },
      { k: "Pédagogique", v: "Chaque publication décodée en français." },
      { k: "Discret", v: "Aucune notification commerciale." },
    ],
  },
  {
    id: "bank",
    number: "04",
    label: "Analyse bancaire",
    href: "/bank",
    eyebrow: "Analyse bancaire",
    bigsection: ["Tes frais", "cachés.", "En clair."],
    strip: "Relevés CSV · Frais cartes · Abonnements · Découverts · Change",
    prose:
      "Importe ton relevé. On repère ce qui pèse vraiment sur ton année — frais cachés, abonnements en doublon, commissions de change. Décision : on garde, on renégocie, on coupe.",
    cta: "Charger un relevé",
    photo: PHOTO_STAIRCASE,
    pastel: "rose",
    bullets: [
      { k: "Import", v: "CSV de ta banque ou copie-colle." },
      { k: "Catégories", v: "Frais structurels vs ponctuels." },
      { k: "Action", v: "Trois leviers de réduction par mois." },
    ],
  },
  {
    id: "charts",
    number: "05",
    label: "Vue technique",
    href: "/charts",
    eyebrow: "Vue technique",
    bigsection: ["Lire le", "marché.", "En français."],
    strip: "Lecture quotidienne par @great_martis · Indices · Crypto · Or · Bonds",
    prose:
      "On lit chaque jour l'analyse publique de @great_martis et on la résume en trois paragraphes français — sa voix préservée, son cap intact. Pas de conseil, pas d'urgence. Lecture éducative.",
    cta: "Ouvrir le journal d'analyse",
    photo: PHOTO_TUNNEL,
    pastel: "lilac",
    bullets: [
      { k: "Sources", v: "Tweets de @great_martis, à la source." },
      { k: "Format", v: "Trois paragraphes par actif suivi." },
      { k: "Cadence", v: "Lecture du jour, mise à jour avant ouverture." },
    ],
  },
];

const PASTEL_CLASS: Record<Pastel, string> = {
  rose: "ic-block-rose",
  lilac: "ic-block-lilac",
  peach: "ic-block-peach",
};

export function OutilsHub() {
  const [activeIdx, setActiveIdx] = useState(0);
  const tool = TOOLS[activeIdx];

  return (
    <>
      {/* Hub hero — peach block with `↳ Outils` eyebrow + mega title. */}
      <section
        className="ic-block-peach px-6 pt-12 pb-8 sm:px-8 sm:pt-16 sm:pb-12"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
        aria-labelledby="outils-mark"
      >
        <span className="ic-eyebrow-mono">Outils</span>
        <h1 id="outils-mark" className="mt-5">
          <span className="ic-mega" style={{ fontSize: "clamp(56px, 13vw, 200px)" }}>
            CINQ OUTILS
          </span>
          <span className="ic-mega" style={{ fontSize: "clamp(56px, 13vw, 200px)" }}>
            UNE MÉTHODE
          </span>
        </h1>
      </section>

      <p className="ic-strip">
        Fiscalité · Simulateur · Watchlist · Analyse bancaire · Vue technique
      </p>

      {/* Sidebar shell. */}
      <div
        className="grid md:grid-cols-[280px_1fr]"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        {/* Sidebar left — sticky list of 5 tool links. */}
        <aside
          className="md:sticky md:top-0 md:self-start"
          style={{
            background: "var(--paper-0)",
            borderRight: "1px solid var(--ink-700)",
            maxHeight: "100vh",
          }}
        >
          <div
            className="px-6 py-6 sm:px-8"
            style={{ borderBottom: "1px solid var(--ink-700)" }}
          >
            <span className="ic-eyebrow-mono">Tes outils</span>
          </div>
          <ul>
            {TOOLS.map((t, idx) => {
              const isActive = idx === activeIdx;
              return (
                <li
                  key={t.id}
                  style={{
                    borderBottom:
                      idx < TOOLS.length - 1
                        ? "1px solid var(--ink-700)"
                        : "none",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    aria-current={isActive ? "page" : undefined}
                    className="block w-full px-6 py-5 text-left transition-colors sm:px-8 hover:bg-[var(--paper-100)]"
                    style={{
                      background: isActive ? "var(--paper-100)" : "transparent",
                      borderLeft: isActive
                        ? "4px solid var(--ink-700)"
                        : "4px solid transparent",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--ink-700)",
                        opacity: isActive ? 1 : 0.55,
                      }}
                    >
                      ↳ {t.number}
                    </div>
                    <div
                      className="mt-1.5"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "18px",
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        color: "var(--ink-700)",
                        textTransform: "uppercase",
                        lineHeight: 1.15,
                      }}
                    >
                      {t.label}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div
            className="px-6 py-5 sm:px-8"
            style={{ borderTop: "1px solid var(--ink-700)" }}
          >
            <p
              className="text-[11px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--fg-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                lineHeight: 1.5,
              }}
            >
              Une suite. Cinq surfaces. Palette commune.
            </p>
          </div>
        </aside>

        {/* Content right pane — full marketing card for the active tool. */}
        <div>
          {/* Pastel hero band for this tool. */}
          <section
            className={`${PASTEL_CLASS[tool.pastel]} px-6 py-12 sm:px-10 sm:py-16`}
            style={{ borderBottom: "1px solid var(--ink-700)" }}
            aria-live="polite"
          >
            <div className="flex flex-col gap-2">
              <span className="ic-eyebrow-mono">
                {tool.number} · {tool.eyebrow}
              </span>
              <h2 className="ic-bigsection mt-3" style={{ fontSize: "clamp(36px, 5.6vw, 84px)" }}>
                {tool.bigsection.map((line, i) => (
                  <span key={i} style={{ display: "block" }}>
                    {line}
                  </span>
                ))}
              </h2>
            </div>
          </section>

          {/* Per-tool tagline strip. */}
          <p className="ic-strip">{tool.strip}</p>

          {/* Split: prose + photo. */}
          <div
            className="grid md:grid-cols-2"
            style={{ borderBottom: "1px solid var(--ink-700)" }}
          >
            <div
              className="flex flex-col justify-between px-6 py-12 sm:px-10 sm:py-14"
              style={{
                background: "var(--paper-0)",
                borderRight: "1px solid var(--ink-700)",
                minHeight: "440px",
              }}
            >
              <div>
                <p
                  className="max-w-[480px] text-[16px] sm:text-[17px]"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--ink-700)",
                    lineHeight: 1.55,
                  }}
                >
                  {tool.prose}
                </p>

                <ul
                  className="mt-8"
                  style={{
                    borderTop: "1px solid var(--ink-700)",
                  }}
                >
                  {tool.bullets.map((b, i) => (
                    <li
                      key={b.k}
                      className="grid grid-cols-1 gap-1 py-4 md:grid-cols-[120px_1fr] md:gap-6"
                      style={{
                        borderBottom:
                          i < tool.bullets.length - 1
                            ? "1px solid var(--ink-700)"
                            : "none",
                      }}
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
                        ↳ {b.k}
                      </span>
                      <span
                        className="text-[14px] sm:text-[15px]"
                        style={{
                          fontFamily: "var(--font-source-serif), Georgia, serif",
                          fontStyle: "italic",
                          color: "var(--ink-700)",
                          lineHeight: 1.5,
                        }}
                      >
                        « {b.v} »
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href={tool.href} className="ic-btn-block">
                  ↳ {tool.cta}
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
                  Pas un conseil personnalisé
                </p>
              </div>
            </div>

            <div
              className="relative min-h-[300px] md:min-h-full"
              style={{ background: "var(--ink-700)" }}
            >
              <img
                key={tool.id}
                src={tool.photo}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ display: "block" }}
              />
            </div>
          </div>

          {/* Bottom strip — quick keyboard / mouse hint. */}
          <p className="ic-strip">
            Clique un autre outil dans la barre latérale · Aucune donnée enregistrée tant que tu n&apos;ouvres pas l&apos;outil
          </p>
        </div>
      </div>
    </>
  );
}
