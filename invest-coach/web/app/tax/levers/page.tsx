import { Nav } from "@/components/nav";
import { DEV_USER_ID, IS_DEV } from "@/lib/devUser";
import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";

import { LeversContent } from "./content";

export const metadata = {
  title: "Les leviers fiscaux | Invest Coach",
  description:
    "Votre plan complet pour payer moins d'impôts en France — personnalisé selon votre salaire et votre situation, du plus simple au plus avancé.",
};

// Server wrapper: pre-fills the calculator from the user's existing
// tax_onboarding + tax_profiles rows if they're signed in (or the
// dev bypass user). Otherwise renders with sensible defaults
// (TMI 30% salarié célibataire, the modal French taxpayer).

type Onboarding = {
  situation: string | null;
  nb_enfants: number | null;
};

type TaxProfile = {
  revenu_imposable: number | null;
};

export default async function LeversPage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const userId = user?.id ?? (IS_DEV ? DEV_USER_ID : null);
  const db = user ? sb : IS_DEV ? serviceClient() : sb;

  const initial: { salary?: number; situation?: "single" | "couple"; nbEnfants?: number } = {};

  if (userId) {
    const [{ data: onb }, { data: prof }] = await Promise.all([
      db
        .from("tax_onboarding")
        .select("situation, nb_enfants")
        .eq("user_id", userId)
        .maybeSingle(),
      db
        .from("tax_profiles")
        .select("revenu_imposable")
        .eq("user_id", userId)
        .order("tax_year", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const onboarding = onb as Onboarding | null;
    const profile = prof as TaxProfile | null;

    if (profile?.revenu_imposable) {
      // Approximate back from imposable to net salary (inverse of 10% abattement)
      initial.salary = Math.round(profile.revenu_imposable / 0.9);
    }
    if (onboarding?.situation) {
      initial.situation =
        onboarding.situation === "marie" || onboarding.situation === "pacse"
          ? "couple"
          : "single";
    }
    if (onboarding?.nb_enfants != null) {
      initial.nbEnfants = onboarding.nb_enfants;
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Nav active="/tax" />
      <LeversContent initial={initial} />
    </main>
  );
}
