import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { priceToTier, stripe } from "@/lib/stripe";
import { serviceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

async function applySubscription(sub: Stripe.Subscription) {
  const svc = serviceClient();
  const priceId = sub.items.data[0]?.price.id;
  const tier = priceToTier(priceId);
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const periodEndSec =
    sub.items.data[0]?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  const periodEnd = periodEndSec
    ? new Date(periodEndSec * 1000).toISOString()
    : null;

  const effectiveTier = sub.status === "active" || sub.status === "trialing"
    ? tier
    : "free";

  await svc
    .from("profiles")
    .update({
      stripe_subscription_id: sub.id,
      tier: effectiveTier,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);
}

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  if (!sig) return new NextResponse("no signature", { status: 400 });

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (e) {
    return new NextResponse(`invalid: ${(e as Error).message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );
        await applySubscription(sub);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await applySubscription(event.data.object as Stripe.Subscription);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
