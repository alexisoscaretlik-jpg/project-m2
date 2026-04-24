"use server";

import { revalidatePath } from "next/cache";

import { DEV_USER_ID, IS_DEV } from "@/lib/devUser";
import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";

// The full set of answer refs the wizard can collect.
// Keep in sync with wizard.tsx QUESTIONS and the orchestrator prompt.
const ALLOWED_REFS = new Set([
  "couple",
  "salaire_net_1",
  "salaire_net_2",
  "pensions",
  "has_dividendes",
  "dividendes_montant",
  "has_per",
  "per_montant",
  "has_dons",
  "dons_montant",
  "emploi_domicile",
  "has_foncier",
  "foncier_montant",
  "notes",
]);

function sanitizeAnswers(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!ALLOWED_REFS.has(k)) continue;
    // Coerce obvious types to keep the jsonb column clean.
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null) {
      out[k] = v;
    }
  }
  return out;
}

export async function saveWizard(
  answers: Record<string, unknown>,
): Promise<{ ok: true } | { error: string }> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const userId = user?.id ?? (IS_DEV ? DEV_USER_ID : null);
  if (!userId) return { error: "Non connecté" };

  const clean = sanitizeAnswers(answers);

  // Use service role to bypass the table's insert-deny RLS (this is
  // the same pattern as the Typeform webhook: writes always go
  // through the server, never from the user cookie).
  const svc = serviceClient();
  const { error } = await svc.from("typeform_responses").upsert(
    {
      user_id: userId,
      form_id: "local-wizard",             // marker that this came from the in-app wizard, not Typeform
      response_id: `local-${userId}`,      // deterministic — upserts overwrite on re-submit
      submitted_at: new Date().toISOString(),
      answers: clean,
      raw_payload: { source: "local-wizard", version: 1 },
    },
    { onConflict: "response_id" },
  );

  if (error) return { error: `Enregistrement échoué : ${error.message}` };

  revalidatePath("/tax");
  revalidatePath("/tax/declaration");
  return { ok: true };
}

/**
 * Minimal helper so the wizard can quickly check "have we already
 * got a response for this user?" without a round trip through the
 * orchestrator.
 */
export async function getExistingWizardAnswers(): Promise<Record<string, unknown> | null> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const userId = user?.id ?? (IS_DEV ? DEV_USER_ID : null);
  if (!userId) return null;
  const db = user ? sb : serviceClient();

  const { data } = await db
    .from("typeform_responses")
    .select("answers")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.answers ?? null) as Record<string, unknown> | null;
}
