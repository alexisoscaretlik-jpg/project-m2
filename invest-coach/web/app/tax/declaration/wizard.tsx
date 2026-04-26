"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveWizard } from "./actions";

// Typeform-style wizard, built in React. One question at a time,
// keyboard-navigable, conditional logic, no external dependency.
//
// Data shape: {ref: value} written directly into typeform_responses.
// The orchestrator (lib/tax/orchestrator.ts) reads the same jsonb
// shape, so Path A (Typeform webhook) and Path B (this wizard) are
// interchangeable on the backend.

type BaseQ = {
  ref: string;
  title: string;
  subtitle?: string;
  skipIf?: (answers: Answers) => boolean;
};
type RadioQ = BaseQ & {
  type: "radio";
  options: { value: string; label: string }[];
};
type YesNoQ = BaseQ & { type: "yesno" };
type NumberQ = BaseQ & { type: "number"; unit?: string; min?: number };
type TextQ = BaseQ & { type: "text"; optional?: boolean };
type Question = RadioQ | YesNoQ | NumberQ | TextQ;

type Answers = Record<string, string | number | boolean | null>;

const QUESTIONS: Question[] = [
  {
    ref: "couple",
    type: "radio",
    title: "Êtes-vous seul(e) ou en couple ?",
    subtitle: "Détermine si on ajoute les revenus du conjoint.",
    options: [
      { value: "seul", label: "Seul(e)" },
      { value: "couple", label: "En couple (marié / pacsé)" },
    ],
  },
  {
    ref: "salaire_net_1",
    type: "number",
    title: "Vos salaires nets annuels ?",
    subtitle: "Total net perçu sur l'année (avant impôt). 0 si aucun.",
    unit: "€",
    min: 0,
  },
  {
    ref: "salaire_net_2",
    type: "number",
    title: "Salaires nets de votre conjoint(e) ?",
    subtitle: "0 si votre conjoint n'a pas de salaire.",
    unit: "€",
    min: 0,
    skipIf: (a) => a.couple !== "couple",
  },
  {
    ref: "pensions",
    type: "number",
    title: "Pensions de retraite perçues ?",
    subtitle: "Total du foyer, 0 si aucune.",
    unit: "€",
    min: 0,
  },
  {
    ref: "has_dividendes",
    type: "yesno",
    title: "Avez-vous reçu des dividendes cette année ?",
    subtitle: "Actions, SICAV, parts de société…",
  },
  {
    ref: "dividendes_montant",
    type: "number",
    title: "Montant brut total des dividendes ?",
    subtitle: "Avant prélèvement forfaitaire unique (PFU).",
    unit: "€",
    min: 0,
    skipIf: (a) => a.has_dividendes !== true,
  },
  {
    ref: "has_per",
    type: "yesno",
    title: "Avez-vous versé sur un PER cette année ?",
    subtitle: "Plan d'Épargne Retraite individuel ou collectif.",
  },
  {
    ref: "per_montant",
    type: "number",
    title: "Montant versé sur votre PER ?",
    subtitle: "Total cumulé de l'année. Déductible du revenu imposable.",
    unit: "€",
    min: 0,
    skipIf: (a) => a.has_per !== true,
  },
  {
    ref: "has_dons",
    type: "yesno",
    title: "Avez-vous fait des dons à des associations ?",
    subtitle: "Dons ouvrant droit à réduction (66% ou 75%).",
  },
  {
    ref: "dons_montant",
    type: "number",
    title: "Montant total des dons ?",
    subtitle: "Additionnez tous vos reçus fiscaux.",
    unit: "€",
    min: 0,
    skipIf: (a) => a.has_dons !== true,
  },
  {
    ref: "emploi_domicile",
    type: "number",
    title: "Emploi à domicile — montant payé dans l'année ?",
    subtitle: "Ménage, garde d'enfants, jardinage, cours particuliers… 0 si aucun.",
    unit: "€",
    min: 0,
  },
  {
    ref: "has_foncier",
    type: "yesno",
    title: "Avez-vous des revenus fonciers (location) ?",
    subtitle: "Location nue, pas meublée.",
  },
  {
    ref: "foncier_montant",
    type: "number",
    title: "Loyers annuels bruts encaissés ?",
    subtitle: "Avant charges. Le régime (micro ou réel) se décide ensuite.",
    unit: "€",
    min: 0,
    skipIf: (a) => a.has_foncier !== true,
  },
  {
    ref: "notes",
    type: "text",
    title: "Quelque chose d'important à ajouter ?",
    subtitle: "Changement de situation, projet, particularité fiscale… (facultatif)",
    optional: true,
  },
];

type Props = {
  initial: Answers | null;
};

