import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

const TABS = [
  { href: "/articles", label: "Articles" },
  { href: "/podcast", label: "Podcast" },
  { href: "/outils", label: "Outils" },
];

export async function Nav({ active }: { active: string }) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur"
      style={{
        background: "color-mix(in srgb, var(--paper-50) 85%, transparent)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-y-2 px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-baseline gap-2">
          <span
            className="text-[18px] font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--ink-700)",
              letterSpacing: "-0.025em",
            }}
          >
            Invest Coach
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 text-sm md:flex"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {TABS.map((t) => {
            const isActive = t.href === active || (active === "/" && t.href === "/");
            return (
              <Link
                key={t.href}
                href={t.href}
                className="whitespace-nowrap rounded-lg px-3 py-2 text-[14px] font-medium transition-colors duration-200 hover:bg-[var(--paper-100)]"
                style={{
                  color: isActive ? "var(--ink-700)" : "var(--fg-muted)",
                }}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div
          className="flex items-center gap-2 text-sm"
          style={{ fontFamily: "var(--font-display)" }}
        >
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
                className="rounded-lg px-3 py-2 text-[13px] font-medium transition-colors hover:bg-[var(--paper-100)]"
                style={{ color: "var(--fg-muted)" }}
              >
                Déconnexion
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-[14px] font-medium transition-colors hover:bg-[var(--paper-100)]"
              style={{ color: "var(--fg-muted)" }}
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
