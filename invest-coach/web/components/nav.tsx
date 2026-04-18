import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

const TABS = [
  { href: "/", label: "Coaching" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/simulation", label: "Simulateur" },
  { href: "/tax", label: "Fiscalité" },
  { href: "/bank", label: "Banque" },
  { href: "/subscription", label: "Abonnement" },
];

export async function Nav({ active }: { active: string }) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-slate-900">
            Invest Coach
          </span>
          <span className="hidden text-xs text-slate-400 sm:inline">· FR</span>
        </Link>
        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto text-sm sm:order-none sm:w-auto">
          {TABS.map((t) => {
            const isActive = t.href === active;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="text-sm">
          {user ? (
            <form action={signOut} className="flex items-center gap-2">
              <span className="hidden max-w-[160px] truncate text-slate-500 sm:inline">
                {user.email}
              </span>
              <button
                type="submit"
                className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100"
              >
                Déconnexion
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
