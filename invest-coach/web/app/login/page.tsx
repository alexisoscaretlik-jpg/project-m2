import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

import { LoginForm } from "./login-form";

export const metadata = {
  title: "Connexion — Invest Coach",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; sent?: string; error?: string }>;
}) {
  const { next, sent, error } = await searchParams;

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/login" />

      <section
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 0%, var(--lavender-100) 0%, var(--paper-50) 60%, var(--paper-50) 100%)",
        }}
      >
        <div
          className="mx-auto px-6 pt-20 pb-16 text-center sm:px-8 sm:pt-24"
          style={{ maxWidth: "560px" }}
        >
          <div className="mb-6 flex justify-center">
            <span className="ic-pill">
              <span className="ic-pill-badge">Connexion</span>
              Lien magique
            </span>
          </div>
          <h1 className="ic-h1 mx-auto" style={{ maxWidth: "440px" }}>
            Te revoilà.
          </h1>
          <p
            className="mx-auto mt-5 text-[16px]"
            style={{
              maxWidth: "420px",
              fontFamily: "var(--font-display)",
              color: "var(--fg-muted)",
              lineHeight: 1.55,
            }}
          >
            On t&apos;envoie un lien magique par e-mail. Aucun mot de passe à
            retenir, aucun champ à remplir deux fois.
          </p>

          <div className="mx-auto mt-10" style={{ maxWidth: "420px" }}>
            {sent ? (
              <div
                className="rounded-2xl p-5 text-left"
                style={{
                  background: "var(--lavender-50)",
                  border: "1px solid var(--lavender-300)",
                }}
              >
                <div
                  className="text-[11px] font-semibold uppercase"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--lavender-700)",
                    letterSpacing: "0.12em",
                  }}
                >
                  Lien envoyé
                </div>
                <p
                  className="mt-2 text-[15px]"
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
                    className="mt-3 text-[13px]"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--terracotta-500)",
                    }}
                  >
                    {error}
                  </p>
                ) : null}
              </>
            )}
          </div>

          <p
            className="mx-auto mt-10 text-[12px]"
            style={{
              maxWidth: "380px",
              fontFamily: "var(--font-display)",
              color: "var(--fg-subtle)",
              lineHeight: 1.5,
            }}
          >
            En continuant, tu acceptes que tes données soient stockées sur
            Supabase (UE). Aucune revente à des tiers.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
