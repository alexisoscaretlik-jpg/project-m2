// Babylon-style podcast script prompt.
// Produces a 3-act, ~2,900-word French script anchored on one Babylonian money law.
// Inspired by The Richest Man in Babylon (G.S. Clason) — parable + dialogue,
// not a flat summary.

export type BabylonianLaw =
  | "pay-yourself-first"
  | "control-thy-expenditures"
  | "make-thy-gold-multiply"
  | "guard-thy-treasures-from-loss"
  | "make-thy-dwelling-a-profitable-investment"
  | "ensure-income-for-the-future"
  | "increase-thy-ability-to-earn";

export const LAW_FR: Record<BabylonianLaw, string> = {
  "pay-yourself-first":
    "Une partie de ce que tu gagnes est à toi (épargner au moins 10 % avant toute dépense).",
  "control-thy-expenditures":
    "Maîtrise tes dépenses (distinguer désirs nécessaires et désirs sans fin).",
  "make-thy-gold-multiply":
    "Fais multiplier ton or (mettre ton épargne au travail, intérêts composés).",
  "guard-thy-treasures-from-loss":
    "Protège ton capital de la perte (diversification, prudence, conseil de l'expert).",
  "make-thy-dwelling-a-profitable-investment":
    "Fais de ton logement un placement rentable (propriété, levier maîtrisé).",
  "ensure-income-for-the-future":
    "Assure-toi des revenus futurs (retraite, PER, rente).",
  "increase-thy-ability-to-earn":
    "Augmente ta capacité à gagner (compétences, négociation salariale, side income).",
};

export type BabylonBrief = {
  sourceUrl: string;
  sourceCreator: string;
  keyInsightBullets: string[];
  law: BabylonianLaw;
  character: {
    name: string;
    age: number;
    city: string;
    situation: string;
  };
  targetAction: string;
};

export type ScriptLine = {
  speaker: "Narrateur" | "Coach" | "Investisseur";
  text: string;
  act: 1 | 2 | 3;
};

export type BabylonScript = {
  title: string;
  summary: string;
  law: BabylonianLaw;
  character: BabylonBrief["character"];
  source: { url: string; creator: string };
  lines: ScriptLine[];
  wordCount: number;
};

