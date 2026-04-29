import Link from "next/link";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Page introuvable",
};

export default function NotFound() {
  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="" />

      <section
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 0%, var(--lavender-100) 0%, var(--paper-50) 60%, var(--paper-50) 100%)",
        }}
      >
        <div
          className="relative mx-auto px-6 py-32 text-center sm:px-8 sm:py-40"
          style={{ maxWidth: "720px" }}
        >
          <div
            className="mb-6 text-[14px] font-bold uppercase"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--lavender-700)",
              letterSpacing: "0.20em",
            }}
          >
            Erreur 404
          </div>
          <h1 className="ic-h1 mx-auto" style={{ maxWidth: "640px" }}>
            Cette page <em>n&apos;existe pas (encore).</em>
          </h1>
          <p
            className="mx-auto mt-5 text-[17px]"
            style={{
              maxWidth: "520px",
              fontFamily: "var(--font-display)",
              color: "var(--fg-muted)",
              lineHeight: 1.55,
            }}
          >
            Soit le lien est cassé, soit la page a déménagé. Rien de grave —
            voici les chemins les plus utiles.
          </p>

          <div className="mx-auto mt-10 grid max-w-[520px] gap-3 sm:grid-cols-2">
            {[
              { href: "/", label: "Accueil", desc: "La méthode en une page" },
              { href: "/articles", label: "Articles", desc: "Le journal du dimanche" },
              { href: "/podcast", label: "Podcast", desc: "Vingt minutes par épisode" },
              { href: "/pricing", label: "Tarifs", desc: "Trois formules, annulable" },
            ].map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className="rounded-2xl px-5 py-4 text-left transition-colors hover:translate-y-[-1px]"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="text-[15px] font-semibold"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--ink-700)",
                  }}
                >
                  {it.label} <span style={{ color: "var(--lavender-700)" }}>→</span>
                </div>
                <div
                  className="mt-1 text-[12px]"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--fg-muted)",
                  }}
                >
                  {it.desc}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
