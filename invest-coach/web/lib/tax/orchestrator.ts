// Orchestrator — pulls everything the user has given us (onboarding,
// last avis, typeform responses) and produces a filled Cerfa 2042 PDF.
//
// This is the "Claude as orchestrator" pattern you asked about.
// Flow:
//   1. Load all three inputs from Supabase in parallel.
//   2. Hand them to mapToCerfa() — Claude decides which boxes fill.
//   3. Hand the mapping to fillCerfa2042() — pdf-lib writes the PDF.
//   4. Return bytes + diagnostics (which codes filled, which didn't).
//
// The Gemini reader (extractAvisGemini in lib/tax/gemini.ts) is NOT
// called here because the avis is already extracted and stored in
// tax_profiles at upload time. Gemini is exposed as an alternative
// extractor inside the /tax upload flow — a separate concern.

import { serviceClient } from "@/lib/supabase/service";

import { mapToCerfa, type CerfaMapping } from "./cerfa";
import type { TaxExtraction, TaxOnboarding } from "./claude";
import { fillCerfa2042, type FillResult } from "./pdf";

export type DeclarationResult = {
  pdfBytes: Uint8Array;
  mapping: CerfaMapping;
  assumptions: string[];
  filled: string[];
  unmatched: string[];
  inputs: {
    hadOnboarding: boolean;
    hadAvis: boolean;
    hadTypeform: boolean;
  };
};

/**
 * Generate a Cerfa 2042 PDF for the given user. Throws if none of
 * the three input surfaces have any data (we need SOMETHING to
 * build a declaration).
 */
export async function buildDeclaration(userId: string): Promise<DeclarationResult> {
  const sb = serviceClient();

  const [onboardingRes, avisRes, typeformRes] = await Promise.all([
    sb
      .from("tax_onboarding")
      .select(
        "profile_type, income_types, situation, nb_enfants, owns_real_estate, has_investments, has_crypto, goals, notes",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    sb
      .from("tax_profiles")
      .select(
        "tax_year, rfr, revenu_imposable, parts, impot_revenu, tmi, situation, nb_enfants",
      )
      .eq("user_id", userId)
      .order("tax_year", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from("typeform_responses")
      .select("answers, submitted_at")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const onboarding = (onboardingRes.data ?? null) as TaxOnboarding | null;
  const extraction = (avisRes.data ?? null) as TaxExtraction | null;
  const typeformAnswers =
    (typeformRes.data?.answers ?? null) as Record<string, unknown> | null;

  if (!onboarding && !extraction && !typeformAnswers) {
    throw new Error(
      "Nothing to declare — user hasn't completed onboarding, uploaded an avis, or filled the Typeform wizard.",
    );
  }

  const { mapping, assumptions } = await mapToCerfa({
    onboarding,
    extraction,
    extra: typeformAnswers,
  });

  let fill: FillResult;
  try {
    // Pass year from the avis (last known) + assumptions for the
    // summary PDF footer. User email is pulled from auth inside the
    // API route, not needed here.
    fill = await fillCerfa2042(mapping, undefined, {
      year: extraction?.tax_year ?? new Date().getFullYear(),
      assumptions,
    });
  } catch (e) {
    throw new Error(`Cerfa PDF fill failed: ${(e as Error).message}`);
  }

  return {
    pdfBytes: fill.pdfBytes,
    mapping,
    assumptions,
    filled: fill.filled,
    unmatched: fill.unmatched,
    inputs: {
      hadOnboarding: !!onboarding,
      hadAvis: !!extraction,
      hadTypeform: !!typeformAnswers,
    },
  };
}
