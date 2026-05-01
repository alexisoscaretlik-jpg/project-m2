"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { SubscribeForm } from "@/app/newsletter/subscribe-form";

// Compound interest with monthly contributions, compounded monthly,
// stopping at retirement (default 65). Pure JS, runs on every slider
// change.
function computeFutureValue(
  age: number,
  monthly: number,
  annualRate: number,
  retirementAge = 65,
): { fv: number; contributed: number; gains: number; years: number } {
  const months = Math.max(0, (retirementAge - age) * 12);
  const r = annualRate / 100 / 12; // monthly rate

  let balance = 0;
  for (let i = 0; i < months; i++) {
    balance += monthly;
    balance *= 1 + r;
  }

  const contributed = monthly * months;
  return {
    fv: Math.round(balance),
    contributed,
    gains: Math.round(balance - contributed),
    years: Math.max(0, retirementAge - age),
  };
}

function formatEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

const PRESETS: { label: string; age: number; monthly: number; rate: number; quip: string }[] = [
  { label: "Junior 25 ans · 100 € · ETF World", age: 25, monthly: 100, rate: 7, quip: "Le starter pack PEA." },
  { label: "Cadre 35 ans · 500 € · 6 %", age: 35, monthly: 500, rate: 6, quip: "Mix AV / PEA classique." },
  { label: "TMI 30 · 800 € · 7 %", age: 30, monthly: 800, rate: 7, quip: "L'optimiseur typique." },
  { label: "Tardif 45 ans · 1 000 € · 5 %", age: 45, monthly: 1000, rate: 5, quip: "Pas trop tard, mais sport." },
];

