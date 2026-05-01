// Real, currently-distributed French tax-advantaged investment
// products. One entry per OFFERING (a specific product from a
// specific distributor for a specific year/millésime), not per
// distributor or per category.
//
// This is a curated catalog — not an exhaustive list. We only
// surface offerings we'd be comfortable pointing a French saver
// toward. Update each year as new millésimes open.
//
// `url` carries `?utm_source=invest-coach&utm_medium=produits` so
// distributor analytics see the referral. When we sign formal
// parrainage / apporteur d'affaires contracts, we replace the UTM
// here with the real referral code.

export type ProductCategory =
  | "girardin"
  | "fip-fcpi"
  | "gff"
  | "scpi-fiscale"
  | "lmnp"
  | "per"
  | "av";

export type ProductStatus = "open" | "closing-soon" | "closed";

export type Product = {
  id: string;
  category: ProductCategory;
  name: string;          // commercial product name
  millesime: string;     // year tag, e.g. "2026" or "2026/2027"
  distributor: string;   // company offering it
  url: string;           // product detail page on distributor site
  pitch: string;         // 1 sentence in plain French
  taxCredit: string;     // headline tax-credit, formatted
  ticket: string;        // min ticket / range, e.g. "10 000 € – 60 000 €"
  lockup: string;        // lock-up duration
  risk: string;          // risk level + main mitigation
  closing: string;       // human-readable closing window
  status: ProductStatus;
};

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  girardin: "Girardin Industriel",
  "fip-fcpi": "FIP / FCPI",
  gff: "GFF · Forêts",
  "scpi-fiscale": "SCPI fiscale",
  lmnp: "LMNP clé-en-main",
  per: "PER",
  av: "Assurance-vie",
};

export const CATEGORY_DESC: Record<ProductCategory, string> = {
  girardin:
    "Réduction d'IR one-shot supérieure au montant versé, contre 5 ans de financement d'une PME industrielle Outre-mer.",
  "fip-fcpi":
    "25 % de réduction d'IR à l'achat sur l'investissement dans un fonds qui finance des PME (FIP) ou des PME innovantes (FCPI).",
  gff:
    "18 % de réduction d'IR · IFI partiellement exonéré · 75 % d'abattement sur droits de succession. Tu deviens copropriétaire d'une forêt française gérée.",
  "scpi-fiscale":
    "Réduction d'IR (Pinel, Malraux) ou imputation déficit foncier sur revenu global, via investissement immobilier locatif géré.",
  lmnp:
    "Amortissement comptable du bien meublé loué qui efface fiscalement la quasi-totalité des loyers pendant 15-20 ans.",
  per:
    "Versement déductible du revenu imposable jusqu'à 10 % du revenu — la part rendue par l'État correspond à ta TMI.",
  av:
    "Après 8 ans, abattement annuel de 4 600 € (couple : 9 200 €) sur les gains. L'enveloppe la plus utilisée en France.",
};

const utm = (base: string) =>
  base + (base.includes("?") ? "&" : "?") + "utm_source=invest-coach&utm_medium=produits";

