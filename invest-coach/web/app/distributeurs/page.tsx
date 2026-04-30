import Link from "next/link";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import {
  DISTRIBUTOR_CATEGORIES,
  type Distributor,
  type DistributorTier,
} from "@/lib/tax/distributors";

export const metadata = {
  title: "Distributeurs · Où souscrire — Invest Coach",
  description:
    "Cartographie indépendante des distributeurs français de produits fiscalement optimisés : PER, AV, PEA, SCPI fiscales, GFF (forêts), FIP/FCPI, Girardin, LMNP, dons. Liens partenaires transparents.",
};

// Spiral staircase (Unsplash 67Ws06I8yv4) — same hero photo as /outils
// because this page is the distribution surface of the toolset.
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1774618683913-b8262a72fa53?auto=format&fit=crop&w=1600&q=85";

const TIER_BG: Record<DistributorTier, string> = {
  leader: "var(--lavender-200)",      // lilac
  challenger: "var(--terracotta-100)", // peach
  niche: "var(--paper-100)",           // off-white
};

const TIER_LABEL: Record<DistributorTier, string> = {
  leader: "Leader",
  challenger: "Alternative",
  niche: "Niche",
};

function DistributorCard({ d }: { d: Distributor }) {
  return (
    <a
      href={d.url}
      target="_blank"
      rel="noreferrer noopener"
      className="block h-full transition-colors hover:bg-[var(--paper-100)]"
    >
      <article className="flex h-full flex-col gap-3 p-6">
        <div className="flex items-baseline justify-between gap-3">
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-700)",
              border: "1px solid var(--ink-700)",
              padding: "3px 8px",
              background: TIER_BG[d.tier],
            }}
          >
            ↳ {TIER_LABEL[d.tier]}
          </span>
          <span
            aria-hidden="true"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--ink-700)",
            }}
          >
            ↗
          </span>
        </div>
        <h4
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            color: "var(--ink-700)",
            textTransform: "uppercase",
          }}
        >
          {d.name}
        </h4>
        <p
          className="flex-1 text-[14px]"
          style={{
            fontFamily: "var(--font-source-serif), Georgia, serif",
            fontStyle: "italic",
            color: "var(--ink-700)",
            lineHeight: 1.55,
          }}
        >
          « {d.pitch} »
        </p>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-700)",
            opacity: 0.6,
          }}
        >
          ↳ Visiter le site
        </span>
      </article>
    </a>
  );
}

