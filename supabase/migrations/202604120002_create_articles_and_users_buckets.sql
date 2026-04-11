-- Create media buckets for article assets and user avatars.

insert into storage.buckets (id, name, public)
values ('Articles', 'Articles', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('Users', 'Users', true)
on conflict (id) do update set public = excluded.public;

-- Public read for article media and user avatars.
drop policy if exists "Articles: public read" on storage.objects;
create policy "Articles: public read"
  on storage.objects for select
  using (bucket_id = 'Articles');

drop policy if exists "Users: public read" on storage.objects;
create policy "Users: public read"
  on storage.objects for select
  using (bucket_id = 'Users');

-- Articles bucket write rules (articleId-scoped path).
drop policy if exists "Articles: auth insert article folder" on storage.objects;
create policy "Articles: auth insert article folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'Articles'
    and (storage.foldername(name))[1] ~ '^[A-Za-z0-9_-]{14}$'
  );

drop policy if exists "Articles: auth update article folder" on storage.objects;
create policy "Articles: auth update article folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'Articles'
    and (storage.foldername(name))[1] ~ '^[A-Za-z0-9_-]{14}$'
  )
  with check (
    bucket_id = 'Articles'
    and (storage.foldername(name))[1] ~ '^[A-Za-z0-9_-]{14}$'
  );

drop policy if exists "Articles: auth delete article folder" on storage.objects;
create policy "Articles: auth delete article folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'Articles'
    and (storage.foldername(name))[1] ~ '^[A-Za-z0-9_-]{14}$'
  );

-- Users bucket write rules (own userId-scoped path only).
drop policy if exists "Users: auth insert own folder" on storage.objects;
create policy "Users: auth insert own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'Users'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users: auth update own folder" on storage.objects;
create policy "Users: auth update own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'Users'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'Users'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users: auth delete own folder" on storage.objects;
create policy "Users: auth delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'Users'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
