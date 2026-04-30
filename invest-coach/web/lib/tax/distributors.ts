// Curated French distributors of tax-advantaged investment products.
// One block per tax lever. Each entry is a real distributor we'd
// actually point a French saver toward — no obscure brokers, no
// pump-and-dump platforms.
//
// `url` carries a `?utm_source=invest-coach` query so distributor
// analytics dashboards see the referral, even before we sign formal
// affiliate / parrainage contracts. When we sign, replace with the
// actual referral code (e.g. `?ref=YOMONI-ABC123` or
// `?parrainage=...`).
//
// `pitch` is one accessible French sentence — no jargon dump.
// `tier` is "leader" (clear market leader), "challenger" (solid
// alternative), or "niche" (covers a specific edge case).

export type DistributorTier = "leader" | "challenger" | "niche";

export type Distributor = {
  name: string;
  url: string;
  pitch: string;
  tier: DistributorTier;
};

export type DistributorCategory = {
  slug: string;
  label: string;
  taxCredit: string; // headline tax benefit, e.g. "10% du revenu déductible"
  description: string;
  distributors: Distributor[];
};

const utm = (base: string, source = "tax-levers") =>
  base + (base.includes("?") ? "&" : "?") + `utm_source=invest-coach&utm_medium=${source}`;

export const DISTRIBUTOR_CATEGORIES: DistributorCategory[] = [
  {
    slug: "per",
    label: "PER · Plan d'épargne retraite",
    taxCredit: "Jusqu'à 10 % du revenu imposable, déductible",
    description:
      "Tu mets de côté pour la retraite, l'État te rembourse la part qui correspond à ta TMI sur le versement (30 % te font 30 % d'économie). Sortie en capital ou rente, libre.",
    distributors: [
      {
        name: "Yomoni",
        url: utm("https://www.yomoni.fr/per"),
        pitch:
          "PER en gestion pilotée, ETF mondialement diversifiés, frais ~1,6 %/an. Le robo-advisor le plus connu en France.",
        tier: "leader",
      },
      {
        name: "Goodvest",
        url: utm("https://www.goodvest.fr/"),
        pitch:
          "PER ESG / climat-aligné, exclu des énergies fossiles. Pour ceux qui veulent un PER cohérent avec leur empreinte.",
        tier: "challenger",
      },
      {
        name: "Nalo",
        url: utm("https://www.nalo.fr/"),
        pitch:
          "PER personnalisé objectif par objectif. Allocation glissante automatique vers la sécurité à l'approche de la retraite.",
        tier: "challenger",
      },
      {
        name: "Linxea Spirit PER",
        url: utm("https://www.linxea.com/per/spirit-per/"),
        pitch:
          "L'option discount : 0,5 %/an de frais sur l'enveloppe, large choix d'UC. Pour les gestionnaires DIY.",
        tier: "leader",
      },
    ],
  },
  {
    slug: "assurance-vie",
    label: "Assurance-vie",
    taxCredit:
      "Après 8 ans : abattement annuel de 4 600 € (couple : 9 200 €) sur les gains",
    description:
      "L'enveloppe la plus utilisée en France. Fiscalité avantageuse, transmission hors succession (152 500 € par bénéficiaire), liquidité libre.",
    distributors: [
      {
        name: "Linxea Spirit 2",
        url: utm("https://www.linxea.com/assurance-vie/linxea-spirit-2/"),
        pitch:
          "Frais sur versement 0 %, 0,5 %/an d'enveloppe, plus de 700 UC. La référence discount.",
        tier: "leader",
      },
      {
        name: "Yomoni Vie",
        url: utm("https://www.yomoni.fr/assurance-vie"),
        pitch:
          "Assurance-vie en gestion pilotée. Tu choisis un profil, ils gèrent.",
        tier: "leader",
      },
      {
        name: "Goodvest",
        url: utm("https://www.goodvest.fr/"),
        pitch:
          "AV ESG climat-aligné, transparence totale sur les fonds.",
        tier: "challenger",
      },
      {
        name: "Boursorama Vie",
        url: utm("https://www.boursorama.com/banque-en-ligne/assurance-vie/"),
        pitch:
          "Si tu es déjà chez BoursoBank, AV intégrée à ton espace, frais bas.",
        tier: "challenger",
      },
    ],
  },
  {
    slug: "pea",
    label: "PEA · Plan d'épargne en actions",
    taxCredit: "Après 5 ans : exonération d'IR (17,2 % de PS seulement)",
    description:
      "Plafond 150 000 €. Tu y loges des actions européennes (et certains ETF mondiaux UCITS). Après 5 ans, plus que les prélèvements sociaux à payer sur les gains.",
    distributors: [
      {
        name: "BoursoBank",
        url: utm("https://www.boursobank.com/bourse/pea/"),
        pitch:
          "PEA gratuit, ordres dès 1,99 €. La plus grosse base PEA française.",
        tier: "leader",
      },
      {
        name: "Fortuneo",
        url: utm("https://www.fortuneo.fr/bourse/pea"),
        pitch:
          "PEA sans frais de tenue, ordres compétitifs, application solide.",
        tier: "leader",
      },
      {
        name: "Trade Republic",
        url: utm("https://www.traderepublic.com/fr-fr/savings-plan"),
        pitch:
          "PEA récent (2024), plans d'investissement programmés gratuits, UI minimaliste.",
        tier: "challenger",
      },
      {
        name: "Bourse Direct",
        url: utm("https://www.boursedirect.fr/fr/produits-bourse/pea"),
        pitch:
          "Courtier historique, large gamme d'instruments, frais agressifs sur ordres.",
        tier: "challenger",
      },
    ],
  },
  {
    slug: "scpi-fiscales",
    label: "SCPI fiscales · Pinel / Malraux / Déficit foncier",
    taxCredit:
      "Réduction d'IR (Pinel : 9-14 %), imputation déficit foncier (jusqu'à 10 700 €/an)",
    description:
      "Tu investis en immobilier locatif sans le gérer. Selon la SCPI, réduction d'IR à l'achat (Pinel, Malraux) ou imputation des charges sur le revenu (déficit foncier).",
    distributors: [
      {
        name: "Louve Invest",
        url: utm("https://www.louveinvest.com/"),
        pitch:
          "Plateforme 100 % en ligne, 50+ SCPI référencées, frais d'entrée souvent réduits via parrainage.",
        tier: "leader",
      },
      {
        name: "Primaliance",
        url: utm("https://www.primaliance.com/"),
        pitch:
          "Conseiller historique, accompagnement humain pour montages complexes (déficit foncier, démembrement).",
        tier: "leader",
      },
      {
        name: "MeilleureSCPI",
        url: utm("https://www.meilleurescpi.com/"),
        pitch:
          "Comparateur indépendant + souscription en ligne, fiches très détaillées par SCPI.",
        tier: "challenger",
      },
      {
        name: "La Centrale des SCPI",
        url: utm("https://www.centraledesscpi.com/"),
        pitch:
          "Couverture exhaustive (90+ SCPI), bonne pour le déficit foncier et les SCPI européennes.",
        tier: "challenger",
      },
    ],
  },
  {
    slug: "gff",
    label: "GFF · Groupements forestiers (forêts)",
    taxCredit:
      "Réduction d'IR de 18 % sur le versement · IFI partiellement exonéré · droits de succession allégés (75 %)",
    description:
      "Tu deviens copropriétaire d'une forêt française gérée par un professionnel. Triple avantage fiscal (IR + IFI + transmission) en échange d'un horizon long (8-10 ans minimum).",
    distributors: [
      {
        name: "France Valley",
        url: utm("https://www.france-valley.com/groupements-forestiers/"),
        pitch:
          "Leader incontesté du GFF français. ~50 % de part de marché, parc forestier diversifié sur tout le territoire.",
        tier: "leader",
      },
      {
        name: "Sogenial Patrimoine",
        url: utm("https://www.sogenial.fr/groupements-fonciers-forestiers/"),
        pitch:
          "GFF + GFV (vignobles). Approche conseil avec accompagnement individualisé.",
        tier: "challenger",
      },
      {
        name: "Inter Invest",
        url: utm("https://www.inter-invest.fr/"),
        pitch:
          "Distribue plusieurs GFF + des produits Girardin. Bon canal pour comparer.",
        tier: "challenger",
      },
    ],
  },
  {
    slug: "fip-fcpi",
    label: "FIP / FCPI · Investissement PME loi Madelin",
    taxCredit: "Réduction d'IR de 25 % du versement (plafonné)",
    description:
      "Tu investis dans un fonds qui finance des PME françaises (FIP) ou innovantes (FCPI). 25 % de réduction d'IR à l'achat, blocage 8-10 ans, risque réel de perte en capital.",
    distributors: [
      {
        name: "Inter Invest",
        url: utm("https://www.inter-invest.fr/fip-fcpi"),
        pitch:
          "Distribue les FIP/FCPI des principaux gérants français. Comparaison côte à côte.",
        tier: "leader",
      },
      {
        name: "Truffle Capital",
        url: utm("https://www.truffle.com/"),
        pitch:
          "Gérant FCPI tech français, track record de 20+ ans, fonds millésimés annuels.",
        tier: "leader",
      },
      {
        name: "123 IM",
        url: utm("https://www.123-im.com/"),
        pitch:
          "Spécialiste FIP, focus régions et PME industrielles.",
        tier: "challenger",
      },
      {
        name: "Eiffel Investment Group",
        url: utm("https://www.eiffel-ig.com/"),
        pitch:
          "FCPI thématiques (énergie, santé), rendement moins agressif mais plus sûr.",
        tier: "challenger",
      },
    ],
  },
  {
    slug: "girardin",
    label: "Girardin Industriel · Outre-mer",
    taxCredit:
      "Réduction d'IR one-shot, généralement 12-18 % du versement la même année",
    description:
      "Tu finances une PME industrielle ou un logement social en Outre-mer pendant 5 ans. La réduction d'IR est immédiate et supérieure au montant versé. Risque : la PME doit tenir 5 ans.",
    distributors: [
      {
        name: "Inter Invest",
        url: utm("https://www.inter-invest.fr/girardin-industriel"),
        pitch:
          "Le plus gros opérateur français de Girardin Industriel. ~30 % de part de marché.",
        tier: "leader",
      },
      {
        name: "Ecofip",
        url: utm("https://www.ecofip.com/"),
        pitch:
          "Spécialiste Outre-mer, opérations Girardin Logement Social et Industriel.",
        tier: "challenger",
      },
      {
        name: "DOM-TOM Défiscalisation",
        url: utm("https://www.dom-tom-defiscalisation.com/"),
        pitch:
          "Cabinet historique, expertise sur les montages industriels complexes.",
        tier: "niche",
      },
    ],
  },
  {
    slug: "lmnp",
    label: "LMNP · Location meublée non professionnelle",
    taxCredit:
      "Amortissement du bien + mobilier · loyers quasi non imposés sur 15-20 ans",
    description:
      "Tu achètes un bien meublé que tu loues. L'amortissement comptable du bien efface fiscalement la quasi-totalité des loyers. Statut accessible jusqu'à 23 000 €/an de revenus locatifs.",
    distributors: [
      {
        name: "Bevouac",
        url: utm("https://www.bevouac.com/"),
        pitch:
          "Plateforme clé-en-main : recherche, achat, ameublement, mise en gestion. Pour ne rien faire toi-même.",
        tier: "leader",
      },
      {
        name: "Masteos",
        url: utm("https://www.masteos.com/"),
        pitch:
          "Investissement locatif clé-en-main, focus rendements régionaux > 7 %.",
        tier: "leader",
      },
      {
        name: "Beanstock",
        url: utm("https://www.beanstock.com/"),
        pitch:
          "Approche data-driven, marketplace de biens vérifiés avec rendements simulés.",
        tier: "challenger",
      },
    ],
  },
  {
    slug: "frais-reels",
    label: "Frais réels (déclaration de revenus)",
    taxCredit:
      "Déduction des frais professionnels effectifs au lieu de l'abattement forfaitaire de 10 %",
    description:
      "Tu déduis tes vrais frais (km, repas, télétravail, formation) si la somme dépasse 10 % de ton salaire net imposable. Pour télétravailleurs et grands trajets domicile-travail surtout.",
    distributors: [
      {
        name: "Indy",
        url: utm("https://www.indy.fr/"),
        pitch:
          "Comptabilité freelance qui calcule automatiquement frais réels + déclaration.",
        tier: "leader",
      },
      {
        name: "Tiime",
        url: utm("https://tiime.fr/"),
        pitch:
          "Comptabilité freelance et TPE, OCR de tickets de caisse, intégration bancaire.",
        tier: "challenger",
      },
      {
        name: "Pennylane",
        url: utm("https://www.pennylane.com/"),
        pitch:
          "Plus orienté TPE/PME, mais utile pour les freelances avec activité de service complexe.",
        tier: "challenger",
      },
    ],
  },
  {
    slug: "dons",
    label: "Dons aux associations",
    taxCredit:
      "Réduction d'IR de 66 % du don (75 % pour aide aux personnes en difficulté)",
    description:
      "Le levier fiscal le plus rentable au pourcentage. 100 € donnés à une asso d'intérêt général te coûtent 34 €. Plafond annuel : 20 % du revenu imposable.",
    distributors: [
      {
        name: "HelloAsso",
        url: utm("https://www.helloasso.com/"),
        pitch:
          "Plateforme française gratuite, 200 000+ assos référencées, reçus fiscaux automatiques.",
        tier: "leader",
      },
      {
        name: "La Croix-Rouge française",
        url: utm("https://www.croix-rouge.fr/donate"),
        pitch:
          "Aide d'urgence, secourisme, action sociale. Reconnue d'utilité publique.",
        tier: "leader",
      },
      {
        name: "Restos du Cœur",
        url: utm("https://www.restosducoeur.org/donate"),
        pitch:
          "Distribution alimentaire et accompagnement. Donnant droit au taux 75 % (Coluche).",
        tier: "leader",
      },
      {
        name: "Médecins Sans Frontières",
        url: utm("https://www.msf.fr/donate"),
        pitch:
          "Action humanitaire indépendante, 90 % des dons vont au terrain.",
        tier: "leader",
      },
    ],
  },
];
