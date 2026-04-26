import { redirect } from "next/navigation";

import { DEV_USER_EMAIL, DEV_USER_ID, IS_DEV } from "@/lib/devUser";

import { createClient } from "./server";

// Server-side auth gate for protected pages and route handlers.
//
// Replaces the per-route gating that used to live in `proxy.ts`. We had to
// drop that file because Next.js 16's Proxy abstraction is Node-only and
// OpenNext for Cloudflare doesn't yet support Node middleware. Instead, every
// protected page calls this at the top:
//
//   const { user, supabase } = await requireUser();
//
// In dev (NODE_ENV=development), if no real session is present we return the
// hardcoded DEV_USER (parisbrugemons@gmail.com) so the full flow works
// without fighting magic-link rate limits.
//
// In production, no user → 307 redirect to /login?next=<currentPath>.
export async function requireUser(currentPath?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { user, supabase };
  }

  if (IS_DEV) {
    return {
      user: { id: DEV_USER_ID, email: DEV_USER_EMAIL },
      supabase,
    };
  }

  const next = currentPath ? `?next=${encodeURIComponent(currentPath)}` : "";
  redirect(`/login${next}`);
}
