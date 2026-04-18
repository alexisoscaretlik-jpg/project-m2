"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";
import { extractAvis, recommend } from "@/lib/tax/claude";

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
  if (!user) return { error: "Not signed in" };

  const buf = Buffer.from(await file.arrayBuffer());
  const base64 = buf.toString("base64");

  let extraction;
  try {
    extraction = await extractAvis(base64);
  } catch (e) {
    return { error: `Extraction failed: ${(e as Error).message}` };
  }

  let recommendations;
  try {
    recommendations = await recommend(extraction);
  } catch (e) {
    return { error: `Recommendations failed: ${(e as Error).message}` };
  }

  // Store raw PDF in private bucket keyed by user + year.
  const svc = serviceClient();
  const path = `${user.id}/${extraction.tax_year}.pdf`;
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
        user_id: user.id,
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
  if (!user) return;

  const svc = serviceClient();
  await svc.storage.from("tax-docs").remove([`${user.id}/${year}.pdf`]);
  await svc
    .from("tax_profiles")
    .delete()
    .eq("user_id", user.id)
    .eq("tax_year", year);

  revalidatePath("/tax");
}
