# DM campaign — semaine du 28 avril 2026 (W18)

This is the personal-network message campaign for the W18 revenue bet
(target: 10 paying users at €14 by Sunday May 3).

## Spec

- **Audience:** people you already know (friends, family, ex-colleagues,
  Twitter/LinkedIn contacts who have followed Invest Coach since 2024).
- **Channel:** WhatsApp / iMessage / DM. No mass-email (separate campaign).
- **Length:** ≤ 4 sentences. DMs that look like newsletters get ignored.
- **One ask per message:** "essaie le plan Investisseur ce mois-ci".
- **One link:** `https://project-m2.alexisoscaretlik.workers.dev/pricing`
  (or the new domain if wired).
- **No emoji spam.** One contextual emoji max.
- **Tu, never vous.** Tone: direct adult, slight informality, zero hard sell.

---

## Template A · Personne déjà inscrite à la newsletter (90 % du book)

Use when the contact has been receiving the Sunday newsletter (you can
check the Supabase `subscribers` table). Reference the relationship.

> Salut {prénom} 👋
>
> J'ouvre les abonnements payants d'Invest Coach cette semaine — tu reçois
> la newsletter depuis {durée, ex: "un an"} alors je préfère te le dire de
> la main à la main avant de l'envoyer en masse.
>
> Plan Investisseur à 14 €/mois (ou 134 €/an, −20 %) : alertes, coach IA,
> simulateur PEA/CTO. Annulable en un clic.
>
> Lien direct → https://project-m2.alexisoscaretlik.workers.dev/pricing
>
> Si c'est pas le bon moment, dis-le-moi simplement, ça ne change rien à
> la newsletter (qui reste gratuite).

---

## Template B · Ami proche / famille / ex-collègue (warm, hors-newsletter)

Use for people who know you personally but haven't yet read the product.
Lead with the personal angle, not the product.

> {prénom}, je te tease depuis longtemps avec Invest Coach et là je passe
> à la version payante.
>
> 14 €/mois pour avoir accès à tous les outils fiscaux + coach IA + le
> simulateur d'enveloppes. C'est l'équivalent de deux cafés Starbucks par
> mois, et ça peut te faire économiser quelques centaines d'euros sur ta
> 2042 cette année.
>
> Si tu veux soutenir + tester : https://project-m2.alexisoscaretlik.workers.dev/pricing
>
> Et si t'as une seule question fiscale, écris-moi avant de payer, je te
> réponds gratos.

---

## Template C · Twitter/LinkedIn follower engagé (récent)

Use for someone who liked / replied / shared content in the last 30 days
but isn't on the newsletter list yet.

> Hello {prénom},
>
> J'ai vu ton {action: like / reply / partage} sur {sujet récent}. Je viens
> d'ouvrir les abonnements payants d'Invest Coach — Plan Investisseur à
> 14 €/mois (ou 134 €/an, −20 %).
>
> C'est exactement le genre de truc que tu lis : PEA, AV, PER, optimisation
> 2042, sans bullshit ni pub déguisée. Annulable en un clic.
>
> https://project-m2.alexisoscaretlik.workers.dev/pricing
>
> Pas vexé si tu zappes — c'était surtout pour te le proposer en premier
> avant que ça parte en newsletter.

---

## Template D · Réponse à un objection commune

### "Je teste depuis combien de temps avant de m'engager ?"

> Découverte est gratuite et le reste — tu gardes la newsletter du dimanche
> et le podcast hebdo sans payer un centime. Le payant ouvre juste les
> outils (alertes, coach, simulateur). Tu peux tester un mois à 14 €,
> annuler avant le renouvellement, garder ce que tu as appris.

### "Pourquoi pas un essai gratuit ?"

> Parce que Découverte EST l'essai gratuit. Tu lis le journal, tu reçois
> les brèves, tu écoutes le podcast. Si après six mois de ça tu n'es pas
> convaincu d'aller plus loin, c'est qu'on a peut-être pas besoin du même
> produit.

### "Je suis pas un investisseur, c'est trop pour moi"

> Le plan Investisseur s'appelle comme ça mais c'est surtout pour celles
> et ceux qui ont 1 PEA + 1 AV + un CDI et qui veulent arrêter de payer
> trop d'impôt. Si tu coches au moins deux de ces trois cases, tu es la
> cible. Si tu n'as ni PEA ni AV ni revenu imposable, oui, c'est peut-être
> pas pour maintenant.

---

## Cadence

- **J1 (mer 29 avr) :** Templates A/B aux 30 plus chauds (newsletter
  ouvreurs réguliers + amis proches).
- **J2 (jeu 30 avr) :** Templates A/C aux 50 suivants.
- **J3 (ven 1er mai) :** Templates B/C aux 50 derniers + relance sur les
  non-réponses J1-J2 *uniquement* avec un message court ("au cas où, le
  lien est encore actif").
- **Pas de relance après ven.** Soit ça a marché, soit ça n'a pas marché.
  Le silence est une réponse.

## Suivi

Après chaque envoi, marque dans une feuille de calc (ou Notion) :

| Contact | Template | Envoyé | Vu | Réponse | Conversion |
|---|---|---|---|---|---|

Le but n'est pas d'optimiser le taux de réponse — c'est de savoir qui a
converti pour t'envoyer un message de remerciement personnel à J+1.

## Mesure du succès (judged dimanche 3 mai)

- ≥ 1 paying user → product-market signal
- ≥ 5 → repeatable
- ≥ 10 → green light pour relance newsletter en mai

Si 0 conversion, le problème n'est pas la conversion — c'est l'offre. Le
mémo W19 réécrit l'offre. Pas plus de contenu, pas plus de design.

---

## Brand voice rappel (pour ne pas dériver en cours de campagne)

- Tutoiement. Toujours.
- Numérique. "−20 %" plutôt que "moins cher". "14 €" plutôt que "abordable".
- Pas de "révolutionnaire", "incroyable", "exclusif", "découvre".
- Une seule question rhétorique max par message.
- Le silence est une réponse acceptable. Ne harcèle personne.

Tu trouves la voix de marque détaillée dans
[`.claude/agents/content-manager.md`](../../.claude/agents/content-manager.md).
