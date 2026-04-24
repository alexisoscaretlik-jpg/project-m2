"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { DEV_USER_ID, IS_DEV } from "@/lib/devUser";
import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";

// Allowed values — kept in sync with the CHECK constraints in
// supabase/migrations/2026-04-24-tax-onboarding.sql
const PROFILE_TYPES = [
  "salarie",
  "freelance_micro",
  "freelance_reel",
  "mixte",
  "retraite",
  "etudiant",
  "sans_emploi",
  "other",
] as const;

const SITUATIONS = [
  "celibataire",
  "pacse",
  "marie",
  "separe",
  "veuf",
  "divorce",
] as const;

const INCOME_TYPE_VALUES = [
  "salaire",
  "bnc",
  "bic",
  "dividendes",
  "foncier",
  "plus_values",
  "crypto",
  "autre",
] as const;

const GOAL_VALUES = [
  "reduce_tax",
  "optimize_investments",
  "prepare_retirement",
  "start_freelance",
  "transmit_wealth",
] as const;

function pickAll(fd: FormData, key: string, allowed: readonly string[]): string[] {
  return fd.getAll(key).map(String).filter((v) => allowed.includes(v));
}

export async function saveOnboarding(formData: FormData) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const userId = user?.id ?? (IS_DEV ? DEV_USER_ID : null);
  if (!userId) return { error: "Not signed in" };

  const profile_type = String(formData.get("profile_type") ?? "");
  if (!PROFILE_TYPES.includes(profile_type as (typeof PROFILE_TYPES)[number])) {
    return { error: "Sélectionnez votre profil" };
  }

  const situationRaw = String(formData.get("situation") ?? "");
  const situation = SITUATIONS.includes(situationRaw as (typeof SITUATIONS)[number])
    ? situationRaw
    : null;

  const nb_enfants = Math.max(0, Math.min(20, Number(formData.get("nb_enfants") ?? 0) || 0));

  const income_types = pickAll(formData, "income_types", INCOME_TYPE_VALUES);
  const goals = pickAll(formData, "goals", GOAL_VALUES);

  const owns_real_estate = formData.get("owns_real_estate") === "on";
  const has_investments = formData.get("has_investments") === "on";
  const has_crypto = formData.get("has_crypto") === "on";

  const notes = String(formData.get("notes") ?? "").slice(0, 2000) || null;

  const svc = serviceClient();
  const { error } = await svc
    .from("tax_onboarding")
    .upsert(
      {
        user_id: userId,
        profile_type,
        income_types,
        situation,
        nb_enfants,
        owns_real_estate,
        has_investments,
        has_crypto,
        goals,
        notes,
        answered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) return { error: `Save failed: ${error.message}` };

  revalidatePath("/tax");
  redirect("/tax");
}
