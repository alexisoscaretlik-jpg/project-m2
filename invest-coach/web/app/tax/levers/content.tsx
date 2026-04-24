"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  computeLeverSavings,
  computeParts,
  formatEur,
  type Situation,
} from "@/lib/tax/brackets";

// Client-side interactive version of /tax/levers.
// - Sticky calculator band at the top: salary, situation, enfants.
// - Derives TMI live via French 2025 brackets.
// - Every lever card's "example" is rewritten with the user's number.
// - Floating total at the bottom of the page.

type InitialProfile = {
  salary?: number;
  situation?: Situation;
  nbEnfants?: number;
};

export function LeversContent({ initial }: { initial?: InitialProfile }) {
  const [salary, setSalary] = useState<number>(initial?.salary ?? 45000);
  const [situation, setSituation] = useState<Situation>(
    initial?.situation ?? "single",
  );
  const [nbEnfants, setNbEnfants] = useState<number>(initial?.nbEnfants ?? 0);

  const parts = useMemo(
    () => computeParts(situation, nbEnfants),
    [situation, nbEnfants],
  );

  const s = useMemo(
    () => computeLeverSavings({ netSalary: salary, situation, nbEnfants }),
    [salary, situation, nbEnfants],
  );

  const hasKidsUnder6 = nbEnfants > 0;

  return (
    <>
      {/* ============ CALCULATOR BAND (STICKY) ============ */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <label className="text-xs text-slate-600">
              Salaire net annuel
              <div className="mt-1 flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5">
                <input
                  type="number"
                  min={0}
                  max={500000}
                  step={1000}
                  value={salary}
                  onChange={(e) => setSalary(Number(e.target.value) || 0)}
                  className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-slate-900 focus:outline-none"
                />
                <span className="text-xs text-slate-500">€</span>
              </div>
            </label>

            <label className="text-xs text-slate-600">
              Situation
              <select
                value={situation}
                onChange={(e) => setSituation(e.target.value as Situation)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900"
              >
                <option value="single">Seul(e)</option>
                <option value="couple">En couple</option>
              </select>
            </label>

            <label className="text-xs text-slate-600">
              Enfants
              <input
                type="number"
                min={0}
                max={10}
                value={nbEnfants}
                onChange={(e) =>
                  setNbEnfants(Math.max(0, Number(e.target.value) || 0))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900"
              />
            </label>

            <div className="flex flex-col justify-end text-right text-xs text-slate-500">
              <div>
                TMI&nbsp;
                <span className="text-sm font-bold text-blue-700">
                  {s.tmi}%
                </span>{" "}
                · {parts} parts
              </div>
              <div className="mt-0.5">
                Économie estimée{" "}
                <span className="text-base font-bold text-emerald-700">
                  {formatEur(s.total)}/an
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* ============ HERO ============ */}
        <header className="mb-10">
          <Link
            href="/tax"
            className="text-xs text-slate-500 hover:text-blue-600"
          >
            ← Retour à Fiscalité
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Votre plan fiscal, levier par levier
          </h1>
          <p className="mt-4 text-base text-slate-600">
            Les chiffres affichés ci-dessous sont{" "}
            <strong className="text-slate-900">calculés pour vous</strong>{" "}
            selon vos entrées ci-dessus (salaire, situation, enfants).
            Modifiez-les à tout moment — tout se met à jour
            instantanément.
          </p>

          <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Votre profil fiscal
            </div>
            <p className="mt-2 text-sm text-slate-800 sm:text-base">
              Vous êtes en tranche marginale{" "}
              <strong className="text-blue-700">{s.tmi}%</strong>. Chaque
              euro placé sur un bon levier vous économise{" "}
              <strong className="text-blue-700">
                €{(s.tmi / 100).toFixed(2)}
              </strong>{" "}
              d&apos;impôts immédiatement.
              {s.tmi === 0
                ? " À ce taux, les leviers de réduction directe (dons, emploi domicile) restent utiles, mais le PER a peu d'effet."
                : s.tmi >= 41
                  ? " À ce taux, le PER et les dispositifs de déduction ont un effet particulièrement puissant."
                  : " C'est la tranche la plus courante — le PER est votre levier #1."}
            </p>
          </section>

          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs sm:text-sm">
            <a
              href="#tier-1"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 hover:border-blue-400"
            >
              1 · Essentiel
            </a>
            <a
              href="#tier-2"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 hover:border-blue-400"
            >
              2 · Épargne
            </a>
            <a
              href="#tier-3"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 hover:border-blue-400"
            >
              3 · Patrimoine
            </a>
            <a
              href="#tier-4"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 hover:border-blue-400"
            >
              4 · Avancé
            </a>
          </div>
        </header>

        {/* ========== TIER 1 ========== */}
        <TierHeading
          id="tier-1"
          number="1"
          title="Le strict minimum"
          description="Les 4 leviers que tout salarié devrait connaître. Faciles, sans risque, effet immédiat sur la déclaration de l'année prochaine."
        />

        <LeverCard
          title="Le PER — Plan d'Épargne Retraite"
          subtitle="Payer moins d'impôts maintenant, préparer sa retraite"
          concept="Chaque euro que tu verses sur ton PER est déduit de ton revenu imposable. L'argent est bloqué jusqu'à la retraite (sauf cas exceptionnels)."
          diagram={<PERDiagram />}
          takeaways={[
            `Plafond pour vous en 2026 : ${formatEur(s.perCeiling)}/an.`,
            "Bloqué jusqu'à la retraite — sauf 6 cas de déblocage anticipé.",
            "HORS plafond global des niches fiscales.",
          ]}
          example={
            s.tmi === 0
              ? "À TMI 0% le PER ne réduit pas votre impôt présent, mais reste utile comme enveloppe retraite (gains différés, sortie flexible)."
              : `Si vous versez ${formatEur(s.perVersement)} sur un PER en 2025, vous économisez ${formatEur(s.perSaving)} d'impôts sur votre déclaration 2026. Votre effort net pour la retraite : ${formatEur(s.perVersement - s.perSaving)}.`
          }
          personalImpact={s.tmi > 0 ? s.perSaving : 0}
          tag="Pour tout le monde"
          tagTone="green"
        />

        <LeverCard
          title="Les dons aux associations"
          subtitle="L'État finance 66% de ta générosité"
          concept="Tu donnes à une association d'intérêt général (Croix-Rouge, Restos du Cœur, Médecins du Monde, WWF…). L'État te rembourse 66% via ta déclaration. Pour l'aide aux personnes en difficulté, c'est 75% jusqu'à €1,000."
          diagram={<DonationDiagram />}
          takeaways={[
            "Réduction 66% jusqu'à 20% du RFR ; 75% jusqu'à €1,000 pour l'aide alimentaire.",
            "HORS plafond global des niches fiscales.",
            "Conservez le reçu : saisie case 7UD / 7UF de la déclaration.",
          ]}
          example={`Si vous donnez ${formatEur(s.donationAmount)} cette année, l'État vous rembourse ${formatEur(s.donationSaving)}. Votre coût net : ${formatEur(s.donationAmount - s.donationSaving)} pour ${formatEur(s.donationAmount)} de générosité.`}
          personalImpact={s.donationSaving}
          tag="Pour tout le monde"
          tagTone="green"
        />

        <LeverCard
          title="L'emploi à domicile"
          subtitle="Une femme de ménage ? L'État paie la moitié"
          concept="Tu emploies quelqu'un chez toi : ménage, garde d'enfants, cours particuliers, jardinage, bricolage, assistance aux personnes âgées. L'État te rembourse 50% de ce que tu paies (salaire + charges). Plafond €12,000/an (donc jusqu'à €6,000 de crédit)."
          diagram={<EmployeeDiagram />}
          takeaways={[
            "Crédit d'impôt 50% (remboursé même si tu ne paies pas d'impôts).",
            "Plafond €12,000/an (€15,000 la première année, +€1,500 / enfant).",
            "CESU, entreprises de service à la personne, assistante maternelle agréée.",
          ]}
          example={`Ménage 4h/sem à €15/h, charges incluses ≈ ${formatEur(s.domesticSpend)}/an. Crédit d'impôt : ${formatEur(s.domesticSaving)}. Votre coût net réel : ${formatEur(s.domesticSpend - s.domesticSaving)} — cohérent avec le marché, et tout légal.`}
          personalImpact={s.domesticSaving}
          tag="Pour tout le monde"
          tagTone="green"
        />

        <LeverCard
          title="Les frais de garde enfants < 6 ans"
          subtitle="Crèche, nounou, assistante maternelle : 50% remboursés"
          concept="Tous tes frais de garde d'enfants de moins de 6 ans (crèche, halte-garderie, assistante maternelle agréée, garde à domicile) te donnent droit à un crédit d'impôt de 50%, plafonné à €3,500 par enfant par an."
          diagram={<ChildcareDiagram />}
          takeaways={[
            "Crédit 50% (refundable), plafond €3,500 / enfant / an.",
            "Crédit maximum €1,750 par enfant.",
            "Uniquement pour les enfants de moins de 6 ans au 1er janvier.",
          ]}
          example={
            hasKidsUnder6
              ? `Pour ${Math.min(nbEnfants, 2)} enfant(s) de moins de 6 ans : crédit d'impôt estimé ${formatEur(s.childcareSaving)} cash (50% de ${formatEur(s.childcareSpend)} plafonnés).`
              : "Pas d'enfants à charge renseigné — indiquez le nombre dans la barre en haut si applicable."
          }
          personalImpact={s.childcareSaving}
          tag="Si tu as des enfants"
          tagTone="blue"
        />

        {/* ========== TIER 2 ========== */}
        <TierHeading
          id="tier-2"
          number="2"
          title="Si tu as un peu d'épargne qui dort"
          description="Trois enveloppes fiscales qui rendent ton épargne plus efficace. Ne réduisent pas immédiatement ton impôt, mais évitent qu'il augmente quand ton argent fait des petits."
        />

        <LeverCard
          title="L'assurance-vie"
          subtitle="L'enveloppe fiscale préférée des Français"
          concept="Ce n'est pas une réduction immédiate, c'est une enveloppe. Tes gains ne sont imposés que quand tu retires. Après 8 ans, abattement €4,600/an (€9,200 couple) + PFU réduit à 7.5%. Elle sert aussi à transmettre hors droits de succession."
          diagram={<AssuranceVieDiagram />}
          takeaways={[
            "Liquide : retirable à tout moment, pas bloqué comme le PER.",
            "Après 8 ans : abattement €4,600 / an célib (€9,200 couple) + taux réduit.",
            "Transmission : €152,500 exonéré / bénéficiaire (versements avant 70 ans).",
          ]}
          example="Vous versez €10,000, ça grandit à 5%/an pendant 8 ans → €14,775. Gain : €4,775. Avec l'abattement €4,600, imposition uniquement sur €175. Quasi rien."
          tag="≥ €5k qui dort"
          tagTone="blue"
        />

        <LeverCard
          title="Le PEA — Plan d'Épargne en Actions"
          subtitle="Investir en Bourse sans payer d'impôt sur les plus-values"
          concept="Un compte dédié aux actions européennes (ou ETFs qui les répliquent). Après 5 ans, tes plus-values sont exonérées d'IR. Seuls les prélèvements sociaux (17.2%) restent."
          diagram={<PEADiagram />}
          takeaways={[
            "0% IR sur plus-values après 5 ans (mais 17.2% de prélèvements sociaux).",
            "Plafond versements €150,000 (€225k combiné avec PEA-PME).",
            "Actions européennes ou ETFs World éligibles — il en existe.",
          ]}
          example="Vous investissez €20k sur 10 ans, ça double à €40k. Plus-value €20k. Hors PEA : ~€6,000 d'impôts. Dans un PEA : €3,440. Économie : €2,560."
          tag="Épargne > 5 ans"
          tagTone="blue"
        />

        <LeverCard
          title="L'IR-PME (loi Madelin)"
          subtitle="25% de réduction si vous investissez dans une PME"
          concept="Vous souscrivez au capital d'une PME non cotée, directement ou via une plateforme (Lita, Wiseed, Sowefund…). 25% de réduction d'impôt immédiate depuis sept. 2025. Jusqu'à 50% pour les Jeunes Entreprises Innovantes de recherche (JEIR)."
          diagram={<IRPMEDiagram />}
          takeaways={[
            "Réduction 25% à l'entrée, plafond €50k célib / €100k couple.",
            "JEIR (recherche) : jusqu'à 50% de réduction.",
            "Bloqué 5+ ans, risque de perte totale.",
          ]}
          example="Vous investissez €5,000 dans une PME via Lita. Réduction immédiate €1,250. Capital exposé €3,750. Dans 5-7 ans : soit la PME réussit (vous gagnez), soit elle échoue (vous perdez €3,750 net)."
          tag="€5k que vous acceptez de perdre"
          tagTone="amber"
        />

        {/* ========== TIER 3 ========== */}
        <TierHeading
          id="tier-3"
          number="3"
          title="Si vous êtes propriétaire ou freelance"
          description="Leviers puissants mais qui ne s'appliquent qu'à certaines situations. Vérifier l'éligibilité avant de se lancer."
        />

        <CompactCard
          title="Le déficit foncier"
          tag="Propriétaire bailleur, location nue"
          summary="Si vos charges + travaux sur un bien locatif dépassent vos loyers, le déficit s'impute sur votre revenu global jusqu'à €10,700/an. Le reste se reporte 10 ans. HORS plafond global."
          example={`Loyer perçu €12k/an, travaux + charges €18k. Déficit €6k imputé sur votre revenu. À TMI ${s.tmi}%, économie estimée ${formatEur(Math.round((6000 * s.tmi) / 100))}.`}
        />

        <CompactCard
          title="Les frais réels"
          tag="Trajets longs ou télétravail"
          summary="L'abattement forfaitaire est 10% du salaire. Si vos vrais frais pro (trajet, repas, télétravail, matériel) dépassent 10%, passez en 'frais réels' et déduisez plus."
          example={`Salaire ${formatEur(salary)} → abattement actuel ${formatEur(Math.round(salary * 0.1))}. Si vos frais réels sont €2k au-dessus, gain : ${formatEur(Math.round((2000 * s.tmi) / 100))} à TMI ${s.tmi}%.`}
        />

        <CompactCard
          title="Le LMNP — Location Meublée Non Professionnelle"
          tag="Achat pour louer meublé"
          summary="Vous louez meublé (studio étudiant, colocation, saisonnière). En régime réel, vous amortissez le bien et les meubles comptablement. Résultat : loyers quasi-non imposés pendant 10-20 ans. HORS plafond global."
          example="Studio Paris €200k, loyer €850/mois = €10,200/an. Charges + amortissement ≈ €9,500. Base imposable ≈ €700 au lieu de €10,200 → impôts quasi nuls 15-20 ans."
        />

        <CompactCard
          title="Le PER TNS / Madelin"
          tag="Freelance, profession libérale, indépendant"
          summary="Identique au PER salarié mais plafonds plus généreux pour indépendants. Déduction des versements du bénéfice BNC/BIC."
          example="BNC €80k → plafond Madelin ≈ €15k/an. Versement €10k → IR -€3k + baisse cotisations URSSAF."
        />

        <CompactCard
          title="L'adhésion à un CGA / AGA"
          tag="Indépendant au régime réel"
          summary="BNC/BIC au régime réel : adhérer à un centre de gestion agréé donne droit à une réduction couvrant 2/3 des frais de compta (plafond €915/an)."
          example="Frais compta €1,200 → réduction €800 (2/3). Cabinet coûte réellement €400 net."
        />

        {/* ========== TIER 4 ========== */}
        <TierHeading
          id="tier-4"
          number="4"
          title="Pour les optimisateurs"
          description="Niche, risqué ou réservé aux hauts revenus / patrimoines. Ces dispositifs ne sont pertinents que dans des situations très précises. À ne pas lancer sans conseil d'expert-comptable."
        />

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <ul className="space-y-4 text-sm text-slate-700">
            <CompactItem
              name="Girardin industriel"
              line="Financement d'équipements industriels en outre-mer. Vous investissez €10k, vous récupérez €11-11.5k de réduction sur UNE année."
              risk="Très risqué : perte totale possible si l'opération échoue. Plafond majoré €18,000."
            />
            <CompactItem
              name="SOFICA"
              line="Financement du cinéma français. Réduction 30-48% du montant investi selon les engagements du fonds."
              risk="Fonds bloqués 5-10 ans, rendement incertain. Plafond majoré €18,000."
            />
            <CompactItem
              name="Loi Malraux"
              line="Restauration d'immeubles en secteur sauvegardé. 22-30% de réduction sur les travaux."
              risk="HORS plafond global. Pour patrimoines > €500k. Gestion lourde."
            />
            <CompactItem
              name="Monuments Historiques"
              line="Si vous achetez et restaurez un monument classé : 100% des travaux déductibles."
              risk="HORS plafond. Très niche : grandes fortunes, très long terme."
            />
            <CompactItem
              name="Pinel+ / Denormandie"
              line="Investissement locatif neuf (Pinel+) ou ancien rénové (Denormandie). Réduction étalée 9-12 ans."
              risk="Pinel classique fermé aux nouveaux investisseurs depuis janvier 2025."
            />
            <CompactItem
              name="GFF / GFV (Groupements Forestiers / Viticoles)"
              line="Réduction 18% + avantages successions 75% + exonération IFI partielle."
              risk="À partir de €5-10k, liquidité réduite (3-5 ans pour revendre)."
            />
            <CompactItem
              name="JEI / JEIR"
              line="Souscription à Jeunes Entreprises Innovantes. JEIR (recherche) = jusqu'à 50%."
              risk="Ultra-risqué. Plafonds serrés. Pour business angels avertis."
            />
            <CompactItem
              name="Loc'Avantages (ex-Cosse)"
              line="Location à loyer modéré (plafond selon zone). 15-65% de réduction selon la décote."
              risk="Engagement 6-9 ans. Loyer plafonné → rendement brut plus faible."
            />
            <CompactItem
              name="Dons aux partis politiques"
              line="66% de réduction. Plafond €15,000 / foyer / an (€4,600 max par parti)."
              risk="Rien de risqué — à noter que c'est politique."
            />
          </ul>
        </section>

        {/* ========== CTA ========== */}
        <section className="mt-10 rounded-xl border border-blue-200 bg-blue-50 p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Prêt à personnaliser votre plan ?
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            Chargez votre avis d&apos;imposition, on identifie les
            leviers les plus rentables pour vous et on génère votre
            Cerfa 2042 pré-rempli.
          </p>
          <Link
            href="/tax"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Générer mon plan personnalisé →
          </Link>
        </section>

        <p className="mt-8 text-center text-xs text-slate-400">
          Informations éducatives. Ne constitue pas un conseil fiscal
          personnalisé au sens de la loi. Confirmer avec un
          expert-comptable ou un notaire avant toute décision.
        </p>
      </div>

      {/* ============ FLOATING TOTAL BAR ============ */}
      <div className="pointer-events-none sticky bottom-4 z-10 mx-auto mt-4 max-w-3xl px-4">
        <div className="pointer-events-auto flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-600 px-5 py-3 text-white shadow-lg">
          <div>
            <div className="text-xs uppercase tracking-wide text-emerald-100">
              Économie annuelle estimée
            </div>
            <div className="text-xl font-bold">{formatEur(s.total)}</div>
          </div>
          <Link
            href="/tax"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Activer mon plan →
          </Link>
        </div>
      </div>
    </>
  );
}

// =============================================================
// Sub-components
// =============================================================

function TierHeading({
  id,
  number,
  title,
  description,
}: {
  id: string;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div id={id} className="mb-5 mt-12 scroll-mt-24">
      <div className="flex items-baseline gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
          Tier {number}
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  );
}

function LeverCard({
  title,
  subtitle,
  concept,
  diagram,
  takeaways,
  example,
  personalImpact,
  tag,
  tagTone,
}: {
  title: string;
  subtitle: string;
  concept: string;
  diagram: React.ReactNode;
  takeaways: string[];
  example: string;
  personalImpact?: number;
  tag: string;
  tagTone: "green" | "blue" | "amber";
}) {
  const tagClass =
    tagTone === "green"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : tagTone === "blue"
        ? "bg-blue-100 text-blue-800 border-blue-200"
        : "bg-amber-100 text-amber-800 border-amber-200";

  return (
    <article className="mb-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
            {title}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${tagClass}`}
          >
            {tag}
          </span>
          {typeof personalImpact === "number" && personalImpact > 0 ? (
            <span className="whitespace-nowrap rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
              ~{formatEur(personalImpact)}/an pour vous
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-700">{concept}</p>

      <div className="mt-5 rounded-lg bg-slate-50 p-4">{diagram}</div>

      <div className="mt-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          À retenir
        </div>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
          {takeaways.map((t, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-blue-500">▸</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
          Pour vous
        </div>
        <p className="mt-1 text-sm text-slate-800">{example}</p>
      </div>
    </article>
  );
}

function CompactCard({
  title,
  tag,
  summary,
  example,
}: {
  title: string;
  tag: string;
  summary: string;
  example: string;
}) {
  return (
    <article className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <span className="whitespace-nowrap text-xs font-medium text-slate-500">
          {tag}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-700">{summary}</p>
      <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
        <strong className="text-slate-900">Pour vous · </strong>
        {example}
      </div>
    </article>
  );
}

function CompactItem({
  name,
  line,
  risk,
}: {
  name: string;
  line: string;
  risk: string;
}) {
  return (
    <li className="border-l-2 border-slate-200 pl-4">
      <div className="font-semibold text-slate-900">{name}</div>
      <div className="mt-1 text-sm text-slate-700">{line}</div>
      <div className="mt-1 text-xs text-amber-700">⚠ {risk}</div>
    </li>
  );
}

// =============================================================
// Visual schematics (kept minimal — numbers stay generic here;
// user-specific numbers live in the "Pour vous" callout below
// each card to avoid cluttering the diagrams).
// =============================================================

function PERDiagram() {
  return (
    <svg viewBox="0 0 400 200" className="mx-auto block h-auto w-full max-w-md">
      <rect x="20" y="20" width="110" height="50" rx="8" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="75" y="42" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e40af">Vous versez</text>
      <text x="75" y="60" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e40af">€1,000</text>
      <line x1="135" y1="45" x2="168" y2="45" stroke="#64748b" strokeWidth="1.5" />
      <polygon points="168,41 175,45 168,49" fill="#64748b" />
      <rect x="180" y="20" width="160" height="50" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="260" y="38" textAnchor="middle" fontSize="9" fontWeight="600" fill="#92400e">Revenu imposable</text>
      <text x="260" y="54" textAnchor="middle" fontSize="12" fontWeight="700" fill="#92400e">-€1,000</text>
      <text x="260" y="66" textAnchor="middle" fontSize="8" fill="#92400e">× votre TMI</text>
      <line x1="260" y1="80" x2="260" y2="115" stroke="#64748b" strokeWidth="1.5" />
      <polygon points="256,115 264,115 260,122" fill="#64748b" />
      <rect x="130" y="130" width="260" height="55" rx="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
      <text x="260" y="152" textAnchor="middle" fontSize="11" fontWeight="600" fill="#166534">Impôt sur le revenu</text>
      <text x="260" y="175" textAnchor="middle" fontSize="16" fontWeight="700" fill="#166534">-€(TMI × 1,000) / 100</text>
    </svg>
  );
}

function DonationDiagram() {
  return (
    <svg viewBox="0 0 400 150" className="mx-auto block h-auto w-full max-w-md">
      <rect x="20" y="20" width="110" height="50" rx="8" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="75" y="42" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e40af">Vous donnez</text>
      <text x="75" y="60" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e40af">€100</text>
      <line x1="135" y1="45" x2="168" y2="45" stroke="#64748b" strokeWidth="1.5" />
      <polygon points="168,41 175,45 168,49" fill="#64748b" />
      <rect x="180" y="20" width="150" height="50" rx="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
      <text x="255" y="40" textAnchor="middle" fontSize="9" fontWeight="600" fill="#166534">L&apos;État rembourse</text>
      <text x="255" y="60" textAnchor="middle" fontSize="16" fontWeight="700" fill="#166534">€66</text>
      <rect x="90" y="90" width="220" height="45" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="200" y="108" textAnchor="middle" fontSize="10" fontWeight="600" fill="#92400e">Coût réel</text>
      <text x="200" y="127" textAnchor="middle" fontSize="16" fontWeight="700" fill="#92400e">€34</text>
    </svg>
  );
}

function EmployeeDiagram() {
  return (
    <svg viewBox="0 0 400 150" className="mx-auto block h-auto w-full max-w-md">
      <rect x="20" y="20" width="130" height="50" rx="8" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="85" y="42" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e40af">Vous payez (an)</text>
      <text x="85" y="60" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e40af">€3,500</text>
      <line x1="155" y1="45" x2="188" y2="45" stroke="#64748b" strokeWidth="1.5" />
      <polygon points="188,41 195,45 188,49" fill="#64748b" />
      <rect x="200" y="20" width="170" height="50" rx="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
      <text x="285" y="40" textAnchor="middle" fontSize="9" fontWeight="600" fill="#166534">Crédit 50% remboursé</text>
      <text x="285" y="60" textAnchor="middle" fontSize="14" fontWeight="700" fill="#166534">€1,750</text>
      <rect x="90" y="90" width="220" height="45" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="200" y="108" textAnchor="middle" fontSize="10" fontWeight="600" fill="#92400e">Coût net annuel</text>
      <text x="200" y="127" textAnchor="middle" fontSize="16" fontWeight="700" fill="#92400e">€1,750</text>
    </svg>
  );
}

function ChildcareDiagram() {
  return (
    <svg viewBox="0 0 400 150" className="mx-auto block h-auto w-full max-w-md">
      <rect x="20" y="20" width="140" height="50" rx="8" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="90" y="38" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e40af">Crèche (an)</text>
      <text x="90" y="55" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e40af">€9,600</text>
      <text x="90" y="66" textAnchor="middle" fontSize="8" fill="#1e40af">plafonné à €3,500</text>
      <line x1="165" y1="45" x2="198" y2="45" stroke="#64748b" strokeWidth="1.5" />
      <polygon points="198,41 205,45 198,49" fill="#64748b" />
      <rect x="210" y="20" width="170" height="50" rx="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
      <text x="295" y="40" textAnchor="middle" fontSize="9" fontWeight="600" fill="#166534">Crédit 50% du plafond</text>
      <text x="295" y="60" textAnchor="middle" fontSize="14" fontWeight="700" fill="#166534">€1,750</text>
      <rect x="90" y="90" width="220" height="45" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="200" y="108" textAnchor="middle" fontSize="10" fontWeight="600" fill="#92400e">Cash remboursé</text>
      <text x="200" y="127" textAnchor="middle" fontSize="16" fontWeight="700" fill="#92400e">€1,750 / enfant</text>
    </svg>
  );
}

function AssuranceVieDiagram() {
  return (
    <svg viewBox="0 0 400 140" className="mx-auto block h-auto w-full max-w-md">
      <line x1="30" y1="80" x2="370" y2="80" stroke="#cbd5e1" strokeWidth="2" />
      <circle cx="50" cy="80" r="6" fill="#3b82f6" />
      <text x="50" y="100" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e40af">Année 0</text>
      <text x="50" y="115" textAnchor="middle" fontSize="9" fill="#64748b">Vous versez</text>
      <circle cx="170" cy="80" r="6" fill="#f59e0b" />
      <text x="170" y="100" textAnchor="middle" fontSize="9" fontWeight="600" fill="#92400e">Années 1-7</text>
      <text x="170" y="115" textAnchor="middle" fontSize="9" fill="#64748b">Laissez fructifier</text>
      <circle cx="310" cy="80" r="9" fill="#22c55e" />
      <text x="310" y="100" textAnchor="middle" fontSize="9" fontWeight="600" fill="#166534">Année 8+</text>
      <text x="310" y="115" textAnchor="middle" fontSize="9" fill="#166534">Abattement</text>
      <text x="310" y="128" textAnchor="middle" fontSize="9" fontWeight="600" fill="#166534">€4,600 / an</text>
      <rect x="30" y="20" width="340" height="38" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
      <text x="200" y="35" textAnchor="middle" fontSize="10" fontWeight="600" fill="#334155">Enveloppe fiscale</text>
      <text x="200" y="50" textAnchor="middle" fontSize="9" fill="#64748b">Imposé seulement quand vous retirez</text>
    </svg>
  );
}

function PEADiagram() {
  return (
    <svg viewBox="0 0 400 140" className="mx-auto block h-auto w-full max-w-md">
      <line x1="30" y1="80" x2="370" y2="80" stroke="#cbd5e1" strokeWidth="2" />
      <circle cx="50" cy="80" r="6" fill="#3b82f6" />
      <text x="50" y="100" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e40af">Année 0</text>
      <text x="50" y="115" textAnchor="middle" fontSize="9" fill="#64748b">Ouverture</text>
      <circle cx="200" cy="80" r="6" fill="#ef4444" />
      <text x="200" y="100" textAnchor="middle" fontSize="9" fontWeight="600" fill="#991b1b">Avant 5 ans</text>
      <text x="200" y="115" textAnchor="middle" fontSize="9" fill="#991b1b">PFU 30%</text>
      <circle cx="340" cy="80" r="9" fill="#22c55e" />
      <text x="340" y="100" textAnchor="middle" fontSize="9" fontWeight="600" fill="#166534">Après 5 ans</text>
      <text x="340" y="115" textAnchor="middle" fontSize="9" fontWeight="600" fill="#166534">0% IR</text>
      <text x="340" y="128" textAnchor="middle" fontSize="8" fill="#64748b">(17.2% PS)</text>
      <rect x="30" y="20" width="340" height="38" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
      <text x="200" y="35" textAnchor="middle" fontSize="10" fontWeight="600" fill="#334155">Actions européennes · Plafond €150,000</text>
      <text x="200" y="50" textAnchor="middle" fontSize="9" fill="#64748b">Laisser pousser 5 ans minimum</text>
    </svg>
  );
}

function IRPMEDiagram() {
  return (
    <svg viewBox="0 0 400 160" className="mx-auto block h-auto w-full max-w-md">
      <rect x="20" y="20" width="120" height="50" rx="8" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="80" y="42" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e40af">Vous investissez</text>
      <text x="80" y="60" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e40af">€5,000</text>
      <line x1="145" y1="45" x2="178" y2="45" stroke="#64748b" strokeWidth="1.5" />
      <polygon points="178,41 185,45 178,49" fill="#64748b" />
      <rect x="190" y="20" width="180" height="50" rx="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
      <text x="280" y="40" textAnchor="middle" fontSize="9" fontWeight="600" fill="#166534">Réduction immédiate 25%</text>
      <text x="280" y="60" textAnchor="middle" fontSize="14" fontWeight="700" fill="#166534">€1,250</text>
      <rect x="90" y="90" width="220" height="55" rx="8" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.5" />
      <text x="200" y="110" textAnchor="middle" fontSize="10" fontWeight="600" fill="#991b1b">Capital à risque 5+ ans</text>
      <text x="200" y="130" textAnchor="middle" fontSize="14" fontWeight="700" fill="#991b1b">€3,750 exposés</text>
    </svg>
  );
}
