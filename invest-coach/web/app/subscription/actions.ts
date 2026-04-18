"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getStripe, PRICE_IDS, Tier } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";

async function originUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

async function ensureStripeCustomer(
  userId: string,
  email: string | undefined,
): Promise<string> {
  const svc = serviceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await getStripe().customers.create({
    email,
    metadata: { user_id: userId },
  });

  await svc.from("profiles").upsert(
    {
      user_id: userId,
      email: email ?? null,
      stripe_customer_id: customer.id,
      tier: "free",
    },
    { onConflict: "user_id" },
  );
  return customer.id;
}

export async function startCheckout(formData: FormData) {
  const tier = String(formData.get("tier") ?? "") as Tier;
  const price = PRICE_IDS[tier as keyof typeof PRICE_IDS];
  if (!price) return;

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login?next=/subscription");

  const customer = await ensureStripeCustomer(user.id, user.email);
  const origin = await originUrl();

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${origin}/subscription?status=success`,
    cancel_url: `${origin}/subscription?status=cancelled`,
    subscription_data: { metadata: { user_id: user.id, tier } },
    metadata: { user_id: user.id, tier },
  });

  if (!session.url) redirect("/subscription?status=error");
  redirect(session.url);
}

export async function openPortal() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login?next=/subscription");

  const svc = serviceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();
  if (!profile?.stripe_customer_id) redirect("/subscription");

  const origin = await originUrl();
  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}/subscription`,
  });
  redirect(session.url);
}
