-- Create public bucket for post thumbnails and policies for articleId-based paths.

insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do update set public = excluded.public;

-- Public read for thumbnail objects.
drop policy if exists "thumbnails: public read" on storage.objects;
create policy "thumbnails: public read"
  on storage.objects for select
  using (bucket_id = 'thumbnails');

-- Allow authenticated users to upload into thumbnails/<article_id>/... path.
drop policy if exists "thumbnails: auth insert article folder" on storage.objects;
drop policy if exists "thumbnails: auth insert own folder" on storage.objects;
create policy "thumbnails: auth insert article folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] ~ '^[A-Za-z0-9_-]{14}$'
  );

-- Allow authenticated users to update objects in thumbnails/<article_id>/... path.
drop policy if exists "thumbnails: auth update article folder" on storage.objects;
drop policy if exists "thumbnails: auth update own folder" on storage.objects;
create policy "thumbnails: auth update article folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] ~ '^[A-Za-z0-9_-]{14}$'
  )
  with check (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] ~ '^[A-Za-z0-9_-]{14}$'
  );

-- Allow authenticated users to delete objects in thumbnails/<article_id>/... path.
drop policy if exists "thumbnails: auth delete article folder" on storage.objects;
drop policy if exists "thumbnails: auth delete own folder" on storage.objects;
create policy "thumbnails: auth delete article folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] ~ '^[A-Za-z0-9_-]{14}$'
  );
