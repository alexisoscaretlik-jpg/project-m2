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
      { label: "Podcast", href: "/podcast" },
      { label: "Newsletter", href: "/newsletter" },
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
      style={{
        background: "var(--paper-0)",
        borderTop: "1px solid var(--ink-700)",
      }}
    >
      <div
        className="mx-auto grid gap-12 px-6 pb-10 pt-16 md:grid-cols-[1fr_2fr] md:gap-20"
        style={{ maxWidth: "1280px" }}
      >
        <div>
          <div className="ic-brand-cell">
            <span>IC</span>
            <span>INVEST&nbsp;COACH</span>
          </div>
          <p
            className="mt-5 max-w-[280px] text-[14px] italic leading-snug"
            style={{
              fontFamily: "var(--font-source-serif), Georgia, serif",
              color: "var(--fg-muted)",
            }}
          >
            La finance, comme on lit le journal du dimanche.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {COLS.map((col) => (
            <div key={col.heading}>
              <h6
                className="mb-4"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--ink-700)",
                }}
              >
                ↳ {col.heading}
              </h6>
              {col.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block py-1 text-[14px] transition-opacity hover:opacity-60"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--ink-700)",
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div
        className="mx-auto px-6 pb-6"
        style={{ maxWidth: "1280px", borderTop: "1px solid var(--ink-700)" }}
      >
        <div
          aria-hidden="true"
          className="ic-mega select-none pt-6"
          style={{
            fontSize: "clamp(56px, 16vw, 220px)",
            color: "var(--ink-700)",
            opacity: 0.95,
          }}
        >
          INVEST&nbsp;COACH
        </div>
        <div
          className="mt-8 flex flex-wrap items-baseline justify-between gap-3"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--fg-muted)",
            letterSpacing: "0.08em",
          }}
        >
          <span>© {new Date().getFullYear()} INVEST COACH</span>
          <span>PARIS · ÎLE-DE-FRANCE</span>
        </div>
      </div>
    </footer>
  );
}
