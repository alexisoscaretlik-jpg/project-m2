import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Cookie-aware server client — use in RSC, server actions, route handlers.
// Reads the Supabase session from cookies so auth.uid() is available and
// RLS policies key off the real user.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll is called from a Server Component — ignore.
            // Middleware refreshes the session on every request.
          }
        },
      },
    },
  );
}
