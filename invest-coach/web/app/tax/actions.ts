"use server";

import { revalidatePath } from "next/cache";

import { DEV_USER_ID, IS_DEV } from "@/lib/devUser";
import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";
import { extractAvis, recommend, type TaxOnboarding } from "@/lib/tax/claude";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function uploadAvis(formData: FormData) {
  const file = formData.get("avis");
  if (!(file instanceof File)) return { error: "No file" };
  if (file.size === 0) return { error: "Empty file" };
  if (file.size > MAX_BYTES) return { error: "File too large (max 8 MB)" };
  if (file.type !== "application/pdf") return { error: "PDF only" };

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const userId = user?.id ?? (IS_DEV ? DEV_USER_ID : null);
  if (!userId) return { error: "Not signed in" };

  const buf = Buffer.from(await file.arrayBuffer());
  const base64 = buf.toString("base64");

  let extraction;
  try {
    extraction = await extractAvis(base64);
  } catch (e) {
    return { error: `Extraction failed: ${(e as Error).message}` };
  }

  // Pull the onboarding record (if the user filled it) so the
  // recommender can tailor advice to the declared profile.
  const onboardingDb = user ? sb : serviceClient();
  const { data: onboardingRow } = await onboardingDb
    .from("tax_onboarding")
    .select(
      "profile_type, income_types, situation, nb_enfants, owns_real_estate, has_investments, has_crypto, goals, notes",
    )
    .eq("user_id", userId)
    .maybeSingle();
  const onboarding = (onboardingRow ?? null) as TaxOnboarding | null;

  let recommendations;
  try {
    recommendations = await recommend(extraction, onboarding);
  } catch (e) {
    return { error: `Recommendations failed: ${(e as Error).message}` };
  }

  // Store raw PDF in private bucket keyed by user + year.
  const svc = serviceClient();
  const path = `${userId}/${extraction.tax_year}.pdf`;
  const { error: upErr } = await svc.storage
    .from("tax-docs")
    .upload(path, buf, { contentType: "application/pdf", upsert: true });
  if (upErr) {
    return { error: `Upload failed: ${upErr.message}` };
  }

  const { error: dbErr } = await svc
    .from("tax_profiles")
    .upsert(
      {
        user_id: userId,
        tax_year: extraction.tax_year,
        rfr: extraction.rfr,
        revenu_imposable: extraction.revenu_imposable,
        parts: extraction.parts,
        impot_revenu: extraction.impot_revenu,
        tmi: extraction.tmi,
        situation: extraction.situation,
        nb_enfants: extraction.nb_enfants,
        source_path: path,
        raw_extraction: extraction,
        recommendations,
      },
      { onConflict: "user_id,tax_year" },
    );
  if (dbErr) return { error: `DB write failed: ${dbErr.message}` };

  revalidatePath("/tax");
  return { ok: true };
}

export async function deleteAvis(formData: FormData) {
  const year = Number(formData.get("tax_year"));
  if (!year) return;

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const userId = user?.id ?? (IS_DEV ? DEV_USER_ID : null);
  if (!userId) return;

  const svc = serviceClient();
  await svc.storage.from("tax-docs").remove([`${userId}/${year}.pdf`]);
  await svc
    .from("tax_profiles")
    .delete()
    .eq("user_id", userId)
    .eq("tax_year", year);

  revalidatePath("/tax");
}
