import Link from "next/link";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import {
  PRODUCTS,
  CATEGORY_LABEL,
  CATEGORY_DESC,
  type Product,
  type ProductCategory,
} from "@/lib/tax/products";

export const metadata = {
  title: "Offres en cours · Investissements fiscaux — Invest Coach",
  description:
    "Catalogue des produits d'investissement fiscalement optimisés actuellement ouverts à la souscription en France : Girardin Industriel, FIP / FCPI, GFF (forêts), SCPI fiscales, LMNP, PER, AV.",
};

// Spiral staircase (Unsplash 67Ws06I8yv4) — same hero as /outils for
// continuity (this page is the marketplace half of the toolset).
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1774618683913-b8262a72fa53?auto=format&fit=crop&w=1600&q=85";

const STATUS_BG: Record<Product["status"], string> = {
  open: "var(--lavender-200)",         // lilac
  "closing-soon": "var(--terracotta-100)", // peach
  closed: "var(--paper-100)",           // off-white (greyed)
};

const STATUS_LABEL: Record<Product["status"], string> = {
  open: "Ouvert",
  "closing-soon": "Clôture proche",
  closed: "Clôturé",
};

// Group products by category, preserving insertion order.
function groupByCategory(): Map<ProductCategory, Product[]> {
  const map = new Map<ProductCategory, Product[]>();
  for (const p of PRODUCTS) {
    const arr = map.get(p.category) ?? [];
    arr.push(p);
    map.set(p.category, arr);
  }
  return map;
}

function ProductCard({ p }: { p: Product }) {
  const open = p.status === "open" || p.status === "closing-soon";
  return (
    <article className="flex h-full flex-col">
      <div className="flex flex-1 flex-col gap-4 p-6">
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
              background: STATUS_BG[p.status],
            }}
          >
            ↳ {STATUS_LABEL[p.status]}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink-700)",
              opacity: 0.7,
            }}
          >
            Millésime {p.millesime}
          </span>
        </div>

        <div>
          <h3
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
            {p.name}
          </h3>
          <p
            className="mt-2"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink-700)",
              opacity: 0.7,
            }}
          >
            ↳ par {p.distributor}
          </p>
        </div>

        <p
          className="text-[14px]"
          style={{
            fontFamily: "var(--font-source-serif), Georgia, serif",
            fontStyle: "italic",
            color: "var(--ink-700)",
            lineHeight: 1.55,
          }}
        >
          « {p.pitch} »
        </p>

        <dl
          className="mt-2"
          style={{
            borderTop: "1px solid var(--ink-700)",
            borderBottom: "1px solid var(--ink-700)",
          }}
        >
          {[
            { k: "Avantage fiscal", v: p.taxCredit },
            { k: "Ticket", v: p.ticket },
            { k: "Blocage", v: p.lockup },
            { k: "Risque", v: p.risk },
            { k: "Clôture", v: p.closing },
          ].map((row, i, arr) => (
            <div
              key={row.k}
              className="grid grid-cols-[110px_1fr] gap-3 py-2.5"
              style={{
                borderBottom:
                  i < arr.length - 1
                    ? "1px solid var(--ink-700)"
                    : "none",
                fontSize: "12px",
                lineHeight: 1.45,
              }}
            >
              <dt
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--ink-700)",
                  opacity: 0.65,
                }}
              >
                {row.k}
              </dt>
              <dd
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--ink-700)",
                  marginLeft: 0,
                }}
              >
                {row.v}
              </dd>
            </div>
          ))}
        </dl>

        <a
          href={p.url}
          target="_blank"
          rel="noreferrer noopener"
          className={open ? "ic-btn-block w-full mt-2" : "ic-btn-block-light w-full mt-2"}
          aria-disabled={!open}
          style={open ? undefined : { pointerEvents: "none", opacity: 0.5 }}
        >
          {open ? "↳ Voir le produit" : "↳ Clôturé"}
        </a>
      </div>
    </article>
  );
}

