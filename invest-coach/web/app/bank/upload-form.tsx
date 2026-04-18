"use client";

import { useState, useTransition } from "react";

import { uploadCsv } from "./actions";

const FRENCH_BANKS = [
  "BNP Paribas",
  "Crédit Agricole",
  "Société Générale",
  "LCL",
  "Crédit Mutuel",
  "CIC",
  "La Banque Postale",
  "Boursorama",
  "Fortuneo",
  "Hello Bank",
  "Revolut",
  "N26",
  "Qonto",
  "Autre",
];

export function CsvUploadForm() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await uploadCsv(fd);
      if (result?.error) setError(result.error);
      else if (result?.ok)
        setMessage(`${result.count} transactions imported & categorized.`);
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-700">
          Banque
        </label>
        <select
          name="bank_name"
          required
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          defaultValue="BNP Paribas"
        >
          {FRENCH_BANKS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700">
          Fichier CSV
        </label>
        <input
          type="file"
          name="csv"
          accept=".csv,text/csv"
          required
          className="mt-1 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Parsing with Claude…" : "Importer & catégoriser"}
      </button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <p className="text-xs text-slate-500">
        Export ton relevé de la banque (3-6 mois), uploade — Claude reconnaît
        le format et catégorise tout en une passe.
      </p>
    </form>
  );
}
