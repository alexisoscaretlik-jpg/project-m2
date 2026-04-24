-- Typeform wizard responses — raw JSON payloads keyed by user.
--
-- We don't try to be clever about the schema here. Typeform's
-- question set evolves; storing the whole payload as jsonb lets the
-- Claude orchestrator read whatever's there without migrations
-- every time we add a question.
--
-- Writes come from the /api/typeform/webhook endpoint, which runs
-- server-side with the service-role key (Typeform signs the
-- payload but doesn't have a Supabase user cookie).

create table if not exists typeform_responses (
  id              bigserial primary key,
  user_id         uuid references auth.users(id) on delete cascade,
  form_id         text not null,
  response_id     text not null,                  -- Typeform-assigned UUID
  submitted_at    timestamptz not null,
  answers         jsonb not null,                 -- normalized {field_ref: value}
  raw_payload     jsonb not null,                 -- full Typeform webhook body for debugging
  created_at      timestamptz not null default now(),
  unique (response_id)
);

create index if not exists idx_typeform_responses_user
  on typeform_responses (user_id, submitted_at desc);

alter table typeform_responses enable row level security;

drop policy if exists "own typeform read" on typeform_responses;
create policy "own typeform read"
  on typeform_responses for select using (auth.uid() = user_id);

-- No user INSERT / UPDATE / DELETE policies — writes happen via
-- service_role from the webhook endpoint.
