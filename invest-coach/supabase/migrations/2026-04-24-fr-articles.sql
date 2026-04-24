-- French public-source articles — BOFIP, AMF, Banque de France, blogs.
--
-- Self-contained schema so it doesn't interfere with the US SEC
-- filings + extractions tables. Each row = one French-source
-- document we've fetched + the Gemini Flash extraction of it.
--
-- Writes always happen via the Python worker using the service-role
-- key. RLS stays on with no user-facing policies.

create table if not exists fr_articles (
  id           bigserial primary key,

  source       text not null,                       -- 'bofip' | 'amf' | 'banque_france' | 'tresor' | 'hal' | 'blog_nalo' | 'blog_ramify' | 'blog_goodvest' | 'blog_climb' | 'blog_cleerly' | 'blog_snowball'
  source_url   text not null,
  title        text,
  author       text,
  published_at timestamptz,

  raw_text     text,                                -- cleaned article body

  extraction   jsonb,                               -- Gemini Flash structured output
  model        text,                                -- e.g. 'gemini-2.5-flash'
  prompt_version text default 'v1',

  fetched_at   timestamptz not null default now(),
  unique (source_url)
);

create index if not exists idx_fr_articles_source    on fr_articles (source);
create index if not exists idx_fr_articles_published on fr_articles (published_at desc);
create index if not exists idx_fr_articles_fetched   on fr_articles (fetched_at desc);

alter table fr_articles enable row level security;
-- No user-facing policies. Service role only.
