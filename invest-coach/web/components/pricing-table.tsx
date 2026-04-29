"use client";

import { useState } from "react";
import Link from "next/link";

// Pricing table with monthly / annual toggle.
// Annual billing applies a 20% discount on the per-month rate.
// Inspired by Stripe's pricing toggle (annual = "−20%" badge).

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
      "3 brèves par semaine",
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
      "Rapports trimestriels en deux pages",
      "Coach IA prioritaire",
    ],
    cta: "Essayer 14 jours",
    href: "/subscription",
    featured: false,
  },
];

const ANNUAL_DISCOUNT = 0.2; // 20 % off when billed annually.

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
    <section id="tarifs" className="py-24" style={{ background: "var(--paper-100)" }}>
      <div className="mx-auto px-6 text-center sm:px-8" style={{ maxWidth: "720px" }}>
        <h2 className="ic-h1 mx-auto">
          Trois formules. <em>Annulable en un clic.</em>
        </h2>
        <p
          className="mx-auto mt-5 text-[17px]"
          style={{
            maxWidth: "520px",
            fontFamily: "var(--font-display)",
            color: "var(--fg-muted)",
            lineHeight: 1.55,
          }}
        >
          Découverte est gratuite, pour toujours. Tu passes payant seulement quand tu en veux plus.
        </p>

        {/* Cadence toggle */}
        <div
          className="mx-auto mt-8 inline-flex items-center rounded-full p-1"
          style={{
            background: "var(--paper-0)",
            border: "1px solid var(--border)",
            fontFamily: "var(--font-display)",
          }}
          role="radiogroup"
          aria-label="Cadence de facturation"
        >
          <button
            type="button"
            role="radio"
            aria-checked={cadence === "monthly"}
            onClick={() => setCadence("monthly")}
            className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors"
            style={{
              background:
                cadence === "monthly" ? "var(--ink-700)" : "transparent",
              color:
                cadence === "monthly" ? "var(--paper-0)" : "var(--fg-muted)",
            }}
          >
            Mensuel
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={cadence === "annual"}
            onClick={() => setCadence("annual")}
            className="ml-1 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors"
            style={{
              background:
                cadence === "annual" ? "var(--ink-700)" : "transparent",
              color:
                cadence === "annual" ? "var(--paper-0)" : "var(--fg-muted)",
            }}
          >
            Annuel
            <span
              className="rounded-full px-1.5 py-px text-[10px] font-bold"
              style={{
                background:
                  cadence === "annual"
                    ? "var(--lavender-200)"
                    : "var(--forest-50)",
                color:
                  cadence === "annual"
                    ? "var(--lavender-800)"
                    : "var(--forest-700)",
                letterSpacing: "0.04em",
              }}
            >
              −20 %
            </span>
          </button>
        </div>
      </div>

      <div
        className="mx-auto mt-14 grid gap-6 px-6 sm:px-8 md:grid-cols-3"
        style={{ maxWidth: "1080px" }}
      >
        {TIERS.map((t) => {
          const perMonth = effectivePerMonth(t.priceMonthly, cadence);
          const saved = cadence === "annual" ? annualSaved(t.priceMonthly) : 0;
          return (
            <article
              key={t.id}
              className={`ic-tier ${t.featured ? "ic-tier-featured" : ""}`}
              style={t.featured ? { transform: "translateY(-8px)" } : undefined}
            >
              {t.featured ? (
                <div className="ic-tier-ribbon">La plus choisie</div>
              ) : null}
              <h3
                className="m-0 text-[22px] font-bold"
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-0.02em",
                  color: "var(--ink-700)",
                }}
              >
                {t.name}
              </h3>
              <p
                className="m-0 text-[14px]"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--fg-muted)",
                }}
              >
                {t.tag}
              </p>
              <div
                className="flex flex-col gap-1 py-3"
                style={{
                  borderTop: "1px solid var(--border)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div className="flex items-baseline gap-1.5">
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "56px",
                      fontWeight: 700,
                      letterSpacing: "-0.035em",
                      lineHeight: 1,
                      color: "var(--ink-700)",
                    }}
                  >
                    {perMonth}
                  </span>
                  <span
                    className="text-[13px]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--fg-muted)",
                    }}
                  >
                    € / mois
                  </span>
                </div>
                {cadence === "annual" && saved > 0 ? (
                  <p
                    className="text-[12px]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--forest-700)",
                    }}
                  >
                    Soit {perMonth * 12} € facturés à l&apos;année · économise{" "}
                    {saved} € / an
                  </p>
                ) : cadence === "monthly" && t.priceMonthly > 0 ? (
                  <p
                    className="text-[12px]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--fg-subtle)",
                    }}
                  >
                    Sans engagement
                  </p>
                ) : null}
              </div>
              <ul className="m-0 flex flex-1 list-none flex-col gap-2.5 p-0">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-[14px]"
                    style={{
                      color: "var(--fg)",
                      lineHeight: 1.45,
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    <CheckIcon />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={t.href}
                className="mt-2 inline-flex items-center justify-center rounded-full px-5 py-3 text-[14px] font-semibold transition-all hover:translate-y-[-1px] hover:shadow-md"
                style={{
                  fontFamily: "var(--font-display)",
                  background: t.featured
                    ? "var(--ink-700)"
                    : "var(--bg-elevated)",
                  color: t.featured ? "var(--paper-0)" : "var(--ink-700)",
                  border: t.featured
                    ? "1px solid var(--ink-700)"
                    : "1px solid var(--paper-300)",
                }}
              >
                {t.cta}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        color: "var(--lavender-600)",
        marginTop: "3px",
        flexShrink: 0,
      }}
    >
      <path d="M4 12 L10 18 L20 6" />
    </svg>
  );
}
