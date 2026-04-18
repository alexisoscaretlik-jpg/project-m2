import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  _client = new Anthropic({ apiKey: key });
  return _client;
}
const MODEL = "claude-haiku-4-5";

export type TaxExtraction = {
  tax_year: number;
  rfr: number | null;
  revenu_imposable: number | null;
  parts: number | null;
  impot_revenu: number | null;
  tmi: number | null;
  situation: string | null;
  nb_enfants: number | null;
};

export type Recommendation = {
  title: string;
  impact_eur: number | null;
  why: string;
  actions: string[];
};

const EXTRACT_PROMPT = `You are extracting data from a French avis d'imposition (tax assessment).
Return JSON only, no prose. Fields (use null if not found):

{
  "tax_year": int,                  // année des revenus (e.g. 2024 for "revenus 2024")
  "rfr": number | null,             // Revenu fiscal de référence (€)
  "revenu_imposable": number | null,
  "parts": number | null,           // Nombre de parts fiscales (e.g. 1, 1.5, 2)
  "impot_revenu": number | null,    // Impôt sur le revenu net (€)
  "tmi": number | null,             // Taux marginal d'imposition (0, 11, 14, 30, 41, 45)
  "situation": string | null,       // one of: "célibataire" | "marié" | "pacsé" | "divorcé" | "veuf"
  "nb_enfants": number | null       // Personnes à charge
}`;

export async function extractAvis(pdfBase64: string): Promise<TaxExtraction> {
  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 800,
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
  return JSON.parse(raw) as TaxExtraction;
}

const RECO_PROMPT = (ex: TaxExtraction) => `A French taxpayer has this tax profile:

- Year: ${ex.tax_year}
- Revenu imposable: ${ex.revenu_imposable ?? "unknown"} €
- RFR: ${ex.rfr ?? "unknown"} €
- Parts fiscales: ${ex.parts ?? "unknown"}
- Impôt sur le revenu: ${ex.impot_revenu ?? "unknown"} €
- TMI: ${ex.tmi ?? "unknown"} %
- Situation: ${ex.situation ?? "unknown"}
- Enfants à charge: ${ex.nb_enfants ?? 0}

Return JSON only — 3 to 5 concrete, personalized tax-optimization
recommendations ranked by expected euro impact for THIS profile.
Consider: PEA (€150k cap, 0% CG after 5y), assurance-vie (€4,600
abatement after 8y), PER (deduct up to 10% of net pro income —
estimate limit from revenus), TMI arbitrage (flat tax 30% vs barème),
déficit foncier if real-estate, dons (66%), garde d'enfants (50%),
frais réels vs abattement 10%, IFI if relevant.

Skip recommendations that don't apply (e.g. no PER advice if TMI=0).

Schema:
{"recommendations":[
  {"title": "...", "impact_eur": 1200, "why": "one sentence why this
   applies to THIS profile", "actions": ["step 1", "step 2"]}
]}`;

export async function recommend(
  ex: TaxExtraction,
): Promise<Recommendation[]> {
  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [
      { role: "user", content: RECO_PROMPT(ex) },
      { role: "assistant", content: "{" },
    ],
  });
  const block = msg.content.find((b) => b.type === "text");
  const raw = "{" + (block && "text" in block ? block.text : "");
  const parsed = JSON.parse(raw) as { recommendations: Recommendation[] };
  return parsed.recommendations ?? [];
}
