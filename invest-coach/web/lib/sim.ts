// Portfolio projection with French-tax-aware net output.
// Everything is monthly-compounded. Not financial advice.

export type SimInput = {
  monthly: number;      // € invested each month
  years: number;
  annualReturn: number; // e.g. 0.07 for 7%/yr
  wrapper: Wrapper;
};

export type Wrapper = "pea" | "av" | "cto" | "per";

export type SimResult = {
  gross: number;           // total portfolio value before tax at exit
  contributions: number;   // total invested
  gainsBeforeTax: number;
  taxOnExit: number;
  net: number;             // after-tax on exit
  label: string;
  why: string;
};

const SOCIAL_CHARGES = 0.172; // prélèvements sociaux — apply to gains in almost every wrapper

// Future value of annuity (contributions at end of each month) with monthly
// compounding derived from an annualized rate.
function futureValue(monthly: number, years: number, annualReturn: number): number {
  const n = years * 12;
  const r = Math.pow(1 + annualReturn, 1 / 12) - 1;
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r);
}

export function simulate({
  monthly,
  years,
  annualReturn,
  wrapper,
}: SimInput): SimResult {
  const gross = futureValue(monthly, years, annualReturn);
  const contributions = monthly * years * 12;
  const gains = Math.max(gross - contributions, 0);

  let taxOnExit = 0;
  let label = "";
  let why = "";

  switch (wrapper) {
    case "pea": {
      // After 5 years: 0% IR on gains, only 17.2% social charges.
      // Before 5y would be 30% flat tax — we assume the user holds ≥5y.
      const qualifies = years >= 5;
      if (qualifies) {
        taxOnExit = gains * SOCIAL_CHARGES;
        label = "PEA (≥5 ans)";
        why = "0% d'impôt sur les gains, seulement 17,2% de prélèvements sociaux.";
      } else {
        taxOnExit = gains * 0.3; // PFU
        label = "PEA (<5 ans, PFU)";
        why = "Retrait avant 5 ans : flat tax 30% (12,8% IR + 17,2% PS).";
      }
      break;
    }
    case "av": {
      // Assurance-vie ≥8y: 7.5% IR on gains up to 150k€ invested (after 4,600€
      // abatement per year), plus 17.2% social charges. Above 150k€: 12.8%.
      // We approximate with 7.5% and apply the annual 4,600€ abatement at exit.
      const qualifies = years >= 8;
      const abatement = qualifies ? 4600 : 0;
      const taxable = Math.max(gains - abatement, 0);
      const irRate = qualifies ? 0.075 : 0.128;
      taxOnExit = taxable * irRate + gains * SOCIAL_CHARGES;
      label = qualifies ? "Assurance-vie (≥8 ans)" : "Assurance-vie (<8 ans)";
      why = qualifies
        ? "Abattement 4 600€/an sur les gains, puis 7,5% IR + 17,2% PS."
        : "Avant 8 ans : 12,8% IR + 17,2% PS (ou barème).";
      break;
    }
    case "cto": {
      // Compte-titres: flat tax 30% (12.8% IR + 17.2% PS) on all gains.
      taxOnExit = gains * 0.3;
      label = "Compte-titres (PFU 30%)";
      why = "Flat tax de 30% sur l'intégralité des plus-values.";
      break;
    }
    case "per": {
      // Plan d'épargne retraite: we model only the exit phase, assuming a
      // TMI of 30% at retirement on the capital withdrawn (+PFU on gains).
      // Real PER adds deduction benefits during contributions (not modeled here).
      const tmiExit = 0.3;
      taxOnExit = contributions * tmiExit + gains * 0.3;
      label = "PER (sortie en capital)";
      why = "Capital imposé au TMI (30% estimé), gains au PFU 30%.";
      break;
    }
  }

  return {
    gross,
    contributions,
    gainsBeforeTax: gains,
    taxOnExit,
    net: gross - taxOnExit,
    label,
    why,
  };
}

export function simulateAll(
  base: Omit<SimInput, "wrapper">,
): Record<Wrapper, SimResult> {
  return {
    pea: simulate({ ...base, wrapper: "pea" }),
    av: simulate({ ...base, wrapper: "av" }),
    cto: simulate({ ...base, wrapper: "cto" }),
    per: simulate({ ...base, wrapper: "per" }),
  };
}
