// French income-tax bracket math — pure, client-safe, zero deps.
//
// Used by /tax/levers to compute a user's TMI (taux marginal
// d'imposition) live as they change inputs, so every lever's
// "économie potentielle" becomes THEIR number instead of a
// generic €1,000 → €300 example.
//
// Brackets are the 2025 barème progressif (revenus 2024, déclaration
// 2025/2026). Update when the LOI DE FINANCES 2027 hits in Dec 2026.
//
// PASS 2026 = €47,100 (Plafond Annuel de la Sécurité Sociale).
// PER plafond = max(10% revenus pros, 10% PASS, floor €4,710).

export type Situation = "single" | "couple";

// 2025 brackets (per part)
const BRACKETS = [
  { up_to: 11497, rate: 0 },
  { up_to: 29315, rate: 11 },
  { up_to: 83823, rate: 30 },
  { up_to: 180294, rate: 41 },
  { up_to: Infinity, rate: 45 },
] as const;

// PASS_2026 = 47100; kept as comment for when we refine PER ceiling math.
const PER_FLOOR = 4710;
const PER_MAX = 37680; // 10% × 8 × PASS, approx
const ABATTEMENT_SALAIRE_RATE = 0.1;

/**
 * Number of fiscal parts (quotient familial).
 * - Single: 1 part
 * - Couple: 2 parts
 * - First 2 children: +0.5 each
 * - Additional children: +1 each
 * Doesn't model disability, single-parent boosts, etc. — V1 refinement.
 */
export function computeParts(situation: Situation, nbEnfants: number): number {
  let parts = situation === "couple" ? 2 : 1;
  if (nbEnfants <= 2) {
    parts += 0.5 * nbEnfants;
  } else {
    parts += 1 + (nbEnfants - 2);
  }
  return parts;
}

/**
 * Revenu imposable after the standard 10% abattement on salaries.
 * This is an approximation — actual deductions (frais réels, PER, etc.)
 * would reduce further, but we don't know those at this stage.
 */
export function computeImposable(netSalary: number): number {
  return Math.max(0, netSalary * (1 - ABATTEMENT_SALAIRE_RATE));
}

/**
 * Taux marginal d'imposition (%) — the rate applied to the next euro
 * of income. This is the number every lever's "économie" calculation
 * hinges on.
 */
export function computeTMI(
  netSalary: number,
  situation: Situation,
  nbEnfants: number,
): number {
  const imposable = computeImposable(netSalary);
  const parts = computeParts(situation, nbEnfants);
  const perPart = imposable / parts;
  for (const b of BRACKETS) {
    if (perPart <= b.up_to) return b.rate;
  }
  return 45;
}

/**
 * PER annual ceiling — max deductible amount for this user.
 * For a salarié: max(10% des revenus pros de N-1, 10% × PASS).
 * Capped at ~€37,680 in 2026.
 */
export function computePERCeiling(netSalary: number): number {
  const tenPercent = Math.min(netSalary * 0.1, PER_MAX);
  return Math.max(tenPercent, PER_FLOOR);
}

/**
 * Per-lever annual saving estimates for a given user profile.
 * These are rule-of-thumb scenarios, NOT promises. The card copy
 * makes that clear ("si tu verses X…").
 */
export function computeLeverSavings(input: {
  netSalary: number;
  situation: Situation;
  nbEnfants: number;
}) {
  const tmi = computeTMI(input.netSalary, input.situation, input.nbEnfants);
  const perCeiling = computePERCeiling(input.netSalary);

  // PER — we assume a realistic versement = half the ceiling, or €3,000
  // for a modest salary. User could do more or less.
  const perVersement = Math.max(Math.min(perCeiling * 0.5, 5000), 0);
  const perSaving = Math.round((perVersement * tmi) / 100);

  // Dons — €500/an baseline (modest)
  const donationAmount = 500;
  const donationSaving = Math.round(donationAmount * 0.66);

  // Emploi domicile — assume 4h/sem × €15 × 45 sem + charges ≈ €3,500
  const domesticSpend = 3500;
  const domesticSaving = Math.round(domesticSpend * 0.5);

  // Garde enfants < 6 ans — assume crèche or nounou at cap €3,500/enfant,
  // but only apply to at most 2 young children (conservative).
  const youngKids = Math.min(input.nbEnfants, 2);
  const childcareSpend = youngKids * 3500;
  const childcareSaving = Math.round(childcareSpend * 0.5);

  const total = perSaving + donationSaving + domesticSaving + childcareSaving;

  return {
    tmi,
    perCeiling: Math.round(perCeiling),
    perVersement: Math.round(perVersement),
    perSaving,
    donationAmount,
    donationSaving,
    domesticSpend,
    domesticSaving,
    childcareSpend,
    childcareSaving,
    total,
  };
}

export function formatEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}
