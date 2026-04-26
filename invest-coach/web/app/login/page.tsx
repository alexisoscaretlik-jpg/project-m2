import Link from "next/link";

import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; sent?: string; error?: string }>;
}) {
  const { next, sent, error } = await searchParams;

  return (
    <main className="min-h-screen bg-muted">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm text-primary hover:underline">
            &larr; Accueil
          </Link>
          <span className="text-sm font-semibold text-foreground">
            Invest Coach
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-16">
        <div className="cap-eyebrow">Connexion</div>
        <h1 className="cap-h1 mt-3">Te revoilà.</h1>
        <p className="cap-lede mt-3 text-base">
          On t&apos;envoie un lien magique par email. Aucun mot de passe à
          retenir.
        </p>

        {sent ? (
          <div className="mt-6 rounded-lg border border-[color:var(--forest-200)] bg-[color:var(--forest-50)] p-4 text-sm text-[color:var(--forest-800)]">
            Lien envoyé. Ouvre l&apos;email pour te connecter — pense à
            vérifier tes spams.
          </div>
        ) : (
          <div className="mt-6">
            <LoginForm next={next ?? "/watchlist"} />
            {error ? (
              <p className="mt-3 text-sm text-[color:var(--terracotta-500)]">{error}</p>
            ) : null}
          </div>
        )}

        <p className="mt-8 text-xs text-muted-foreground">
          En continuant, tu acceptes que tes données soient stockées sur
          Supabase (UE). Aucune revente à des tiers.
        </p>
      </div>
    </main>
  );
}
