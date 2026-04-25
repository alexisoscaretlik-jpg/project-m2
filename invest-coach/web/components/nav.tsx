import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

const TABS = [
  { href: "/", label: "Coaching" },
  { href: "/markets", label: "Marchés" },
  { href: "/charts", label: "Vue technique" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/simulation", label: "Simulateur" },
  { href: "/articles", label: "Guides" },
  { href: "/tax", label: "Fiscalité" },
  { href: "/bank", label: "Banque" },
];

export async function Nav({ active }: { active: string }) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur"
      style={{
        background: "color-mix(in srgb, var(--paper-50) 88%, transparent)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-y-2 px-6 py-3.5 lg:px-8">
        <Link href="/" className="flex items-baseline gap-2">
          <span
            className="text-[17px] font-semibold tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--ink-700)",
              letterSpacing: "-0.01em",
            }}
          >
            Invest Coach
          </span>
          <span
            className="hidden text-[11px] sm:inline"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--fg-subtle)",
              letterSpacing: "0.08em",
            }}
          >
            · FR
          </span>
        </Link>

        <nav
          className="order-3 flex w-full items-center gap-1 overflow-x-auto text-sm sm:order-none sm:w-auto"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {TABS.map((t) => {
            const isActive = t.href === active;
            return (
              <Link
                key={t.href}
                href={t.href}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-[14px] font-medium transition-colors duration-200"
                style={
                  isActive
                    ? {
                        color: "var(--ink-700)",
                        background: "var(--paper-100)",
                      }
                    : { color: "var(--fg-muted)" }
                }
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="text-sm" style={{ fontFamily: "var(--font-display)" }}>
          {user ? (
            <form action={signOut} className="flex items-center gap-3">
              <span
                className="hidden max-w-[160px] truncate text-[13px] sm:inline"
                style={{ color: "var(--fg-muted)" }}
              >
                {user.email}
              </span>
              <button
                type="submit"
                className="rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-[var(--paper-100)]"
                style={{ color: "var(--fg-muted)" }}
              >
                Déconnexion
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-md px-3.5 py-2 text-[13px] font-semibold transition-colors duration-200"
              style={{
                background: "var(--forest-600)",
                color: "var(--paper-50)",
              }}
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
