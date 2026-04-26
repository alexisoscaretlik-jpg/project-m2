import { Nav } from "@/components/nav";
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
  tagline: string;
  features: string[];
  highlighted: boolean;
}> = [
  {
    key: "free",
    name: "Free",
    price: "€0",
    tagline: "Daily coaching cards",
    features: [
      "Chronological feed of SEC filings",
      "10 tracked companies",
      "Watchlist",
    ],
    highlighted: false,
  },
  {
    key: "plus",
    name: "Plus",
    price: "€9/mo",
    tagline: "Alerts + tax optimization",
    features: [
      "Everything in Free",
      "Email alerts on 8-K materiality",
      "Tax optimization (PEA, AV, PER)",
      "Upload your avis d'imposition",
    ],
    highlighted: true,
  },
  {
    key: "wealth",
    name: "Wealth",
    price: "€19/mo",
    tagline: "Full wealth coaching",
    features: [
      "Everything in Plus",
      "Bank connection (PSD2)",
      "Spending coach",
      "Monthly investment plan",
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
    <main className="min-h-screen bg-muted">
      <Nav active="/subscription" />

      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-xl font-bold text-foreground">Subscription</h1>
        <p className="text-xs text-muted-foreground">
          Pick a plan. Cancel anytime. French VAT included.
        </p>

        {status === "success" ? (
          <p className="mt-3 rounded-lg bg-[color:var(--forest-50)] p-3 text-sm text-[color:var(--forest-700)]">
            Payment successful. Your plan will activate within a few
            seconds — refresh if needed.
          </p>
        ) : null}
        {status === "cancelled" ? (
          <p className="mt-3 rounded-lg bg-[color:var(--warning-soft)] p-3 text-sm text-[color:var(--warning)]">
            Checkout cancelled.
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {TIERS.map((t) => {
            const isCurrent = t.key === currentTier;
            const isFree = t.key === "free";
            return (
              <div
                key={t.key}
                className={`rounded-xl border bg-card p-5 shadow-sm ${
                  t.highlighted
                    ? "border-primary ring-2 ring-blue-200"
                    : "border-border"
                }`}
              >
                <h2 className="text-lg font-semibold text-foreground">
                  {t.name}
                  {isCurrent ? (
                    <span className="ml-2 rounded-full bg-[color:var(--forest-100)] px-2 py-0.5 text-xs text-[color:var(--forest-700)]">
                      current
                    </span>
                  ) : null}
                </h2>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {t.price}
                </p>
                <p className="text-xs text-muted-foreground">{t.tagline}</p>
                <ul className="mt-4 space-y-1 text-sm text-foreground">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-[color:var(--forest-600)]">&#10003;</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {isFree ? (
                  <button
                    type="button"
                    disabled
                    className="mt-5 w-full rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground"
                  >
                    {isCurrent ? "Current plan" : "Included"}
                  </button>
                ) : isCurrent ? (
                  <form action={openPortal} className="mt-5">
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--ink-600)]"
                    >
                      Manage subscription
                    </button>
                  </form>
                ) : (
                  <form action={startCheckout} className="mt-5">
                    <input type="hidden" name="tier" value={t.key} />
                    <button
                      type="submit"
                      className={`w-full rounded-lg px-4 py-2 text-sm font-medium ${
                        t.highlighted
                          ? "bg-primary text-white hover:bg-primary"
                          : "bg-secondary text-foreground hover:bg-secondary"
                      }`}
                    >
                      {currentTier === "free" ? "Upgrade" : "Switch"}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>

        {profile?.current_period_end ? (
          <p className="mt-6 text-xs text-muted-foreground">
            Current period ends{" "}
            {new Date(profile.current_period_end).toLocaleDateString("fr-FR")}.
          </p>
        ) : null}
      </div>
    </main>
  );
}
