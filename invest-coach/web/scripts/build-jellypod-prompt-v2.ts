#!/usr/bin/env tsx
// Two-stage script generator — outputs a FINISHED Camille × Thomas
// dialogue ready for Jellypod's Script Editor (replace generated
// script + Regenerate Audio).
//
// Stage 1: Gemini watches the video and extracts ALL rules verbatim
//          (title + plain-French explanation + example + memorable
//          quote per rule). Existing logic.
// Stage 2: Claude Opus 4.7 reads `prompts/coach-thomas-master-v3.md`
//          (master prompt — SUCCESs / ABT / Pixar / Story Circle /
//          Feynman frameworks applied invisibly), substitutes
//          `{{SOURCE}}` with the Gemini extraction, and produces the
//          final French dialogue (CAMILLE: / THOMAS: lines, 12-15 min,
//          1800-2200 words).
//
// Output:
//   - stdout: the dialogue script
//   - stderr: progress + token usage
//
// Usage:
//   npx tsx scripts/build-jellypod-prompt-v2.ts <youtube_url>

import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, "..", ".env.local");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq < 0) continue;
  const k = t.slice(0, eq).trim();
  let v = t.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  if (k && !process.env[k]) process.env[k] = v;
}

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

type RuleExtraction = {
  index: number;
  title: string;          // short label as said in video
  rawQuote: string;       // verbatim or near-verbatim quote
  plainExplanation: string; // what it means in plain French
  exampleGiven: string;   // any example/anecdote in the video
};

type FullExtraction = {
  videoTitle: string;
  videoCreator: string;
  totalRules: number;
  overarchingThesis: string;
  rules: RuleExtraction[];
};

const GEMINI_RULES_PROMPT = `Tu regardes une vidéo YouTube en anglais sur l'argent. Cette vidéo liste explicitement N règles, lois, principes, ou habitudes (ex: "15 Rules of Money", "12 Habits of Wealthy People", "10 Laws of Wealth").

Ton rôle : extraire CHAQUE règle telle qu'elle est énoncée. Pas une distillation, pas une synthèse — une transcription structurée.

Réponds UNIQUEMENT avec un objet JSON valide selon ce schéma :

{
  "videoTitle": "Titre exact",
  "videoCreator": "Nom de la chaîne",
  "totalRules": 15,
  "overarchingThesis": "Une phrase qui résume ce que la vidéo dit globalement.",
  "rules": [
    {
      "index": 1,
      "title": "Money reveals character (titre court tel que prononcé)",
      "rawQuote": "Citation littérale ou quasi-littérale de la règle (1-2 phrases en anglais ou français selon la langue de la vidéo)",
      "plainExplanation": "Ce que cette règle veut dire concrètement, en français simple, 2 phrases max.",
      "exampleGiven": "Tout exemple, anecdote, chiffre cité par la vidéo pour illustrer cette règle. '(aucun)' si la vidéo n'en donne pas."
    }
  ]
}

Règles d'extraction :
- N'invente AUCUNE règle qui n'est pas dans la vidéo. Si tu n'es pas sûr du nombre exact, mets ce que tu as.
- "rawQuote" doit refléter les mots de la vidéo, pas une réécriture.
- "plainExplanation" est en français, accessible à un salarié français qui ne parle pas anglais financier.
- Si la vidéo donne un chiffre concret pour une règle (ex: "save 20 % of your income"), inclus-le dans plainExplanation ou exampleGiven.
- Garde l'ordre des règles tel qu'elles apparaissent dans la vidéo.`;

// Master prompt is loaded from prompts/coach-thomas-master-v3.md so we
// can iterate on the prompt without touching this script.
const MASTER_PROMPT_PATH = resolve(
  here,
  "..",
  "prompts",
  "coach-thomas-master-v3.md",
);

async function geminiExtract(url: string): Promise<FullExtraction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY non configurée.");
  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_VIDEO_MODEL_PRO || "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model,
    contents: [
      { fileData: { fileUri: url, mimeType: "video/mp4" } },
      { text: GEMINI_RULES_PROMPT },
    ] as unknown as string,
  });

  const raw = (response.text ?? "").trim();
  if (!raw) throw new Error("Gemini n'a rien retourné.");
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned) as FullExtraction;
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: build-jellypod-prompt-v2.ts <youtube_url>");
    process.exit(1);
  }

  console.error("Stage 1 — Gemini extracts ALL rules…");
  const extraction = await geminiExtract(url);
  console.error(`  Title: ${extraction.videoTitle}`);
  console.error(`  Rules extracted: ${extraction.rules.length} (claimed: ${extraction.totalRules})`);
  console.error(`  Thesis: ${extraction.overarchingThesis}`);
  console.error(`  Sample rule: #${extraction.rules[0]?.index} — "${extraction.rules[0]?.title}"`);

  console.error("\nStage 2 — Claude Opus 4.7 writes the Camille × Thomas dialogue…");

  // Load the master prompt and substitute the Gemini extraction into
  // the {{SOURCE}} placeholder. The prompt is the system message;
  // the user message just kicks Opus into produce-mode.
  const masterPromptRaw = readFileSync(MASTER_PROMPT_PATH, "utf8");
  const sourceForPrompt = JSON.stringify(extraction, null, 2);
  const systemPrompt = masterPromptRaw.replace("{{SOURCE}}", sourceForPrompt);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY non configurée.");
  const claude = new Anthropic({ apiKey });

  const msg = await claude.messages.create({
    model: process.env.ANTHROPIC_PODCAST_MODEL || "claude-opus-4-7",
    max_tokens: 8_000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content:
          "Génère le script complet de l'épisode maintenant, en respectant strictement le format de sortie demandé (lignes CAMILLE : et THOMAS : uniquement, indications scéniques entre crochets autorisées). Aucun préambule, aucun nom de framework, aucun commentaire hors du dialogue.",
      },
    ],
  });

  const block = msg.content.find((b) => b.type === "text");
  const out = block && "text" in block ? block.text.trim() : "";
  if (!out) {
    console.error("Claude returned empty content");
    process.exit(1);
  }

  process.stdout.write(out + "\n");
  console.error(`\nDone. ${out.length} chars · ${msg.usage.input_tokens} input / ${msg.usage.output_tokens} output tokens.`);
}

main().catch((err) => {
  console.error("\nERROR:", err.message);
  process.exit(1);
});
