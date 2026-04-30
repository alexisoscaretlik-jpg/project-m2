// Money-coaching podcast script prompt.
//
// Format: ~18-min natural conversation between TWO French voices (Coach +
// Investisseur). The Coach carries 80 % of the speaking time, tells the
// stories, teaches by question. The Investisseur is a 38-yo CDI salarié,
// reacts with HIS OWN life, asks the real questions a French saver has
// about PEA / AV / PER / Livret A / LMNP / SCPI / TMI.
//
// The conceptual scaffold is the seven money laws drawn from a 1926 finance
// classic — but neither the book name, its author, nor any of its
// characters (Arkad, Algamish, Bansir…) may appear in the audio. The book
// is the Coach's mental map; the listener never sees it.
//
// The episode ends on a HOOK for the next month, not a CTA, so the
// listener finishes thinking "I want the next one" — that's what converts
// to a paid subscription.
//
// History note: an earlier version of this file was a 3-act narrator-led
// format with explicit book quotes. It was replaced after listening tests
// showed the explicit-citation style felt staged and the narrator role was
// redundant. Do not re-introduce a "Narrateur" speaker.

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
  speaker: "Coach" | "Investisseur";
  text: string;
};

// Themes are the top-level shelves on the public site. "money" is the
// only one shipped today; future themes (career, health, taxes…) get
// their own slug and their own /[theme] page.
export type EpisodeTheme = "money";

export type BabylonScript = {
  title: string;
  summary: string;
  law: BabylonianLaw;
  theme: EpisodeTheme;
  character: BabylonBrief["character"];
  source: { url: string; creator: string };
  lines: ScriptLine[];
  wordCount: number;
};

export function buildBabylonPrompt(brief: BabylonBrief): string {
  const parts = buildBabylonPromptParts(brief);
  return parts.stableFramework + "\n\n" + parts.episodeBrief;
}

// Same prompt, split into a stable framework and a per-episode brief so the
// caller can attach Anthropic prompt-cache control to the framework block.
//
// Caching math (sanity check, not a sales pitch):
// - Stable framework  ≈ 1500 tokens
// - Episode brief     ≈   500 tokens
// - Output            ≈ 5000 tokens
// At Sonnet 4.6 prices, prompt caching saves ~$0.004 / episode. At Opus 4.7
// prices, ~$0.02 / episode. The real win is during iteration (multiple calls
// within the 5-min ephemeral cache TTL while tuning a single episode), not
// the weekly production cadence. Ship the structural separation anyway —
// it costs ~nothing and pays off when (a) we iterate, (b) volume grows,
// (c) we add other call sites that share the framework.
export function buildBabylonPromptParts(brief: BabylonBrief): {
  stableFramework: string;
  episodeBrief: string;
} {
  return {
    stableFramework: STABLE_FRAMEWORK,
    episodeBrief: buildEpisodeBrief(brief),
  };
}

