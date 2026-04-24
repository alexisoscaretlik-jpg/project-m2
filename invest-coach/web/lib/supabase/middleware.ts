import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

import { publicSupabaseEnv } from "./public-env";

// Refresh the Supabase session on every request so cookies don't go
// stale. Also gates protected routes — unauthed users hitting /watchlist,
// /tax, /bank, /subscription get bounced to /login.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { url, anon } = publicSupabaseEnv();
  if (!url || !anon) return response;

  const supabase = createServerClient(
    url,
    anon,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  // Dev bypass: /tax is auth-open in development (pages use hardcoded
  // fallback user from lib/devUser.ts). Other routes stay protected.
  const isDev = process.env.NODE_ENV === "development";
  const isProtected =
    path.startsWith("/watchlist") ||
    (path.startsWith("/tax") && !isDev) ||
    path.startsWith("/bank") ||
    path.startsWith("/subscription");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}
