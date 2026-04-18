// Rotating library of actionable fiscal tips used in the weekly digest
// and welcome email. One gets picked each week based on the ISO week
// number so everyone gets the same tip that week — easier to discuss.

export type Tip = {
  slug: string;
  title: string;
  body: string; // Markdown: 2-4 short paragraphs.
  cta?: { label: string; href: string };
};

export const TIPS: Tip[] = [
  {
    slug: "pea-take-date",
    title: "Ouvre un PEA aujourd'hui, même avec 10€",
    body:
      "Le compteur des 5 ans du PEA démarre à l'ouverture, pas au premier versement important. Ouvrir un PEA avec 10€ te fait gagner 5 ans de fiscalité — littéralement. Dans 5 ans, tu sortiras sans IR.\n\nCourtiers recommandés : Fortuneo, Bourse Direct, Boursorama. Frais quasi-nuls, validé par des dizaines de milliers d'utilisateurs.",
    cta: { label: "Tester le PEA dans le simulateur", href: "/simulation" },
  },
  {
    slug: "av-luxury-switch",
    title: "Assurance-vie bancaire : tu paies 1,5% pour rien",
    body:
      "Les AV Crédit Agricole, Société Générale, BNP prélèvent 0,8 à 1,5% de frais de gestion sur UC. Sur 30 ans, c'est 25-35% de ton capital qui part en fumée.\n\nLes alternatives en ligne (Linxea Spirit, Lucya Cardif, Evolution Vie) plafonnent à 0,5%. Même performance sous-jacente, moitié de frais. Transfert impossible — il faut ouvrir une nouvelle AV et la nourrir en priorité.",
  },
  {
    slug: "per-tmi-30",
    title: "TMI 30% et plus : le PER te rend 300€ pour 1 000€ versés",
    body:
      "Si tu es dans la tranche 30%, chaque euro versé sur un PER déduit 30 centimes d'impôt. Sur 10 000€/an, c'est 3 000€ d'économie immédiate.\n\nLimites : plafond = 10% de ton revenu net pro (max ~35 000€/an). L'argent est bloqué jusqu'à la retraite sauf cas de déblocage anticipé (achat résidence principale, accident de la vie). Choisis un PER en ligne type Yomoni, Nalo, Ramify pour minimiser les frais.",
  },
  {
    slug: "epargne-precaution",
    title: "Avant d'investir : 3 à 6 mois de dépenses sur Livret A",
    body:
      "Règle non-négociable. Le pire scénario bourse : un imprévu qui te force à vendre au plus mauvais moment. Si ta voiture casse à 3 000€ pendant un krach, tu liquides à -20%.\n\n3 mois si tu es CDI stable à deux salaires sans enfant. 6 mois si tu es indépendant, CDD ou parent isolé. Livret A jusqu'à 22 950€ puis LDDS jusqu'à 12 000€. Zéro fiscalité, disponible en 48h.",
  },
  {
    slug: "dca-automatique",
    title: "Programme le virement. Ne touche plus à rien.",
    body:
      "La discipline bat le timing. 300€/mois pendant 30 ans à 7% = 340 000€. Essayer de \"timer le marché\" te coûte en moyenne 1,5-2% de performance par an selon les études Dalbar et Vanguard.\n\nVa dans ton espace courtier, programme un prélèvement SEPA le 5 du mois, et oublie-le. Tu verras ton capital grossir en arrière-plan.",
    cta: { label: "Simuler ton DCA", href: "/simulation" },
  },
  {
    slug: "dons-66",
    title: "Tes dons aux assos = 66% de réduction d'impôt",
    body:
      "200€ donnés à la Croix-Rouge, aux Restos du Cœur ou à une asso d'intérêt général te rendent 132€ d'impôt. Plafond : 20% du revenu imposable. Au-delà, report sur 5 ans.\n\nCertaines \"grandes causes\" (repas à des personnes en difficulté, soins gratuits) montent à 75% de réduction sur les 1 000 premiers euros. À utiliser avant le 31 décembre.",
  },
  {
    slug: "deficit-foncier",
    title: "Tu loues en non-meublé ? Le déficit foncier est ton ami",
    body:
      "Tes travaux de rénovation (hors agrandissement) déductibles jusqu'à 10 700€/an du revenu global. Le surplus se reporte sur les revenus fonciers des 10 années suivantes.\n\nExemple : 15 000€ de travaux en 2026 avec TMI 30% → 3 210€ d'impôt économisé immédiatement + 1 290€ reporté. Combine avec une année à forte TMI pour maximiser.",
  },
  {
    slug: "tradingview-alerts",
    title: "Crée 3 alertes TradingView sur tes positions majeures",
    body:
      "Sur chaque ligne importante (>5% de ton portefeuille), crée trois alertes : -20% (revue critique), -10% (top up éventuel), nouveau plus-haut 52 semaines (prise de bénéfices partielle).\n\nCes seuils te forcent à réfléchir avant d'agir. Sans alertes, tu regardes ton portefeuille tous les jours et tu vends au pire moment.",
    cta: { label: "Voir les marchés en direct", href: "/markets" },
  },
  {
    slug: "assurance-vie-150k",
    title: "Transmission : 152 500€ par bénéficiaire exonérés de droits",
    body:
      "Chaque bénéficiaire désigné d'une AV reçoit jusqu'à 152 500€ hors droits de succession, si tes versements ont été faits avant tes 70 ans.\n\nRèglage clé : désigne nommément tes bénéficiaires dans la clause (pas juste \"mes héritiers\"). Si tu as 3 enfants, tu peux transmettre 457 500€ en franchise totale.",
  },
  {
    slug: "etf-monde",
    title: "Un seul ETF pour 80% de ton exposition actions : MSCI World",
    body:
      "Le MSCI World capture 1 500 grandes capitalisations dans 23 pays développés. Frais de gestion 0,12 à 0,20% selon le ticker (IWDA, EWLD, CW8).\n\nAprès 30 ans, tu auras fait mieux que 85% des fonds actifs. Le \"reste\" : 20% émergents (AEEM ou IE00BKM4GZ66) pour diversifier vers l'Asie.",
  },
  {
    slug: "taxe-fonciere-mensualisation",
    title: "Mensualise ta taxe foncière et ta taxe d'habitation",
    body:
      "Au lieu de sortir 1 500€ d'un coup en octobre, tu paies 125€ par mois. Aucun coût, aucun intérêt supplémentaire. Juste mieux pour ton flux de trésorerie.\n\nDemande directe sur impots.gouv.fr. Activation avant le 30 juin pour l'année en cours.",
  },
  {
    slug: "ifi-1-3-million",
    title: "Patrimoine immobilier net >1,3M€ ? Attention à l'IFI",
    body:
      "L'Impôt sur la Fortune Immobilière s'applique dès 1,3 M€ de valeur nette (après déduction des dettes). Taux progressif de 0,5% à 1,5%.\n\nLeviers : SCI familiale avec démembrement (l'usufruit seul est taxable), dons en nue-propriété aux enfants, résidence principale abattement 30%. À planifier 3-5 ans en amont de la transmission.",
  },
];

export function weeklyTip(date: Date = new Date()): Tip {
  // ISO week number → rotate through tips.
  const onejan = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((date.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7,
  );
  return TIPS[week % TIPS.length];
}

export function findTip(slug: string): Tip | null {
  return TIPS.find((t) => t.slug === slug) ?? null;
}
