import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses non-prefixed vars — safe because this module
// is never imported by client components.
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);
