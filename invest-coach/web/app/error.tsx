"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Petit souci côté serveur
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            On n&apos;a pas pu charger cette page. Retente, ou reviens à
            l&apos;accueil.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={reset}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Réessayer
            </button>
            <Link
              href="/"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Accueil
            </Link>
          </div>
          {error.digest ? (
            <p className="mt-4 text-xs text-slate-400">ref: {error.digest}</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
