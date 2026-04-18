import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Public server client — no cookies, no auth. Use only for reading
// public-RLS tables like cards/companies from RSCs that don't need the
// signed-in user. For anything auth-gated, use lib/supabase/server.ts
// instead (it reads the user session from cookies).
//
// Lazy-init so Vercel's build-time page-data collection doesn't crash
// when NEXT_PUBLIC_SUPABASE_URL isn't present in the build shell.
let _client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (_client) return _client;
  _client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const c = getClient() as unknown as Record<string | symbol, unknown>;
    return c[prop];
  },
});
