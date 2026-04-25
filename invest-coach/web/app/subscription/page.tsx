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
    <main className="min-h-screen bg-slate-50">
      <Nav active="/subscription" />

      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-xl font-bold text-slate-900">Subscription</h1>
        <p className="text-xs text-slate-500">
          Pick a plan. Cancel anytime. French VAT included.
        </p>

        {status === "success" ? (
          <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            Payment successful. Your plan will activate within a few
            seconds — refresh if needed.
          </p>
        ) : null}
        {status === "cancelled" ? (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
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
                className={`rounded-xl border bg-white p-5 shadow-sm ${
                  t.highlighted
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-slate-200"
                }`}
              >
                <h2 className="text-lg font-semibold text-slate-900">
                  {t.name}
                  {isCurrent ? (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                      current
                    </span>
                  ) : null}
                </h2>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {t.price}
                </p>
                <p className="text-xs text-slate-500">{t.tagline}</p>
                <ul className="mt-4 space-y-1 text-sm text-slate-700">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-emerald-600">&#10003;</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {isFree ? (
                  <button
                    type="button"
                    disabled
                    className="mt-5 w-full rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    {isCurrent ? "Current plan" : "Included"}
                  </button>
                ) : isCurrent ? (
                  <form action={openPortal} className="mt-5">
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
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
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
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
          <p className="mt-6 text-xs text-slate-500">
            Current period ends{" "}
            {new Date(profile.current_period_end).toLocaleDateString("fr-FR")}.
          </p>
        ) : null}
      </div>
    </main>
  );
}
