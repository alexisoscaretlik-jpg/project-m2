-- Invest Coach — Supabase schema
-- Applied: 2026-04-18
-- Run in: Supabase SQL Editor

create extension if not exists vector;

-- Companies we track
create table if not exists companies (
  id bigserial primary key,
  ticker text unique not null,
  name text not null,
  cik text,                    -- SEC identifier
  exchange text,
  country text default 'US',
  created_at timestamptz default now()
);

-- Raw documents fetched from sources
create table if not exists filings (
  id bigserial primary key,
  company_id bigint references companies(id) on delete cascade,
  doc_type text not null,      -- '10-K', '10-Q', '8-K', 'earnings_call', 'paper'
  source text not null,        -- 'edgar', 'ssrn', 'ir_page'
  source_url text,
  filed_at timestamptz,
  fiscal_period text,          -- 'FY2024', 'Q3-2024'
  raw_text text,
  fetched_at timestamptz default now(),
  unique (source, source_url)
);

-- AI-extracted structured signals
create table if not exists extractions (
  id bigserial primary key,
  filing_id bigint references filings(id) on delete cascade,
  model text not null,         -- 'claude-haiku-4-5'
  prompt_version text not null,
  signals jsonb not null,
  the_one_thing text,
  confidence text,
  created_at timestamptz default now()
);

-- User-facing coaching cards (the "media" layer)
create table if not exists cards (
  id bigserial primary key,
  slug text unique not null,
  company_id bigint references companies(id),
  extraction_id bigint references extractions(id),
  title text not null,
  body_markdown text not null,
  tone text,                   -- 'bullish', 'cautious', 'red_flag', 'educational'
  published_at timestamptz default now(),
  embedding vector(1536)
);

-- Watchlist (per user)
create table if not exists watchlist (
  user_id uuid references auth.users(id) on delete cascade,
  company_id bigint references companies(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, company_id)
);

create index if not exists idx_filings_company_filed  on filings (company_id, filed_at desc);
create index if not exists idx_cards_published        on cards (published_at desc);
create index if not exists idx_extractions_filing     on extractions (filing_id);

-- Seed companies (FR + US mix)
insert into companies (ticker, name, cik, exchange, country) values
  ('MC.PA',   'LVMH',              null,        'Euronext Paris',     'FR'),
  ('RMS.PA',  'Hermès',            null,        'Euronext Paris',     'FR'),
  ('TTE.PA',  'TotalEnergies',     null,        'Euronext Paris',     'FR'),
  ('SAN.PA',  'Sanofi',            null,        'Euronext Paris',     'FR'),
  ('AIR.PA',  'Airbus',            null,        'Euronext Paris',     'FR'),
  ('ASML.AS', 'ASML Holding',      null,        'Euronext Amsterdam', 'NL'),
  ('AAPL',    'Apple',             '0000320193','NASDAQ',             'US'),
  ('MSFT',    'Microsoft',         '0000789019','NASDAQ',             'US'),
  ('BRK.B',   'Berkshire Hathaway','0001067983','NYSE',               'US'),
  ('NVDA',    'Nvidia',            '0001045810','NASDAQ',             'US')
on conflict (ticker) do nothing;

-- RLS — media content is public, watchlist is private
alter table companies   enable row level security;
alter table filings     enable row level security;
alter table extractions enable row level security;
alter table cards       enable row level security;
alter table watchlist   enable row level security;

drop policy if exists "public read companies"   on companies;
drop policy if exists "public read filings"     on filings;
drop policy if exists "public read extractions" on extractions;
drop policy if exists "public read cards"       on cards;

create policy "public read companies"   on companies   for select using (true);
create policy "public read filings"     on filings     for select using (true);
create policy "public read extractions" on extractions for select using (true);
create policy "public read cards"       on cards       for select using (true);

drop policy if exists "own watchlist read"   on watchlist;
drop policy if exists "own watchlist insert" on watchlist;
drop policy if exists "own watchlist delete" on watchlist;

create policy "own watchlist read"   on watchlist for select using (auth.uid() = user_id);
create policy "own watchlist insert" on watchlist for insert with check (auth.uid() = user_id);
create policy "own watchlist delete" on watchlist for delete using (auth.uid() = user_id);