export default function ProduitsPage() {
  const grouped = groupByCategory();
  const orderedCategories: ProductCategory[] = [
    "girardin",
    "fip-fcpi",
    "gff",
    "scpi-fiscale",
    "lmnp",
    "per",
    "av",
  ];

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/produits" />

      {/* Row 1 — peach hero with mega wordmark stack. */}
      <section
        className="ic-block-peach px-6 pt-12 pb-8 sm:px-8 sm:pt-16 sm:pb-12"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
        aria-labelledby="produits-mark"
      >
        <span className="ic-eyebrow-mono">Offres en cours</span>
        <h1 id="produits-mark" className="mt-5">
          <span className="ic-mega" style={{ fontSize: "clamp(48px, 11vw, 168px)" }}>
            INVESTIR
          </span>
          <span className="ic-mega" style={{ fontSize: "clamp(48px, 11vw, 168px)" }}>
            EN PAYANT MOINS
          </span>
        </h1>
      </section>

      {/* Row 2 — mono tagline strip. */}
      <p className="ic-strip">
        {PRODUCTS.length} produits curés · 7 catégories fiscales · Millésimes 2026
      </p>

      {/* Row 3 — lilac × staircase split: explanation. */}
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
              On t&apos;ouvre le produit.
            </h2>
            <p
              className="max-w-[460px] text-[16px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--ink-700)",
                lineHeight: 1.55,
              }}
            >
              Tu connais le levier (PER, GFF, Girardin…), tu sais ton TMI,
              tu cherches maintenant un produit concret à signer. Voilà
              les offres françaises actuellement ouvertes — par catégorie,
              avec millésime, ticket, blocage et clôture. Les liens
              partenaires sont transparents (voir bandeau plus bas).
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/tax/levers" className="ic-btn-block">
              ↳ D&apos;abord, comprendre le levier
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
              Pas de conseil personnalisé · Pas de pré-sélection AMF
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

      {/* Row 4 — affiliate transparency disclosure (rose pastel). */}
      <section
        className="ic-block-rose px-6 py-10 sm:px-8 sm:py-12"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        <div className="mx-auto" style={{ maxWidth: "1080px" }}>
          <span className="ic-eyebrow-mono">Transparence</span>
          <p
            className="mt-4 text-[15px] sm:text-[16px]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--ink-700)",
              lineHeight: 1.6,
            }}
          >
            Les liens « Voir le produit » portent un{" "}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700 }}>
              ?utm_source=invest-coach
            </span>{" "}
            qui permet aux distributeurs d&apos;identifier le trafic
            qu&apos;on leur amène. Quand on signe un parrainage formel, on
            le remplace par notre code et on touche une commission par
            souscription. <strong>Aucun produit n&apos;est listé ici
            uniquement parce qu&apos;il rémunère.</strong> Les produits
            cités passent notre filtre éditorial — sinon ils ne sont pas
            sur cette page.
          </p>
        </div>
      </section>

      {/* Row 5 — categories. Each category gets a pastel header section
          (alternating) followed by an ink-bordered card grid. */}
      {orderedCategories.map((cat, idx) => {
        const products = grouped.get(cat) ?? [];
        if (products.length === 0) return null;

        const pastelClasses = [
          "ic-block-rose",
          "ic-block-lilac",
          "ic-block-peach",
        ];
        const pastelClass = pastelClasses[idx % pastelClasses.length];

        return (
          <section key={cat} id={cat} style={{ borderBottom: "1px solid var(--ink-700)" }}>
            <div
              className={`${pastelClass} px-6 py-10 sm:px-8 sm:py-14`}
              style={{ borderBottom: "1px solid var(--ink-700)" }}
            >
              <div className="mx-auto" style={{ maxWidth: "1280px" }}>
                <div className="flex flex-col gap-3 md:flex-row md:items-baseline md:justify-between">
                  <div>
                    <span className="ic-eyebrow-mono">
                      {String(idx + 1).padStart(2, "0")} · {CATEGORY_LABEL[cat]}
                    </span>
                    <h2
                      className="ic-bigsection mt-4"
                      style={{ fontSize: "clamp(28px, 4vw, 52px)" }}
                    >
                      {CATEGORY_LABEL[cat]}
                    </h2>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--ink-700)",
                      opacity: 0.75,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {products.length} {products.length > 1 ? "offres" : "offre"}
                  </span>
                </div>
                <p
                  className="mt-5 max-w-[760px] text-[15px] sm:text-[16px]"
                  style={{
                    fontFamily: "var(--font-source-serif), Georgia, serif",
                    fontStyle: "italic",
                    color: "var(--ink-700)",
                    lineHeight: 1.6,
                  }}
                >
                  « {CATEGORY_DESC[cat]} »
                </p>
              </div>
            </div>

            <div
              className="px-6 py-10 sm:px-8 sm:py-14"
              style={{ background: "var(--paper-0)" }}
            >
              <div className="mx-auto" style={{ maxWidth: "1280px" }}>
                <ul
                  className="grid md:grid-cols-2 lg:grid-cols-3"
                  style={{ border: "1px solid var(--ink-700)" }}
                >
                  {products.map((p, i) => {
                    const colCount = 3;
                    const col = i % colCount;
                    const totalRows = Math.ceil(products.length / colCount);
                    const row = Math.floor(i / colCount);
                    const isLastRow = row === totalRows - 1;
                    return (
                      <li
                        key={p.id}
                        style={{
                          borderRight:
                            col < colCount - 1
                              ? "1px solid var(--ink-700)"
                              : "none",
                          borderBottom: !isLastRow
                            ? "1px solid var(--ink-700)"
                            : "none",
                        }}
                      >
                        <ProductCard p={p} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>
        );
      })}

      {/* Bottom — disclaimer strip. */}
      <p className="ic-strip">
        Pas de conseil en investissement personnalisé · Confirme avec un expert · Risque de perte en capital pour les produits non garantis
      </p>

      <Footer />
    </main>
  );
}
