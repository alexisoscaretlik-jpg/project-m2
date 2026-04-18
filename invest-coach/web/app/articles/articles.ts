export type Article = {
  slug: string;
  title: string;
  teaser: string;
  readMinutes: number;
  updated: string;
  body: string;
};

export const ARTICLES: Article[] = [
  {
    slug: "pea-vs-assurance-vie",
    title: "PEA ou assurance-vie : lequel choisir quand on débute ?",
    teaser:
      "Deux enveloppes, deux logiques. L'une privilégie les actions européennes, l'autre la souplesse. Voici comment trancher.",
    readMinutes: 6,
    updated: "2026-03-12",
    body: `## Le résumé en 30 secondes

Le **PEA** est le meilleur outil pour qui veut investir en bourse
long terme sur des actions et ETF européens. Après 5 ans, les gains
sont exonérés d'impôt sur le revenu — il reste seulement 17,2% de
prélèvements sociaux.

L'**assurance-vie** est plus souple : tu peux y loger fonds euros,
ETF monde, immobilier papier (SCPI), obligations. Après 8 ans, un
abattement annuel de 4 600€ s'applique sur les gains retirés.

## Les trois critères qui tranchent

**1. Tu veux 100% actions européennes ? → PEA.** Le plafond
(150 000€) n'est pas un frein pour la plupart. L'exonération d'IR
après 5 ans est unique en Europe.

**2. Tu veux diversifier au-delà de l'Europe (S&P 500, MSCI World) ? → AV.**
Le PEA interdit les ETF non-UCITS hors-UE. L'AV débloque toute la
gamme mondiale via des UC.

**3. Tu veux transmettre à tes enfants ? → AV.** Jusqu'à 152 500€ par
bénéficiaire exonérés de droits de succession si les versements sont
faits avant 70 ans.

## Combiner les deux

La stratégie gagnante : **PEA d'abord, AV en complément**. Dès les
premiers 2 000€, ouvre un PEA pour prendre date (le compteur des 5
ans démarre). Versements mensuels dans un ETF Euro Stoxx 600 ou
MSCI Europe. Quand tu as constitué une base, ouvre une AV pour y
loger un ETF monde diversifié — de préférence chez un courtier en
ligne pour des frais <0,6%/an.

## Pièges fréquents

- **AV bancaire** : frais de gestion 1-2%/an. À éviter. Privilégie
  Linxea Spirit, Lucya Cardif, Placement-direct Vie, Evolution Vie.
- **PEA avec un fonds "action Europe" maison** : tu paies un gérant
  qui sous-performe un simple ETF. Préfère un ETF passif à 0,20%.
- **Retrait PEA avant 5 ans** : tu déclenches la fermeture et la
  flat tax 30%. Attends.`,
  },
  {
    slug: "comprendre-tmi-tranche-marginale",
    title: "TMI : comprendre sa tranche marginale pour optimiser",
    teaser:
      "La TMI décide quels leviers fiscaux valent le coup pour toi. Tout part de là.",
    readMinutes: 4,
    updated: "2026-02-20",
    body: `## La TMI en un paragraphe

Ta tranche marginale d'imposition (TMI) est le taux d'impôt sur le
revenu appliqué à la dernière tranche de tes revenus. En 2026 :
0%, 11%, 30%, 41%, 45%. Elle n'est PAS le taux moyen — elle est le
taux de la tranche la plus haute où tombe ton revenu imposable.

## Pourquoi c'est crucial

Chaque euro déduit du revenu imposable (PER, frais réels, déficit
foncier) te fait économiser à ton TMI. Si ta TMI est 30%, verser
1 000€ sur un PER te fait économiser 300€ d'impôt. Si ta TMI est 0%,
le PER est inutile fiscalement.

## Les seuils 2026 (célibataire, 1 part)

- 0% jusqu'à 11 497€
- 11% de 11 497 à 29 315€
- 30% de 29 315 à 83 823€
- 41% de 83 823 à 180 294€
- 45% au-delà

## Les leviers selon ta TMI

**TMI 11% :** le PER rapporte peu, mais une AV ou un PEA reste
pertinent pour la croissance long terme. Privilégie le PEA.

**TMI 30% :** le PER devient rentable. Dons aux assos (66% de
réduction plafonnée). Frais réels si trajets domicile-travail
supérieurs à l'abattement 10%.

**TMI 41-45% :** le PER est indispensable (plafond = 10% du salaire
net, jusqu'à ~35 000€/an). Déficit foncier si tu as du locatif.
IFI à surveiller si tu dépasses 1,3 M€ de patrimoine immobilier net.`,
  },
  {
    slug: "epargne-precaution",
    title: "Épargne de précaution : combien vraiment ?",
    teaser:
      "Avant d'investir en bourse, tu dois pouvoir encaisser un imprévu sans vendre au plus mauvais moment.",
    readMinutes: 3,
    updated: "2026-01-18",
    body: `## La règle des 3 à 6 mois

Mets de côté **3 à 6 mois de dépenses courantes** sur un Livret A
(6% net — pardon, 3% — exonéré d'IR et PS) ou LDDS. Pas plus, pas
moins.

- **3 mois** : CDI stable, couple à deux salaires, pas d'enfants à
  charge.
- **6 mois** : indépendant, freelance, chef d'entreprise, parent
  isolé, CDD.

## Pourquoi c'est crucial avant d'investir

Le pire scénario bourse : un imprévu (chômage, toit, santé) qui te
force à liquider ton PEA au plus mauvais moment. Une panne de
voiture à 3 000€ pendant un krach, tu vends -20%. L'épargne de
précaution évite ça.

## Où la placer

Livret A (22 950€ plafond) puis LDDS (12 000€) : taux garanti, sans
frais, disponible en 48h. Oublie les "super-livrets" à 5% : le bonus
ne dure que 3 mois, puis redescend à 0,5%.

## Ce qu'il NE faut PAS faire

- Laisser l'épargne de précaution sur un compte courant → inflation.
- La placer en AV fonds euros → frais de gestion + délai.
- Surdimensionner (12 mois) → argent qui ne travaille pas.`,
  },
  {
    slug: "dca-vs-lump-sum",
    title: "DCA ou versement unique : que dit la recherche ?",
    teaser:
      "Vanguard a tranché la question. Voici le résultat — et pourquoi on applique quand même le DCA.",
    readMinutes: 4,
    updated: "2025-11-05",
    body: `## Ce que dit la recherche

**Étude Vanguard 2012** (reproduite depuis) : sur 85 ans de données
US, UK, Australie, le versement unique ("lump sum") bat le DCA
(versements étalés) dans **68% des cas**. Raison : le marché monte
plus souvent qu'il ne baisse, donc étaler = rater les hausses.

## Pourquoi on applique quand même le DCA

**1. Le lissage psychologique.** 68%, ce n'est pas 100%. Une fois
sur trois, tu aurais mieux fait d'étaler. Et quand ça tombe sur toi
avec -30% en 6 mois, tu vends au pire moment.

**2. La contrainte de flux.** La plupart des particuliers n'ont pas
100k€ en cash à investir. Ils ont 300€ par mois de salaire. Donc
DCA par défaut, pas par choix.

**3. La discipline.** Automatiser 300€/mois le 5 du mois, c'est un
vote pour toi-même. Prélèvement SEPA sur le compte courant, zéro
friction.

## La synthèse pragmatique

- **Si tu as un capital ponctuel (héritage, prime, vente) :** étale
  sur 6-12 mois pour dormir la nuit. Tu perds peut-être 1-2% de
  performance statistique, tu gagnes en tranquillité.
- **Si tu épargnes chaque mois :** DCA mensuel automatique. La
  question ne se pose même pas.
- **Jamais de timing.** "J'attends que ça baisse" = moyenne de 10
  ans à attendre, selon les périodes.`,
  },
];

export function findArticle(slug: string): Article | null {
  return ARTICLES.find((a) => a.slug === slug) ?? null;
}
