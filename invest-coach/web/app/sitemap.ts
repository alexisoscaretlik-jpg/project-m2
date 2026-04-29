import type { MetadataRoute } from "next";

// Dynamic sitemap — Next.js generates /sitemap.xml from this.
// Public pages only. Auth-only pages (/tax, /bank, /charts, /admin,
// /watchlist, /subscription) are excluded.
//
// The article slugs are sourced live from the ARTICLES list so adding
// a new article auto-extends the sitemap on the next deploy.

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://project-m2.alexisoscaretlik.workers.dev";

import { ARTICLES } from "./articles/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date().toISOString().slice(0, 10);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,           lastModified: today, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${SITE_URL}/podcast`,    lastModified: today, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${SITE_URL}/articles`,   lastModified: today, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${SITE_URL}/outils`,     lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/simulation`, lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/markets`,    lastModified: today, changeFrequency: "daily",   priority: 0.6 },
    { url: `${SITE_URL}/companies`,  lastModified: today, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${SITE_URL}/login`,      lastModified: today, changeFrequency: "yearly",  priority: 0.3 },
  ];

  const articlePages: MetadataRoute.Sitemap = ARTICLES.map((a) => ({
    url: `${SITE_URL}/articles/${a.slug}`,
    lastModified: a.updated || today,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...articlePages];
}
