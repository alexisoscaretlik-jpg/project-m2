"use client";

import { useMemo, useState } from "react";

import { simulateAll, SimResult, Wrapper } from "@/lib/sim";

const fmtEur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const WRAPPER_ORDER: Wrapper[] = ["pea", "av", "cto", "per"];

export function SimForm() {
  const [monthly, setMonthly] = useState(300);
  const [years, setYears] = useState(20);
  const [annualReturn, setAnnualReturn] = useState(0.07);

  const results = useMemo(
    () => simulateAll({ monthly, years, annualReturn }),
    [monthly, years, annualReturn],
  );

  const best = WRAPPER_ORDER.reduce((a, b) =>
    results[a].net > results[b].net ? a : b,
  );

  return (
    <div>
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-3">
        <Field
          label="Versement mensuel"
          suffix="€"
          min={50}
          max={10000}
          step={50}
          value={monthly}
          onChange={setMonthly}
        />
        <Field
          label="Durée"
          suffix="ans"
          min={1}
          max={40}
          step={1}
          value={years}
          onChange={setYears}
        />
        <Field
          label="Rendement annuel moyen"
          suffix="%"
          min={0}
          max={15}
          step={0.5}
          value={Math.round(annualReturn * 1000) / 10}
          onChange={(v) => setAnnualReturn(v / 100)}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {WRAPPER_ORDER.map((w) => (
          <Card key={w} result={results[w]} highlight={w === best} />
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-900">
          Meilleur choix sur ce scénario : {results[best].label}
        </p>
        <p className="mt-1 text-xs text-blue-900/70">
          Net après impôts : {fmtEur.format(Math.round(results[best].net))} —
          soit {fmtEur.format(Math.round(results[best].net - results[best].contributions))}{" "}
          de gain net sur {fmtEur.format(results[best].contributions)} investis.
        </p>
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Hypothèses : rendement constant, versements mensuels en fin de mois,
        capitalisation mensuelle. Fiscalité 2025 : PFU 30% (12,8% IR + 17,2% PS),
        PEA exonéré d&apos;IR après 5 ans, AV abattement 4 600€/an après 8 ans.
        Estimation indicative, pas un conseil fiscal.
      </p>
    </div>
  );
}

function Field({
  label,
  suffix,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  suffix: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-28 rounded-md border border-slate-300 px-2 py-1 text-lg font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-sm text-slate-500">{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-blue-600"
      />
    </label>
  );
}

function Card({ result, highlight }: { result: SimResult; highlight: boolean }) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm transition ${
        highlight
          ? "border-blue-400 ring-2 ring-blue-100"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{result.label}</h3>
        {highlight ? (
          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-medium uppercase text-white">
            Optimal
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">
        {fmtEur.format(Math.round(result.net))}
      </p>
      <p className="text-xs text-slate-500">net après impôts</p>
      <dl className="mt-3 space-y-1 text-xs">
        <Row label="Valeur brute" value={fmtEur.format(Math.round(result.gross))} />
        <Row
          label="Impôts à la sortie"
          value={`−${fmtEur.format(Math.round(result.taxOnExit))}`}
          tone="rose"
        />
      </dl>
      <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
        {result.why}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "rose";
}) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={`font-mono ${
          tone === "rose" ? "text-rose-700" : "text-slate-900"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
