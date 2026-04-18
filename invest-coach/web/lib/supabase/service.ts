import { createClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS. Use only in server routes where
// we've already verified the caller's identity (via the cookie-based
// client) and need to write into tables whose RLS only allows the
// service role (e.g. tax_profiles insert of raw_extraction,
// bank_* writes, profiles upsert from Stripe webhook).
export function serviceClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
