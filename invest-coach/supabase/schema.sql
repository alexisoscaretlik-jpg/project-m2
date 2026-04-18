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

-- Subscription tier per user (Stripe-backed)
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  tier text not null default 'free',       -- 'free' | 'plus' | 'wealth'
  current_period_end timestamptz,
  updated_at timestamptz default now()
);

-- Tax: parsed avis d'imposition + AI-generated optimization plan
create table if not exists tax_profiles (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  tax_year int not null,
  rfr numeric,                            -- revenu fiscal de référence
  revenu_imposable numeric,
  parts numeric,                          -- nombre de parts fiscales
  impot_revenu numeric,
  tmi numeric,                            -- marginal rate (0, 11, 30, 41, 45)
  situation text,                         -- 'célibataire' | 'marié' | 'pacsé' | 'divorcé' | 'veuf'
  nb_enfants int,
  source_path text,                       -- storage key for uploaded PDF
  raw_extraction jsonb,
  recommendations jsonb,                  -- array of {title, impact_eur, why, actions[]}
  created_at timestamptz default now(),
  unique (user_id, tax_year)
);

-- Bank connections via GoCardless Bank Account Data (ex-Nordigen)
create table if not exists bank_connections (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  requisition_id text unique,
  agreement_id text,
  institution_id text,
  institution_name text,
  status text,                            -- GoCardless: CR, GC, UA, RJ, SA, GA, LN, SU, EX
  created_at timestamptz default now()
);

create table if not exists bank_accounts (
  id bigserial primary key,
  connection_id bigint references bank_connections(id) on delete cascade,
  gc_account_id text unique,              -- GoCardless account UUID
  iban text,
  owner_name text,
  display_name text,
  currency text,
  balance numeric,
  balance_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists bank_transactions (
  id bigserial primary key,
  account_id bigint references bank_accounts(id) on delete cascade,
  gc_transaction_id text,
  booking_date date,
  value_date date,
  amount numeric not null,
  currency text,
  counterparty text,
  description text,
  category text,                          -- ai-assigned: courses, restau, transport, logement, abonnements, shopping, santé, sport_loisirs, épargne_investissement, revenus, autre
  raw jsonb,
  created_at timestamptz default now(),
  unique (account_id, gc_transaction_id)
);

create index if not exists idx_tx_account_date on bank_transactions (account_id, booking_date desc);
create index if not exists idx_tax_user_year   on tax_profiles (user_id, tax_year desc);

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

alter table profiles           enable row level security;
alter table tax_profiles       enable row level security;
alter table bank_connections   enable row level security;
alter table bank_accounts      enable row level security;
alter table bank_transactions  enable row level security;

drop policy if exists "own profile read"   on profiles;
drop policy if exists "own profile upsert" on profiles;
drop policy if exists "own tax read"       on tax_profiles;
drop policy if exists "own tax insert"     on tax_profiles;
drop policy if exists "own tax delete"     on tax_profiles;
drop policy if exists "own conn read"      on bank_connections;
drop policy if exists "own acct read"      on bank_accounts;
drop policy if exists "own tx read"        on bank_transactions;

create policy "own profile read"  on profiles for select using (auth.uid() = user_id);
-- Writes to profiles happen via service_role (Stripe webhook). No user-write policy.

create policy "own tax read"   on tax_profiles for select using (auth.uid() = user_id);
create policy "own tax insert" on tax_profiles for insert with check (auth.uid() = user_id);
create policy "own tax delete" on tax_profiles for delete using (auth.uid() = user_id);

-- Bank rows are written by server actions with the user cookie;
-- RLS checks traverse back to the owning user via the FK chain.
create policy "own conn read" on bank_connections for select using (auth.uid() = user_id);
create policy "own acct read" on bank_accounts for select using (
  exists (select 1 from bank_connections c where c.id = connection_id and c.user_id = auth.uid())
);
create policy "own tx read" on bank_transactions for select using (
  exists (
    select 1 from bank_accounts a
    join bank_connections c on c.id = a.connection_id
    where a.id = account_id and c.user_id = auth.uid()
  )
);
-- Writes happen under service_role from server actions/webhooks.

-- Newsletter: captures emails from logged-out visitors too, so it's
-- not tied to auth.users. Writes from a server action using the
-- service-role client. Nobody reads this from the browser — RLS
-- denies everything; admin reads go through service role.
create table if not exists newsletter_subscribers (
  id           bigserial primary key,
  email        text not null unique,
  source       text,
  user_id      uuid references auth.users(id) on delete set null,
  unsubscribed boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists idx_newsletter_active
  on newsletter_subscribers (created_at desc)
  where unsubscribed = false;

alter table newsletter_subscribers enable row level security;
-- No policies — only service_role touches this table.
