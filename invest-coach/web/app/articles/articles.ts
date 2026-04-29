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
    slug: "per-rentable-quelle-tmi",
    title: "Le PER est-il vraiment intéressant ? Ça dépend de ta TMI.",
    teaser:
      "Le PER (Plan Épargne Retraite) déduit tes versements du revenu imposable. Mais l'avantage net dépend d'un seul chiffre : ta TMI aujourd'hui vs ta TMI à la retraite.",
    readMinutes: 7,
    updated: "2026-04-29",
    body: `## Le résumé en 30 secondes

Tu verses 1 000 € sur un **PER** (Plan Épargne Retraite). Tu déduis
ces 1 000 € de ton revenu imposable. Si tu es à la **TMI 30 %**, tu
récupères 300 € d'impôt l'année suivante — ton effort réel n'est
que de 700 €.

À la sortie (retraite), tu paies l'impôt sur ce que tu retires. Donc
le **vrai gain** du PER, c'est l'écart entre ta TMI **maintenant** et
ta TMI **à la retraite**. Si l'écart est nul, le PER ne sert à rien
fiscalement. S'il est de 19 points (41 % maintenant → 22 % à la
retraite, par exemple), c'est un des meilleurs placements légaux en
France.

## Comment fonctionne la déduction

Tu peux déduire chaque année jusqu'à **10 % de ton revenu pro net**,
plafonné à environ **35 194 € en 2026** (8 PASS). Pour un cadre à
60 000 € net imposable, ça fait un plafond de 6 000 €/an de versement
déductible.

Exemple concret pour Pierre, 38 ans, cadre à Lyon, 55 000 € net
imposable, célibataire 1 part :

- Sa TMI est de **30 %** (tranche 29 315 € → 83 823 €).
- Il verse **5 500 €** sur un PER (10 % de son revenu net).
- L'année suivante, son IR baisse de **5 500 € × 30 % = 1 650 €**.
- Effort réel : **3 850 €** pour un capital placé de 5 500 €.

Sur 25 ans, à 5 % de rendement net, ces 5 500 € deviennent ~18 600 €
au moment où Pierre liquide son PER.

## L'arbitrage qui fait tout

Au moment de la sortie (à 64 ans pour Pierre), il a deux options :
**rente** ou **capital**. Le **capital** (sortie en une fois ou
fractionnée) est désormais autorisé sur les versements déduits ·
c'est ce que choisit ~80 % des épargnants.

À la sortie en capital, le **capital lui-même** est imposé à ta TMI
**de l'année de retrait**. Les **gains** sont taxés à 30 %
(prélèvement forfaitaire unique).

Si à 64 ans Pierre est à la **TMI 11 %** (revenu retraite plus bas),
il aura :

- Récupéré **30 %** d'IR à l'entrée
- Payé **11 %** d'IR à la sortie sur le capital
- Net : **+19 points** sur le capital initial

Ça, c'est l'argent que la fiscalité lui a fait gagner. Sur 5 500 €
versés, ça fait **1 045 €** de cadeau fiscal net. Sans rien d'autre.

## Quand le PER est une mauvaise idée

**1. TMI à 0 ou 11 %.** Si tu es non imposable ou en bas de tranche,
le PER ne déduit rien d'intéressant. Mets ton épargne sur un PEA
(croissance long terme exonérée d'IR après 5 ans, hors PS 17,2 %).

**2. Tu vas avoir besoin de l'argent avant la retraite.** Le PER est
**bloqué jusqu'à la retraite**, sauf cas exceptionnels (achat
résidence principale, invalidité, décès du conjoint, fin de droits
chômage, surendettement). Si tu épargnes pour un projet à 5-10 ans,
prends une assurance-vie.

**3. Tu prévois une TMI plus élevée à la retraite.** Cas rare mais
réel : dirigeant qui prépare une vente d'entreprise, héritier qui
attend un déclenchement fiscal lourd. Dans ces cas, l'avantage
s'inverse — le PER devient un piège.

**4. Tu veux faire du levier patrimonial sur l'immobilier.** Le PER
n'aide pas à emprunter. Pour ça, c'est l'épargne mobilisable (compte
courant + livrets) qui compte aux yeux du banquier.

## Les pièges à éviter

- **PER bancaire à frais 1,5-2 %/an.** Le PER de ta banque est
  presque toujours médiocre. Compare sur Linxea Spirit PER, Yomoni
  Retraite, Nalo PER, Goodvest PER · frais < 0,8 %/an, ETF monde
  diversifiés. La différence sur 25 ans = entre 30 et 50 % du capital
  final. Pas un détail.
- **Verser sans saturer son TMI.** Ne déduis pas plus que ce qui te
  fait économiser à la TMI **la plus haute**. Si verser 6 000 € te
  fait basculer en TMI 11 % (parce que tu déduis trop), les derniers
  euros ne te font économiser que 11 % · pas 30 %.
- **Oublier les versements antérieurs.** Le plafond de déduction se
  reporte 3 ans. Si tu n'as rien versé en 2023-24-25, tu peux verser
  4 ans de plafond cumulés en 2026.
- **Sortie en rente automatique.** Beaucoup de PER bancaires sont
  paramétrés sortie en rente par défaut. La rente est taxée et perdue
  au décès. Vérifie que ton contrat permet la sortie en capital.

## Combiner PER + PEA + AV

La hiérarchie standard pour un cadre à TMI 30 % :

1. **Épargne de précaution** : 3 à 6 mois de dépenses sur Livret A
   et LDDS · liquide, sécurisé.
2. **PEA** : croissance long terme · ETF Europe ou ETF World CW8 ·
   frais < 0,30 %/an · plafond 150 000 €.
3. **PER** : à hauteur de ta TMI · ne dépasse pas le plafond annuel
   de déduction · sortie en capital prévue.
4. **Assurance-vie** : tout le reste · ETF monde + un peu de fonds
   euros pour la souplesse · transmission optimisée après 8 ans.

Tu peux abonder le PER **au mois** ou **en une fois en décembre**.
Décembre permet de calibrer : tu connais ta TMI réelle de l'année,
tu verses exactement ce qu'il faut pour saturer la tranche haute.

## Le mot de la fin

Le PER n'est pas un placement, c'est une **enveloppe fiscale**.
Il rapporte uniquement ce que ton **arbitrage TMI maintenant / TMI
plus tard** te rapporte, plus le rendement de ce que tu y mets
dedans. Pose ces deux questions avant d'ouvrir un PER, dans cet
ordre :

1. **Ma TMI sera-t-elle plus basse à la retraite ?** Si oui d'au
   moins 10 points, c'est intéressant.
2. **Ai-je déjà saturé mon PEA ?** Si non, ouvre le PEA d'abord ·
   son enveloppe est encore plus avantageuse en croissance.

Si tu réponds non aux deux, le PER attendra. Et c'est très bien
comme ça.`,
  },
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
  {
    slug: "petrole-detroit-hormuz-2026",
    title: "Pétrole : Hormuz fermé, que fait un investisseur posé ?",
    teaser:
      "L'Iran a bloqué le détroit d'Hormuz début avril. Le Brent s'envole, les médias paniquent. Voici ce que disent les chiffres et l'histoire.",
    readMinutes: 6,
    updated: "2026-04-18",
    body: `## Le résumé en 30 secondes

Début avril 2026, l'Iran a fermé le détroit d'Hormuz à tout
trafic maritime. Le **Brent** (pétrole de référence mer du Nord,
benchmark européen) est passé de ~78 USD/bbl à 120-160 USD/bbl
selon les séances. Le **WTI** (West Texas Intermediate, benchmark
américain) suit avec 4-6 USD de décote.

Historiquement, **chaque choc pétrolier géopolitique majeur s'est
résorbé en 6 à 18 mois**. Ton plan d'investissement long terme
n'a pas de raison de changer. Ce qu'il faut éviter : le stock
picking émotionnel et le market timing.

## Pourquoi Hormuz est un tel verrou

Le détroit d'Hormuz relie le Golfe persique à l'océan Indien. Il
mesure 33 km dans sa partie la plus étroite. **~20% du pétrole
mondial et ~25% du GNL** (gaz naturel liquéfié) y transitent
chaque jour — soit l'équivalent de 17-18 millions de barils.

Il n'existe **aucune route de contournement à cette échelle**.
Les pipelines saoudien (Petroline) et émirati (Habshan-Fujairah)
peuvent détourner 6-7 mbj au total, soit un tiers du flux
bloqué. Le reste est immobilisé.

Une fermeture totale et prolongée est **sans précédent historique
à cette échelle**. Les épisodes antérieurs (guerre Iran-Irak
1980-88, incidents 2019) étaient partiels et brefs.

## Ce que dit l'histoire des chocs pétroliers

**Yom Kippur, octobre 1973.** Embargo arabe sur les pays alliés
d'Israël. Le baril passe de 3 à 12 USD en 5 mois (×4). L'inflation
US monte à 12% en 1974. Le baril se stabilise ensuite autour de
13-14 USD pendant 5 ans · la réversion immédiate n'a PAS eu lieu
(choc structurel + fin de Bretton Woods), mais la panique initiale
s'est calmée en ~12 mois.

**Invasion du Koweït, août 1990.** Le Brent passe de 17 à 41 USD
en 3 mois (×2,4). Puis **redescend à 20 USD en 6 mois** après le
déclenchement de Desert Storm en janvier 1991. Réversion rapide.

**Guerre en Ukraine, février 2022.** Le Brent passe de 78 à
127 USD en 4 mois (×1,6). Retour à 78 USD **12 mois plus tard**,
malgré des sanctions toujours actives sur le brut russe. Le
marché s'adapte · les flux se redirigent (Inde, Chine).

**La leçon :** les spikes géopolitiques du pétrole reviennent vers
la moyenne en 6 à 18 mois. Parier sur la durée du choc, c'est
parier contre l'adaptation des marchés · et c'est historiquement
un mauvais pari.

## L'impact concret sur ton portefeuille

Si tu détiens un **ETF monde** (MSCI World, S&P 500) dans ton AV
ou un **ETF Europe** (MSCI Europe, Euro Stoxx 600) dans ton PEA,
tu as déjà une exposition équilibrée :

- **Secteur énergie** (TotalEnergies, Shell, BP, Exxon) : ~4-5%
  d'un ETF monde. Bénéficiaire direct d'un baril cher.
- **Secteurs sensibles au baril cher** : transport aérien (Air
  France-KLM, IAG), chimie (BASF, Arkema), automobile. Typiquement
  10-15% d'un indice large.
- **Secteurs défensifs** : santé, consommation de base, utilities.
  Amortissent la hausse.

L'inflation française, qui tournait à ~2,1% en mars 2026, peut
remonter à 3,5-4,5% si le baril reste au-dessus de 120 USD plus
de 3 mois. La BCE a déjà signalé qu'elle ne réagirait pas à un
choc d'offre temporaire · donc pas de remontée de taux
mécanique à court terme.

## Ce qu'on ne fait PAS

- **Acheter TotalEnergies en panique.** La hausse du secteur
  énergie est déjà pricée en 48h. Acheter après +15% c'est payer
  le scénario "Hormuz fermé 6 mois" à plein prix.
- **Vendre ses ETF monde pour "attendre que ça se calme".** Tu
  réalises une moins-value, tu paies peut-être la flat tax (PFU,
  30%) si tu es hors enveloppe, et tu rates le rebond qui se joue
  typiquement sur 5-10 séances.
- **Basculer 100% sur un ETF pétrole.** Les ETF sur futures
  pétrole souffrent du **contango** (structure où les contrats à
  échéance lointaine valent plus cher que le spot) : tu perds
  2-8%/an juste en roulant les contrats. Instrument court-terme,
  pas un placement.
- **Faire du market timing.** "Je rentre quand le VIX retombe" :
  dans 70% des cas, le marché a déjà rebondi avant que la peur
  retombe.

## Ce qu'on peut raisonnablement faire

**1. Continuer son DCA comme prévu.** Si tu as un versement
mensuel automatique sur ton PEA ou ton AV, ne le coupe pas. Les
séances de panique sont statistiquement les meilleurs points
d'entrée · mais tu ne sauras lequel qu'après coup.

**2. Vérifier son allocation, pas la bouleverser.** Si ton
portefeuille est 100% tech US et que tu découvres que tu n'as
aucune exposition énergie/défensif, c'est un signal d'équilibrage
long terme. Pas une urgence de la semaine.

**3. Profiter d'un décrochage pour un apport exceptionnel, si tu
as du cash.** Si tu as une prime ou un bonus qui dormait, un
marché -8 à -12% est un point d'entrée raisonnable. Étale sur
3-4 versements pour ne pas tout mettre sur un plus-bas
hypothétique.

**4. Garder ton épargne de précaution intacte.** C'est justement
dans ces moments qu'elle prouve son utilité : tu n'es pas forcé
de vendre tes ETF pour couvrir un imprévu.

**5. Couper les notifications.** Le flux d'actualité pétrole
24h/24 est conçu pour le trader, pas pour l'investisseur long
terme. Rouvrir son portefeuille une fois par trimestre suffit.

## Le mot de la fin

Un choc pétrolier est **un événement macro, pas un événement de
portefeuille**. Ton PEA ouvert pour 20 ans ne change pas de
nature parce que le Brent fait ±40% sur 3 mois. L'histoire montre
que ceux qui ont vendu en octobre 1973, en août 1990 ou en mars
2022 ont sous-performé ceux qui n'ont rien fait · souvent de
plusieurs dizaines de points sur 5 ans.`,
  },
];

export function findArticle(slug: string): Article | null {
  return ARTICLES.find((a) => a.slug === slug) ?? null;
}
