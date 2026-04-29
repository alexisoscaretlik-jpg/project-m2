import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://project-m2.alexisoscaretlik.workers.dev";

// Disallow crawl on:
// - /api/*           — server endpoints (no SEO value, expose internals).
// - /admin/*         — internal staff console.
// - auth-gated app   — /tax, /bank, /charts, /watchlist, /subscription
//                       all require login; no point spending crawl budget.
//
// Allow everything else, including /podcast, /articles, /outils, /markets.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/tax/",
          "/bank/",
          "/charts/",
          "/watchlist/",
          "/subscription/",
          "/ticker/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
