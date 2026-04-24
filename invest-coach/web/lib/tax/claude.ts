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

// Onboarding profile — fed alongside the avis extraction so Claude
// can tailor recommendations by income regime (salarié vs freelance
// réel vs micro, mixte, retraité…), situation, and goals.
export type TaxOnboarding = {
  profile_type: string;                 // 'salarie' | 'freelance_micro' | 'freelance_reel' | 'mixte' | 'retraite' | 'etudiant' | 'sans_emploi' | 'other'
  income_types: string[];               // ['salaire', 'bnc', 'dividendes', ...]
  situation: string | null;             // 'celibataire' | 'pacse' | 'marie' | 'separe' | 'veuf' | 'divorce'
  nb_enfants: number | null;
  owns_real_estate: boolean | null;
  has_investments: boolean | null;
  has_crypto: boolean | null;
  goals: string[];                      // ['reduce_tax', 'optimize_investments', ...]
  notes: string | null;
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

// Regime-specific levers Claude should consider. Kept here so the
// prompt stays readable and we can tweak one list at a time.
const LEVERS_BY_PROFILE: Record<string, string> = {
  salarie:
    "frais réels vs abattement 10%, titres-restaurant, télétravail forfaitaire, PER individuel (déduction 10% revenus pros), PEA, assurance-vie, prélèvement à la source ajustable, chèques-vacances",
  freelance_micro:
    "versement libératoire IR (si RFR N-2 éligible), bascule vers régime réel si charges > abattement, ACRE, seuils TVA, cotisations CIPAV/URSSAF, PEA/AV",
  freelance_reel:
    "SASU/EURL vs micro/IR direct, rémunération vs dividendes, Madelin/PER TNS (déduction plafond), charges déductibles (local, véhicule, matériel), crédit d'impôt recherche si R&D, SCI pour immobilier pro",
  mixte:
    "arbitrage salaire / activité indé, cumul PER salarié + PER TNS (plafonds séparés), frais réels salarié + charges pro réel, micro vs réel sur le volet indé",
  retraite:
    "abattement 10% pensions (plafonné), PER en phase de retrait (sortie capital vs rente), dons qualifiés, crédit emploi à domicile, SCPI démembrement",
  etudiant:
    "rattachement au foyer parental vs imposition séparée, abattement jobs étudiants (3 SMIC mensuels exonérés), bourses, emploi à domicile parents",
  sans_emploi:
    "vérifier obligations déclaratives, PPA/RSA, rattachement fiscal, ARE imposable",
  other: "leviers génériques",
};

const LEVERS_CROSS = `
Leviers transverses (considérer si applicable) :
- Dons aux associations : réduction 66% (plafond 20% RFR) ou 75% pour organismes d'aide aux personnes.
- Emploi à domicile / garde d'enfants : crédit 50% (plafonds annuels).
- Travaux de rénovation énergétique (MaPrimeRénov', CEE) si propriétaire.
- Déficit foncier (imputable jusqu'à 10 700 € sur revenu global).
- LMNP si location meublée.
- PEA : 0% PV après 5 ans ; plafond 150 000 €.
- Assurance-vie : abattement 4 600 € (9 200 € couple) après 8 ans.
- PER : déduction du revenu imposable (plafond = max(10% revenus pros, 10% PASS)).
- Arbitrage PFU 30% vs barème progressif pour PV mobilières et dividendes — meilleur uniquement si TMI + CSG < 30%.
- Crypto : abattement inapplicable, PFU 30%, déclaration comptes 3916-bis, moins-values imputables sur 10 ans.
- IFI si patrimoine immobilier net > 1,3 M€.
`;

const RECO_PROMPT = (ex: TaxExtraction, ob: TaxOnboarding | null) => {
  const profileBlock = ob
    ? `PROFIL DU CONTRIBUABLE (déclaratif) :
- Type de profil : ${ob.profile_type}
- Types de revenus : ${ob.income_types.length ? ob.income_types.join(", ") : "non précisé"}
- Situation : ${ob.situation ?? "non précisée"}
- Enfants à charge : ${ob.nb_enfants ?? 0}
- Propriétaire immobilier : ${ob.owns_real_estate ? "oui" : "non"}
- Placements financiers : ${ob.has_investments ? "oui" : "non"}
- Crypto : ${ob.has_crypto ? "oui" : "non"}
- Objectifs : ${ob.goals.length ? ob.goals.join(", ") : "non précisés"}
${ob.notes ? `- Notes : ${ob.notes}` : ""}`
    : "PROFIL DU CONTRIBUABLE : non renseigné — recommandations génériques.";

  const leversProfile = ob
    ? `LEVIERS SPÉCIFIQUES AU PROFIL ${ob.profile_type} :
${LEVERS_BY_PROFILE[ob.profile_type] ?? LEVERS_BY_PROFILE.other}`
    : "";

  return `Un contribuable français a ce profil fiscal :

DONNÉES DE L'AVIS D'IMPOSITION :
- Année des revenus : ${ex.tax_year}
- Revenu imposable : ${ex.revenu_imposable ?? "inconnu"} €
- RFR : ${ex.rfr ?? "inconnu"} €
- Parts fiscales : ${ex.parts ?? "inconnu"}
- Impôt sur le revenu : ${ex.impot_revenu ?? "inconnu"} €
- TMI : ${ex.tmi ?? "inconnue"} %
- Situation : ${ex.situation ?? "inconnue"}
- Enfants à charge : ${ex.nb_enfants ?? 0}

${profileBlock}

${leversProfile}
${LEVERS_CROSS}

CONSIGNE :
Retourne JSON uniquement — 3 à 5 recommandations concrètes, personnalisées,
triées par impact euro attendu pour CE profil. Ignore les leviers non
applicables (ex : pas de PER si TMI=0, pas de SCI si pas propriétaire, pas
de versement libératoire si profil salarié). Pour chaque recommandation :
- title en français, court et parlant
- impact_eur = estimation annuelle de l'économie (null si non chiffrable)
- why = une phrase expliquant pourquoi ça s'applique à CE profil précis
- actions = 2-4 étapes concrètes et actionnables ("Ouvrir un PER sur Linxea avant le 31 décembre", pas "pensez au PER")

Schéma :
{"recommendations":[
  {"title":"...","impact_eur":1200,"why":"...","actions":["..."]}
]}`;
};

export async function recommend(
  ex: TaxExtraction,
  ob: TaxOnboarding | null = null,
): Promise<Recommendation[]> {
  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 2500,
    messages: [
      { role: "user", content: RECO_PROMPT(ex, ob) },
      { role: "assistant", content: "{" },
    ],
  });
  const block = msg.content.find((b) => b.type === "text");
  const raw = "{" + (block && "text" in block ? block.text : "");
  const parsed = JSON.parse(raw) as { recommendations: Recommendation[] };
  return parsed.recommendations ?? [];
}
