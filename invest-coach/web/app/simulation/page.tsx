import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

import { SimForm } from "./sim-form";

export const metadata = {
  title: "Simulateur — Invest Coach",
  description:
    "Combien gagnes-tu vraiment selon l'enveloppe ? Compare PEA, assurance-vie, compte-titres et PER. Tous impôts compris.",
};

export default function SimulationPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/simulation" />

      <section
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 0%, var(--lavender-100) 0%, var(--paper-50) 60%, var(--paper-50) 100%)",
        }}
      >
        <div
          className="mx-auto px-6 pt-16 pb-10 text-center sm:px-8 sm:pt-20"
          style={{ maxWidth: "880px" }}
        >
          <div className="mb-6 flex justify-center">
            <span className="ic-pill">
              <span className="ic-pill-badge">Simulateur</span>
              PEA · AV · CTO · PER
            </span>
          </div>
          <h1 className="ic-h1 mx-auto" style={{ maxWidth: "720px" }}>
            Combien gardes-tu vraiment, <em>tous impôts compris&nbsp;?</em>
          </h1>
          <p
            className="mx-auto mt-5 text-[17px]"
            style={{
              maxWidth: "560px",
              fontFamily: "var(--font-display)",
              color: "var(--fg-muted)",
              lineHeight: 1.55,
            }}
          >
            Bouge les curseurs. Compare quatre enveloppes côte à côte. Vois en
            euros la différence sur 10, 20, 30 ans — pas en pourcentages flous.
          </p>

          {/* Decorative comparison-bars illustration. */}
          <svg
            aria-hidden="true"
            className="mx-auto mt-10"
            width="160"
            height="56"
            viewBox="0 0 160 56"
            fill="none"
          >
            <rect x="6"   y="28" width="22" height="22" rx="3" fill="var(--lavender-300)" opacity="0.7" />
            <rect x="36"  y="18" width="22" height="32" rx="3" fill="var(--lavender-400)" opacity="0.85" />
            <rect x="66"  y="6"  width="22" height="44" rx="3" fill="var(--lavender-500)" />
            <rect x="96"  y="20" width="22" height="30" rx="3" fill="var(--lavender-400)" opacity="0.85" />
            <rect x="126" y="24" width="22" height="26" rx="3" fill="var(--lavender-300)" opacity="0.7" />
            <line x1="0" y1="50" x2="160" y2="50" stroke="var(--border)" strokeWidth="1" />
          </svg>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 pb-16 sm:px-8">
        <SimForm />
      </div>

      <Footer />
    </main>
  );
}
