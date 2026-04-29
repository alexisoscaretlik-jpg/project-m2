"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Slide-in side drawer triggered by a hamburger button.
// Includes the full site map (more entries than the inline desktop nav)
// and is the primary mobile navigation. Drawer slides from the right,
// dark overlay behind, ESC and backdrop click both close it.
//
// On desktop (>= md) this is hidden — the inline nav in `nav.tsx` is the
// primary navigation. Could be re-enabled on desktop later as a "more"
// drawer if the site map keeps growing.

const DRAWER_LINKS: { href: string; label: string; group: "main" | "outils" | "compte" }[] = [
  { href: "/",             label: "Accueil",        group: "main" },
  { href: "/articles",     label: "Articles",       group: "main" },
  { href: "/podcast",      label: "Podcast",        group: "main" },
  { href: "/outils",       label: "Outils",         group: "outils" },
  { href: "/simulation",   label: "Simulateur",     group: "outils" },
  { href: "/markets",      label: "Marchés",        group: "outils" },
  { href: "/companies",    label: "Entreprises",    group: "outils" },
  { href: "/watchlist",    label: "Watchlist",      group: "outils" },
  { href: "/#tarifs",      label: "Tarifs",         group: "compte" },
  { href: "/subscription", label: "Abonnement",     group: "compte" },
];

const GROUP_LABEL: Record<"main" | "outils" | "compte", string> = {
  main:   "Découvrir",
  outils: "Tes outils",
  compte: "Compte",
};

export function NavDrawer({
  userEmail,
  signOutAction,
}: {
  userEmail: string | null;
  signOutAction?: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);

  // Close on ESC + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function close() { setOpen(false); }

  const grouped: Record<string, typeof DRAWER_LINKS> = { main: [], outils: [], compte: [] };
  for (const l of DRAWER_LINKS) grouped[l.group].push(l);

  return (
    <>
      {/* Hamburger trigger — visible on mobile only. */}
      <button
        type="button"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-[var(--paper-100)] md:hidden"
        style={{ color: "var(--ink-700)" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4"  y1="7"  x2="20" y2="7"  />
          <line x1="4"  y1="12" x2="20" y2="12" />
          <line x1="4"  y1="17" x2="20" y2="17" />
        </svg>
      </button>

      {/* Backdrop */}
      <div
        aria-hidden={!open}
        onClick={close}
        className="fixed inset-0 z-[60] transition-opacity duration-200"
        style={{
          background: "rgba(20, 16, 40, 0.55)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* Drawer panel — slides in from the right. */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        className="fixed right-0 top-0 z-[70] flex h-full w-[86%] max-w-[360px] flex-col transition-transform duration-300"
        style={{
          background: "var(--paper-50)",
          borderLeft: "1px solid var(--border)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          boxShadow: open ? "-12px 0 32px -10px rgba(20,16,40,0.25)" : "none",
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <Link
            href="/"
            onClick={close}
            className="text-[16px] font-bold"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--ink-700)",
              letterSpacing: "-0.02em",
            }}
          >
            Invest Coach
          </Link>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={close}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--paper-100)]"
            style={{ color: "var(--fg-muted)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6"  y1="6"  x2="18" y2="18" />
              <line x1="18" y1="6"  x2="6"  y2="18" />
            </svg>
          </button>
        </div>

        {/* Drawer body — grouped links */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {(["main", "outils", "compte"] as const).map((g) => (
            <div key={g} className="mb-7 last:mb-0">
              <div
                className="mb-2 text-[10px] font-bold uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--lavender-700)",
                  letterSpacing: "0.16em",
                }}
              >
                {GROUP_LABEL[g]}
              </div>
              <ul className="space-y-0.5">
                {grouped[g].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={close}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--paper-100)]"
                      style={{
                        fontFamily: "var(--font-display)",
                        color: "var(--ink-700)",
                      }}
                    >
                      <span className="text-[15px] font-medium">{l.label}</span>
                      <span aria-hidden="true" style={{ color: "var(--lavender-700)" }}>→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Drawer footer — auth */}
        <div
          className="px-5 py-5"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {userEmail ? (
            <div className="space-y-3">
              <div
                className="truncate text-[12px]"
                style={{ fontFamily: "var(--font-mono)", color: "var(--fg-subtle)" }}
              >
                {userEmail}
              </div>
              {signOutAction ? (
                <form action={signOutAction}>
                  <button
                    type="submit"
                    onClick={close}
                    className="w-full rounded-full py-2.5 text-[14px] font-semibold transition-colors"
                    style={{
                      fontFamily: "var(--font-display)",
                      background: "var(--paper-200)",
                      color: "var(--ink-700)",
                    }}
                  >
                    Déconnexion
                  </button>
                </form>
              ) : null}
            </div>
          ) : (
            <Link
              href="/login"
              onClick={close}
              className="block w-full rounded-full py-3 text-center text-[14px] font-semibold transition-colors"
              style={{
                fontFamily: "var(--font-display)",
                background: "var(--ink-700)",
                color: "var(--paper-0)",
              }}
            >
              Connexion · gratuit
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
