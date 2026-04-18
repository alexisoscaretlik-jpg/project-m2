import { Nav } from "@/components/nav";
import { createClient } from "@/lib/supabase/server";

export default async function BankPage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  return (
    <main className="min-h-screen bg-slate-50">
      <Nav active="/bank" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold text-slate-900">Bank &amp; spending</h1>
        <p className="text-xs text-slate-500">
          PSD2 via GoCardless (ex-Nordigen). 2,500+ EU banks supported.
        </p>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Connect your bank
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Link your French bank account and we&apos;ll:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-slate-700">
            <li>
              Categorize every transaction (courses, restau, transport,
              abonnements, loyer)
            </li>
            <li>Spot subscriptions you forgot about</li>
            <li>
              Show how much you could be investing each month vs. what
              you&apos;re spending
            </li>
            <li>Coach you via Claude — &ldquo;move €200/mo to your PEA&rdquo;</li>
          </ul>

          <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm font-medium text-slate-700">
              Bank connection — coming soon
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Uses GoCardless Bank Account Data API (read-only, regulated).
            </p>
            <button
              type="button"
              disabled
              className="mt-4 rounded-lg bg-slate-300 px-4 py-2 text-sm font-medium text-white"
            >
              Connect bank
            </button>
          </div>
        </section>

        <p className="mt-4 text-xs text-slate-500">
          Signed in as {user?.email}. No bank connected yet.
        </p>
      </div>
    </main>
  );
}