export function buildBabylonPrompt(brief: BabylonBrief): string {
  const lawFr = LAW_FR[brief.law];
  const c = brief.character;

  return `Tu écris un épisode de podcast français de 19 minutes (~2 900 mots) pour Invest Coach.

Le format s'inspire du livre "L'homme le plus riche de Babylone" de G.S. Clason : chaque épisode raconte UNE leçon d'argent à travers UNE histoire de personnage. Pas de résumé plat, pas de listes à puces récitées. Du récit, du dialogue, de la chair humaine.

# Loi babylonienne de cet épisode
**${lawFr}**

# Source à exploiter
- Vidéo YouTube : ${brief.sourceUrl}
- Créateur : ${brief.sourceCreator}
- Insights clés extraits de la vidéo :
${brief.keyInsightBullets.map((b) => `  - ${b}`).join("\n")}

# Personnage de l'acte 1
- Prénom : ${c.name}
- Âge : ${c.age}
- Ville : ${c.city}
- Situation : ${c.situation}

# Action concrète de l'acte 3
${brief.targetAction}

# Structure (à respecter strictement)

## ACTE 1 — Ouverture narrative (≈ 400 mots, ~2-3 min)
- Voix : **Narrateur** uniquement.
- Pose le décor : ${c.name} face à une décision d'argent. On sent l'enjeu, le doute, le quotidien français.
- Ne nomme PAS encore la leçon. Pas de morale. Juste l'humain.
- Style : phrases courtes, présent de narration, détails concrets (le café à 1,80 €, le virement de salaire, l'application bancaire).
- Termine sur une question implicite : qu'est-ce que ${c.name} devrait faire ?

## ACTE 2 — Dialogue Coach + Investisseur (≈ 2 000 mots, ~13-15 min)
- Voix : **Coach** et **Investisseur** en alternance, 18 à 24 échanges.
- Le Coach explique la leçon en s'appuyant sur le cas de ${c.name}. Il cite la sagesse babylonienne quand c'est naturel ("Comme Arkad le disait à ses élèves...", "La première loi enseignée par Algamish..."). Une ou deux références au livre, pas davantage — on ne fait pas un cours d'histoire.
- L'Investisseur (35-50 ans, autodidacte) pose les vraies questions d'un auditeur français : "Mais avec un PEA plafonné à 150 000 €, est-ce que ça vaut le coup ?" "Et si je suis à la TMI 30 %, je perds combien sur l'AV ?" Il pose des doutes. Il revient sur ce que ${c.name} devrait faire concrètement.
- Reprends les insights de la vidéo source mais reformulés pour le contexte fiscal français (PEA, AV, PER, CTO, PFU 30 %, TMI 0/11/30/41/45 %, Livret A 22 950 €, abattement AV 4 600 €/9 200 €).
- Chiffres exacts pour 2026. Si un chiffre est cité dans la vidéo source mais ne s'applique pas en France, le Coach le précise et donne l'équivalent FR.
- Pas de conseil personnalisé d'achat/vente sur un titre précis. Mécanismes, comparaisons, seuils statutaires uniquement.

## ACTE 3 — Action concrète (≈ 500 mots, ~3-4 min)
- Voix : **Coach** d'abord, puis **Investisseur** qui reformule, puis **Narrateur** pour fermer.
- Coach : énonce l'action concrète de la semaine en 2-3 phrases. Une seule action. Précise, datée, mesurable.
- Investisseur : reformule l'action dans ses propres mots, pour confirmer qu'il a compris. Une touche d'humour ou de doute autorisée.
- Narrateur (ferme l'épisode) : revient sur ${c.name}. Une phrase ou deux. Pas de CTA. Pas de "abonnez-vous". Juste la résonance.

# Règles non négociables

- 100 % en français, tutoiement (jamais "vous").
- Pas de phrases interdites : "abonnez-vous", "likez", "achète cette action", "garanti", "sans risque", "doublez votre capital", "révolutionnaire".
- Tirets typographiques : utilise « · » ou coupe la phrase. Pas de « — » em-dash dans le texte parlé (ils s'entendent mal).
- Variations de longueur : alterne phrases courtes (5-8 mots) et longues (20-25 mots). Le rythme parlé doit respirer.
- Émotions parlées : autorise "Hum.", "Bon.", "D'accord.", "Attends..." en début de réplique pour casser la lecture mécanique de la TTS.
- Une fois par acte 2, le Coach utilise une phrase rituelle babylonienne. Choix possibles :
  - "Une partie de ce que tu gagnes est à toi."
  - "Si tu désires aider ton ami, fais-le d'une manière qui n'attire pas vers toi le fardeau de ton ami."
  - "Mieux vaut un peu de prudence qu'un grand regret."
  - "Le conseil est une chose donnée librement, mais veille à ne prendre que ce qui mérite d'être pris."
- Pas d'emojis dans le script (la TTS les lit littéralement).

# Format de sortie

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans préambule. Schéma :

{
  "title": "Titre de l'épisode (max 70 caractères, sans guillemets)",
  "summary": "Deux phrases : ce que l'épisode enseigne et pour qui.",
  "law": "${brief.law}",
  "character": ${JSON.stringify(brief.character)},
  "source": { "url": "${brief.sourceUrl}", "creator": "${brief.sourceCreator}" },
  "lines": [
    { "act": 1, "speaker": "Narrateur",    "text": "..." },
    { "act": 2, "speaker": "Coach",        "text": "..." },
    { "act": 2, "speaker": "Investisseur", "text": "..." },
    { "act": 3, "speaker": "Coach",        "text": "..." },
    { "act": 3, "speaker": "Investisseur", "text": "..." },
    { "act": 3, "speaker": "Narrateur",    "text": "..." }
  ],
  "wordCount": 0
}

"wordCount" doit être le total réel des mots du champ "text" sur toutes les lignes. Compte avant de répondre.
`;
}

export function countScriptWords(lines: ScriptLine[]): number {
  return lines.reduce((sum, l) => sum + l.text.trim().split(/\s+/).filter(Boolean).length, 0);
}

export const QA_BANNED_PHRASES = [
  "abonnez-vous",
  "likez",
  "achète cette action",
  "achetez cette action",
  "garanti",
  "sans risque",
  "doublez votre capital",
  "révolutionnaire",
];

export function qaCheckScript(script: BabylonScript): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const words = countScriptWords(script.lines);

  if (words < 2_500) reasons.push(`Trop court : ${words} mots (min 2 500).`);
  if (words > 3_400) reasons.push(`Trop long : ${words} mots (max 3 400).`);

  const acts = new Set(script.lines.map((l) => l.act));
  if (!(acts.has(1) && acts.has(2) && acts.has(3))) {
    reasons.push("Structure incomplète : il manque un acte.");
  }

  const fullText = script.lines.map((l) => l.text).join(" ").toLowerCase();
  for (const banned of QA_BANNED_PHRASES) {
    if (fullText.includes(banned.toLowerCase())) {
      reasons.push(`Phrase interdite détectée : "${banned}".`);
    }
  }

  return { ok: reasons.length === 0, reasons };
}
