import Link from "next/link";

import { Nav } from "@/components/nav";
import { DEV_USER_EMAIL, DEV_USER_ID, IS_DEV } from "@/lib/devUser";
import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";

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

type Onboarding = {
  profile_type: string;
  income_types: string[] | null;
  situation: string | null;
  nb_enfants: number | null;
  owns_real_estate: boolean | null;
  has_investments: boolean | null;
  has_crypto: boolean | null;
  goals: string[] | null;
};

const PROFILE_LABEL: Record<string, string> = {
  salarie: "Salarié",
  freelance_micro: "Freelance micro",
  freelance_reel: "Freelance réel (BNC/BIC)",
  mixte: "Salaire + indépendant",
  retraite: "Retraité",
  etudiant: "Étudiant",
  sans_emploi: "Sans emploi",
  other: "Autre",
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

  // Dev bypass: if no authenticated user and we're in dev, act as the
  // hardcoded test user and use service client to bypass RLS.
  const userId = user?.id ?? (IS_DEV ? DEV_USER_ID : null);
  const userEmail = user?.email ?? (IS_DEV ? DEV_USER_EMAIL : null);
  const db = user ? sb : IS_DEV ? serviceClient() : sb;

  // Parallel fetch: subscription tier, onboarding, latest avis, wizard answers.
  const [tierRes, onboardingRes, profilesRes, wizardRes] = await Promise.all([
    db.from("profiles").select("tier").eq("user_id", userId ?? "").maybeSingle(),
    db
      .from("tax_onboarding")
      .select(
        "profile_type, income_types, situation, nb_enfants, owns_real_estate, has_investments, has_crypto, goals",
      )
      .eq("user_id", userId ?? "")
      .maybeSingle(),
    db
      .from("tax_profiles")
      .select(
        "id, tax_year, rfr, revenu_imposable, parts, impot_revenu, tmi, situation, nb_enfants, recommendations, created_at",
      )
      .eq("user_id", userId ?? "")
      .order("tax_year", { ascending: false }),
    db
      .from("typeform_responses")
      .select("submitted_at")
      .eq("user_id", userId ?? "")
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const tier = (tierRes.data?.tier as string | undefined) ?? "free";
  const isPaid = tier === "plus" || tier === "wealth";
  const onboarding = (onboardingRes.data ?? null) as Onboarding | null;
  const latest = ((profilesRes.data ?? []) as TaxProfile[])[0] ?? null;
  const hasWizard = !!wizardRes.data;

  return (
    <main className="min-h-screen bg-muted">
      <Nav active="/tax" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold text-foreground">
          Fiscalité personnelle
        </h1>
        <p className="text-xs text-muted-foreground">
          Pour les résidents fiscaux français. Salariés, freelances,
          retraités — payez moins d&apos;impôts, légalement.
        </p>

        {/* Educational banner — links to the levers catalog */}
        <Link
          href="/tax/levers"
          className="mt-4 flex items-center justify-between rounded-xl border border-[color:var(--forest-200)] bg-gradient-to-br from-blue-50 to-indigo-50 p-4 transition hover:border-primary"
        >
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">
              Nouveau · Guide pédagogique
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              Comprendre tous les leviers fiscaux en 15 minutes
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              4 tiers, du plus simple (PER, dons) au plus avancé
              (Girardin, Malraux).
            </div>
          </div>
          <span className="text-xl text-primary">→</span>
        </Link>

        {/* Step 1 — onboarding */}
        {!onboarding ? (
          <section className="mt-6 rounded-xl border border-[color:var(--forest-200)] bg-accent p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">
              Étape 1 · Profil
            </div>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              Commencez par 5 questions
            </h2>
            <p className="mt-2 text-sm text-foreground">
              Salarié, freelance, mixte&nbsp;? Propriétaire, investisseur, crypto&nbsp;?
              Chaque situation ouvre des leviers fiscaux différents. Deux
              minutes pour débloquer des recommandations personnalisées.
            </p>
            <Link
              href="/tax/onboarding"
              className="mt-4 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary"
            >
              Remplir le questionnaire →
            </Link>
          </section>
        ) : (
          <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--forest-700)]">
                  Étape 1 · Profil ✓
                </div>
                <h2 className="mt-1 text-base font-semibold text-foreground">
                  {PROFILE_LABEL[onboarding.profile_type] ?? onboarding.profile_type}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(onboarding.income_types ?? []).join(", ") || "Revenus non précisés"}
                  {onboarding.owns_real_estate ? " · propriétaire" : ""}
                  {onboarding.has_investments ? " · placements" : ""}
                  {onboarding.has_crypto ? " · crypto" : ""}
                </p>
              </div>
              <Link
                href="/tax/onboarding"
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Modifier
              </Link>
            </div>
          </section>
        )}

        {/* Step 2 — avis upload */}
        {onboarding && !latest ? (
          <section className="mt-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">
              Étape 2 · Avis d&apos;imposition
            </div>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              Chargez votre dernier avis
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Claude extrait RFR, TMI, parts et situation, puis croise ces
              données avec votre profil pour générer 3-5 optimisations
              chiffrées.
            </p>
            <div className="mt-4">
              <UploadForm />
            </div>
          </section>
        ) : null}

        {/* Step 3 — tax profile summary */}
        {latest ? (
          <>
            <section className="mt-4 rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--forest-700)]">
                    Étape 2 · Avis ✓
                  </div>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    Votre profil {latest.tax_year}
                  </h2>
                </div>
                <form action={deleteAvis}>
                  <input type="hidden" name="tax_year" value={latest.tax_year} />
                  <button
                    type="submit"
                    className="text-xs text-muted-foreground hover:text-[color:var(--terracotta-500)]"
                  >
                    Supprimer &amp; recharger
                  </button>
                </form>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">RFR</dt>
                  <dd className="font-medium text-foreground">
                    {fmtEur(latest.rfr)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">
                    Revenu imposable
                  </dt>
                  <dd className="font-medium text-foreground">
                    {fmtEur(latest.revenu_imposable)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">
                    Impôt sur le revenu
                  </dt>
                  <dd className="font-medium text-foreground">
                    {fmtEur(latest.impot_revenu)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">TMI</dt>
                  <dd className="font-medium text-foreground">
                    {latest.tmi != null ? `${latest.tmi} %` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">Parts</dt>
                  <dd className="font-medium text-foreground">
                    {latest.parts ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted-foreground">
                    Situation
                  </dt>
                  <dd className="font-medium text-foreground">
                    {latest.situation ?? "—"}
                    {latest.nb_enfants
                      ? ` · ${latest.nb_enfants} enfant(s)`
                      : ""}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Step 4 — recommendations (paywalled) */}
            <section className="mt-4">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Recommandations personnalisées
                </h2>
                {!isPaid ? (
                  <span className="rounded-full bg-[color:var(--warning-soft)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--warning)]">
                    Plus requis
                  </span>
                ) : null}
              </div>

              {latest.recommendations && latest.recommendations.length > 0 ? (
                isPaid ? (
                  <ul className="space-y-3">
                    {latest.recommendations.map((r, i) => (
                      <li
                        key={i}
                        className="rounded-xl border border-border bg-card p-5 shadow-sm"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="text-base font-semibold text-foreground">
                            {r.title}
                          </h3>
                          {r.impact_eur != null ? (
                            <span className="whitespace-nowrap rounded-full bg-[color:var(--forest-100)] px-2 py-0.5 text-xs font-medium text-[color:var(--forest-700)]">
                              ~{fmtEur(r.impact_eur)}/an
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{r.why}</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                          {r.actions.map((a, j) => (
                            <li key={j}>{a}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-xl border border-[color:var(--warning)] bg-card p-6 shadow-sm">
                    <p className="text-sm text-foreground">
                      Claude a identifié{" "}
                      <strong>{latest.recommendations.length} leviers</strong>{" "}
                      pour votre profil
                      {latest.recommendations.some(
                        (r) => r.impact_eur != null,
                      ) ? (
                        <>
                          , avec un impact total estimé à{" "}
                          <strong>
                            {fmtEur(
                              latest.recommendations.reduce(
                                (s, r) => s + (r.impact_eur ?? 0),
                                0,
                              ),
                            )}
                          </strong>{" "}
                          d&apos;économie annuelle potentielle.
                        </>
                      ) : (
                        "."
                      )}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {latest.recommendations.slice(0, 3).map((r, i) => (
                        <li
                          key={i}
                          className="flex items-baseline gap-2 text-sm text-muted-foreground"
                        >
                          <span className="text-[color:var(--warning)]">●</span>
                          <span className="select-none blur-sm">
                            {r.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/subscription"
                      className="mt-5 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--ink-500)]"
                    >
                      Débloquer le détail (Plus) →
                    </Link>
                  </div>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune recommandation — essayez de recharger l&apos;avis.
                </p>
              )}

              <p className="mt-4 text-xs text-muted-foreground">
                Informations éducatives. Ne constitue pas un conseil fiscal
                personnalisé au sens de la loi. Confirmez avec un
                expert-comptable ou un notaire avant d&apos;agir.
              </p>
            </section>
          </>
        ) : null}

        {/* Step 3 — declaration wizard + PDF download */}
        {onboarding ? (
          <section className="mt-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">
              Étape 3 · Déclaration pré-remplie
              {hasWizard ? " ✓" : ""}
            </div>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              {hasWizard
                ? "Votre questionnaire est complet"
                : "Remplissez votre déclaration en 14 questions"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {hasWizard
                ? "Téléchargez votre formulaire Cerfa 2042 pré-rempli. À vérifier et signer avant de soumettre sur impots.gouv.fr."
                : "Un questionnaire rapide (salaires, dividendes, PER, dons…) puis Claude génère votre Cerfa 2042 pré-rempli, prêt à télécharger."}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/tax/declaration"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary"
              >
                {hasWizard
                  ? "Modifier mes réponses"
                  : "Commencer le questionnaire →"}
              </Link>

              {hasWizard ? (
                isPaid ? (
                  <a
                    href="/api/tax/declaration"
                    className="rounded-lg border border-[color:var(--forest-300)] bg-[color:var(--forest-50)] px-4 py-2 text-sm font-medium text-[color:var(--forest-700)] hover:bg-[color:var(--forest-100)]"
                  >
                    Télécharger la Cerfa 2042 (PDF)
                  </a>
                ) : (
                  <Link
                    href="/subscription"
                    className="rounded-lg border border-[color:var(--warning)] bg-[color:var(--warning-soft)] px-4 py-2 text-sm font-medium text-[color:var(--warning)] hover:bg-[color:var(--warning-soft)]"
                  >
                    Télécharger (réservé Plus) →
                  </Link>
                )
              ) : null}
            </div>
          </section>
        ) : null}

        <p className="mt-6 text-xs text-muted-foreground">
          Connecté en tant que {userEmail ?? "—"}.
          {!user && IS_DEV ? " (DEV bypass actif)" : null}
        </p>
      </div>
    </main>
  );
}
