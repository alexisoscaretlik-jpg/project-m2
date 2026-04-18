"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";
import { categorize, TxIn } from "@/lib/bank/categorize";
import { parseCsv } from "@/lib/bank/parse-csv";
import {
  createRequisition,
  getAccountDetails,
  getBalances,
  getRequisition,
  getTransactions,
} from "@/lib/gocardless";

async function originUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function startConnection(formData: FormData) {
  const institutionId = String(formData.get("institution_id") ?? "");
  const institutionName = String(formData.get("institution_name") ?? "");
  if (!institutionId) return;

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login?next=/bank");

  const origin = await originUrl();
  const redirectUrl = `${origin}/bank/callback`;
  const reference = `${user.id}:${Date.now()}`;

  const req = await createRequisition({
    institution_id: institutionId,
    redirect: redirectUrl,
    reference,
  });

  const svc = serviceClient();
  await svc.from("bank_connections").insert({
    user_id: user.id,
    requisition_id: req.id,
    institution_id: institutionId,
    institution_name: institutionName,
    status: req.status,
  });

  redirect(req.link);
}

export async function finalizeConnection(requisitionId: string) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const svc = serviceClient();

  const { data: conn } = await svc
    .from("bank_connections")
    .select("id, user_id")
    .eq("requisition_id", requisitionId)
    .single();
  if (!conn || conn.user_id !== user.id) redirect("/bank");

  const req = await getRequisition(requisitionId);
  await svc
    .from("bank_connections")
    .update({ status: req.status })
    .eq("id", conn.id);

  for (const gcAccountId of req.accounts) {
    const [details, balances] = await Promise.all([
      getAccountDetails(gcAccountId).catch(() => null),
      getBalances(gcAccountId).catch(() => null),
    ]);

    const det = details?.account;
    const bal = balances?.balances?.[0];

    const { data: acct } = await svc
      .from("bank_accounts")
      .upsert(
        {
          connection_id: conn.id,
          gc_account_id: gcAccountId,
          iban: det?.iban ?? null,
          owner_name: det?.ownerName ?? null,
          display_name: det?.name ?? det?.product ?? null,
          currency: det?.currency ?? bal?.balanceAmount.currency ?? "EUR",
          balance: bal ? Number(bal.balanceAmount.amount) : null,
          balance_at: bal?.referenceDate ?? null,
        },
        { onConflict: "gc_account_id" },
      )
      .select("id")
      .single();

    if (acct) await syncTransactions(acct.id, gcAccountId);
  }

  revalidatePath("/bank");
  redirect("/bank");
}

async function syncTransactions(
  accountRowId: number,
  gcAccountId: string,
): Promise<void> {
  const svc = serviceClient();
  const txs = await getTransactions(gcAccountId).catch(() => null);
  if (!txs) return;

  const booked = txs.transactions.booked ?? [];
  if (booked.length === 0) return;

  const rows = booked.map((t) => ({
    account_id: accountRowId,
    gc_transaction_id:
      t.transactionId ?? t.internalTransactionId ?? `${t.bookingDate}-${t.transactionAmount.amount}`,
    booking_date: t.bookingDate ?? null,
    value_date: t.valueDate ?? null,
    amount: Number(t.transactionAmount.amount),
    currency: t.transactionAmount.currency,
    counterparty: t.creditorName ?? t.debtorName ?? null,
    description:
      t.remittanceInformationUnstructured ??
      t.remittanceInformationUnstructuredArray?.join(" ") ??
      null,
    raw: t,
  }));

  const { data: inserted } = await svc
    .from("bank_transactions")
    .upsert(rows, { onConflict: "account_id,gc_transaction_id", ignoreDuplicates: true })
    .select("id, counterparty, description, amount");

  if (!inserted || inserted.length === 0) return;

  // Categorize in batches of 40.
  for (let i = 0; i < inserted.length; i += 40) {
    const batch = inserted.slice(i, i + 40) as TxIn[];
    try {
      const cats = await categorize(batch);
      await Promise.all(
        Object.entries(cats).map(([id, cat]) =>
          svc.from("bank_transactions").update({ category: cat }).eq("id", Number(id)),
        ),
      );
    } catch {
      // Skip this batch on failure — transactions already stored, will be
      // re-categorized on next /bank/sync call.
    }
  }
}

