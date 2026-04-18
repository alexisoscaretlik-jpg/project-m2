import Anthropic from "@anthropic-ai/sdk";

import { CATEGORIES } from "./categorize";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = "claude-haiku-4-5";

export type ParsedTx = {
  date: string; // ISO YYYY-MM-DD
  amount: number; // negative = expense, positive = income
  counterparty: string | null;
  description: string;
  category: string;
};

const PROMPT = `You are parsing a bank statement CSV from a French bank (BNP, Crédit Agricole,
Société Générale, Boursorama, Fortuneo, Revolut, N26, etc.). The header
format varies — figure it out.

Return JSON only, no prose. For each row, return:
  - date: ISO YYYY-MM-DD
  - amount: number. Negative for expenses (debits), positive for income (credits).
    If the CSV has separate Debit/Credit columns, merge them.
  - counterparty: merchant or other party. Infer from description if missing.
  - description: full raw description text.
  - category: one of ${CATEGORIES.join(", ")}.

Category rules:
- "revenus" = salary, virement from employer, dividends, refunds, positive interest.
- "courses" = grocery (Carrefour, Monoprix, Lidl, Picard, Auchan, Franprix…).
- "restaurant" = cafés, bars, food delivery (Uber Eats, Deliveroo, Frichti).
- "transport" = SNCF, RATP, Uber, Bolt, Total/Esso (fuel), parking, Navigo.
- "logement" = loyer, EDF, Engie, Suez, Orange, SFR, Free, Bouygues.
- "abonnements" = Netflix, Spotify, iCloud, Adobe, gym memberships, press.
- "shopping" = Amazon, Fnac, clothing, electronics.
- "santé" = pharmacie, médecin, mutuelle.
- "sport_loisirs" = cinéma, Decathlon, gyms that aren't monthly.
- "épargne_investissement" = PEA, assurance-vie, Boursorama, Fortuneo, Trade Republic,
  virement vers livret A, PER.
- Unclear → "autre".

Skip header rows and summary rows (total, solde). Only return real transactions.

Schema:
{"transactions": [{"date":"2025-01-15","amount":-45.20,"counterparty":"Monoprix","description":"CB MONOPRIX PARIS 15/01","category":"courses"}, ...]}`;

const MAX_CSV_BYTES = 500_000; // 500 KB

export async function parseCsv(csv: string): Promise<ParsedTx[]> {
  // Guard against huge uploads — Haiku context is generous but not
  // infinite. Typical 6-month CSV is <100 KB.
  const trimmed = csv.length > MAX_CSV_BYTES ? csv.slice(0, MAX_CSV_BYTES) : csv;

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    messages: [
      { role: "user", content: `${PROMPT}\n\nCSV:\n${trimmed}` },
      { role: "assistant", content: "{" },
    ],
  });

  const block = msg.content.find((b) => b.type === "text");
  const raw = "{" + (block && "text" in block ? block.text : "");
  const parsed = JSON.parse(raw) as { transactions: ParsedTx[] };
  return parsed.transactions ?? [];
}
