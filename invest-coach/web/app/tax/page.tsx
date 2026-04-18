import { Nav } from "@/components/nav";
import { createClient } from "@/lib/supabase/server";

export default async function TaxPage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  return (
    <main className="min-h-screen bg-slate-50">
      <Nav active="/tax" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold text-slate-900">Tax optimization</h1>
        <p className="text-xs text-slate-500">For French residents (FR).</p>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Upload your avis d&apos;imposition
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Drop your latest{" "}
            <span className="font-medium">avis d&apos;imposition</span> (PDF)
            and we&apos;ll analyse your situation to suggest optimizations:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-slate-700">
            <li>
              <strong>PEA</strong> — €150k cap, 0% capital gains after 5 years
            </li>
            <li>
              <strong>Assurance-vie</strong> — €4,600/€9,200 abatement after 8
              years
            </li>
            <li>
              <strong>PER</strong> — deduct up to 10% of net pro income from
              taxable base
            </li>
            <li>
              <strong>TMI</strong> (tranche marginale) — when flat tax 30%
              beats the barème, and when it doesn&apos;t
            </li>
            <li>
              <strong>IFI</strong> — real-estate wealth tax thresholds and
              tricks
            </li>
          </ul>

          <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm font-medium text-slate-700">
              PDF upload — coming soon
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Claude will read the avis and return a personalized plan.
            </p>
            <button
              type="button"
              disabled
              className="mt-4 rounded-lg bg-slate-300 px-4 py-2 text-sm font-medium text-white"
            >
              Choose file
            </button>
          </div>
        </section>

        <p className="mt-4 text-xs text-slate-500">
          Signed in as {user?.email}. Nothing uploaded yet.
        </p>
      </div>
    </main>
  );
}
