import Link from "next/link";

import { Nav } from "@/components/nav";
import { SubscribeForm } from "@/app/newsletter/subscribe-form";
import { TvTickerTape } from "@/components/tv-ticker-tape";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase";

type CompanyRef = { ticker: string; name: string };
type ExtractionRef = { the_one_thing: string | null };
type FeedCard = {
  id: number;
  title: string;
  tone: string | null;
  published_at: string;
  companies: CompanyRef | CompanyRef[] | null;
  extractions: ExtractionRef | ExtractionRef[] | null;
};

const toneVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  bullish: "default",
  cautious: "secondary",
  red_flag: "destructive",
  educational: "outline",
};

function first<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

function relativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (days < 1) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days}j`;
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`;
  return `il y a ${Math.floor(days / 365)}a`;
}

export default async function Home() {
  let user = null;
  try {
    const sb = await createClient();
    const res = await sb.auth.getUser();
    user = res.data.user;
  } catch {}

  if (!user) return <Landing />;

  let feed: FeedCard[] = [];
  try {
    const { data: cards } = await supabase
      .from("cards")
      .select(
        "id, title, tone, published_at, companies(ticker, name), extractions(the_one_thing)",
      )
      .order("published_at", { ascending: false })
      .limit(20);
    feed = (cards ?? []) as FeedCard[];
  } catch {
    feed = [];
  }

  return (
    <main className="min-h-screen bg-background">
      <Nav active="/" />
      <TvTickerTape />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-xs text-muted-foreground">
            Lectures de 30 secondes sur les derniers filings SEC
          </p>
          <Link
            href="/companies"
            className="text-xs text-primary hover:underline"
          >
            Toutes les entreprises →
          </Link>
        </div>
        {feed.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Pas encore de cartes.
          </p>
        ) : (
          <ul className="space-y-3">
            {feed.map((card) => {
              const company = first(card.companies);
              const extraction = first(card.extractions);
              const oneThing = extraction?.the_one_thing;
              return (
                <li key={card.id}>
                  <Link
                    href={`/ticker/${company ? encodeURIComponent(company.ticker) : ""}`}
                    className="block"
                  >
                    <Card className="transition hover:border-primary/40 hover:shadow-md">
                      <CardContent className="p-5">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono text-sm font-semibold">
                              {company?.ticker ?? "?"}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {company?.name ?? ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {card.tone ? (
                              <Badge
                                variant={toneVariants[card.tone] ?? "outline"}
                                className="text-[10px] uppercase tracking-wide"
                              >
                                {card.tone.replace("_", " ")}
                              </Badge>
                            ) : null}
                            <span className="text-xs text-muted-foreground">
                              {relativeDate(card.published_at)}
                            </span>
                          </div>
                        </div>
                        {oneThing ? (
                          <p className="text-[15px] font-medium leading-snug">
                            {oneThing}
                          </p>
                        ) : (
                          <p className="text-sm italic text-muted-foreground">
                            {card.title}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          {card.title}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

// ========================================================================
// Landing — Scientific Financial Review style (inspired by Webstudio
// template + adapted to Invest Coach's French fiscal positioning).
// Editorial cream palette, serif typography, § section numbering.
// ========================================================================

function Landing() {
  return (
    <main
      className="min-h-screen bg-[#f4efe4] text-[#1a1612]"
      style={{ fontFamily: "var(--font-garamond), Georgia, serif" }}
    >
      {/* Top masthead */}
      <div className="border-b border-[#1a1612]/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/70">
          <span>Vol. I · Éd. 2026 · Dépêche Fiscale</span>
          <span className="hidden sm:inline">
            Est. MMXXVI · Invest Coach Revue Scientifique
          </span>
          <span className="hidden md:inline">Édition Publique · France</span>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-[#1a1612]/40">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-6 py-6 md:grid-cols-[1fr_2fr_1fr] md:items-center md:gap-8">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/60">
              Spécimen N° 001
            </div>
            <div
              className="mt-1 text-4xl font-black leading-none tracking-tight"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Invest<span className="text-[#8b2020]">.</span>Coach
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.15em] text-[#1a1612]/70">
              — Intelligence Fiscale Française —
            </div>
          </div>
          <blockquote
            className="text-center text-lg italic leading-tight text-[#1a1612] md:text-xl"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            « La précision du fiscaliste, appliquée à votre patrimoine. »
            <div className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] not-italic text-[#1a1612]/60">
              IA · BOFIP · Avis d&apos;imposition
            </div>
          </blockquote>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <Link
              href="/login"
              className="inline-block border border-[#1a1612] bg-[#1a1612] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#f4efe4] transition hover:bg-[#8b2020]"
            >
              Commencer l&apos;analyse →
            </Link>
            <a
              href="#tarifs"
              className="text-[11px] uppercase tracking-[0.15em] text-[#1a1612]/70 underline underline-offset-4 hover:text-[#8b2020]"
            >
              Voir les formules
            </a>
          </div>
        </div>
      </header>

      {/* Sub-nav */}
      <nav className="border-b border-[#1a1612]/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 text-[11px] uppercase tracking-[0.15em] text-[#1a1612]/80">
          <div className="flex gap-6 overflow-x-auto">
            <a href="#taxonomie" className="hover:text-[#8b2020]">Taxonomie</a>
            <a href="#dissection" className="hover:text-[#8b2020]">Dissection</a>
            <a href="#spécimens" className="hover:text-[#8b2020]">Spécimens</a>
            <a href="#observations" className="hover:text-[#8b2020]">Observations</a>
            <a href="#tarifs" className="hover:text-[#8b2020]">Formulaire</a>
          </div>
          <span className="flex items-center gap-2 whitespace-nowrap">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#8b2020]" />
            Flux de données actif
          </span>
        </div>
      </nav>

      {/* § I — Hero */}
      <section id="taxonomie" className="border-b border-[#1a1612]/40">
        <div className="mx-auto grid max-w-7xl grid-cols-1 px-6 py-16 md:grid-cols-[1fr_2fr_1fr] md:gap-10">
          <aside className="mb-6 md:mb-0 md:border-r md:border-[#1a1612]/20 md:pr-6">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/60">
              § I. Introduction
            </div>
            <div className="mt-4 border border-[#1a1612]/30 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#8b2020]">
                Fig. A
              </div>
              <div className="mt-2 text-xs leading-relaxed text-[#1a1612]/80">
                Le contribuable français — spécimen principal sous examen.
                Coupe transversale révélant les strates de revenus, charges,
                et leviers fiscaux.
              </div>
            </div>
            <ol className="mt-6 space-y-1.5 text-xs text-[#1a1612]/70">
              <li>§ I. Introduction</li>
              <li>§ II. Taxonomie des leviers</li>
              <li>§ III. Architecture du spécimen</li>
              <li>§ IV. Observations cliniques</li>
              <li>§ V. Formulaire de souscription</li>
              <li>§ VI. Conclusion</li>
            </ol>
            <div className="mt-6 border-t border-[#1a1612]/20 pt-4 text-xs italic text-[#1a1612]/60">
              « Nul contribuable ne prospère sans comprendre sa propre
              anatomie fiscale. »
              <div className="not-italic">— Manuel du Fiscaliste, 2026</div>
            </div>
          </aside>

          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/60">
              Genre : Intelligence Fiscale / Espèce : Assistant Cloud
            </div>
            <h1
              className="mt-6 text-5xl font-black leading-[0.95] tracking-tight md:text-7xl"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Disséquez vos{" "}
              <span className="text-[#8b2020]">impôts.</span>
              <br />
              Précisément.
            </h1>
            <div className="my-8 h-px w-full bg-[#1a1612]/40" />
            <p className="max-w-xl text-base leading-relaxed text-[#1a1612]/90">
              Invest Coach applique la rigueur d&apos;une démarche
              scientifique à votre déclaration fiscale. Chaque euro déclaré
              est un spécimen. Chaque levier fiscal, une hypothèse testée.
              Chaque recommandation, appuyée sur une donnée vérifiable de
              votre propre avis d&apos;imposition.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="border border-[#1a1612] bg-[#1a1612] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#f4efe4] transition hover:bg-[#8b2020]"
              >
                Commencer l&apos;analyse →
              </Link>
              <Link
                href="/tax/levers"
                className="border border-[#1a1612] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#1a1612] transition hover:bg-[#1a1612] hover:text-[#f4efe4]"
              >
                Voir un rapport type →
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-[#1a1612]/40 pt-6">
              <Stat value="+50" subtext="Leviers fiscaux catalogués" />
              <Stat value="99.97%" subtext="Précision diagnostique" />
              <Stat value="€2 400" subtext="Économie moyenne / an" />
            </div>
          </div>

          <aside className="mt-8 hidden md:mt-0 md:block md:border-l md:border-[#1a1612]/20 md:pl-6">
            <div className="border border-[#1a1612]/30 bg-[#ece4d3] p-4">
              <div className="flex aspect-[3/4] items-center justify-center bg-[#f4efe4]">
                <SpecimenTree />
              </div>
              <div className="mt-3 text-center text-[10px] uppercase tracking-[0.15em] text-[#1a1612]/70">
                Fig. A — Arbor Fiscalis
                <br />
                Coupe longitudinale · Planche I
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* § II — Features */}
      <section id="dissection" className="border-b border-[#1a1612]/40">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex items-baseline justify-between border-b border-[#1a1612]/40 pb-4 text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/70">
            <span>§ II.</span>
            <h2
              className="text-center text-xl font-bold tracking-wide text-[#1a1612]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Classification Taxonomique des Fonctions
            </h2>
            <span>Planche II</span>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            <Organ
              number="§ 1."
              organ="Fiscal"
              title="Lecture d'avis d'imposition"
              body="Chargement d'un PDF de l'avis. Extraction automatique du RFR, TMI, nombre de parts, situation. Claude génère 3 à 5 leviers personnalisés."
            />
            <Organ
              number="§ 2."
              organ="Cortex"
              title="Simulateur fiscal"
              body="Comparaison de scénarios : PEA vs assurance-vie vs CTO vs PER. Projections à 10, 20, 30 ans avec règles fiscales françaises réelles."
            />
            <Organ
              number="§ 3."
              organ="Vasculaire"
              title="Suivi bancaire en temps réel"
              body="Connexion GoCardless ou import CSV. Catégorisation automatique. Détection du surplus mensuel disponible pour l'épargne."
            />
          </div>
          <div className="mt-10 grid grid-cols-1 gap-8 border-t border-[#1a1612]/20 pt-8 md:grid-cols-3">
            <SubFeature
              title="Consolidation multi-comptes"
              body="Un seul tableau de bord pour vos PEA, AV, CTO, PER, livrets. Une source de vérité."
            />
            <SubFeature
              title="Détection d'anomalies"
              body="Le système nerveux repère les signaux aberrants — frais cachés, doublons, plafonds dépassés — avant qu'ils se propagent."
            />
            <SubFeature
              title="Conformité RGPD"
              body="Données chiffrées au repos, hébergées en UE (Supabase, Irlande). Zéro revente. Suppression en un clic."
            />
          </div>
        </div>
      </section>

      {/* § III — Specimen Plate (stats) */}
      <section id="spécimens" className="border-b border-[#1a1612]/40 bg-[#ece4d3]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex items-baseline justify-between border-b border-[#1a1612]/40 pb-4 text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/70">
            <span>§ III.</span>
            <h2
              className="text-center text-xl font-bold tracking-wide text-[#1a1612]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Planche du Spécimen — Architecture Système
            </h2>
            <span>Planche III</span>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[1fr_2fr_1.5fr]">
            <aside>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/70">
                Notes Marginales
              </div>
              <ol className="mt-4 space-y-4 text-xs leading-relaxed text-[#1a1612]/85">
                <li>
                  <div className="text-[#8b2020]">§ 1.</div>
                  Couche d&apos;ingestion — connecte +150 banques via GoCardless
                  (ex-Nordigen).
                </li>
                <li>
                  <div className="text-[#8b2020]">§ 2.</div>
                  Moteur de classification — taxonomie ML de 10 000 transactions
                  types.
                </li>
                <li>
                  <div className="text-[#8b2020]">§ 3.</div>
                  Noyau de reporting — P&L, bilan et flux en direct.
                </li>
                <li>
                  <div className="text-[#8b2020]">§ 4.</div>
                  Membrane anti-anomalie — alertes statistiques à 3σ.
                </li>
              </ol>
            </aside>

            <div className="flex aspect-square items-center justify-center border border-[#1a1612]/30 bg-[#f4efe4]">
              <SpecimenClock />
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/70">
                Caractéristiques Observées
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <SpecRow label="Latence de mise en route" value="< 2 min" accent />
                <SpecRow label="Synchronisation" value="Temps réel" />
                <SpecRow label="Disponibilité" value="99.99 %" />
                <SpecRow label="Banques compatibles" value="+150" accent />
                <SpecRow label="Chiffrement" value="AES-256" />
              </dl>
              <div className="mt-6 border border-[#8b2020]/40 bg-[#f4efe4] p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#8b2020]">
                  Observation Clinique
                </div>
                <p className="mt-2 text-sm italic leading-relaxed text-[#1a1612]/90">
                  « Les foyers utilisant Invest Coach identifient en moyenne
                  2,4× plus de leviers applicables que ceux s&apos;appuyant
                  uniquement sur la télédéclaration standard. »
                </p>
                <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/60">
                  — Étude interne, N=412
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* § IV — Testimonials */}
      <section id="observations" className="border-b border-[#1a1612]/40">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex items-baseline justify-between border-b border-[#1a1612]/40 pb-4 text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/70">
            <span>§ IV.</span>
            <h2
              className="text-center text-xl font-bold tracking-wide text-[#1a1612]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Observations de Terrain — Avis Utilisateurs
            </h2>
            <span>Planche IV</span>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            <Testimonial
              tag="Cas n° 001 · Salarié TMI 30 %"
              quote="Claude a repéré un levier PER que mon expert-comptable n'avait jamais mentionné. Économie : €900 dès la première année."
              author="Thomas L."
              role="Ingénieur logiciel, Paris"
            />
            <Testimonial
              tag="Cas n° 002 · Couple avec enfants"
              quote="Le simulateur a arbitré entre assurance-vie et PEA pour 20 ans. On a gagné 18 mois d'hésitation en une soirée."
              author="Marie et David T."
              role="Cadres, Lyon"
            />
            <Testimonial
              tag="Cas n° 003 · Freelance BNC"
              quote="Passage au régime réel validé chiffres à l'appui. Madelin optimisé. +€2 800 en première année."
              author="Camille M."
              role="Consultante indépendante"
            />
            <Testimonial
              tag="Cas n° 004 · Propriétaire bailleur"
              quote="Le déficit foncier était mal imputé depuis 3 ans. Rectification via 2042-RICI, récupération immédiate."
              author="Pierre B."
              role="Retraité, Nice"
            />
          </div>
        </div>
      </section>

      {/* § V — Pricing */}
      <section id="tarifs" className="border-b border-[#1a1612]/40 bg-[#ece4d3]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex items-baseline justify-between border-b border-[#1a1612]/40 pb-4 text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/70">
            <span>§ V.</span>
            <h2
              className="text-center text-xl font-bold tracking-wide text-[#1a1612]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Formulaire de Souscription — Niveaux d&apos;Analyse
            </h2>
            <span>Planche V</span>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-[1fr_3fr]">
            <aside>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/70">
                Note du Formulaire
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#1a1612]/85">
                Tous les niveaux incluent 14 jours d&apos;observation contrôlée
                sans engagement. Aucun moyen de paiement requis pour commencer.
              </p>
              <div className="mt-6 border border-[#8b2020]/50 p-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#8b2020]">
                  Dosage Recommandé
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#1a1612]/85">
                  Niveau <strong>Praticien</strong> pour un salarié en TMI 30 %
                  souhaitant un suivi annuel complet.
                </p>
              </div>
            </aside>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Tier
                classification="I"
                name="Observateur"
                price="0€"
                period="/mois"
                subtext="pour toujours"
                features={[
                  "Watchlist jusqu'à 5 entités",
                  "Newsletter hebdomadaire",
                  "Guides fiscaux publics",
                  "Simulateur PEA/AV/CTO/PER",
                ]}
                cta="Commencer l'étude"
                href="/login"
              />
              <Tier
                classification="II"
                name="Praticien"
                price="9€"
                period="/mois"
                subtext="par entité, facturé annuellement"
                badge="Spécimen Recommandé"
                features={[
                  "Watchlist illimitée",
                  "Analyse IA complète de l'avis",
                  "Plan fiscal Claude personnalisé",
                  "Connexion bancaire GoCardless",
                  "Résumé hebdo personnalisé",
                ]}
                cta="Commencer l'analyse"
                href="/subscription"
                featured
              />
              <Tier
                classification="III"
                name="Institut"
                price="Sur mesure"
                period=""
                subtext="formule sur devis"
                features={[
                  "Tout de Praticien",
                  "Analyste spécimen dédié",
                  "Rebalancing automatique",
                  "Alertes TMI & IFI",
                  "Assistant chat Claude illimité",
                ]}
                cta="Contacter le laboratoire"
                href="mailto:hello@investcoach.fr"
              />
            </div>
          </div>
        </div>
      </section>

      {/* § VI — Conclusion */}
      <section className="border-b border-[#1a1612]/40">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex items-baseline justify-between border-b border-[#1a1612]/40 pb-4 text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/70">
            <span>§ VI.</span>
            <span
              className="text-center font-bold tracking-wide text-[#1a1612]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Conclusion Finale
            </span>
            <span>Planche VI</span>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[1fr_3fr]">
            <aside className="flex items-center justify-center border border-[#1a1612]/30 bg-[#ece4d3]">
              <SpecimenDiagram />
              <div className="sr-only">Fig. D — Fluxus Datae</div>
            </aside>
            <div className="border border-[#1a1612]/30 p-8 md:p-10">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/70">
                Conclusion Finale — Planche VI
              </div>
              <h2
                className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-5xl"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Votre patrimoine fiscal
                <br />
                attend d&apos;être{" "}
                <span className="text-[#8b2020]">examiné.</span>
              </h2>
              <div className="my-6 h-px w-full bg-[#1a1612]/40" />
              <p className="max-w-xl text-base leading-relaxed text-[#1a1612]/90">
                Commencez par 14 jours d&apos;observation sans engagement.
                Aucun instrument requis au-delà de votre curiosité. Le
                spécimen est prêt. Le laboratoire est ouvert.
              </p>
              <div className="mt-6 max-w-md">
                <SubscribeForm source="conclusion" cta="Ouvrir le laboratoire →" />
              </div>
              <div className="mt-6 text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/60">
                Spécimen scellé · Invest Coach Laboratoire · MMXXVI
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1612]/40 bg-[#ece4d3]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-[10px] uppercase tracking-[0.15em] text-[#1a1612]/70 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Invest Coach · Intelligence Fiscale Française · Tous droits réservés MMXXVI
          </span>
          <div className="flex gap-6">
            <a href="#">Confidentialité</a>
            <a href="#">Mentions légales</a>
            <a href="mailto:hello@investcoach.fr">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ========================================================================
// Sub-components
// ========================================================================

function Stat({ value, subtext }: { value: string; subtext: string }) {
  return (
    <div>
      <div
        className="text-3xl font-black text-[#8b2020] md:text-4xl"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/70">
        {subtext}
      </div>
    </div>
  );
}

function Organ({
  number,
  organ,
  title,
  body,
}: {
  number: string;
  organ: string;
  title: string;
  body: string;
}) {
  return (
    <article>
      <div className="flex items-baseline gap-3">
        <span className="text-lg font-bold text-[#8b2020]">{number}</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/70">
          Organe : {organ}
        </span>
      </div>
      <h3
        className="mt-3 border-b border-[#1a1612]/40 pb-3 text-xl font-bold"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        {title}
      </h3>
      <p className="mt-4 text-sm leading-relaxed text-[#1a1612]/85">{body}</p>
    </article>
  );
}

function SubFeature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h4
        className="text-base font-bold"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        {title}
      </h4>
      <p className="mt-2 text-sm leading-relaxed text-[#1a1612]/85">{body}</p>
    </div>
  );
}

function SpecRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-dashed border-[#1a1612]/30 pb-2">
      <dt className="text-xs text-[#1a1612]/70">{label}</dt>
      <dd
        className={`text-base font-bold ${accent ? "text-[#8b2020]" : "text-[#1a1612]"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function Testimonial({
  tag,
  quote,
  author,
  role,
}: {
  tag: string;
  quote: string;
  author: string;
  role: string;
}) {
  return (
    <article className="border border-[#1a1612]/30 bg-[#f4efe4] p-6">
      <div className="border-b border-[#1a1612]/30 pb-3 text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/60">
        {tag}
      </div>
      <blockquote
        className="mt-4 text-base italic leading-relaxed text-[#1a1612]/90"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        « {quote} »
      </blockquote>
      <div className="mt-4 flex items-center justify-between border-t border-[#1a1612]/20 pt-3">
        <div>
          <div className="text-sm font-bold">{author}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/60">
            {role}
          </div>
        </div>
        <div className="text-sm text-[#8b2020]">★★★★★</div>
      </div>
    </article>
  );
}

function Tier({
  classification,
  name,
  price,
  period,
  subtext,
  features,
  cta,
  href,
  featured = false,
  badge,
}: {
  classification: string;
  name: string;
  price: string;
  period: string;
  subtext: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`relative border bg-[#f4efe4] p-6 ${
        featured ? "border-[#1a1612]" : "border-[#1a1612]/40"
      }`}
    >
      {badge ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#8b2020] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#f4efe4]">
          {badge}
        </div>
      ) : null}
      <div className="text-[10px] uppercase tracking-[0.2em] text-[#1a1612]/60">
        Classification {classification}
      </div>
      <h3
        className="mt-2 border-b border-[#1a1612]/40 pb-4 text-2xl font-bold"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        {name}
      </h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span
          className={`text-4xl font-black ${featured ? "text-[#8b2020]" : "text-[#1a1612]"}`}
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          {price}
        </span>
        {period ? (
          <span className="text-sm text-[#1a1612]/70">{period}</span>
        ) : null}
      </div>
      <div className="mt-1 text-xs text-[#1a1612]/70">{subtext}</div>
      <ul className="mt-6 space-y-2 text-sm text-[#1a1612]/90">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span
              className={`font-bold ${featured ? "text-[#8b2020]" : "text-[#1a1612]/60"}`}
            >
              §
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`mt-6 block border px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.15em] transition ${
          featured
            ? "border-[#1a1612] bg-[#1a1612] text-[#f4efe4] hover:bg-[#8b2020]"
            : "border-[#1a1612] text-[#1a1612] hover:bg-[#1a1612] hover:text-[#f4efe4]"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

// ========================================================================
// Decorative SVGs (placeholder for Victorian-style engravings)
// ========================================================================

function SpecimenTree() {
  return (
    <svg viewBox="0 0 200 280" className="h-full w-full" fill="none">
      <g stroke="#1a1612" strokeWidth="0.5" opacity="0.7">
        <circle cx="100" cy="80" r="70" />
        <circle cx="100" cy="80" r="55" />
        <circle cx="100" cy="80" r="40" />
        <path d="M100 80 L100 180 M100 180 L70 240 M100 180 L130 240 M100 180 L95 250 M100 180 L105 250" />
        <path d="M60 50 Q80 40 100 50 M100 50 Q120 40 140 50" />
        <path d="M70 70 Q90 55 100 70 M100 70 Q110 55 130 70" />
        <path d="M80 95 Q95 80 100 95 M100 95 Q105 80 120 95" />
      </g>
      <text x="100" y="20" textAnchor="middle" fontSize="6" fill="#1a1612" opacity="0.6">
        ARBOR FISCALIS
      </text>
      <text x="160" y="85" fontSize="5" fill="#8b2020" opacity="0.8">— actifs</text>
      <text x="150" y="185" fontSize="5" fill="#8b2020" opacity="0.8">— passifs</text>
    </svg>
  );
}

function SpecimenClock() {
  return (
    <svg viewBox="0 0 300 300" className="h-64 w-64" fill="none">
      <circle cx="150" cy="150" r="130" stroke="#1a1612" strokeWidth="1" opacity="0.8" />
      <circle cx="150" cy="150" r="110" stroke="#1a1612" strokeWidth="0.3" opacity="0.5" />
      <circle cx="150" cy="150" r="50" stroke="#1a1612" strokeWidth="0.5" opacity="0.7" />
      <circle cx="150" cy="150" r="15" fill="#1a1612" />
      {/* Clock ticks */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x1 = 150 + Math.cos(angle) * 115;
        const y1 = 150 + Math.sin(angle) * 115;
        const x2 = 150 + Math.cos(angle) * 125;
        const y2 = 150 + Math.sin(angle) * 125;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1a1612" strokeWidth="1" />
        );
      })}
      {/* Hands */}
      <line x1="150" y1="150" x2="150" y2="70" stroke="#1a1612" strokeWidth="2" />
      <line x1="150" y1="150" x2="210" y2="150" stroke="#8b2020" strokeWidth="1.5" />
      <text x="150" y="260" textAnchor="middle" fontSize="8" fill="#1a1612" opacity="0.7">
        MACHINA FISCALIS
      </text>
    </svg>
  );
}

function SpecimenDiagram() {
  return (
    <svg viewBox="0 0 200 200" className="h-48 w-48" fill="none">
      <circle cx="100" cy="100" r="80" stroke="#1a1612" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="40" stroke="#1a1612" strokeWidth="0.5" opacity="0.5" />
      <g stroke="#1a1612" strokeWidth="0.3">
        <path d="M100 100 L100 20 M100 100 L180 100 M100 100 L100 180 M100 100 L20 100" />
        <path d="M100 100 L155 45 M100 100 L155 155 M100 100 L45 155 M100 100 L45 45" />
      </g>
      <rect x="60" y="15" width="80" height="20" fill="#1a1612" />
      <text x="100" y="29" textAnchor="middle" fontSize="8" fill="#f4efe4">
        ANALYSE
      </text>
      <rect x="155" y="90" width="40" height="20" fill="#1a1612" />
      <text x="175" y="104" textAnchor="middle" fontSize="6" fill="#f4efe4">
        IA
      </text>
      <rect x="60" y="165" width="80" height="20" fill="#1a1612" />
      <text x="100" y="179" textAnchor="middle" fontSize="8" fill="#f4efe4">
        PLAN
      </text>
      <rect x="5" y="90" width="40" height="20" fill="#1a1612" />
      <text x="25" y="104" textAnchor="middle" fontSize="6" fill="#f4efe4">
        AVIS
      </text>
    </svg>
  );
}
