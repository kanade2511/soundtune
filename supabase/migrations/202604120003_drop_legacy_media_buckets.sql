-- Drop legacy media buckets after migrating to Articles/Users.

-- Remove old policies first (safe when already absent).
drop policy if exists "avatars: public read" on storage.objects;
drop policy if exists "avatars: auth insert own folder" on storage.objects;
drop policy if exists "avatars: auth update own folder" on storage.objects;
drop policy if exists "avatars: auth delete own folder" on storage.objects;

drop policy if exists "thumbnails: public read" on storage.objects;
drop policy if exists "thumbnails: auth insert article folder" on storage.objects;
drop policy if exists "thumbnails: auth insert own folder" on storage.objects;
drop policy if exists "thumbnails: auth update article folder" on storage.objects;
drop policy if exists "thumbnails: auth update own folder" on storage.objects;
drop policy if exists "thumbnails: auth delete article folder" on storage.objects;
drop policy if exists "thumbnails: auth delete own folder" on storage.objects;

-- Delete legacy objects and buckets if they still exist.
delete from storage.objects where bucket_id in ('avatars', 'thumbnails');
delete from storage.buckets where id in ('avatars', 'thumbnails');
