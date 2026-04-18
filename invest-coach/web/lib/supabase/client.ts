"use client";

import { createBrowserClient } from "@supabase/ssr";

// Client components can't read server-only env vars, so these two need
// NEXT_PUBLIC_ prefix. The anon key is public by design — RLS is what
// keeps data safe.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
