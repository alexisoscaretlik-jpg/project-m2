"use client";

import { createBrowserClient } from "@supabase/ssr";

import { publicSupabaseEnv } from "./public-env";

// Client components can't read server-only env vars, so these two need
// NEXT_PUBLIC_ prefix. The anon/publishable key is public by design —
// RLS is what keeps data safe.
export function createClient() {
  const { url, anon } = publicSupabaseEnv();
  return createBrowserClient(url, anon);
}
