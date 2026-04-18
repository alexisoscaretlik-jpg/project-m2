import { createClient } from "@supabase/supabase-js";

// Public server client — no cookies, no auth. Use only for reading
// public-RLS tables like cards/companies from RSCs that don't need the
// signed-in user. For anything auth-gated, use lib/supabase/server.ts
// instead (it reads the user session from cookies).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
