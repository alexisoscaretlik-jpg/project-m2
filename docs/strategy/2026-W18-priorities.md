# Weekly priority brief — 2026-W18 (week of Apr 27)

## Where we are

Past week shipped the design polish pass: 14 commits, every public page
brought to the lavender / serif-italic / Stripe-particle / atmospheric-photo
system. Plus mobile sidebar drawer, pricing toggle, How-It-Works
isometric trio, dark Philosophy pull-quote, full SEO/OG metadata, sitemap,
robots, dynamically generated OG image.

Site is shippable. The bottleneck is now distribution, not design.

## This week's bet

**Custom domain + first 10 paying users.**

Two moves, executed in series:

1. **Wire `investcoach.fr`** (Mon/Tue) — runbook in
   `docs/custom-domain-runbook.md`. This unlocks: real shareable URL,
   email-from-domain credibility, Search Console submission, Spotify
   show-link upgrade. ~25 min of CF work + 24-72h DNS propagation.
2. **Personal-network paid push** (Wed-Fri) — DM the existing newsletter
   list (active since 2024) with a "thanks for following · ouvert au paiement
   maintenant" message linking to `/subscription`. No paid ads. Goal:
   10 paying subs at the €14 Investisseur tier by Sunday.

## Why now

- The product hasn't gotten dramatically better in the last week — the
  design has. Anyone who said no a month ago was probably right to say no.
  Anyone who said "almost" is the right ask now.
- Custom domain costs ~10 €/year + 25 min. Trust signal compounds for
  every share.
- First 10 payers tell us whether €14 is the right price. Without
  payers, every other decision is theoretical.

## Parked

| Idea | Why parked |
|---|---|
| New podcast formats (interview, listener Q&A, …) | One format is consistent. Pivoting now dilutes the brand before we have proof the current one converts. Re-evaluate at episode 8. |
| Paid ads (Meta / Google) | Burning cash before product-market fit is signed off in blood. Wait for at least 50 paying users from organic. |
| Native mobile app | The web app is responsive. Native is a 6-month bet. Not before €5k MRR. |
| Auth-page polish for `/charts/[symbol]` and `/ticker/[symbol]` | Rare paths. Hit only if a paying user complains. |
| Newsletter A/B on subject lines | Sample size too small. Wait until list is 500+. |
| Multi-theme podcast (career, health, taxes…) | The shelf supports it (`EpisodeTheme` enum), but until "money" hits 200 monthly listens, splitting attention kills both. |

## Killed

| Idea | Why killed |
|---|---|
| NotebookLM TTS integration | No public API. Decided April 26. |
| Per-user personalized podcast episodes | Per-user generation = €5/episode × users × episodes. Bankruptcy at scale. One episode, shared. |
| The dotted-grey continent map on the landing | Replaced with denser lavender particles + transaction arcs. Old version felt static. |
| Vercel deploy target | Cloudflare Workers is the production runtime. Vercel's `trading-bot-2` failure on every PR is stale infra to delete next time we touch billing. |

## Risks to watch

1. **Cloudflare Worker CPU cap (5 min)** — if we re-enable the
   on-demand `/api/podcast/generate-babylon` route, long episodes
   will time out mid-TTS. Mitigated today by the local-Mac runner
   (`scripts/run-babylon-demo.ts`), but a paying user clicking
   "generate me a custom episode" today would hit this wall.
   *Fix path:* move the route to a Cloudflare Queue + Durable Object
   when (and only when) per-user generation becomes a real ask.
2. **Spotify episode 1 review window** — first episode goes through
   ~24h Spotify review. Budget the calendar so a marketing push
   doesn't land before the episode is live on Spotify.
3. **Unsplash hotlinks** — 4 atmospheric photos are loaded from
   `images.unsplash.com`. If any of those photo IDs gets removed by
   the original photographer, we fall back to a colored panel. Detect
   on first iPhone visual check; mirror to `/public/` if any breaks.
4. **No real testimonials yet** — the trust bar uses real-but-thin
   numbers ("5 articles · 1 podcast"). After 10 paying users, get
   one or two written testimonials and replace the trust bar with a
   real-name + city + quote pattern.

## Owner per work package this week

- **Custom domain wiring (Steps 1–6 of runbook)** → human
- **Search Console + Spotify show-link update** → human
- **Personal-network DM campaign** → human, copy briefable to the
  `content-manager` agent
- **First episode 2 production** → existing v3 pipeline (runbook
  in `docs/podcast-demo-runbook.md`), `podcast-producer` brief →
  `content-manager` writes script → human Jellypod hand-off
- **Track signups daily** → human eyeballs the Stripe dashboard

## Success metric for the week (judged Sunday May 3)

- ≥ 1 paying user at €14 → product-market signal
- ≥ 5 paying users at €14 → repeatable
- 10 paying users at €14 → green light to push paid acquisition next month

If 0 paying users by Sunday:
- Either the price is wrong (test 9 €/mo on a follow-up)
- Or the offer is wrong (the product description doesn't match what people
  actually want to pay for)
- Or the network ask was too soft (try a more direct "buy now" message
  next week, not "thanks for following")

## Trade-off

This week's bet skips: another podcast episode, more articles, deeper
auth-page work, paid acquisition. All of that waits for proof of revenue.

If the answer Sunday is "0 paying users", the next week's bet is
**re-test the offer**, not "ship more features".
