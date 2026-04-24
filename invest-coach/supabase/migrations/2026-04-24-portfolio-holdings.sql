-- Portfolio holdings — lot-level data for the /tax optimizer's
-- year-end tax-loss harvester.
--
-- Two tables:
--   portfolio_holdings : one row per import (PDF upload snapshot)
--   portfolio_lots     : one row per individual position
--
-- Harvester math depends on (cost_basis, current_price, account_type)
-- so those three columns are the non-negotiable ones. Everything else
-- is either nullable or has a sensible default.

create table if not exists portfolio_holdings (
  id             bigserial primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  as_of_date     date not null,                 -- statement date, not upload date
  broker         text,                          -- free text: "Boursorama", "DEGIRO", "Trade Republic", ...
  source_path    text,                          -- storage key for the uploaded PDF
  raw_extraction jsonb,                         -- full Claude output, for debugging
  total_value_eur numeric,                      -- sum of lots at as_of_date (cached)
  created_at     timestamptz not null default now()
);

create index if not exists idx_holdings_user_date
  on portfolio_holdings (user_id, as_of_date desc);

create table if not exists portfolio_lots (
  id                 bigserial primary key,
  holding_id         bigint not null references portfolio_holdings(id) on delete cascade,
  user_id            uuid   not null references auth.users(id) on delete cascade,

  ticker             text,                      -- "AAPL", "MC.PA" — optional (some EU brokers only show ISIN)
  isin               text,                      -- "FR0000121014" — preferred canonical id
  name               text,                      -- "LVMH" (human label)

  account_type       text not null
    check (account_type in ('PEA', 'PEA-PME', 'CTO', 'AV', 'PER', 'other')),
  account_label      text,                      -- "PEA Boursorama", "CTO DEGIRO" (free text)

  quantity           numeric not null,          -- fractional shares allowed
  cost_basis_eur     numeric,                   -- total cost for this lot (qty × avg_price incl. fees)
  avg_price_eur      numeric,                   -- per-share cost basis (convenience copy)
  purchase_date      date,                      -- nullable: many statements only show averaged basis
  current_price_eur  numeric,                   -- price at as_of_date
  market_value_eur   numeric,                   -- quantity × current_price_eur
  unrealized_pnl_eur numeric,                   -- market_value - cost_basis

  currency           text default 'EUR',        -- original trade currency; values above are EUR-normalized
  created_at         timestamptz not null default now()
);

create index if not exists idx_lots_user           on portfolio_lots (user_id);
create index if not exists idx_lots_holding        on portfolio_lots (holding_id);
create index if not exists idx_lots_user_account   on portfolio_lots (user_id, account_type);

-- RLS: users can only see and insert their own holdings/lots.
alter table portfolio_holdings enable row level security;
alter table portfolio_lots     enable row level security;

drop policy if exists "own holdings read"   on portfolio_holdings;
drop policy if exists "own holdings insert" on portfolio_holdings;
drop policy if exists "own holdings delete" on portfolio_holdings;
drop policy if exists "own lots read"       on portfolio_lots;
drop policy if exists "own lots insert"     on portfolio_lots;
drop policy if exists "own lots delete"     on portfolio_lots;

create policy "own holdings read"
  on portfolio_holdings for select using (auth.uid() = user_id);
create policy "own holdings insert"
  on portfolio_holdings for insert with check (auth.uid() = user_id);
create policy "own holdings delete"
  on portfolio_holdings for delete using (auth.uid() = user_id);

create policy "own lots read"
  on portfolio_lots for select using (auth.uid() = user_id);
create policy "own lots insert"
  on portfolio_lots for insert with check (auth.uid() = user_id);
create policy "own lots delete"
  on portfolio_lots for delete using (auth.uid() = user_id);
