import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Pin the API version so upstream changes don't break our webhook shape.
  apiVersion: "2025-09-30.clover",
});

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
