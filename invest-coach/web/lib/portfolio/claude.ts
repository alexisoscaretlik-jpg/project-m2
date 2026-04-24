import Anthropic from "@anthropic-ai/sdk";

// Broker statement → structured lots extraction.
// Mirrors the shape of /lib/tax/claude.ts: one file, one prompt,
// Haiku for cost, assistant-prefill "{" to force JSON.

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  _client = new Anthropic({ apiKey: key });
  return _client;
}
const MODEL = "claude-haiku-4-5";

export type AccountType = "PEA" | "PEA-PME" | "CTO" | "AV" | "PER" | "other";

export type LotExtraction = {
  ticker: string | null;           // e.g. "AAPL", "MC.PA"
  isin: string | null;             // e.g. "FR0000121014" — preferred id
  name: string | null;             // e.g. "LVMH"
  account_type: AccountType;
  account_label: string | null;    // free text: "PEA Boursorama"
  quantity: number;
  cost_basis_eur: number | null;   // total cost for this lot (qty × avg_price incl. fees)
  avg_price_eur: number | null;    // per-share cost basis
  purchase_date: string | null;    // ISO date "YYYY-MM-DD"; null if not shown
  current_price_eur: number | null;
  market_value_eur: number | null;
  unrealized_pnl_eur: number | null;
  currency: string | null;         // original trade currency, e.g. "USD"
};

export type StatementExtraction = {
  broker: string | null;           // "Boursorama", "DEGIRO", "Trade Republic", "IBKR", "Fortuneo", …
  as_of_date: string | null;       // ISO date of the statement
  lots: LotExtraction[];
};

const EXTRACT_PROMPT = `You are extracting positions from a brokerage statement
issued to a French tax resident. Return JSON only, no prose.

Goal: produce a lot-by-lot list usable for tax-loss harvesting. For each
security position on the statement, emit one object.

IMPORTANT conventions:
- account_type values: "PEA" | "PEA-PME" | "CTO" | "AV" | "PER" | "other"
  - "PEA" = Plan d'Épargne en Actions (compte-titres type PEA)
  - "PEA-PME" = variant for SME
  - "CTO" = compte-titres ordinaire (any regular brokerage account, including non-French brokers like DEGIRO, IBKR, Trade Republic when held by a French resident)
  - "AV" = assurance-vie unit-linked
  - "PER" = plan épargne retraite
  - "other" if genuinely unclear
- Infer account_type from the statement header or account label.
  DEGIRO, IBKR, Trade Republic = "CTO" unless explicitly marked otherwise.
  Any mention of "PEA" in the account name = "PEA".
- All monetary values in EUR. If the statement is in another currency,
  convert using the rate shown on the statement if available, else leave null.
- currency = original trade currency of the instrument (e.g. "USD" for AAPL
  held through a French CTO). The *_eur fields are always EUR-normalized.
- purchase_date: ISO "YYYY-MM-DD". If the statement shows only averaged
  cost basis across multiple lots, set purchase_date to null (don't guess).
- If a field is not present on the statement, use null — never fabricate.

Schema:
{
  "broker": string | null,
  "as_of_date": string | null,
  "lots": [
    {
      "ticker": string | null,
      "isin": string | null,
      "name": string | null,
      "account_type": "PEA" | "PEA-PME" | "CTO" | "AV" | "PER" | "other",
      "account_label": string | null,
      "quantity": number,
      "cost_basis_eur": number | null,
      "avg_price_eur": number | null,
      "purchase_date": string | null,
      "current_price_eur": number | null,
      "market_value_eur": number | null,
      "unrealized_pnl_eur": number | null,
      "currency": string | null
    }
  ]
}`;

export async function extractStatement(
  pdfBase64: string,
): Promise<StatementExtraction> {
  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          { type: "text", text: EXTRACT_PROMPT },
        ],
      },
      { role: "assistant", content: "{" },
    ],
  });

  const block = msg.content.find((b) => b.type === "text");
  const raw = "{" + (block && "text" in block ? block.text : "");
  return JSON.parse(raw) as StatementExtraction;
}
