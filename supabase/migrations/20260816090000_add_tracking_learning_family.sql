-- Journey v2 — the three things the app was missing: daily tracking, a place
-- for preparation to accumulate, and a way for the rest of the family to leave
-- something behind.
--
-- Same rules as the original schema: editorial content (the checklist items,
-- the glossary, the weekly facts) ships inside the app and is not stored here.
-- These tables hold only what she and her family enter.

-- ------------------------------------------------------------- profiles +++ --
-- Height and pre-pregnancy weight are optional. They exist for one purpose: to
-- place her on the published IOM/ACOG weight-gain band for her BMI. Without
-- them the weight screen still draws her trend, it just cannot draw the band.
alter table public.profiles
  add column height_cm numeric(5,1)
    check (height_cm is null or height_cm between 120 and 220),
  add column pre_pregnancy_weight_kg numeric(5,2)
    check (pre_pregnancy_weight_kg is null or pre_pregnancy_weight_kg between 30 and 250),
  add column partner_name text not null default '';

comment on column public.profiles.pre_pregnancy_weight_kg is
  'Optional. Only used to compute pre-pregnancy BMI for the weight-gain band.';

-- -------------------------------------------------------------- kick counts --
-- One row per "count to ten" sitting. ended_at stays null while a session is
-- running so a count survives the app being backgrounded or the phone locking.
create table public.kick_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  count      integer not null default 0 check (count between 0 and 200),
  note       text not null default '',
  created_at timestamptz not null default now(),
  constraint kick_sessions_ordered check (ended_at is null or ended_at >= started_at)
);

comment on table public.kick_sessions is
  'Fetal movement counts. The app compares a session to her own baseline only — never to a population norm.';

-- ------------------------------------------------------------- contractions --
-- Timed individually rather than as sessions: frequency is derived from the
-- gaps between start times, so every contraction has to be its own row.
create table public.contractions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  started_at       timestamptz not null,
  duration_seconds integer not null check (duration_seconds between 0 and 3600),
  note             text not null default '',
  created_at       timestamptz not null default now()
);

-- -------------------------------------------------------------- measurements --
-- Weight, blood pressure and blood sugar in one shape. value2 carries the
-- diastolic half of a blood-pressure reading; context carries fasting /
-- after-a-meal for glucose.
create table public.measurements (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,
  kind       text not null check (kind in ('weight', 'bp', 'glucose')),
  value      numeric(6,2) not null check (value > 0),
  value2     numeric(6,2) check (value2 is null or value2 > 0),
  context    text not null default '',
  notes      text not null default '',
  created_at timestamptz not null default now(),
  -- A blood-pressure row without its diastolic half is not a reading.
  constraint measurements_bp_has_diastolic check (kind <> 'bp' or value2 is not null)
);

comment on column public.measurements.value2 is 'Diastolic pressure; null for every other kind.';

-- ---------------------------------------------------------------- checklists --
-- Curated items carry an item_id from the app's CHECKLISTS content and an empty
-- label; items she adds herself carry a generated id and their own text.
create table public.checklist_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  list_id    text not null,
  item_id    text not null,
  label      text not null default '',
  done       boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, list_id, item_id)
);

comment on table public.checklist_items is
  'Tick state and custom additions for the in-app preparation lists.';

-- ------------------------------------------------------------------ letters --
-- A time capsule. author is free text so a grandmother, a sibling or the
-- partner can each leave one under their own name.
create table public.letters (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,
  title      text not null default '',
  body       text not null check (length(trim(body)) > 0),
  author     text not null default '',
  created_at timestamptz not null default now()
);

comment on column public.letters.author is 'Who wrote it. Empty means the mother herself.';

-- ------------------------------------------------------------------ indexes --
create index kick_sessions_user_date_idx  on public.kick_sessions (user_id, date desc);
create index contractions_user_start_idx  on public.contractions  (user_id, started_at desc);
create index measurements_user_kind_idx   on public.measurements  (user_id, kind, date desc);
create index checklist_items_user_list_idx on public.checklist_items (user_id, list_id);
create index letters_user_date_idx        on public.letters       (user_id, date desc);

-- ---------------------------------------------------------------- updated_at --
create trigger checklist_items_touch_updated_at
  before update on public.checklist_items
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------- RLS --
alter table public.kick_sessions   enable row level security;
alter table public.contractions    enable row level security;
alter table public.measurements    enable row level security;
alter table public.checklist_items enable row level security;
alter table public.letters         enable row level security;

create policy "kick sessions are self-service"
  on public.kick_sessions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "contractions are self-service"
  on public.contractions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "measurements are self-service"
  on public.measurements for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "checklist items are self-service"
  on public.checklist_items for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "letters are self-service"
  on public.letters for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
