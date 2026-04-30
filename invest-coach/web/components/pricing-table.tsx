"use client";

import { useState } from "react";
import Link from "next/link";

// Innostart-style brutalist pricing — bordered ink 3-col grid, mono
// labels, mega prices, hard-edged ic-btn-block CTAs. Featured tier
// gets a peach pastel block. Strict palette C (rose / lilac / peach
// / ink). Annual billing applies a 20 % discount.

type Tier = {
  id: string;
  name: string;
  priceMonthly: number;
  tag: string;
  features: string[];
  cta: string;
  href: string;
  featured: boolean;
};

const TIERS: Tier[] = [
  {
    id: "decouverte",
    name: "Découverte",
    priceMonthly: 0,
    tag: "Gratuit, pour toujours.",
    features: [
      "Le journal du dimanche",
      "Trois brèves par semaine",
      "Glossaire complet",
      "Communauté de lecteurs",
    ],
    cta: "Commencer · gratuit",
    href: "/login",
    featured: false,
  },
  {
    id: "investisseur",
    name: "Investisseur",
    priceMonthly: 14,
    tag: "Pour passer à l'acte.",
    features: [
      "Tout Découverte",
      "Alertes éprouvées",
      "Coach IA illimité",
      "Notes de recherche",
      "Simulateur PEA / CTO",
    ],
    cta: "Essayer 14 jours",
    href: "/subscription",
    featured: true,
  },
  {
    id: "patrimoine",
    name: "Patrimoine",
    priceMonthly: 39,
    tag: "Pour piloter l'ensemble.",
    features: [
      "Tout Investisseur",
      "Optimisation fiscale avancée",
      "Suivi multi-enveloppes",
      "Rapports trimestriels",
      "Coach IA prioritaire",
    ],
    cta: "Essayer 14 jours",
    href: "/subscription",
    featured: false,
  },
];

const ANNUAL_DISCOUNT = 0.2;

type Cadence = "monthly" | "annual";

function effectivePerMonth(monthly: number, cadence: Cadence): number {
  if (monthly === 0) return 0;
  return cadence === "annual" ? Math.round(monthly * (1 - ANNUAL_DISCOUNT)) : monthly;
}

function annualSaved(monthly: number): number {
  return Math.round(monthly * 12 * ANNUAL_DISCOUNT);
}

