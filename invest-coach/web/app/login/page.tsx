import Link from "next/link";

import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; sent?: string; error?: string }>;
}) {
  const { next, sent, error } = await searchParams;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            &larr; Feed
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Get a magic link by email. No password.
        </p>

        {sent ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Check your inbox — we sent you a sign-in link.
          </div>
        ) : (
          <div className="mt-6">
            <LoginForm next={next ?? "/watchlist"} />
            {error ? (
              <p className="mt-3 text-sm text-rose-600">{error}</p>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
