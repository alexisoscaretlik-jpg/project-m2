import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = "claude-haiku-4-5";

export const CATEGORIES = [
  "courses",
  "restaurant",
  "transport",
  "logement",
  "abonnements",
  "shopping",
  "santé",
  "sport_loisirs",
  "épargne_investissement",
  "revenus",
  "autre",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type TxIn = {
  id: number;
  counterparty: string | null;
  description: string | null;
  amount: number;
};

const PROMPT = `Classify these French bank transactions into one of:
${CATEGORIES.join(", ")}.

Rules:
- "revenus" is any positive amount that looks like salary, virement from an employer, dividends, refunds.
- "courses" = grocery stores (Carrefour, Monoprix, Lidl, Picard…).
- "restaurant" = cafés, bars, food delivery (Uber Eats, Deliveroo).
- "transport" = SNCF, RATP, Uber, Bolt, Total/Esso (fuel), parking.
- "logement" = loyer, EDF, Engie, Suez, Orange, SFR, Free, Bouygues.
- "abonnements" = Netflix, Spotify, iCloud, Adobe, gym memberships.
- "shopping" = Amazon, Fnac, clothing.
- "santé" = pharmacie, médecin, mutuelle.
- "épargne_investissement" = PEA, assurance-vie, virement vers compte épargne, Boursorama, Fortuneo, Trade Republic, Revolut top-ups going to invest.
- Unclear → "autre".

Return JSON only:
{"results":[{"id": 1, "category": "courses"}, ...]}`;

export async function categorize(
  batch: TxIn[],
): Promise<Record<number, Category>> {
  if (batch.length === 0) return {};

  const body = batch
    .map(
      (t) =>
        `${t.id}\t${t.amount.toFixed(2)}\t${t.counterparty ?? ""}\t${t.description ?? ""}`,
    )
    .join("\n");

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `${PROMPT}\n\nTransactions (id\\tamount\\tcounterparty\\tdescription):\n${body}`,
      },
      { role: "assistant", content: "{" },
    ],
  });

  const block = msg.content.find((b) => b.type === "text");
  const raw = "{" + (block && "text" in block ? block.text : "");
  const parsed = JSON.parse(raw) as {
    results: { id: number; category: Category }[];
  };
  const out: Record<number, Category> = {};
  for (const r of parsed.results ?? []) out[r.id] = r.category;
  return out;
}
