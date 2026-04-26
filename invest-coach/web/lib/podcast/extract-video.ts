import { GoogleGenAI } from "@google/genai";

// Extract the financial insight from a YouTube video using Gemini's
// native video understanding. Returns the structured brief that the
// Babylon script generator consumes — NOT a full script.
//
// Uses 2.5 Pro (vs the 2.5 Flash used by the 4-min dialogue route)
// because we want a more nuanced extraction for long-form output.

export type VideoExtraction = {
  videoTitle: string;
  videoCreator: string | null;
  topicSummary: string;
  keyInsightBullets: string[];           // 3–5 distilled lessons
  numbersAndFigures: string[];           // any concrete numbers worth keeping
  babylonianLawSuggestion:
    | "pay-yourself-first"
    | "control-thy-expenditures"
    | "make-thy-gold-multiply"
    | "guard-thy-treasures-from-loss"
    | "make-thy-dwelling-a-profitable-investment"
    | "ensure-income-for-the-future"
    | "increase-thy-ability-to-earn";
  characterSuggestion: {
    name: string;
    age: number;
    city: string;
    situation: string;
  };
  targetActionSuggestion: string;
};

const EXTRACT_PROMPT = `Tu regardes une vidéo YouTube en français ou anglais sur la finance personnelle. Ton rôle est d'en extraire le matériel pour un épisode de podcast français de 20 minutes au format "L'homme le plus riche de Babylone" (parable + dialogue + action).

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans préambule, selon ce schéma :

{
  "videoTitle": "Titre exact de la vidéo",
  "videoCreator": "Nom de la chaîne YouTube ou null",
  "topicSummary": "2 phrases résumant le sujet pour un investisseur français.",
  "keyInsightBullets": [
    "Insight 1 : phrase courte et précise.",
    "Insight 2 : ...",
    "Insight 3 : ..."
  ],
  "numbersAndFigures": [
    "Toute statistique ou chiffre concret cité dans la vidéo (ex: '60 % des Français épargnent moins de 5 % de leur revenu')."
  ],
  "babylonianLawSuggestion": "pay-yourself-first" | "control-thy-expenditures" | "make-thy-gold-multiply" | "guard-thy-treasures-from-loss" | "make-thy-dwelling-a-profitable-investment" | "ensure-income-for-the-future" | "increase-thy-ability-to-earn",
  "characterSuggestion": {
    "name": "Prénom français crédible",
    "age": 28-55,
    "city": "Ville française moyenne ou grande",
    "situation": "1 phrase : métier, situation familiale, problème d'argent qu'il vit en lien avec le sujet."
  },
  "targetActionSuggestion": "Une action concrète, datée, mesurable qu'un salarié français pourrait faire cette semaine en lien avec la leçon."
}

Règles :
- 3 à 5 insights maximum, distillés (pas de copier-coller du discours).
- "babylonianLawSuggestion" doit être la loi qui correspond le mieux au cœur de la vidéo.
- Le personnage doit être crédible (un cadre à Lyon, une infirmière à Nantes, pas "Jean l'investisseur").
- Si la vidéo n'a pas de lien clair avec une des sept lois, choisis "make-thy-gold-multiply" par défaut.`;

let _ai: GoogleGenAI | null = null;
function ai(): GoogleGenAI {
  if (_ai) return _ai;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY non configurée.");
  _ai = new GoogleGenAI({ apiKey });
  return _ai;
}

export async function extractVideoBrief(url: string): Promise<VideoExtraction> {
  const model = process.env.GEMINI_VIDEO_MODEL_PRO || "gemini-2.5-pro";

  const response = await ai().models.generateContent({
    model,
    contents: [
      { fileData: { fileUri: url, mimeType: "video/mp4" } },
      { text: EXTRACT_PROMPT },
    ] as unknown as string,
  });

  const raw = (response.text ?? "").trim();
  if (!raw) throw new Error("Gemini n'a rien retourné pour l'extraction vidéo.");

  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned) as VideoExtraction;
}
