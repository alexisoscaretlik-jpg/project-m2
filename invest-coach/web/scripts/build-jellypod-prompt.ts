#!/usr/bin/env tsx
// Two-stage prompt builder for Jellypod episodes.
//
// Stage 1: Gemini watches the YouTube video and emits a structured brief
//          (existing extractVideoBrief in lib/podcast/extract-video.ts).
// Stage 2: Claude Opus 4.7 reads that brief + the Richest-Man-of-Babylon
//          markdown reference (storytelling craft only, never cited in
//          the audio) and writes the Jellypod production brief tailored
//          to THIS video — every episode gets a unique large-context
//          interpretation, not a template.
//
// Output:
//   - stdout: the Jellypod prompt, ready to paste
//   - stderr: progress log + the Gemini brief (for inspection)
//
// Usage:
//   npx tsx scripts/build-jellypod-prompt.ts <youtube_url>

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
import { extractVideoBrief } from "../lib/podcast/extract-video";

const BOOK_PATH = resolve(here, "..", "..", "..", "docs", "reference", "richest-man-of-babylon.md");

const META_PROMPT = `Tu es éditeur en chef d'un podcast financier français haut de gamme. Ton rôle est d'écrire un BRIEF DE PRODUCTION pour un studio de génération de podcast IA (Jellypod), à partir d'une vidéo YouTube anglophone que Gemini vient de regarder.

Le brief que tu écris sera collé tel quel dans Jellypod. Il doit être en français, naturel, en un seul bloc, sans markdown, sans préambule, sans liste à puces formelle (tu peux utiliser des tirets simples si nécessaire).

# Format obligatoire de l'épisode
- Conversation NATURELLE entre deux voix : Coach et Investisseur. Pas de narrateur. ~18 minutes.
- Coach : 80 % de la parole. Il enseigne par questions, pas par déclarations sèches. Phrases courtes, pauses respirées, tutoiement, calme, jamais condescendant. Voix mature, mentor.
- Investisseur : 20 %. 38 ans, salarié français ordinaire (CDI, loyer, enfants, RIB qui clignote). Il sonde la VISION du monde, il pose les questions naïves d'un Français devant son argent. Il dit "ouais", "attends, attends", il rit, il doute.

# Angle (le plus important)
La vidéo source est un Alux longform. Tu dois l'interpréter dans le LARGE CONTEXTE de la culture financière de fond — psychologie de l'argent, rapport au temps, identité, valeur perçue, nature de la rareté — PAS dans le contexte étroit des produits fiscaux français (PEA, AV, PER, TMI, abattements). Ces produits sont des outils, ils ne sont pas le sujet de cet épisode.

Identifie UNE seule idée centrale (qui doit rester dans l'oreille de l'auditeur après écoute) tirée des insights Gemini. Construis tout l'épisode autour d'elle.

# Ton matériel
1. Gemini a regardé la vidéo et extrait le brief structuré ci-dessous. Sers-t'en comme matière première — exemples concrets, chiffres, observations — sans jamais citer la vidéo ou son créateur.
2. En annexe, le texte intégral de "L'homme le plus riche de Babylone" (G.S. Clason, 1926). C'est ta CARTE STYLISTIQUE, pas une source à citer. Imite ses techniques narratives :
   - Parable + dialogue maïeutique (Arkad qui demande au marchand d'œufs avant d'asséner la règle)
   - Refrain bref, prononcé une seule fois
   - Action concrète qui clôt
   - Répétitions à trois temps
   - Concret avant abstrait
   Tu n'écris JAMAIS le nom du livre, ses personnages (Arkad, Algamish, Bansir, Kobbi, Clason), ni "Babylone" / "Babylon" / "richest man". Le livre reste invisible.

# Crochet final
L'épisode finit par un crochet d'attente pour le mois suivant : "Le mois prochain on parle de [X], et tu vas comprendre pourquoi [Y]." Pas de CTA, pas d'"abonne-toi", pas de "like".

# Phrases interdites dans le brief que tu produis
- abonnez-vous, likez, partagez, garanti, sans risque, doublez votre capital, révolutionnaire
- "comme dans la vidéo de…", "Alux"
- "Babylone", "Babylon", "richest man", "Arkad", "Algamish", "Bansir", "Clason"
- chiffres fiscaux français spécifiques (PEA 150 000 €, abattement AV 4 600 €, TMI 30 %, etc.)

# Format du brief que tu produis
Un seul bloc de texte français, ~3500-4500 caractères, structuré ainsi (mais sans en-têtes Markdown — utilise des phrases qui annoncent les sections) :
1. Format & ratio (Coach 80 / Investisseur 20, conversation naturelle, pas de narrateur, ~18 min).
2. L'idée centrale (une phrase, six mots si possible) + pourquoi elle compte pour l'auditeur français.
3. Profil du Coach pour cet épisode — ce qu'il a vécu qui le rend crédible sur cette idée précise.
4. Profil de l'Investisseur — la question qui le tourmente sur ce sujet, traduite en sa propre vie.
5. 2-3 scènes françaises concrètes que le Coach raconte (quotidien : un cariste, une vendeuse, un cadre, un retraité).
6. La progression du dialogue : comment l'idée centrale s'installe par questions, pas par affirmation.
7. L'action concrète unique à la fin (datée, mesurable, faisable cette semaine).
8. Le crochet pour le mois suivant.
9. Les interdits absolus rappelés en une phrase.

Pas de méta-commentaire ("Voici le brief :"). On entre direct.`;

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: build-jellypod-prompt.ts <youtube_url>");
    process.exit(1);
  }

  console.error("Stage 1 — Gemini watches the video…");
  const brief = await extractVideoBrief(url);
  console.error(`  Title: ${brief.videoTitle}`);
  console.error(`  Pivot law (internal): ${brief.babylonianLawSuggestion}`);
  console.error(`  Suggested character: ${brief.characterSuggestion.name}, ${brief.characterSuggestion.age}, ${brief.characterSuggestion.city}`);

  console.error("\nStage 2 — Claude Opus 4.7 writes the Jellypod brief…");
  const book = readFileSync(BOOK_PATH, "utf8");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY non configurée.");
  const claude = new Anthropic({ apiKey });

  const userMessage = `# Gemini brief (matière première)

\`\`\`json
${JSON.stringify(brief, null, 2)}
\`\`\`

# Référence stylistique — texte intégral de "L'homme le plus riche de Babylone"
(carte interne seulement, jamais cité dans le brief que tu produis)

\`\`\`
${book}
\`\`\`

# Maintenant
Écris le brief Jellypod pour cet épisode. Réponds UNIQUEMENT avec le brief, en un seul bloc de texte français. Pas de méta-commentaire.`;

  const msg = await claude.messages.create({
    model: process.env.ANTHROPIC_PODCAST_MODEL || "claude-opus-4-7",
    max_tokens: 4_000,
    system: META_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = msg.content.find((b) => b.type === "text");
  const out = block && "text" in block ? block.text.trim() : "";
  if (!out) {
    console.error("Claude returned empty content");
    process.exit(1);
  }

  // The Jellypod brief on stdout — the only thing the user pastes.
  process.stdout.write(out + "\n");

  console.error(`\nDone. ${out.length} chars · ${msg.usage.input_tokens} input / ${msg.usage.output_tokens} output tokens.`);
}

main().catch((err) => {
  console.error("\nERROR:", err.message);
  process.exit(1);
});
