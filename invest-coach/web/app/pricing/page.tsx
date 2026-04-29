import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { PricingTable } from "@/components/pricing-table";

export const metadata = {
  title: "Tarifs — Invest Coach",
  description:
    "Trois formules pour piloter ton argent : Découverte gratuit, Investisseur 14 €/mois, Patrimoine 39 €/mois. Annulable en un clic. TVA française incluse.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Tarifs · Invest Coach",
    description:
      "Trois formules. Annulable en un clic. Annuel −20 %.",
    url: "/pricing",
    type: "website",
  },
};

export default function PricingPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/pricing" />

      <section
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 0%, var(--lavender-100) 0%, var(--paper-50) 60%, var(--paper-50) 100%)",
        }}
      >
        <div
          className="mx-auto px-6 pt-16 pb-2 text-center sm:px-8 sm:pt-20"
          style={{ maxWidth: "880px" }}
        >
          <div className="mb-6 flex justify-center">
            <span className="ic-pill">
              <span className="ic-pill-badge">Tarifs</span>
              Annulable en un clic · TVA française incluse
            </span>
          </div>
          <h1 className="ic-h1 mx-auto" style={{ maxWidth: "720px" }}>
            Trois formules. <em>Annule quand tu veux.</em>
          </h1>
          <p
            className="mx-auto mt-5 text-[17px]"
            style={{
              maxWidth: "560px",
              fontFamily: "var(--font-display)",
              color: "var(--fg-muted)",
              lineHeight: 1.55,
            }}
          >
            Découverte est gratuite, pour toujours. Tu passes payant seulement
            quand tu veux les outils — et tu peux faire marche arrière en un
            clic depuis ton portail.
          </p>
        </div>
      </section>

      <PricingTable />

      <section
        className="mx-auto px-6 py-16 sm:px-8"
        style={{ maxWidth: "720px" }}
      >
        <h2
          className="text-center text-[24px] font-bold sm:text-[28px]"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--ink-700)",
            letterSpacing: "-0.02em",
          }}
        >
          Questions fréquentes
        </h2>
        <dl className="mt-10 space-y-7">
          {FAQ.map((q) => (
            <div key={q.q}>
              <dt
                className="text-[17px] font-semibold"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--ink-700)",
                  letterSpacing: "-0.01em",
                }}
              >
                {q.q}
              </dt>
              <dd
                className="mt-2 text-[15px]"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--fg-muted)",
                  lineHeight: 1.6,
                }}
              >
                {q.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <Footer />
    </main>
  );
}

const FAQ: { q: string; a: string }[] = [
  {
    q: "Tu donnes des conseils en investissement personnalisés ?",
    a: "Non. Invest Coach est éducatif. On explique les mécanismes, on chiffre les leviers fiscaux statutaires, on compare les enveloppes — on ne te dit jamais d'acheter telle action ou tel fonds. Pour du conseil personnalisé, vois un CIF (Conseiller en Investissements Financiers) inscrit à l'ORIAS.",
  },
  {
    q: "Comment annuler ?",
    a: "Depuis /subscription une fois connecté, clique « Gérer mon abonnement » — tu arrives sur le portail Stripe, un clic et c'est fait. Pas d'email, pas de formulaire à remplir. L'accès reste actif jusqu'à la fin de la période payée.",
  },
  {
    q: "Pourquoi Annuel coûte 20 % moins cher ?",
    a: "Parce qu'on préfère savoir d'avance que tu restes 12 mois — ça nous laisse investir dans le contenu plutôt que dans des relances mensuelles. Si tu veux tester avant, prends Mensuel et passe Annuel quand tu es convaincu.",
  },
  {
    q: "Mes données restent en France ?",
    a: "Oui. La base est hébergée chez Supabase Europe (Francfort). Les paiements transitent par Stripe (RGPD-compliant). Aucune donnée n'est revendue, aucun pixel publicitaire tiers n'est chargé.",
  },
  {
    q: "Vous prenez ma banque en lecture seule, c'est sûr ?",
    a: "Oui — la connexion bancaire est en PSD2 via GoCardless, lecture seule, agrément ACPR. On lit tes opérations, on ne peut rien initier (ni virement, ni prélèvement). Tu révoques le consentement quand tu veux.",
  },
  {
    q: "Vous êtes combien dans l'équipe ?",
    a: "Petit. Une personne à plein temps, plus quelques contributeurs ponctuels (relecture fiscale, design). On édite la newsletter du dimanche depuis 2024 et le podcast depuis avril 2026. Si tu nous écris, tu auras une vraie réponse, pas un chatbot.",
  },
  {
    q: "Pourquoi pas un essai gratuit illimité ?",
    a: "Découverte EST l'essai gratuit. Tu lis le journal du dimanche, tu reçois 3 brèves par semaine, tu écoutes le podcast, tu accèdes au glossaire. Si après ça tu n'es pas convaincu d'aller plus loin, on a peut-être pas besoin du même produit.",
  },
];
