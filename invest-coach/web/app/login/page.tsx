import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

import { LoginForm } from "./login-form";

export const metadata = {
  title: "Connexion — Invest Coach",
};

// Misty mountain — same atmospheric W&C photo used on the homepage
// hero. Repetition reinforces the visual identity, and "calme +
// hauteur" matches the magic-link "tu reçois, tu cliques" promise.
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=85";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; sent?: string; error?: string }>;
}) {
  const { next, sent, error } = await searchParams;

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/login" />

      {/* Row 1 — rose hero with mega wordmark stack. */}
      <section
        className="ic-block-rose px-6 pt-12 pb-8 sm:px-8 sm:pt-16 sm:pb-12"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
        aria-labelledby="login-mark"
      >
        <span className="ic-eyebrow-mono">Connexion</span>
        <h1 id="login-mark" className="mt-5">
          <span className="ic-mega" style={{ fontSize: "clamp(56px, 13vw, 200px)" }}>
            TE REVOILÀ.
          </span>
        </h1>
      </section>

      {/* Row 2 — mono tagline strip. */}
      <p className="ic-strip">
        Lien magique · Sans mot de passe · Données hébergées en France
      </p>

      {/* Row 3 — lilac (form) × misty-mountain photo split. */}
      <div
        className="grid md:grid-cols-2"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        <div
          className="ic-block-lilac flex min-h-[460px] flex-col justify-between px-6 py-12 sm:px-10 sm:py-16 md:min-h-[560px]"
          style={{ borderRight: "1px solid var(--ink-700)" }}
        >
          <div>
            <span className="ic-eyebrow-mono mb-6 inline-flex">La méthode</span>
            <h2
              className="ic-bigsection mb-6"
              style={{ fontSize: "clamp(30px, 4.4vw, 56px)" }}
            >
              On t&apos;envoie<br />un lien.<br />Tu cliques.
            </h2>
            <p
              className="max-w-[420px] text-[16px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--ink-700)",
                lineHeight: 1.55,
              }}
            >
              Aucun mot de passe à retenir, aucun champ à remplir deux fois.
              On t&apos;envoie un lien magique par e-mail — tu cliques, tu es
              connecté. Tes données sont stockées sur Supabase (UE), aucune
              revente à des tiers.
            </p>
          </div>

          <div className="mt-10">
            {sent ? (
              <div
                className="ic-block-peach"
                style={{
                  border: "1px solid var(--ink-700)",
                  padding: "24px 24px",
                }}
              >
                <span className="ic-eyebrow-mono">Lien envoyé</span>
                <p
                  className="mt-3 text-[15px]"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--ink-700)",
                    lineHeight: 1.5,
                  }}
                >
                  Check tes mails. Ouvre le lien pour te connecter — pense à
                  vérifier tes spams si rien n&apos;arrive en 30 secondes.
                </p>
              </div>
            ) : (
              <>
                <LoginForm next={next ?? "/watchlist"} />
                {error ? (
                  <p
                    className="mt-3 text-[11px]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--ink-700)",
                      background: "var(--rose-100)",
                      border: "1px solid var(--ink-700)",
                      padding: "8px 12px",
                    }}
                  >
                    ↳ {error}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div
          className="relative min-h-[260px] md:min-h-[560px]"
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

      {/* Row 4 — three reassurance strips, bordered ink. */}
      <section
        className="px-6 py-16 sm:px-8"
        style={{
          background: "var(--paper-0)",
          borderBottom: "1px solid var(--ink-700)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "1280px" }}>
          <ul
            className="grid md:grid-cols-3"
            style={{ border: "1px solid var(--ink-700)" }}
          >
            {[
              {
                k: "Sans mot de passe",
                v: "Le lien magique expire après 60 minutes — on ne stocke rien que tu doives retenir.",
              },
              {
                k: "Données en France",
                v: "Hébergement Supabase région Frankfurt (UE), conforme RGPD.",
              },
              {
                k: "Aucune revente",
                v: "Ton e-mail ne quitte jamais notre base. Pas d'affiliation, pas de partenaires.",
              },
            ].map((p, i, arr) => (
              <li
                key={p.k}
                className="px-6 py-10 sm:px-8 sm:py-12"
                style={{
                  borderRight:
                    i < arr.length - 1
                      ? "1px solid var(--ink-700)"
                      : "none",
                }}
              >
                <span className="ic-eyebrow-mono">{p.k}</span>
                <p
                  className="mt-4 text-[15px]"
                  style={{
                    fontFamily: "var(--font-source-serif), Georgia, serif",
                    fontStyle: "italic",
                    color: "var(--ink-700)",
                    lineHeight: 1.55,
                  }}
                >
                  « {p.v} »
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Footer />
    </main>
  );
}
