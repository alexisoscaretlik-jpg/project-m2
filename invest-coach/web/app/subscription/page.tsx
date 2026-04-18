import { Nav } from "@/components/nav";
import { createClient } from "@/lib/supabase/server";

const TIERS = [
  {
    name: "Free",
    price: "€0",
    tagline: "Daily coaching cards",
    features: [
      "Chronological feed of SEC filings",
      "10 tracked companies",
      "Watchlist",
    ],
    cta: "Current plan",
    highlighted: false,
  },
  {
    name: "Plus",
    price: "€9/mo",
    tagline: "Alerts + tax optimization",
    features: [
      "Everything in Free",
      "Email alerts on 8-K materiality",
      "Tax optimization (PEA, AV, PER)",
      "Upload your avis d'imposition",
    ],
    cta: "Upgrade",
    highlighted: true,
  },
  {
    name: "Wealth",
    price: "€19/mo",
    tagline: "Full wealth coaching",
    features: [
      "Everything in Plus",
      "Bank connection (PSD2)",
      "Spending coach",
      "Monthly investment plan",
    ],
    cta: "Upgrade",
    highlighted: false,
  },
];

export default async function SubscriptionPage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  return (
    <main className="min-h-screen bg-slate-50">
      <Nav active="/subscription" />

      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-xl font-bold text-slate-900">Subscription</h1>
        <p className="text-xs text-slate-500">
          Pick a plan. Cancel anytime. French VAT included.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`rounded-xl border bg-white p-5 shadow-sm ${
                t.highlighted
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-slate-200"
              }`}
            >
              <h2 className="text-lg font-semibold text-slate-900">
                {t.name}
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
              <button
                type="button"
                disabled
                className={`mt-5 w-full rounded-lg px-4 py-2 text-sm font-medium ${
                  t.highlighted
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-700"
                } disabled:opacity-60`}
              >
                {t.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Payments — coming soon (Stripe). Signed in as {user?.email}.
        </p>
      </div>
    </main>
  );
}
