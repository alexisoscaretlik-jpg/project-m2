-- Run this in Supabase SQL Editor to enable the newsletter signup.
-- Safe to re-run (idempotent).

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

drop policy if exists "anyone insert newsletter" on newsletter_subscribers;
drop policy if exists "anyone upsert newsletter" on newsletter_subscribers;

create policy "anyone insert newsletter"
  on newsletter_subscribers
  for insert
  to anon, authenticated
  with check (true);

create policy "anyone upsert newsletter"
  on newsletter_subscribers
  for update
  to anon, authenticated
  using (true)
  with check (true);
