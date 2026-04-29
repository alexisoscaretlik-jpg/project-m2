"use client";

import { useEffect, useState } from "react";

// Tab navigation that scroll-snaps to one of the four product cards.
// Tracks which card is closest to viewport center via IntersectionObserver
// so the active tab updates as the user scrolls. Inspired by the Framer
// Powder template's tabbed product-feature section.

const TABS: { id: string; label: string; index: string }[] = [
  { id: "product-fiscalite",  label: "Fiscalité",  index: "01" },
  { id: "product-watchlist",  label: "Watchlist",  index: "02" },
  { id: "product-simulateur", label: "Simulateur", index: "03" },
  { id: "product-podcast",    label: "Podcast",    index: "04" },
];

export function ProductTabsNav() {
  const [activeId, setActiveId] = useState<string>(TABS[0].id);

  useEffect(() => {
    const targets = TABS.map((t) => document.getElementById(t.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the viewport center.
        let bestId: string | null = null;
        let bestDist = Infinity;
        const center = window.innerHeight / 2;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const rect = e.boundingClientRect;
          const dist = Math.abs(rect.top + rect.height / 2 - center);
          if (dist < bestDist) {
            bestDist = dist;
            bestId = e.target.id;
          }
        }
        if (bestId) setActiveId(bestId);
      },
      { rootMargin: "-30% 0px -30% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    for (const el of targets) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function jumpTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      className="-mx-2 mb-10 flex justify-center overflow-x-auto px-2"
      aria-label="Aperçu des outils"
    >
      <ul
        className="inline-flex items-center gap-1 rounded-full p-1"
        style={{
          background: "var(--paper-0)",
          border: "1px solid var(--border)",
        }}
      >
        {TABS.map((t) => {
          const active = t.id === activeId;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => jumpTo(t.id)}
                aria-current={active ? "true" : undefined}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors"
                style={{
                  fontFamily: "var(--font-display)",
                  background: active ? "var(--ink-700)" : "transparent",
                  color: active ? "var(--paper-0)" : "var(--fg-muted)",
                }}
              >
                <span
                  className="text-[10px] font-bold"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: active ? "var(--lavender-200)" : "var(--fg-subtle)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {t.index}
                </span>
                {t.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