export async function resyncAllAccounts() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return;

  const svc = serviceClient();
  const { data: accounts } = await svc
    .from("bank_accounts")
    .select("id, gc_account_id, bank_connections!inner(user_id)")
    .eq("bank_connections.user_id", user.id);

  if (!accounts) return;
  for (const a of accounts as { id: number; gc_account_id: string }[]) {
    await syncTransactions(a.id, a.gc_account_id);
  }
  revalidatePath("/bank");
}

// Manual CSV import — no PSD2 / regulator needed. User exports a CSV
// from their bank, Claude parses and categorizes in one call, we store
// under a synthetic "manual" connection keyed to the user.
export async function uploadCsv(formData: FormData) {
  const file = formData.get("csv");
  const bankName = String(formData.get("bank_name") ?? "Manual").trim() || "Manual";
  if (!(file instanceof File) || file.size === 0) return { error: "No file" };
  if (file.size > 1_000_000) return { error: "CSV too large (max 1 MB)" };

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const text = await file.text();

  let parsed;
  try {
    parsed = await parseCsv(text);
  } catch (e) {
    return { error: `Parse failed: ${(e as Error).message}` };
  }
  if (parsed.length === 0) return { error: "No transactions found in CSV" };

  const svc = serviceClient();

  // One "manual" connection per user — reused across uploads.
  let { data: conn } = await svc
    .from("bank_connections")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "manual")
    .maybeSingle();
  if (!conn) {
    const { data: newConn } = await svc
      .from("bank_connections")
      .insert({
        user_id: user.id,
        status: "manual",
        institution_name: "Manual imports",
      })
      .select("id")
      .single();
    conn = newConn;
  }
  if (!conn) return { error: "Could not create connection" };

  // One account per bank name within that connection.
  let { data: acct } = await svc
    .from("bank_accounts")
    .select("id")
    .eq("connection_id", conn.id)
    .eq("display_name", bankName)
    .maybeSingle();
  if (!acct) {
    const { data: newAcct } = await svc
      .from("bank_accounts")
      .insert({
        connection_id: conn.id,
        gc_account_id: `manual:${user.id}:${bankName}`,
        display_name: bankName,
        currency: "EUR",
      })
      .select("id")
      .single();
    acct = newAcct;
  }
  if (!acct) return { error: "Could not create account" };

  const rows = parsed.map((t) => {
    const fingerprint = createHash("sha1")
      .update(`${t.date}|${t.amount}|${t.description}`)
      .digest("hex")
      .slice(0, 16);
    return {
      account_id: acct!.id,
      gc_transaction_id: `manual-${fingerprint}`,
      booking_date: t.date,
      value_date: t.date,
      amount: t.amount,
      currency: "EUR",
      counterparty: t.counterparty,
      description: t.description,
      category: t.category,
      raw: { source: "csv_upload", bank: bankName },
    };
  });

  const { error: insErr } = await svc
    .from("bank_transactions")
    .upsert(rows, {
      onConflict: "account_id,gc_transaction_id",
      ignoreDuplicates: true,
    });
  if (insErr) return { error: `Insert failed: ${insErr.message}` };

  // Update account balance as sum of amounts.
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  await svc
    .from("bank_accounts")
    .update({ balance: total, balance_at: new Date().toISOString() })
    .eq("id", acct.id);

  revalidatePath("/bank");
  return { ok: true, count: rows.length };
}

export async function disconnectBank(formData: FormData) {
  const connectionId = Number(formData.get("connection_id"));
  if (!connectionId) return;

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return;

  const svc = serviceClient();
  await svc
    .from("bank_connections")
    .delete()
    .eq("id", connectionId)
    .eq("user_id", user.id);
  revalidatePath("/bank");
}
