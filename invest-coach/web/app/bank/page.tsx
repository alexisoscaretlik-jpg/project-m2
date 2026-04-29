import { Nav } from "@/components/nav";
import { CATEGORIES, Category } from "@/lib/bank/categorize";
import { listInstitutions, Institution } from "@/lib/gocardless";
import { requireUser } from "@/lib/supabase/require-auth";

import {
  disconnectBank,
  resyncAllAccounts,
  startConnection,
} from "./actions";
import { CsvUploadForm } from "./upload-form";

type Account = {
  id: number;
  display_name: string | null;
  iban: string | null;
  currency: string | null;
  balance: number | null;
  balance_at: string | null;
};

type Connection = {
  id: number;
  institution_name: string | null;
  status: string | null;
  bank_accounts: Account[];
};

type Tx = {
  booking_date: string | null;
  amount: number;
  category: string | null;
  counterparty: string | null;
};

function fmtEur(n: number | null, currency = "EUR"): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

const CATEGORY_LABEL: Record<Category, string> = {
  courses: "Courses",
  restaurant: "Restaurants",
  transport: "Transport",
  logement: "Logement",
  abonnements: "Abonnements",
  shopping: "Shopping",
  santé: "Santé",
  sport_loisirs: "Sport & loisirs",
  épargne_investissement: "Épargne",
  revenus: "Revenus",
  autre: "Autre",
};

function last30DaysSummary(txs: Tx[]) {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = txs.filter(
    (t) => t.booking_date && new Date(t.booking_date).getTime() >= cutoff,
  );
  const byCategory: Record<string, number> = {};
  let income = 0;
  let spend = 0;
  for (const t of recent) {
    const cat = t.category ?? "autre";
    byCategory[cat] = (byCategory[cat] ?? 0) + t.amount;
    if (t.amount > 0) income += t.amount;
    else spend += -t.amount;
  }
  return { byCategory, income, spend, count: recent.length };
}

