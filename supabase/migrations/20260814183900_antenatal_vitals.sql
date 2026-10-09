-- Antenatal vitals on journal entries: blood pressure and fundal height
-- sit next to the weight she already records, so the pregnancy file can
-- chart them by week. Vitals-only entries are allowed (no mood/text required).

alter table public.journal_entries
  add column if not exists bp_systolic integer
    check (bp_systolic is null or (bp_systolic between 50 and 250)),
  add column if not exists bp_diastolic integer
    check (bp_diastolic is null or (bp_diastolic between 30 and 150)),
  add column if not exists fundal_height_cm numeric(4,1)
    check (fundal_height_cm is null or fundal_height_cm between 10 and 50);

comment on column public.journal_entries.bp_systolic is 'Self-recorded systolic BP in mmHg. Charted, never diagnosed.';
comment on column public.journal_entries.bp_diastolic is 'Self-recorded diastolic BP in mmHg.';
comment on column public.journal_entries.fundal_height_cm is 'Fundal height in cm as she or the clinic recorded it.';

alter table public.journal_entries
  drop constraint if exists journal_entries_not_empty;

alter table public.journal_entries
  add constraint journal_entries_not_empty check (
    length(trim(body)) > 0
    or length(trim(mood)) > 0
    or weight_kg is not null
    or bp_systolic is not null
    or fundal_height_cm is not null
  );
