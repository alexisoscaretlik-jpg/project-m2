const BASE = "https://bankaccountdata.gocardless.com/api/v2";

// Module-level token cache. Access tokens are valid 24h; we don't
// persist across lambda cold starts, but each serverless invocation
// that touches GoCardless twice in a row will reuse.
let cached: { token: string; exp: number } | null = null;

async function token(): Promise<string> {
  if (cached && Date.now() < cached.exp - 60_000) return cached.token;
  const r = await fetch(`${BASE}/token/new/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      secret_id: process.env.GOCARDLESS_SECRET_ID,
      secret_key: process.env.GOCARDLESS_SECRET_KEY,
    }),
  });
  if (!r.ok) throw new Error(`GC token: ${r.status} ${await r.text()}`);
  const j = (await r.json()) as { access: string; access_expires: number };
  cached = { token: j.access, exp: Date.now() + j.access_expires * 1000 };
  return j.access;
}

async function gc<T>(
  path: string,
  init?: RequestInit & { method?: string; json?: unknown },
): Promise<T> {
  const tok = await token();
  const { json, headers, ...rest } = init ?? {};
  const r = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${tok}`,
      Accept: "application/json",
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(headers ?? {}),
    },
    body: json ? JSON.stringify(json) : (init?.body as BodyInit | undefined),
  });
  if (!r.ok) throw new Error(`GC ${path}: ${r.status} ${await r.text()}`);
  return (await r.json()) as T;
}

export type Institution = {
  id: string;
  name: string;
  bic?: string;
  logo?: string;
  transaction_total_days?: string;
};

export async function listInstitutions(country = "fr"): Promise<Institution[]> {
  return gc<Institution[]>(`/institutions/?country=${country}`);
}

export type Requisition = {
  id: string;
  link: string;
  status: string;
  accounts: string[];
};

export async function createRequisition(params: {
  institution_id: string;
  redirect: string;
  reference: string;
}): Promise<Requisition> {
  return gc<Requisition>("/requisitions/", {
    method: "POST",
    json: { ...params, user_language: "FR" },
  });
}

export async function getRequisition(id: string): Promise<Requisition> {
  return gc<Requisition>(`/requisitions/${id}/`);
}

export type AccountDetails = {
  account: {
    iban?: string;
    ownerName?: string;
    name?: string;
    currency?: string;
    product?: string;
  };
};

export async function getAccountDetails(id: string): Promise<AccountDetails> {
  return gc<AccountDetails>(`/accounts/${id}/details/`);
}

export type Balances = {
  balances: Array<{
    balanceAmount: { amount: string; currency: string };
    balanceType: string;
    referenceDate?: string;
  }>;
};

export async function getBalances(id: string): Promise<Balances> {
  return gc<Balances>(`/accounts/${id}/balances/`);
}

export type GcTransaction = {
  transactionId?: string;
  internalTransactionId?: string;
  bookingDate?: string;
  valueDate?: string;
  transactionAmount: { amount: string; currency: string };
  creditorName?: string;
  debtorName?: string;
  remittanceInformationUnstructured?: string;
  remittanceInformationUnstructuredArray?: string[];
};

export type Transactions = {
  transactions: { booked: GcTransaction[]; pending: GcTransaction[] };
};

export async function getTransactions(id: string): Promise<Transactions> {
  return gc<Transactions>(`/accounts/${id}/transactions/`);
}
