// Public Supabase credentials. These are safe to embed — the anon /
// publishable key is designed to ship in browsers and is gated by RLS.
// Env vars take precedence so staging/prod can point to other projects.

const FALLBACK_URL = "https://uzgygjrmuwckasguunqm.supabase.co";
const FALLBACK_ANON = "sb_publishable_T3tTjIqkiEWNdpxfv7jI8w_CMfcrL5g";

export function publicSupabaseEnv(): { url: string; anon: string } {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    FALLBACK_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    FALLBACK_ANON;
  return { url, anon };
}
