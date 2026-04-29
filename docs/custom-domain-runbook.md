# Custom domain — Cloudflare Workers wiring

This is the playbook for moving Invest Coach off the placeholder
`project-m2.alexisoscaretlik.workers.dev` URL onto a real domain
(suggested: `investcoach.fr`). You only do this once.

**Total time:** ~25 minutes if the domain is already on Cloudflare DNS,
~60 minutes if you have to transfer DNS to Cloudflare first.

## Step 0 — pick & buy the domain

The brand is `Invest Coach`. Best matches:

| Domain | Why |
|---|---|
| `investcoach.fr` | Most direct, FR audience, ~10 €/year |
| `invest-coach.fr` | Same, hyphenated. Slightly worse for typing. |
| `investcoach.com` | International, ~12 €/year. Worse SEO signal for FR. |

Pick `.fr` first — Google ranks ccTLDs higher for local searches in
that country. Buy at OVH (cheapest in France), Gandi (best UX), or
straight on Cloudflare Registrar (~$8/year, no markup).

## Step 1 — DNS to Cloudflare

If you bought from OVH / Gandi: change nameservers to Cloudflare's.

1. Cloudflare → Add a Site → enter `investcoach.fr` → Free plan.
2. Cloudflare gives two nameservers, e.g. `arnav.ns.cloudflare.com`,
   `kim.ns.cloudflare.com`.
3. At your registrar (OVH/Gandi/etc.), change the nameservers to those
   two. Save.
4. DNS propagation: 5 min – 24 h. Cloudflare's dashboard will email
   when it's live.

If you bought on Cloudflare Registrar: skip — DNS is already on Cloudflare.

## Step 2 — wire the Worker to the domain

Cloudflare → Workers & Pages → **project-m2** → Settings → Domains
& Routes.

1. Click **Add** → **Custom domain**.
2. Enter `investcoach.fr`. Cloudflare auto-creates the necessary DNS
   records (a CNAME-flattened A record pointing to the Worker).
3. Click **Add**. Wait ~30 seconds. The status flips to **Active**.
4. Repeat for `www.investcoach.fr` if you want both. Cloudflare will
   307-redirect one to the other (configurable in **Page Rules**).

## Step 3 — update the app's known URL

The app references `project-m2.alexisoscaretlik.workers.dev` in three places.
Set an env var so they all switch at once.

1. Cloudflare → Workers → project-m2 → Settings → Variables and
   Secrets.
2. Add **Plaintext** variable `NEXT_PUBLIC_SITE_URL` = `https://investcoach.fr`.
3. Save & re-deploy (push any commit to `main`, or click **Re-deploy**
   on the latest deployment).

The codebase already reads from this env var with a fallback:

```ts
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  || "https://project-m2.alexisoscaretlik.workers.dev";
```

Files affected (no code change needed, just the env var flip):
- `app/layout.tsx` (metadataBase, openGraph url, canonical)
- `app/sitemap.ts` (sitemap entries)
- `app/robots.ts` (sitemap reference + host)
- `docs/podcast-demo-runbook.md` (uses the URL in distribution)

## Step 4 — TLS

Cloudflare auto-issues a Universal SSL cert when you add a custom domain.
Verify:

1. `https://investcoach.fr/` → green padlock in browser.
2. Cloudflare → SSL/TLS → set encryption mode to **Full (strict)**.
   Workers serve HTTPS natively so this is the right mode — anything
   weaker leaves a connection unencrypted.

## Step 5 — Spotify, Supabase, and other external links

Anywhere we hard-coded the workers.dev URL outside the app, swap to the new
one. Quick grep at the repo root after the env switch:

```bash
grep -rn "project-m2.alexisoscaretlik.workers.dev" \
  --include="*.ts" --include="*.tsx" --include="*.md" \
  --include="*.json" --include="*.toml" --include="*.jsonc"
```

Update the matches by hand if any are not env-var-backed.

External services that may have the old URL pinned:

- **Stripe** → Dashboard → Settings → Payment links / webhook URLs →
  swap if any reference the old domain.
- **Supabase** → Auth → URL Configuration → Site URL + Redirect URLs:
  add the new domain.
- **GoCardless** (PSD2) → Developer Dashboard → Allowed redirect URLs.
- **Spotify for Creators** → Show settings → Website link.

## Step 6 — verify

```bash
curl -I https://investcoach.fr/                                # 200, HTTP/2, TLS
curl -I https://investcoach.fr/sitemap.xml                     # 200, application/xml
curl -I https://investcoach.fr/robots.txt                      # 200, text/plain
curl -I https://investcoach.fr/opengraph-image                 # 200, image/png
```

Then re-share a link from the new domain on Twitter/Slack/WhatsApp —
the OG card should pull the dynamically generated 1200×630 image with
the correct domain.

## Step 7 — Search Console

1. Google Search Console → Add property → Domain → `investcoach.fr`.
2. Verify via the TXT record Cloudflare auto-prompts.
3. Submit `https://investcoach.fr/sitemap.xml` under **Sitemaps**.
4. Repeat with Bing Webmaster Tools (smaller but free).

Indexing kicks in within 24-72 h.

## Rollback

If anything goes wrong:

1. Cloudflare → Workers → project-m2 → Settings → Domains → remove
   the custom domain. The Worker remains on the workers.dev URL.
2. Reset `NEXT_PUBLIC_SITE_URL` to the old workers.dev URL in env.
3. Re-deploy.

No DB migration involved, no code rollback required. Worst case: 5 min
to revert.