export function PricingTable() {
  const [cadence, setCadence] = useState<Cadence>("monthly");

  return (
    <section
      id="tarifs"
      className="px-6 py-20 sm:px-8 sm:py-24"
      style={{
        background: "var(--paper-0)",
        borderTop: "1px solid var(--ink-700)",
        borderBottom: "1px solid var(--ink-700)",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "1280px" }}>
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="ic-eyebrow-mono">Tarifs</span>
            <h2
              className="ic-bigsection mt-5"
              style={{ fontSize: "clamp(34px, 5vw, 72px)" }}
            >
              Trois formules.<br />Annulable<br />en un clic.
            </h2>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <p
              className="max-w-[380px] text-[15px]"
              style={{
                fontFamily: "var(--font-source-serif), Georgia, serif",
                fontStyle: "italic",
                color: "var(--ink-700)",
                lineHeight: 1.55,
              }}
            >
              « Découverte est gratuite, pour toujours. Tu passes payant
              seulement quand tu en veux plus. »
            </p>
            <div
              role="radiogroup"
              aria-label="Cadence de facturation"
              className="inline-flex"
              style={{
                border: "1px solid var(--ink-700)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <button
                type="button"
                role="radio"
                aria-checked={cadence === "monthly"}
                onClick={() => setCadence("monthly")}
                className="px-5 py-2.5 text-[12px] font-bold uppercase transition-colors"
                style={{
                  background:
                    cadence === "monthly" ? "var(--ink-700)" : "transparent",
                  color:
                    cadence === "monthly" ? "var(--paper-0)" : "var(--ink-700)",
                  letterSpacing: "0.1em",
                }}
              >
                Mensuel
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={cadence === "annual"}
                onClick={() => setCadence("annual")}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[12px] font-bold uppercase transition-colors"
                style={{
                  background:
                    cadence === "annual" ? "var(--ink-700)" : "transparent",
                  color:
                    cadence === "annual" ? "var(--paper-0)" : "var(--ink-700)",
                  letterSpacing: "0.1em",
                  borderLeft: "1px solid var(--ink-700)",
                }}
              >
                Annuel
                <span
                  className="px-1.5 py-px text-[10px] font-bold"
                  style={{
                    background:
                      cadence === "annual"
                        ? "var(--rose-100)"
                        : "var(--rose-100)",
                    color: "var(--ink-700)",
                    letterSpacing: "0.04em",
                  }}
                >
                  −20 %
                </span>
              </button>
            </div>
          </div>
        </div>

        <ul
          className="grid md:grid-cols-3"
          style={{ border: "1px solid var(--ink-700)" }}
        >
          {TIERS.map((t, idx) => {
            const perMonth = effectivePerMonth(t.priceMonthly, cadence);
            const saved = cadence === "annual" ? annualSaved(t.priceMonthly) : 0;
            return (
              <li
                key={t.id}
                style={{
                  borderRight:
                    idx < TIERS.length - 1
                      ? "1px solid var(--ink-700)"
                      : "none",
                  background: t.featured
                    ? "var(--terracotta-100)"
                    : "var(--paper-0)",
                }}
              >
                <article className="flex h-full flex-col">
                  <div
                    className="flex items-baseline justify-between gap-3 px-6 py-5 sm:px-8"
                    style={{ borderBottom: "1px solid var(--ink-700)" }}
                  >
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
                      ↳ {t.name}
                    </span>
                    {t.featured ? (
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "var(--paper-0)",
                          background: "var(--ink-700)",
                          padding: "3px 8px",
                        }}
                      >
                        La plus choisie
                      </span>
                    ) : null}
                  </div>

                  <div className="px-6 py-8 sm:px-8">
                    <p
                      className="text-[14px]"
                      style={{
                        fontFamily: "var(--font-source-serif), Georgia, serif",
                        fontStyle: "italic",
                        color: "var(--ink-700)",
                        lineHeight: 1.45,
                      }}
                    >
                      « {t.tag} »
                    </p>
                    <div className="mt-6 flex items-baseline gap-2">
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "clamp(64px, 7vw, 96px)",
                          fontWeight: 800,
                          letterSpacing: "-0.045em",
                          lineHeight: 0.95,
                          color: "var(--ink-700)",
                        }}
                      >
                        {perMonth}
                      </span>
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
                        € / mois
                      </span>
                    </div>
                    <p
                      className="mt-2 text-[11px]"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "var(--ink-700)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        opacity: 0.7,
                        minHeight: "16px",
                      }}
                    >
                      {cadence === "annual" && saved > 0
                        ? `Soit ${perMonth * 12} € / an · économise ${saved} €`
                        : cadence === "monthly" && t.priceMonthly > 0
                          ? "Sans engagement"
                          : t.priceMonthly === 0
                            ? "Pour toujours"
                            : ""}
                    </p>
                  </div>

                  <ul
                    className="flex flex-1 flex-col"
                    style={{ borderTop: "1px solid var(--ink-700)" }}
                  >
                    {t.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-baseline gap-3 px-6 py-3 text-[14px] sm:px-8"
                        style={{
                          borderBottom: "1px solid var(--ink-700)",
                          fontFamily: "var(--font-display)",
                          color: "var(--ink-700)",
                          lineHeight: 1.4,
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "var(--ink-700)",
                            opacity: 0.6,
                          }}
                        >
                          ↳
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="px-6 py-6 sm:px-8">
                    <Link href={t.href} className="ic-btn-block w-full">
                      {t.cta}
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        <p
          className="mt-6 text-[11px]"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--fg-muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Paiement sécurisé · Désabonnement en un clic · Données hébergées en France
        </p>
      </div>
    </section>
  );
}
