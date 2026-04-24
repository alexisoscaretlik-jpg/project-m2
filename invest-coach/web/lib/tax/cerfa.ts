import Anthropic from "@anthropic-ai/sdk";

import type { TaxExtraction, TaxOnboarding } from "./claude";

// Cerfa 2042 box mapper.
//
// Takes the full user situation (onboarding + avis extraction + any
// wizard answers), returns a {boxCode: value} map that matches the
// official Cerfa 2042 PDF form fields. The PDF generator
// (lib/tax/pdf.ts) consumes this map to fill the downloadable form.
//
// We constrain Claude to output ONLY codes from SUPPORTED_BOXES so
// the model can't invent fictional box numbers. Any value Claude
// emits for a code not on the list is dropped server-side.

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  _client = new Anthropic({ apiKey: key });
  return _client;
}
const MODEL = "claude-haiku-4-5";

// The Cerfa 2042 boxes we currently support.
// Each entry: the box code → human-readable description in French
// (also injected into the prompt so Claude knows what each box means).
//
// Not exhaustive. Starts with what covers ~90% of salarié + mixte
// profiles. Extend as we add freelance réel / LMNP / international
// scenarios. If Claude returns a code not in this map, we ignore it.
export const SUPPORTED_BOXES: Record<string, string> = {
  // --- Situation & parts ---
  M: "Situation : marié(e)",
  O: "Situation : pacsé(e)",
  D: "Situation : divorcé(e) / séparé(e)",
  C: "Situation : célibataire",
  V: "Situation : veuf / veuve",
  F: "Nombre d'enfants à charge (mineurs ou étudiants)",

  // --- 1. Traitements, salaires, pensions ---
  "1AJ": "Salaires nets déclarant 1 (après abattement 10% par défaut)",
  "1BJ": "Salaires nets déclarant 2",
  "1AP": "Pensions de retraite déclarant 1",
  "1BP": "Pensions de retraite déclarant 2",
  "1AS": "Pensions alimentaires perçues déclarant 1",
  "1BS": "Pensions alimentaires perçues déclarant 2",
  "1GA": "Indemnités chômage, maladie, maternité (imposables) déclarant 1",
  "1GB": "Indemnités chômage, maladie, maternité déclarant 2",
  "1AK": "Frais réels déclarant 1 (si on renonce à l'abattement 10%)",
  "1BK": "Frais réels déclarant 2",

  // --- 2. Revenus de capitaux mobiliers ---
  "2DC": "Dividendes éligibles à l'abattement 40% (régime barème si coché 2OP)",
  "2CA": "Prélèvements déjà acquittés (PFU 12,8% retenus à la source)",
  "2CG": "Revenus soumis au PFU 12,8% non déjà prélevés",
  "2TR": "Intérêts et produits de placement à revenu fixe",
  "2BH": "Revenus éligibles à l'abattement (compte courant associé, etc.)",
  "2OP": "CASE À COCHER : option pour le barème progressif (au lieu du PFU)",

  // --- 3. Plus-values mobilières et crypto ---
  "3VG": "Plus-values nettes sur valeurs mobilières (après abattements)",
  "3VH": "Moins-values nettes à reporter sur les 10 années suivantes",
  "3VZ": "Plus-values de cession d'actifs numériques (crypto)",
  "3BN": "Moins-values crypto reportables (10 ans)",

  // --- 4. Revenus fonciers ---
  "4BE": "Revenus fonciers — régime micro-foncier (abattement 30%, si <= 15 000 €)",
  "4BA": "Revenus fonciers nets — régime réel",
  "4BB": "Déficit foncier imputable sur le revenu global (plafond 10 700 €)",
  "4BC": "Déficit foncier restant à reporter",
  "4BD": "Déficits fonciers antérieurs non encore imputés",

  // --- 5. BNC / BIC ---
  "5HQ": "Revenus BNC — régime déclaratif spécial (micro-BNC, abattement 34%)",
  "5HP": "Revenus BNC — régime de la déclaration contrôlée (réel)",
  "5KU": "Revenus BIC micro — prestations de services (abattement 50%)",
  "5KN": "Revenus BIC micro — ventes de marchandises (abattement 71%)",
  "5TA": "Recettes auto-entrepreneur ayant opté pour le versement libératoire",

  // --- 6. Charges déductibles du revenu global ---
  "6DD": "Pensions alimentaires versées (déductibles)",
  "6RS": "Cotisations PER individuel versées par déclarant 1",
  "6RT": "Cotisations PER individuel versées par déclarant 2",
  "6NS": "Plafond PER non utilisé des 3 dernières années, déclarant 1",
  "6NT": "Plafond PER non utilisé des 3 dernières années, déclarant 2",
  "6EL": "Déficits globaux des années antérieures",

  // --- 7. Réductions & crédits d'impôt ---
  "7UD": "Dons aux œuvres et organismes d'intérêt général (réduction 66%, plafond 20% RFR)",
  "7UF": "Dons aux organismes d'aide aux personnes en difficulté (réduction 75%, plafond 1 000 €)",
  "7DB": "Emploi d'un salarié à domicile (crédit d'impôt 50%, plafond variable)",
  "7GA": "Frais de garde des enfants de moins de 6 ans (crédit 50%, plafond 3 500 €/enfant)",
  "7EA": "Enfants scolarisés au collège (61 €/enfant)",
  "7EC": "Enfants scolarisés au lycée (153 €/enfant)",
  "7EF": "Enfants scolarisés dans le supérieur (183 €/enfant)",
  "7UH": "Investissement Pinel (réduction étalée)",
  "7UG": "Investissement Girardin industriel (réduction > investissement)",
  "7UY": "Investissement forestier (réduction)",

  // --- 8. Retenues, prélèvements, crédits d'impôt ---
  "8SH": "CSG déductible payée sur revenus du patrimoine",
  "8TK": "Crédit d'impôt étranger (revenus de source étrangère déjà imposés)",
  "8UY": "Prélèvement à la source déjà acquitté",
};

