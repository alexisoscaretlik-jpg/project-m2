import Link from "next/link";

const COLS: {
  heading: string;
  links: { label: string; href: string }[];
}[] = [
  {
    heading: "Produit",
    links: [
      { label: "Coaching", href: "/" },
      { label: "Marchés", href: "/markets" },
      { label: "Vue technique", href: "/charts" },
      { label: "Watchlist", href: "/watchlist" },
      { label: "Simulateur", href: "/simulation" },
    ],
  },
  {
    heading: "Apprendre",
    links: [
      { label: "Guides", href: "/articles" },
      { label: "Fiscalité", href: "/tax" },
      { label: "Banque", href: "/bank" },
    ],
  },
  {
    heading: "Compte",
    links: [
      { label: "Connexion", href: "/login" },
      { label: "Abonnement", href: "/subscription" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      className="mt-20 px-8 pb-6 pt-14"
      style={{
        background: "var(--ink-700)",
        color: "var(--paper-200)",
      }}
    >
      <div
        className="mx-auto grid max-w-[1280px] gap-16 pb-10 md:grid-cols-[1fr_2fr]"
        style={{ borderBottom: "1px solid var(--ink-500)" }}
      >
        <div>
          <span
            className="text-[18px] font-semibold tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--paper-50)",
              letterSpacing: "-0.01em",
            }}
          >
            Invest Coach
          </span>
          <p
            className="mt-3 max-w-[280px] text-[15px] italic leading-snug"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--paper-200)",
            }}
          >
            La finance, comme on lit le journal du dimanche.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {COLS.map((col) => (
            <div key={col.heading}>
              <h6
                className="mb-3.5 text-[12px] font-semibold uppercase"
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.08em",
                  color: "var(--paper-50)",
                }}
              >
                {col.heading}
              </h6>
              {col.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block py-1 text-[14px] transition-colors hover:text-[var(--paper-50)]"
                  style={{ color: "var(--paper-200)" }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div
        className="mx-auto flex max-w-[1280px] justify-between pt-6 text-[11px]"
        style={{
          fontFamily: "var(--font-mono)",
          color: "var(--paper-300)",
        }}
      >
        <span>© {new Date().getFullYear()} Invest Coach</span>
        <span>Paris · Île-de-France</span>
      </div>
    </footer>
  );
}