export function Wizard({ initial }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>(initial ?? {});
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Questions visible given current answers (re-computed on each change).
  const visible = useMemo(
    () => QUESTIONS.filter((q) => !q.skipIf?.(answers)),
    [answers],
  );
  const total = visible.length;
  const safeIndex = Math.min(index, total - 1);
  const q = visible[safeIndex];
  const isLast = safeIndex === total - 1;

  // Focus the active input whenever we change question.
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [safeIndex]);

  const currentValue = q ? answers[q.ref] : undefined;

  function setValue(ref: string, value: Answers[string]) {
    setAnswers((a) => ({ ...a, [ref]: value }));
  }

  function canAdvance(): boolean {
    if (!q) return false;
    const v = answers[q.ref];
    if (q.type === "text") return q.optional ? true : typeof v === "string" && v.trim().length > 0;
    if (q.type === "number") return typeof v === "number" && !isNaN(v) && v >= (q.min ?? 0);
    if (q.type === "yesno") return typeof v === "boolean";
    if (q.type === "radio") return typeof v === "string" && v.length > 0;
    return false;
  }

  function next() {
    if (!canAdvance()) return;
    if (isLast) submit();
    // Advance from safeIndex so we stay in bounds even if conditional
    // logic shortened the visible list behind us.
    else setIndex(safeIndex + 1);
  }

  function back() {
    setIndex(Math.max(0, safeIndex - 1));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await saveWizard(answers);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setSubmitted(true);
    });
  }

  // Global keyboard shortcuts: Enter = next, Shift+Enter inside text = newline,
  // Escape = back. We attach at the window level rather than per-input.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (submitted) return;
      if (e.key === "Enter" && !e.shiftKey) {
        // Let the textarea handle Enter for newline unless Cmd is held.
        const target = e.target as HTMLElement | null;
        if (target?.tagName === "TEXTAREA" && !e.metaKey) return;
        e.preventDefault();
        next();
      } else if (e.key === "Escape") {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  // ---------- RENDER ----------

  if (submitted) {
    return (
      <div className="rounded-xl border border-[color:var(--forest-200)] bg-card p-8 text-center shadow-sm">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--forest-100)] text-[color:var(--forest-700)]">
          ✓
        </div>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Questionnaire enregistré
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Nous avons toutes les données nécessaires. Retournez sur la page
          fiscalité pour télécharger votre déclaration pré-remplie.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => router.push("/tax")}
            className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-white hover:bg-[color:var(--ink-500)]"
          >
            Retour à /tax →
          </button>
          <button
            onClick={() => {
              setSubmitted(false);
              setIndex(0);
            }}
            className="rounded-lg border border-border px-5 py-2.5 text-sm text-foreground hover:bg-muted"
          >
            Modifier mes réponses
          </button>
        </div>
      </div>
    );
  }

  if (!q) {
    return <p className="text-sm text-muted-foreground">Aucune question à afficher.</p>;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Question {safeIndex + 1} / {total}
          </span>
          <span>{Math.round(((safeIndex + 1) / total) * 100)} %</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((safeIndex + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
        {q.title}
      </h2>
      {q.subtitle ? (
        <p className="mt-2 text-sm text-muted-foreground">{q.subtitle}</p>
      ) : null}

      <div className="mt-6">
        {q.type === "radio" ? (
          <div className="space-y-2">
            {q.options.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-accent"
              >
                <input
                  type="radio"
                  name={q.ref}
                  value={opt.value}
                  checked={currentValue === opt.value}
                  onChange={() => setValue(q.ref, opt.value)}
                />
                <span className="font-medium text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
        ) : null}

        {q.type === "yesno" ? (
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: true, label: "Oui" },
              { value: false, label: "Non" },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => setValue(q.ref, opt.value)}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  currentValue === opt.value
                    ? "border-primary bg-accent text-primary"
                    : "border-border bg-card text-foreground hover:border-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}

        {q.type === "number" ? (
          <div className="flex items-baseline gap-2">
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="number"
              inputMode="decimal"
              min={q.min ?? 0}
              value={typeof currentValue === "number" ? currentValue : ""}
              onChange={(e) => {
                const v = e.target.value;
                setValue(q.ref, v === "" ? null : Number(v));
              }}
              className="w-full rounded-lg border border-border px-4 py-3 text-lg focus:border-primary focus:outline-none"
              placeholder="0"
            />
            {q.unit ? (
              <span className="text-sm text-muted-foreground">{q.unit}</span>
            ) : null}
          </div>
        ) : null}

        {q.type === "text" ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={4}
            maxLength={2000}
            value={typeof currentValue === "string" ? currentValue : ""}
            onChange={(e) => setValue(q.ref, e.target.value)}
            className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none"
            placeholder={q.optional ? "Facultatif — laissez vide si rien à ajouter." : ""}
          />
        ) : null}
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          disabled={safeIndex === 0}
          className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-muted disabled:opacity-40"
        >
          ← Retour
        </button>

        <div className="flex items-center gap-3">
          {q.type === "text" && q.optional ? (
            <button
              type="button"
              onClick={next}
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
            >
              Passer
            </button>
          ) : null}
          <button
            type="button"
            onClick={next}
            disabled={!canAdvance() || pending}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary disabled:opacity-50"
          >
            {pending
              ? "Enregistrement…"
              : isLast
                ? "Terminer et enregistrer"
                : "Continuer"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-right text-sm text-[color:var(--terracotta-500)]">{error}</p>
      ) : null}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Astuce : <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Entrée</kbd>{" "}
        pour continuer,{" "}
        <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Échap</kbd>{" "}
        pour revenir.
      </p>
    </div>
  );
}
