-- Pregnancy Journey — user data schema.
-- Editorial content (week 4–40 copy, tests, milestones) is NOT stored here; it
-- ships inside the app so the journey is readable offline. Only what the mother
-- enters herself lives in this database.
--
-- Every table is owned by auth.uid() and protected by RLS. Sign-in is anonymous,
-- so auth.uid() is effectively a per-device identity.

-- ---------------------------------------------------------------- profiles ---
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  lmp           date not null,
  cycle_length  integer not null default 28
                  check (cycle_length between 21 and 40),
  status        text    not null default 'pregnant'
                  check (status in ('pregnant', 'planning')),
  -- Set when a dating ultrasound overrides the LMP-derived due date. When
  -- present the whole calendar is rebuilt from it.
  edd_override  date,
  baby_name     text not null default '',
  mother_name   text not null default '',
  doctor        text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table  public.profiles is 'One row per user: the inputs the pregnancy calendar is computed from.';
comment on column public.profiles.lmp is 'First day of the last menstrual period. Gestational age is measured from here.';
comment on column public.profiles.edd_override is 'Clinician-assigned due date (usually post-ultrasound); overrides the LMP calculation.';

-- ------------------------------------------------------------ appointments ---
create table public.appointments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null check (length(trim(title)) > 0),
  type       text not null default 'doctor'
               check (type in ('doctor','ultrasound','blood','genetic',
                               'lab','hospital','vaccine','other')),
  date       date not null,
  time       time,
  location   text not null default '',
  doctor     text not null default '',
  notes      text not null default '',
  reminder   text not null default ''
               check (reminder in ('','1h','24h','48h','week')),
  done       boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------- journal entries --
create table public.journal_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,
  mood       text not null default '',
  body       text not null default '',
  symptoms   text not null default '',
  weight_kg  numeric(5,2) check (weight_kg is null or weight_kg > 0),
  created_at timestamptz not null default now(),
  -- The prototype refuses to save an entry that is entirely empty.
  constraint journal_entries_not_empty check (
    length(trim(body)) > 0 or length(trim(mood)) > 0
  )
);

comment on column public.journal_entries.body is 'Free-text note. Named "body" because "text" is a reserved type name.';

-- ----------------------------------------------------------------- records ---
create table public.records (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       text not null default 'blood'
               check (type in ('blood','ultrasound','report','lab',
                               'rx','photo','note')),
  title      text not null check (length(trim(title)) > 0),
  date       date not null,
  provider   text not null default '',
  notes      text not null default '',
  -- Ultrasound-only measurements.
  crl        text not null default '',
  fhr        text not null default '',
  new_edd    date,
  created_at timestamptz not null default now()
);

comment on column public.records.crl is 'Crown-rump length as reported, free text (units vary by clinic).';
comment on column public.records.fhr is 'Fetal heart rate as reported, free text.';

-- ------------------------------------------------------------------ videos ---
create table public.videos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  week       integer not null check (week between 1 and 42),
  title      text not null check (length(trim(title)) > 0),
  url        text not null check (url ~* '^https?://'),
  source     text not null default '',
  author     text not null default '',
  duration   text not null default '',
  pub_date   text not null default '',
  license    text not null default '',
  created_at timestamptz not null default now()
);

comment on table public.videos is 'User-curated external videos per week; source/author/license are recorded for attribution.';

-- ------------------------------------------------------------------ indexes --
create index appointments_user_date_idx    on public.appointments   (user_id, date);
create index journal_entries_user_date_idx on public.journal_entries (user_id, date desc);
create index records_user_date_idx         on public.records        (user_id, date desc);
create index videos_user_week_idx          on public.videos         (user_id, week);

-- ---------------------------------------------------------------- updated_at --
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------- RLS --
alter table public.profiles        enable row level security;
alter table public.appointments    enable row level security;
alter table public.journal_entries enable row level security;
alter table public.records         enable row level security;
alter table public.videos          enable row level security;

-- profiles key off `id`; every other table off `user_id`.
create policy "profiles are self-service"
  on public.profiles for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "appointments are self-service"
  on public.appointments for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "journal entries are self-service"
  on public.journal_entries for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "records are self-service"
  on public.records for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "videos are self-service"
  on public.videos for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