// ───────────────────────── Stable framework ─────────────────────────
// No template interpolation here on purpose. Anything that varies per
// episode lives in `buildEpisodeBrief` below. If you find yourself adding
// a `${...}` to this string, stop — you're breaking caching.
const STABLE_FRAMEWORK = `Tu écris un épisode de podcast français de 18 minutes pour Invest Coach.

# Format
Conversation naturelle entre DEUX voix uniquement : Coach et Investisseur.
- Pas de narrateur.
- Pas d'actes annoncés, pas de "dans cet épisode on va voir".
- On entre direct, comme une vraie discussion enregistrée.

# Répartition de la parole (impérative)
- Coach : ~80 % du nombre total de mots.
- Investisseur : ~20 % du nombre total de mots.
Vérifie le ratio avant de répondre.

# Coach — qui il est et comment il parle
Il porte l'épisode. Il raconte les histoires (parables, exemples concrets, anecdotes), explique les principes, pose des questions pour faire réfléchir, ramène toujours la leçon vers une action concrète.

Style : phrases courtes, posées, beaucoup de pauses respirées. Tutoiement total. Calme, patient, jamais condescendant. Il enseigne par questions plutôt que par affirmations sèches.

Il utilise un personnage fictif pour illustrer la leçon — voir le BRIEF DE L'ÉPISODE ci-dessous pour son prénom, son âge, sa ville et sa situation. Il raconte SA réalité, SES choix, SES erreurs, comme on parlerait d'un voisin ou d'un collègue.

# Investisseur — qui il est et comment il parle
38 ans, salarié français ordinaire (CDI à Lille, loyer 850 €, fille en CP, RIB qui clignote rouge le 22 du mois). Il représente l'auditeur cible : un Français moyen avec un PEA à moitié rempli, une assurance-vie qu'il regarde rarement, et qui hésite sur le PER.

Il réagit par SA PROPRE VIE — son métier, sa famille, ses doutes, des exemples du quotidien. Il ne raconte pas de parables ; il pose les questions concrètes ou rebondit avec son vécu.

Ses questions sont celles que se pose un vrai Français devant ses placements :
- PEA : "Le plafond à 150 000 €, atteignable pour moi ?", "ETF World ou CW8 ?", "Si je clôture avant 5 ans, je perds quoi ?"
- Assurance-vie : "L'abattement à 4 600 €, par an ou cumulé ?", "Fonds euros ou UC à 38 ans ?", "Si je meurs, ma fille touche combien après les 152 500 € ?"
- PER : "Sortie en rente ou en capital ?", "TMI 30 %, je gagne combien à la sortie ?", "Si je change d'avis, je peux le débloquer ?"
- Livret A / LEP : "22 950 €, je le garde ou je bascule sur PEA ?"
- Immobilier : "LMNP ou SCPI à 38 ans ?", "Acheter à Lille ou rester locataire ?"
- Fiscalité : "TMI, IR, prélèvements sociaux 17,2 % — résume-moi en une phrase ?"

Tonalité : il dit "ouais", "attends, attends", il rit parfois, il doute. Il ne se laisse pas avoir par le jargon.

# Cadre conceptuel (interne, jamais nommé à voix haute)
La leçon précise de cet épisode est définie dans le BRIEF DE L'ÉPISODE ci-dessous.

Cette leçon vient d'un cadre de sept lois de l'argent, mais le cadre reste invisible. Le Coach enseigne le principe sans jamais le sourcer.

# INTERDITS ABSOLUS
Aucune des chaînes suivantes ne doit apparaître dans le script :
- "Babylone", "Babylon", "babylonien", "babylonienne"
- "L'homme le plus riche", "Richest Man"
- "Arkad", "Algamish", "Bansir", "Kobbi", "Clason"
- "comme dans le livre", "le livre dit", "la sagesse babylonienne"
- "comme dans la vidéo de…", "selon Alux"
- "abonnez-vous", "likez", "partagez"
- "garanti", "sans risque", "doublez votre capital", "révolutionnaire"

Si l'une de ces phrases apparaît, le script est rejeté.

# Crochet final pour le mois suivant (PAS un CTA)
L'épisode finit par un crochet d'attente — pas par une demande d'abonnement.
- Coach : "Le mois prochain, on parle de [thème suivant]. Et tu vas comprendre pourquoi cette action de cette semaine, c'est seulement la première marche."
- Investisseur : "Ah ouais. Là, j'attends de voir."

L'auditeur doit finir l'épisode avec UNE seule pensée : "Je veux entendre le suivant." C'est ça qui convertit en abonnement payant.

# Forme
- 100 % français, tutoiement.
- Pas d'emojis (la TTS les lit littéralement).
- Pas d'em-dashes "—" dans le texte parlé (utilise "·" ou coupe la phrase).
- Émotions parlées autorisées en début de réplique : "Hum.", "Bon.", "D'accord.", "Attends…".
- Variations de longueur : alterne phrases courtes (5-8 mots) et longues (20-25 mots) pour que le rythme parlé respire.

# Sortie JSON
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans préambule. Schéma :

{
  "title": "Titre de l'épisode (max 70 caractères)",
  "summary": "Deux phrases : ce que l'épisode enseigne et pour qui.",
  "law": "<recopie la valeur 'law' du brief ci-dessous>",
  "character": <recopie l'objet 'character' du brief ci-dessous>,
  "source": <recopie l'objet 'source' du brief ci-dessous>,
  "lines": [
    { "speaker": "Coach", "text": "..." },
    { "speaker": "Investisseur", "text": "..." }
  ],
  "wordCount": 0
}

"wordCount" doit être le total réel des mots du champ "text" sur toutes les lignes. Compte avant de répondre.

Le ratio Coach/Investisseur doit être proche de 80/20 en mots. Vérifie avant de répondre.
`;

