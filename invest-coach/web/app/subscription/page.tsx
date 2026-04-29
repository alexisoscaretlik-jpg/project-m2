import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { requireUser } from "@/lib/supabase/require-auth";

import { openPortal, startCheckout } from "./actions";

type Tier = "free" | "plus" | "wealth";

type Profile = {
  tier: Tier;
  current_period_end: string | null;
  stripe_customer_id: string | null;
};

const TIERS: Array<{
  key: Tier;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  highlighted: boolean;
}> = [
  {
    key: "free",
    name: "Free",
    price: "0 €",
    cadence: "pour toujours",
    tagline: "Le coaching quotidien, gratuit.",
    features: [
      "Fil chronologique des publications SEC",
      "10 entreprises suivies",
      "Watchlist",
    ],
    highlighted: false,
  },
  {
    key: "plus",
    name: "Plus",
    price: "9 €",
    cadence: "/ mois",
    tagline: "Alertes + optimisation fiscale.",
    features: [
      "Tout le contenu Free",
      "Alertes email sur les 8-K matériels",
      "Optimisation fiscale (PEA, AV, PER)",
      "Téléversement de ton avis d'imposition",
    ],
    highlighted: true,
  },
  {
    key: "wealth",
    name: "Wealth",
    price: "19 €",
    cadence: "/ mois",
    tagline: "Le coaching patrimoine complet.",
    features: [
      "Tout le contenu Plus",
      "Connexion bancaire (PSD2)",
      "Coach des dépenses",
      "Plan d'investissement mensuel",
    ],
    highlighted: false,
  },
];

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const { user, supabase: sb } = await requireUser("/subscription");

  const { data: profile } = await sb
    .from("profiles")
    .select("tier, current_period_end, stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle<Profile>();

  const currentTier: Tier = profile?.tier ?? "free";

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/subscription" />

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
              <span className="ic-pill-badge">Abonnement</span>
              Annulable à tout moment · TVA française incluse
            </span>
          </div>
          <h1 className="ic-h1 mx-auto" style={{ maxWidth: "720px" }}>
            Choisis ton plan. <em>Annule quand tu veux.</em>
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
            Trois plans, trois engagements. Tu peux passer de l&apos;un à
            l&apos;autre à tout moment depuis le portail de gestion.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
        {status === "success" ? (
          <p
            className="mb-6 rounded-2xl px-5 py-4 text-[14px]"
            style={{
              background: "var(--forest-50)",
              color: "var(--forest-700)",
              fontFamily: "var(--font-display)",
              border: "1px solid rgba(100,140,94,0.25)",
            }}
          >
            Paiement validé. Ton plan s&apos;active dans quelques secondes.
            Rafraîchis si besoin.
          </p>
        ) : null}
        {status === "cancelled" ? (
          <p
            className="mb-6 rounded-2xl px-5 py-4 text-[14px]"
            style={{
              background: "var(--terracotta-50)",
              color: "var(--terracotta-700)",
              fontFamily: "var(--font-display)",
              border: "1px solid rgba(204,116,72,0.25)",
            }}
          >
            Paiement annulé. Aucun débit n&apos;a été effectué.
          </p>
        ) : null}

        <div className="grid gap-5 md:grid-cols-3">
          {TIERS.map((t) => {
            const isCurrent = t.key === currentTier;
            const isFree = t.key === "free";
            return (
              <article
                key={t.key}
                className="flex flex-col"
                style={{
                  background: t.highlighted
                    ? "var(--lavender-50)"
                    : "var(--bg-elevated)",
                  border: t.highlighted
                    ? "1.5px solid var(--lavender-500)"
                    : "1px solid var(--border)",
                  borderRadius: "var(--r-2xl)",
                  padding: "28px 26px",
                  boxShadow: t.highlighted
                    ? "0 12px 32px -16px rgba(124,91,250,0.35)"
                    : "none",
                }}
              >
                {t.highlighted ? (
                  <div
                    className="mb-3 inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                    style={{
                      background: "var(--lavender-600)",
                      color: "var(--paper-0)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Recommandé
                  </div>
                ) : null}

                <div className="flex items-baseline justify-between">
                  <h2
                    className="text-[20px] font-bold"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--ink-700)",
                    }}
                  >
                    {t.name}
                  </h2>
                  {isCurrent ? (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                      style={{
                        fontFamily: "var(--font-display)",
                        background: "var(--forest-50)",
                        color: "var(--forest-700)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      En cours
                    </span>
                  ) : null}
                </div>

                <p
                  className="mt-2 text-[13px]"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--fg-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {t.tagline}
                </p>

                <p
                  className="mt-4 text-[36px] font-bold leading-none"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--ink-700)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {t.price}
                  <span
                    className="ml-1.5 text-[13px] font-normal"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {t.cadence}
                  </span>
                </p>

                <ul
                  className="mt-5 space-y-2 text-[14px]"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--ink-700)",
                  }}
                >
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span
                        className="shrink-0 leading-tight"
                        style={{ color: "var(--forest-600)" }}
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  {isFree ? (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-full px-4 py-2.5 text-[14px] font-medium"
                      style={{
                        fontFamily: "var(--font-display)",
                        background: "var(--paper-200)",
                        color: "var(--fg-subtle)",
                      }}
                    >
                      {isCurrent ? "Plan actuel" : "Inclus"}
                    </button>
                  ) : isCurrent ? (
                    <form action={openPortal}>
                      <button
                        type="submit"
                        className="w-full rounded-full px-4 py-2.5 text-[14px] font-semibold transition-colors"
                        style={{
                          fontFamily: "var(--font-display)",
                          background: "var(--ink-700)",
                          color: "var(--paper-0)",
                        }}
                      >
                        Gérer mon abonnement
                      </button>
                    </form>
                  ) : (
                    <form action={startCheckout}>
                      <input type="hidden" name="tier" value={t.key} />
                      <button
                        type="submit"
                        className="w-full rounded-full px-4 py-2.5 text-[14px] font-semibold transition-colors"
                        style={{
                          fontFamily: "var(--font-display)",
                          background: t.highlighted
                            ? "var(--lavender-600)"
                            : "var(--ink-700)",
                          color: "var(--paper-0)",
                        }}
                      >
                        {currentTier === "free" ? "Passer à " + t.name : "Changer pour " + t.name}
                      </button>
                    </form>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {profile?.current_period_end ? (
          <p
            className="mt-6 text-[12px]"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--fg-subtle)",
            }}
          >
            Période en cours jusqu&apos;au{" "}
            {new Date(profile.current_period_end).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            .
          </p>
        ) : null}
      </div>

      <Footer />
    </main>
  );
}
