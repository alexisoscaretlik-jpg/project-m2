"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function addToWatchlist(formData: FormData) {
  const ticker = String(formData.get("ticker") ?? "").trim().toUpperCase();
  if (!ticker) return;

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return;

  const { data: company } = await sb
    .from("companies")
    .select("id")
    .eq("ticker", ticker)
    .single();
  if (!company) return;

  await sb
    .from("watchlist")
    .insert({ user_id: user.id, company_id: company.id });

  revalidatePath("/watchlist");
}

export async function removeFromWatchlist(formData: FormData) {
  const companyId = Number(formData.get("company_id"));
  if (!companyId) return;

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return;

  await sb
    .from("watchlist")
    .delete()
    .eq("user_id", user.id)
    .eq("company_id", companyId);

  revalidatePath("/watchlist");
}