export type CerfaMapping = Record<string, number | boolean | null>;

/**
 * Build the prompt that lists every supported box + the user profile,
 * and asks Claude to emit a pure JSON mapping.
 */
function buildPrompt(
  ex: TaxExtraction | null,
  ob: TaxOnboarding | null,
  extra: Record<string, unknown> | null,
): string {
  const boxList = Object.entries(SUPPORTED_BOXES)
    .map(([code, desc]) => `- ${code} : ${desc}`)
    .join("\n");

  const avisBlock = ex
    ? `AVIS D'IMPOSITION (année précédente, à titre de référence) :
- Année fiscale : ${ex.tax_year}
- RFR : ${ex.rfr ?? "inconnu"} €
- Revenu imposable : ${ex.revenu_imposable ?? "inconnu"} €
- Parts fiscales : ${ex.parts ?? "inconnu"}
- Impôt sur le revenu : ${ex.impot_revenu ?? "inconnu"} €
- TMI : ${ex.tmi ?? "inconnu"} %
- Situation : ${ex.situation ?? "inconnue"}
- Enfants à charge : ${ex.nb_enfants ?? 0}`
    : "AVIS D'IMPOSITION : non fourni (Claude devra se baser uniquement sur les réponses déclaratives).";

  const onboardingBlock = ob
    ? `PROFIL DÉCLARATIF :
- Type de profil : ${ob.profile_type}
- Types de revenus : ${(ob.income_types ?? []).join(", ") || "non précisé"}
- Situation : ${ob.situation ?? "non précisée"}
- Enfants : ${ob.nb_enfants ?? 0}
- Propriétaire : ${ob.owns_real_estate ? "oui" : "non"}
- Placements : ${ob.has_investments ? "oui" : "non"}
- Crypto : ${ob.has_crypto ? "oui" : "non"}
- Objectifs : ${(ob.goals ?? []).join(", ") || "non précisés"}
${ob.notes ? `- Notes : ${ob.notes}` : ""}`
    : "PROFIL DÉCLARATIF : non fourni.";

  const extraBlock =
    extra && Object.keys(extra).length > 0
      ? `RÉPONSES DÉTAILLÉES DU QUESTIONNAIRE (Typeform) :
${JSON.stringify(extra, null, 2)}`
      : "RÉPONSES DÉTAILLÉES : aucune (le questionnaire n'a pas encore été rempli).";

  return `Tu es un assistant fiscal français. Ton rôle : traduire les
données d'un contribuable en un remplissage brut du formulaire
officiel Cerfa 2042.

Retourne du JSON uniquement. Pas de prose, pas de commentaires.

Cases autorisées (utilise UNIQUEMENT ces codes ; toute case absente
de la liste sera ignorée) :

${boxList}

Règles strictes :
- Les cases "M / O / D / C / V" et "F" sont des booléens (true si
  applicable, sinon absentes).
- "2OP" est un booléen (true = coche le barème progressif).
- Toutes les autres cases sont des montants en euros (entiers).
- Si un montant n'est pas déterminable, OMETTRE la case plutôt que
  d'inventer.
- Si le profil est micro-BNC, utiliser 5HQ (pas 5HP). Si micro-BIC
  services, 5KU. Si micro-BIC ventes, 5KN.
- Si le profil a coché "placements" et déclaré des dividendes :
  cocher 2OP uniquement si TMI + CSG (17,2%) < 30% (sinon laisser
  le PFU par défaut).
- Pour les dons, 7UD et 7UF sont exclusifs (aide aux personnes en
  priorité si applicable).
- PER : utiliser 6RS pour le déclarant 1, 6RT pour le 2 ; ne pas
  inventer de montant si non fourni.

Données du contribuable :

${avisBlock}

${onboardingBlock}

${extraBlock}

Retourne ce schéma :
{
  "boxes": {
    "1AJ": 42000,
    "2DC": 800,
    "6RS": 4000,
    "M": true,
    ...
  },
  "assumptions": [
    "Une courte liste (max 5) d'hypothèses qu'on a dû faire faute de données précises."
  ]
}`;
}