export const PRODUCTS: Product[] = [
  // ─────────── Girardin Industriel ───────────
  {
    id: "girardin-g3f-2026",
    category: "girardin",
    name: "Girardin Industriel G3F",
    millesime: "2026 / 2027",
    distributor: "Inter Invest",
    url: utm("https://www.inter-invest.fr/loi-girardin/girardin-industriel"),
    pitch:
      "Financement d'équipements industriels loués à des PME en Outre-mer, garantie G3F couvrant le risque fiscal.",
    taxCredit: "Réduction d'IR jusqu'à 52 941 € · gain net visé 12-14 %",
    ticket: "10 000 € – 60 000 €",
    lockup: "5 ans (one-shot, pas de récupération de capital)",
    risk: "Modéré · garantie financière et fiscale (G3F)",
    closing: "Souscriptions toute l'année (clôture annuelle 31 déc)",
    status: "open",
  },
  {
    id: "girardin-ecofip-2026",
    category: "girardin",
    name: "Girardin Industriel & Logement Social",
    millesime: "2026",
    distributor: "Ecofip",
    url: utm("https://www.ecofip.com/"),
    pitch:
      "Spécialiste Outre-mer historique. Mix Industriel et Logement Social en Polynésie / Antilles / Réunion.",
    taxCredit: "Réduction d'IR plein droit ou agrément",
    ticket: "5 000 € – 60 000 €",
    lockup: "5 ans",
    risk: "Modéré · couverture assurantielle des risques industriels",
    closing: "Toute l'année (clôture annuelle 31 déc)",
    status: "open",
  },

  // ─────────── FIP / FCPI ───────────
  {
    id: "fip-ultramarin-haussmann-2026",
    category: "fip-fcpi",
    name: "FIP Outre-mer (Ultramarin)",
    millesime: "2026",
    distributor: "Haussmann Patrimoine",
    url: utm("https://www.haussmann-patrimoine.fr/fip-ultramarin/"),
    pitch:
      "FIP investissant dans des PME ultramarines (DROM). Niche fiscale : 30 % de réduction d'IR sur le versement.",
    taxCredit: "30 % d'IR sur le versement (vs 25 % pour FIP métropole)",
    ticket: "5 000 € – 24 000 € (couple : 48 000 €)",
    lockup: "8 ans",
    risk: "Élevé · perte en capital possible, illiquidité",
    closing: "Annuel · à valider auprès du distributeur",
    status: "open",
  },
  {
    id: "fcpi-truffle-2026",
    category: "fip-fcpi",
    name: "FCPI Truffle Innovation France",
    millesime: "2026",
    distributor: "Truffle Capital",
    url: utm("https://www.truffle.com/"),
    pitch:
      "Fonds tech français, gérant historique (20+ ans), focus innovation et deep-tech.",
    taxCredit: "25 % d'IR sur le versement",
    ticket: "1 000 € – 12 000 € (couple : 24 000 €)",
    lockup: "8 à 10 ans",
    risk: "Élevé · perte en capital possible",
    closing: "Annuel (millésime jusqu'à fin décembre)",
    status: "open",
  },
  {
    id: "fip-123im-2026",
    category: "fip-fcpi",
    name: "FIP 123 Régions",
    millesime: "2026",
    distributor: "123 IM",
    url: utm("https://www.123-im.com/"),
    pitch:
      "FIP régional (Île-de-France, AURA, PACA…), focus PME industrielles et de service.",
    taxCredit: "25 % d'IR sur le versement",
    ticket: "1 000 € – 12 000 €",
    lockup: "6 à 8 ans",
    risk: "Élevé · perte en capital possible",
    closing: "Annuel",
    status: "open",
  },

  // ─────────── GFF · Forêts ───────────
  {
    id: "gff-france-valley-2026",
    category: "gff",
    name: "France Valley Patrimoine Forestier",
    millesime: "2026",
    distributor: "France Valley",
    url: utm("https://www.france-valley.com/groupements-forestiers/"),
    pitch:
      "Leader incontesté du GFF français (~50 % du marché). Forêts diversifiées sur l'ensemble du territoire métropolitain.",
    taxCredit: "18 % d'IR + IFI partiellement exonéré + 75 % succession",
    ticket: "À partir de 5 000 €",
    lockup: "8 à 10 ans (recommandé)",
    risk: "Faible/modéré · diversification + actif tangible",
    closing: "Souscriptions ouvertes en continu (millésimes annuels)",
    status: "open",
  },
  {
    id: "gff-sogenial-2026",
    category: "gff",
    name: "Sogenial Forêts",
    millesime: "2026",
    distributor: "Sogenial Patrimoine",
    url: utm("https://www.sogenial.fr/groupements-fonciers-forestiers/"),
    pitch:
      "Approche conseil avec accompagnement individualisé. Forêts + bois + vignobles GFV.",
    taxCredit: "18 % d'IR · IFI · succession",
    ticket: "À partir de 10 000 €",
    lockup: "8 ans",
    risk: "Faible/modéré",
    closing: "Toute l'année",
    status: "open",
  },

  // ─────────── SCPI fiscales ───────────
  {
    id: "scpi-pinel-louve-2026",
    category: "scpi-fiscale",
    name: "Sélection SCPI Pinel & Malraux",
    millesime: "2026",
    distributor: "Louve Invest",
    url: utm("https://www.louveinvest.com/"),
    pitch:
      "Plateforme 100 % en ligne. 50+ SCPI référencées, frais d'entrée souvent réduits via parrainage.",
    taxCredit: "Pinel : 9-14 % d'IR · Malraux : 22-30 % · Déficit foncier : imputation revenu",
    ticket: "À partir de 200 € (selon SCPI)",
    lockup: "6 à 9 ans (Pinel) · 9 ans (Malraux)",
    risk: "Modéré · risque de marché immobilier",
    closing: "Selon SCPI (millésimes glissants)",
    status: "open",
  },
  {
    id: "scpi-deficit-primaliance-2026",
    category: "scpi-fiscale",
    name: "Sélection SCPI Déficit Foncier",
    millesime: "2026",
    distributor: "Primaliance",
    url: utm("https://www.primaliance.com/"),
    pitch:
      "Conseiller historique, accompagnement humain pour montages déficit foncier complexes.",
    taxCredit: "Imputation jusqu'à 10 700 €/an sur revenu global",
    ticket: "À partir de 2 000 €",
    lockup: "8 à 10 ans",
    risk: "Modéré · travaux en SCPI = risque d'exécution",
    closing: "Selon SCPI",
    status: "open",
  },

  // ─────────── LMNP clé-en-main ───────────
  {
    id: "lmnp-bevouac",
    category: "lmnp",
    name: "Investissement locatif clé-en-main",
    millesime: "2026",
    distributor: "Bevouac",
    url: utm("https://www.bevouac.com/"),
    pitch:
      "Recherche, achat, ameublement, mise en gestion. Tu signes, tu reçois les loyers, tu ne fais rien.",
    taxCredit: "Amortissement LMNP : loyers quasi non imposés sur 15-20 ans",
    ticket: "À partir de 80 000 € (apport ~10 %)",
    lockup: "Recommandé 8-10 ans",
    risk: "Modéré · risque marché immobilier + locataire",
    closing: "Permanent · biens régulièrement renouvelés",
    status: "open",
  },
  {
    id: "lmnp-masteos",
    category: "lmnp",
    name: "Investissement locatif rendement",
    millesime: "2026",
    distributor: "Masteos",
    url: utm("https://www.masteos.com/"),
    pitch:
      "Focus rendements régionaux > 7 % brut. Marketplace de biens vérifiés avec rendements simulés.",
    taxCredit: "LMNP · amortissement",
    ticket: "À partir de 100 000 €",
    lockup: "Recommandé 8-10 ans",
    risk: "Modéré",
    closing: "Permanent",
    status: "open",
  },

  // ─────────── PER ───────────
  {
    id: "per-yomoni-2026",
    category: "per",
    name: "Yomoni PER",
    millesime: "2026",
    distributor: "Yomoni",
    url: utm("https://www.yomoni.fr/per"),
    pitch:
      "PER en gestion pilotée, 10 profils, ETF mondialement diversifiés, frais ~1,6 %/an.",
    taxCredit: "Versement déductible jusqu'à 10 % du revenu (TMI 30 % → 30 % rendus)",
    ticket: "À partir de 1 000 €",
    lockup: "Jusqu'à la retraite (sortie anticipée encadrée)",
    risk: "Modéré · selon profil choisi",
    closing: "Permanent",
    status: "open",
  },
  {
    id: "per-linxea-spirit-2026",
    category: "per",
    name: "Linxea Spirit PER",
    millesime: "2026",
    distributor: "Linxea",
    url: utm("https://www.linxea.com/per/spirit-per/"),
    pitch:
      "L'option discount : 0,5 %/an de frais sur l'enveloppe, large choix d'UC, gestion libre.",
    taxCredit: "Versement déductible jusqu'à 10 % du revenu",
    ticket: "À partir de 500 €",
    lockup: "Jusqu'à la retraite",
    risk: "Selon UC choisies",
    closing: "Permanent",
    status: "open",
  },

  // ─────────── Assurance-vie ───────────
  {
    id: "av-linxea-spirit-2-2026",
    category: "av",
    name: "Linxea Spirit 2",
    millesime: "2026",
    distributor: "Linxea",
    url: utm("https://www.linxea.com/assurance-vie/linxea-spirit-2/"),
    pitch:
      "Frais sur versement 0 %, 0,5 %/an d'enveloppe, plus de 700 UC. La référence discount.",
    taxCredit: "Après 8 ans : abattement 4 600 € (couple : 9 200 €) sur gains",
    ticket: "À partir de 500 €",
    lockup: "Recommandé 8 ans",
    risk: "Selon UC choisies",
    closing: "Permanent",
    status: "open",
  },
];
