-- Recurring visits: antenatal appointments become fortnightly and then weekly
-- in the third trimester, so "every 2 weeks" is a real need rather than a
-- generic calendar feature.
alter table public.appointments
  add column recurrence text
    check (recurrence is null or recurrence in ('weekly', 'biweekly', 'monthly'));

comment on column public.appointments.recurrence is 'Repeat rule for follow-up visits; null means a one-off.';

-- Gestational age the sonographer measured, in days. Stored alongside the new
-- due date so the re-dating can be explained rather than just applied.
alter table public.records
  add column scan_ga_days integer
    check (scan_ga_days is null or scan_ga_days between 0 and 300);

comment on column public.records.scan_ga_days is 'Gestational age in days as reported by the scan.';

-- Video CMS fields. Provenance columns (source/author/pub_date/license) already
-- exist; these complete the card.
alter table public.videos
  add column description text not null default '',
  add column thumbnail_url text not null default ''
    check (thumbnail_url = '' or thumbnail_url ~* '^https?://');

-- ---------------------------------------------------------- test tracking ---
-- Which antenatal tests she has actually done. The catalogue itself (name, why,
-- typical window) ships in the app and is advisory only — this table records
-- her own status against it, and never asserts that a test is required.
create table public.test_tracking (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  -- Matches an `id` in the app's TESTS catalogue.
  test_id        text not null,
  status         text not null default 'planned'
                   check (status in ('planned', 'scheduled', 'done', 'skipped')),
  notes          text not null default '',
  appointment_id uuid references public.appointments (id) on delete set null,
  updated_at     timestamptz not null default now(),
  unique (user_id, test_id)
);

comment on table public.test_tracking is 'Per-user status against the advisory antenatal test catalogue.';

create index test_tracking_user_idx on public.test_tracking (user_id);

alter table public.test_tracking enable row level security;

create policy "test tracking is self-service"
  on public.test_tracking for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger test_tracking_touch_updated_at
  before update on public.test_tracking
  for each row execute function public.touch_updated_at();
