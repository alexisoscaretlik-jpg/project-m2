import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

const TABS = [
  { href: "/", label: "Coaching" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/tax", label: "Tax" },
  { href: "/bank", label: "Bank" },
  { href: "/subscription", label: "Subscription" },
];

export async function Nav({ active }: { active: string }) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-slate-900">
          Invest Coach
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {TABS.map((t) => {
            const isActive = t.href === active;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-md px-3 py-1.5 ${
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
              <span className="hidden text-slate-500 sm:inline">
                {user.email}
              </span>
              <button
                type="submit"
                className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100"
              >
                Sign out
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
