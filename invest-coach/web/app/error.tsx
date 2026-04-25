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
    <main className="min-h-screen bg-muted">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">
            Petit souci côté serveur
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            On n&apos;a pas pu charger cette page. Retente, ou reviens à
            l&apos;accueil.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={reset}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--ink-600)]"
            >
              Réessayer
            </button>
            <Link
              href="/"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Accueil
            </Link>
          </div>
          {error.digest ? (
            <p className="mt-4 text-xs text-muted-foreground">ref: {error.digest}</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
