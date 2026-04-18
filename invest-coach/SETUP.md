# Setup — Mac-side dev environment

Paste-and-go runbook for a fresh Mac. Target: zero → end-to-end
smoke test in ~20 minutes. Run inside a Claude Code session on the
MacBook so the AI sees the shell output at each step.

## 0. Prerequisites (one-time)

```bash
brew --version        # if missing → install from https://brew.sh
node --version        # need 20+
python3 --version     # need 3.11+
git --version

# Install anything missing:
brew install node python@3.11 git gh
```

## 1. Clone the repo

```bash
mkdir -p ~/projects && cd ~/projects
git clone https://github.com/alexisoscaretlik-jpg/trading-bot-2.git
cd trading-bot-2
git checkout claude/plan-web-investment-platform-4CNxD
cd invest-coach
```

## 2. Environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in — pull secrets from your iPhone Notes.
Everything stays local; `.env` is gitignored.

SEC requires a real-looking User-Agent (name + email) or it 403s.
Use your real email.

## 3. Worker smoke test

Proves SEC access + Claude API + prompt JSON all work end-to-end.

```bash
cd worker
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python smoke_test.py
```

Expected: prints JSON with `event_type`, `the_one_thing`, etc.
If it prints a filled-in result, the whole pipeline works.

## 4. Next.js web scaffold

```bash
cd ..           # back to invest-coach/
npx create-next-app@latest web \
  --typescript --tailwind --app --no-src-dir \
  --import-alias "@/*" --use-npm
cd web
npm install @supabase/supabase-js
```

Link env vars so web can read Supabase:

```bash
ln -s ../.env .env.local
```

Browser env vars need the `NEXT_PUBLIC_` prefix — already in
`.env.example`. Restart the dev server after changes.

```bash
npm run dev
```

Open http://localhost:3000 — Next.js welcome page.

## 5. First real page — ticker list

Ask Claude Code on the Mac:

> "In `invest-coach/web/app/page.tsx`, create a server component
> that queries the `companies` table from Supabase (use the anon
> key) and renders a list of tickers with name and country.
> Tailwind for styling. Link each ticker to `/ticker/[symbol]`
> (route can 404 for now)."

Verify the 10 seeded companies render. Commit + push.

## 6. Vercel deploy

```bash
npm install -g vercel
vercel login
vercel            # follow prompts, first deploy will be dev
```

In Vercel dashboard:
- Project Settings → Root Directory → `invest-coach/web`
- Environment Variables → add all `NEXT_PUBLIC_*` vars from `.env`
- Redeploy

## 7. Render nightly cron

Keeps the site fresh — new SEC filings become cards automatically.

1. https://render.com → sign in with GitHub → **New +** → **Blueprint**
2. Connect the `trading-bot-2` repo → pick the feature branch
   `claude/plan-web-investment-platform-4CNxD`
3. Render reads `render.yaml` and proposes one service:
   `invest-coach-worker` (cron, free tier)
4. On the cron's page → **Environment** → paste env vars (same values
   as local `.env`):
   - `SEC_USER_AGENT`
   - `ANTHROPIC_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Save → Render runs `python run.py` on schedule `0 6 * * *` (06:00
   UTC daily). Use **Trigger Run** to test immediately.

Default tickers are `AAPL MSFT NVDA BRK.B`. To change, edit
`DEFAULT_TICKERS` in `run.py` or pass args via `startCommand` in
`render.yaml` (e.g. `python run.py AAPL MSFT --forms 10-K`).

## 8. Next milestones (in order)

- [x] Worker writes extractions to Supabase
- [x] Web: `/ticker/[symbol]` page with latest card
- [x] 10-K extraction alongside 8-K
- [x] Render cron: nightly run
- [ ] EU / AMF filings fetcher (LVMH, Hermès, TotalEnergies…)
- [ ] Auth (Supabase email magic link) + watchlist
- [ ] Newsletter digest (Resend)
- [ ] Layer 2: alerts on 8-K / tone shifts
- [ ] Layer 3: GoCardless bank connection + AI spending coach

## Troubleshooting

| Symptom | Cause |
|---|---|
| SEC returns 403 | `SEC_USER_AGENT` missing or malformed. Use "Name email@domain.com" |
| Anthropic 401 | API key typo, or Console account has no credits |
| Supabase returns no companies | RLS policy missing — re-run `supabase/schema.sql` |
| `npm run dev` — module not found `@supabase/supabase-js` | Run `npm install` in `web/` |
| Next.js env vars undefined in browser | Missing `NEXT_PUBLIC_` prefix; restart dev server |
