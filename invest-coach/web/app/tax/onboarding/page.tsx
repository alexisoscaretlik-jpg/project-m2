import { redirect } from "next/navigation";

import { Nav } from "@/components/nav";
import { DEV_USER_ID, IS_DEV } from "@/lib/devUser";
import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";

import { OnboardingForm } from "./onboarding-form";

type Onboarding = {
  profile_type: string | null;
  income_types: string[] | null;
  situation: string | null;
  nb_enfants: number | null;
  owns_real_estate: boolean | null;
  has_investments: boolean | null;
  has_crypto: boolean | null;
  goals: string[] | null;
  notes: string | null;
};

export default async function OnboardingPage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const userId = user?.id ?? (IS_DEV ? DEV_USER_ID : null);
  if (!userId) redirect("/login");
  const db = user ? sb : serviceClient();

  const { data } = await db
    .from("tax_onboarding")
    .select(
      "profile_type, income_types, situation, nb_enfants, owns_real_estate, has_investments, has_crypto, goals, notes",
    )
    .eq("user_id", userId)
    .maybeSingle();

  const initial = (data ?? undefined) as Onboarding | undefined;

  return (
    <main className="min-h-screen bg-muted">
      <Nav active="/tax" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold text-foreground">
          Votre profil fiscal
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cinq questions rapides. Plus vos réponses sont précises, plus
          les recommandations sont utiles — et plus vous économisez
          d&apos;impôts légalement.
        </p>

        <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <OnboardingForm initial={initial} />
        </div>
      </div>
    </main>
  );
}
