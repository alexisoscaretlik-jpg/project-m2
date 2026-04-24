-- Tax onboarding — the questionnaire that precedes avis upload.
-- One row per user (upsert). Feeds into the recommendation prompt so
-- Claude can tailor advice by income type (salarié vs freelance vs mixte),
-- situation, and stated goals.
--
-- Why one row, not versioned: users rarely change these. If they do,
-- we overwrite. The avis itself is the time-stamped record (tax_profiles).

create table if not exists tax_onboarding (
  user_id           uuid primary key references auth.users(id) on delete cascade,

  -- Profile archetype. Drives which regime-specific advice applies.
  profile_type      text not null
    check (profile_type in (
      'salarie',           -- employé CDI/CDD
      'freelance_micro',   -- micro-entrepreneur / auto-entrepreneur
      'freelance_reel',    -- TNS / profession libérale au réel (BNC/BIC)
      'mixte',             -- salaire + activité indépendante en parallèle
      'retraite',
      'etudiant',
      'sans_emploi',
      'other'
    )),

  -- Multi-select: user can have salaire + dividendes + foncier simultaneously.
  -- Stored as jsonb array of text: e.g. ["salaire", "dividendes", "foncier"]
  income_types      jsonb not null default '[]'::jsonb,

  situation         text
    check (situation in ('celibataire', 'pacse', 'marie', 'separe', 'veuf', 'divorce') or situation is null),
  nb_enfants        int default 0 check (nb_enfants >= 0),

  owns_real_estate  boolean default false,   -- propriétaire (RP, locative, SCI, SCPI)
  has_investments   boolean default false,   -- PEA, CTO, AV, PER
  has_crypto        boolean default false,

  -- Multi-select: user can have multiple goals.
  -- e.g. ["reduce_tax", "prepare_retirement", "optimize_investments", "start_freelance"]
  goals             jsonb not null default '[]'::jsonb,

  -- Free-text notes the user adds (optional).
  notes             text,

  answered_at       timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_tax_onboarding_profile_type
  on tax_onboarding (profile_type);

alter table tax_onboarding enable row level security;

drop policy if exists "own onboarding read"   on tax_onboarding;
drop policy if exists "own onboarding upsert" on tax_onboarding;
drop policy if exists "own onboarding update" on tax_onboarding;
drop policy if exists "own onboarding delete" on tax_onboarding;

create policy "own onboarding read"
  on tax_onboarding for select using (auth.uid() = user_id);
create policy "own onboarding upsert"
  on tax_onboarding for insert with check (auth.uid() = user_id);
create policy "own onboarding update"
  on tax_onboarding for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own onboarding delete"
  on tax_onboarding for delete using (auth.uid() = user_id);