export default function DistributeursPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/distributeurs" />

      {/* Row 1 — peach hero with mega wordmark stack. */}
      <section
        className="ic-block-peach px-6 pt-12 pb-8 sm:px-8 sm:pt-16 sm:pb-12"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
        aria-labelledby="distrib-mark"
      >
        <span className="ic-eyebrow-mono">Distributeurs</span>
        <h1 id="distrib-mark" className="mt-5">
          <span className="ic-mega" style={{ fontSize: "clamp(48px, 11vw, 168px)" }}>
            OÙ SOUSCRIRE
          </span>
          <span className="ic-mega" style={{ fontSize: "clamp(48px, 11vw, 168px)" }}>
            CHAQUE LEVIER
          </span>
        </h1>
      </section>

      {/* Row 2 — mono tagline strip. */}
      <p className="ic-strip">
        Cartographie indépendante · Liens partenaires transparents · {DISTRIBUTOR_CATEGORIES.length} catégories
      </p>

      {/* Row 3 — lilac × staircase split: explanation + transparency. */}
      <div
        className="grid md:grid-cols-2"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        <div
          className="ic-block-lilac flex min-h-[420px] flex-col justify-between px-6 py-12 sm:px-10 sm:py-16 md:min-h-[520px]"
          style={{ borderRight: "1px solid var(--ink-700)" }}
        >
          <div>
            <span className="ic-eyebrow-mono mb-6 inline-flex">La méthode</span>
            <h2
              className="ic-bigsection mb-6"
              style={{ fontSize: "clamp(32px, 4.6vw, 64px)" }}
            >
              On lit le levier.<br />
              Tu choisis le produit.
            </h2>
            <p
              className="max-w-[460px] text-[16px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--ink-700)",
                lineHeight: 1.55,
              }}
            >
              Chaque levier fiscal a son produit, et chaque produit a son
              distributeur. On t&apos;a cartographié, par catégorie, les
              acteurs français qu&apos;on souscrirait nous-mêmes — pas tout
              le marché, juste ceux qui passent notre filtre.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/tax" className="ic-btn-block">
              ↳ Voir mes leviers chiffrés
            </Link>
            <p
              className="text-[11px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--ink-700)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Pas de pré-sélection AMF · Pas de conseil personnalisé
            </p>
          </div>
        </div>

        <div
          className="relative min-h-[260px] md:min-h-[520px]"
          style={{ background: "var(--ink-700)" }}
        >
          <img
            src={HERO_PHOTO}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ display: "block" }}
          />
        </div>
      </div>

      {/* Row 4 — affiliate disclosure strip (always visible, before the cards). */}
      <section
        className="ic-block-rose px-6 py-10 sm:px-8 sm:py-12"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        <div className="mx-auto" style={{ maxWidth: "1080px" }}>
          <span className="ic-eyebrow-mono">Transparence</span>
          <p
            className="mt-4 text-[16px]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--ink-700)",
              lineHeight: 1.6,
            }}
          >
            Les liens ci-dessous portent un <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700 }}>?utm_source=invest-coach</span>{" "}
            qui permet aux distributeurs d&apos;identifier le trafic
            qu&apos;on leur amène. Quand on signe un programme de parrainage
            formel avec l&apos;un d&apos;entre eux, on remplace l&apos;UTM
            par notre code et on touche une petite commission par
            souscription. <strong>On n&apos;ajoutera jamais un produit
            uniquement parce qu&apos;il rémunère.</strong> Si tu vois un
            distributeur listé ici, c&apos;est qu&apos;on le citerait
            même sans accord commercial.
          </p>
        </div>
      </section>

      {/* Row 5 — categories. Each is a section with a pastel header
          (rotating) + bordered card grid. */}
      {DISTRIBUTOR_CATEGORIES.map((cat, idx) => {
        const pastelClasses = [
          "ic-block-rose",
          "ic-block-lilac",
          "ic-block-peach",
        ];
        const pastelClass = pastelClasses[idx % pastelClasses.length];
        const isLast = idx === DISTRIBUTOR_CATEGORIES.length - 1;

        return (
          <section
            key={cat.slug}
            id={cat.slug}
            style={{ borderBottom: !isLast ? "1px solid var(--ink-700)" : "none" }}
          >
            <div
              className={`${pastelClass} px-6 py-10 sm:px-8 sm:py-14`}
              style={{ borderBottom: "1px solid var(--ink-700)" }}
            >
              <div className="mx-auto" style={{ maxWidth: "1280px" }}>
                <div className="flex flex-col gap-3 md:flex-row md:items-baseline md:justify-between">
                  <div>
                    <span className="ic-eyebrow-mono">
                      {String(idx + 1).padStart(2, "0")} · {cat.label}
                    </span>
                    <h2
                      className="ic-bigsection mt-4"
                      style={{ fontSize: "clamp(28px, 4vw, 52px)" }}
                    >
                      {cat.taxCredit}
                    </h2>
                  </div>
                  <Link
                    href={`/tax`}
                    className="text-[11px]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--ink-700)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      textDecoration: "underline",
                      textUnderlineOffset: "4px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ↳ Calculer mon impact
                  </Link>
                </div>
                <p
                  className="mt-5 max-w-[720px] text-[15px] sm:text-[16px]"
                  style={{
                    fontFamily: "var(--font-source-serif), Georgia, serif",
                    fontStyle: "italic",
                    color: "var(--ink-700)",
                    lineHeight: 1.6,
                  }}
                >
                  « {cat.description} »
                </p>
              </div>
            </div>

            <div
              className="px-6 py-10 sm:px-8 sm:py-14"
              style={{ background: "var(--paper-0)" }}
            >
              <div className="mx-auto" style={{ maxWidth: "1280px" }}>
                <ul
                  className="grid md:grid-cols-2 lg:grid-cols-4"
                  style={{ border: "1px solid var(--ink-700)" }}
                >
                  {cat.distributors.map((d, i) => {
                    const colCount = 4;
                    const col = i % colCount;
                    const totalRows = Math.ceil(cat.distributors.length / colCount);
                    const row = Math.floor(i / colCount);
                    const isLastRow = row === totalRows - 1;
                    return (
                      <li
                        key={d.name}
                        style={{
                          borderRight:
                            col < colCount - 1
                              ? "1px solid var(--ink-700)"
                              : "none",
                          borderBottom: !isLastRow ? "1px solid var(--ink-700)" : "none",
                        }}
                      >
                        <DistributorCard d={d} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>
        );
      })}

      {/* Bottom — full disclaimer strip. */}
      <p className="ic-strip">
        Pas de conseil en investissement personnalisé · Confirme avec un expert · Risque de perte en capital pour les produits non garantis
      </p>

      <Footer />
    </main>
  );
}
