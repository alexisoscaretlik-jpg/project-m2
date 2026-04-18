import { Nav } from "@/components/nav";
import { CATEGORIES, Category } from "@/lib/bank/categorize";
import { listInstitutions, Institution } from "@/lib/gocardless";
import { createClient } from "@/lib/supabase/server";

import {
  disconnectBank,
  resyncAllAccounts,
  startConnection,
} from "./actions";

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
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

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
  if (!hasBank) {
    try {
      institutions = await listInstitutions("fr");
    } catch (e) {
      instError = (e as Error).message;
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Nav active="/bank" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold text-slate-900">Bank &amp; spending</h1>
        <p className="text-xs text-slate-500">
          PSD2 via GoCardless. Read-only, regulated, up to 2,500+ EU banks.
        </p>

        {error ? (
          <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {hasBank && summary ? (
          <>
            <section className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase text-slate-500">
                  Revenus (30 derniers jours)
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">
                  {fmtEur(summary.income)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase text-slate-500">
                  Dépenses (30 derniers jours)
                </p>
                <p className="mt-1 text-2xl font-bold text-rose-700">
                  {fmtEur(summary.spend)}
                </p>
              </div>
            </section>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
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
                        <span className="text-slate-700">
                          {CATEGORY_LABEL[c]}
                        </span>
                        <span className="font-mono text-slate-900">
                          {fmtEur(amount)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-900">
                Potentiel d&apos;investissement
              </h2>
              <p className="mt-2 text-2xl font-bold text-blue-900">
                {fmtEur(Math.max(summary.income - summary.spend, 0))}
              </p>
              <p className="mt-1 text-xs text-blue-900/70">
                Surplus mensuel — à arbitrer entre épargne de précaution,
                PEA et assurance-vie.
              </p>
            </section>

            <section className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Comptes
                </h2>
                <form action={resyncAllAccounts}>
                  <button
                    type="submit"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Resync
                  </button>
                </form>
              </div>
              <ul className="space-y-2">
                {connections.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-medium text-slate-900">
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
                          className="text-xs text-slate-500 hover:text-rose-600"
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
                          <span className="text-slate-700">
                            {a.display_name ?? a.iban ?? "Account"}
                          </span>
                          <span className="font-mono text-slate-900">
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
        ) : (
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Connect a bank
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Pick your bank. You&apos;ll sign in on their site — we never see
              your credentials.
            </p>

            {instError ? (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                GoCardless credentials not configured yet — ask the admin to
                set GOCARDLESS_SECRET_ID and GOCARDLESS_SECRET_KEY.
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
                        className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-blue-500 hover:bg-blue-50"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {i.logo ? (
                          <img
                            src={i.logo}
                            alt=""
                            className="h-8 w-8 rounded"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-slate-100" />
                        )}
                        <span className="text-sm text-slate-900">
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

        <p className="mt-6 text-xs text-slate-500">
          Signed in as {user?.email}.
        </p>
      </div>
    </main>
  );
}
