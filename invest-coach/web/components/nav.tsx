import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { NavDrawer } from "@/components/nav-drawer";

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
      className="sticky top-0 z-50"
      style={{
        background: "var(--paper-0)",
        borderBottom: "1px solid var(--ink-700)",
      }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="ic-brand-cell shrink-0" aria-label="Invest Coach — accueil">
          <span>IC</span>
          <span>INVEST&nbsp;COACH</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {TABS.map((t) => {
            const isActive =
              t.href === active || (active === "/" && t.href === "/");
            return (
              <Link
                key={t.href}
                href={t.href}
                className="ic-nav-link"
                aria-current={isActive ? "page" : undefined}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <form action={signOut} className="hidden items-center gap-3 md:flex">
              <span
                className="hidden max-w-[160px] truncate text-[12px] sm:inline"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--fg-muted)",
                  letterSpacing: "0.04em",
                }}
              >
                {user.email}
              </span>
              <button type="submit" className="ic-btn-block-light">
                Déconnexion
              </button>
            </form>
          ) : (
            <Link href="/login" className="ic-btn-block hidden md:inline-flex">
              Démarrer
            </Link>
          )}
          <NavDrawer userEmail={user?.email ?? null} signOutAction={signOut} />
        </div>
      </div>
    </header>
  );
}
