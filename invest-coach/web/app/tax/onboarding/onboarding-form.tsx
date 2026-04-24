"use client";

import { useState, useTransition } from "react";

import { saveOnboarding } from "./actions";

type Props = {
  initial?: {
    profile_type?: string | null;
    income_types?: string[] | null;
    situation?: string | null;
    nb_enfants?: number | null;
    owns_real_estate?: boolean | null;
    has_investments?: boolean | null;
    has_crypto?: boolean | null;
    goals?: string[] | null;
    notes?: string | null;
  };
};

const PROFILES: { value: string; label: string; hint: string }[] = [
  { value: "salarie", label: "Salarié (CDI/CDD)", hint: "Revenu principal = salaire" },
  { value: "freelance_micro", label: "Freelance — micro-entrepreneur", hint: "Régime micro, abattement forfaitaire" },
  { value: "freelance_reel", label: "Freelance — régime réel (BNC/BIC)", hint: "Profession libérale, TNS, déclaration 2035/2031" },
  { value: "mixte", label: "Salaire + activité indépendante", hint: "Les deux en parallèle" },
  { value: "retraite", label: "Retraité", hint: "Pensions" },
  { value: "etudiant", label: "Étudiant", hint: "Sans revenu ou petits jobs" },
  { value: "sans_emploi", label: "Sans emploi", hint: "Recherche d'emploi" },
  { value: "other", label: "Autre", hint: "Expliquez dans les notes" },
];

const INCOMES: { value: string; label: string }[] = [
  { value: "salaire", label: "Salaires / traitements" },
  { value: "bnc", label: "BNC (libéral, honoraires)" },
  { value: "bic", label: "BIC (commerce, artisanat)" },
  { value: "dividendes", label: "Dividendes / intérêts" },
  { value: "foncier", label: "Revenus fonciers (locatif)" },
  { value: "plus_values", label: "Plus-values mobilières" },
  { value: "crypto", label: "Crypto-actifs" },
  { value: "autre", label: "Autre" },
];

const SITUATIONS: { value: string; label: string }[] = [
  { value: "celibataire", label: "Célibataire" },
  { value: "pacse", label: "Pacsé(e)" },
  { value: "marie", label: "Marié(e)" },
  { value: "separe", label: "Séparé(e)" },
  { value: "divorce", label: "Divorcé(e)" },
  { value: "veuf", label: "Veuf / veuve" },
];

const GOALS: { value: string; label: string }[] = [
  { value: "reduce_tax", label: "Payer moins d'impôts cette année" },
  { value: "optimize_investments", label: "Optimiser mes investissements" },
  { value: "prepare_retirement", label: "Préparer ma retraite" },
  { value: "start_freelance", label: "Démarrer une activité freelance" },
  { value: "transmit_wealth", label: "Transmettre mon patrimoine" },
];

export function OnboardingForm({ initial }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveOnboarding(fd);
      if (result?.error) setError(result.error);
    });
  };

  const initIncomes = new Set(initial?.income_types ?? []);
  const initGoals = new Set(initial?.goals ?? []);

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Q1 — Profile type */}
      <section>
        <h2 className="text-base font-semibold text-slate-900">
          1. Quel est votre profil principal&nbsp;?
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Détermine le régime fiscal qui vous concerne.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {PROFILES.map((p) => (
            <label
              key={p.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm hover:border-blue-400 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50"
            >
              <input
                type="radio"
                name="profile_type"
                value={p.value}
                required
                defaultChecked={initial?.profile_type === p.value}
                className="mt-0.5"
              />
              <span>
                <span className="block font-medium text-slate-900">{p.label}</span>
                <span className="block text-xs text-slate-500">{p.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Q2 — Income types */}
      <section>
        <h2 className="text-base font-semibold text-slate-900">
          2. Quels revenus percevez-vous&nbsp;?
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Cochez tout ce qui s&apos;applique. Beaucoup de foyers cumulent plusieurs sources.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {INCOMES.map((i) => (
            <label
              key={i.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm hover:border-blue-400 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50"
            >
              <input
                type="checkbox"
                name="income_types"
                value={i.value}
                defaultChecked={initIncomes.has(i.value)}
              />
              <span className="font-medium text-slate-900">{i.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Q3 — Family situation */}
      <section>
        <h2 className="text-base font-semibold text-slate-900">
          3. Votre situation familiale
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Affecte le nombre de parts et donc votre impôt.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {SITUATIONS.map((s) => (
            <label
              key={s.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm hover:border-blue-400 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50"
            >
              <input
                type="radio"
                name="situation"
                value={s.value}
                defaultChecked={initial?.situation === s.value}
              />
              <span className="font-medium text-slate-900">{s.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-3 text-sm">
            <span className="text-slate-700">Enfants à charge</span>
            <input
              type="number"
              name="nb_enfants"
              min={0}
              max={20}
              defaultValue={initial?.nb_enfants ?? 0}
              className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </label>
        </div>
      </section>

      {/* Q4 — Patrimoine flags */}
      <section>
        <h2 className="text-base font-semibold text-slate-900">
          4. Votre patrimoine
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Permet de repérer les leviers fonciers, mobiliers, crypto.
        </p>
        <div className="mt-3 space-y-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm hover:border-blue-400 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
            <input
              type="checkbox"
              name="owns_real_estate"
              defaultChecked={initial?.owns_real_estate ?? false}
            />
            <span className="font-medium text-slate-900">
              Je suis propriétaire (RP, locative, SCI, SCPI)
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm hover:border-blue-400 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
            <input
              type="checkbox"
              name="has_investments"
              defaultChecked={initial?.has_investments ?? false}
            />
            <span className="font-medium text-slate-900">
              J&apos;ai des placements (PEA, CTO, assurance-vie, PER)
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm hover:border-blue-400 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
            <input
              type="checkbox"
              name="has_crypto"
              defaultChecked={initial?.has_crypto ?? false}
            />
            <span className="font-medium text-slate-900">
              Je détiens des crypto-actifs
            </span>
          </label>
        </div>
      </section>

      {/* Q5 — Goals */}
      <section>
        <h2 className="text-base font-semibold text-slate-900">
          5. Votre objectif principal
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Oriente les recommandations que Claude génère pour vous.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {GOALS.map((g) => (
            <label
              key={g.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm hover:border-blue-400 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50"
            >
              <input
                type="checkbox"
                name="goals"
                value={g.value}
                defaultChecked={initGoals.has(g.value)}
              />
              <span className="font-medium text-slate-900">{g.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section>
        <label className="block text-sm font-medium text-slate-900">
          Notes libres (facultatif)
        </label>
        <textarea
          name="notes"
          rows={3}
          maxLength={2000}
          defaultValue={initial?.notes ?? ""}
          placeholder="Contexte utile pour Claude : changement de situation, projet immobilier, départ à l'étranger…"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : "Enregistrer et continuer"}
        </button>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </div>
      <p className="text-xs text-slate-500">
        Vos réponses servent à personnaliser les recommandations. Jamais partagées.
      </p>
    </form>
  );
}
