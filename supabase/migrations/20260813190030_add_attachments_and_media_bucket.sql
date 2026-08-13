-- Media for the pregnancy file: ultrasound images and reports, lab results,
-- prescriptions, journal photos, appointment paperwork.
--
-- Files live in Storage; this table is the index over them. One row per file, so
-- a single ultrasound can carry both the scan image and the written report.

create table public.attachments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  -- What this file hangs off. Not a foreign key: the three owner tables are
  -- separate, and a polymorphic FK would need a trigger per table to enforce.
  -- Deletion is handled explicitly by the app, and orphans are invisible.
  owner_type  text not null check (owner_type in ('record', 'journal', 'appointment')),
  owner_id    uuid not null,
  -- Path inside the `pregnancy-media` bucket. Always `<user_id>/...`, which is
  -- what the storage policies below key off.
  path        text not null unique,
  mime_type   text not null default '',
  kind        text not null default 'document' check (kind in ('photo', 'document')),
  caption     text not null default '',
  size_bytes  bigint,
  created_at  timestamptz not null default now()
);

comment on table public.attachments is 'Index over files in the pregnancy-media bucket; one row per uploaded file.';

create index attachments_owner_idx on public.attachments (user_id, owner_type, owner_id);

alter table public.attachments enable row level security;

create policy "attachments are self-service"
  on public.attachments for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ------------------------------------------------------------------ bucket ---
-- Private: ultrasound images and lab results are among the most sensitive
-- things this app touches, so nothing is served without a signed URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pregnancy-media',
  'pregnancy-media',
  false,
  20971520, -- 20 MB
  array[
    'image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp',
    'application/pdf'
  ]
)
on conflict (id) do nothing;

-- Objects are namespaced by user id, and each user may only touch their own
-- folder. `storage.foldername(name)` splits the object path on '/'.
create policy "own media read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'pregnancy-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "own media insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pregnancy-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "own media update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'pregnancy-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "own media delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'pregnancy-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
