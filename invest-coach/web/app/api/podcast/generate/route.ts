import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export type DialogueLine = {
  speaker: "Coach" | "Investisseur";
  text: string;
};

export type PodcastScript = {
  title: string;
  summary: string;
  script: DialogueLine[];
};

const DIALOGUE_PROMPT = `Tu regardes une vidéo YouTube financière. Ton rôle est de la transformer en podcast éducatif en français pour un investisseur particulier français qui gère son PEA, son assurance-vie ou son CTO.

Génère un dialogue naturel entre deux personnes :
- **Coach** : Expert bienveillant, pédagogue. Explique clairement, sans jargon inutile. Utilise des exemples concrets (chiffres, cas typiques d'un salarié français). Jamais condescendant.
- **Investisseur** : Curieux, autodidacte, 35-50 ans. Pose des vraies questions, exprime des doutes légitimes. Représente l'auditeur.

Règles :
- 10 à 14 échanges (alternance Coach/Investisseur)
- 100% en français, même si la vidéo est en anglais
- Adapte le contenu au contexte français (fiscalité FR, enveloppes PEA/AV/PER, IR 2042, PFU 30%)
- Pas de publicité, pas de "likez et abonnez-vous", pas de hors-sujet
- Termine par une "action concrète" que l'investisseur peut faire cette semaine

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans preamble :
{
  "title": "Titre court du podcast (max 80 caractères)",
  "summary": "Deux phrases résumant le sujet et son intérêt pour un investisseur français.",
  "script": [
    {"speaker": "Coach", "text": "..."},
    {"speaker": "Investisseur", "text": "..."}
  ]
}`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url: string = body.url ?? "";

  if (!url || !url.includes("youtube.com") && !url.includes("youtu.be")) {
    return NextResponse.json({ error: "URL YouTube invalide." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY non configurée." }, { status: 503 });
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_VIDEO_MODEL || "gemini-2.5-flash";

    const response = await ai.models.generateContent({
      model,
      contents: [
        { fileData: { fileUri: url, mimeType: "video/mp4" } },
        { text: DIALOGUE_PROMPT },
      ] as unknown as string,
    });

    const raw = (response.text ?? "").trim();
    if (!raw) {
      return NextResponse.json({ error: "Gemini n'a rien retourné." }, { status: 502 });
    }

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: PodcastScript;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Réponse Gemini non parsable.", raw: cleaned.slice(0, 500) }, { status: 502 });
    }

    if (!parsed.script || !Array.isArray(parsed.script)) {
      return NextResponse.json({ error: "Format de script invalide." }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
