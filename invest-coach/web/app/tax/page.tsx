import { Nav } from "@/components/nav";
import { createClient } from "@/lib/supabase/server";

import { deleteAvis } from "./actions";
import { UploadForm } from "./upload-form";

type Recommendation = {
  title: string;
  impact_eur: number | null;
  why: string;
  actions: string[];
};

type TaxProfile = {
  id: number;
  tax_year: number;
  rfr: number | null;
  revenu_imposable: number | null;
  parts: number | null;
  impot_revenu: number | null;
  tmi: number | null;
  situation: string | null;
  nb_enfants: number | null;
  recommendations: Recommendation[] | null;
  created_at: string;
};

function fmtEur(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function TaxPage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const { data: profiles } = await sb
    .from("tax_profiles")
    .select(
      "id, tax_year, rfr, revenu_imposable, parts, impot_revenu, tmi, situation, nb_enfants, recommendations, created_at",
    )
    .order("tax_year", { ascending: false });

  const latest = ((profiles ?? []) as TaxProfile[])[0] ?? null;

  return (
    <main className="min-h-screen bg-slate-50">
      <Nav active="/tax" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold text-slate-900">Tax optimization</h1>
        <p className="text-xs text-slate-500">For French residents (FR).</p>

        {!latest ? (
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Upload your avis d&apos;imposition
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Drop the PDF — Claude reads RFR, TMI, parts and situation,
              then returns 3-5 personalized optimizations (PEA,
              assurance-vie, PER, dons, frais réels…).
            </p>
            <div className="mt-4">
              <UploadForm />
            </div>
          </section>
        ) : (
          <>
            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Your {latest.tax_year} profile
                </h2>
                <form action={deleteAvis}>
                  <input
                    type="hidden"
                    name="tax_year"
                    value={latest.tax_year}
                  />
                  <button
                    type="submit"
                    className="text-xs text-slate-500 hover:text-rose-600"
                  >
                    Delete &amp; re-upload
                  </button>
                </form>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase text-slate-500">RFR</dt>
                  <dd className="font-medium text-slate-900">
                    {fmtEur(latest.rfr)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-500">
                    Revenu imposable
                  </dt>
                  <dd className="font-medium text-slate-900">
                    {fmtEur(latest.revenu_imposable)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-500">
                    Impôt sur le revenu
                  </dt>
                  <dd className="font-medium text-slate-900">
                    {fmtEur(latest.impot_revenu)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-500">TMI</dt>
                  <dd className="font-medium text-slate-900">
                    {latest.tmi != null ? `${latest.tmi} %` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-500">Parts</dt>
                  <dd className="font-medium text-slate-900">
                    {latest.parts ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-500">
                    Situation
                  </dt>
                  <dd className="font-medium text-slate-900">
                    {latest.situation ?? "—"}
                    {latest.nb_enfants ? ` · ${latest.nb_enfants} enfant(s)` : ""}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="mt-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Recommendations
              </h2>
              {latest.recommendations && latest.recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {latest.recommendations.map((r, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-base font-semibold text-slate-900">
                          {r.title}
                        </h3>
                        {r.impact_eur != null ? (
                          <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                            ~{fmtEur(r.impact_eur)}/yr
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{r.why}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                        {r.actions.map((a, j) => (
                          <li key={j}>{a}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  No recommendations returned — try re-uploading.
                </p>
              )}
              <p className="mt-4 text-xs text-slate-500">
                Not tax advice. Confirm with your notaire or conseiller
                fiscal before acting.
              </p>
            </section>
          </>
        )}

        <p className="mt-6 text-xs text-slate-500">
          Signed in as {user?.email}.
        </p>
      </div>
    </main>
  );
}