export default async function BankPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { user, supabase: sb } = await requireUser("/bank");

  const { data: connData } = await sb
    .from("bank_connections")
    .select(
      "id, institution_name, status, bank_accounts(id, display_name, iban, currency, balance, balance_at)",
    )
    .order("created_at", { ascending: false });
  const connections = (connData ?? []) as Connection[];

  const accountIds = connections.flatMap((c) =>
    c.bank_accounts.map((a) => a.id),
  );

  let txs: Tx[] = [];
  if (accountIds.length > 0) {
    const { data: txData } = await sb
      .from("bank_transactions")
      .select("booking_date, amount, category, counterparty")
      .in("account_id", accountIds)
      .order("booking_date", { ascending: false })
      .limit(500);
    txs = (txData ?? []) as Tx[];
  }

  const hasBank = connections.length > 0;
  const summary = hasBank ? last30DaysSummary(txs) : null;

  let institutions: Institution[] = [];
  let instError: string | null = null;
  const gcConfigured =
    !!process.env.GOCARDLESS_SECRET_ID && !!process.env.GOCARDLESS_SECRET_KEY;
  if (gcConfigured) {
    try {
      institutions = await listInstitutions("fr");
    } catch (e) {
      instError = (e as Error).message;
    }
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/bank" />

      <section
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 0%, var(--lavender-100) 0%, var(--paper-50) 60%, var(--paper-50) 100%)",
        }}
      >
        <div
          className="mx-auto px-6 pt-16 pb-8 text-center sm:px-8 sm:pt-20"
          style={{ maxWidth: "880px" }}
        >
          <div className="mb-6 flex justify-center">
            <span className="ic-pill">
              <span className="ic-pill-badge">Banque</span>
              PSD2 · lecture seule · GoCardless
            </span>
          </div>
          <h1 className="ic-h1 mx-auto" style={{ maxWidth: "720px" }}>
            Voir où passe ton argent, <em>sans excuser personne.</em>
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
            Connecte ta banque française via PSD2 · réglementé · lecture seule.
            On classe tes dépenses, on calcule ton taux d&apos;épargne, et on te
            dit si tu peux ouvrir un PEA ce mois-ci.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-6 py-8 sm:px-8">

        {error ? (
          <p className="mt-3 rounded-lg bg-[color:var(--terracotta-50)] p-3 text-sm text-[color:var(--terracotta-600)]">
            {error}
          </p>
        ) : null}

        {hasBank && summary ? (
          <>
            <section className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-xs uppercase text-muted-foreground">
                  Revenus (30 derniers jours)
                </p>
                <p className="mt-1 text-2xl font-bold text-[color:var(--forest-700)]">
                  {fmtEur(summary.income)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-xs uppercase text-muted-foreground">
                  Dépenses (30 derniers jours)
                </p>
                <p className="mt-1 text-2xl font-bold text-[color:var(--terracotta-600)]">
                  {fmtEur(summary.spend)}
                </p>
              </div>
            </section>

            <section className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Par catégorie
              </h2>
              <ul className="mt-3 space-y-2">
                {CATEGORIES.filter((c) => c !== "revenus").map((c) => {
                  const amount = Math.abs(summary.byCategory[c] ?? 0);
                  if (amount === 0) return null;
                  const pct = summary.spend > 0 ? (amount / summary.spend) * 100 : 0;
                  return (
                    <li key={c}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-foreground">
                          {CATEGORY_LABEL[c]}
                        </span>
                        <span className="font-mono text-foreground">
                          {fmtEur(amount)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-foreground"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="mt-6 rounded-xl border border-[color:var(--forest-200)] bg-accent p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Potentiel d&apos;investissement
              </h2>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {fmtEur(Math.max(summary.income - summary.spend, 0))}
              </p>
              <p className="mt-1 text-xs text-foreground/70">
                Surplus mensuel — à arbitrer entre épargne de précaution,
                PEA et assurance-vie.
              </p>
            </section>

            <section className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Comptes
                </h2>
                <form action={resyncAllAccounts}>
                  <button
                    type="submit"
                    className="text-xs text-primary hover:underline"
                  >
                    Resync
                  </button>
                </form>
              </div>
              <ul className="space-y-2">
                {connections.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-medium text-foreground">
                        {c.institution_name}
                      </span>
                      <form action={disconnectBank}>
                        <input
                          type="hidden"
                          name="connection_id"
                          value={c.id}
                        />
                        <button
                          type="submit"
                          className="text-xs text-muted-foreground hover:text-[color:var(--terracotta-500)]"
                        >
                          Disconnect
                        </button>
                      </form>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm">
                      {c.bank_accounts.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-baseline justify-between"
                        >
                          <span className="text-foreground">
                            {a.display_name ?? a.iban ?? "Account"}
                          </span>
                          <span className="font-mono text-foreground">
                            {fmtEur(a.balance, a.currency ?? "EUR")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}

        {/* CSV upload — always available, no SIRET / regulator needed. */}
        <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            {hasBank ? "Importer plus de transactions" : "Importer un CSV"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Exporte le relevé CSV depuis ta banque — Claude détecte le
            format et catégorise automatiquement.
          </p>
          <div className="mt-4">
            <CsvUploadForm />
          </div>
        </section>

        {!hasBank && gcConfigured && (
          <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              Ou connecte en direct (PSD2)
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Connexion bancaire temps réel via GoCardless. Tu te connectes
              chez ta banque — on ne voit jamais ton mot de passe.
            </p>

            {instError ? (
              <p className="mt-3 rounded-lg bg-[color:var(--warning-soft)] p-3 text-sm text-[color:var(--warning)]">
                GoCardless indisponible: {instError}
              </p>
            ) : (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {institutions.map((i) => (
                  <li key={i.id}>
                    <form action={startConnection}>
                      <input type="hidden" name="institution_id" value={i.id} />
                      <input
                        type="hidden"
                        name="institution_name"
                        value={i.name}
                      />
                      <button
                        type="submit"
                        className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left hover:border-primary hover:bg-accent"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {i.logo ? (
                          <img
                            src={i.logo}
                            alt=""
                            className="h-8 w-8 rounded"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted" />
                        )}
                        <span className="text-sm text-foreground">
                          {i.name}
                        </span>
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          Signed in as {user?.email}.
        </p>
      </div>
    </main>
  );
}