// ───────────────────────── Episode brief ─────────────────────────
function buildEpisodeBrief(brief: BabylonBrief): string {
  const lawFr = LAW_FR[brief.law];
  const c = brief.character;

  return `# BRIEF DE L'ÉPISODE

## Personnage de l'histoire (cité par le Coach, jamais par l'Investisseur)
- Prénom : ${c.name}
- Âge : ${c.age}
- Ville : ${c.city}
- Situation : ${c.situation}

## Loi de l'argent enseignée
${lawFr}

## Vidéo source (matière première — jamais citée à l'audio)
- URL : ${brief.sourceUrl}
- Créateur : ${brief.sourceCreator}
- Insights extraits :
${brief.keyInsightBullets.map((b) => `- ${b}`).join("\n")}

Utilise ces idées pour nourrir les exemples du Coach. Ne mentionne jamais la vidéo source ni son créateur dans le script.

## Action concrète (vers la fin de l'épisode)
${brief.targetAction}

Le Coach énonce cette action en 2-3 phrases : précise, datée, mesurable. L'Investisseur la reformule dans ses propres mots pour confirmer qu'il a compris.

## Valeurs JSON exactes à utiliser dans la sortie
- "law" → "${brief.law}"
- "character" → ${JSON.stringify(brief.character)}
- "source" → { "url": "${brief.sourceUrl}", "creator": "${brief.sourceCreator}" }
`;
}

export function countScriptWords(lines: ScriptLine[]): number {
  return lines.reduce((sum, l) => sum + l.text.trim().split(/\s+/).filter(Boolean).length, 0);
}

export const QA_BANNED_PHRASES = [
  // Marketing CTAs
  "abonnez-vous",
  "likez",
  "partagez",
  // Trading-pump language
  "achète cette action",
  "achetez cette action",
  "garanti",
  "sans risque",
  "doublez votre capital",
  "révolutionnaire",
  // Source-book leak
  "babylone",
  "babylon",
  "babylonien",
  "richest man",
  "arkad",
  "algamish",
  "bansir",
  "clason",
  // Source-video leak
  "alux",
  "comme dans la vidéo",
];

export function qaCheckScript(script: BabylonScript): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const words = countScriptWords(script.lines);

  if (words < 2_000) reasons.push(`Trop court : ${words} mots (min 2 000).`);
  if (words > 3_600) reasons.push(`Trop long : ${words} mots (max 3 600).`);

  // Speakers — must be exactly Coach + Investisseur
  const speakers = new Set(script.lines.map((l) => l.speaker));
  if (!speakers.has("Coach") || !speakers.has("Investisseur")) {
    reasons.push("Il manque un des deux locuteurs (Coach et Investisseur attendus).");
  }
  if (speakers.size > 2) {
    reasons.push(`Trop de locuteurs : ${[...speakers].join(", ")} (Coach + Investisseur seulement).`);
  }

  // Speaking ratio — Coach should carry ~80 %, accept 70-90 % band
  const coachWords = script.lines
    .filter((l) => l.speaker === "Coach")
    .reduce((sum, l) => sum + l.text.trim().split(/\s+/).filter(Boolean).length, 0);
  const ratio = coachWords / Math.max(words, 1);
  if (ratio < 0.7) reasons.push(`Coach trop discret : ${Math.round(ratio * 100)} % des mots (cible 80 %).`);
  if (ratio > 0.9) reasons.push(`Investisseur effacé : Coach a ${Math.round(ratio * 100)} % des mots (cible 80 %).`);

  // Banned phrases — case-insensitive substring check
  const fullText = script.lines.map((l) => l.text).join(" ").toLowerCase();
  for (const banned of QA_BANNED_PHRASES) {
    if (fullText.includes(banned.toLowerCase())) {
      reasons.push(`Phrase interdite détectée : "${banned}".`);
    }
  }

  return { ok: reasons.length === 0, reasons };
}
