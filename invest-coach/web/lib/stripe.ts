import Stripe from "stripe";

// Lazy init — missing STRIPE_SECRET_KEY shouldn't crash page loads
// that import this module indirectly.
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  // Let Stripe SDK default to its pinned API version.
  _stripe = new Stripe(key);
  return _stripe;
}

export const PRICE_IDS = {
  plus: process.env.STRIPE_PRICE_PLUS ?? "",
  wealth: process.env.STRIPE_PRICE_WEALTH ?? "",
} as const;

export type Tier = keyof typeof PRICE_IDS | "free";

export function priceToTier(priceId: string | null | undefined): Tier {
  if (!priceId) return "free";
  if (priceId === PRICE_IDS.plus) return "plus";
  if (priceId === PRICE_IDS.wealth) return "wealth";
  return "free";
}

export function stripeConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PRICE_PLUS &&
    process.env.STRIPE_PRICE_WEALTH
  );
}