/**
 * Ask Claude to produce a Cerfa 2042 filling based on everything we
 * know about the user. Returns a validated mapping (unknown box
 * codes are dropped) plus the list of assumptions Claude made.
 */
export async function mapToCerfa(input: {
  extraction: TaxExtraction | null;
  onboarding: TaxOnboarding | null;
  extra?: Record<string, unknown> | null;
}): Promise<{ mapping: CerfaMapping; assumptions: string[] }> {
  const prompt = buildPrompt(input.extraction, input.onboarding, input.extra ?? null);

  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 3000,
    messages: [
      { role: "user", content: prompt },
      { role: "assistant", content: "{" },
    ],
  });

  const block = msg.content.find((b) => b.type === "text");
  const raw = "{" + (block && "text" in block ? block.text : "");

  let parsed: { boxes?: Record<string, unknown>; assumptions?: string[] };
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `Claude returned invalid JSON for Cerfa mapping: ${(e as Error).message}`,
    );
  }

  // Server-side validation: drop anything Claude invented.
  const mapping: CerfaMapping = {};
  for (const [code, value] of Object.entries(parsed.boxes ?? {})) {
    if (!(code in SUPPORTED_BOXES)) continue;
    if (typeof value === "number" || typeof value === "boolean" || value === null) {
      mapping[code] = value as number | boolean | null;
    }
  }

  const assumptions = Array.isArray(parsed.assumptions)
    ? parsed.assumptions.filter((a): a is string => typeof a === "string").slice(0, 8)
    : [];

  return { mapping, assumptions };
}
