# Invest Coach

Web-first investment coaching platform. Turns SEC filings, academic
papers, and earnings calls into concise, actionable coaching cards.

## Layer model

```
Layer 3 — Finary-style (wealth aggregation + AI spending coach)
Layer 2 — Alerts (signals on watchlist: 8-K, tone shifts, 13F deltas)
Layer 1 — Snowball-style media (content-first) ← MVP
              |
        AI extraction pipeline
              |
    Filings + papers + transcripts
```

## Stack

- Frontend: Next.js on Vercel
- Backend: Supabase (Postgres + Auth + pgvector)
- Worker: Render cron for nightly ingestion
- Models: Claude Haiku 4.5 (coaching cards), Gemini Flash (bulk summary)
- Dev env: GitHub Codespaces

## Sources

- SEC EDGAR: 10-K, 10-Q, 8-K, DEF 14A, 13F
- Academic: SSRN, NBER, FED working papers, arXiv q-fin
- Earnings: company IR transcripts + slide decks
- EU: AMF (France), ESMA

## Structure

```
invest-coach/
├── prompts/          Extraction prompts (one per doc type)
├── supabase/         DB schema + migrations
├── worker/           (later) Nightly ingestion scripts
└── web/              (later) Next.js app
```

## Status

- [x] Supabase project + schema
- [x] Companies seeded (FR + US mix)
- [x] 8-K extraction prompt validated on AAPL Q1 FY25
- [ ] 10-K prompt validation
- [ ] Ingestion worker
- [ ] Next.js frontend
- [ ] Layer 2 alerts
- [ ] Layer 3 bank connection + AI spending coach
