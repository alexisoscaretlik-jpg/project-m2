// Gemini 2.5 Flash reader — cheap/fast PDF extraction alternative
// to the Haiku-based extractor in lib/tax/claude.ts.
//
// Why two extractors: the multi-model routing pattern. Gemini Flash
// is cheaper and visually stronger for heavy OCR work (multi-page
// avis scans, broker statements). Haiku is the reasoning side.
// The orchestrator picks which one runs based on input type.
//
// Same output shape as extractAvis() so it's drop-in replaceable.

import type { TaxExtraction } from "./claude";

const DEFAULT_MODEL = "gemini-2.5-flash";

const EXTRACT_PROMPT = `You are extracting data from a French avis d'imposition (tax assessment).
Return JSON only, no prose, no code fences. Fields (use null if not found):

{
  "tax_year": int,                  // année des revenus (e.g. 2024 for "revenus 2024")
  "rfr": number | null,             // Revenu fiscal de référence (€)
  "revenu_imposable": number | null,
  "parts": number | null,           // Nombre de parts fiscales (e.g. 1, 1.5, 2)
  "impot_revenu": number | null,    // Impôt sur le revenu net (€)
  "tmi": number | null,             // Taux marginal d'imposition (0, 11, 14, 30, 41, 45)
  "situation": string | null,       // one of: "célibataire" | "marié" | "pacsé" | "divorcé" | "veuf"
  "nb_enfants": number | null       // Personnes à charge
}

Do not wrap in markdown. Just the raw JSON object.`;

/**
 * Extract avis d'imposition structured fields via Gemini 2.5 Flash.
 * Accepts a base64-encoded PDF. Throws on missing API key or bad JSON.
 */
export async function extractAvisGemini(pdfBase64: string): Promise<TaxExtraction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  // Dynamic import so the build doesn't fail if @google/genai isn't
  // installed (matches the pattern in app/admin/notes/actions.ts).
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64,
            },
          },
          { text: EXTRACT_PROMPT },
        ],
      },
    ],
    // Force JSON output — Gemini supports response mime-type config
    // but we'll parse defensively below regardless.
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = (response.text ?? "").trim();
  if (!text) throw new Error("Gemini returned an empty body");

  // Strip any stray markdown fences Gemini sometimes leaves despite
  // the responseMimeType hint.
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as TaxExtraction;
  } catch (e) {
    throw new Error(
      `Gemini returned invalid JSON for avis extraction: ${(e as Error).message}`,
    );
  }
}
