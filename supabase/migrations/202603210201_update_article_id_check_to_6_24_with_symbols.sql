alter table public.posts
  drop constraint if exists posts_article_id_check;

alter table public.posts
  add constraint posts_article_id_check
  check (article_id ~ '^[A-Za-z0-9_-]{6,24}$');