export function Compteur({ initial }: { initial: { age: number; monthly: number; rate: number } }) {
  const [age, setAge] = useState(initial.age);
  const [monthly, setMonthly] = useState(initial.monthly);
  const [rate, setRate] = useState(initial.rate);

  const { fv, contributed, gains, years } = useMemo(
    () => computeFutureValue(age, monthly, rate),
    [age, monthly, rate],
  );

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/compteur?age=${age}&m=${monthly}&rate=${rate}`;
  }, [age, monthly, rate]);

  const copyShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* Row 1 — peach hero with mega number. Replaces the static
          mega wordmark with the live compounded value. */}
      <section
        className="ic-block-peach px-6 pt-12 pb-8 sm:px-8 sm:pt-16 sm:pb-12"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        <div className="flex flex-col gap-3">
          <span className="ic-eyebrow-mono">Le Compteur · à 65 ans</span>
          <p
            className="text-[12px]"
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-700)",
              opacity: 0.7,
            }}
          >
            ↳ {years} ans · {formatEur(monthly)} / mois · {rate} %
          </p>
        </div>

        <div className="mt-6">
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(56px, 14vw, 240px)",
              fontWeight: 800,
              letterSpacing: "-0.045em",
              lineHeight: 0.9,
              color: "var(--ink-700)",
              fontFeatureSettings: '"tnum" 1',
              textWrap: "nowrap",
            }}
          >
            {formatEur(fv)}
          </div>

          <div
            className="mt-6 flex flex-wrap gap-x-8 gap-y-2"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--ink-700)",
            }}
          >
            <span>↳ Versé : {formatEur(contributed)}</span>
            <span>
              ↳ Gains :{" "}
              <span style={{ background: "var(--rose-100)", padding: "2px 6px", border: "1px solid var(--ink-700)" }}>
                {formatEur(gains)}
              </span>
            </span>
          </div>
        </div>
      </section>

      <p className="ic-strip">
        Bouge les curseurs · Le chiffre suit · Partage l&apos;URL pour montrer à quelqu&apos;un
      </p>

      {/* Row 3 — controls (lilac block) × explainer (cream — paper-0). */}
      <div
        className="grid md:grid-cols-2"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        <div
          className="ic-block-lilac flex flex-col gap-8 px-6 py-10 sm:px-10 sm:py-14"
          style={{ borderRight: "1px solid var(--ink-700)" }}
        >
          <div>
            <span className="ic-eyebrow-mono mb-5 inline-flex">Tes curseurs</span>

            <Slider
              label="Ton âge"
              value={age}
              onChange={setAge}
              min={18}
              max={65}
              step={1}
              suffix="ans"
            />

            <Slider
              label="Versement mensuel"
              value={monthly}
              onChange={setMonthly}
              min={0}
              max={2000}
              step={25}
              suffix="€ / mois"
            />

            <Slider
              label="Rendement annuel"
              value={rate}
              onChange={setRate}
              min={0}
              max={12}
              step={0.5}
              suffix="%"
              hint="Livret A ≈ 3 · AV fonds euros ≈ 2-3 · ETF World 30 ans ≈ 7"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copyShare}
              className="ic-btn-block"
            >
              ↳ Copier le lien
            </button>
            <p
              className="text-[11px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--ink-700)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Partage ce calcul
            </p>
          </div>
        </div>

        <div
          className="flex flex-col gap-6 px-6 py-10 sm:px-10 sm:py-14"
          style={{ background: "var(--paper-0)" }}
        >
          <span className="ic-eyebrow-mono">Trois cas pour comparer</span>
          <ul
            className="grid gap-0"
            style={{ border: "1px solid var(--ink-700)" }}
          >
            {PRESETS.map((p, i) => (
              <li
                key={p.label}
                style={{
                  borderBottom:
                    i < PRESETS.length - 1
                      ? "1px solid var(--ink-700)"
                      : "none",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAge(p.age);
                    setMonthly(p.monthly);
                    setRate(p.rate);
                  }}
                  className="block w-full px-5 py-4 text-left transition-colors hover:bg-[var(--paper-100)]"
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--ink-700)",
                    }}
                  >
                    ↳ {p.label}
                  </div>
                  <div
                    className="mt-1 text-[13px]"
                    style={{
                      fontFamily: "var(--font-source-serif), Georgia, serif",
                      fontStyle: "italic",
                      color: "var(--ink-700)",
                      lineHeight: 1.45,
                    }}
                  >
                    « {p.quip} »
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Row 4 — rose newsletter capture: turn the dopamine into a sub. */}
      <section className="ic-block-rose px-6 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto" style={{ maxWidth: "640px" }}>
          <span className="ic-eyebrow-mono">Pour que ça arrive vraiment</span>
          <h3
            className="mt-5 mb-5"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4.2vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              color: "var(--ink-700)",
              textTransform: "uppercase",
            }}
          >
            Tu as bougé les curseurs.<br />
            Maintenant on t&apos;aide à les fixer.
          </h3>
          <p
            className="mb-7 text-[16px]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--ink-700)",
              lineHeight: 1.6,
            }}
          >
            Le chiffre du Compteur est juste maths. La partie dure, c&apos;est
            d&apos;y mettre {formatEur(monthly)} chaque mois pendant {years} ans
            sans craquer. Une lettre courte le dimanche matin pour que tu
            tiennes la trajectoire — pas de pub, pas de leçon.
          </p>
          <SubscribeForm source={`compteur:${age}-${monthly}-${rate}`} />
          <p
            className="mt-4 text-[11px]"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--ink-700)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            Sans publicité · Désabonnement en un clic · Édité chaque dimanche
          </p>
        </div>
      </section>

      {/* Row 5 — content cross-link strip. */}
      <section
        className="px-6 py-12 sm:px-8 sm:py-14"
        style={{
          background: "var(--paper-0)",
          borderTop: "1px solid var(--ink-700)",
          borderBottom: "1px solid var(--ink-700)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "1080px" }}>
          <span className="ic-eyebrow-mono">À lire ensuite</span>
          <ul
            className="mt-6 grid md:grid-cols-3"
            style={{ border: "1px solid var(--ink-700)" }}
          >
            {[
              {
                href: "/articles/etf-world-cw8-wpea-ese",
                title: "Quel ETF World choisir",
                teaser: "CW8 vs WPEA vs ESE — le comparatif honnête.",
              },
              {
                href: "/articles/per-rentable-quelle-tmi",
                title: "Le PER vaut-il le coup pour toi",
                teaser: "Selon ta TMI, la réponse change radicalement.",
              },
              {
                href: "/articles/or-vs-sp500-etf",
                title: "Or vs S&P 500",
                teaser: "Allocation, pas opposition.",
              },
            ].map((card, i, arr) => (
              <li
                key={card.href}
                style={{
                  borderRight:
                    i < arr.length - 1
                      ? "1px solid var(--ink-700)"
                      : "none",
                }}
              >
                <Link
                  href={card.href}
                  className="block h-full px-5 py-5 transition-colors hover:bg-[var(--paper-100)]"
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--ink-700)",
                    }}
                  >
                    ↳ Guide
                  </span>
                  <h4
                    className="mt-2"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "18px",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                      color: "var(--ink-700)",
                      textTransform: "uppercase",
                    }}
                  >
                    {card.title}
                  </h4>
                  <p
                    className="mt-2 text-[14px]"
                    style={{
                      fontFamily: "var(--font-source-serif), Georgia, serif",
                      fontStyle: "italic",
                      color: "var(--ink-700)",
                      lineHeight: 1.5,
                    }}
                  >
                    « {card.teaser} »
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Disclaimer strip. */}
      <p className="ic-strip">
        Calcul illustratif · Pas un conseil personnalisé · Hypothèses constantes (pas d&apos;inflation, pas de fiscalité)
      </p>
    </>
  );
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix: string;
  hint?: string;
}) {
  return (
    <div className="mt-6 first:mt-0">
      <div className="flex items-baseline justify-between gap-3">
        <label
          className="block"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-700)",
          }}
        >
          ↳ {label}
        </label>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--ink-700)",
            fontFeatureSettings: '"tnum" 1',
          }}
        >
          {value} {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="ic-compteur-slider mt-3 w-full"
        aria-label={label}
      />
      {hint ? (
        <p
          className="mt-2 text-[11px]"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--ink-700)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            opacity: 0.65,
          }}
        >
          {hint}
        </p>
      ) : null}
      <style jsx>{`
        .ic-compteur-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          background: var(--paper-0);
          border: 1px solid var(--ink-700);
          outline: none;
        }
        .ic-compteur-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          background: var(--ink-700);
          border: 1px solid var(--ink-700);
          cursor: pointer;
          border-radius: 0;
        }
        .ic-compteur-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          background: var(--ink-700);
          border: 1px solid var(--ink-700);
          cursor: pointer;
          border-radius: 0;
        }
      `}</style>
    </div>
  );
}
